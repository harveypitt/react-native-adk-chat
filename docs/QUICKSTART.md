# 🚀 Quick Start: ADK Integration

Your React Native chat app is now connected to the Google Agent Development Kit (ADK)!

## What's New

✅ **Real ADK API Integration** - Connects to your ADK agent via HTTP  
✅ **Streaming Responses** - Messages appear in real-time as AI generates them  
✅ **New Chat Button** - Start fresh conversations with one tap  
✅ **Session Management** - Automatic session creation and handling  
✅ **Error Handling** - Graceful fallbacks if connection fails  

---

## 🎯 Getting Started (3 Steps)

### Step 1: Start Your ADK Agent

Make sure your ADK agent is running:

```bash
# Default setup expects agent at:
http://localhost:8501
```

Test it's working:
```bash
curl http://localhost:8501/list-apps
```

### Step 2: Configure the App

Open `src/config/adk.config.ts` and update if needed:

```typescript
export const adkConfig: ADKConfig = {
  baseUrl: "http://localhost:8501",  // Your ADK endpoint
  appName: "app",                     // Your app name
};
```

**Testing on a real device?** Use your computer's IP instead of `localhost`:
```typescript
baseUrl: "http://192.168.1.100:8501"  // Replace with your IP
```

### Step 3: Run the App

```bash
npx expo start
```

Then scan the QR code and start chatting!

---

## 📱 Using the App

### Starting a Conversation

1. Open the app
2. Type your message in the input field
3. Hit send or press Enter
4. Watch the AI response stream in real-time!

### Starting a New Chat

1. Tap **"New Chat"** button in the top-left
2. Confirm you want to start fresh
3. New session is created automatically
4. Start a new conversation!

### What Happens Behind the Scenes

```
User sends message
    ↓
App creates session (first time)
    ↓
Message sent to ADK agent via POST /run
    ↓
Response streams back in chunks
    ↓
UI updates in real-time
    ↓
Complete!
```

---

## 🔍 What Changed in the Code

### New Files Added

```
src/
├── api/
│   ├── adkClient.ts       # ADK HTTP client with streaming
│   └── types.ts           # TypeScript types for API
└── config/
    └── adk.config.ts      # Configuration (baseUrl, appName)
```

### Updated Files

- **App.tsx** - Now uses ADKClient instead of dummy responses
- **MessageBubble.tsx** - No changes (still works great!)
- **ChatInput.tsx** - Minor fix for React Native compatibility

### Key Features in ADKClient

```typescript
// Create a client
const client = new ADKClient({
  baseUrl: "http://localhost:8501",
  appName: "app"
});

// Send a message with streaming
await client.sendMessage(
  "What is the capital of France?",
  userId,
  sessionId,
  (chunk) => {
    // Called for each chunk as it arrives
    console.log(chunk);
  }
);

// Create a new session
await client.createSession(userId, sessionId);

// Generate a session ID
const sessionId = ADKClient.generateSessionId();
```

---

## 🧪 Testing the Integration

### Test 1: Basic Message

1. Send: "Hello"
2. Expected: AI responds with greeting
3. Watch it stream character-by-character!

### Test 2: Knowledge Question

1. Send: "What is the capital of France?"
2. Expected: "The capital of France is Paris."
3. Response matches the format you provided

### Test 3: New Session

1. Have a conversation (3-4 messages)
2. Tap "New Chat"
3. Confirm
4. Send a message
5. Expected: AI doesn't remember previous conversation

### Test 4: Error Handling

1. Stop your ADK agent
2. Try to send a message
3. Expected: Error alert with helpful message
4. Message shows: "Sorry, I encountered an error..."

---

## 🛠️ Troubleshooting

### "Failed to connect to ADK agent"

**Problem**: App can't reach your ADK agent

**Solutions**:
- ✅ Verify ADK agent is running
- ✅ Check the URL in `adk.config.ts`
- ✅ Use computer's IP (not localhost) for real devices
- ✅ Ensure firewall allows connections

### "Session creation failed"

**Problem**: Can't create new sessions

**Solutions**:
- ✅ Check `appName` matches your ADK configuration
- ✅ Verify ADK agent accepts session creation
- ✅ Check ADK agent logs for errors

### Messages not streaming

**Problem**: Full message appears at once instead of streaming

**Solutions**:
- ✅ Verify `streaming: true` in request
- ✅ Check ADK agent supports streaming
- ✅ Review network conditions

### Works in iOS but not Android

**Problem**: Connection fails on one platform

**Solutions**:
- ✅ Android requires explicit network permissions
- ✅ Check both platforms using same network
- ✅ Try using IP address instead of localhost

---

## 📊 API Request Example

When you send "Hello", the app makes this request:

```json
POST http://localhost:8501/run

{
  "app_name": "app",
  "user_id": "u_123",
  "session_id": "s_1762523080604_abc123",
  "new_message": {
    "role": "user",
    "parts": [{"text": "Hello"}]
  },
  "streaming": true
}
```

Expected response (streaming):

```json
[
  {
    "modelVersion": "gemini-2.5-flash",
    "content": {
      "parts": [
        {"text": "Hello! How can I help you today?"}
      ],
      "role": "model"
    },
    "finishReason": "STOP",
    "id": "...",
    "timestamp": 1762523080.604261
  }
]
```

---

## 🎨 Customization

### Change ADK Endpoint

Edit `src/config/adk.config.ts`:

```typescript
export const adkConfig: ADKConfig = {
  baseUrl: "https://your-adk-agent.com",
  appName: "your-app-name",
};
```

### Use Real User IDs

Replace the dummy user ID:

```typescript
// In your auth flow
const userId = await getCurrentUser();

// Update DEFAULT_USER_ID in adk.config.ts
export const DEFAULT_USER_ID = userId;
```

### Customize Error Messages

Edit the error handling in `App.tsx`:

```typescript
Alert.alert(
  "Your Custom Title",
  "Your custom error message"
);
```

---

## 📚 Next Steps

Now that you have ADK connected:

- [ ] **Test with different prompts** - Try complex questions
- [ ] **Monitor performance** - Check streaming speed
- [ ] **Add user authentication** - Replace dummy user ID
- [ ] **Implement message history** - Load past conversations
- [ ] **Add typing indicators** - Show when AI is thinking
- [ ] **Persist sessions** - Save session IDs locally

---

## 💡 Tips

### Development Mode

- Check the console for detailed logs
- Session IDs and errors are logged
- Use React Native Debugger for better visibility

### Production Checklist

- [ ] Replace localhost with production URL
- [ ] Implement real user authentication
- [ ] Add proper error tracking (Sentry, etc.)
- [ ] Add analytics for message sending
- [ ] Test on multiple devices/networks
- [ ] Add offline handling

### Performance

- Streaming reduces perceived latency
- Messages appear as they're generated
- No need to wait for complete response
- Better UX for long responses

---

## 🎉 You're All Set!

Your app now has:
- ✅ Real-time streaming from ADK
- ✅ Session management
- ✅ Error handling
- ✅ Clean, production-ready code

**Start chatting and see your ADK agent in action!** 🚀

---

## 📞 Need Help?

- **Detailed Setup**: See `docs/adk-setup.md`
- **API Reference**: Check `src/api/types.ts`
- **Postman Collection**: Test with `ADK.postman_collection.json`
- **PRD**: Review `docs/prd-mvp.md`

Happy building! 🎉