# @react-native-adk-chat/client

React Native components and hooks for building chat interfaces that connect to Google's Agent Development Kit (ADK) agents.

## Installation

```bash
# Install from GitHub
npm install github:harveypitt/react-native-adk-chat#main:packages/client

# Install peer dependencies
npm install @expo/vector-icons react-native-safe-area-context expo-status-bar \
  react-native-gesture-handler react-native-screens \
  @react-navigation/native @react-navigation/stack
```

## Quick Start

```typescript
import React from 'react';
import { ChatApp } from '@react-native-adk-chat/client';

export default function App() {
  return (
    <ChatApp
      proxyUrl="http://localhost:3000"
      userId="user_123"
      title="My AI Assistant"
      theme={{
        primaryColor: '#007AFF',
        userMessageBackground: '#007AFF',
      }}
    />
  );
}
```

## Components

### High-Level Components (Recommended)

#### `<ChatApp />`
Complete chat application with navigation. **Easiest way to get started.**

```typescript
<ChatApp
  proxyUrl={string}           // Required: Proxy server URL
  userId={string}              // Optional: User ID (default: 'user_123')
  title={string}               // Optional: Header title (default: 'ADK Chat')
  theme={ChatTheme}            // Optional: Color customization
/>
```

#### `<ChatScreen />`
Full chat interface without navigation wrapper. Use when you have your own navigation.

```typescript
<ChatScreen
  proxyBaseUrl={string}        // Required: Proxy server URL
  userId={string}              // Optional: User ID
  title={string}               // Optional: Header title
  theme={ChatTheme}            // Optional: Color customization
  onToolCallPress={(toolCall) => void}  // Optional: Handle tool call presses
/>
```

### Individual Components

For custom layouts, use these building blocks:

- `<ChatHeader />` - Header with status indicator and new chat button
- `<ChatMessageList />` - Message list with auto-scroll and empty states
- `<MessageBubble />` - Individual message display
- `<ChatInput />` - Text input with send button
- `<SuggestionContainer />` - AI-powered suggestion chips
- `<ToolResponseDebugScreen />` - Tool call debugging screen

## Hooks

### `useProxyClient(config)`
Creates and memoizes a ProxyClient instance.

```typescript
const proxyClient = useProxyClient({ baseUrl: 'http://localhost:3000' });
```

### `useChatSession(config)`
Manages session lifecycle (creation, health checks, new chat).

```typescript
const {
  sessionId,
  isConnected,
  checkConnection,
  initializeSession,
  startNewChat,
} = useChatSession({
  proxyClient,
  userId: 'user_123',
  proxyBaseUrl: 'http://localhost:3000',
});
```

### `useChatMessages(config)`
Manages message state and streaming.

```typescript
const {
  messages,
  input,
  isLoading,
  setInput,
  sendMessage,
  handleSuggestionSelect,
  clearMessages,
} = useChatMessages({
  proxyClient,
  userId: 'user_123',
  sessionId,
  proxyBaseUrl: 'http://localhost:3000',
});
```

## Theme Customization

All color properties are optional:

```typescript
import { ChatTheme } from '@react-native-adk-chat/client';

const theme: ChatTheme = {
  // Primary colors
  primaryColor: '#007AFF',
  backgroundColor: '#FFFFFF',

  // Message bubbles
  userMessageBackground: '#007AFF',
  userMessageText: '#FFFFFF',
  aiMessageBackground: '#F0F0F0',
  aiMessageText: '#000000',
  aiMessageBorder: '#E0E0E0',

  // Input
  inputBackground: '#F9FAFB',
  inputBorder: '#E5E7EB',
  sendButtonColor: '#007AFF',

  // Header
  headerBackground: '#FFFFFF',
  headerText: '#000000',
  statusConnected: '#34C759',
  statusDisconnected: '#FF3B30',

  // ... 20+ more properties available
};
```

See full theme reference in the [root README](../../README.md#theme-reference).

## API Clients

### ProxyClient

```typescript
import { ProxyClient } from '@react-native-adk-chat/client';

const client = new ProxyClient({ baseUrl: 'http://localhost:3000' });

// Health check
await client.checkHealth();

// Create session
const response = await client.createSession('user_123');

// Send message with streaming
await client.sendMessage(
  {
    user_id: 'user_123',
    session_id: 'session_xyz',
    message: 'Hello!',
  },
  (chunk, invocationId, type, eventData) => {
    // Handle streaming chunks
  }
);

// List sessions
await client.listSessions('user_123');
```

## Auto-Updating

This package is designed for continuous updates. When you import components instead of scaffolding code, you get new features automatically:

```bash
# Get the latest features and bug fixes
npm update @react-native-adk-chat/client
```

Your custom code (theme, app wrapper, etc.) won't be affected - only the chat functionality gets updated!

## TypeScript Support

Fully typed with TypeScript. All components, hooks, and types are exported:

```typescript
import type {
  Message,
  ToolCall,
  Suggestion,
  ChatTheme,
  ChatRequest,
  CreateSessionResponse,
} from '@react-native-adk-chat/client';
```

## License

MIT
