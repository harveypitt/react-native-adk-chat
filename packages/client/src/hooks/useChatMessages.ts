import { useState, useCallback } from 'react';
import { ProxyClient } from '../api/proxyClient';
import { Message, ToolCall, Suggestion, SuggestionContent } from '../api/types';
import { Alert, Platform } from 'react-native';

export interface UseChatMessagesConfig {
  proxyClient: ProxyClient;
  userId: string;
  sessionId: string;
  proxyBaseUrl: string;
}

export interface UseChatMessagesReturn {
  messages: Message[];
  input: string;
  isLoading: boolean;
  setInput: (text: string) => void;
  sendMessage: (messageText?: string) => Promise<void>;
  handleSuggestionSelect: (suggestion: Suggestion) => Promise<void>;
  clearMessages: () => void;
}

/**
 * Hook to manage chat messages and message streaming
 */
export function useChatMessages(config: UseChatMessagesConfig): UseChatMessagesReturn {
  const { proxyClient, userId, sessionId, proxyBaseUrl } = config;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = useCallback((title: string, message: string) => {
    if (Platform.OS === 'web') {
      (window as any).alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText ?? input.trim();

    if (!textToSend || isLoading || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create a placeholder message for the AI response
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
      toolCalls: [],
    };

    setMessages((prev) => [...prev, aiMessage]);

    try {
      let accumulatedText = '';
      // Map to store tool calls by their ID for easy updates
      const currentToolCalls = new Map<string, ToolCall>();

      // Send message with streaming callback
      await proxyClient.sendMessage(
        {
          user_id: userId,
          session_id: sessionId,
          message: textToSend,
        },
        (
          chunk: string,
          invocationId: string,
          type: 'text' | 'functionCall' | 'functionResponse' | 'suggestions',
          eventData: any
        ) => {
          // Debug logging
          if (type === 'functionCall') {
            console.log('Received functionCall:', eventData.functionCall.name);
          } else if (type === 'functionResponse') {
            console.log('Received functionResponse for:', eventData.functionResponse.name);
          } else if (type === 'suggestions') {
            console.log('Received suggestions:', eventData.content.suggestions.length, 'options');
          }

          // Update the AI message with each chunk
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === aiMessageId) {
                if (type === 'text') {
                  accumulatedText += chunk;
                  return { ...msg, content: accumulatedText, isLoading: false };
                } else if (type === 'functionCall') {
                  const { id, name, args } = eventData.functionCall;
                  const newToolCall: ToolCall = { id, name, args, status: 'calling' };
                  currentToolCalls.set(id, newToolCall);
                  const updatedToolCalls = Array.from(currentToolCalls.values());
                  return { ...msg, toolCalls: updatedToolCalls };
                } else if (type === 'functionResponse') {
                  const { id, name, response } = eventData.functionResponse;
                  const existingToolCall = currentToolCalls.get(id);
                  if (existingToolCall) {
                    existingToolCall.status = 'complete';
                    existingToolCall.response = response;
                    currentToolCalls.set(id, existingToolCall);
                  }
                  const updatedToolCalls = Array.from(currentToolCalls.values());
                  return { ...msg, toolCalls: updatedToolCalls };
                } else if (type === 'suggestions') {
                  // Add suggestions to the message
                  const suggestionsContent: SuggestionContent = eventData.content;
                  return { ...msg, suggestions: suggestionsContent };
                }
              }
              return msg;
            })
          );
        }
      );

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);

      // Update the AI message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content:
                  'Sorry, I encountered an error. Please make sure the proxy server is running and try again.',
                isLoading: false,
              }
            : msg
        )
      );

      showAlert(
        'Connection Error',
        'Failed to connect to proxy server. Please ensure it\'s running at ' + proxyBaseUrl
      );
    }
  }, [input, isLoading, sessionId, proxyClient, userId, proxyBaseUrl, showAlert]);

  const handleSuggestionSelect = useCallback(async (suggestion: Suggestion) => {
    // Use the sendMessage function with the suggestion value
    await sendMessage(suggestion.value);
  }, [sendMessage]);

  return {
    messages,
    input,
    isLoading,
    setInput,
    sendMessage,
    handleSuggestionSelect,
    clearMessages,
  };
}
