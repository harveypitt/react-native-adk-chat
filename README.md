# React Native ADK Chat

A clean, production-ready React Native package for building chat interfaces that connect to Google's Agent Development Kit (ADK) agents deployed on Agent Engine.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.76-blue.svg)
![Expo](https://img.shields.io/badge/Expo-52.0-blue.svg)

---

**📚 Documentation:**
- **[Quick Start Guide](./QUICKSTART.md)** - Visual step-by-step for getting started (5 min)
- **[Development Guide](./DEVELOPMENT.md)** - For monorepo contributors and package developers
- **[API Reference](#api-reference)** - Component and client API documentation (below)

---

## What is this?

This package provides pre-built React Native components and API clients to quickly add AI chat capabilities to your mobile app. It handles:

- ✅ **Streaming responses** - Real-time character-by-character AI responses
- ✅ **Session management** - Automatic conversation tracking
- ✅ **Authentication** - Secure Google Cloud OAuth token handling via proxy
- ✅ **Beautiful UI** - Clean, customizable chat components
- ✅ **TypeScript** - Full type safety
- ✅ **Cross-platform** - iOS, Android, and web

**Perfect for:** Developers who have deployed an ADK agent to **Google Cloud Run** or **Agent Engine** and want to build a mobile chat interface.

## Architecture

This package supports two deployment models. Choose the one that matches your agent backend.

### 1. Cloud Run (Recommended)
For agents deployed as a standard Cloud Run service (REST API).

```
┌─────────────────┐
│  Mobile App     │  ← Your React Native app
│  (This Package) │     Uses: MessageBubble, ChatInput, ProxyClient
└────────┬────────┘
         │ HTTP/HTTPS
         │
┌────────▼────────┐
│  Proxy Server   │  ← packages/server-cloudrun
│  (Node.js)      │     Handles CORS & Auth headers
└────────┬────────┘
         │ Authenticated requests
         │
┌────────▼────────┐
│   Cloud Run     │  ← Your Agent Service
│    Service      │     Exposes standard ADK endpoints
└─────────────────┘
```

### 2. Agent Engine
For agents deployed directly to Vertex AI Agent Engine.

```
┌─────────────────┐
│  Mobile App     │
└────────┬────────┘
         │
┌────────▼────────┐
│  Proxy Server   │  ← packages/server-agentengine
│  (Node.js)      │     Handles Service Account Auth
└────────┬────────┘
         │
┌────────▼────────┐
│  Agent Engine   │  ← Vertex AI Resource
│ (Google Cloud)  │
└─────────────────┘
```

**Why the proxy?**
1.  **Security**: Mobile apps cannot safely store Google Cloud Service Account keys.
2.  **CORS**: Essential for Web development, as browsers block direct requests to Cloud Run/Agent Engine.

## Prerequisites

Before starting, you need:

1. **An ADK agent deployed to Agent Engine**
   - Follow the [official deployment guide](https://google.github.io/adk-docs/deploy/agent-engine/)
   - Note your Agent Engine URL (e.g., `https://project-region-agent-engine.a.run.app`)
   - Note your app name from ADK configuration

2. **Google Cloud service account** with Agent Engine access:
   ```bash
   # Create service account
   gcloud iam service-accounts create adk-chat-mobile \
     --display-name="ADK Chat Mobile"
   
   # Grant permissions
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:adk-chat-mobile@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   
   # Create key
   gcloud iam service-accounts keys create ./service-account-key.json \
     --iam-account=adk-chat-mobile@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

3. **Development environment**:
   - Node.js 18+
   - Git
   - iOS Simulator, Android Emulator, or Expo Go app

## Quick Start

Choose your path based on what you want to do:

### 🚀 For New Projects (Recommended)

**Use the CLI to scaffold a complete React Native app with proxy bundled:**

1. **Create your app:**
   ```bash
   # Recommended: Direct from GitHub (always pulls latest)
   npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app my-chat-app

   # Or install globally
   npm install -g github:harveypitt/react-native-adk-chat#main:packages/create-adk-chat-app
   create-adk-chat-app my-chat-app
   ```

2. **Configure during setup:**
   - Choose **Cloud Run Proxy** (recommended) or **Agent Engine Proxy**
   - Select **Local Proxy (localhost:3000)** for development
   - Enter your Cloud Run URL (e.g., `https://your-agent-xyz.run.app`)

3. **Start everything:**
   ```bash
   cd my-chat-app
   npm install
   npm start  # Launches proxy + app together
   ```

4. **Test:**
   - Press `w` (web), `i` (iOS), or `a` (Android)
   - Send a message to verify the connection

**What you get:** A ready-to-run app with proxy server, all dependencies installed, and environment configured.

---

### 🔧 For Monorepo Development

**Working on this package or running the demo apps:**

#### Option 1: Cloud Run Demo

1. **Set up environment variables** (copy `.env.example` files):
   ```bash
   # From monorepo root
   export CLOUD_RUN_URL="https://your-agent-xyz.run.app"
   export DEFAULT_APP_NAME="your-app-name"  # Optional
   ```

2. **Run the demo:**
   ```bash
   pnpm demo:cloudrun
   ```
   
   This single command uses `concurrently` to automatically:
   - Start `server-cloudrun` proxy on `http://localhost:3000`
   - Start the demo app configured to use that proxy
   - Show color-coded logs for both services

3. **Test:** Press `w`, `i`, or `a` in the terminal

#### Option 2: Agent Engine Demo

1. **Set up environment variables:**
   ```bash
   # From monorepo root
   export AGENT_ENGINE_URL="https://region-project-agent.a.run.app"
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
   ```

2. **Run the demo:**
   ```bash
   pnpm demo:agentengine
   ```

3. **Test:** Press `w`, `i`, or `a` in the terminal

**Note:** Both demo scripts are self-contained. You don't need to manually start proxy servers - `concurrently` handles everything.

---

### Updating an Existing CLI App

**Pull latest code changes (recommended after repo updates):**

```bash
cd my-chat-app

# Update bundled server & client code from GitHub
npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app --update
```

**What this does:**
- Fetches latest CLI from GitHub
- Updates bundled proxy server with latest CORS fixes, bug fixes, etc.
- Updates client package with latest components
- **Does NOT change your .env settings**

---

**Reconfigure settings (change proxy URL, app name, etc.):**

```bash
cd my-chat-app

# Reconfigure your proxy settings
npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app --reconfigure
```

**What this does:**
- Prompts you to change proxy URL, backend type, app name
- Updates your `.env` file
- Updates configuration files
- **Does NOT update bundled code**

---

**Do both at once:**

```bash
cd my-chat-app

# Update code AND reconfigure
npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app --update --reconfigure
```

## Quick Command Reference

### New Projects (CLI)
```bash
# Create new app from GitHub (pulls latest automatically)
npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app my-chat-app

# Start everything (proxy + app)
cd my-chat-app && npm install && npm start

# Update code only (pulls latest server/client from GitHub)
npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app --update

# Reconfigure settings (change proxy URL, app name)
npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app --reconfigure

# Both
npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app --update --reconfigure
```

### Monorepo Development
```bash
# Cloud Run demo (starts proxy on :3000 + demo app)
export CLOUD_RUN_URL="https://your-agent-xyz.run.app"
export DEFAULT_APP_NAME="your-app-name"
pnpm demo:cloudrun

# Agent Engine demo (starts proxy on :3000 + demo app)
export AGENT_ENGINE_URL="https://region-project-agent.a.run.app"
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
pnpm demo:agentengine

# Manual proxy startup (if needed)
pnpm server:cloudrun        # Dev mode with watch
pnpm server:cloudrun:start  # Production mode
pnpm server:agentengine     # Dev mode with watch
pnpm server:agentengine:start  # Production mode
```

**Key Points:**
- All proxies default to `http://localhost:3000`
- `demo:*` scripts use `concurrently` to start proxy + app automatically
- No need to manually start proxy servers when using demo scripts
- Environment variables are passed through from your shell

---

## Using in Your Own React Native App

### Installation

Install the client package in your React Native project:

```bash
# Install from GitHub
npm install github:harveypitt/react-native-adk-chat#main:packages/client

# Or with full URL syntax
npm install git+https://github.com/harveypitt/react-native-adk-chat.git#main:packages/client

# Install peer dependencies
npm install @expo/vector-icons react-native-safe-area-context react-native-gesture-handler react-native-screens @react-navigation/native @react-navigation/stack
```

**Note:** The package is not yet published to npm. Install directly from GitHub using the commands above.

### Basic Implementation

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import {
  MessageBubble,
  ChatInput,
  ProxyClient,
  type Message,
} from '@react-native-adk-chat/client';

// Configure your proxy URL
const PROXY_URL = __DEV__ 
  ? 'http://localhost:3000'           // Development
  : 'https://your-proxy.run.app';    // Production

export default function ChatScreen({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const proxyClient = useRef(new ProxyClient({ baseUrl: PROXY_URL })).current;

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await proxyClient.createSession(userId);
        setSessionId(response.output.id);
      } catch (error) {
        console.error('Session creation failed:', error);
      }
    };
    initSession();
  }, [userId]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add placeholder for AI response
    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }]);

    try {
      let accumulatedText = '';
      
      // Send message with streaming
      await proxyClient.sendMessage(
        {
          user_id: userId,
          session_id: sessionId,
          message: userMessage.content,
        },
        (chunk: string) => {
          // Update as chunks arrive
          accumulatedText += chunk;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, content: accumulatedText, isLoading: false }
                : msg
            )
          );
        }
      );
      
      setIsLoading(false);
    } catch (error) {
      console.error('Send failed:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: 'Error: Failed to get response', isLoading: false }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
      />
      
      <ChatInput
        value={input}
        onChangeText={setInput}
        onSend={handleSend}
        disabled={isLoading || !sessionId}
        placeholder="Type a message..."
      />
    </KeyboardAvoidingView>
  );
}
```

## API Reference

### ProxyClient

```typescript
import { ProxyClient } from '@react-native-adk-chat/client';

