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
  .option('--update', 'Update configuration for an existing app')
  .option('--proxy-url <url>', 'URL of the proxy server')
  .action(async (appName: string | undefined, options) => {
    const isUpdate = options.update;

    if (isUpdate) {
      console.log(chalk.blue('🔄 Update ADK Chat App Configuration\n'));
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

    // Prompt for proxy configuration
    const configResponse = await prompts([
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
    ]);

    // Handle cancellation
    if (!options.proxyUrl && !configResponse.connectionType) {
      console.log(chalk.yellow('Operation cancelled'));
      process.exit(0);
    }

    const proxyUrl = options.proxyUrl ||
      (configResponse.connectionType === 'local'
        ? 'http://localhost:3000'
        : configResponse.remoteUrl);

    const apiMode = configResponse.isDirect ? 'direct' : 'proxy';
    const defaultAppName = configResponse.agentAppName || '';

    // For update, use cwd if appName not provided
    const targetDir = appName
      ? path.resolve(process.cwd(), appName)
      : process.cwd();

    try {
      if (isUpdate) {
        await updateAppConfig(targetDir, proxyUrl, apiMode, defaultAppName);
        console.log(chalk.green(`\n✅ Successfully updated configuration!\n`));
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
