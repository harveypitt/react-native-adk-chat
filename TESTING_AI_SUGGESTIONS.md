# Testing AI-Powered Suggestions

This guide shows you how to test AI-powered suggestion generation with any ADK agent.

## Overview

**AI suggestions is a proxy-side feature** - it works automatically with any agent that:
- Asks questions (responses ending with "?")
- Calls tools that return data

The proxy detects questions, analyzes recent tool results, and uses Gemini to generate contextual suggestions.

### How It Works

1. Your agent calls a tool and asks a follow-up question
2. Proxy server detects the question in the agent's response
3. Gemini 1.5 Flash analyzes the question and recent tool call results
4. Structured suggestions are generated with source citations
5. Suggestions are sent to the client as SSE events
6. Demo app displays suggestions as interactive chips

**No agent-side changes required** - just configure the proxy.

## Prerequisites

- **ADK Agent**: Any deployed agent (Cloud Run or Agent Engine)
- **Gemini API**: Either Google AI API key OR Vertex AI access
- **Node.js & pnpm**: For running the proxy and demo app

## Quick Start

### Step 1: Configure AI Suggestions

Choose your authentication mode for Gemini:

**Option A: Google AI (Development - Easier Setup)**

Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

```bash
export ENABLE_AI_SUGGESTIONS=true
export GEMINI_API_KEY="your-api-key-here"
```

**Option B: Vertex AI (Production - Enterprise Auth)**

```bash
export ENABLE_AI_SUGGESTIONS=true
export USE_VERTEX_AI=true
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"

# Configure Application Default Credentials
gcloud auth application-default login
```

### Step 2: Point to Your Agent

From the **root directory** of react-native-adk-chat:

**For Cloud Run agents:**

```bash
export CLOUD_RUN_URL="https://your-agent-xyz.run.app"
export DEFAULT_APP_NAME="app"
```

**For Agent Engine:**

```bash
export AGENT_ENGINE_URL="https://region-project-agent.a.run.app"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

### Step 3: Run the Demo App

Start the proxy and demo app:

```bash
# For Cloud Run agents
pnpm demo:cloudrun

# For Agent Engine
pnpm demo:agentengine
```

This starts both:
- Proxy server on port 3000 (blue logs: `[PROXY]`)
- Demo app (magenta logs: `[DEMO_APP]`)

**Verify AI Suggestions Are Enabled**

Look for this in the startup logs:

```
[PROXY] 🚀 ADK Cloud Run Proxy running on port 3000
[PROXY] 🤖 AI Suggestions: ENABLED
[PROXY] ✅ AI Suggestions: Initialized with Google AI (API key)
```

Or for Vertex AI:

```
[PROXY] ✅ AI Suggestions: Initialized with Vertex AI (project: my-project, location: us-central1)
```

Open the demo app by pressing `w` (web), `i` (iOS), or `a` (Android).

## Testing with Your Agent

The feature works automatically - just have your agent:
1. **Call tools** that return data
2. **Ask questions** based on tool results

**Example Flow:**

1. **User**: "What's the weather in SF?"
2. **Agent** (calls `get_weather` tool): "It's 60°F and foggy. Would you like to know the forecast?"
3. **AI Suggestions appear**: `[Yes, show forecast]` `[No thanks]` `[Check another city]`

### What Makes Good Suggestions?

**Best results when your agent:**
- Asks specific questions after calling tools
- Returns structured data (JSON) from tools
- References tool data in questions (e.g., "The temperature is 78°C. Is this normal?")

**Question types detected:**
- Yes/No: "Would you like to check more?"
- Choice: "Which option: A, B, or C?"
- State: "What is the current status?"
- Numeric: "How many errors occurred?"

### Expected UI Behavior

- **Suggestion chips appear** below agent messages that end with "?"
- **Chips are styled** with the ButtonGroup component
- **Confidence indicators** (if you add visual styling based on confidence level)
- **Source attribution** (visible in debug mode or tooltips)
- **Reasoning text** appears below chips: "💡 Based on..."
- **Clicking a chip** auto-sends the suggestion value as user message

## Debugging

### Enable Debug Mode

**Proxy logs:**
```
[PROXY] Detected question, generating AI suggestions: What is the current state...
[PROXY] Generated 3 AI suggestions
```

**Client logs (browser console):**
```javascript
App: Received suggestions: 3 options
```

```bash
export DEBUG=true
pnpm demo:cloudrun
```

Shows:
- Question detection
- Tool call extraction
- Gemini API requests/responses
- Suggestion generation results

### Common Issues

**Issue: No suggestions appearing**

✅ **Checks**:
1. Verify `ENABLE_AI_SUGGESTIONS=true` is set
2. Check proxy logs for "AI Suggestions: ENABLED"
3. Ensure agent response ends with "?" (question detection)
4. Verify Gemini API key is valid
5. Check browser console for suggestion events

**Issue: "API key invalid" errors**

✅ **Solution**:
```bash
# Verify API key is set
echo $GEMINI_API_KEY