const client = new ProxyClient({ baseUrl: 'http://localhost:3000' });
```

#### Methods

**`checkHealth(): Promise<boolean>`**

Check if proxy server is accessible.

```typescript
const healthy = await client.checkHealth();
```

**`createSession(userId: string): Promise<CreateSessionResponse>`**

Create a new chat session.

```typescript
const response = await client.createSession('user_123');
const sessionId = response.output.id;  // "s_1234567890_abc"
```

**`sendMessage(request: ChatRequest, onChunk?: Function, onToolCall?: Function): Promise<void>`**

Send a message with streaming response.

```typescript
await client.sendMessage(
  {
    user_id: 'user_123',
    session_id: 'session_xyz',
    message: 'Hello!',
  },
  (chunk: string) => {
    // Called for each text chunk
    console.log('Received:', chunk);
  },
  (toolName: string, status: 'calling' | 'complete', args?: any) => {
    // Called when agent uses tools (optional)
    console.log('Tool:', toolName, status);
  }
);
```

**`listSessions(userId: string): Promise<ListSessionsResponse>`**

Get all sessions for a user.

```typescript
const response = await client.listSessions('user_123');
console.log(response.sessions);
```

### Components

#### MessageBubble

Displays a chat message with appropriate styling.

```typescript
import { MessageBubble, type Message } from '@react-native-adk-chat/client';

