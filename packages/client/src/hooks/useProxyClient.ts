import { useMemo } from 'react';
import { ProxyClient } from '../api/proxyClient';

export interface UseProxyClientConfig {
  baseUrl: string;
}

/**
 * Hook to create and memoize a ProxyClient instance
 */
export function useProxyClient(config: UseProxyClientConfig): ProxyClient {
  const client = useMemo(() => {
    return new ProxyClient({ baseUrl: config.baseUrl });
  }, [config.baseUrl]);

  return client;
}
