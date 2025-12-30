import { useState, useCallback } from 'react';
import { ProxyClient } from '../api/proxyClient';
import { Alert, Platform } from 'react-native';

export interface UseChatSessionConfig {
  proxyClient: ProxyClient;
  userId: string;
  proxyBaseUrl: string;
}

export interface UseChatSessionReturn {
  sessionId: string;
  isConnected: boolean;
  checkConnection: () => Promise<void>;
  initializeSession: () => Promise<void>;
  startNewChat: (hasMessages: boolean) => Promise<void>;
}

/**
 * Hook to manage chat session lifecycle
 */
export function useChatSession(config: UseChatSessionConfig): UseChatSessionReturn {
  const { proxyClient, userId, proxyBaseUrl } = config;
  const [sessionId, setSessionId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  const showAlert = useCallback((title: string, message: string) => {
    if (Platform.OS === 'web') {
      (window as any).alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  }, []);

  const initializeSession = useCallback(async () => {
    try {
      const response = await proxyClient.createSession(userId);
      const newSessionId = response.output.id;
      setSessionId(newSessionId);
      console.log('Session created:', newSessionId);
    } catch (error) {
      console.error('Failed to create session:', error);
      showAlert(
        'Session Error',
        'Failed to create session. Please check your server connection.'
      );
    }
  }, [proxyClient, userId, showAlert]);

  const checkConnection = useCallback(async () => {
    try {
      const healthy = await proxyClient.checkHealth();
      setIsConnected(healthy);
      if (healthy) {
        await initializeSession();
      } else {
        showAlert(
          'Connection Error',
          `Cannot connect to proxy server at ${proxyBaseUrl}. Make sure the server is running.`
        );
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
    }
  }, [proxyClient, proxyBaseUrl, initializeSession, showAlert]);

  const startNewChat = useCallback(async (hasMessages: boolean) => {
    const createNewSession = async () => {
      try {
        const response = await proxyClient.createSession(userId);
        const newSessionId = response.output.id;
        setSessionId(newSessionId);
        console.log('✅ New session created successfully:', newSessionId);
        return newSessionId;
      } catch (error) {
        console.error('❌ Failed to create new session:', error);
        showAlert('Error', 'Failed to create new session. Please try again.');
        throw error;
      }
    };

    // If no messages, just create new session without confirmation
    if (!hasMessages) {
      await createNewSession();
      return;
    }

    // If there are messages, ask for confirmation
    const confirmed = Platform.OS === 'web'
      ? (window as any).confirm('Start a new conversation? This will clear your current chat.')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Start New Chat',
            'Start a new conversation? This will clear your current chat.',
            [
              { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
              { text: 'OK', onPress: () => resolve(true) },
            ]
          );
        });

    if (confirmed) {
      await createNewSession();
    }
  }, [proxyClient, userId, showAlert]);

  return {
    sessionId,
    isConnected,
    checkConnection,
    initializeSession,
    startNewChat,
  };
}
