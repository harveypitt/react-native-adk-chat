import React, { useState, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import MessageBubble, { Message } from "./src/components/MessageBubble";
import ChatInput from "./src/components/ChatInput";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! How can I help you today?",
      timestamp: new Date(Date.now() - 60000),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Canned responses for prototyping
  const getCannedResponse = (userMessage: string): string => {
    const responses = [
      "That's an interesting question. Let me think about that for you.",
      "I understand what you're asking. Here's what I would suggest...",
      "Thanks for sharing that with me. I'm here to help you work through this.",
      "That's a great point! Have you considered looking at it from this angle?",
      "I'm here to assist you. Could you tell me a bit more about what you need?",
      "Let me help you with that. First, we should break this down into smaller steps.",
    ];

    // Simple keyword-based response selection
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes("help") || lowerMessage.includes("assist")) {
      return "I'm here to help! What specific challenge are you facing right now?";
    } else if (lowerMessage.includes("how") || lowerMessage.includes("what")) {
      return responses[1];
    } else if (
      lowerMessage.includes("thanks") ||
      lowerMessage.includes("thank")
    ) {
      return "You're welcome! Is there anything else I can help you with?";
    } else {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate API delay for realistic feel
    setTimeout(
      () => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: getCannedResponse(userMessage.content),
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiResponse]);
        setIsLoading(false);
      },
      800 + Math.random() * 700,
    ); // 800-1500ms delay
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        <View style={styles.contentWrapper}>
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            />

            <ChatInput
              value={input}
              onChangeText={setInput}
              onSend={handleSend}
              disabled={isLoading}
              placeholder={
                isLoading ? "AI is thinking..." : "How can I help you today?"
              }
            />
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentWrapper: {
    flex: 1,
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
});
