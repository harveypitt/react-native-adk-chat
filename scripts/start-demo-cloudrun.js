#!/usr/bin/env node

/**
 * Interactive startup script for demo:cloudrun
 * Prompts for required environment variables if not set
 */

const { spawn } = require('child_process');
const readline = require('readline');

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
  console.log('\n🚀 Starting React Native ADK Chat Demo (Cloud Run)\n');

  // Check for CLOUD_RUN_URL
  let cloudRunUrl = process.env.CLOUD_RUN_URL;
  if (!cloudRunUrl) {
    console.log('⚠️  CLOUD_RUN_URL environment variable not set.\n');
    cloudRunUrl = await question('Enter your Cloud Run URL (e.g., https://your-agent-xyz.run.app): ');

    if (!cloudRunUrl || !cloudRunUrl.trim()) {
      console.error('\n❌ Cloud Run URL is required. Exiting.\n');
      process.exit(1);
    }

    cloudRunUrl = cloudRunUrl.trim();

    // Validate URL format
    if (!cloudRunUrl.startsWith('http://') && !cloudRunUrl.startsWith('https://')) {
      console.error('\n❌ Invalid URL format. Must start with http:// or https://\n');
      process.exit(1);
    }
  }

  // Check for DEFAULT_APP_NAME (optional)
  let defaultAppName = process.env.DEFAULT_APP_NAME;
  if (!defaultAppName) {
    console.log('\n💡 DEFAULT_APP_NAME is optional (used if your Cloud Run service hosts multiple apps).\n');
    defaultAppName = await question('Enter default app name (or press Enter to skip): ');
    defaultAppName = defaultAppName.trim();
  }

  rl.close();

  console.log('\n✅ Configuration:');
  console.log(`   Cloud Run URL: ${cloudRunUrl}`);
  if (defaultAppName) {
    console.log(`   Default App Name: ${defaultAppName}`);
  }
  console.log('\n🔄 Starting proxy server and demo app...\n');

  // Build the environment variables
  const env = {
    ...process.env,
    PORT: '3000',
    CLOUD_RUN_URL: cloudRunUrl,
    EXPO_PUBLIC_PROXY_BASE_URL: 'http://localhost:3000'
  };

  if (defaultAppName) {
    env.DEFAULT_APP_NAME = defaultAppName;
  }

  // Build the concurrently command as a single string
  const command = `npx concurrently --kill-others --names "PROXY,DEMO_APP" --prefix-colors "bgBlue.bold,bgMagenta.bold" "pnpm --filter @anthropic/adk-proxy-cloudrun start" "pnpm --filter @react-native-adk-chat/demo-app start"`;

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
