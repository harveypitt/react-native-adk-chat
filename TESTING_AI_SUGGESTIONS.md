# Testing AI-Powered Suggestions

This guide walks you through testing the AI-powered suggestion generation feature end-to-end using the diagnostic agent example.

## Overview

The AI suggestions feature works by:
1. Agent calls diagnostic tools and asks follow-up questions
2. Proxy server detects questions in agent responses
3. Gemini 1.5 Flash analyzes the question and recent tool results
4. Structured suggestions are generated with source citations
5. Suggestions are sent to the client as SSE events
6. Demo app displays suggestions as interactive chips

## Prerequisites

- **GCP Project**: You need a Google Cloud project
- **ADK Installed**: Google ADK CLI tools installed
- **Gemini API**: Either Google AI API key OR Vertex AI access configured
- **Node.js & pnpm**: For running the proxy and demo app
- **Python 3.11+**: For deploying the diagnostic agent

## Step 1: Enable Suggestions Testing Mode

The example agent has a built-in toggle to enable diagnostic tools that trigger AI suggestions.

### 1.1 Enable the Testing Mode

Edit `example-agent/app/agent.py` and change the flag at the top:

```python
# Toggle AI-powered suggestions testing mode
ENABLE_SUGGESTIONS_TESTING = True  # Change from False to True
```

This will:
- Add diagnostic tools (`get_equipment_state`, `get_error_logs`) to the agent
- Update the agent instruction to ask follow-up questions
- Make the agent return structured JSON data that triggers AI suggestions

### 1.2 Deploy the Agent

Navigate to the example-agent directory and deploy:

```bash
cd example-agent

# Deploy to Cloud Run
adk deploy --app agent.py
```

Or deploy to Agent Engine:

```bash
adk deploy --app agent.py --engine agent-engine
```

Save the returned Cloud Run URL for later.

### 1.3 Test the Agent Directly

Verify diagnostic mode is working:

```bash
# Test with Cloud Run
curl -X POST "https://your-agent-xyz.run.app/run" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{
    "user_id": "test-user",
    "session_id": "test-session",
    "message": "Check the status of pump-1"
  }'
```

You should see the agent call `get_equipment_state` and ask a follow-up question like "What would you like to check next?"

## Step 2: Configure AI Suggestions in Proxy

### 2.1 Choose Authentication Mode

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

### 2.2 Configure Proxy Environment

From the **root directory** of react-native-adk-chat:

**For Cloud Run Agent:**

```bash
export CLOUD_RUN_URL="https://your-agent-xyz.run.app"
export DEFAULT_APP_NAME="app"
export ENABLE_AI_SUGGESTIONS=true
export GEMINI_API_KEY="your-api-key"  # Or use Vertex AI config
```

**For Agent Engine:**

```bash
export AGENT_ENGINE_URL="https://region-project-agent.a.run.app"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export ENABLE_AI_SUGGESTIONS=true
export GEMINI_API_KEY="your-api-key"  # Or use Vertex AI config
```

## Step 3: Run the Demo App with Proxy

### 3.1 Start Proxy and Demo App Together

From the root directory:

**For Cloud Run:**

```bash
pnpm demo:cloudrun
```

**For Agent Engine:**

```bash
pnpm demo:agentengine
```

This will start both:
- Proxy server on port 3000 (blue logs: `[PROXY]`)
- Demo app (magenta logs: `[DEMO_APP]`)

### 3.2 Verify AI Suggestions Are Enabled

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

### 3.3 Open the Demo App

Press `w` to open the web version in your browser, or:
- Press `i` for iOS simulator
- Press `a` for Android emulator

## Step 4: Test the Feature

### 4.1 Example Interaction Flow

**Scenario 1: Equipment State Check**

1. **User sends**: "Check the status of pump-1"

2. **Agent response**:
   - Calls `get_equipment_state` tool
   - Returns equipment data (e.g., status: "maintenance", state: "maintenance_mode")
   - Asks: "What is the current state of pump-1?"

3. **AI Suggestions appear** as chips:
   ```
   [Equipment is in maintenance mode] [Scheduled maintenance] [View error logs]
   ```
   Each suggestion includes confidence level and source attribution

4. **User clicks**: "Equipment is in maintenance mode"

5. **Agent continues** the diagnostic conversation

**Scenario 2: Error Log Investigation**

1. **User sends**: "Are there any errors for motor-2?"

2. **Agent response**:
   - Calls `get_error_logs` tool
   - Returns error data (e.g., 3 errors found: E503, W201, E404)
   - Asks: "Which error would you like to investigate first?"

3. **AI Suggestions appear**:
   ```
   [E503 - Motor overheating] [W201 - Temperature warning] [E404 - Sensor timeout]
   ```

4. **User clicks** a suggestion to continue

**Scenario 3: System Health Overview**

1. **User sends**: "What's the overall system status?"

2. **Agent response**:
   - Calls `get_system_health` tool
   - Returns system data (overall_status: "degraded", equipment_error: 1)
   - Asks: "The system status is degraded. Would you like to check individual equipment?"

3. **AI Suggestions appear**:
   ```
   [Yes, check equipment] [Show maintenance schedule] [View all alerts]
   ```

### 4.2 Expected UI Behavior

- **Suggestion chips appear** below agent messages that end with "?"
- **Chips are styled** with the ButtonGroup component
- **Confidence indicators** (if you add visual styling based on confidence level)
- **Source attribution** (visible in debug mode or tooltips)
- **Reasoning text** appears below chips: "💡 Based on equipment diagnostics..."
- **Clicking a chip** auto-sends the suggestion value as user message

