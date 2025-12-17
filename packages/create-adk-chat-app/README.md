# create-adk-chat-app

Quickly scaffold a new React Native chat app connected to Google ADK Agent Engine.

## Usage

```bash
npx create-adk-chat-app my-app-name
```

Or with options:

```bash
npx create-adk-chat-app my-app --template default
```

### Updating Existing Apps

If you need to change the Agent Engine URL for an existing app:

```bash
# Run inside your app directory
npx create-adk-chat-app --update-agent-url https://my-agent.run.app
```

## What Gets Created

- Full React Native + Expo app structure
- TypeScript configuration
- Pre-configured ProxyClient
- Example chat screen with streaming support
- Environment configuration

## Interactive Setup

The CLI will ask you a few questions to configure your environment:

1. **Project Name**: The directory name for your new app.
2. **Backend Type**: Whether you are connecting to Google Agent Engine or a custom proxy.
3. **Environment**: Choose between `Localhost` (for development) or `Remote URL` (for production/staging).
4. **URL**: If remote, you'll be asked for the full URL (e.g., `https://my-agent-service.a.run.app`).

## Next Steps

1. `cd my-app-name`
2. `npm install`
3. `npm start`
4. Customize the chat screen in `src/screens/ChatScreen.tsx`

## Requirements

- Node.js 18+
- npm or pnpm