# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

This is a pnpm workspace monorepo for React Native ADK Chat - a package that provides pre-built components and API clients for building mobile chat interfaces that connect to Google's Agent Development Kit (ADK) agents.

**Key Packages:**
- `packages/client/` - React Native components (MessageBubble, ChatInput) and API clients (ProxyClient)
- `packages/server-cloudrun/` - Express proxy server for Cloud Run deployed agents (uses gcloud CLI for auth)
- `packages/server-agentengine/` - Express proxy server for Vertex AI Agent Engine (uses google-auth-library)
- `packages/create-adk-chat-app/` - CLI scaffolding tool for generating new chat apps
- `example/demo-app/` - Expo-based demo application

## Development Commands

### Running Demo Apps

The monorepo uses `concurrently` to automatically start both proxy server and demo app together:

**Cloud Run Demo:**
```bash
export CLOUD_RUN_URL="https://your-agent-xyz.run.app"
export DEFAULT_APP_NAME="your-app-name"  # Optional
pnpm demo:cloudrun
```

**Agent Engine Demo:**
```bash
export AGENT_ENGINE_URL="https://region-project-agent.a.run.app"
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"
pnpm demo:agentengine
```

These scripts start both the proxy (on port 3000) and the demo app simultaneously with color-coded logs.

### Running Individual Components

**Proxy servers only:**
```bash
pnpm server:cloudrun        # Dev mode with --watch
pnpm server:cloudrun:start  # Production mode
pnpm server:agentengine     # Dev mode with --watch
pnpm server:agentengine:start  # Production mode
```

**Client package development:**
```bash
pnpm client  # Type checking with --watch
```

**Demo app only (requires proxy running separately):**
```bash
pnpm demo
# OR directly:
pnpm --filter @react-native-adk-chat/demo-app start
```

### Testing and Verification

**Health check:**
```bash
curl http://localhost:3000/health
```

**Session creation:**
```bash
curl -X POST http://localhost:3000/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user"}'
```

