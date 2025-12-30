import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { ChatScreen } from './ChatScreen';
import ToolResponseDebugScreen from './ToolResponseDebugScreen';
import { ChatTheme, mergeTheme } from '../theme';
import { ToolCall } from '../api/types';

export interface ChatAppProps {
  proxyUrl: string;
  userId?: string;
  title?: string;
  theme?: ChatTheme;
}

type RootStackParamList = {
  Chat: undefined;
  ToolResponseDebug: { toolCall: ToolCall };
};

const Stack = createStackNavigator<RootStackParamList>();

export function ChatApp({
  proxyUrl,
  userId,
  title,
  theme: userTheme,
}: ChatAppProps) {
  const theme = mergeTheme(userTheme);

  return (
    <SafeAreaProvider style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Chat"
          screenOptions={{
            cardStyle: { flex: 1 },
          }}
        >
          <Stack.Screen name="Chat" options={{ headerShown: false }}>
            {({ navigation }) => (
              <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <StatusBar style="dark" />
                <ChatScreen
                  proxyBaseUrl={proxyUrl}
                  userId={userId}
                  title={title}
                  theme={userTheme}
                  onToolCallPress={(toolCall) => {
                    navigation.navigate('ToolResponseDebug', { toolCall });
                  }}
                />
              </SafeAreaView>
            )}
          </Stack.Screen>
          <Stack.Screen
            name="ToolResponseDebug"
            component={ToolResponseDebugScreen}
            options={{ title: 'Tool Response' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' ? ({ height: '100vh', overflow: 'hidden' } as any) : {}),
  },
});
