import React from "react";
import { View, Text, StyleSheet } from "react-native";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface MessageBubbleProps {
  message: Message;
}

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
      <View
        style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}
      >
        <Text
          style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.aiMessageText,
          ]}
        >
          {message.content}
        </Text>
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
});

export default MessageBubble;
