require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const app = express();
app.use(cors());
app.use(express.json());

const CLOUD_RUN_URL = process.env.CLOUD_RUN_URL;
const DEFAULT_APP_NAME = process.env.DEFAULT_APP_NAME;
const DEBUG = process.env.DEBUG === 'true';

// Cache for the access token
let tokenCache = {
  token: null,
  expiresAt: 0
};

/**
 * Get access token using gcloud CLI
 * Tokens are cached and refreshed when expired
 */
async function getAccessToken() {
  const now = Date.now();

  // Return cached token if still valid (with 60s buffer)
  if (tokenCache.token && tokenCache.expiresAt > now + 60000) {
    if (DEBUG) console.log('Using cached access token');
    return tokenCache.token;
  }

  try {
    if (DEBUG) console.log('Fetching new access token via gcloud...');
    const { stdout } = await execAsync('gcloud auth print-access-token');
    const token = stdout.trim();

    // Cache token for 55 minutes (tokens typically expire in 60 minutes)
    tokenCache = {
      token,
      expiresAt: now + 55 * 60 * 1000
    };

    return token;
  } catch (error) {
    console.error('Failed to get access token:', error.message);
    throw new Error('Failed to authenticate with gcloud. Ensure gcloud CLI is installed and authenticated.');
  }
}

/**
 * Make an authenticated request to Cloud Run
 */
