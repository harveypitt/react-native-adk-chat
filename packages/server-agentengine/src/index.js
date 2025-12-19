require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleAuth } = require('google-auth-library');

const app = express();

// Configure CORS to allow requests from any origin
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Initialize Google Auth with service account
const auth = new GoogleAuth({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

const REASONING_ENGINE_URL = process.env.REASONING_ENGINE_URL;

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
    engineUrl: REASONING_ENGINE_URL ? 'configured' : 'not configured'
  });
});

// Create a new session for a user
app.post('/sessions/create', async (req, res) => {
  try {
    const { user_id, session_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Get fresh OAuth token (auto-refreshed by google-auth-library)
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    console.log(`Creating session for user: ${user_id}`);

    // Call Agent Engine's async_create_session method
    const response = await fetch(`${REASONING_ENGINE_URL}:query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          user_id,
          ...(session_id && { session_id })
        },
        classMethod: 'async_create_session'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error from Agent Engine:', error);
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    console.log(`Session created: ${data.output?.session_id}`);
    res.json(data);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get existing session
app.post('/sessions/get', async (req, res) => {
  try {
    const { user_id, session_id } = req.body;

    if (!user_id || !session_id) {
      return res.status(400).json({ error: 'user_id and session_id are required' });
    }

    const client = await auth.getClient();
    const token = await client.getAccessToken();

    console.log(`Getting session: ${session_id} for user: ${user_id}`);

    const response = await fetch(`${REASONING_ENGINE_URL}:query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { user_id, session_id },
        classMethod: 'async_get_session'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error from Agent Engine:', error);
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all sessions for a user
app.post('/sessions/list', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const client = await auth.getClient();
    const token = await client.getAccessToken();

    console.log(`Listing sessions for user: ${user_id}`);

    const response = await fetch(`${REASONING_ENGINE_URL}:query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { user_id },
        classMethod: 'async_list_sessions'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error from Agent Engine:', error);
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stream chat query to agent
app.post('/chat', async (req, res) => {
  try {
    const { user_id, session_id, message, run_config } = req.body;

    if (!user_id || !message) {
      return res.status(400).json({ error: 'user_id and message are required' });
    }

    const client = await auth.getClient();
    const token = await client.getAccessToken();

    console.log(`Chat request - User: ${user_id}, Session: ${session_id || 'new'}, Message: "${message.substring(0, 50)}..."`);

    // Call Agent Engine's async_stream_query method
    const response = await fetch(`${REASONING_ENGINE_URL}:streamQuery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          user_id,
          ...(session_id && { session_id }),
          message,
          ...(run_config && { run_config })
        },
        classMethod: 'async_stream_query'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error from Agent Engine:', error);
      return res.status(response.status).json({ error });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

    // Stream the response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream completed');
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
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

// Delete a session
app.post('/sessions/delete', async (req, res) => {
  try {
    const { user_id, session_id } = req.body;

    if (!user_id || !session_id) {
      return res.status(400).json({ error: 'user_id and session_id are required' });
    }

    const client = await auth.getClient();
    const token = await client.getAccessToken();

    console.log(`Deleting session: ${session_id} for user: ${user_id}`);

    const response = await fetch(`${REASONING_ENGINE_URL}:query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { user_id, session_id },
        classMethod: 'async_delete_session'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error from Agent Engine:', error);
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    console.log(`Session deleted: ${session_id}`);
    res.json(data);
  } catch (error) {
    console.error('Error deleting session:', error);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 ADK Agent Proxy running on port ${PORT}`);
  console.log(`📍 Agent Engine: ${REASONING_ENGINE_URL || 'NOT CONFIGURED'}`);
  console.log(`🔐 Service Account: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || 'NOT CONFIGURED'}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /health`);
  console.log(`  POST /sessions/create`);
  console.log(`  POST /sessions/get`);
  console.log(`  POST /sessions/list`);
  console.log(`  POST /sessions/delete`);
  console.log(`  POST /chat`);
});
