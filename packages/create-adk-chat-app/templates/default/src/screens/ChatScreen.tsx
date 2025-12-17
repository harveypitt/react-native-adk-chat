import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import {
  MessageBubble,
  ChatInput,
  ProxyClient,
  type Message,
} from '@react-native-adk-chat/client';
import { PROXY_BASE_URL } from '../config/constants';

const DEFAULT_USER_ID = 'user_' + Date.now();

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const proxyClient = useRef(
    new ProxyClient({ baseUrl: PROXY_BASE_URL })
  ).current;

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const healthy = await proxyClient.checkHealth();
        if (!healthy) {
          setError('Cannot connect to proxy server');
          setIsInitializing(false);
          return;
        }

        const response = await proxyClient.createSession(DEFAULT_USER_ID);
        setSessionId(response.output.id);
        setIsInitializing(false);
      } catch (err) {
        console.error('Session initialization failed:', err);
        setError('Failed to initialize chat session');
        setIsInitializing(false);
      }
    };

    initSession();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      },
    ]);

    try {
      let accumulatedText = '';

      await proxyClient.sendMessage(
        {
          user_id: DEFAULT_USER_ID,
          session_id: sessionId,
          message: userMessage.content,
        },
        (chunk: string) => {
          accumulatedText += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: accumulatedText, isLoading: false }
                : msg
            )
          );
        }
      );

      setIsLoading(false);
    } catch (err) {
      console.error('Send failed:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: 'Error: Failed to get response',
                isLoading: false,
              }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.statusText}>Connecting...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.statusText}>
          Check that your proxy server is running
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
      />

      <ChatInput
        value={input}
        onChangeText={setInput}
        onSend={handleSend}
        disabled={isLoading || !sessionId}
        placeholder="Type a message..."
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  messageList: {
    padding: 16,
  },
  statusText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
