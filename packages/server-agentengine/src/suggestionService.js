/**
 * AI Suggestion Generation Service
 * Uses Gemini 3 Flash Preview to generate structured diagnostic suggestions
 * with automatic source attribution from tool results
 *
 * Supports both Google AI (API key) and Vertex AI (ADC) authentication
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Gemini client
let genAI = null;
let model = null;
let authMode = null; // 'api-key' or 'vertex-ai'

/**
 * Initialize the suggestion service
 * Supports both Google AI (API key) and Vertex AI (ADC) modes
 *
 * @param {Object} config - Configuration object
 * @param {string} config.apiKey - Google AI API key (for Google AI mode)
 * @param {boolean} config.useVertexAI - Use Vertex AI instead of Google AI
 * @param {string} config.project - GCP project ID (for Vertex AI mode)
 * @param {string} config.location - GCP location (for Vertex AI mode, default: us-central1)
 * @param {string} config.model - Gemini model to use (default: gemini-3-flash-preview)
 * @returns {boolean} True if initialization succeeded
 */
function initializeSuggestionService(config) {
  // Support both old API (string apiKey) and new API (config object)
  if (typeof config === 'string') {
    config = { apiKey: config };
  }

  const { apiKey, useVertexAI, project, location = 'us-central1', model: modelName = 'gemini-3-flash-preview' } = config || {};

  try {
    if (useVertexAI) {
      // Vertex AI mode - uses Application Default Credentials
      if (!project) {
        console.error('❌ AI Suggestions: Vertex AI mode requires GOOGLE_CLOUD_PROJECT');
        return false;
      }

      genAI = new VertexAI({
        project,
        location
      });

      authMode = 'vertex-ai';
      console.log(`✅ AI Suggestions: Initialized with Vertex AI (project: ${project}, location: ${location})`);
    } else {
      // Google AI mode - uses API key
      if (!apiKey) {
        console.warn('⚠️  AI Suggestions: No API key provided, suggestions will be disabled');
        return false;
      }

      genAI = new GoogleGenerativeAI(apiKey);
      authMode = 'api-key';
      console.log('✅ AI Suggestions: Initialized with Google AI (API key)');
    }

    // Use Gemini 3 Flash Preview for fast, cost-effective structured output
    // Note: Schema will be set per-request in generateSuggestions
    model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
      },
    });

    console.log(`   Using model: ${modelName}`);

    return true;
  } catch (error) {
    console.error('❌ AI Suggestions: Failed to initialize:', error.message);
    return false;
  }
}

/**
 * Check if service is enabled
 */
function isEnabled() {
  return model !== null;
}

/**
 * Get current authentication mode
 * @returns {string|null} 'api-key', 'vertex-ai', or null if not initialized
 */
function getAuthMode() {
  return authMode;
}

/**
 * Extract tool calls and their responses from conversation history
 * @param {Array} conversationHistory - Array of conversation events
 * @returns {Array} Array of tool calls with responses
 */
function extractToolCalls(conversationHistory) {
  const toolCalls = [];

  for (const event of conversationHistory) {
    if (!event.content || !event.content.parts) continue;

    for (const part of event.content.parts) {
      // Look for function responses (completed tool calls)
      if (part.functionResponse) {
        const { name, response } = part.functionResponse;
        toolCalls.push({
          name,
          response: response || {}
        });
      }
    }
  }

  return toolCalls;
}

/**
 * Generate diagnostic suggestions based on agent question and context
 * @param {string} agentQuestion - The question asked by the agent
 * @param {Array} conversationHistory - Recent conversation events
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Structured suggestions with citations
 */
