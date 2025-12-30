import React, { useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import ChatInput from './ChatInput';
import { useProxyClient, useChatSession, useChatMessages } from '../hooks';
import { ChatTheme, mergeTheme } from '../theme';
import { ToolCall } from '../api/types';

export interface ChatScreenProps {
  proxyBaseUrl: string;
  userId?: string;
  title?: string;
  onToolCallPress?: (toolCall: ToolCall) => void;
  theme?: ChatTheme;
}

const KeyboardWrapper = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style: any;
}) => {
  if (Platform.OS === 'web') {
    return <View style={style}>{children}</View>;
  }
  return (
    <KeyboardAvoidingView
      style={style}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {children}
    </KeyboardAvoidingView>
  );
};

export function ChatScreen({
  proxyBaseUrl,
  userId = 'user_123',
  title,
  onToolCallPress,
  theme: userTheme,
}: ChatScreenProps) {
  const theme = mergeTheme(userTheme);

  // Initialize proxy client
  const proxyClient = useProxyClient({ baseUrl: proxyBaseUrl });

  // Session management
  const {
    sessionId,
    isConnected,
    checkConnection,
    startNewChat,
  } = useChatSession({
    proxyClient,
    userId,
    proxyBaseUrl,
  });

  // Message management
  const {
    messages,
    input,
    isLoading,
    setInput,
    sendMessage,
    handleSuggestionSelect,
    clearMessages,
  } = useChatMessages({
    proxyClient,
    userId,
    sessionId,
    proxyBaseUrl,
  });

  // Initialize connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const handleNewChat = async () => {
    await startNewChat(messages.length > 0);
    // Clear messages after new session is created
    if (messages.length > 0) {
      clearMessages();
    }
  };

  const handleToolCallPressInternal = (toolCall: ToolCall) => {
    if (onToolCallPress) {
      onToolCallPress(toolCall);
    }
  };

  const getPlaceholder = () => {
    if (!isConnected) return 'Connecting to server...';
    if (!sessionId) return 'Creating session...';
    if (isLoading) return 'AI is thinking...';
    return 'How can I help you today?';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ChatHeader
        title={title}
        isConnected={isConnected}
        onNewChatPress={handleNewChat}
        theme={theme}
      />
      <KeyboardWrapper style={styles.keyboardView}>
        <ChatMessageList
          messages={messages}
          isConnected={isConnected}
          isLoading={isLoading}
          proxyBaseUrl={proxyBaseUrl}
          onToolCallPress={handleToolCallPressInternal}
          onSuggestionSelect={handleSuggestionSelect}
          onRetryConnection={checkConnection}
          theme={theme}
        />
        <ChatInput
          value={input}
          onChangeText={setInput}
          onSend={() => sendMessage()}
          disabled={isLoading || !isConnected || !sessionId}
          placeholder={getPlaceholder()}
        />
      </KeyboardWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
});