const message: Message = {
  id: '123',
  role: 'user',              // 'user' | 'assistant'
  content: 'Hello!',
  timestamp: new Date(),
  isLoading?: boolean,       // Show loading indicator
  toolCalls?: ToolCall[],    // Display tool usage
};

<MessageBubble 
  message={message}
  // Optional custom styles
  userBubbleStyle={{ backgroundColor: '#007AFF' }}
  userTextStyle={{ color: '#FFF' }}
  aiBubbleStyle={{ backgroundColor: '#F0F0F0' }}
  aiTextStyle={{ color: '#000' }}
/>
```

#### ChatInput

Text input with send button.

```typescript
import { ChatInput } from '@react-native-adk-chat/client';

<ChatInput
  value={input}
  onChangeText={setInput}
  onSend={handleSend}
  disabled={isLoading}
  placeholder="Type a message..."
  // Optional custom styles
  containerStyle={{ borderTopWidth: 1 }}
  inputStyle={{ fontSize: 16 }}
  sendButtonStyle={{ backgroundColor: '#007AFF' }}
/>
```

## Deploying to Production

### Deploy Proxy Server

The proxy must be deployed to a publicly accessible server.

**Google Cloud Run (Recommended):**

```bash
cd packages/server

gcloud run deploy adk-chat-proxy \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars AGENT_ENGINE_URL=https://your-agent-engine-url.a.run.app,APP_NAME=your-app-name \
  --project YOUR_PROJECT_ID

