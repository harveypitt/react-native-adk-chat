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
  .option('--update-agent-url <url>', 'Update the agent URL for an existing app')
  .action(async (appName: string | undefined, options) => {
    // Handle update mode
    if (options.updateAgentUrl) {
      const targetDir = appName
        ? path.resolve(process.cwd(), appName)
        : process.cwd();
      try {
        await updateAppConfig(targetDir, options.updateAgentUrl);
        process.exit(0);
      } catch (error) {
        console.error(chalk.red('❌ Failed to update config:'), error);
        process.exit(1);
      }
    }

    console.log(chalk.blue('🚀 Create ADK Chat App\n'));

    // Prompt for app name if not provided
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

    // Prompt for proxy configuration
    const configResponse = await prompts([
      {
        type: 'select',
        name: 'backendType',
        message: 'Which backend are you connecting to?',
        choices: [
          { title: 'Google Agent Engine', value: 'agent-engine' },
          { title: 'Cloud Run / Custom Proxy', value: 'cloud-run' },
        ],
      },
      {
        type: 'select',
        name: 'environment',
        message: 'Where is it running?',
        choices: [
          { title: 'Localhost', value: 'local' },
          { title: 'Remote URL', value: 'remote' },
        ],
      },
      {
        type: (prev) => (prev === 'remote' ? 'text' : null),
        name: 'remoteUrl',
        message: 'Enter the full URL:',
        validate: (value) =>
          /^https?:\/\//.test(value)
            ? true
            : 'URL must start with http:// or https://',
      },
    ]);

    // Handle cancellation
    if (!configResponse.backendType || !configResponse.environment) {
      console.log(chalk.yellow('Operation cancelled'));
      process.exit(0);
    }

    const proxyUrl =
      configResponse.environment === 'local'
        ? 'http://localhost:3000'
        : configResponse.remoteUrl;

    const targetDir = path.resolve(process.cwd(), appName);

    try {
      await generateApp({
        appName,
        targetDir,
        template: options.template,
        proxyUrl,
      });

      console.log(chalk.green(`\n✅ Successfully created ${appName}!\n`));
      console.log(chalk.cyan('Next steps:'));
      console.log(chalk.white(`  cd ${appName}`));
      console.log(chalk.white('  npm install'));
      console.log(chalk.white('  npm start\n'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to create app:'), error);
      process.exit(1);
    }
  });

program.parse();
