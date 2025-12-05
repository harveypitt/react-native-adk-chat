# Quick Reference Guide

A concise reference for integrating React Native ADK Chat with your Agent Engine deployment.

## 📋 Pre-Flight Checklist

Before you start, make sure you have:

- [ ] Agent deployed to Agent Engine ([Deploy Guide](https://google.github.io/adk-docs/deploy/agent-engine/))
- [ ] Agent Engine URL (e.g., `https://project-region-agent-engine.a.run.app`)
- [ ] App name from your ADK configuration
- [ ] Google Cloud service account with `roles/aiplatform.user` permission
- [ ] Service account key JSON file downloaded
- [ ] Node.js 18+ installed
- [ ] iOS Simulator, Android Emulator, or Expo Go app

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                              │
│                    (React Native + Expo)                        │
│                                                                 │
│  Components:                                                    │
│  • MessageBubble - Display messages                            │
│  • ChatInput - User input field                                │
│  • ProxyClient - API communication                             │
│                                                                 │
│  State Management:                                              │
│  • Messages array                                               │
│  • Session ID                                                   │
│  • Loading states                                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │ JSON payloads
                            │ Streaming responses
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      PROXY SERVER                               │
│                    (Node.js + Express)                          │
│                                                                 │
│  Responsibilities:                                              │
│  • OAuth token management (auto-refresh)                       │
│  • Session creation & tracking                                 │
│  • Request forwarding to Agent Engine                          │
│  • CORS handling                                                │
│  • Error handling & retry logic                                │
│                                                                 │
│  Endpoints:                                                     │
│  • GET  /health - Health check                                 │
│  • POST /api/sessions - Create new session                     │
│  • POST /api/chat - Send message (streaming)                   │
│  • GET  /api/sessions/:userId - List user sessions             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Authenticated HTTPS
                            │ Bearer Token (auto-refreshed)
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                   GOOGLE CLOUD                                  │
│                   AGENT ENGINE                                  │
│                                                                 │
│  Your Deployed Agent:                                           │
│  • AI model (Gemini)                                            │
│  • Custom tools & functions                                     │
│  • Conversation memory                                          │
│  • Response streaming                                           │
└─────────────────────────────────────────────────────────────────┘
```

## ⚡ Quick Setup (5 Steps)

### Step 1: Clone & Install
```bash
git clone https://github.com/your-username/react-native-adk-chat.git
cd react-native-adk-chat
pnpm install  # or npm install
```

### Step 2: Configure Proxy Server
```bash
cd packages/server
cp .env.example .env
nano .env  # Edit with your values
```

Required `.env` values:
```env
AGENT_ENGINE_URL=https://your-project-region-agent-engine.a.run.app
APP_NAME=your-app-name
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account-key.json
PORT=3000
```

### Step 3: Start Proxy
```bash
npm install
npm start
# Should see: 🚀 Proxy server running on http://localhost:3000
```

### Step 4: Configure & Run Mobile App
```bash
cd ../../example/demo-app

# Edit App.tsx - Update PROXY_BASE_URL if needed
# For physical devices: use your computer's IP (not localhost)

npm start
# Press 'i' for iOS, 'a' for Android, 'w' for web
```

### Step 5: Test
- Look for green dot (connected status)
- Send message: "Hello!"
- Watch streaming response

## 🔧 Command Reference

### Proxy Server Commands
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# Test connection
curl http://localhost:3000/health

# Create session
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user"}'
```

### Mobile App Commands
```bash
# Start Expo dev server
npm start

# Specific platforms
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run web       # Web browser

# Clear cache
expo start -c
```

### Google Cloud Commands
```bash
# Test Agent Engine connection
curl https://YOUR_AGENT_ENGINE_URL/list-apps \
  -H "Authorization: Bearer $(gcloud auth print-access-token)"

# View Cloud Run logs (if deployed)
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Deploy proxy to Cloud Run
gcloud run deploy adk-chat-proxy \
  --source packages/server \
  --platform managed \
  --region us-central1
```

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to proxy server"
**Symptoms:** Red dot, "Network request failed"

**Solutions:**
```bash
# 1. Check proxy is running
curl http://localhost:3000/health

# 2. Check firewall (macOS)
sudo pfctl -d  # Disable firewall temporarily

# 3. For physical devices, use IP not localhost
# Find your IP:
ipconfig getifaddr en0  # macOS/Linux
ipconfig                # Windows

# Update App.tsx:
const PROXY_BASE_URL = "http://192.168.1.100:3000";
```

### Issue: "Failed to create session"
**Symptoms:** Error on app start, no session ID

**Solutions:**
```bash
# 1. Check APP_NAME matches Agent Engine
curl https://YOUR_AGENT_ENGINE_URL/list-apps \
  -H "Authorization: Bearer $(gcloud auth print-access-token)"

# 2. Verify service account permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --filter="bindings.members:YOUR_SERVICE_ACCOUNT"

# 3. Check proxy server logs for specific error
```

### Issue: "Authentication failed"
**Symptoms:** 401/403 errors in proxy logs

**Solutions:**
```bash
# 1. Verify credentials file exists
ls -l $GOOGLE_APPLICATION_CREDENTIALS

# 2. Validate JSON format
cat $GOOGLE_APPLICATION_CREDENTIALS | jq .

# 3. Test credentials
gcloud auth activate-service-account \
  --key-file=$GOOGLE_APPLICATION_CREDENTIALS
```

### Issue: Messages don't stream
**Symptoms:** Entire response appears at once

**Solutions:**
- Try WiFi instead of mobile data (some carriers block streaming)
- Check proxy server logs for errors
- Verify Agent Engine supports streaming
- Test with curl to isolate issue

## 📡 API Quick Reference

### ProxyClient Methods

```typescript
import { ProxyClient } from '@react-native-adk-chat/client';

const client = new ProxyClient({ baseUrl: 'http://localhost:3000' });

// Check server health
const healthy = await client.checkHealth();
// Returns: boolean

// Create new session
const session = await client.createSession(userId);
// Returns: { output: { id: string }, status: string }

// Send message with streaming
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
    // Called when agent uses tools
    console.log('Tool:', toolName, status);
  }
);

// List user's sessions
const sessions = await client.listSessions(userId);
// Returns: { sessions: Session[] }
```

### Proxy Server Endpoints

**Base URL:** `http://localhost:3000` (dev) or `https://your-proxy.run.app` (prod)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/health` | - | `{"status":"ok"}` |
| POST | `/api/sessions` | `{"user_id":"string"}` | `{"output":{"id":"string"}}` |
| POST | `/api/chat` | `{"user_id":"string","session_id":"string","message":"string"}` | Streaming text |
| GET | `/api/sessions/:userId` | - | `{"sessions":[...]}` |

## 🔐 Environment Variables

### Proxy Server (.env)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `AGENT_ENGINE_URL` | ✅ | `https://project-region-agent-engine.a.run.app` | Your Agent Engine endpoint |
| `APP_NAME` | ✅ | `my-agent` | App name from ADK config |
| `GOOGLE_APPLICATION_CREDENTIALS` | ✅ | `/path/to/key.json` | Service account key path |
| `PORT` | ❌ | `3000` | Server port (default: 3000) |
| `DEBUG` | ❌ | `true` | Enable debug logging |

### Mobile App (App.tsx)

| Variable | Example | Description |
|----------|---------|-------------|
| `PROXY_BASE_URL` | `http://localhost:3000` | Proxy server URL |
| `DEFAULT_USER_ID` | `user_123` | Default user identifier |

## 📱 Component Quick Reference

### MessageBubble

```typescript
import { MessageBubble, type Message } from '@react-native-adk-chat/client';

const message: Message = {
  id: '123',
  role: 'user' | 'assistant',
  content: 'Message text',
  timestamp: new Date(),
  isLoading?: boolean,
  toolCalls?: ToolCall[],
};

<MessageBubble 
  message={message}
  userBubbleStyle={{ backgroundColor: '#007AFF' }}
  userTextStyle={{ color: '#FFF' }}
  aiBubbleStyle={{ backgroundColor: '#F0F0F0' }}
  aiTextStyle={{ color: '#000' }}
/>
```

### ChatInput

```typescript
import { ChatInput } from '@react-native-adk-chat/client';

<ChatInput
  value={input}
  onChangeText={setInput}
  onSend={handleSend}
  disabled={isLoading}
  placeholder="Type a message..."
  containerStyle={{ borderTopWidth: 1 }}
  inputStyle={{ fontSize: 16 }}
  sendButtonStyle={{ backgroundColor: '#007AFF' }}
/>
```

## 🚀 Production Deployment Checklist

### Proxy Server
- [ ] Deploy to Cloud Run, AWS Lambda, or similar
- [ ] Set up environment variables (no hardcoded secrets)
- [ ] Configure custom domain (optional)
- [ ] Enable HTTPS (automatic on Cloud Run)
- [ ] Set up monitoring and alerts
- [ ] Configure auto-scaling
- [ ] Test with production Agent Engine URL

### Mobile App
- [ ] Update `PROXY_BASE_URL` to production URL
- [ ] Implement real user authentication
- [ ] Add error tracking (Sentry, etc.)
- [ ] Add analytics (Firebase, Mixpanel, etc.)
- [ ] Test on real devices (iOS & Android)
- [ ] Submit to App Store / Play Store
- [ ] Set up beta testing groups

## 📊 Performance Tips

### Optimize Response Time
```typescript
// Use Gemini Flash for faster responses
// Configure in your ADK agent:
model: "gemini-2.5-flash"  // vs gemini-2.5-pro

// Add response caching
// Implement in proxy server for common queries
```

### Reduce Data Usage
```typescript
// Limit message history sent to agent
const recentMessages = messages.slice(-10);

// Compress large responses
// Enable gzip in proxy server:
app.use(compression());
```

### Improve UX
```typescript
// Show typing indicator immediately
setIsLoading(true);

// Add optimistic updates
setMessages(prev => [...prev, userMessage]);

// Implement retry logic
const sendWithRetry = async (message, maxRetries = 3) => { ... };
```

## 📚 Additional Resources

- **[Full Integration Guide](./AGENT_ENGINE_INTEGRATION.md)** - Detailed step-by-step guide
- **[ADK Documentation](https://google.github.io/adk-docs/)** - Official ADK docs
- **[Agent Engine Deployment](https://google.github.io/adk-docs/deploy/agent-engine/)** - Deploy your agent
- **[Expo Documentation](https://docs.expo.dev/)** - React Native with Expo
- **[Google Cloud Console](https://console.cloud.google.com/)** - Manage your project

## 🆘 Getting Help

1. **Check logs:**
   - Proxy server: Terminal where `npm start` is running
   - Mobile app: Expo dev tools console
   - Agent Engine: Cloud Run logs in GCP Console

2. **Test components:**
   - Proxy health: `curl http://localhost:3000/health`
   - Agent Engine: Use curl or Postman
   - Mobile app: Check connection indicator

3. **Ask for help:**
   - GitHub Issues: Report bugs or request features
   - Stack Overflow: Tag with `react-native`, `google-adk`
   - Google Cloud Support: For Agent Engine issues

## 💡 Pro Tips

- **Use environment variables** for all configuration
- **Test with curl first** before debugging mobile app
- **Enable debug logging** during development
- **Monitor token usage** in Google Cloud Console
- **Cache sessions** to reduce API calls
- **Implement offline mode** for better UX
- **Add retry logic** for network failures
- **Use TypeScript** for type safety
- **Version your API** for backward compatibility
- **Document your customizations** for future maintainers

---

**Quick Links:**
- [Main README](../README.md)
- [Integration Guide](./AGENT_ENGINE_INTEGRATION.md)
- [Troubleshooting](./AGENT_ENGINE_INTEGRATION.md#troubleshooting)