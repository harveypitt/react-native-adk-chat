import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';

interface GenerateOptions {
  appName: string;
  targetDir: string;
  template: string;
  proxyUrl: string;
  apiMode?: 'proxy' | 'direct';
  defaultAppName?: string;
  backendType?: 'cloud-run' | 'agent-engine';
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

    // Check for local client package (monorepo development)
    const localClientPath = path.resolve(__dirname, '../../client');
    const hasLocalClient = await fs.pathExists(path.join(localClientPath, 'package.json'));

    if (hasLocalClient) {
      spinner.text = 'Vendoring local client package...';
      const vendorDir = path.join(targetDir, 'modules/client');
      await fs.ensureDir(vendorDir);

      await fs.copy(localClientPath, vendorDir, {
        filter: (src) => {
          const basename = path.basename(src);
          return basename !== 'node_modules' && basename !== 'dist' && basename !== '.git';
        },
      });
    }

    // Check for local server package based on backendType
    const serverPackageName =
      backendType === 'agent-engine' ? 'server-agentengine' : 'server-cloudrun';
    const localServerPath = path.resolve(__dirname, '../../', serverPackageName);
    const hasLocalServer = await fs.pathExists(
      path.join(localServerPath, 'package.json')
    );

    if (hasLocalServer) {
      spinner.text = `Vendoring local ${serverPackageName}...`;
      const serverDir = path.join(targetDir, 'server');
      await fs.ensureDir(serverDir);

      await fs.copy(localServerPath, serverDir, {
        filter: (src) => {
          const basename = path.basename(src);
          return basename !== 'node_modules' && basename !== '.git';
        },
      });
    }

    spinner.text = 'Configuring package.json...';

    // Update package.json with app name
    const packageJsonPath = path.join(targetDir, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = appName;

    if (hasLocalClient) {
      packageJson.dependencies['@react-native-adk-chat/client'] = 'file:./modules/client';
    }

    if (hasLocalServer) {
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
  isReconfigure?: boolean
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

    // Update bundled server and client if --update flag is used
    if (isUpdateCode) {
      // Update client package
      const localClientPath = path.resolve(__dirname, '../../client');
      const hasLocalClient = await fs.pathExists(path.join(localClientPath, 'package.json'));

      if (hasLocalClient) {
        spinner.text = 'Updating client package from GitHub...';
        const vendorDir = path.join(targetDir, 'modules/client');
        if (await fs.pathExists(vendorDir)) {
          await fs.emptyDir(vendorDir);
          await fs.copy(localClientPath, vendorDir, {
            filter: (src) => {
              const basename = path.basename(src);
              return basename !== 'node_modules' && basename !== 'dist' && basename !== '.git';
            },
          });
        }
      }

      // Update server package
      const serverPackageName =
        backendType === 'agent-engine'
          ? 'server-agentengine'
          : 'server-cloudrun';
      const localServerPath = path.resolve(
        __dirname,
        '../../',
        serverPackageName
      );
      const hasLocalServer = await fs.pathExists(
        path.join(localServerPath, 'package.json')
      );

      if (hasLocalServer) {
        spinner.text = `Updating server package (${serverPackageName}) from GitHub...`;
        const serverDir = path.join(targetDir, 'server');
        if (await fs.pathExists(serverDir)) {
          await fs.emptyDir(serverDir);

          await fs.copy(localServerPath, serverDir, {
            filter: (src) => {
              const basename = path.basename(src);
              return basename !== 'node_modules' && basename !== '.git';
            },
          });
        }
      }
    }

    // Update bundled server type if reconfiguring and backendType changed
    if (isReconfigure && backendType) {
      const serverPackageName =
        backendType === 'agent-engine'
          ? 'server-agentengine'
          : 'server-cloudrun';
      const localServerPath = path.resolve(
        __dirname,
        '../../',
        serverPackageName
      );
      const hasLocalServer = await fs.pathExists(
        path.join(localServerPath, 'package.json')
      );

      if (hasLocalServer) {
        spinner.text = `Updating bundled server (${serverPackageName})...`;
        const serverDir = path.join(targetDir, 'server');
        await fs.emptyDir(serverDir);

        await fs.copy(localServerPath, serverDir, {
          filter: (src) => {
            const basename = path.basename(src);
            return basename !== 'node_modules' && basename !== '.git';
          },
        });

        // Update package.json scripts
        const packageJsonPath = path.join(targetDir, 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
          const packageJson = await fs.readJson(packageJsonPath);
          packageJson.scripts = packageJson.scripts || {};
          packageJson.scripts['proxy'] = 'cd server && npm start';
          packageJson.scripts['postinstall'] = 'cd server && npm install';

          // Update start scripts to use concurrently
          const concurrently =
            'concurrently --kill-others --names "PROXY,APP" --prefix-colors "bgBlue.bold,bgMagenta.bold" "npm run proxy"';

          packageJson.scripts['start'] = `${concurrently} "expo start"`;
          packageJson.scripts['android'] = `${concurrently} "expo start --android"`;
          packageJson.scripts['ios'] = `${concurrently} "expo start --ios"`;
          packageJson.scripts['web'] = `${concurrently} "expo start --web"`;

          // Add concurrently to devDependencies
          packageJson.devDependencies = packageJson.devDependencies || {};
          if (!packageJson.devDependencies['concurrently']) {
            packageJson.devDependencies['concurrently'] = '^8.2.2';
          }

          await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        }
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
