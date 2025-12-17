import { PROXY_BASE_URL as ENV_PROXY_URL } from '@env';

export const PROXY_BASE_URL = ENV_PROXY_URL || 'http://localhost:3000';
