import React, { useState, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  MessageBubble,
  ChatInput,
  ProxyClient,
  type Message,
  type ToolCall,
} from "../../packages/client/src";

// Configuration - use environment variables or defaults
const PROXY_BASE_URL = process.env.PROXY_BASE_URL || "http://localhost:3000";
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || "harvey_123";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const proxyClient = useRef(
    new ProxyClient({ baseUrl: PROXY_BASE_URL })
  ).current;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Initialize session on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const healthy = await proxyClient.checkHealth();
      setIsConnected(healthy);
      if (healthy) {
        await initializeSession();
      } else {
        window.alert(
          `Connection Error: Cannot connect to proxy server at ${PROXY_BASE_URL}. Make sure the server is running.`
        );
      }
    } catch (error) {
      console.error("Connection check failed:", error);
      setIsConnected(false);
    }
  };

  const initializeSession = async () => {
    try {
      const response = await proxyClient.createSession(DEFAULT_USER_ID);
      const newSessionId = response.output.id;
      setSessionId(newSessionId);
      console.log("Session created:", newSessionId);
    } catch (error) {
      console.error("Failed to create session:", error);
      window.alert(
        "Session Error: Failed to create session. Please check your server connection."
      );
    }
  };

  const handleNewChat = async () => {
    console.log("handleNewChat clicked, current messages count:", messages.length);

    const createNewSession = async () => {
      console.log("createNewSession called - clearing UI and creating new session");
      try {
        // Clear UI immediately
        setMessages([]);
        setInput("");
        setIsLoading(false);

        // Create new session
        console.log("Calling proxyClient.createSession...");
        const response = await proxyClient.createSession(DEFAULT_USER_ID);
        const newSessionId = response.output.id;
        setSessionId(newSessionId);
        console.log("✅ New session created successfully:", newSessionId);
      } catch (error) {
        console.error("❌ Failed to create new session:", error);
        window.alert(
          "Error: Failed to create new session. Please try again."
        );
      }
    };

    // If no messages, just create new session without confirmation
    if (messages.length === 0) {
      console.log("No messages - creating session without confirmation");
      await createNewSession();
      return;
    }

    console.log("Messages exist - showing confirmation dialog");

    // If there are messages, ask for confirmation
    if (window.confirm("Start a new conversation? This will clear your current chat.")) {
      await createNewSession();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Create a placeholder message for the AI response
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, aiMessage]);

    try {
      let accumulatedText = "";
      const toolCalls: ToolCall[] = [];

      // Send message with streaming callback
      await proxyClient.sendMessage(
        {
          user_id: DEFAULT_USER_ID,
          session_id: sessionId,
          message: userMessage.content,
        },
        (chunk: string) => {
          // Update the AI message with each chunk
          accumulatedText += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: accumulatedText, isLoading: false }
                : msg
            )
          );
        },
        (toolName: string, status: 'calling' | 'complete', args?: any) => {
          // Handle tool calls
          const existingToolIndex = toolCalls.findIndex(t => t.name === toolName);

          if (existingToolIndex >= 0) {
            // Update existing tool call status
            toolCalls[existingToolIndex] = { name: toolName, status, args };
          } else {
            // Add new tool call
            toolCalls.push({ name: toolName, status, args });
          }

          // Update the message with tool calls
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, toolCalls: [...toolCalls] }
                : msg
            )
          );
        }
      );

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsLoading(false);

      // Update the AI message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content:
                  "Sorry, I encountered an error. Please make sure the proxy server is running and try again.",
                isLoading: false,
              }
            : msg
        )
      );

      window.alert(
        "Connection Error: Failed to connect to proxy server. Please ensure it's running at " +
          PROXY_BASE_URL
      );
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={handleNewChat}
              disabled={!isConnected}
            >
              <Ionicons name="add" size={28} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>ADK Chat</Text>
            <View style={styles.statusIndicator}>
              <View
                style={[
                  styles.statusDot,
                  isConnected ? styles.statusConnected : styles.statusDisconnected,
                ]}
              />
            </View>
          </View>

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
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={64}
                    color="#E5E7EB"
                  />
                  <Text style={styles.emptyStateText}>
                    Start a conversation with your AI agent
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    {isConnected
                      ? `Connected to: ${PROXY_BASE_URL}`
                      : `Disconnected from: ${PROXY_BASE_URL}`}
                  </Text>
                  {!isConnected && (
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={checkConnection}
                    >
                      <Text style={styles.retryButtonText}>Retry Connection</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />

            <ChatInput
              value={input}
              onChangeText={setInput}
              onSend={handleSend}
              disabled={isLoading || !isConnected || !sessionId}
              placeholder={
                !isConnected
                  ? "Connecting to server..."
                  : !sessionId
                  ? "Creating session..."
                  : isLoading
                  ? "AI is thinking..."
                  : "How can I help you today?"
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  newChatButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    zIndex: -1,
  },
  statusIndicator: {
    width: 100,
    alignItems: "flex-end",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusConnected: {
    backgroundColor: "#10B981",
  },
  statusDisconnected: {
    backgroundColor: "#EF4444",
  },
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
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#111827",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
