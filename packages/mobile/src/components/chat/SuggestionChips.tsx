/**
 * TaxasGE Mobile - Suggestion Chips Component
 * Affiche des suggestions de réponses rapides (quick replies)
 * Date: 2025-10-13
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export interface SuggestionChipsProps {
  suggestions: string[];
  onSuggestionPress: (suggestion: string) => void;
  maxVisible?: number;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onSuggestionPress,
  maxVisible = 3,
}) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const visibleSuggestions = suggestions.slice(0, maxVisible);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleSuggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={`suggestion-${index}`}
            style={styles.chip}
            onPress={() => onSuggestionPress(suggestion)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText} numberOfLines={1}>
              {suggestion}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});
