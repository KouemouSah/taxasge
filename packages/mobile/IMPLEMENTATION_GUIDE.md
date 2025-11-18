# TaxasGE Mobile - Phase 2 Implementation Guide

## ✅ Completed (Phase 1)

1. **i18n System** - Complete translations in ES/FR/EN
   - `src/i18n/es.json` - Spanish translations
   - `src/i18n/fr.json` - French translations
   - `src/i18n/en.json` - English translations
   - `src/i18n/index.js` - Helper functions (t, getSection, useTranslation)

2. **Infrastructure Components**
   - `src/components/GradientHeader.tsx`
   - `src/components/BottomTabBar.tsx`
   - `src/components/ModernIcon.tsx`
   - `src/theme/gradients.ts`

3. **Example Screen**
   - `src/screens/MinisteriosScreen.tsx` (needs i18n update)

## 🔴 Next Steps - Priority Order

### Step 1: Update MinisteriosScreen to use i18n

**File:** `packages/mobile/src/screens/MinisteriosScreen.tsx`

```typescript
// Add import at top
import { getSection } from '../i18n';

// Replace TEXTS constant with:
const MinisteriosScreen: React.FC<MinisteriosScreenProps> = ({
  language,
  onBack,
  onMinistryPress,
  onTabPress,
}) => {
  const t = getSection(language, 'ministeriosScreen');

  // Use t.title, t.loading, t.error, t.services instead of TEXTS[language]
```

### Step 2: Update HomeScreen.tsx