# Get the deployed URL
gcloud run services describe adk-chat-proxy --region us-central1 --format="value(status.url)"
```

**Other options:**
- AWS Lambda + API Gateway
- Azure App Service
- Heroku
- DigitalOcean App Platform
- Any Node.js hosting

### Update Mobile App

Configure production proxy URL:

```typescript
const PROXY_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://adk-chat-proxy-abc123.run.app';  // Your deployed URL
```

### Build Mobile App

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Troubleshooting

### Demo Script Issues

#### Demo won't start / "Command not found"

**Symptoms:** `pnpm demo:cloudrun` or `pnpm demo:agentengine` fails immediately

**Solutions:**
1. Ensure you're in the monorepo root directory
2. Run `pnpm install` to ensure all dependencies (including `concurrently`) are installed
3. Check pnpm is installed: `pnpm --version`
4. Verify environment variables are exported in your current shell

#### Proxy starts but demo app fails

**Symptoms:** See `[PROXY]` logs but `[DEMO_APP]` errors or doesn't start

**Solutions:**
1. Check Expo is installed: `cd example/demo-app && pnpm list expo`
2. Clear Expo cache: `cd example/demo-app && rm -rf .expo node_modules && pnpm install`
3. Check port 19000-19001 are available (used by Metro bundler)
4. Try starting demo app separately: `pnpm --filter @react-native-adk-chat/demo-app start`

#### "Address already in use" (EADDRINUSE)

**Symptoms:** Error about port 3000 being in use

**Solutions:**
1. Find and kill the process: `lsof -ti:3000 | xargs kill -9`
2. Or use a different port: `PORT=4000 pnpm demo:cloudrun` (note: won't work without updating demo app config)
3. Check if you have another proxy/server running

#### Environment variables not working

**Symptoms:** Proxy starts but fails to connect to Cloud Run/Agent Engine

**Solutions:**
1. Export variables in the same shell before running demo: 
   ```bash
   export CLOUD_RUN_URL="https://your-url.run.app"
   pnpm demo:cloudrun
   ```
2. Check variables are set: `echo $CLOUD_RUN_URL`
3. Don't use `.env` files - demo scripts expect shell environment variables
4. For persistent config, add exports to `~/.zshrc` or `~/.bashrc`

#### Logs are confusing / too verbose

**Symptoms:** Hard to read combined proxy + app logs

**Solutions:**
1. Run components separately:
   ```bash
   # Terminal 1
   pnpm server:cloudrun
   
   # Terminal 2
   cd example/demo-app && pnpm start
   ```
2. The `[PROXY]` prefix is blue, `[DEMO_APP]` is magenta in color terminals

---

### "Cannot connect to proxy server"

**Symptoms:** Red dot, "Network request failed"

**Solutions:**
1. Check proxy is running: `curl http://localhost:3000/health`
2. For physical devices, use computer's IP (not `localhost`):
   ```bash
   # Find your IP
   ipconfig getifaddr en0  # macOS
   ipconfig               # Windows

   # Update App.tsx
   const PROXY_BASE_URL = "http://192.168.1.100:3000";
   ```
