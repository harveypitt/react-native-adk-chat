import {
  PROXY_BASE_URL as ENV_PROXY_URL,
  PROXY_API_MODE as ENV_PROXY_API_MODE,
  PROXY_DEFAULT_APP_NAME as ENV_PROXY_DEFAULT_APP_NAME,
} from '@env';

export const PROXY_BASE_URL = ENV_PROXY_URL || 'http://localhost:3000';
export const PROXY_API_MODE = (ENV_PROXY_API_MODE as 'proxy' | 'direct') || 'proxy';
export const PROXY_DEFAULT_APP_NAME = ENV_PROXY_DEFAULT_APP_NAME;