### 4.3 Verify in Debug Logs

**Proxy logs:**
```
[PROXY] Detected question, generating AI suggestions: What is the current state...
[PROXY] Generated 3 AI suggestions
```

**Client logs (browser console):**
```javascript
App: Received suggestions: 3 options
```

## Step 5: Debugging

### 5.1 Enable Debug Mode

```bash
export DEBUG=true
pnpm demo:cloudrun
```

This shows detailed logs:
- Question detection
- Tool call extraction
- Gemini API requests/responses
- Suggestion generation results

### 5.2 Common Issues

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
- Verify tools are returning structured JSON
- Check conversation history is being tracked
- Enable DEBUG mode to see what data Gemini receives

**Issue: Agent not asking questions**

✅ **Agent instruction fix**:
The diagnostic agent is pre-configured to ask questions. If using a different agent, update its instruction to include:
```python
instruction="""
...
After calling tools, ask specific follow-up questions based on the data.
Frame questions to help users make decisions.
"""
```

### 5.3 Test Without Mobile App

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

## Step 6: Advanced Testing

### 6.1 Test Different Question Types

The system detects these question types:

**Yes/No Questions:**
```
Agent: "Is the equipment running normally?"
Expected: [Yes] [No] [Check error logs]
```

**Choice Questions:**
```
Agent: "Which equipment should I check: pump-1, motor-2, or compressor-1?"
Expected: [pump-1] [motor-2] [compressor-1]
```

**State Questions:**
```
Agent: "What is the current state?"
Expected: [normal_operation] [maintenance_mode] [fault]
```

**Numeric Questions:**
```
Agent: "How many errors occurred?"
Expected: [0 errors] [3 errors] [View logs]
```

### 6.2 Test with Complex Tool Results

Modify the diagnostic agent tools to return more complex data:

```python
def get_detailed_diagnostics(equipment_id: str) -> str:
    """Returns very detailed diagnostic data to test suggestion extraction."""
    return json.dumps({
        "equipment_id": equipment_id,
        "sensors": {
            "temperature": {"value": 78.5, "unit": "celsius", "status": "warning"},
            "pressure": {"value": 135.0, "unit": "psi", "status": "elevated"},
            "vibration": {"value": 2.3, "unit": "mm/s", "status": "normal"}
        },
        "recent_events": [
            {"time": "2025-12-29T10:15:00Z", "event": "temperature_spike"},
            {"time": "2025-12-29T09:30:00Z", "event": "pressure_increase"}
        ],
        "recommendations": [
            "Check cooling system",
            "Inspect pressure relief valve",
            "Monitor for next 2 hours"
        ]
    })
```

Verify suggestions reference nested fields like `sensors.temperature.value`.

### 6.3 Test Source Attribution

Enable detailed source display in the demo app to verify citations:

```tsx
{item.suggestions.suggestions.map((sug, idx) => (
  <View key={idx}>
    <Button title={sug.text} onPress={() => handleSuggestionPress(sug.value)} />
    {sug.source && (
      <Text style={styles.sourceText}>
        From: {sug.source.tool}.{sug.source.field}
      </Text>
    )}
  </View>
))}
```

### 6.4 Performance Testing

Monitor suggestion generation latency:

```bash
# Time how long suggestions take
time curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "session_id": "test", "message": "Check pump-1"}'
```

Expected latency: 1-2 seconds for suggestion generation (non-blocking)

## Step 7: Cleanup

After testing:

```bash
# Stop the demo app (Ctrl+C in terminal)

# Optional: Delete the deployed agent
gcloud run services delete your-diagnostic-agent --region=us-central1

# Optional: Disable AI suggestions
unset ENABLE_AI_SUGGESTIONS
unset GEMINI_API_KEY
```

## Verification Checklist

- [ ] Diagnostic agent deployed successfully
- [ ] Proxy shows "AI Suggestions: ENABLED" on startup
- [ ] Demo app loads without errors
- [ ] Agent asks questions after calling tools
- [ ] Suggestion chips appear below agent questions
- [ ] Chips contain relevant suggestions from tool data
- [ ] Clicking chips auto-sends the suggestion
- [ ] Reasoning text appears below chips
- [ ] Source attribution is included in suggestions
- [ ] Multiple suggestion types work (yes/no, choice, state)
- [ ] Suggestions are grounded in actual tool results

## Next Steps

After successful testing:

1. **Deploy to Production**: Use Vertex AI mode for enterprise auth
2. **Customize Agent**: Modify diagnostic_agent.py for your use case
3. **Add More Tools**: Create domain-specific diagnostic tools
4. **Enhance UI**: Style suggestion chips with confidence indicators
5. **Add Analytics**: Track which suggestions users select
6. **Improve Prompts**: Customize Gemini prompts for your domain

## Quick Start Summary

1. **Enable testing mode**: Set `ENABLE_SUGGESTIONS_TESTING = True` in `example-agent/app/agent.py`
2. **Deploy agent**: `cd example-agent && adk deploy --app agent.py`
3. **Configure proxy**: Export `ENABLE_AI_SUGGESTIONS=true` and `GEMINI_API_KEY=your-key`
4. **Run demo**: `pnpm demo:cloudrun` from repo root
5. **Test**: Send "Check pump-1 status" and watch suggestions appear

## Reference

- **AI Suggestions Docs**: See `AI_SUGGESTIONS.md` for detailed feature documentation
- **Agent Code**: `example-agent/app/agent.py` (see `ENABLE_SUGGESTIONS_TESTING` flag)
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