**File:** `packages/mobile/src/screens/HomeScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { GradientHeader } from '../components/GradientHeader';
import { BottomTabBar, TabName } from '../components/BottomTabBar';
import { getSection } from '../i18n';
import { HEADER_GRADIENT, GRADIENTS, Colors, Spacing, Shadows } from '../theme';
import { Ministry, FiscalService } from '../database/services/FiscalServicesService';
import DatabaseService from '../database/DatabaseService';

interface HomeScreenProps {
  language: 'es' | 'fr' | 'en';
  onNavigate: (screen: string, data?: any) => void;
  onTabPress: (tab: TabName) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  language,
  onNavigate,
  onTabPress,
}) => {
  const t = getSection(language, 'homeScreen');
  const [searchQuery, setSearchQuery] = useState('');
  const [randomMinistries, setRandomMinistries] = useState<Array<Ministry & { service_count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRandomMinistries();
  }, []);

  const loadRandomMinistries = async () => {
    try {
      setIsLoading(true);
      const db = DatabaseService.getInstance();

      // Load all ministries with service count
      const allMinistries = await db.query<Ministry & { service_count: number }>(
        `SELECT
          m.*,
          COUNT(DISTINCT fs.id) as service_count
        FROM ministries m
        LEFT JOIN fiscal_services fs ON fs.ministry_id = m.id AND fs.status = 'active'
        WHERE m.status = 'active'
        GROUP BY m.id
        HAVING service_count > 0
        ORDER BY RANDOM()
        LIMIT 4`,
        []
      );

      setRandomMinistries(allMinistries);
    } catch (error) {
      console.error('[HomeScreen] Error loading ministries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMinistryName = (ministry: Ministry): string => {
    if (language === 'fr' && ministry.name_fr) return ministry.name_fr;
    if (language === 'en' && ministry.name_en) return ministry.name_en;
    return ministry.name_es;
  };

  const getMinistryGradient = (index: number): string[] => {
    const gradients = [
      GRADIENTS.ministryYellow,
      GRADIENTS.ministryCyan,
      GRADIENTS.ministryOrange,
      GRADIENTS.ministryBlue,
    ];
    return gradients[index % gradients.length];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/taxasge.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>{t.title}</Text>
                <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Text style={styles.notificationIcon}>🔔</Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t.searchPlaceholder}
              placeholderTextColor="#999999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  onNavigate('search', { query: searchQuery });
                }
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Scrollable content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.quickActionsTitle}</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('search')}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#4A90E2', '#357ABD']}
                style={styles.actionCardGradient}>
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>🔍</Text>
                </View>
                <Text style={styles.actionLabel}>{t.quickActions.searchServices}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('chatbot')}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#50C878', '#3EAE63']}
                style={styles.actionCardGradient}>
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>🤖</Text>
                </View>
                <Text style={styles.actionLabel}>{t.quickActions.contactAssistant}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('favorites')}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#E91E63', '#C2185B']}
                style={styles.actionCardGradient}>
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>❤️</Text>
                </View>
                <Text style={styles.actionLabel}>{t.quickActions.myFavorites}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('appointments')}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#9C27B0', '#7B1FA2']}
                style={styles.actionCardGradient}>
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>📅</Text>
                </View>
                <Text style={styles.actionLabel}>{t.quickActions.scheduledAppointments}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ministerios Populares - REDUCED SPACING */}
        <View style={[styles.section, { marginTop: Spacing.md }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.popularMinistriesTitle}</Text>
            <TouchableOpacity onPress={() => onNavigate('ministerios')}>
              <Text style={styles.viewAllLink}>{t.viewAll} →</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <View style={styles.ministriesContainer}>
              {randomMinistries.map((ministry, index) => (
                <TouchableOpacity
                  key={ministry.id}
                  style={styles.ministryCard}
                  onPress={() => onNavigate('ministerioDetail', ministry)}
                  activeOpacity={0.8}>
                  <View style={[styles.ministryIconCircle, { backgroundColor: getMinistryGradient(index)[0] }]}>
                    <Text style={styles.ministryIcon}>🏛️</Text>
                  </View>
                  <View style={styles.ministryInfo}>
                    <Text style={styles.ministryName} numberOfLines={2}>
                      {getMinistryName(ministry)}
                    </Text>
                    <Text style={styles.ministryServices}>
                      {ministry.service_count} {t.services}
                    </Text>
                  </View>
                  <Text style={styles.ministryArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <BottomTabBar activeTab="home" onTabPress={onTabPress} language={language} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
  },
  clearIcon: {
    fontSize: 16,
    color: '#999999',
    paddingHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.md,
  },
  actionCardGradient: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionIconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 48,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  ministriesContainer: {
    gap: Spacing.sm,
  },
  ministryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  ministryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  ministryIcon: {
    fontSize: 24,
  },
  ministryInfo: {
    flex: 1,
  },
  ministryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ministryServices: {
    fontSize: 13,
    color: '#666666',
  },
  ministryArrow: {
    fontSize: 18,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
});

export default HomeScreen;
```

### Step 3: Create MinisterioDetailScreen.tsx

See TODO_UI_REDESIGN.md Section 2 for complete implementation.

### Step 4: Create ProfileScreen.tsx

See TODO_UI_REDESIGN.md Section 3 for complete implementation.

### Step 5: Redesign ChatbotScreen.tsx

See TODO_UI_REDESIGN.md Section 4 for complete implementation.

---

## Usage of i18n System

All new screens should use the i18n system:

```typescript
import { getSection } from '../i18n';

const MyScreen = ({ language }) => {
  const t = getSection(language, 'sectionName');

  return (
    <Text>{t.title}</Text>
  );
};
```

Available sections:
- `common` - Common UI elements
- `navigation` - Tab labels
- `homeScreen` - Home screen
- `ministeriosScreen` - Ministries list
- `ministerioDetail` - Ministry detail
- `profileScreen` - Profile/settings
- `chatbotScreen` - Chatbot
- `serviceDetailScreen` - Service detail
- `onboarding` - Onboarding screens

---

## Testing

After implementation:

```bash
cd packages/mobile
npm run lint:check  # Should have 0 errors
```

---

## Commit Strategy

Commit in logical phases:
1. i18n system + HomeScreen update
2. MinisterioDetailScreen + ProfileScreen
3. ChatbotScreen redesign
4. Integration + testing