async function generateSuggestions(agentQuestion, conversationHistory = [], options = {}) {
  if (!isEnabled()) {
    return null;
  }

  try {
    // Extract tool calls from conversation history
    const toolCalls = extractToolCalls(conversationHistory);

    // Build context from tool results
    let contextText = '';
    if (toolCalls.length > 0) {
      contextText += '\n\nRecent diagnostic information from tools:\n';
      toolCalls.forEach((tool, idx) => {
        contextText += `\n${idx + 1}. Tool: ${tool.name}\n`;
        contextText += `   Response: ${JSON.stringify(tool.response, null, 2)}\n`;
      });
    }

    // Define the schema for structured output
    const schema = {
      type: 'object',
      properties: {
        suggestions: {
          type: 'array',
          description: 'Array of suggestion options for the user',
          items: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'The suggestion text to display to the user'
              },
              value: {
                type: 'string',
                description: 'The actual value to send if user selects this option'
              },
              confidence: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: 'Confidence level for this suggestion'
              },
              source: {
                type: 'object',
                description: 'Citation information for this suggestion',
                properties: {
                  tool: {
                    type: 'string',
                    description: 'Name of the tool that provided supporting data'
                  },
                  field: {
                    type: 'string',
                    description: 'Specific field from tool response that supports this suggestion'
                  }
                }
              }
            },
            required: ['text', 'value']
          }
        },
        reasoning: {
          type: 'string',
          description: 'Brief explanation of why these suggestions were generated'
        }
      },
      required: ['suggestions']
    };

    // Construct the prompt
    const prompt = `You are a helpful assistant generating follow-up action suggestions for users.

The AI agent's last message was: "${agentQuestion}"
${contextText}

Based on the agent's message and context, generate 3-5 helpful suggestion options that represent natural next steps or responses the user might want to take:
1. Are specific and actionable (not generic like "tell me more")
2. Are grounded in the diagnostic data when available
3. Include proper citations to the tool/field that supports each suggestion
4. Are ordered by relevance/confidence

For each suggestion:
- "text" should be a short, user-friendly display label (2-6 words)
- "value" should be the FULL TEXT MESSAGE that will be sent when the user clicks this option (complete sentence or answer)

Examples:
- If agent asks a question: text="Yes", value="Yes, that's correct"
- If agent provides info: text="Tell me more", value="Can you tell me more about this?"
- For equipment diagnostics: text="Check power supply", value="I want to check the power supply connection"
- For status updates: text="What's next?", value="What should I do next?"

IMPORTANT: The "value" field must ALWAYS be the complete text message to send, NOT a number or ID.

Return your response as a JSON object with suggestions and reasoning.`;

    // Generate suggestions with structured output
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    // Handle response - different structure for Google AI vs Vertex AI
    let text;
    if (typeof result.response?.text === 'function') {
      // Google AI SDK - response.text() is a function
      const response = await result.response;
      text = response.text();
    } else if (result.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      // Vertex AI SDK - direct property access
      text = result.response.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Unable to extract text from model response');
    }

    // Parse JSON response
    const suggestions = JSON.parse(text);

    return {
      ...suggestions,
      questionType: detectQuestionType(agentQuestion),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ AI Suggestions: Failed to generate:', error.message);
    return null;
  }
}

/**
 * Detect the type of question being asked
 * @param {string} question - The question text
 * @returns {string} Question type
 */
function detectQuestionType(question) {
  const lowerQ = question.toLowerCase();

  if (lowerQ.includes('yes') && lowerQ.includes('no')) {
    return 'yes_no';
  }
  if (lowerQ.includes('what') || lowerQ.includes('which')) {
    return 'choice';
  }
  if (lowerQ.includes('how many') || lowerQ.includes('number')) {
    return 'numeric';
  }
  if (lowerQ.includes('state') || lowerQ.includes('status')) {
    return 'state';
  }

  return 'open_ended';
}

/**
 * Check if a message appears to be a question
 * @param {string} text - Message text
 * @returns {boolean}
 */
function isQuestion(text) {
  if (!text) return false;

  const trimmed = text.trim();

  // Ends with question mark
  if (trimmed.endsWith('?')) return true;

  // Starts with question words
  const questionWords = ['what', 'which', 'where', 'when', 'who', 'whom', 'whose', 'why', 'how', 'is', 'are', 'can', 'could', 'would', 'should', 'do', 'does', 'did'];
  const firstWord = trimmed.split(/\s+/)[0].toLowerCase();

  return questionWords.includes(firstWord);
}

module.exports = {
  initializeSuggestionService,
  isEnabled,
  getAuthMode,
  generateSuggestions,
  extractToolCalls
};
