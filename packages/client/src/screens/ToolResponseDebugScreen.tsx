import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { ToolCall } from '../components/MessageBubble'; // Assuming MessageBubble exports ToolCall interface

type RootStackParamList = {
  Chat: undefined;
  ToolResponseDebug: { toolCall: ToolCall };
};

type ToolResponseDebugScreenProps = StackScreenProps<RootStackParamList, 'ToolResponseDebug'>;

const ToolResponseDebugScreen: React.FC<ToolResponseDebugScreenProps> = ({ route }) => {
  const { toolCall } = route.params;

  const formatJson = (json: any) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return String(json); // Fallback for non-JSON content
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Tool Call Details</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tool Name:</Text>
        <Text style={styles.text}>{toolCall.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status:</Text>
        <Text style={styles.text}>{toolCall.status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Arguments:</Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>{formatJson(toolCall.args)}</Text>
        </View>
      </View>

      {toolCall.response && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Response:</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>{formatJson(toolCall.response)}</Text>
          </View>
        </View>
      )}

      {!toolCall.response && toolCall.status === 'complete' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Response:</Text>
          <Text style={styles.text}>No response data available for this completed tool call.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const colors = {
  background: "#F9FAFB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  codeBackground: "#E5E7EB",
  codeText: "#1F2937",
  border: "#D1D5DB",
};

const spacing = {
  sm: 12,
  md: 20,
  lg: 28,
};

const typography = {
  headerSize: 24,
  sectionTitleSize: 18,
  textSize: 16,
  codeSize: 14,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  header: {
    fontSize: typography.headerSize,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sectionTitleSize,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm / 2,
  },
  text: {
    fontSize: typography.textSize,
    color: colors.textSecondary,
    lineHeight: typography.textSize * 1.4,
  },
  codeBlock: {
    backgroundColor: colors.codeBackground,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  code: {
    fontFamily: 'Menlo', // Or 'monospace'
    fontSize: typography.codeSize,
    color: colors.codeText,
    lineHeight: typography.codeSize * 1.5,
  },
});

export default ToolResponseDebugScreen;