3. Ensure phone and computer on same WiFi network
4. Check firewall allows connections on port 3000

### CORS Error: "Missing Access-Control-Allow-Origin header"

**Symptoms:** Browser console shows CORS error, preflight request blocked

**Solutions:**
1. **Ensure proxy server is running** - CORS errors often mean the proxy isn't started:
   ```bash
   # Check if proxy is running
   curl http://localhost:3000/health

   # If not running, start it
   pnpm server:cloudrun
   # or
   pnpm server:agentengine
   ```

2. **Restart the proxy server** - Updated CORS configuration requires restart:
   ```bash
   # Stop current proxy (Ctrl+C)
   # Start fresh
   pnpm server:cloudrun
   ```

3. **For web development** - Make sure you're using the proxy:
   - The proxy handles CORS headers automatically
   - Direct calls to Cloud Run/Agent Engine from browser will fail
   - Always route through `http://localhost:3000`

4. **For deployed proxies** - Verify CORS is enabled:
   ```javascript
   // Both proxy servers now have explicit CORS configuration
   app.use(cors({
     origin: '*',
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization']
   }));
   ```

5. **Check browser console** for specific CORS details:
   - "Preflight request" error → Proxy not responding to OPTIONS
   - "No 'Access-Control-Allow-Origin'" → Proxy not running or misconfigured

### "Failed to create session"

**Symptoms:** Error on app start, no session ID

**Solutions:**
1. Verify `APP_NAME` matches Agent Engine exactly (case-sensitive)
2. Check Agent Engine is deployed and running
3. Test with curl:
   ```bash
   curl https://YOUR_AGENT_ENGINE_URL/list-apps \
     -H "Authorization: Bearer $(gcloud auth print-access-token)"
   ```
4. Review proxy server logs for specific error

### "Authentication failed" (403/401)

**Symptoms:** 403/401 errors in proxy server logs

**Solutions:**
1. Verify credentials file exists: `ls -l $GOOGLE_APPLICATION_CREDENTIALS`
2. Validate JSON: `cat $GOOGLE_APPLICATION_CREDENTIALS | jq .`
3. Check service account permissions:
   ```bash
   gcloud projects get-iam-policy YOUR_PROJECT_ID \
     --filter="bindings.members:YOUR_SERVICE_ACCOUNT"
   ```
4. Ensure service account has `roles/aiplatform.user`

### Messages don't stream

**Symptoms:** Entire response appears at once

**Solutions:**
- Try WiFi instead of mobile data (some carriers block streaming)
- Check proxy server logs for errors
- Verify Agent Engine supports streaming
- Test streaming with curl to isolate issue

### Common mistakes

- Using relative path for `GOOGLE_APPLICATION_CREDENTIALS` (must be absolute)
- Wrong `APP_NAME` (must match exactly)
- Using `localhost` on physical device (use IP address)
- Firewall blocking port 3000
- Service account lacks permissions

## Configuration Reference

### Proxy Server Environment Variables

#### Cloud Run Proxy (`server-cloudrun`)
For agents deployed as Cloud Run services.

| Variable | Description | Required |
|----------|-------------|----------|
| `CLOUD_RUN_URL` | Full URL of your Cloud Run service | Yes |
| `DEFAULT_APP_NAME` | Default App Name to target (e.g., `MBS`) | Yes |
| `PORT` | Server port | No (Default: 3000) |

#### Agent Engine Proxy (`server-agentengine`)
For agents deployed to Vertex AI Agent Engine.

| Variable | Description | Required |
|----------|-------------|----------|
| `AGENT_ENGINE_URL` | URL of your Agent Engine | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key | Yes |
| `PORT` | Server port | No (Default: 3000) |

### Legacy Environment Variables

Create `packages/server/.env`:

