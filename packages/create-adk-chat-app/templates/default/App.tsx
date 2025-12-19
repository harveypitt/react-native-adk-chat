import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ToolResponseDebugScreen, type ToolCall } from '@react-native-adk-chat/client';
import ChatScreen from './src/screens/ChatScreen';

// Define the type for our navigation stack
type RootStackParamList = {
  Chat: undefined;
  ToolResponseDebug: { toolCall: ToolCall };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Chat"
          screenOptions={{
            cardStyle: { flex: 1 }
          }}
        >
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ headerShown: false }}
          />
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
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? { height: '100vh', overflow: 'hidden' } : {}),
  },
});
