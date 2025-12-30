# create-adk-chat-app

Quickly scaffold a new React Native chat app connected to Google ADK agents (Cloud Run or Agent Engine).

## Usage

### Create New App

```bash
# From GitHub (always gets latest version)
npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app my-app-name

# Or install globally
npm install -g github:harveypitt/react-native-adk-chat#main:packages/create-adk-chat-app
create-adk-chat-app my-app-name
```

### Update Existing App

```bash
# Update code (get latest features)
npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app --update

# Reconfigure settings (change proxy URL, app name)
npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app --reconfigure

# Both
npx github:harveypitt/react-native-adk-chat/packages/create-adk-chat-app --update --reconfigure
```

## What Gets Created

Your generated app will have minimal boilerplate:

```
my-app-name/
├── App.tsx                 # ~15 lines - imports ChatApp component
├── theme.ts                # Color customization
├── server/                 # Proxy server (downloaded from GitHub)
├── package.json
├── .env                    # Your configuration
└── app.json                # Expo config
```

**App.tsx** (the entire app!):
```typescript
import { ChatApp } from '@react-native-adk-chat/client';
import { theme } from './theme';

export default function App() {
  return <ChatApp
    proxyUrl={process.env.EXPO_PUBLIC_PROXY_BASE_URL}
    theme={theme}
  />;
}
```

**theme.ts** (easy color customization):
```typescript
export const theme = {
  // Uncomment to customize
  // primaryColor: '#007AFF',
  // userMessageBackground: '#007AFF',
  // ...
};
```

## Interactive Setup

The CLI will ask you:

1. **Backend Type**: Cloud Run or Agent Engine
2. **Proxy URL**: Your Cloud Run/Agent Engine URL
3. **App Name**: Default app name (optional, for multi-app Cloud Run services)
4. **AI Suggestions**: Enable AI-powered suggestion generation (optional)
5. **Gemini API Key**: If enabling AI suggestions (optional)

## Auto-Updating Architecture

Unlike traditional templates that copy code, this CLI generates apps that **import components from the package**. This means:

✅ **Run `npm update`** to get new chat features automatically
✅ **Your customizations** (theme, app wrapper) are never touched
✅ **Breaking changes are rare** because you're using stable component APIs

Example update flow:
```bash
cd my-app-name

# Get latest chat features, bug fixes, UI improvements
npm update @react-native-adk-chat/client

# Done! Your app now has the latest features
```

## Customization

### Theme Colors

Edit `theme.ts` to customize 30+ colors:

```typescript
export const theme = {
  primaryColor: '#FF6B6B',
  userMessageBackground: '#FF6B6B',
  aiMessageBackground: '#F0F0F0',
  headerBackground: '#FFFFFF',
  // ... see theme.ts for all options
};
```

Changes hot-reload automatically during development!

### Custom Components

While the default `<ChatApp />` works out of the box, you can import individual components for full control:

```typescript
import {
  ChatScreen,
  ChatHeader,
  ChatMessageList,
  useProxyClient,
  useChatSession,
  useChatMessages
} from '@react-native-adk-chat/client';
```

## Next Steps

1. **Start the app:**
   ```bash
   cd my-app-name
   npm install
   npm start
   ```

2. **Customize colors:**
   Edit `theme.ts` and see changes hot-reload

3. **Deploy proxy server:**
   The `server/` directory contains a ready-to-deploy proxy server

4. **Update configuration:**
   Run with `--reconfigure` to change proxy URL or settings

## Requirements

- Node.js 18+
- npm or pnpm
- Deployed ADK agent (Cloud Run or Agent Engine)

## Features

- ✅ Complete chat UI with navigation
- ✅ Message streaming
- ✅ Session management
- ✅ Tool call debugging
- ✅ AI-powered suggestions (optional)
- ✅ Easy theme customization
- ✅ Auto-updating via npm

## License

MIT