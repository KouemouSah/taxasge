/**
 * Onboarding — First launch only
 *
 * Design: Split layout inspired by modern app onboarding
 * - Top 55%: vibrant color background + large Lottie animation
 * - Bottom 45%: white card with title, subtitle, description
 * - Each slide has unique accent color
 * - Responsive: uses % heights for all screen sizes
 */

import { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Dimensions,
  Pressable,
  type ViewToken,
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

const { width: SW, height: SH } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_completed';
const TOP_RATIO = 0.52;

// ---------------------------------------------------------------------------
// Slide config
// ---------------------------------------------------------------------------

interface Slide {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animation?: any;
  icon?: string;
  titleKey: string;
  descSubKey: string;
  descKey: string;
  bgTop: string;
  bgTopEnd: string;
  accent: string;
  decoIcons: string[];
}

const SLIDES: Slide[] = [
  {
    id: '1',
    animation: require('../../assets/animations/robot.json'),
    titleKey: 'onboarding.slide1.title',
    descSubKey: 'onboarding.slide1.desc_sub',
    descKey: 'onboarding.slide1.desc',
    bgTop: '#0D6E3F',
    bgTopEnd: '#1B9E5A',
    accent: '#0D6E3F',
    decoIcons: ['passport', 'car', 'file-document-outline', 'home-city-outline', 'account-group-outline'],
  },
  {
    id: '2',
    animation: require('../../assets/animations/chatbot.json'),
    titleKey: 'onboarding.slide2.title',
    descSubKey: 'onboarding.slide2.desc_sub',
    descKey: 'onboarding.slide2.desc',
    bgTop: '#1565C0',
    bgTopEnd: '#42A5F5',
    accent: '#1565C0',
    decoIcons: ['shield-lock-outline', 'fingerprint', 'robot-outline', 'eye-off-outline', 'two-factor-authentication'],
  },
  {
    id: '3',
    icon: 'rocket-launch-outline',
    titleKey: 'onboarding.slide3.title',
    descSubKey: 'onboarding.slide3.desc_sub',
    descKey: 'onboarding.slide3.desc',
    bgTop: '#E65100',
    bgTopEnd: '#FF8A65',
    accent: '#E65100',
    decoIcons: ['translate', 'cellphone-check', 'earth', 'star-outline', 'check-decagram-outline'],
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

  const handleSkip = useCallback(() => completeOnboarding(), []);

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

  const renderSlide = ({ item, index }: { item: Slide; index: number }) => {
    const titleText = t(item.titleKey);
    const parts = titleText.split('\n');

    return (
      <View style={[s.slide, { width: SW }]}>
        {/* ═══ TOP: colored bg + animation + deco icons ═══ */}
        <View style={[s.topSection, { backgroundColor: item.bgTop }]}>
          {/* Decorative floating icons */}
          {item.decoIcons.map((icon, i) => (
            <MaterialCommunityIcons
              key={`deco-${i}`}
              name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={28 + (i % 3) * 8}
              color="#fff"
              style={[
                s.decoIcon,
                {
                  opacity: 0.12 + (i % 3) * 0.04,
                  top: 30 + (i * 47) % (SH * TOP_RATIO - 80),
                  left: 15 + (i * 73) % (SW - 60),
                },
              ]}
            />
          ))}

          {/* Animation or icon */}
          {item.animation ? (
            <LottieView
              source={item.animation}
              autoPlay
              loop
              style={s.lottie}
            />
          ) : (
            <View style={s.iconCircle}>
              <MaterialCommunityIcons
                name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={90}
                color="#fff"
              />
            </View>
          )}

          {/* Curved bottom edge */}
          <View style={s.curveOverlay} />
        </View>

        {/* ═══ BOTTOM: white card with text ═══ */}
        <View style={s.bottomSection}>
          {/* Title: small line + BIG line */}
          {parts[0] && (
            <Text style={[s.titleSmall, { color: item.accent }]}>
              {parts[0]}
            </Text>
          )}
          {parts[1] && (
            <Text style={[s.titleBig, { color: item.accent }]}>
              {parts[1]}
            </Text>
          )}

          {/* Subtitle */}
          <Text style={[s.subtitle, { color: item.accent }]}>
            {t(item.descSubKey)}
          </Text>

          {/* Description */}
          <Text style={s.desc}>
            {t(item.descKey)}
          </Text>

          {/* Language selector on last slide */}
          {index === SLIDES.length - 1 && (
            <View style={s.langContainer}>
              <View style={s.langRow}>
                {LANGUAGES.map((lang) => (
                  <Pressable
                    key={lang.code}
                    onPress={() => handleLanguageChange(lang.code)}
                    style={[
                      s.langBtn,
                      selectedLang === lang.code && { backgroundColor: item.accent, borderColor: item.accent },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{lang.flag}</Text>
                    <Text style={{ color: selectedLang === lang.code ? '#fff' : '#424242', marginLeft: 6, fontWeight: '600', fontSize: 13 }}>
                      {lang.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Bottom controls
  // ---------------------------------------------------------------------------

  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={s.container}>
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

      {/* Controls overlay at bottom */}
      <SafeAreaView style={s.controls} edges={['bottom']}>
        {/* Dots */}
        <View style={s.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                {
                  backgroundColor: i === currentIndex ? currentSlide.accent : '#D0D0D0',
                  width: i === currentIndex ? 28 : 10,
                },
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        {isLastSlide ? (
          <View style={s.lastSlideButtons}>
            <Button
              mode="contained"
              onPress={() => { completeOnboarding(); router.replace('/(auth)/sign-in' as never); }}
              style={[s.ctaBtn, { backgroundColor: currentSlide.accent }]}
              contentStyle={{ paddingVertical: 6 }}
              labelStyle={{ fontSize: 16, fontWeight: '700' }}
            >
              {t('auth.signIn')}
            </Button>
            <Button
              mode="outlined"
              onPress={() => { completeOnboarding(); router.replace('/(auth)/sign-up' as never); }}
              style={[s.ctaBtn, { borderColor: currentSlide.accent }]}
              textColor={currentSlide.accent}
            >
              {t('auth.signUp')}
            </Button>
            <Pressable onPress={completeOnboarding} style={s.skipLink}>
              <Text style={{ color: '#888', fontSize: 13 }}>{t('onboarding.exploreWithout')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.navRow}>
            <Pressable onPress={handleSkip} style={s.skipBtn}>
              <Text style={{ color: '#888', fontSize: 14 }}>{t('onboarding.skip')}</Text>
            </Pressable>
            <Pressable
              onPress={handleNext}
              style={[s.nextBtn, { backgroundColor: currentSlide.accent }]}
            >
              <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — responsive with % and Dimensions
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  slide: { flex: 1 },

  // Top colored section
  topSection: {
    height: SH * TOP_RATIO,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  decoIcon: { position: 'absolute' },
  lottie: { width: SW * 0.7, height: SW * 0.7, maxWidth: 320, maxHeight: 320 },
  iconCircle: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  curveOverlay: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    right: -20,
    height: 60,
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },

  // Bottom white section
  bottomSection: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingTop: 4,
  },
  titleSmall: { fontSize: 20, fontWeight: '500', letterSpacing: 0.3 },
  titleBig: { fontSize: 42, fontWeight: '900', letterSpacing: 1, lineHeight: 48, marginBottom: 6 },
  subtitle: { fontSize: 14, fontWeight: '600', opacity: 0.6, marginBottom: 8 },
  desc: { fontSize: 14, lineHeight: 21, color: '#666' },

  // Language
  langContainer: { marginTop: 16 },
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 24, borderWidth: 1.5, borderColor: '#D0D0D0',
  },

  // Controls
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 28, paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
  dot: { height: 8, borderRadius: 4 },

  // Nav row (non-last slides)
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 8 },
  nextBtn: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },

  // Last slide buttons
  lastSlideButtons: { gap: 10 },
  ctaBtn: { borderRadius: 28 },
  skipLink: { alignItems: 'center', paddingVertical: 8 },
});
