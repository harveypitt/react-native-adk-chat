# React Native ADK Chat

Clean, minimal chat UI for Google Agent Development Kit (ADK) agents with real-time streaming responses.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.76-blue.svg)
![Expo](https://img.shields.io/badge/Expo-52.0-blue.svg)

## Features

- ✅ **Real ADK Integration** - Connect to Google's Agent Development Kit
- ✅ **Streaming Responses** - Real-time message streaming from AI agents
- ✅ **Session Management** - Automatic session creation and handling
- ✅ **Clean Minimal Design** - Professional, white-label ready UI
- ✅ **Monochrome Palette** - Easy to customize for any brand
- ✅ **TypeScript Support** - Full type safety throughout
- ✅ **Cross-Platform** - Works on iOS, Android, and web

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Configure ADK

Edit `src/config/adk.config.ts`:

```typescript
export const adkConfig: ADKConfig = {
  baseUrl: "http://localhost:8501",  // Your ADK agent URL
  appName: "app",                     // Your app name
};
```

**Testing on a real device?** Use your computer's IP address instead of `localhost`:
```typescript
baseUrl: "http://192.168.1.100:8501"
```

### 3. Start Your ADK Agent

Make sure your ADK agent is running at the configured URL:
```bash
# Test connection
curl http://localhost:8501/list-apps
```

### 4. Run the App

```bash
npx expo start
```

Then scan the QR code with Expo Go or press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

### 5. Start Chatting!

- Type your message and hit send
- Watch AI responses stream in real-time
- Click "New Chat" to start fresh conversations

## Project Structure

```
react-native-adk-chat/
├── App.tsx                    # Main app with ADK integration
├── src/
│   ├── api/
│   │   ├── adkClient.ts      # ADK HTTP client with streaming
│   │   └── types.ts          # TypeScript types for API
│   ├── components/
│   │   ├── MessageBubble.tsx # Message display component
│   │   └── ChatInput.tsx     # Input field with send button
│   └── config/
│       └── adk.config.ts     # ADK configuration
├── docs/
│   ├── adk-setup.md          # Detailed ADK setup guide
│   ├── QUICKSTART.md         # Quick start guide
│   └── prd-mvp.md            # Product requirements
└── README.md
```

## How It Works

### Request Flow

```
User types message
    ↓
App sends to ADK agent (POST /run)
    ↓
Agent processes with streaming=true
    ↓
Response chunks stream back
    ↓
UI updates in real-time
    ↓
Complete!
```

### API Request Example

```json
POST http://localhost:8501/run

{
  "app_name": "app",
  "user_id": "u_123",
  "session_id": "s_1762523080604_abc123",
  "new_message": {
    "role": "user",
    "parts": [{"text": "What is the capital of France?"}]
  },
  "streaming": true
}
```

### API Response Example

```json
[
  {
    "modelVersion": "gemini-2.5-flash",
    "content": {
      "parts": [
        {"text": "The capital of France is Paris."}
      ],
      "role": "model"
    },
    "finishReason": "STOP",
    "usageMetadata": {
      "candidatesTokenCount": 7,
      "promptTokenCount": 166,
      "totalTokenCount": 212
    }
  }
]
```

## Design Philosophy

- **Minimal**: Only essential elements, no decoration
- **Monochrome**: Clean grayscale palette, easy to rebrand
- **Rounded**: Soft, friendly design with rounded corners
- **Typography-focused**: Clear hierarchy through text
- **White-label ready**: Perfect for any company or product
- **Professional**: Works for B2B, B2C, and internal tools

### Color Palette

```typescript
{
  userMessageBg: "#F3F4F6",      // Light gray
  userMessageText: "#111827",     // Near black
  aiMessageBg: "#FFFFFF",         // White
  aiMessageText: "#111827",       // Near black
  aiMessageBorder: "#E5E7EB",     // Subtle border
  textSecondary: "#6B7280",       // Gray
  sendButton: "#111827",          // Dark gray
}
```

## Key Features

### Real-Time Streaming

Messages appear character-by-character as the AI generates them. No waiting for complete responses!

```typescript
await adkClient.sendMessage(
  message,
  userId,
  sessionId,
  (chunk) => {
    // Called for each chunk as it arrives
    updateUI(chunk);
  }
);
```

### Session Management

Each conversation has its own session. Start fresh anytime with the "New Chat" button.

```typescript
// Auto-generated session IDs
const sessionId = ADKClient.generateSessionId();
// Example: s_1762523080604_abc123
```

### Error Handling

Graceful error handling with helpful messages:
- Connection failures
- API errors
- Timeout handling
- User-friendly alerts

## Configuration

### ADK Settings

Edit `src/config/adk.config.ts`:

```typescript
export const adkConfig: ADKConfig = {
  baseUrl: "http://localhost:8501",  // ADK endpoint
  appName: "app",                     // App name in ADK
};

export const DEFAULT_USER_ID = "u_123";  // User identifier
```

### Environment-Specific Config

For different environments:

```typescript
// Development
baseUrl: "http://localhost:8501"

// Production
baseUrl: "https://your-adk-agent.com"

// Mobile device testing
baseUrl: "http://192.168.1.100:8501"  // Your computer's IP
```

## Troubleshooting

### Connection Failed

**Error**: "Failed to connect to ADK agent"

**Solutions**:
1. Verify ADK agent is running: `curl http://localhost:8501/list-apps`
2. Check URL in `adk.config.ts` matches your agent
3. For mobile devices, use your computer's IP (not `localhost`)
4. Ensure firewall allows connections on port 8501

### Session Errors

**Error**: "Failed to create session"

**Solutions**:
1. Verify `appName` matches your ADK configuration
2. Check ADK agent logs for errors
3. Test session creation with Postman

### Streaming Not Working

If messages appear all at once instead of streaming:
1. Verify `streaming: true` in request
2. Check ADK agent supports streaming
3. Review network conditions

## Documentation

- **[Quick Start Guide](docs/QUICKSTART.md)** - Get up and running in 3 steps
- **[ADK Setup Guide](docs/adk-setup.md)** - Detailed ADK configuration
- **[MVP PRD](docs/prd-mvp.md)** - Product requirements document

## Next Steps

- [ ] Replace dummy user ID with real authentication
- [ ] Add message persistence (AsyncStorage)
- [ ] Implement conversation history
- [ ] Add typing indicators
- [ ] Support file uploads (if agent supports it)
- [ ] Add retry logic for failed requests
- [ ] Implement offline mode
- [ ] Add analytics tracking

## Tech Stack

- **React Native** (0.76.3) - Cross-platform mobile framework
- **Expo** (52.0.0) - Development and build tooling
- **TypeScript** - Type safety and better DX
- **No UI libraries** - Pure React Native components
- **Streaming API** - Real-time responses via fetch streams

## Requirements

- Node.js 18+ (or 20+ recommended)
- npm or pnpm
- Running ADK agent instance
- iOS Simulator, Android Emulator, or Expo Go app

## Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

- Built for [Google Agent Development Kit (ADK)](https://cloud.google.com/agent-builder)
- Designed to be white-label friendly
- Inspired by modern chat interfaces (Notion, Linear, Slack)

## Support

- **Issues**: Open a GitHub issue
- **Documentation**: Check the `docs/` folder
- **Postman**: Use included collection for API testing

---

**Built with ❤️ for the ADK community**