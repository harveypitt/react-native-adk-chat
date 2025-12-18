# React Native ADK Chat

A clean, production-ready React Native package for building chat interfaces that connect to Google's Agent Development Kit (ADK) agents deployed on Agent Engine.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.76-blue.svg)
![Expo](https://img.shields.io/badge/Expo-52.0-blue.svg)

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

### Step 1: Create a New App

The fastest way to get started is using our CLI tool. It creates a full React Native app with the proxy server bundled inside:

```bash
npx create-adk-chat-app my-chat-app
```

The CLI will ask for:
1.  **Project Name**: Directory for your new app.
2.  **Proxy Type**: Choose **Cloud Run Proxy** (Recommended).
3.  **Connection**: Select **Local Proxy (localhost:3000)** for best compatibility (especially for Web).
4.  **Cloud Run URL**: Your remote agent URL (e.g., `https://mbs-v2...run.app`).

### Step 2: Start the App

Navigate to your new app:

```bash
cd my-chat-app
npm install  # Installs app AND proxy dependencies
npm start
```

This command launches both the **App** (Expo) and the **Proxy Server** concurrently. You will see logs for both in the terminal:
- `[PROXY]` logs show communication with your Cloud Run agent.
- `[APP]` logs show Metro bundler output.

Press `w` for Web, `i` for iOS Simulator, or `a` for Android Emulator.

### Step 3: Test the Chat

1.  The app connects to `http://localhost:3000`.
2.  The bundled proxy forwards requests to your Cloud Run URL.
3.  Send a message like "Hello!" to verify the flow.

### Configuring an Existing App

If you need to change your Cloud Run URL or switch connection modes later:

```bash
# Inside your app directory
npx create-adk-chat-app --update
```

## Using in Your Own React Native App

### Installation

Install the client package in your React Native project:

```bash
# Option 1: From git repository (recommended)
npm install git+https://github.com/your-username/react-native-adk-chat.git#main:packages/client

# Option 2: From local clone (during development)
npm install /path/to/react-native-adk-chat/packages/client

# Install peer dependencies
npm install @expo/vector-icons react-native-safe-area-context
```

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