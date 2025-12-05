# Integrating React Native ADK Chat with Your Agent Engine Deployment

This guide walks you through connecting your existing Google Cloud Agent Engine deployment to a React Native mobile app using the React Native ADK Chat package.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Step 1: Clone and Setup](#step-1-clone-and-setup)
- [Step 2: Configure Proxy Server](#step-2-configure-proxy-server)
- [Step 3: Run Demo App](#step-3-run-demo-app)
- [Step 4: Integrate into Your App](#step-4-integrate-into-your-app)
- [Step 5: Deploy to Production](#step-5-deploy-to-production)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

## Overview

This integration enables you to:
- ✅ Connect your React Native app to Agent Engine
- ✅ Stream AI responses in real-time
- ✅ Manage user sessions automatically
- ✅ Handle authentication securely
- ✅ Deploy to iOS, Android, and web

**Time to complete:** 30-60 minutes

## Prerequisites

Before starting, ensure you have:

### 1. Agent Engine Deployment

You should have already deployed your ADK agent to Agent Engine. If not, follow the [official deployment guide](https://google.github.io/adk-docs/deploy/agent-engine/).

You'll need:
- **Agent Engine URL**: `https://YOUR_PROJECT-YOUR_REGION-agent-engine.a.run.app`
- **App Name**: The name you configured in your ADK deployment (e.g., `my-agent`)
- **Project ID**: Your Google Cloud project ID

To verify your deployment:
```bash
# List your deployed apps
curl https://YOUR_PROJECT-YOUR_REGION-agent-engine.a.run.app/list-apps \
  -H "Authorization: Bearer $(gcloud auth print-access-token)"
```

### 2. Google Cloud Service Account

You need a service account with Agent Engine access:

```bash
# Create service account
gcloud iam service-accounts create adk-chat-mobile \
  --display-name="ADK Chat Mobile App" \
  --project=YOUR_PROJECT_ID

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:adk-chat-mobile@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Create and download key
gcloud iam service-accounts keys create ./service-account-key.json \
  --iam-account=adk-chat-mobile@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

Keep `service-account-key.json` secure - you'll need it in Step 2.

### 3. Development Environment

Install these tools:
- **Node.js 18+**: [Download here](https://nodejs.org/)
- **pnpm or npm**: `npm install -g pnpm` (optional)
- **Git**: [Download here](https://git-scm.com/)
- **Expo Go app**: Install on your phone from [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

Optionally, for local testing:
- **iOS Simulator**: Install Xcode on macOS
- **Android Emulator**: Install Android Studio

## Architecture

Understanding the architecture helps troubleshoot issues:

```
┌─────────────────────────────────────┐
│         Mobile App                  │
│     (React Native + Expo)           │
│                                     │
│  - UI components                    │
│  - Message state management         │
│  - ProxyClient for API calls        │
└──────────────┬──────────────────────┘
               │
               │ HTTP/HTTPS
               │ Port 3000 (dev) or 443 (prod)
               │
┌──────────────▼──────────────────────┐
│       Proxy Server                  │
│       (Node.js + Express)           │
│                                     │
│  - OAuth token management           │
│  - Session creation/tracking        │
│  - Request forwarding               │
│  - CORS handling                    │
└──────────────┬──────────────────────┘
               │
               │ Authenticated HTTPS
               │ OAuth Bearer tokens
               │
┌──────────────▼──────────────────────┐
│      Google Cloud                   │
│      Agent Engine                   │
│                                     │
│  - Your deployed ADK agent          │
│  - AI model inference               │
│  - Tool execution                   │
│  - Response streaming               │
└─────────────────────────────────────┘
```

**Why do we need a proxy server?**

The proxy server is essential because:
1. **Security**: Mobile apps can't securely store Google Cloud credentials
2. **Token Management**: OAuth tokens expire and need automatic refresh
3. **CORS**: Direct browser/mobile calls would fail due to CORS restrictions
4. **API Adaptation**: Transforms requests to match Agent Engine's API

## Step 1: Clone and Setup

### 1.1: Clone the Repository

```bash
git clone https://github.com/your-username/react-native-adk-chat.git
cd react-native-adk-chat
```

### 1.2: Install Dependencies

```bash
# Using pnpm (recommended for monorepos)
pnpm install

# Or using npm
npm install
```

This installs dependencies for:
- Root workspace
- Client package (`packages/client`)
- Server package (`packages/server`)
- Demo app (`example/demo-app`)

### 1.3: Verify Installation

```bash
# Check structure
ls -la packages/
# Should show: client, server

ls -la example/
# Should show: demo-app
```

## Step 2: Configure Proxy Server

The proxy server handles authentication and forwards requests to Agent Engine.

### 2.1: Navigate to Server Directory

```bash
cd packages/server
```

### 2.2: Create Environment File

```bash
# Copy the example
cp .env.example .env

# Open in your editor
nano .env  # or: vim .env, code .env, etc.
```

### 2.3: Configure Environment Variables

Edit `.env` with your Agent Engine details:

```env
# ============================================
# AGENT ENGINE CONFIGURATION
# ============================================

# Your Agent Engine endpoint
# Format: https://PROJECT-REGION-agent-engine.a.run.app
AGENT_ENGINE_URL=https://your-project-us-central1-agent-engine.a.run.app

# Your app name (as configured in ADK deployment)
APP_NAME=my-agent

# ============================================
# SERVER CONFIGURATION
# ============================================

# Port for proxy server (default: 3000)
PORT=3000

# Enable debug logging (optional)
DEBUG=true

# ============================================
# GOOGLE CLOUD AUTHENTICATION
# ============================================

# Option 1: Service Account Key File (recommended for local development)
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account-key.json

# Option 2: Service Account JSON String (for production/containers)
# GOOGLE_CLOUD_PROJECT=your-project-id
# GOOGLE_SERVICE_ACCOUNT_EMAIL=adk-chat-mobile@your-project-id.iam.gserviceaccount.com
# GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

**Important Notes:**

- **AGENT_ENGINE_URL**: Find this in your Agent Engine deployment output or Cloud Run console
- **APP_NAME**: Must exactly match the app name in your ADK configuration
- **GOOGLE_APPLICATION_CREDENTIALS**: Use absolute path, not relative (e.g., `/Users/yourname/...` not `./...`)

### 2.4: Move Service Account Key

Move the service account key you created in prerequisites:

```bash
# Move to a secure location
mkdir -p ~/.gcp
mv ~/service-account-key.json ~/.gcp/adk-chat-mobile-key.json
chmod 600 ~/.gcp/adk-chat-mobile-key.json

# Update .env with absolute path
echo "GOOGLE_APPLICATION_CREDENTIALS=$HOME/.gcp/adk-chat-mobile-key.json" >> .env
```

### 2.5: Install Server Dependencies

```bash
npm install
```

### 2.6: Start the Proxy Server

```bash
npm start
```

You should see:
```
🚀 Proxy server running on http://localhost:3000
✅ Agent Engine URL: https://your-project-us-central1-agent-engine.a.run.app
✅ App name: my-agent
📝 Environment: development
```

**Keep this terminal running!** The proxy must stay running for the mobile app to work.

### 2.7: Test the Proxy

Open a new terminal and test the endpoints:

```bash
# Test 1: Health check
curl http://localhost:3000/health

# Expected: {"status":"ok","agentEngineUrl":"https://..."}

# Test 2: Create a session
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_123"}'

# Expected: {"output":{"id":"s_1234567890_abc123"},"status":"ok"}

# Test 3: Send a message
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "session_id": "SESSION_ID_FROM_ABOVE",
    "message": "Hello, how are you?"
  }'

# Expected: Streaming response with agent's reply
```

If all three tests pass, your proxy is working correctly! ✅

## Step 3: Run Demo App

Now let's connect the mobile app to your proxy server.

### 3.1: Navigate to Demo App

```bash
# From project root
cd example/demo-app
```

### 3.2: Configure Connection

Open `App.tsx` and update these lines:

```typescript
// Line ~18
const PROXY_BASE_URL = process.env.PROXY_BASE_URL || "http://localhost:3000";

// Line ~19
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || "your_user_id";
```

**For testing on a physical device:**

Find your computer's local IP address:

```bash
# macOS/Linux
ipconfig getifaddr en0  # or: ifconfig | grep "inet "

# Windows
ipconfig | findstr IPv4
```

Then update:
```typescript
const PROXY_BASE_URL = "http://192.168.1.100:3000";  // Use your IP
```

### 3.3: Install Demo Dependencies

```bash
npm install
```

### 3.4: Start Expo

```bash
npm start
```

You'll see a QR code and options:

```
› Press i │ open iOS simulator
› Press a │ open Android emulator  
› Press w │ open web browser

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

### 3.5: Open the App

**Option A: Physical Device**
1. Install Expo Go from App Store or Play Store
2. Scan the QR code with your camera (iOS) or Expo Go app (Android)
3. Wait for app to load

**Option B: iOS Simulator**
1. Press `i` in the terminal
2. Wait for simulator to open and app to load

**Option C: Android Emulator**
1. Start Android emulator first
2. Press `a` in the terminal
3. Wait for app to load

**Option D: Web Browser**
1. Press `w` in the terminal
2. Browser will open with the app

### 3.6: Test the Chat

1. **Check Connection**: Look for green dot in top-right (indicates proxy is connected)
2. **Send a Message**: Type "Hello!" and tap the send button
3. **Watch Response Stream**: AI response should appear character-by-character
4. **Try Tool Calls**: If your agent uses tools, you'll see them in the UI
5. **Start New Chat**: Tap the "+" button to create a new session

**Common First-Time Issues:**

- **Red dot (disconnected)**: Proxy server isn't running or URL is wrong
- **"Cannot connect"**: Check firewall, IP address (for physical devices), or proxy logs
- **No response**: Check proxy server logs for errors, verify Agent Engine URL

## Step 4: Integrate into Your App

Once the demo works, integrate the package into your own React Native app.

### 4.1: Install Client Package

In your React Native project directory:

```bash
# Option 1: Install from local path (during development)
npm install /absolute/path/to/react-native-adk-chat/packages/client

# Option 2: Install from git repository
npm install git+https://github.com/your-username/react-native-adk-chat.git#main:packages/client

# Option 3: Publish to npm and install (recommended for production)
# npm install @your-org/react-native-adk-chat
```

### 4.2: Install Peer Dependencies

```bash
npm install @expo/vector-icons react-native-safe-area-context
```

### 4.3: Basic Implementation

Create a new chat screen:

```typescript
// screens/ChatScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  MessageBubble,
  ChatInput,
  ProxyClient,
  type Message,
} from '@react-native-adk-chat/client';

const PROXY_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://your-proxy.run.app';

export default function ChatScreen({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const proxyClient = useRef(new ProxyClient({ baseUrl: PROXY_URL })).current;
  const flatListRef = useRef<FlatList>(null);

  // Initialize session
  useEffect(() => {
    initSession();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const initSession = async () => {
    try {
      const response = await proxyClient.createSession(userId);
      setSessionId(response.output.id);
    } catch (error) {
      console.error('Session creation failed:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !sessionId) return;

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

    // Create placeholder for AI response
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, aiMessage]);

    try {
      let accumulatedText = '';

      await proxyClient.sendMessage(
        {
          user_id: userId,
          session_id: sessionId,
          message: userMessage.content,
        },
        (chunk: string) => {
          // Update message as chunks arrive
          accumulatedText += chunk;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, content: accumulatedText, isLoading: false }
                : msg
            )
          );
        },
        (toolName: string, status: 'calling' | 'complete', args?: any) => {
          // Handle tool calls (optional)
          console.log(`Tool ${toolName}: ${status}`, args);
        }
      );

      setIsLoading(false);
    } catch (error) {
      console.error('Send message failed:', error);
      
      // Show error in chat
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: 'Sorry, I encountered an error. Please try again.',
                isLoading: false,
              }
            : msg
        )
      );
      
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
      
      <ChatInput
        value={input}
        onChangeText={setInput}
        onSend={handleSend}
        disabled={isLoading || !sessionId}
        placeholder={isLoading ? 'AI is thinking...' : 'Type a message...'}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
});
```

### 4.4: Add to Navigation

Integrate the chat screen into your app's navigation:

```typescript
// App.tsx or navigation setup
import ChatScreen from './screens/ChatScreen';

// In your navigation
<Stack.Screen 
  name="Chat" 
  component={ChatScreen}
  initialParams={{ userId: currentUser.id }}
/>
```

### 4.5: Customize Styling

The components accept custom styles:

```typescript
<MessageBubble
  message={item}
  userBubbleStyle={{ backgroundColor: '#007AFF' }}
  userTextStyle={{ color: '#FFFFFF' }}
  aiBubbleStyle={{ backgroundColor: '#F0F0F0' }}
/>

<ChatInput
  value={input}
  onChangeText={setInput}
  onSend={handleSend}
  containerStyle={{ borderTopColor: '#E0E0E0' }}
  inputStyle={{ fontSize: 16 }}
  sendButtonStyle={{ backgroundColor: '#007AFF' }}
/>
```

## Step 5: Deploy to Production

### 5.1: Deploy Proxy Server

The proxy server must be deployed to a publicly accessible server.

#### Option A: Google Cloud Run (Recommended)

```bash
# Navigate to server directory
cd packages/server

# Deploy to Cloud Run
gcloud run deploy adk-chat-proxy \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars AGENT_ENGINE_URL=https://your-agent-engine-url.a.run.app,APP_NAME=my-agent \
  --project YOUR_PROJECT_ID

# Get the URL
gcloud run services describe adk-chat-proxy --region us-central1 --format="value(status.url)"
```

#### Option B: AWS Lambda + API Gateway

1. Package the server: `npm run build`
2. Create Lambda function with Node.js 18+ runtime
3. Set environment variables in Lambda console
4. Create API Gateway to expose Lambda
5. Deploy and get the API endpoint

#### Option C: Other Platforms

- **Heroku**: `git push heroku main`
- **Azure App Service**: Deploy via Azure CLI or GitHub Actions
- **DigitalOcean App Platform**: Connect GitHub repo
- **Railway**: Connect repo and deploy

### 5.2: Update Mobile App Configuration

Update your app to use the production proxy URL:

```typescript
// config/api.config.ts
const PROXY_URL = __DEV__
  ? 'http://localhost:3000'  // Development
  : 'https://adk-chat-proxy-abc123.run.app';  // Production

export default PROXY_URL;
```

### 5.3: Build Mobile App

#### For Internal Testing (TestFlight/Google Play Internal Testing)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios --profile preview

# Build for Android
eas build --platform android --profile preview
```

#### For Production Release

```bash
# Build production iOS
eas build --platform ios --profile production

# Build production Android
eas build --platform android --profile production

# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

### 5.4: Monitor and Maintain

**Set up monitoring:**

```bash
# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=adk-chat-proxy" --limit 50

# Set up alerts
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Proxy Server Errors" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5
```

**Regular maintenance:**
- Monitor proxy server logs for errors
- Check Agent Engine quotas and usage
- Review authentication token expiration
- Update dependencies regularly

## Troubleshooting

### Proxy Server Issues

#### "Cannot read property 'credentials' of undefined"

**Problem**: Service account credentials not found

**Solutions**:
1. Check `GOOGLE_APPLICATION_CREDENTIALS` path is absolute and correct
2. Verify file exists: `ls -l /path/to/service-account-key.json`
3. Check file permissions: `chmod 600 service-account-key.json`
4. Verify JSON is valid: `cat service-account-key.json | jq .`

#### "Error: Could not load the default credentials"

**Problem**: Google Auth Library can't find credentials

**Solutions**:
1. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
2. Or use Application Default Credentials: `gcloud auth application-default login`
3. For Cloud Run, ensure service account is attached to the service

#### "403 Forbidden" from Agent Engine

**Problem**: Service account lacks permissions

**Solutions**:
```bash
# Grant AI Platform User role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:adk-chat-mobile@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Verify permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:adk-chat-mobile@*"
```

### Mobile App Issues

#### "Network request failed" on physical device

**Problem**: Device can't reach proxy server

**Solutions**:
1. Replace `localhost` with your computer's IP address
2. Ensure device and computer are on same network
3. Check firewall allows connections on port 3000
4. Test connectivity: `curl http://YOUR_IP:3000/health` from another device

#### Messages not streaming / appear all at once

**Problem**: Streaming isn't working

**Solutions**:
1. Check mobile network isn't blocking streaming (try WiFi)
2. Verify proxy server supports streaming (check server code)
3. Check Agent Engine response includes `stream: true`
4. Review network inspector in dev tools

#### "Session creation failed"

**Problem**: Can't create new session

**Solutions**:
1. Verify proxy server is running: `curl http://YOUR_PROXY/health`
2. Check `APP_NAME` in proxy `.env` matches Agent Engine config
3. Review proxy server logs for specific error
4. Test session creation with curl (see Step 2.7)

### Agent Engine Issues

#### "App not found" error

**Problem**: Agent Engine can't find your app

**Solutions**:
1. Verify app name: `curl https://YOUR_AGENT_ENGINE_URL/list-apps -H "Authorization: Bearer $(gcloud auth print-access-token)"`
2. Check `APP_NAME` in `.env` matches exactly (case-sensitive)
3. Ensure Agent Engine deployment is active (check Cloud Run)

#### Slow response times

**Problem**: Agent takes too long to respond

**Solutions**:
1. Check Agent Engine logs for performance issues
2. Optimize your agent code (reduce tool calls, simplify logic)
3. Consider using Gemini Flash instead of Pro for faster responses
4. Review Agent Engine quotas and scaling settings

## Advanced Configuration

### Custom Authentication

Replace the default user ID with your own auth system:

```typescript
// hooks/useAuth.ts
import { useAuth } from 'your-auth-library';

export function useCurrentUser() {
  const { user } = useAuth();
  return user?.id || null;
}

// In your chat screen
import { useCurrentUser } from '../hooks/useAuth';

function ChatScreen() {
  const userId = useCurrentUser();
  
  if (!userId) {
    return <LoginScreen />;
  }
  
  // Rest of chat implementation...
}
```

### Message Persistence

Save conversation history to device storage:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save messages
const saveMessages = async (sessionId: string, messages: Message[]) => {
  try {
    await AsyncStorage.setItem(
      `chat_${sessionId}`,
      JSON.stringify(messages)
    );
  } catch (error) {
    console.error('Failed to save messages:', error);
  }
};

// Load messages
const loadMessages = async (sessionId: string): Promise<Message[]> => {
  try {
    const data = await AsyncStorage.getItem(`chat_${sessionId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
};
```

### Multiple Agents

Support multiple agents in the same app:

```typescript
// config/agents.config.ts
export const AGENTS = {
  customer_support: {
    proxyUrl: 'https://support-proxy.run.app',
    name: 'Customer Support',
  },
  sales: {
    proxyUrl: 'https://sales-proxy.run.app',
    name: 'Sales Assistant',
  },
};

// In your app
const [selectedAgent, setSelectedAgent] = useState('customer_support');
const proxyClient = new ProxyClient({ 
  baseUrl: AGENTS[selectedAgent].proxyUrl 
});
```

### Analytics Integration

Track user interactions:

```typescript
import analytics from '@react-native-firebase/analytics';

const handleSend = async () => {
  // Send message...
  
  await analytics().logEvent('chat_message_sent', {
    user_id: userId,
    session_id: sessionId,
    message_length: input.length,
  });
};

// Track AI response time
const startTime = Date.now();
await proxyClient.sendMessage(...);
const responseTime = Date.now() - startTime;

await analytics().logEvent('chat_response_received', {
  response_time_ms: responseTime,
  session_id: sessionId,
});
```

### Error Retry Logic

Add automatic retry for failed requests:

```typescript
const sendWithRetry = async (
  message: string,
  maxRetries = 3
): Promise<void> => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await proxyClient.sendMessage({
        user_id: userId,
        session_id: sessionId,
        message,
      });
      return; // Success!
    } catch (error) {
      lastError = error;
      console.log(`Retry ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw lastError; // All retries failed
};
```

## Getting Help

- **Documentation**: Check the [main README](../README.md) and [ADK docs](https://google.github.io/adk-docs/)
- **Issues**: Open a [GitHub issue](https://github.com/your-username/react-native-adk-chat/issues)
- **Community**: Join the [ADK community](https://cloud.google.com/agent-builder/docs/community)
- **Support**: Contact your Google Cloud support representative

## Next Steps

Now that you have a working integration:

1. **Customize the UI** to match your brand
2. **Add user authentication** with your auth provider
3. **Implement message persistence** for conversation history
4. **Add analytics** to track usage and performance
5. **Deploy to production** and submit to app stores
6. **Monitor and optimize** based on user feedback

Happy building! 🚀