import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { ToolCall } from './MessageBubble';
import { Ionicons } from "@expo/vector-icons";

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
      return String(json);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={styles.headerContainer}>
          <View style={[
            styles.iconContainer,
            toolCall.status === 'complete' ? styles.iconComplete : styles.iconCalling
          ]}>
            <Ionicons
              name={toolCall.status === 'calling' ? "hammer" : "checkmark"}
              size={24}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.toolName}>{toolCall.name}</Text>
            <View style={[
              styles.statusBadge,
              toolCall.status === 'complete' ? styles.statusBadgeComplete : styles.statusBadgeCalling
            ]}>
              <Text style={[
                styles.statusText,
                 toolCall.status === 'complete' ? styles.statusTextComplete : styles.statusTextCalling
              ]}>
                {toolCall.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ARGUMENTS</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>{formatJson(toolCall.args)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>RESPONSE</Text>
          {toolCall.response ? (
            <View style={styles.codeBlock}>
              <Text style={styles.code}>{formatJson(toolCall.response)}</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              {toolCall.status === 'complete'
                ? "No response data returned."
                : "Waiting for response..."}
            </Text>
          )}
        </View>

        {/* ID for debugging tracking */}
        <View style={styles.metaContainer}>
           <Text style={styles.metaText}>ID: {toolCall.id}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const colors = {
  background: "#F3F4F6",
  cardBg: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  brandGreen: "#10B981",
  brandGreenBg: "#ECFDF5",
  brandGreenText: "#065F46",
  brandGrey: "#6B7280",
  brandGreyBg: "#F3F4F6",
  brandGreyText: "#374151",
  codeBg: "#F9FAFB",
  codeText: "#1F2937",
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconComplete: {
    backgroundColor: colors.brandGreen,
  },
  iconCalling: {
    backgroundColor: colors.brandGrey,
  },
  headerTextContainer: {
    flex: 1,
  },
  toolName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeComplete: {
    backgroundColor: colors.brandGreenBg,
  },
  statusBadgeCalling: {
    backgroundColor: colors.brandGreyBg,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextComplete: {
    color: colors.brandGreenText,
  },
  statusTextCalling: {
    color: colors.brandGreyText,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  codeBlock: {
    backgroundColor: colors.codeBg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
    color: colors.codeText,
  },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 14,
  },
  metaContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default ToolResponseDebugScreen;
