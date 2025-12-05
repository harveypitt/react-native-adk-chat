# Setup Checklist - React Native ADK Chat

Use this checklist to track your progress integrating React Native ADK Chat with your Agent Engine deployment.

## ✅ Prerequisites

- [ ] Agent deployed to Google Cloud Agent Engine
- [ ] Agent Engine URL obtained (e.g., `https://project-region-agent-engine.a.run.app`)
- [ ] App name from ADK configuration noted
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git installed
- [ ] iOS Simulator or Android Emulator or Expo Go app ready

## ✅ Google Cloud Setup

- [ ] Created service account: `adk-chat-mobile`
- [ ] Granted `roles/aiplatform.user` permission to service account
- [ ] Downloaded service account key JSON file
- [ ] Saved key to secure location: `~/.gcp/adk-chat-mobile-key.json`
- [ ] Set file permissions: `chmod 600 ~/.gcp/adk-chat-mobile-key.json`
- [ ] Verified Agent Engine deployment is active

## ✅ Repository Setup

- [ ] Cloned repository: `git clone https://github.com/your-username/react-native-adk-chat.git`
- [ ] Navigated to directory: `cd react-native-adk-chat`
- [ ] Installed root dependencies: `pnpm install` or `npm install`

## ✅ Proxy Server Configuration

- [ ] Navigated to server: `cd packages/server`
- [ ] Copied environment file: `cp .env.example .env`
- [ ] Set `AGENT_ENGINE_URL` in `.env`
- [ ] Set `APP_NAME` in `.env`
- [ ] Set `GOOGLE_APPLICATION_CREDENTIALS` with absolute path in `.env`
- [ ] Set `PORT=3000` in `.env`
- [ ] Installed server dependencies: `npm install`

## ✅ Proxy Server Testing

- [ ] Started proxy server: `npm start`
- [ ] Verified startup message shows correct Agent Engine URL
- [ ] Tested health endpoint: `curl http://localhost:3000/health`
- [ ] Got response: `{"status":"ok"}`
- [ ] Created test session: `curl -X POST http://localhost:3000/api/sessions -H "Content-Type: application/json" -d '{"user_id":"test"}'`
- [ ] Got session ID in response
- [ ] Proxy server terminal shows no errors

## ✅ Mobile App Configuration

- [ ] Navigated to demo app: `cd example/demo-app` (from project root)
- [ ] Opened `App.tsx` in editor
- [ ] Updated `PROXY_BASE_URL` (use IP address if testing on physical device)
- [ ] Updated `DEFAULT_USER_ID` (optional)
- [ ] Saved changes

### If Testing on Physical Device:
- [ ] Found computer's IP address: `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows)
- [ ] Updated `PROXY_BASE_URL` to `http://YOUR_IP:3000`
- [ ] Ensured phone and computer on same WiFi network
- [ ] Tested proxy accessibility from phone's browser

## ✅ Mobile App Launch

- [ ] Installed demo app dependencies: `npm install` (from `example/demo-app`)
- [ ] Started Expo: `npm start`
- [ ] QR code appeared in terminal
- [ ] Opened app (pressed `i` for iOS, `a` for Android, or scanned QR code)
- [ ] App loaded without errors

## ✅ Integration Testing

- [ ] App shows green dot (connected status)
- [ ] Typed test message: "Hello!"
- [ ] Pressed send button
- [ ] Message appeared in chat as user message
- [ ] AI response started streaming character-by-character
- [ ] Response completed successfully
- [ ] Tried "New Chat" button
- [ ] New session created successfully
- [ ] Sent another message in new session
- [ ] Received response

## ✅ Optional Enhancements

- [ ] Customized message bubble colors
- [ ] Customized chat input styling
- [ ] Added user authentication
- [ ] Implemented message persistence with AsyncStorage
- [ ] Added error tracking (Sentry, etc.)
- [ ] Added analytics (Firebase, Mixpanel, etc.)
- [ ] Set up offline mode handling

## ✅ Production Preparation

### Proxy Server Deployment
- [ ] Chose hosting platform (Cloud Run, AWS Lambda, etc.)
- [ ] Set up environment variables in production
- [ ] Deployed proxy server
- [ ] Got production URL
- [ ] Tested production endpoints
- [ ] Set up monitoring and alerts

### Mobile App Production
- [ ] Updated `PROXY_BASE_URL` to production URL
- [ ] Tested with production proxy
- [ ] Installed EAS CLI: `npm install -g eas-cli`
- [ ] Logged in to Expo: `eas login`
- [ ] Configured build: `eas build:configure`
- [ ] Created production builds
- [ ] Tested builds on physical devices
- [ ] Submitted to App Store / Play Store

## 🐛 Troubleshooting Checks

If something isn't working, verify:

- [ ] Proxy server is running (terminal should show "Proxy server running")
- [ ] No errors in proxy server logs
- [ ] Agent Engine URL is correct and accessible
- [ ] Service account has correct permissions
- [ ] Service account key file path is absolute (not relative)
- [ ] `APP_NAME` matches exactly (case-sensitive)
- [ ] Firewall allows connections on port 3000
- [ ] For physical devices: using IP address (not localhost)
- [ ] Phone and computer on same network (for physical device testing)

## 📝 Notes

**Agent Engine URL:**
```
_______________________________________________
```

**App Name:**
```
_______________________________________________
```

**Service Account Email:**
```
_______________________________________________
```

**Production Proxy URL:**
```
_______________________________________________
```

**Computer IP Address (for device testing):**
```
_______________________________________________
```

---

## Quick Command Reference

```bash
# Start proxy server (keep running)
cd packages/server && npm start

# Start mobile app (in new terminal)
cd example/demo-app && npm start

# Test proxy health
curl http://localhost:3000/health

# View proxy logs (if deployed to Cloud Run)
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Find your IP address
ipconfig getifaddr en0  # macOS
ipconfig                # Windows
```

---

**Date Completed:** _______________

**Tested By:** _______________

**Production URL:** _______________