async function cloudRunFetch(path, options = {}) {
  const token = await getAccessToken();
  const url = `${CLOUD_RUN_URL}${path}`;

  if (DEBUG) console.log(`Cloud Run request: ${options.method || 'GET'} ${url}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  return response;
}

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cloudRunUrl: CLOUD_RUN_URL ? 'configured' : 'not configured',
    defaultAppName: DEFAULT_APP_NAME || 'not configured'
  });
});

// List available apps/agents
app.get('/apps', async (req, res) => {
  try {
    const response = await cloudRunFetch('/list-apps');

    if (!response.ok) {
      const error = await response.text();
      console.error('Error listing apps:', error);
      return res.status(response.status).json({ error });
    }

    const apps = await response.json();
    res.json({ apps });
  } catch (error) {
    console.error('Error listing apps:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  return `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new session
app.post('/sessions/create', async (req, res) => {
  try {
    const { user_id, app_name, state } = req.body;
    // Auto-generate session_id if not provided
    const session_id = req.body.session_id || generateSessionId();
    const appName = app_name || DEFAULT_APP_NAME;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    if (!appName) {
      return res.status(400).json({ error: 'app_name is required (or set DEFAULT_APP_NAME env var)' });
    }

    console.log(`Creating session - App: ${appName}, User: ${user_id}, Session: ${session_id}`);

    const response = await cloudRunFetch(
      `/apps/${appName}/users/${user_id}/sessions/${session_id}`,
      {
        method: 'POST',
        body: JSON.stringify(state || {})
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Error from Cloud Run:', error);
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    console.log(`Session created: ${session_id}`);

    // Normalize response to match Agent Engine proxy format
    res.json({
      output: {
        id: data.id,
        session_id: data.id,
        user_id: data.userId,
        app_name: data.appName,
        state: data.state,
        events: data.events,
        last_update_time: data.lastUpdateTime
      }
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get an existing session
app.post('/sessions/get', async (req, res) => {
  try {
    const { user_id, session_id, app_name } = req.body;
    const appName = app_name || DEFAULT_APP_NAME;

    if (!user_id || !session_id) {
      return res.status(400).json({ error: 'user_id and session_id are required' });
    }

    if (!appName) {
      return res.status(400).json({ error: 'app_name is required (or set DEFAULT_APP_NAME env var)' });
    }

    console.log(`Getting session - App: ${appName}, User: ${user_id}, Session: ${session_id}`);

    const response = await cloudRunFetch(
      `/apps/${appName}/users/${user_id}/sessions/${session_id}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Error from Cloud Run:', error);
      return res.status(response.status).json({ error });
    }

    const data = await response.json();

    // Normalize response
    res.json({
      output: {
        id: data.id,
        session_id: data.id,
        user_id: data.userId,
        app_name: data.appName,
        state: data.state,
        events: data.events,
        last_update_time: data.lastUpdateTime
      }
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a session
app.post('/sessions/delete', async (req, res) => {
  try {
    const { user_id, session_id, app_name } = req.body;
    const appName = app_name || DEFAULT_APP_NAME;

    if (!user_id || !session_id) {
      return res.status(400).json({ error: 'user_id and session_id are required' });
    }

    if (!appName) {
      return res.status(400).json({ error: 'app_name is required (or set DEFAULT_APP_NAME env var)' });
    }

    console.log(`Deleting session - App: ${appName}, User: ${user_id}, Session: ${session_id}`);

    const response = await cloudRunFetch(
      `/apps/${appName}/users/${user_id}/sessions/${session_id}`,
      { method: 'DELETE' }
    );

    // DELETE returns 204 No Content on success
    if (response.status === 204 || response.ok) {
      console.log(`Session deleted: ${session_id}`);
      res.json({ success: true });
    } else {
      const error = await response.text();
      console.error('Error from Cloud Run:', error);
      res.status(response.status).json({ error });
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stream chat query to agent
app.post('/chat', async (req, res) => {
  try {
    const { user_id, session_id, message, app_name, streaming = true } = req.body;
    const appName = app_name || DEFAULT_APP_NAME;

    if (!user_id || !message) {
      return res.status(400).json({ error: 'user_id and message are required' });
    }

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    if (!appName) {
      return res.status(400).json({ error: 'app_name is required (or set DEFAULT_APP_NAME env var)' });
    }

    console.log(`Chat request - App: ${appName}, User: ${user_id}, Session: ${session_id}, Message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);

    // Build the request body for Cloud Run
    const requestBody = {
      app_name: appName,
      user_id,
      session_id,
      new_message: {
        role: 'user',
        parts: [{ text: message }]
      },
      streaming
    };

    const response = await cloudRunFetch('/run_sse', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error from Cloud Run:', error);
      return res.status(response.status).json({ error });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Stream the response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // Track ALL text we've sent to the client (simple approach)
    // Cloud Run accumulates text across invocations, so we just check
    // if we've already sent this exact text before
    let allSentText = '';

    // Buffer for incomplete SSE data that may span multiple chunks
    let sseBuffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (DEBUG) console.log('Stream completed');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        sseBuffer += chunk;

        // Process complete SSE messages (they end with \n\n or \n)
        // Split on newlines and process complete "data:" lines
        const lines = sseBuffer.split('\n');

        // Keep the last line in buffer if it doesn't end with newline (incomplete)
        if (!sseBuffer.endsWith('\n')) {
          sseBuffer = lines.pop() || '';
        } else {
          sseBuffer = '';
        }

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) {
            continue;
          }

          const jsonStr = trimmed.slice(6); // Remove "data: " prefix
          if (!jsonStr) continue;

          let data;
          try {
            data = JSON.parse(jsonStr);
          } catch (parseError) {
            // JSON might be split across chunks, skip for now
            if (DEBUG) console.warn('Skipping incomplete JSON:', jsonStr.substring(0, 50) + '...');
            continue;
          }

          const invocationId = data.invocationId || 'default';

          // Check if this event has text content
          let currentFullText = '';
          let hasTextContent = false;
          if (data.content && data.content.parts) {
            for (const part of data.content.parts) {
              if (part.text) {
                currentFullText += part.text;
                hasTextContent = true;
              }
            }
          }

          if (hasTextContent) {
            // Cloud Run streaming pattern:
            // - Events with partial:true contain delta text (new text only)
            // - Final event (no partial flag) contains FULL accumulated text
            // So we only forward partial events and skip the final one

            const isPartial = data.partial === true;

            if (isPartial) {
              // Partial events contain delta text - forward as-is
              const deltaText = currentFullText;

              // Update tracking
              allSentText += deltaText;

              // Forward the delta
              const deltaEvent = {
                ...data,
                content: {
                  ...data.content,
                  parts: [{ text: deltaText }]
                }
              };
              res.write(JSON.stringify(deltaEvent) + '\n');
            } else {
              // Final event (not partial) - skip to avoid duplication
              // The partial events already sent all the text
              if (DEBUG) console.log('Skipping final text event (already sent via partials)');
            }
          } else {
            // No text content (e.g., function calls) - skip for now
            // TODO: Forward function calls when UI supports them
            if (DEBUG) console.log('Skipping non-text event (function call, etc.)');
          }
        }
      }
    } catch (streamError) {
      console.error('Error during streaming:', streamError);
    } finally {
      res.end();
    }

  } catch (error) {
    console.error('Error in chat stream:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Non-streaming chat endpoint (returns all events at once)
app.post('/chat/sync', async (req, res) => {
  try {
    const { user_id, session_id, message, app_name } = req.body;
    const appName = app_name || DEFAULT_APP_NAME;

    if (!user_id || !message) {
      return res.status(400).json({ error: 'user_id and message are required' });
    }

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    if (!appName) {
      return res.status(400).json({ error: 'app_name is required (or set DEFAULT_APP_NAME env var)' });
    }

    console.log(`Sync chat request - App: ${appName}, User: ${user_id}, Session: ${session_id}`);

    const requestBody = {
      app_name: appName,
      user_id,
      session_id,
      new_message: {
        role: 'user',
        parts: [{ text: message }]
      }
    };

    const response = await cloudRunFetch('/run', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error from Cloud Run:', error);
      return res.status(response.status).json({ error });
    }

    const events = await response.json();

    // Extract text from events
    let fullText = '';
    for (const event of events) {
      if (event.content && event.content.parts) {
        for (const part of event.content.parts) {
          if (part.text) {
            fullText += part.text;
          }
        }
      }
    }

    res.json({
      events,
      text: fullText
    });
  } catch (error) {
    console.error('Error in sync chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 ADK Cloud Run Proxy running on port ${PORT}`);
  console.log(`☁️  Cloud Run URL: ${CLOUD_RUN_URL || 'NOT CONFIGURED'}`);
  console.log(`📦 Default App: ${DEFAULT_APP_NAME || 'NOT CONFIGURED'}`);
  console.log(`🔧 Debug mode: ${DEBUG ? 'ON' : 'OFF'}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /health`);
  console.log(`  GET  /apps`);
  console.log(`  POST /sessions/create`);
  console.log(`  POST /sessions/get`);
  console.log(`  POST /sessions/delete`);
  console.log(`  POST /chat`);
  console.log(`  POST /chat/sync`);
});
