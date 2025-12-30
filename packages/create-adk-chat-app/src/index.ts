#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import { generateApp, updateAppConfig } from './generator';
import path from 'path';

const program = new Command();

program
  .name('create-adk-chat-app')
  .description('Create a new ADK chat application')
  .argument('[app-name]', 'Name of your app')
  .option('-t, --template <template>', 'Template to use', 'default')
  .option('--update', 'Update proxy server and dependencies from GitHub (does not change settings)')
  .option('--reconfigure', 'Update configuration settings only (proxy URL, app name, etc.)')
  .option('--proxy-url <url>', 'URL of the proxy server')
  .addHelpText('after', `

Examples:
  $ create-adk-chat-app my-app              Create new app
  $ create-adk-chat-app --update            Pull latest code changes
  $ create-adk-chat-app --reconfigure       Change proxy settings
  $ create-adk-chat-app --update --reconfigure   Update code and settings
`)
  .action(async (appName: string | undefined, options) => {
    const isUpdate = options.update;
    const isReconfigure = options.reconfigure;
    const isUpdateMode = isUpdate || isReconfigure;

    if (isUpdate && isReconfigure) {
      console.log(chalk.blue('🔄 Update Code & Reconfigure ADK Chat App\n'));
    } else if (isUpdate) {
      console.log(chalk.blue('⬇️  Update ADK Chat App Code\n'));
    } else if (isReconfigure) {
      console.log(chalk.blue('⚙️  Reconfigure ADK Chat App\n'));
    } else {
      console.log(chalk.blue('🚀 Create ADK Chat App\n'));

      // Prompt for app name if not provided (only for creation)
      if (!appName) {
        const response = await prompts({
          type: 'text',
          name: 'appName',
          message: 'Project name:',
          initial: 'my-adk-chat-app',
          validate: (value) =>
            /^[a-z0-9-]+$/.test(value)
              ? true
              : 'App name must be lowercase letters, numbers, and hyphens only',
        });
        appName = response.appName;
      }

      if (!appName) {
        console.error(chalk.red('❌ App name is required'));
        process.exit(1);
      }
    }

    // Prompt for proxy configuration (skip if --update without --reconfigure)
    let configResponse: any = {};

    if (!isUpdate || isReconfigure) {
      configResponse = await prompts([
        {
          type: 'select',
          name: 'backendType',
          message: 'Which proxy server type do you need?',
          choices: [
            { title: 'Cloud Run Proxy (Recommended)', value: 'cloud-run' },
            { title: 'Agent Engine Proxy', value: 'agent-engine' },
          ],
          initial: 0,
        },
      {
        type: options.proxyUrl ? null : 'select',
        name: 'connectionType',
        message: 'How do you want to connect?',
        choices: [
          { title: 'Local Proxy (localhost:3000)', value: 'local' },
          { title: 'Remote (Cloud Run)', value: 'remote' },
        ],
      },
      {
        type: (prev) => (prev === 'remote' && !options.proxyUrl ? 'text' : null),
        name: 'remoteUrl',
        message: 'Enter the backend URL:',
        initial: 'https://your-service.a.run.app',
        validate: (value) =>
          /^https?:\/\//.test(value)
            ? true
            : 'URL must start with http:// or https://',
      },
      {
        type: (prev, values) => (values.connectionType === 'remote' ? 'confirm' : null),
        name: 'isDirect',
        message: 'Is this a direct Cloud Run connection?',
        initial: true,
      },
      {
        type: (prev, values) => (values.isDirect ? 'text' : null),
        name: 'agentAppName',
        message: 'Enter your Cloud Run App Name (e.g., MBS):',
        validate: (value) =>
          value && value.length > 0
            ? true
            : 'App Name is required for direct connection',
      },
      {
        type: 'confirm',
        name: 'enableAiSuggestions',
        message: 'Enable AI-powered suggestion generation? (requires Gemini API key)',
        initial: false,
      },
      {
        type: (prev) => (prev ? 'password' : null),
        name: 'geminiApiKey',
        message: 'Enter your Gemini API key (get one at https://aistudio.google.com/app/apikey):',
        validate: (value) =>
          value && value.length > 0
            ? true
            : 'Gemini API key is required for AI suggestions',
      },
      ]);

      // Handle cancellation
      if (!options.proxyUrl && !configResponse.connectionType && !isUpdate) {
        console.log(chalk.yellow('Operation cancelled'));
        process.exit(0);
      }
    }

    const proxyUrl = options.proxyUrl ||
      (configResponse.connectionType === 'local'
        ? 'http://localhost:3000'
        : configResponse.remoteUrl);

    const apiMode = configResponse.isDirect ? 'direct' : 'proxy';
    const defaultAppName = configResponse.agentAppName || '';
    const backendType = configResponse.backendType || 'cloud-run';
    const enableAiSuggestions = configResponse.enableAiSuggestions || false;
    const geminiApiKey = configResponse.geminiApiKey || '';

    // For update, use cwd if appName not provided
    const targetDir = appName
      ? path.resolve(process.cwd(), appName)
      : process.cwd();

    try {
      if (isUpdateMode) {
        // @ts-ignore
        await updateAppConfig(targetDir, proxyUrl, apiMode, defaultAppName, backendType, isUpdate, isReconfigure, enableAiSuggestions, geminiApiKey);

        if (isUpdate && isReconfigure) {
          console.log(chalk.green(`\n✅ Successfully updated code and configuration!\n`));
        } else if (isUpdate) {
          console.log(chalk.green(`\n✅ Successfully updated code from GitHub!\n`));
          console.log(chalk.cyan(`💡 To reconfigure settings, run: npx create-adk-chat-app --reconfigure\n`));
        } else {
          console.log(chalk.green(`\n✅ Successfully updated configuration!\n`));
        }
      } else {
        if (!appName) throw new Error('App name required for creation'); // Should be caught above

        await generateApp({
          appName,
          targetDir,
          template: options.template,
          proxyUrl,
          // @ts-ignore
          apiMode,
          // @ts-ignore
          defaultAppName,
          // @ts-ignore
          backendType,
          // @ts-ignore
          enableAiSuggestions,
          // @ts-ignore
          geminiApiKey,
        });

        console.log(chalk.green(`\n✅ Successfully created ${appName}!\n`));
        console.log(chalk.cyan('Next steps:'));
        console.log(chalk.white(`  cd ${appName}`));
        console.log(chalk.white('  npm install'));
        console.log(chalk.white('  npm start\n'));
      }
    } catch (error) {
      console.error(
        chalk.red(`❌ Failed to ${isUpdate ? 'update' : 'create'} app:`),
        error
      );
      process.exit(1);
    }
  });

program.parse();