```env
# Required
AGENT_ENGINE_URL=https://your-project-region-agent-engine.a.run.app
APP_NAME=your-app-name
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account-key.json

# Optional
PORT=3000
DEBUG=true
```

### Mobile App Configuration

When using the CLI-generated app, these are set in your `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `PROXY_BASE_URL` | URL of the proxy or backend | `http://localhost:3000` |
| `PROXY_API_MODE` | `proxy` (Standard) or `direct` (Cloud Run Direct) | `proxy` |
| `PROXY_DEFAULT_APP_NAME` | App Name (Required for `direct` mode) | - |

### Code Configuration

Edit `example/demo-app/App.tsx` or your app:

```typescript
// Proxy URL
const PROXY_BASE_URL = process.env.PROXY_BASE_URL || "http://localhost:3000";

// User ID (replace with your auth system)
const DEFAULT_USER_ID = "user_123";
```

## Customization

### Styling

All components accept custom styles:

```typescript
<MessageBubble
  message={message}
  userBubbleStyle={{ 
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 12,
  }}
  userTextStyle={{ 
    color: '#FFFFFF',
    fontSize: 16,
  }}
/>

<ChatInput
  value={input}
  onChangeText={setInput}
  onSend={handleSend}
  containerStyle={{ 
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  }}
  inputStyle={{ 
    fontSize: 16,
    color: '#000',
  }}
  sendButtonStyle={{ 
    backgroundColor: '#007AFF',
    borderRadius: 20,
  }}
/>
```

### Adding Authentication

Replace the hardcoded user ID:

```typescript
import { useAuth } from 'your-auth-library';

function ChatScreen() {
  const { user } = useAuth();
  
  if (!user) {
    return <LoginScreen />;
  }
  
  return <ChatUI userId={user.id} />;
}
```

### Message Persistence

Save messages to device storage:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save messages
const saveMessages = async (sessionId: string, messages: Message[]) => {
  await AsyncStorage.setItem(
    `chat_${sessionId}`,
    JSON.stringify(messages)
  );
};

// Load messages
const loadMessages = async (sessionId: string): Promise<Message[]> => {
  const data = await AsyncStorage.getItem(`chat_${sessionId}`);
  return data ? JSON.parse(data) : [];
};
```

## Project Structure

```
react-native-adk-chat/
├── packages/
│   ├── client/                 # React Native package
│   │   ├── src/
│   │   │   ├── components/     # MessageBubble, ChatInput
│   │   │   ├── api/           # ProxyClient, types
│   │   │   └── index.ts       # Exports
│   │   └── package.json
│   │
│   └── server/                # Proxy server
│       ├── src/
│       │   └── index.js       # Express server
│       ├── .env.example
│       └── package.json
│
├── example/
│   └── demo-app/              # Demo application
│       ├── App.tsx
│       └── package.json
│
├── README.md                  # This file
└── package.json              # Root workspace
```

## Tech Stack

- **React Native** 0.76+ - Mobile framework
- **Expo** 52+ - Development tooling
- **TypeScript** - Type safety
- **Node.js** 18+ - Proxy server
- **Express** - Web framework for proxy
- **Google Auth Library** - OAuth token management

## Requirements

- Node.js 18+
- React Native 0.70+
- iOS 13+ / Android 6.0+
- Google Cloud Agent Engine deployment

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: This README
- **Issues**: [GitHub Issues](https://github.com/your-username/react-native-adk-chat/issues)
- **ADK Docs**: [google.github.io/adk-docs](https://google.github.io/adk-docs/)
- **Agent Engine**: [Deployment Guide](https://google.github.io/adk-docs/deploy/agent-engine/)

## Acknowledgments

Built for developers using [Google Agent Development Kit (ADK)](https://cloud.google.com/agent-builder) and Agent Engine. Designed to be production-ready and white-label friendly.

---

**Ready to start?** Follow the [Quick Start](#quick-start) guide above.

**Need help?** Check [Troubleshooting](#troubleshooting) or open an issue.