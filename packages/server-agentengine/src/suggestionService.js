/**
 * AI Suggestion Generation Service
 * Uses Gemini 1.5 Flash to generate structured diagnostic suggestions
 * with automatic source attribution from tool results
 *
 * Supports both Google AI (API key) and Vertex AI (ADC) authentication
 */

const { GoogleGenerativeAI, VertexAI } = require('@google/generative-ai');

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
 * @returns {boolean} True if initialization succeeded
 */
function initializeSuggestionService(config) {
  // Support both old API (string apiKey) and new API (config object)
  if (typeof config === 'string') {
    config = { apiKey: config };
  }

  const { apiKey, useVertexAI, project, location = 'us-central1' } = config || {};

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

    // Use Gemini 1.5 Flash for fast, cost-effective structured output
    model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

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
    const prompt = `You are a diagnostic assistant helping users troubleshoot technical issues.

The AI agent has asked the user: "${agentQuestion}"
${contextText}

Based on the agent's question and the available diagnostic data from tool calls, generate 3-5 helpful suggestion options that:
1. Are specific and actionable (not generic)
2. Are grounded in the diagnostic data when available
3. Include proper citations to the tool/field that supports each suggestion
4. Are ordered by relevance/confidence

For equipment state questions, suggest actual state values found in the diagnostic data.
For yes/no questions, provide clear options with supporting evidence.
For technical questions, provide options based on common diagnostic patterns.

Return your response as a JSON object matching the schema provided.`;

    // Generate suggestions using function calling
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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
  isQuestion,
  extractToolCalls
};
