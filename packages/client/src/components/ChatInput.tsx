import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  placeholder = "How can I help you today?",
  disabled = false,
}) => {
  const handleSubmitEditing = (e: any) => {
    e.preventDefault();
    if (!disabled && value.trim()) {
      onSend();
      onChangeText("");
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === "Enter") {
      if (e.nativeEvent.shiftKey) {
        return;
      } else {
        e.preventDefault();
        if (!disabled && value.trim()) {
          onSend();
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="center"
          editable={!disabled}
          maxLength={1000}
          onSubmitEditing={handleSubmitEditing}
          onKeyPress={handleKeyPress}
          blurOnSubmit={false}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, disabled && styles.sendButtonDisabled]}
          onPress={onSend}
          disabled={disabled || !value.trim()}
        >
          <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 24,
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 8,
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    color: "#111827",
    minHeight: 40,
    maxHeight: 100,
    paddingVertical: 10,
    paddingRight: 8,
    backgroundColor: "transparent",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  sendButton: {
    backgroundColor: "#111827",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
    opacity: 0.5,
  },
});

export default ChatInput;
