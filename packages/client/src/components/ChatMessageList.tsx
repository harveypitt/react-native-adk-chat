import React, { useRef, useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MessageBubble from './MessageBubble';
import { SuggestionContainer } from './SuggestionContainer';
import { Message, ToolCall, Suggestion } from '../api/types';
import { ChatThemeWithDefaults } from '../theme';

export interface ChatMessageListProps {
  messages: Message[];
  isConnected: boolean;
  isLoading: boolean;
  proxyBaseUrl: string;
  onToolCallPress: (toolCall: ToolCall) => void;
  onSuggestionSelect: (suggestion: Suggestion) => void;
  onRetryConnection: () => void;
  theme: ChatThemeWithDefaults;
}

export function ChatMessageList({
  messages,
  isConnected,
  isLoading,
  proxyBaseUrl,
  onToolCallPress,
  onSuggestionSelect,
  onRetryConnection,
  theme,
}: ChatMessageListProps) {
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => (
    <View>
      <MessageBubble message={item} onToolCallPress={onToolCallPress} />
      {item.suggestions && item.suggestions.suggestions.length > 0 && (
        <SuggestionContainer
          suggestionContent={item.suggestions}
          onSelect={onSuggestionSelect}
          disabled={isLoading}
          showReasoning={false}
          showConfidence={false}
          animated={true}
        />
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={theme.emptyStateIcon} />
      <Text style={[styles.emptyStateText, { color: theme.emptyStateText }]}>
        Start a conversation with your AI agent
      </Text>
      <Text style={[styles.emptyStateSubtext, { color: theme.emptyStateText }]}>
        {isConnected
          ? `Connected to: ${proxyBaseUrl}`
          : `Disconnected from: ${proxyBaseUrl}`}
      </Text>
      {!isConnected && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primaryColor }]}
          onPress={onRetryConnection}
        >
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item.id}
      style={styles.messagesList}
      contentContainerStyle={styles.messagesContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmptyState}
    />
  );
}

const styles = StyleSheet.create({
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
