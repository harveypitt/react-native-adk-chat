# Quick Start Guide

## Choose Your Path

```
                    Want to use react-native-adk-chat?
                                  │
          ┌─────────────────────┬─┴───────┬──────────────────────┐
          │                     │         │                      │
          ▼                     ▼         ▼                      ▼
    Building a         Add to       Working on      Monorepo
    NEW app?          EXISTING      THIS           development?
                      app?          monorepo?
          │                     │         │                      │
          ▼                     ▼         ▼                      ▼
    ┌──────────┐        ┌──────────┐  ┌──────────┐
    │ CLI Tool │        │ npm      │  │ Run Demo │
    │          │        │ install  │  │ Apps     │
    │ npx      │        │ from     │  │          │
    │ create-  │        │ GitHub   │  │ pnpm     │
    │ adk-chat │        │          │  │ demo:*   │
    └──────────┘        └──────────┘  └──────────┘
       Path 1              Path 2         Path 3
```

---

## 🚀 Path 1: New Projects (5 minutes)

**Goal:** Create a standalone React Native app with chat functionality

### Step-by-Step

```
1. Create app using npx
   │
   ├─> Run CLI from GitHub (automatically pulls latest)
   │   npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app my-chat-app
   │
   ├─> Choose: Cloud Run Proxy (recommended)
   │
   ├─> Enter: https://your-agent-xyz.run.app
   │
   └─> Result: ✅ App scaffolded with proxy server
        
2. Install & Start
   │
   ├─> cd my-chat-app
   │
   ├─> npm install
   │
   └─> npm start  (starts proxy + app together)

3. Test
   │
   ├─> Press 'w' for web
   │
   └─> Send message: "Hello!"
```

### What You Get

```
my-chat-app/
├── proxy/                    # Bundled proxy server
│   ├── src/index.js         # Express server
│   └── .env                 # Your Cloud Run URL
├── app/                     # Your React Native app
│   └── (chat-screen).tsx
├── package.json            # Root package with scripts
└── README.md              # App-specific docs
```

### Key Commands

```bash
npm start              # Start proxy + app (concurrently)
npm run start:app      # App only (requires proxy running)
npm run start:proxy    # Proxy only

# Update code from GitHub (new features, CORS fixes, etc.)
npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app --update

# Change settings (proxy URL, app name, etc.)
npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app --reconfigure
```

---

## 📦 Path 2: Add to Existing App (3 minutes)

**Goal:** Add ADK chat to your existing React Native or Expo app

### Installation

```bash
# 1. Install the client package from GitHub
npm install github:harveypitt/react-native-adk-chat#main:packages/client

# Or with pnpm/yarn
pnpm add github:harveypitt/react-native-adk-chat#main:packages/client
yarn add github:harveypitt/react-native-adk-chat#main:packages/client

# 2. Install peer dependencies
npm install @expo/vector-icons react-native-safe-area-context \
  react-native-gesture-handler react-native-screens \
  @react-navigation/native @react-navigation/stack
```

### Basic Usage

```typescript
import {
  MessageBubble,
  ChatInput,
  ProxyClient,
  type Message,
  type ToolCall,
} from '@react-native-adk-chat/client';

// 1. Create client
const client = new ProxyClient({
  baseUrl: 'http://localhost:3000' // Your proxy URL
});

// 2. Create session
const response = await client.createSession('user_123');
const sessionId = response.output.id;

// 3. Send messages with streaming
await client.sendMessage(
  {
    user_id: 'user_123',
    session_id: sessionId,
    message: 'Hello!',
  },
  (chunk, invocationId, type, eventData) => {
    if (type === 'text') {
      // Handle text chunks
      console.log(chunk);
    } else if (type === 'functionCall') {
      // Handle tool calls
      console.log('Tool:', eventData.functionCall.name);
    }
  }
);
```

### Next Steps