**Chat streaming:**
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user", "session_id": "session-id", "message": "Hello!"}'
```

### Package Management

**Add dependency to specific package:**
```bash
pnpm --filter @react-native-adk-chat/client add <package-name>
pnpm --filter @react-native-adk-chat/server-cloudrun add <package-name>
pnpm --filter @react-native-adk-chat/demo-app add <package-name>
```

**Clean everything:**
```bash
pnpm clean
pnpm install
```

## Architecture Overview

### Two-Proxy System

The package supports two deployment models:

1. **Cloud Run** (`server-cloudrun`):
   - For agents deployed as standard Cloud Run services (REST API)
   - Authentication via `gcloud auth print-access-token` (CLI-based, cached for 55 minutes)
   - Endpoints: `/apps`, `/sessions/*`, `/chat`, `/chat/sync`
   - Streaming uses `/run_sse` endpoint

2. **Agent Engine** (`server-agentengine`):
   - For agents deployed directly to Vertex AI Agent Engine
   - Authentication via google-auth-library with service account JSON key
   - Endpoints: `/sessions/*`, `/chat`
   - Streaming uses `:streamQuery` method

**Why proxies are needed:**
- Security: Mobile apps cannot safely store Google Cloud Service Account keys
- CORS: Essential for web development, as browsers block direct requests
- Token refresh: Proxies handle OAuth token lifecycle

### Request Flow

```
Mobile App (ProxyClient)
    ↓ HTTP/HTTPS to localhost:3000 (dev) or deployed proxy (prod)
Proxy Server (Express)
    ↓ Authenticated requests with Bearer token
Cloud Run Service / Agent Engine
    ↓ Server-Sent Events (SSE) streaming
Proxy Server
    ↓ Forwarded SSE stream
Mobile App (React Native components render streamed text)
```

### Client Components

The `packages/client` package exports:
- **Components**: `MessageBubble`, `ChatInput`, `ButtonGroup`, `ToolResponseDebugScreen`
- **API Clients**: `ProxyClient`, `ADKClient`
- **Types**: `Message`, `ToolCall`, `ChatRequest`, `CreateSessionResponse`, etc.

Key client behavior:
- Uses `workspace:*` dependencies for hot reloading during development
- Peer dependencies: React, React Native, @expo/vector-icons
- TypeScript with type checking via `pnpm client`

## Streaming Implementation

### Cloud Run Proxy (`server-cloudrun`)

The Cloud Run proxy handles complex streaming logic:

1. **Partial vs Final Events**: Cloud Run sends:
   - Partial events (`partial: true`) with delta text (new text only)
   - Final event (no partial flag) with full accumulated text
   - Proxy forwards only partial events to avoid duplication

2. **Tool Call Handling**: Tracks tool calls in a Map:
   - `functionCall`: Creates tool call with `status: 'calling'`
   - `functionResponse`: Updates to `status: 'complete'` with response data
   - Sends separate SSE events for each tool call state change

3. **Error Handling**: Detects upstream errors in invalid JSON (e.g., 429s) and sends error events to client

4. **Buffer Management**: Uses `sseBuffer` to handle incomplete SSE messages that span chunks

### Agent Engine Proxy (`server-agentengine`)

Simpler streaming - directly forwards SSE stream from Agent Engine's `:streamQuery` endpoint.

## Environment Variables

**Cloud Run Proxy:**
- `CLOUD_RUN_URL` (required) - Full URL of Cloud Run service
- `DEFAULT_APP_NAME` (optional) - Default app name to target
- `PORT` (default: 3000) - Server port
- `DEBUG` (default: false) - Enable debug logging
- `ENABLE_AI_SUGGESTIONS` (default: false) - Enable AI-powered suggestion generation
- `USE_VERTEX_AI` (default: false) - Use Vertex AI instead of Google AI for suggestions
- `GEMINI_API_KEY` (required if AI suggestions with Google AI) - Google AI API key
- `GOOGLE_CLOUD_PROJECT` (required if AI suggestions with Vertex AI) - GCP project ID
- `GOOGLE_CLOUD_LOCATION` (default: us-central1) - GCP location for Vertex AI

**Agent Engine Proxy:**
- `AGENT_ENGINE_URL` (required) - URL of Agent Engine (legacy var: `REASONING_ENGINE_URL`)
- `GOOGLE_APPLICATION_CREDENTIALS` (required) - Absolute path to service account key JSON
- `PORT` (default: 3000) - Server port
- `ENABLE_AI_SUGGESTIONS` (default: false) - Enable AI-powered suggestion generation
- `USE_VERTEX_AI` (default: false) - Use Vertex AI instead of Google AI for suggestions
- `GEMINI_API_KEY` (required if AI suggestions with Google AI) - Google AI API key
- `GOOGLE_CLOUD_PROJECT` (required if AI suggestions with Vertex AI) - GCP project ID
- `GOOGLE_CLOUD_LOCATION` (default: us-central1) - GCP location for Vertex AI

**Demo App:**
- `EXPO_PUBLIC_PROXY_BASE_URL` (default: http://localhost:3000) - Proxy URL

## Common Development Workflows

### Working on Components

1. Make changes to `packages/client/src/components/`
2. Run `pnpm demo:cloudrun` or `pnpm demo:agentengine`
3. Hot reload reflects changes immediately
4. Test in web (`w`), iOS (`i`), or Android (`a`)

### Working on Proxy Logic

1. Edit `packages/server-*/src/index.js`
2. Restart demo script (Ctrl+C, re-run `pnpm demo:*`)
3. Test with curl commands or demo app
4. Check color-coded logs for debugging

### Testing CLI Tool

```bash
cd packages/create-adk-chat-app
pnpm link --global
create-adk-chat-app my-test-app
cd my-test-app
npm install
npm start
```

## Port Configuration

Default: All services use port 3000

**Change proxy port:**
```bash
PORT=4000 pnpm server:cloudrun
```

**Change in demo (must update both):**
```bash
PORT=4000 pnpm server:cloudrun &
EXPO_PUBLIC_PROXY_BASE_URL=http://localhost:4000 pnpm demo
```

## Important Implementation Details

### Session ID Generation

Cloud Run proxy auto-generates session IDs if not provided:
```javascript
function generateSessionId() {
  return `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

### Response Normalization

Both proxies normalize responses to match Agent Engine format for client compatibility:
```javascript
{
  output: {
    id: data.id,
    session_id: data.id,
    user_id: data.userId,
    // ...
  }
}
```

### Token Caching (Cloud Run Only)

Tokens are cached for 55 minutes with 60-second buffer:
```javascript
let tokenCache = {
  token: null,
  expiresAt: 0  // Refreshed when expiresAt < now + 60000
};
```

## AI-Powered Suggestion Generation

The proxy servers now support AI-powered suggestion generation using Gemini 1.5 Flash. When enabled:

**How It Works:**
1. Monitors agent responses for diagnostic questions (text ending with "?")
2. Uses Gemini function calling to generate structured suggestion options
3. Automatically extracts citations from recent tool call results
4. Returns suggestions as SSE events to the client

**Configuration:**

*Option 1: Google AI (API Key - Recommended for Development)*
```bash
export ENABLE_AI_SUGGESTIONS=true
export GEMINI_API_KEY="your-api-key-here"  # Get from https://aistudio.google.com/app/apikey
```

*Option 2: Vertex AI (ADC - Recommended for Production)*
```bash
export ENABLE_AI_SUGGESTIONS=true
export USE_VERTEX_AI=true
export GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"  # Optional, defaults to us-central1

# Ensure Application Default Credentials are configured:
gcloud auth application-default login
# OR set service account key:
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

**CLI Setup:**
When using `create-adk-chat-app`, you'll be prompted:
- "Enable AI-powered suggestion generation?"
- If yes, you'll be asked for your Gemini API key

**Suggestion Event Format (SSE):**
```json
{
  "id": "suggestions-1234567890",
  "type": "suggestions",
  "role": "system",
  "content": {
    "suggestions": [
      {
        "text": "Equipment is in maintenance mode",
        "value": "maintenance mode",
        "confidence": "high",
        "source": {
          "tool": "get_equipment_state",
          "field": "state"
        }
      }
    ],
    "reasoning": "Based on equipment diagnostics showing state='maintenance'",
    "questionType": "state"
  },
  "timestamp": "2025-12-29T..."
}
```

**Features:**
- Source attribution: Suggestions include citations to specific tool calls and response fields
- Question type detection: Identifies yes/no, choice, numeric, state, or open-ended questions
- Context-aware: Uses conversation history and tool results to generate relevant suggestions
- Confidence scoring: Each suggestion includes high/medium/low confidence level
- Non-blocking: If suggestion generation fails, streaming continues normally

## Known Patterns

- Demo scripts use environment variables (NOT .env files) - export them in the shell before running
- Logs from `concurrently` are prefixed: `[PROXY]` (blue) and `[DEMO_APP]` (magenta)
- The client package uses TypeScript but has no build step (exports raw .ts files)
- Proxy servers are plain Node.js/Express (no transpilation needed)
- All streaming endpoints use Server-Sent Events (SSE), not WebSockets
- AI suggestions use Gemini 1.5 Flash with structured JSON output mode for consistent formatting

## Troubleshooting

**"Cannot find module" errors:**
```bash
pnpm install
```

**Proxy connection refused:**
```bash
# Check proxy is running
curl http://localhost:3000/health
# Check port availability
lsof -i :3000
```

**Changes not reflecting:**
- Client: Should hot reload automatically
- Proxy: Restart demo script
- Deep changes: Clear Metro cache with `pnpm --filter @react-native-adk-chat/demo-app start --clear`

**Port already in use:**
```bash
lsof -ti:3000 | xargs kill -9
```
