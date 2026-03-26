/**
 * Onboarding Screen — First launch only
 *
 * 3 swipable screens introducing the app:
 * 1. Welcome — platform overview
 * 2. Smart & Secure — AI + security
 * 3. Get Started — language selector + auth buttons
 *
 * Shown once. Flag stored in MMKV. Subsequent launches skip to home.
 */

import { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Dimensions,
  Pressable,
  type ViewToken,
  Image,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

import { useAppTheme } from '@core/theme';
import { setApiLocale } from '@core/api/client';
import { storage } from '@core/storage/mmkv';
import type { SupportedLanguage } from '@core/config/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_completed';

// ---------------------------------------------------------------------------
// Slide data
// ---------------------------------------------------------------------------

interface Slide {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animation?: any;
  icon?: string;
  titleKey: string;
  descKey: string;
  bgColor: string;
  accentColor: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    animation: require('../../assets/animations/robot.json'),
    titleKey: 'onboarding.slide1.title',
    descKey: 'onboarding.slide1.desc',
    bgColor: '#E8F5E9',
    accentColor: '#0D6E3F',
  },
  {
    id: '2',
    animation: require('../../assets/animations/chatbot.json'),
    titleKey: 'onboarding.slide2.title',
    descKey: 'onboarding.slide2.desc',
    bgColor: '#E3F2FD',
    accentColor: '#1565C0',
  },
  {
    id: '3',
    icon: 'rocket-launch-outline',
    titleKey: 'onboarding.slide3.title',
    descKey: 'onboarding.slide3.desc',
    bgColor: '#FFF8E1',
    accentColor: '#F57F17',
  },
];

const LANGUAGES: Array<{ code: SupportedLanguage; label: string; flag: string }> = [
  { code: 'es', label: 'Español', flag: '🇬🇶' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function OnboardingScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || 'es',
  );
  const flatListRef = useRef<FlatList>(null);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      completeOnboarding();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }, [currentIndex, isLastSlide]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, []);

  const handleLanguageChange = useCallback(async (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    await i18n.changeLanguage(lang);
    setApiLocale(lang);
  }, [i18n]);

  const completeOnboarding = useCallback(() => {
    storage.set(ONBOARDING_KEY, true);
    router.replace('/' as never);
  }, [router]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // ---------------------------------------------------------------------------
  // Render slide
  // ---------------------------------------------------------------------------

  const renderSlide = ({ item, index }: { item: Slide; index: number }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH, backgroundColor: item.bgColor }]}>
      {/* Animation or icon */}
      <View style={styles.animationContainer}>
        {item.animation ? (
          <LottieView
            source={item.animation}
            autoPlay
            loop
            style={styles.lottie}
          />
        ) : (
          <View style={[styles.iconCircle, { backgroundColor: `${item.accentColor}20` }]}>
            <MaterialCommunityIcons
              name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={64}
              color={item.accentColor}
            />
          </View>
        )}
      </View>

      {/* Text */}
      <View style={styles.textContainer}>
        <Text variant="headlineSmall" style={[styles.title, { color: item.accentColor }]}>
          {t(item.titleKey)}
        </Text>
        <Text variant="bodyLarge" style={[styles.desc, { color: '#424242' }]}>
          {t(item.descKey)}
        </Text>
      </View>

      {/* Language selector on last slide */}
      {index === SLIDES.length - 1 && (
        <View style={styles.langContainer}>
          <Text variant="titleSmall" style={{ color: '#424242', fontWeight: '600', marginBottom: 12 }}>
            {t('onboarding.selectLanguage')}
          </Text>
          <View style={styles.langRow}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => handleLanguageChange(lang.code)}
                style={[
                  styles.langBtn,
                  selectedLang === lang.code && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={{ fontSize: 18 }}>{lang.flag}</Text>
                <Text
                  variant="labelMedium"
                  style={{ color: selectedLang === lang.code ? '#fff' : '#424242', marginLeft: 6 }}
                >
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { backgroundColor: SLIDES[currentIndex].bgColor }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? SLIDES[currentIndex].accentColor : '#C0C0C0',
                  width: i === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsRow}>
          {!isLastSlide && (
            <Button mode="text" onPress={handleSkip} textColor="#757575">
              {t('onboarding.skip')}
            </Button>
          )}
          <View style={{ flex: 1 }} />
          {isLastSlide ? (
            <View style={{ flex: 1, gap: 8 }}>
              <Button
                mode="contained"
                onPress={() => { completeOnboarding(); router.replace('/(auth)/sign-in' as never); }}
                style={{ borderRadius: 8 }}
                contentStyle={{ paddingVertical: 4 }}
              >
                {t('auth.signIn')}
              </Button>
              <Button
                mode="outlined"
                onPress={() => { completeOnboarding(); router.replace('/(auth)/sign-up' as never); }}
                style={{ borderRadius: 8 }}
              >
                {t('auth.signUp')}
              </Button>
              <Button
                mode="text"
                onPress={completeOnboarding}
                textColor="#757575"
              >
                {t('onboarding.exploreWithout')}
              </Button>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={handleNext}
              style={{ borderRadius: 8 }}
              icon="arrow-right"
              contentStyle={{ flexDirection: 'row-reverse' }}
            >
              {t('common.next')}
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  animationContainer: { height: 220, justifyContent: 'center', alignItems: 'center' },
  lottie: { width: 200, height: 200 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  textContainer: { alignItems: 'center', marginTop: 24, paddingHorizontal: 16 },
  title: { fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  desc: { textAlign: 'center', lineHeight: 24, opacity: 0.8 },
  langContainer: { marginTop: 32, alignItems: 'center' },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#C0C0C0' },
  bottomBar: { paddingHorizontal: 24, paddingBottom: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
  dot: { height: 8, borderRadius: 4 },
  buttonsRow: { flexDirection: 'row', alignItems: 'center' },
});
