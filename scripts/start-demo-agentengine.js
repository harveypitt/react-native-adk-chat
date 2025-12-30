#!/usr/bin/env node

/**
 * Interactive startup script for demo:agentengine
 * Prompts for required environment variables if not set
 */

const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🚀 Starting React Native ADK Chat Demo (Agent Engine)\n');

  // Check for AGENT_ENGINE_URL
  let agentEngineUrl = process.env.AGENT_ENGINE_URL || process.env.REASONING_ENGINE_URL;
  if (!agentEngineUrl) {
    console.log('⚠️  AGENT_ENGINE_URL environment variable not set.\n');
    agentEngineUrl = await question('Enter your Agent Engine URL (e.g., https://region-project-agent.a.run.app): ');

    if (!agentEngineUrl || !agentEngineUrl.trim()) {
      console.error('\n❌ Agent Engine URL is required. Exiting.\n');
      process.exit(1);
    }

    agentEngineUrl = agentEngineUrl.trim();

    // Validate URL format
    if (!agentEngineUrl.startsWith('http://') && !agentEngineUrl.startsWith('https://')) {
      console.error('\n❌ Invalid URL format. Must start with http:// or https://\n');
      process.exit(1);
    }
  }

  // Check for GOOGLE_APPLICATION_CREDENTIALS
  let credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    console.log('\n⚠️  GOOGLE_APPLICATION_CREDENTIALS environment variable not set.\n');
    console.log('This should be the absolute path to your service account JSON key file.\n');
    credentialsPath = await question('Enter path to service account key file: ');

    if (!credentialsPath || !credentialsPath.trim()) {
      console.error('\n❌ Service account credentials are required. Exiting.\n');
      process.exit(1);
    }

    credentialsPath = credentialsPath.trim();

    // Expand ~ to home directory
    if (credentialsPath.startsWith('~')) {
      credentialsPath = path.join(process.env.HOME || process.env.USERPROFILE, credentialsPath.slice(1));
    }

    // Check if file exists
    if (!fs.existsSync(credentialsPath)) {
      console.error(`\n❌ File not found: ${credentialsPath}\n`);
      process.exit(1);
    }
  }

  rl.close();

  console.log('\n✅ Configuration:');
  console.log(`   Agent Engine URL: ${agentEngineUrl}`);
  console.log(`   Credentials: ${credentialsPath}`);
  console.log('\n🔄 Starting proxy server and demo app...\n');

  // Build the environment variables
  const env = {
    ...process.env,
    PORT: '3000',
    AGENT_ENGINE_URL: agentEngineUrl,
    GOOGLE_APPLICATION_CREDENTIALS: credentialsPath,
    EXPO_PUBLIC_PROXY_BASE_URL: 'http://localhost:3000'
  };

  // Build the concurrently command as a single string
  const command = `npx concurrently --kill-others --names "PROXY,DEMO_APP" --prefix-colors "bgBlue.bold,bgMagenta.bold" "pnpm --filter @react-native-adk-chat/server-agentengine start" "pnpm --filter @react-native-adk-chat/demo-app start"`;

  const child = spawn(command, [], {
    stdio: 'inherit',
    env,
    shell: true
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down...\n');
    child.kill('SIGINT');
  });
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
