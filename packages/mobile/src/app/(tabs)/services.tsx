/**
 * Services Tab — Placeholder
 *
 * Service catalog browser showing:
 * - Search bar
 * - Ministry cards grid
 * - "See all services" button
 *
 * TODO: Wire up to GET /fiscal-services/ and GET /ministries/
 */

import { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Searchbar, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';

/** Placeholder ministry data for UI structure */
const MOCK_MINISTRIES = [
  { id: '1', name: 'CNEDOGE', icon: 'passport' as const, serviceCount: 12 },
  { id: '2', name: 'DGT', icon: 'car' as const, serviceCount: 8 },
  { id: '3', name: 'ONRC', icon: 'file-sign' as const, serviceCount: 15 },
  { id: '4', name: 'ITVE', icon: 'car-cog' as const, serviceCount: 5 },
  { id: '5', name: 'Hacienda', icon: 'cash-register' as const, serviceCount: 20 },
  { id: '6', name: 'Seguridad', icon: 'shield-account' as const, serviceCount: 10 },
];

export default function ServicesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredMinistries = MOCK_MINISTRIES.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
      >
        {/* Header */}
        <Text
          variant="headlineSmall"
          style={[styles.title, { color: colors.onBackground, marginBottom: spacing.md }]}
        >
          {t('services.title')}
        </Text>

        {/* Search bar */}
        <Searchbar
          placeholder={t('services.searchPlaceholder')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surfaceVariant,
              borderRadius: borderRadius.md,
              marginBottom: spacing.lg,
            },
          ]}
          inputStyle={{ color: colors.onSurface }}
          iconColor={colors.onSurfaceVariant}
          placeholderTextColor={colors.outline}
        />

        {/* Categories section */}
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: colors.onBackground, marginBottom: spacing.sm }]}
        >
          {t('services.allMinistries')}
        </Text>

        {/* Ministry grid */}
        <View style={[styles.grid, { gap: spacing.sm }]}>
          {filteredMinistries.map((ministry) => (
            <Card
              key={ministry.id}
              style={[
                styles.ministryCard,
                {
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={() => router.push(`/service/${ministry.id}`)}
            >
              <Card.Content style={[styles.cardContent, { padding: spacing.md }]}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: colors.primaryContainer,
                      borderRadius: borderRadius.full,
                      width: 48,
                      height: 48,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={ministry.icon}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text
                  variant="titleSmall"
                  style={{ color: colors.onSurface }}
                  numberOfLines={1}
                >
                  {ministry.name}
                </Text>
                <Text
                  variant="labelSmall"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  {ministry.serviceCount} {t('services.title').toLowerCase()}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* See all */}
        <Button
          mode="outlined"
          onPress={() => {
            // TODO: Navigate to full services catalog
          }}
          style={{ marginTop: spacing.lg }}
          icon="arrow-right"
          contentStyle={styles.seeAllContent}
        >
          {t('common.seeAll')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    fontWeight: '700',
  },
  searchBar: {
    elevation: 0,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ministryCard: {
    width: '48%',
    minWidth: 150,
  },
  cardContent: {
    alignItems: 'center',
  },
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  seeAllContent: {
    flexDirection: 'row-reverse',
  },
});
