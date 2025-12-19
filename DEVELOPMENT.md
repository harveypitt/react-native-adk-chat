# Development Guide

This guide is for contributors working on the `react-native-adk-chat` monorepo itself. If you're building a new app with this package, see the main [README.md](./README.md) Quick Start section instead.

## Architecture Overview

When you run the demo scripts, here's what happens:

```
┌─────────────────────────────────────────────────────────────────┐
│  pnpm demo:cloudrun  OR  pnpm demo:agentengine                  │
│  (Single command starts everything via concurrently)            │
└────────┬────────────────────────────────────────────────────────┘
         │
         ├──────────────────────┬─────────────────────────────────┐
         ▼                      ▼                                 ▼
┌──────────────────┐   ┌──────────────────┐          ┌──────────────────┐
│  [PROXY] 🔵      │   │  [DEMO_APP] 🟣   │          │  Environment     │
│                  │   │                  │          │  Variables       │
│  server-cloudrun │   │  demo-app        │          │                  │
│  OR              │   │  (Expo)          │          │  CLOUD_RUN_URL   │
│  server-agentengine│  │                  │          │  AGENT_ENGINE... │
│                  │   │  Port: Expo      │          │  GOOGLE_APPL...  │
│  Port: 3000      │   │  default         │          │                  │
└────────┬─────────┘   └────────┬─────────┘          └──────────────────┘
         │                      │
         │  ◄─────────────────┐ │
         │    HTTP requests    │ │
         │    to localhost:3000│ │
         │                      │
         ▼                      │
┌──────────────────┐            │
│  Your Agent      │            │
│  (Cloud Run or   │            │
│  Agent Engine)   │            │
│                  │            │
│  Streaming SSE   │────────────┘
│  responses       │
└──────────────────┘
```

**Key Points:**
- Both proxy and app start with one command
- Proxy runs on `http://localhost:3000` (configurable via PORT env var)
- Demo app automatically configured to use `http://localhost:3000`
- Environment variables flow from your shell → proxy → cloud service
- Logs are color-coded for easy debugging

## Project Structure

```
react-native-adk-chat/
├── packages/
│   ├── client/                      # React Native chat components & API client
│   │   ├── src/
│   │   │   ├── components/         # MessageBubble, ChatInput, etc.
│   │   │   ├── api/                # ProxyClient, streaming, types
│   │   │   └── index.ts            # Main export
│   │   └── package.json
│   │
│   ├── server-cloudrun/            # Proxy for Cloud Run agents
│   │   ├── src/index.js            # Express server
│   │   ├── .env.example
│   │   └── package.json
│   │
│   ├── server-agentengine/         # Proxy for Agent Engine
│   │   ├── src/index.js            # Express server with google-auth-library
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── create-adk-chat-app/        # CLI scaffolding tool
│       ├── src/
│       ├── templates/
│       └── package.json
│
├── example/
│   └── demo-app/                   # Demo React Native app
│       ├── app/                    # Expo Router screens
│       ├── index.ts
│       └── package.json
│
├── example-agent/                  # Sample ADK agent (Python)
├── docs/                           # Additional documentation
└── package.json                    # Root workspace config
```

## Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **pnpm**: `npm install -g pnpm` (monorepo uses pnpm workspaces)
- **Expo CLI**: Automatically installed with dependencies
- **Git**: For version control
- **Google Cloud Account**: For testing with real agents
- **Service Account Key**: JSON file with Agent Engine/Cloud Run permissions

## Initial Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/react-native-adk-chat.git
   cd react-native-adk-chat
   ```

2. **Install all dependencies:**
   ```bash
   pnpm install
   ```
   This installs dependencies for all packages in the monorepo.

3. **Set up environment variables:**
   
   Choose one or both based on what you're testing:

   **For Cloud Run proxy:**
   ```bash
   export CLOUD_RUN_URL="https://your-cloud-run-service-xyz.run.app"
   export DEFAULT_APP_NAME="your-app-name"  # Optional
   ```

   **For Agent Engine proxy:**
   ```bash
   export AGENT_ENGINE_URL="https://us-central1-your-project.cloudfunctions.net/your-agent"
   export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"
   ```

   **Tip:** Add these to your shell profile (`~/.zshrc` or `~/.bashrc`) for persistence.

## Running the Demo Apps

The monorepo includes self-contained demo scripts that automatically start both the proxy server and the demo app:

### Cloud Run Demo

```bash
pnpm demo:cloudrun
```

**What this does:**
- Starts `server-cloudrun` on `http://localhost:3000`
- Starts demo app with `EXPO_PUBLIC_PROXY_BASE_URL=http://localhost:3000`
- Uses `concurrently` to show color-coded logs:
  - 🔵 `[PROXY]` - Proxy server logs
  - 🟣 `[DEMO_APP]` - Expo Metro bundler logs

**To test:**
- Press `w` for web browser
- Press `i` for iOS Simulator
- Press `a` for Android Emulator

### Agent Engine Demo

```bash
pnpm demo:agentengine
```

**Same as above**, but uses `server-agentengine` proxy instead.

### Stopping the Demo

Press `Ctrl+C` once. The `--kill-others` flag ensures both processes stop cleanly.

## Development Workflow

### Working on the Client Package

The client package (`packages/client`) contains the React Native components and API client.

**Start development:**
```bash
pnpm client
```

**Make changes:**
- Edit components in `packages/client/src/components/`
- Edit API client in `packages/client/src/api/`
- Hot reload works automatically in the demo app

