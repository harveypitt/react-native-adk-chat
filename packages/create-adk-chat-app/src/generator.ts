import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';

interface GenerateOptions {
  appName: string;
  targetDir: string;
  template: string;
  proxyUrl: string;
}

export async function generateApp(options: GenerateOptions) {
  const { appName, targetDir, template, proxyUrl } = options;
  const spinner = ora('Creating app structure...').start();

  try {
    // Ensure target directory doesn't exist
    if (await fs.pathExists(targetDir)) {
      throw new Error(`Directory ${appName} already exists`);
    }

    // Create target directory
    await fs.ensureDir(targetDir);

    // Copy template files
    const templateDir = path.join(__dirname, '../templates', template);
    await fs.copy(templateDir, targetDir);

    spinner.text = 'Configuring package.json...';

    // Update package.json with app name
    const packageJsonPath = path.join(targetDir, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = appName;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    spinner.text = 'Configuring app.json...';

    // Update app.json with app name
    const appJsonPath = path.join(targetDir, 'app.json');
    const appJson = await fs.readJson(appJsonPath);
    appJson.expo.name = appName;
    appJson.expo.slug = appName;
    await fs.writeJson(appJsonPath, appJson, { spaces: 2 });

    spinner.text = 'Creating .env file...';

    // Create .env file with proxy URL
    const envPath = path.join(targetDir, '.env');
    await fs.writeFile(envPath, `PROXY_BASE_URL=${proxyUrl}\n`);

    spinner.succeed(chalk.green('App created successfully!'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to create app'));
    throw error;
  }
}

export async function updateAppConfig(targetDir: string, proxyUrl: string) {
  const spinner = ora('Updating configuration...').start();

  try {
    const envPath = path.join(targetDir, '.env');
    let envContent = '';

    if (await fs.pathExists(envPath)) {
      envContent = await fs.readFile(envPath, 'utf8');
    }

    const regex = /^PROXY_BASE_URL=.*$/m;
    const newConfig = `PROXY_BASE_URL=${proxyUrl}`;

    let newContent;
    if (regex.test(envContent)) {
      newContent = envContent.replace(regex, newConfig);
    } else {
      newContent = envContent + (envContent && !envContent.endsWith('\n') ? '\n' : '') + newConfig + '\n';
    }

    await fs.writeFile(envPath, newContent);
    spinner.succeed(chalk.green(`Updated configuration: PROXY_BASE_URL=${proxyUrl}`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to update configuration'));
    throw error;
  }
}
