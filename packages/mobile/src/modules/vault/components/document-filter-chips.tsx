import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import type { VaultFilterValue } from '../types/vault.types';

interface DocumentFilterChipsProps {
  value: VaultFilterValue;
  onChange: (value: VaultFilterValue) => void;
}

const FILTERS: VaultFilterValue[] = [
  'all',
  'personal',
  'wizard',
  'generated',
  'expiring',
  'expired',
];

export function DocumentFilterChips({ value, onChange }: DocumentFilterChipsProps) {
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((filter) => (
        <View key={filter} style={styles.chip}>
          <Chip
            selected={value === filter}
            onPress={() => onChange(filter)}
            mode={value === filter ? 'flat' : 'outlined'}
            compact
          >
            {t(`vault.filters.${filter}`)}
          </Chip>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
});
