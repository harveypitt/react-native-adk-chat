import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import type { ButtonOption } from '../api/types';

export interface ButtonGroupProps {
  options: ButtonOption[];
  onPress: (value: string) => void;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  options,
  onPress,
  disabled = false,
  containerStyle,
  buttonStyle,
  textStyle,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.container, containerStyle]}
      contentContainerStyle={styles.contentContainer}
    >
      {options.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.button,
            disabled && styles.buttonDisabled,
            buttonStyle,
          ]}
          onPress={() => !disabled && onPress(option.value)}
          disabled={disabled}
        >
          <Text style={[styles.buttonText, textStyle]}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  contentContainer: {
    paddingHorizontal: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
