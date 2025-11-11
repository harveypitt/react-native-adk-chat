import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface ToolCall {
  name: string;
  args?: any;
  status: 'calling' | 'complete';
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  toolCalls?: ToolCall[];
}

export interface MessageBubbleProps {
  message: Message;
}

const LoadingIndicator = () => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={{ opacity }}>
        <Ionicons name="ellipsis-horizontal" size={24} color="#111827" />
      </Animated.View>
    </View>
  );
};

const ToolCallIndicator: React.FC<{ toolCall: ToolCall }> = ({ toolCall }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (toolCall.status === 'calling') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      animation.start();
      return () => animation.stop();
    } else {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [toolCall.status, opacity]);

  return (
    <View style={styles.toolCallContainer}>
      <Animated.View style={styles.toolCallIconContainer}>
        <Animated.View style={{ opacity }}>
          <Ionicons
            name={toolCall.status === 'calling' ? "hammer" : "checkmark-circle"}
            size={18}
            color={toolCall.status === 'calling' ? "#6B7280" : "#10B981"}
          />
        </Animated.View>
      </Animated.View>
      <Text style={styles.toolCallText} numberOfLines={1}>
        {toolCall.name}
      </Text>
    </View>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userContainer : styles.aiContainer,
      ]}
    >
      <Text
        style={[
          styles.roleLabel,
          isUser ? styles.userRoleLabel : styles.aiRoleLabel,
        ]}
      >
        {isUser ? "You" : "AI"}
      </Text>
      {message.toolCalls && message.toolCalls.length > 0 && (
        <View style={styles.toolCallsWrapper}>
          {message.toolCalls.map((toolCall, index) => (
            <ToolCallIndicator key={index} toolCall={toolCall} />
          ))}
        </View>
      )}
      <View
        style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}
      >
        {message.isLoading && !message.content ? (
          <LoadingIndicator />
        ) : (
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.aiMessageText,
            ]}
          >
            {message.content}
          </Text>
        )}
      </View>
      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}
      </Text>
    </View>
  );
};

// Monochrome color palette
const colors = {
  userMessageBg: "#F3F4F6",
  userMessageText: "#111827",
  aiMessageBg: "#FFFFFF",
  aiMessageText: "#111827",
  aiMessageBorder: "#E5E7EB",
  background: "#FFFFFF",
  textSecondary: "#6B7280",
  textPlaceholder: "#9CA3AF",
};

const typography = {
  messageSize: 16,
  messageLineHeight: 24,
  timestampSize: 12,
  roleLabelSize: 13,
};

const spacing = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 28,
};

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: spacing.lg,
  },
  userContainer: {
    alignItems: "flex-end",
  },
  aiContainer: {
    alignItems: "flex-start",
  },
  roleLabel: {
    fontSize: typography.roleLabelSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  userRoleLabel: {
    alignSelf: "flex-end",
  },
  aiRoleLabel: {
    alignSelf: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: colors.userMessageBg,
  },
  aiBubble: {
    backgroundColor: colors.aiMessageBg,
    borderWidth: 1,
    borderColor: colors.aiMessageBorder,
  },
  messageText: {
    fontSize: typography.messageSize,
    lineHeight: typography.messageLineHeight,
    fontWeight: "400",
  },
  userMessageText: {
    color: colors.userMessageText,
  },
  aiMessageText: {
    color: colors.aiMessageText,
  },
  timestamp: {
    fontSize: typography.timestampSize,
    color: colors.textPlaceholder,
    marginTop: spacing.xs,
    fontWeight: "400",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  toolCallsWrapper: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
    alignSelf: "flex-start",
  },
  toolCallContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignSelf: "flex-start",
    minHeight: 32,
  },
  toolCallIconContainer: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  toolCallText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
    lineHeight: 18,
  },
});

export default MessageBubble;
