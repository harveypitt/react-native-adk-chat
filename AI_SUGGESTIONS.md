# AI-Powered Suggestion Generation

This feature adds intelligent, context-aware suggestion generation to ADK chat applications using Google's Gemini 1.5 Flash model with function calling capabilities.

## Overview

When enabled, the proxy server monitors agent responses for diagnostic questions and automatically generates structured suggestion options with source attribution from tool results. This helps users navigate diagnostic workflows more efficiently by providing:

- **Intelligent Options**: Context-aware suggestions based on conversation history and tool results
- **Source Attribution**: Each suggestion includes citations to the specific tool calls and data fields that support it
- **Confidence Scoring**: High/medium/low confidence levels help users make informed choices
- **Question Type Detection**: Automatically identifies question types (yes/no, choice, state, numeric, etc.)

## Architecture

```
Agent asks question ("What is the equipment state?")
    ↓
Proxy detects question in SSE stream
    ↓
Gemini 1.5 Flash analyzes:
  - Agent's question
  - Recent tool call results (e.g., get_equipment_state)
  - Conversation context
    ↓
Generates structured suggestions with citations
    ↓
Sends suggestions as SSE event to client
```

## Setup

### 1. Choose Authentication Method

**Google AI (API Key)** - Recommended for Development
- ✅ Quick setup with API key
- ✅ Free tier: 15 requests/min, 1M tokens/day
- ❌ Not recommended for production (API key exposure risk)
- Get your key: [Google AI Studio](https://aistudio.google.com/app/apikey)

**Vertex AI (ADC)** - Recommended for Production
- ✅ Enterprise-grade security with service accounts
- ✅ Better rate limits and SLAs
- ✅ Integrated with GCP IAM
- ❌ Requires GCP project setup
- Setup: [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)

### 2. Configure Your Proxy

**Option A: Using create-adk-chat-app CLI**

When creating or reconfiguring an app, you'll be prompted:
```bash
npx create-adk-chat-app my-app
# or
npx create-adk-chat-app --reconfigure
```

Answer "yes" to "Enable AI-powered suggestion generation?" and provide your API key.

**Option B: Manual Configuration - Google AI (Development)**

Add to your proxy server's `.env` file:
```bash
ENABLE_AI_SUGGESTIONS=true
GEMINI_API_KEY=your-api-key-here  # From https://aistudio.google.com/app/apikey
```

**Option C: Manual Configuration - Vertex AI (Production)**

Add to your proxy server's `.env` file:
```bash
ENABLE_AI_SUGGESTIONS=true
USE_VERTEX_AI=true
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1  # Optional, defaults to us-central1
```

Then configure Application Default Credentials:
```bash
# Option 1: User credentials (development)
gcloud auth application-default login

# Option 2: Service account (production)
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### 3. Start Your Proxy

The proxy will log the AI suggestions status on startup:

**Google AI mode:**
```
🚀 ADK Cloud Run Proxy running on port 3000
☁️  Cloud Run URL: https://your-agent.run.app
📦 Default App: MBS
🔧 Debug mode: OFF
🤖 AI Suggestions: ENABLED
✅ AI Suggestions: Initialized with Google AI (API key)
```

**Vertex AI mode:**
```
🚀 ADK Cloud Run Proxy running on port 3000
☁️  Cloud Run URL: https://your-agent.run.app
📦 Default App: MBS
🔧 Debug mode: OFF
🤖 AI Suggestions: ENABLED
✅ AI Suggestions: Initialized with Vertex AI (project: my-project, location: us-central1)
```

## How It Works

### Question Detection

The system automatically detects when the agent asks a question by checking if the response:
- Ends with a question mark (`?`)
- Starts with question words (what, which, how, etc.)

### Suggestion Generation

When a question is detected, Gemini 1.5 Flash:

1. **Analyzes the question**: Determines question type and intent
2. **Extracts context**: Reviews recent tool call results
3. **Generates options**: Creates 3-5 specific, actionable suggestions
4. **Adds citations**: Links each suggestion to supporting data

### Example Flow

**Agent asks**: "What is the current state of the equipment?"

**Tool results available**:
```json
{
  "tool": "get_equipment_state",
  "response": {
    "state": "maintenance",
    "since": "2025-12-28T10:00:00Z",
    "reason": "scheduled_maintenance"
  }
}
```

**Generated suggestions**:
```json
{
  "suggestions": [
    {
      "text": "Equipment is in maintenance mode",
      "value": "maintenance mode",
      "confidence": "high",
      "source": {
        "tool": "get_equipment_state",
        "field": "state"
      }
    },
    {
      "text": "Scheduled maintenance (since 2025-12-28)",
      "value": "scheduled maintenance",
      "confidence": "high",
      "source": {
        "tool": "get_equipment_state",
        "field": "reason"
      }
    }
  ],
  "reasoning": "Based on diagnostic data showing equipment state='maintenance' with reason='scheduled_maintenance'",
  "questionType": "state"
}
```

## SSE Event Format

Suggestions are sent as Server-Sent Events with this structure:

```typescript
{
  id: string;              // Unique event ID (e.g., "suggestions-1735481234567")
  type: "suggestions";     // Event type
  role: "system";          // Always "system" for suggestions
  invocationId?: string;   // Original message invocation ID
  content: {
    suggestions: Array<{
      text: string;        // Display text for the user
      value: string;       // Value to send if selected
      confidence: "high" | "medium" | "low";
      source?: {           // Citation (if available)
        tool: string;      // Tool name
        field: string;     // Field from tool response
      }
    }>,
    reasoning: string;     // Why these suggestions were generated
    questionType: string;  // Question classification
  },
  timestamp: string;       // ISO 8601 timestamp
}
```

## Client Integration

### Detecting Suggestion Events

```typescript
// In your SSE stream handler
const handleSSE = (event: any) => {
  if (event.type === 'suggestions') {
    const { suggestions, reasoning, questionType } = event.content;
    // Render suggestion buttons/chips
    renderSuggestions(suggestions);
  }
};
```

### Rendering Suggestions

```tsx
// Example React Native component
const SuggestionChips = ({ suggestions }) => (
  <View style={styles.chipContainer}>
    {suggestions.map((suggestion, idx) => (
      <Chip
        key={idx}
        text={suggestion.text}
        confidence={suggestion.confidence}
        source={suggestion.source}
        onPress={() => sendMessage(suggestion.value)}
      />
    ))}
  </View>
);
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_AI_SUGGESTIONS` | No | `false` | Enable/disable AI suggestions |
| `USE_VERTEX_AI` | No | `false` | Use Vertex AI instead of Google AI |
| `GEMINI_API_KEY` | Conditional* | - | Google AI API key (*required if Google AI mode) |
| `GOOGLE_CLOUD_PROJECT` | Conditional** | - | GCP project ID (**required if Vertex AI mode) |
| `GOOGLE_CLOUD_LOCATION` | No | `us-central1` | GCP location for Vertex AI |
| `DEBUG` | No | `false` | Enable debug logging for suggestions |

### Model Configuration

The service uses Gemini 1.5 Flash with:
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Response Format**: JSON (structured output mode)
- **Max Suggestions**: 3-5 per question

## Cost Considerations

**Gemini 1.5 Flash Pricing** (as of Dec 2025):
- Free tier: 15 requests/minute, 1M tokens/day
- Paid tier: $0.075 per 1M input tokens, $0.30 per 1M output tokens

**Typical Usage**:
- Per question: ~500 input tokens + ~200 output tokens
- Cost per 1000 questions: ~$0.10
- Free tier supports ~1000 questions/day

## Question Types

The service automatically classifies questions:

| Type | Examples | Use Case |
|------|----------|----------|
| `yes_no` | "Is the equipment running?" | Binary choices |
| `choice` | "Which mode should I select?" | Multiple options |
| `state` | "What is the current state?" | Equipment/system states |
| `numeric` | "How many errors occurred?" | Numeric values |
| `open_ended` | "What happened?" | Free-form responses |

## Debugging

Enable debug logging to see suggestion generation details:

```bash
DEBUG=true ENABLE_AI_SUGGESTIONS=true npm start
```

Debug output includes:
```
Detected question, generating AI suggestions: What is the equipment...
Generated 3 AI suggestions
```

## Limitations

1. **Question Detection**: Only triggers on messages ending with `?` or starting with question words
2. **Context Window**: Uses only recent conversation history (not full session)
3. **Tool Results**: Only extracts from function responses (not all event types)
4. **Rate Limits**: Subject to Gemini API rate limits (15 req/min free tier)
5. **Latency**: Adds ~1-2s delay for suggestion generation (non-blocking)

## Troubleshooting

**No suggestions appearing**:
- Check `ENABLE_AI_SUGGESTIONS=true` is set
- Verify `GEMINI_API_KEY` is valid
- Ensure agent response ends with `?`
- Check proxy logs for errors

**Rate limit errors**:
- Reduce suggestion frequency
- Upgrade to paid Gemini tier
- Add request throttling

**Poor suggestion quality**:
- Ensure tool results contain relevant data
- Check conversation history is being tracked
- Verify question is clear and specific

## Example Use Cases

### Diagnostic Workflows
```
Agent: "What is the error code?"
Suggestions: ["E404", "E500", "E503"] (from recent error logs)
```

### Equipment States
```
Agent: "Is the pump running?"
Suggestions: ["Yes, running normally", "No, in maintenance mode"] (from get_pump_state)
```

### Troubleshooting Steps
```
Agent: "What should I check next?"
Suggestions: ["Check power supply", "Verify connections", "Reset system"] (from diagnostic history)
```

## Future Enhancements

Potential improvements:
- Custom prompt templates per agent type
- User feedback loop for suggestion quality
- Multi-turn conversation memory
- Integration with ADK session state
- Suggestion caching for common questions

## Support

For issues or questions:
- GitHub Issues: [react-native-adk-chat/issues](https://github.com/your-org/react-native-adk-chat/issues)
- Documentation: See CLAUDE.md for monorepo details
- Gemini API: [Google AI Documentation](https://ai.google.dev/gemini-api/docs)
