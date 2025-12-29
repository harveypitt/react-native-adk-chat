import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SuggestionChips, SuggestionChipsProps } from './SuggestionChips';
import type { SuggestionContent } from '../api/types';

export interface SuggestionContainerProps {
  suggestionContent: SuggestionContent;
  onSelect: SuggestionChipsProps['onSelect'];
  disabled?: boolean;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  reasoningStyle?: TextStyle;
  showReasoning?: boolean;
  showQuestionType?: boolean;
  showConfidence?: boolean;
  animated?: boolean;
}

export const SuggestionContainer: React.FC<SuggestionContainerProps> = ({
  suggestionContent,
  onSelect,
  disabled = false,
  containerStyle,
  titleStyle,
  reasoningStyle,
  showReasoning = true,
  showQuestionType = false,
  showConfidence = false,
  animated = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    }
  }, [suggestionContent, animated, fadeAnim, slideAnim]);

  const { suggestions, reasoning, questionType } = suggestionContent;

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const content = (
    <View style={[styles.container, containerStyle]}>
      {showQuestionType && questionType && (
        <Text style={[styles.questionType, titleStyle]}>
          {questionType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </Text>
      )}

      <SuggestionChips
        suggestions={suggestions}
        onSelect={onSelect}
        disabled={disabled}
        showConfidence={showConfidence}
      />

      {showReasoning && reasoning && (
        <View style={styles.reasoningContainer}>
          <Text style={[styles.reasoningIcon]}>💡</Text>
          <Text style={[styles.reasoning, reasoningStyle]}>{reasoning}</Text>
        </View>
      )}
    </View>
  );

  if (animated) {
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {content}
      </Animated.View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 8,
  },
  questionType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasoningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 4,
    gap: 6,
  },
  reasoningIcon: {
    fontSize: 14,
    lineHeight: 18,
  },
  reasoning: {
    flex: 1,
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
