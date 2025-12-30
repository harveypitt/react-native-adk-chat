import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatThemeWithDefaults } from '../theme';

export interface ChatHeaderProps {
  title?: string;
  isConnected: boolean;
  onNewChatPress: () => void;
  theme: ChatThemeWithDefaults;
}

export function ChatHeader({
  title = 'ADK Chat',
  isConnected,
  onNewChatPress,
  theme,
}: ChatHeaderProps) {
  return (
    <View style={[styles.header, { borderBottomColor: theme.headerBorder, backgroundColor: theme.headerBackground }]}>
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={onNewChatPress}
        disabled={!isConnected}
      >
        <Ionicons name="add" size={28} color={theme.headerText} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.headerText }]}>{title}</Text>
      <View style={styles.statusIndicator}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isConnected ? theme.statusConnected : theme.statusDisconnected },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  newChatButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  statusIndicator: {
    width: 40,
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