# Get a new key from:
# https://aistudio.google.com/app/apikey
```

**Issue: Rate limit errors (429)**

✅ **Solution**:
- Free tier: 15 requests/minute
- Wait 60 seconds or upgrade to paid tier
- Or switch to Vertex AI mode (better limits)

**Issue: Suggestions not grounded in tool data**

✅ **Check**:
- Verify tools return structured data (JSON recommended)
- Enable DEBUG mode to see what Gemini receives
- Ensure agent asks questions that reference tool results

**Issue: Agent not asking questions**

✅ **Update agent instruction**:
```python
instruction="""
After calling tools, ask specific follow-up questions based on the data.
Frame questions to help users make decisions.
"""
```

### Test Without Mobile App

You can test the proxy directly with curl:

```bash
# Start a chat and watch for suggestions
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "session_id": "test-session",
    "message": "Check pump-1 status"
  }'
```

Look for SSE events with `"type": "suggestions"`:

```json
{
  "id": "suggestions-1735481234567",
  "type": "suggestions",
  "role": "system",
  "content": {
    "suggestions": [
      {
        "text": "Equipment is in maintenance mode",
        "value": "maintenance mode",
        "confidence": "high",
        "source": {
          "tool": "get_equipment_state",
          "field": "state"
        }
      }
    ],
    "reasoning": "Based on equipment diagnostics showing state='maintenance_mode'",
    "questionType": "state"
  }
}
```

## Quick Start Summary

1. **Configure proxy**: `export ENABLE_AI_SUGGESTIONS=true GEMINI_API_KEY=your-key`
2. **Point to agent**: `export CLOUD_RUN_URL=https://your-agent.run.app`
3. **Run demo**: `pnpm demo:cloudrun`
4. **Test**: Have your agent ask a question and watch suggestions appear

## Works With Any Agent

- ✅ Custom domain agents (diagnostics, customer support, data analysis)
- ✅ Agents with any tools that return data
- ✅ Multi-turn conversational agents
- ✅ Cloud Run or Agent Engine deployments

**No agent-side changes needed** - just configure the proxy.

## Reference

- **AI Suggestions Docs**: `AI_SUGGESTIONS.md` for detailed feature documentation
- **Proxy Implementation**: `packages/server-*/src/suggestionService.js`
- **Client Integration**: `example/demo-app/App.tsx`

## Troubleshooting Resources

- **Gemini API Status**: https://status.cloud.google.com/products/generative-ai
- **ADK Documentation**: https://cloud.google.com/agent-development-kit
- **React Native Debugger**: Use Chrome DevTools for debugging the demo app
- **Proxy Logs**: Color-coded logs with `[PROXY]` prefix show all suggestion activity

---

**Questions or Issues?**

Open an issue on GitHub with:
- Proxy startup logs
- Browser console logs
- Example message that didn't trigger suggestions
- Environment configuration (without API keys)
