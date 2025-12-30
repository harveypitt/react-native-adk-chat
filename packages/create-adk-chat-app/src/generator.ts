import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import https from 'https';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';
import tar from 'tar';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Downloads and extracts a package from the GitHub repository
 * @param packagePath - Path within the repo (e.g., 'packages/server-cloudrun')
 * @param targetDir - Where to extract the package
 * @param branch - GitHub branch to download from
 */
async function downloadFromGitHub(
  packagePath: string,
  targetDir: string,
  branch: string = 'main'
): Promise<void> {
  const tarballUrl = `https://github.com/harveypitt/react-native-adk-chat/archive/refs/heads/${branch}.tar.gz`;

  return new Promise((resolve, reject) => {
    https.get(tarballUrl, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location!, (redirectResponse) => {
          if (redirectResponse.statusCode !== 200) {
            reject(new Error(`Failed to download: ${redirectResponse.statusCode}`));
            return;
          }

          extractTarball(redirectResponse, packagePath, targetDir, branch, resolve, reject);
        }).on('error', reject);
      } else if (response.statusCode === 200) {
        extractTarball(response, packagePath, targetDir, branch, resolve, reject);
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

function extractTarball(
  response: any,
  packagePath: string,
  targetDir: string,
  branch: string,
  resolve: () => void,
  reject: (error: Error) => void
) {
  const gunzip = createGunzip();
  const extract = tar.extract({
    cwd: path.dirname(targetDir),
    filter: (path) => {
      // Extract only files from the specific package
      const repoPrefix = `react-native-adk-chat-${branch}/`;
      const targetPrefix = repoPrefix + packagePath + '/';
      return path.startsWith(targetPrefix);
    },
    strip: 0,
    transform: (entry) => {
      // Remove repo prefix and package path from entry path
      const repoPrefix = `react-native-adk-chat-${branch}/`;
      const targetPrefix = packagePath + '/';
      if (entry.path.startsWith(repoPrefix + targetPrefix)) {
        entry.path = path.join(
          path.basename(targetDir),
          entry.path.slice((repoPrefix + targetPrefix).length)
        );
      }
      return entry;
    },
  });

  response.pipe(gunzip).pipe(extract);

  extract.on('finish', resolve);
  extract.on('error', reject);
  gunzip.on('error', reject);
}

interface GenerateOptions {
  appName: string;
  targetDir: string;
  template: string;
  proxyUrl: string;
  apiMode?: 'proxy' | 'direct';
  defaultAppName?: string;
  backendType?: 'cloud-run' | 'agent-engine';
  enableAiSuggestions?: boolean;
  geminiApiKey?: string;
}

export async function generateApp(options: GenerateOptions) {
  const {
    appName,
    targetDir,
    template,
    proxyUrl,
    apiMode,
    defaultAppName,
    backendType,
    enableAiSuggestions,
    geminiApiKey,
  } = options;
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

    // Download proxy server from GitHub
    const serverPackageName =
      backendType === 'agent-engine' ? 'server-agentengine' : 'server-cloudrun';

    spinner.text = `Downloading ${serverPackageName} from GitHub...`;
    const serverDir = path.join(targetDir, 'server');
    await fs.ensureDir(serverDir);

    try {
      await downloadFromGitHub(`packages/${serverPackageName}`, serverDir);
    } catch (error) {
      spinner.warn(chalk.yellow(`Could not download proxy server from GitHub. You'll need to set it up manually.`));
      console.error('Download error:', error);
    }

    spinner.text = 'Configuring package.json...';

    // Update package.json with app name and scripts
    const packageJsonPath = path.join(targetDir, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = appName;

    // Configure proxy server scripts
    const hasServer = await fs.pathExists(path.join(serverDir, 'package.json'));
    if (hasServer) {
      packageJson.scripts['proxy'] = 'cd server && npm start';
      packageJson.scripts['postinstall'] = 'cd server && npm install';
    }

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
    let envContent = `PROXY_BASE_URL=${proxyUrl}\n`;
    if (apiMode) envContent += `PROXY_API_MODE=${apiMode}\n`;
    if (defaultAppName) envContent += `PROXY_DEFAULT_APP_NAME=${defaultAppName}\n`;

    await fs.writeFile(envPath, envContent);

    // Create server .env file if server was downloaded
    if (hasServer) {
      spinner.text = 'Creating server .env file...';
      const serverEnvPath = path.join(targetDir, 'server/.env');
      let serverEnvContent = '';

      if (enableAiSuggestions && geminiApiKey) {
        serverEnvContent += `ENABLE_AI_SUGGESTIONS=true\n`;
        serverEnvContent += `GEMINI_API_KEY=${geminiApiKey}\n`;
      } else {
        serverEnvContent += `ENABLE_AI_SUGGESTIONS=false\n`;
      }

      await fs.writeFile(serverEnvPath, serverEnvContent);
    }

    spinner.succeed(chalk.green('App created successfully!'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to create app'));
    throw error;
  }
}

export async function updateAppConfig(
  targetDir: string,
  proxyUrl: string,
  apiMode?: 'proxy' | 'direct',
  defaultAppName?: string,
  backendType?: 'cloud-run' | 'agent-engine',
  isUpdateCode?: boolean,
  isReconfigure?: boolean,
  enableAiSuggestions?: boolean,
  geminiApiKey?: string
) {
  let spinnerText = 'Processing...';
  if (isUpdateCode && isReconfigure) {
    spinnerText = 'Updating code and configuration...';
  } else if (isUpdateCode) {
    spinnerText = 'Updating code from GitHub...';
  } else {
    spinnerText = 'Updating configuration...';
  }
  const spinner = ora(spinnerText).start();

  try {
    // Only update .env if reconfiguring
    if (isReconfigure || (!isUpdateCode && !isReconfigure)) {
      spinner.text = 'Updating .env file...';
      const envPath = path.join(targetDir, '.env');
      let envContent = '';

      if (await fs.pathExists(envPath)) {
        envContent = await fs.readFile(envPath, 'utf8');
      }

      let newContent = envContent;

      const updateOrAdd = (key: string, value: string) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        const newLine = `${key}=${value}`;
        if (regex.test(newContent)) {
          newContent = newContent.replace(regex, newLine);
        } else {
          newContent =
            newContent +
            (newContent && !newContent.endsWith('\n') ? '\n' : '') +
            newLine +
            '\n';
        }
      };

      updateOrAdd('PROXY_BASE_URL', proxyUrl);

      if (apiMode) {
        updateOrAdd('PROXY_API_MODE', apiMode);
      }

      if (defaultAppName) {
        updateOrAdd('PROXY_DEFAULT_APP_NAME', defaultAppName);
      }

      await fs.writeFile(envPath, newContent);

      // Update server .env file if it exists
      const serverEnvPath = path.join(targetDir, 'server/.env');
      if (await fs.pathExists(serverEnvPath)) {
        spinner.text = 'Updating server .env file...';
        let serverEnvContent = '';

        if (await fs.pathExists(serverEnvPath)) {
          serverEnvContent = await fs.readFile(serverEnvPath, 'utf8');
        }

        let newServerContent = serverEnvContent;

        const updateOrAddServer = (key: string, value: string) => {
          const regex = new RegExp(`^${key}=.*$`, 'm');
          const newLine = `${key}=${value}`;
          if (regex.test(newServerContent)) {
            newServerContent = newServerContent.replace(regex, newLine);
          } else {
            newServerContent =
              newServerContent +
              (newServerContent && !newServerContent.endsWith('\n') ? '\n' : '') +
              newLine +
              '\n';
          }
        };

        if (enableAiSuggestions !== undefined) {
          updateOrAddServer('ENABLE_AI_SUGGESTIONS', enableAiSuggestions ? 'true' : 'false');
        }

        if (geminiApiKey) {
          updateOrAddServer('GEMINI_API_KEY', geminiApiKey);
        }

        await fs.writeFile(serverEnvPath, newServerContent);
      }

      // Update src/config/constants.ts
      spinner.text = 'Updating constants...';
      const constantsPath = path.join(targetDir, 'src/config/constants.ts');
      if (await fs.pathExists(constantsPath)) {
        let content = await fs.readFile(constantsPath, 'utf8');
        if (!content.includes('PROXY_API_MODE')) {
          content = content.replace(
            /import\s*{\s*PROXY_BASE_URL\s+as\s+ENV_PROXY_URL\s*}\s+from\s+'@env';/,
            `import {
  PROXY_BASE_URL as ENV_PROXY_URL,
  PROXY_API_MODE as ENV_PROXY_API_MODE,
  PROXY_DEFAULT_APP_NAME as ENV_PROXY_DEFAULT_APP_NAME,
} from '@env';`
          );
          content += `
export const PROXY_API_MODE = (ENV_PROXY_API_MODE as 'proxy' | 'direct') || 'proxy';
export const PROXY_DEFAULT_APP_NAME = ENV_PROXY_DEFAULT_APP_NAME;
`;
          await fs.writeFile(constantsPath, content);
        }
      }

      // Update src/screens/ChatScreen.tsx
      spinner.text = 'Updating ChatScreen...';
      const chatScreenPath = path.join(targetDir, 'src/screens/ChatScreen.tsx');
      if (await fs.pathExists(chatScreenPath)) {
        let content = await fs.readFile(chatScreenPath, 'utf8');

        // Update imports
        if (
          content.includes(
            "import { PROXY_BASE_URL } from '../config/constants';"
          )
        ) {
          content = content.replace(
            "import { PROXY_BASE_URL } from '../config/constants';",
            `import {
  PROXY_BASE_URL,
  PROXY_API_MODE,
  PROXY_DEFAULT_APP_NAME,
} from '../config/constants';`
          );
        }

        // Update initialization
        const initRegex =
          /new\s+ProxyClient\(\s*{\s*baseUrl:\s*PROXY_BASE_URL\s*}\s*\)/;
        if (initRegex.test(content)) {
          content = content.replace(
            initRegex,
            `new ProxyClient({
      baseUrl: PROXY_BASE_URL,
      apiMode: PROXY_API_MODE,
      defaultAppName: PROXY_DEFAULT_APP_NAME,
    })`
          );
          await fs.writeFile(chatScreenPath, content);
        }
      }
    }

    // Update proxy server and dependencies if --update flag is used
    if (isUpdateCode) {
      // Determine which server package to download
      const serverPackageName =
        backendType === 'agent-engine'
          ? 'server-agentengine'
          : 'server-cloudrun';

      spinner.text = `Downloading latest ${serverPackageName} from GitHub...`;
      const serverDir = path.join(targetDir, 'server');

      // Remove old server files
      if (await fs.pathExists(serverDir)) {
        await fs.emptyDir(serverDir);
      } else {
        await fs.ensureDir(serverDir);
      }

      // Download latest from GitHub
      try {
        await downloadFromGitHub(`packages/${serverPackageName}`, serverDir);
        spinner.text = 'Installing server dependencies...';

        // Run npm install in server directory
        await execAsync('npm install', { cwd: serverDir });
      } catch (error) {
        spinner.warn(chalk.yellow(`Could not update proxy server from GitHub.`));
        console.error('Update error:', error);
      }

      // Update client package by running npm install (uses GitHub reference in package.json)
      spinner.text = 'Updating client package from GitHub...';
      try {
        await execAsync('npm install', { cwd: targetDir });
      } catch (error) {
        spinner.warn(chalk.yellow(`Could not update client package. Run 'npm install' manually.`));
        console.error('Install error:', error);
      }
    }

    // Update proxy server type if reconfiguring and backendType changed
    if (isReconfigure && backendType && !isUpdateCode) {
      const serverPackageName =
        backendType === 'agent-engine'
          ? 'server-agentengine'
          : 'server-cloudrun';

      spinner.text = `Downloading ${serverPackageName} from GitHub...`;
      const serverDir = path.join(targetDir, 'server');

      // Remove old server files
      if (await fs.pathExists(serverDir)) {
        await fs.emptyDir(serverDir);
      } else {
        await fs.ensureDir(serverDir);
      }

      // Download new server type from GitHub
      try {
        await downloadFromGitHub(`packages/${serverPackageName}`, serverDir);

        // Update package.json scripts
        const packageJsonPath = path.join(targetDir, 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
          const packageJson = await fs.readJson(packageJsonPath);
          packageJson.scripts = packageJson.scripts || {};
          packageJson.scripts['proxy'] = 'cd server && npm start';
          packageJson.scripts['postinstall'] = 'cd server && npm install';

          await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        }

        // Install server dependencies
        spinner.text = 'Installing server dependencies...';
        await execAsync('npm install', { cwd: serverDir });
      } catch (error) {
        spinner.warn(chalk.yellow(`Could not download proxy server from GitHub.`));
        console.error('Download error:', error);
      }
    }

    if (isUpdateCode && isReconfigure) {
      spinner.succeed(chalk.green('Updated code and configuration'));
    } else if (isUpdateCode) {
      spinner.succeed(chalk.green('Updated code from GitHub'));
    } else {
      spinner.succeed(chalk.green(`Updated configuration: PROXY_BASE_URL=${proxyUrl}`));
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to update configuration'));
    throw error;
  }
}