- See [README.md](./README.md#using-in-your-own-react-native-app) for complete implementation example
- Set up a proxy server ([Cloud Run](./README.md#cloud-run-recommended) or [Agent Engine](./README.md#agent-engine))
- Customize UI components with your own styles

---

## 🔧 Path 3: Monorepo Development (2 minutes)

**Goal:** Test changes to this package or run demo apps

### Cloud Run Demo

```
┌────────────────────────────────────────────────┐
│ 1. Export environment variables                │
└────────────────────────────────────────────────┘
         │
         ▼
export CLOUD_RUN_URL="https://your-agent-xyz.run.app"
export DEFAULT_APP_NAME="your-app-name"

┌────────────────────────────────────────────────┐
│ 2. Run demo (single command)                   │
└────────────────────────────────────────────────┘
         │
         ▼
pnpm demo:cloudrun

┌────────────────────────────────────────────────┐
│ 3. What happens automatically:                 │
│                                                │
│  [PROXY] 🔵 server-cloudrun → localhost:3000   │
│  [DEMO_APP] 🟣 expo start                      │
│                                                │
│  Logs: Color-coded, real-time                  │
└────────────────────────────────────────────────┘
         │
         ▼
Press 'w', 'i', or 'a' to test
```

### Agent Engine Demo

```
export AGENT_ENGINE_URL="https://region-project.run.app"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"

pnpm demo:agentengine

Same flow as above ↑ but uses server-agentengine
```

### Architecture Flow

```
Your Terminal
     │
     │ pnpm demo:cloudrun
     │
     ▼
┌─────────────────────────────────────────┐
│  concurrently (orchestrator)            │
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ [PROXY] 🔵  │  │ [DEMO_APP]🟣│      │
│  │             │  │             │      │
│  │ Port: 3000  │◄─┤ Connects to │      │
│  │             │  │ :3000       │      │
│  └──────┬──────┘  └─────────────┘      │
│         │                               │
└─────────┼───────────────────────────────┘
          │
          │ HTTP to Cloud Run
          ▼
    Your ADK Agent
```

---

## Environment Variables Reference

### Cloud Run Setup

```bash
# Required
export CLOUD_RUN_URL="https://your-service-xyz.a.run.app"

# Optional
export DEFAULT_APP_NAME="YourAppName"
export PORT=3000  # Change proxy port (default: 3000)
```

### Agent Engine Setup

```bash
# Required
export AGENT_ENGINE_URL="https://us-central1-project.cloudfunctions.net/agent"
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"

# Optional
export PORT=3000
```

### Demo App Override

```bash
# If you need to point to a different proxy
export EXPO_PUBLIC_PROXY_BASE_URL="http://localhost:4000"
```

---

## Quick Verification Tests

### 1. Health Check

```bash
# Proxy should be running on :3000
curl http://localhost:3000/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "cloudRunUrl": "configured"  # or "engineUrl": "configured"
}
```

### 2. Session Creation

```bash
curl -X POST http://localhost:3000/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user-123"}'

# Expected response:
{
  "output": {
    "session_id": "sess_abc123...",
    "user_id": "test-user-123",
    ...
  }
}
```

### 3. Chat Test

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-123",
    "session_id": "sess_abc123...",
    "message": "Hello!"
  }'

# Expected: SSE stream with events
```

---

## Common Issues & Fixes

| Issue | Quick Fix |
|-------|-----------|
| "Command not found: pnpm" | `npm install -g pnpm` |
| "Port 3000 already in use" | `lsof -ti:3000 \| xargs kill -9` |
| "Cannot find module" | `pnpm install` from root |
| Env vars not working | Export in same terminal before running |
| Demo app won't start | `cd example/demo-app && rm -rf .expo && pnpm install` |
| Proxy connection refused | Check proxy is running: `curl localhost:3000/health` |
| CORS error in browser | Restart proxy server with updated CORS config |

---

## Script Comparison

| Scenario | CLI App (Path 1) | Existing App (Path 2) | Monorepo Demo (Path 3) |
|----------|------------------|----------------------|------------------------|
| **Command** | `npm start` | Your app's start command | `pnpm demo:cloudrun` |
| **Location** | Generated app dir | Your app directory | Monorepo root |
| **Proxy** | Bundled in `proxy/` | Separate deployment | From `packages/server-*` |
| **App** | Generated code | Your existing app | `example/demo-app` |
| **Package** | From GitHub | From GitHub | `workspace:*` |
| **Config** | `.env` file | Your config | Shell env variables |
| **Use Case** | New production app | Add to existing app | Testing/development |

---

## Next Steps

### After CLI Setup (Path 1)
- ✅ Customize UI in `app/(tabs)/(chat-screen).tsx`
- ✅ Add authentication (replace hardcoded user ID)
- ✅ Deploy proxy to your hosting platform
- ✅ Update `EXPO_PUBLIC_PROXY_BASE_URL` for production

### After Adding to Existing App (Path 2)
- ✅ Set up proxy server (see README for deployment guides)
- ✅ Integrate with your existing navigation
- ✅ Add authentication using your auth system
- ✅ Customize component styles to match your design

### After Monorepo Setup (Path 3)
- ✅ Edit components in `packages/client/src/components/`
- ✅ Test changes with demo app (hot reload enabled)
- ✅ Read [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed workflows
- ✅ Check [README.md](./README.md) for API reference

---

## Visual Port Configuration

```
                 Default Setup (All use :3000)
                 
    ┌──────────────────────────────────────────┐
    │  Mobile/Web App                          │
    │  EXPO_PUBLIC_PROXY_BASE_URL              │
    │  = http://localhost:3000                 │
    └───────────────┬──────────────────────────┘
                    │
                    │ HTTP Requests
                    ▼
    ┌──────────────────────────────────────────┐
    │  Proxy Server                            │
    │  PORT=3000 (env var)                     │
    │  - server-cloudrun                       │
    │  - server-agentengine                    │
    └───────────────┬──────────────────────────┘
                    │
                    │ Authenticated Requests
                    ▼
    ┌──────────────────────────────────────────┐
    │  Your ADK Agent                          │
    │  - Cloud Run Service                     │
    │  - Agent Engine                          │
    └──────────────────────────────────────────┘
```

**Change Ports:**

```bash
# Option 1: Change proxy only
PORT=4000 pnpm server:cloudrun

# Option 2: Change in demo (update both)
PORT=4000 pnpm server:cloudrun &
EXPO_PUBLIC_PROXY_BASE_URL=http://localhost:4000 pnpm demo
```

---

## Help & Resources

- **Detailed Guide:** [README.md](./README.md)
- **Development:** [DEVELOPMENT.md](./DEVELOPMENT.md)
- **API Reference:** [README.md#api-reference](./README.md#api-reference)
- **Issues:** GitHub Issues
- **Examples:** `example/demo-app/` in this repo

**Ready to build? Choose your path above! ⬆️**