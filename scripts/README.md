# Interactive Demo Startup Scripts

These scripts provide an interactive way to start the demo applications with automatic prompts for required configuration.

## Scripts

### `start-demo-cloudrun.js`

Starts the Cloud Run demo with interactive prompts.

**Usage:**
```bash
pnpm demo:cloudrun
```

**Prompts for:**
- Cloud Run URL (if `CLOUD_RUN_URL` not set)
- Default App Name (optional, if `DEFAULT_APP_NAME` not set)

**Skipping prompts:**
```bash
export CLOUD_RUN_URL="https://your-agent-xyz.run.app"
export DEFAULT_APP_NAME="your-app-name"  # Optional
pnpm demo:cloudrun
```

### `start-demo-agentengine.js`

Starts the Agent Engine demo with interactive prompts.

**Usage:**
```bash
pnpm demo:agentengine
```

**Prompts for:**
- Agent Engine URL (if `AGENT_ENGINE_URL` not set)
- Path to service account key file (if `GOOGLE_APPLICATION_CREDENTIALS` not set)

**Skipping prompts:**
```bash
export AGENT_ENGINE_URL="https://region-project-agent.a.run.app"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
pnpm demo:agentengine
```

## Features

- ✅ **Interactive prompts** - No need to remember environment variable names
- ✅ **Validation** - Checks URL formats and file existence
- ✅ **Graceful shutdown** - Handles Ctrl+C properly
- ✅ **Color-coded logs** - Blue for proxy, magenta for demo app
- ✅ **Automatic proxy startup** - Both services start together
