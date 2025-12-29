import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import type { Suggestion } from '../api/types';

export interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
  disabled?: boolean;
  selectedId?: string;
  containerStyle?: ViewStyle;
  chipStyle?: ViewStyle;
  selectedChipStyle?: ViewStyle;
  textStyle?: TextStyle;
  selectedTextStyle?: TextStyle;
  showConfidence?: boolean;
  confidenceStyle?: ViewStyle;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onSelect,
  disabled = false,
  selectedId,
  containerStyle,
  chipStyle,
  selectedChipStyle,
  textStyle,
  selectedTextStyle,
  showConfidence = false,
  confidenceStyle,
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const currentSelectedId = selectedId ?? internalSelectedId;

  const handlePress = (suggestion: Suggestion, index: number) => {
    if (disabled) return;

    const id = `${suggestion.value}-${index}`;
    setInternalSelectedId(id);
    onSelect(suggestion);
  };

  const getConfidenceColor = (confidence?: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return '#34C759'; // Green
      case 'medium':
        return '#FF9500'; // Orange
      case 'low':
        return '#FF3B30'; // Red
      default:
        return '#007AFF'; // Blue
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {suggestions.map((suggestion, index) => {
        const id = `${suggestion.value}-${index}`;
        const isSelected = currentSelectedId === id;

        return (
          <TouchableOpacity
            key={id}
            style={[
              styles.chip,
              isSelected ? styles.chipSelected : styles.chipUnselected,
              disabled && styles.chipDisabled,
              chipStyle,
              isSelected && selectedChipStyle,
            ]}
            onPress={() => handlePress(suggestion, index)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                textStyle,
                isSelected && selectedTextStyle,
              ]}
              numberOfLines={2}
            >
              {suggestion.text}
            </Text>
            {showConfidence && suggestion.confidence && (
              <View
                style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(suggestion.confidence) },
                  confidenceStyle,
                ]}
              >
                <Text style={styles.confidenceBadgeText}>
                  {suggestion.confidence.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#5B7C99',
  },
  chipSelected: {
    backgroundColor: '#5B7C99',
    borderColor: '#5B7C99',
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
  chipTextUnselected: {
    color: '#5B7C99',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  confidenceBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  confidenceBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
