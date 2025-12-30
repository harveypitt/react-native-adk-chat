import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import { ButtonGroup } from "./ButtonGroup";
import type { MessagePart, Message, ToolCall } from "../api/types";

// Re-export types for backwards compatibility
export type { Message, ToolCall };

export interface MessageBubbleProps {
  message: Message;
  onToolCallPress?: (toolCall: ToolCall) => void;
  onButtonPress?: (value: string) => void;
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

const ToolCallIndicator: React.FC<{ toolCall: ToolCall, onToolCallPress?: (toolCall: ToolCall) => void }> = ({ toolCall, onToolCallPress }) => {
  const opacity = useRef(new Animated.Value(toolCall.status === 'calling' ? 0.6 : 1)).current;

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

  const handlePress = () => {
    if (onToolCallPress && toolCall.status === 'complete' && toolCall.response) {
      onToolCallPress(toolCall);
    }
  };

  const isCalling = toolCall.status === 'calling';
  const isClickable = onToolCallPress && toolCall.status === 'complete' && toolCall.response;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!isClickable}
      style={[
        styles.toolCallContainer,
        isCalling && styles.toolCallContainerCalling,
      ]}
    >
      <Animated.View style={styles.toolCallIconContainer}>
        <Animated.View style={{ opacity }}>
          <Ionicons
            name={isCalling ? "hammer" : "checkmark-circle"}
            size={18}
            color={isCalling ? colors.greyedOutText : colors.brandGreen}
          />
        </Animated.View>
      </Animated.View>
      <Text
        style={[
          styles.toolCallText,
          isCalling && styles.toolCallTextCalling,
        ]}
        numberOfLines={1}
      >
        {toolCall.name}
      </Text>
    </TouchableOpacity>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onToolCallPress,
  onButtonPress,
}) => {
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
            <ToolCallIndicator key={toolCall.id || index} toolCall={toolCall} onToolCallPress={onToolCallPress} />
          ))}
        </View>
      )}
      <View
        style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}
      >
        {message.isLoading && !message.content ? (
          <LoadingIndicator />
        ) : (
          <Markdown
            style={isUser ? userMarkdownStyles : aiMarkdownStyles}
          >
            {message.content}
          </Markdown>
        )}
        {/* Render message parts (buttons, images, etc.) */}
        {message.parts?.map((part, index) => {
          if (part.type === "buttons" && part.buttons) {
            return (
              <ButtonGroup
                key={index}
                options={part.buttons}
                onPress={onButtonPress || (() => {})}
                disabled={!onButtonPress}
              />
            );
          }
          return null;
        })}
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
  textSecondaryLight: "#A0A7B0",
  textPlaceholder: "#9CA3AF",
  brandGreen: "#10B981",
  greyedOutBg: "#F2F3F5",
  greyedOutBorder: "#D1D5DB",
  greyedOutText: "#A0A7B0",
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
    ...Platform.select({
      web: {
        // @ts-ignore - boxShadow is supported on web
        boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
      },
      default: {},
    }),
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
    backgroundColor: colors.aiMessageBg, // Default background
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.aiMessageBorder, // Default border
    alignSelf: "flex-start",
    minHeight: 32,
  },
  toolCallContainerCalling: {
    backgroundColor: colors.greyedOutBg,
    borderColor: colors.greyedOutBorder,
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
    color: colors.textSecondary, // Default text color
    fontWeight: "500",
    lineHeight: 18,
  },
  toolCallTextCalling: {
    color: colors.greyedOutText,
  },
});

// Markdown styles for user messages
const userMarkdownStyles = StyleSheet.create({
  body: {
    fontSize: typography.messageSize,
    lineHeight: typography.messageLineHeight,
    fontWeight: "400",
    color: colors.userMessageText,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 0,
  },
  heading1: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.userMessageText,
    marginTop: 8,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.userMessageText,
    marginTop: 8,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.userMessageText,
    marginTop: 6,
    marginBottom: 6,
  },
  code_inline: {
    backgroundColor: "#E5E7EB",
    color: colors.userMessageText,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
  },
  code_block: {
    backgroundColor: "#E5E7EB",
    color: colors.userMessageText,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
  },
  fence: {
    backgroundColor: "#E5E7EB",
    color: colors.userMessageText,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
  },
  strong: {
    fontWeight: "700",
    color: colors.userMessageText,
  },
  em: {
    fontStyle: "italic",
    color: colors.userMessageText,
  },
  link: {
    color: "#2563EB",
    textDecorationLine: "underline",
  },
  blockquote: {
    backgroundColor: "#E5E7EB",
    borderLeftColor: colors.textSecondary,
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
});

// Markdown styles for AI messages
const aiMarkdownStyles = StyleSheet.create({
  body: {
    fontSize: typography.messageSize,
    lineHeight: typography.messageLineHeight,
    fontWeight: "400",
    color: colors.aiMessageText,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 0,
  },
  heading1: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.aiMessageText,
    marginTop: 8,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.aiMessageText,
    marginTop: 8,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.aiMessageText,
    marginTop: 6,
    marginBottom: 6,
  },
  code_inline: {
    backgroundColor: colors.userMessageBg,
    color: colors.aiMessageText,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
  },
  code_block: {
    backgroundColor: colors.userMessageBg,
    color: colors.aiMessageText,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
  },
  fence: {
    backgroundColor: colors.userMessageBg,
    color: colors.aiMessageText,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
  },
  strong: {
    fontWeight: "700",
    color: colors.aiMessageText,
  },
  em: {
    fontStyle: "italic",
    color: colors.aiMessageText,
  },
  link: {
    color: "#2563EB",
    textDecorationLine: "underline",
  },
  blockquote: {
    backgroundColor: colors.userMessageBg,
    borderLeftColor: colors.textSecondary,
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
});

export default MessageBubble;
