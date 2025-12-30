import React from 'react';
import { ChatApp } from '@react-native-adk-chat/client';
import { theme } from './theme';

// Read proxy URL from environment variable
// Expo requires EXPO_PUBLIC_ prefix for client-side env vars
const PROXY_BASE_URL = process.env.EXPO_PUBLIC_PROXY_BASE_URL || 'http://localhost:3000';
const DEFAULT_USER_ID = process.env.EXPO_PUBLIC_DEFAULT_USER_ID || 'user_123';

export default function App() {
  return (
    <ChatApp
      proxyUrl={PROXY_BASE_URL}
      userId={DEFAULT_USER_ID}
      title="ADK Chat"
      theme={theme}
    />
  );
}