**Test changes:**
1. Run `pnpm demo:cloudrun` or `pnpm demo:agentengine`
2. The demo app uses `workspace:*` dependency, so changes reflect immediately

### Working on Proxy Servers

Both proxy servers are standard Express apps.

**Development mode (with auto-restart):**
```bash
# Cloud Run proxy
pnpm server:cloudrun

# Agent Engine proxy
pnpm server:agentengine
```

**Production mode:**
```bash
# Cloud Run proxy
PORT=3000 pnpm server:cloudrun:start

# Agent Engine proxy
PORT=3000 pnpm server:agentengine:start
```

**Testing manually:**
```bash
# Start proxy
pnpm server:cloudrun

# In another terminal, start demo app
cd example/demo-app
EXPO_PUBLIC_PROXY_BASE_URL=http://localhost:3000 pnpm start
```

### Working on the CLI Tool

The `create-adk-chat-app` CLI scaffolds new projects.

**Test locally:**
```bash
cd packages/create-adk-chat-app
pnpm link --global
create-adk-chat-app my-test-app
```

**Update templates:**
- Templates are in `packages/create-adk-chat-app/templates/`
- Edit `default/` for the main template
- Test by running the CLI and inspecting generated files

## Port Configuration

All local development uses port `3000` by default:

- **server-cloudrun**: `PORT=3000` (default in `src/index.js`)
- **server-agentengine**: `PORT=3000` (default in `src/index.js`)
- **demo app**: `EXPO_PUBLIC_PROXY_BASE_URL=http://localhost:3000`

**To change ports:**
```bash
# Change proxy port
PORT=4000 pnpm server:cloudrun

# Update demo app
EXPO_PUBLIC_PROXY_BASE_URL=http://localhost:4000 pnpm --filter @react-native-adk-chat/demo-app start
```

## Testing

### Manual Testing

**Health check:**
```bash
curl http://localhost:3000/health
```

**Session creation:**
```bash
curl -X POST http://localhost:3000/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user"}'
```

**Chat streaming:**
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "session_id": "session-id-from-create",
    "message": "Hello!"
  }'
```

### Integration Testing

Run the demo app and test full flows:
1. Session creation
2. Message sending
3. Streaming responses
4. Tool calls (if agent supports them)
5. Session listing
6. Session deletion

## Building & Publishing

### Client Package

```bash
cd packages/client
pnpm build  # If build script exists
```

### CLI Package

```bash
cd packages/create-adk-chat-app
npm publish  # After version bump
```

## Common Tasks

### Adding a New Dependency

**To client package:**
```bash
pnpm --filter @react-native-adk-chat/client add <package-name>
```

**To proxy server:**
```bash
pnpm --filter @react-native-adk-chat/server-cloudrun add <package-name>
```

**To demo app:**
```bash
pnpm --filter @react-native-adk-chat/demo-app add <package-name>
```

### Cleaning Everything

```bash
pnpm clean  # Removes all node_modules
pnpm install  # Reinstall
```

### Updating README

The main README is in the root. Keep it focused on:
- Quick start for new users (CLI path)
- Quick start for monorepo developers
- API reference
- Production deployment

Don't include deep development details—that's what this file is for!

## Troubleshooting

### "Cannot find module" errors

```bash
pnpm install
```

### Expo won't start

```bash
cd example/demo-app
rm -rf node_modules .expo
pnpm install
```

### Proxy connection refused

- Check proxy is running: `curl http://localhost:3000/health`
- Verify port: `lsof -i :3000`
- Check environment variables are set

### Changes not reflecting

- For client: Changes should hot reload automatically
- For proxy: Restart the demo script (`Ctrl+C`, then re-run)
- For deep changes: Clear Metro cache: `pnpm --filter @react-native-adk-chat/demo-app start --clear`

## Git Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

## Scripts Reference

### Root-level scripts (from monorepo root):

| Script | Description |
|--------|-------------|
| `pnpm demo:cloudrun` | Start Cloud Run proxy + demo app |
| `pnpm demo:agentengine` | Start Agent Engine proxy + demo app |
| `pnpm demo` | Start demo app only (no proxy) |
| `pnpm client` | Dev mode for client package |
| `pnpm server:cloudrun` | Dev mode for Cloud Run proxy |
| `pnpm server:cloudrun:start` | Production mode for Cloud Run proxy |
| `pnpm server:agentengine` | Dev mode for Agent Engine proxy |
| `pnpm server:agentengine:start` | Production mode for Agent Engine proxy |
| `pnpm clean` | Remove all node_modules |

### Demo app scripts (from `example/demo-app/`):

| Script | Description |
|--------|-------------|
| `pnpm start` | Start Expo (requires proxy running separately) |
| `pnpm start:cloudrun` | Start with Cloud Run proxy URL |
| `pnpm start:agentengine` | Start with Agent Engine proxy URL |
| `pnpm android` | Start + open Android |
| `pnpm ios` | Start + open iOS |
| `pnpm web` | Start + open web browser |

## Release Checklist

Before releasing a new version:

- [ ] Test demo apps with both proxy types
- [ ] Update version in all relevant `package.json` files
- [ ] Update CHANGELOG.md
- [ ] Test CLI tool: `npx create-adk-chat-app test-release`
- [ ] Verify generated app works end-to-end
- [ ] Update README if APIs changed
- [ ] Tag release in git
- [ ] Publish to npm (if applicable)

## Getting Help

- **Issues**: Check existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Slack/Discord**: [Add your community link]

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Code style
- Commit message format
- PR process
- Review expectations

---

**Questions?** Open an issue or discussion on GitHub.