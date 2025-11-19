/**
 * TaxasGE Mobile - Modern Onboarding Screen (OPTIMIZED)
 * Beautiful animated onboarding with Lottie animations
 * Date: 2025-11-17
 *
 * IMPROVEMENTS:
 * - Responsive Lottie sizes (max 35% screen height)
 * - Text backgrounds for visibility
 * - Staggered entrance animations
 * - Proper spacing and layout
 * - Screen rotation support
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import { Colors, Typography, Spacing, Shadows } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Max Lottie size: 35% of screen height (responsive)
const LOTTIE_SIZE = Math.min(SCREEN_HEIGHT * 0.35, 280);

interface OnboardingSlide {
  key: string;
  title_es: string;
  title_fr: string;
  title_en: string;
  subtitle_es: string;
  subtitle_fr: string;
  subtitle_en: string;
  animation?: any;
  image?: any;
  gradientColors: string[];
  buttonText_es: string;
  buttonText_fr: string;
  buttonText_en: string;
  buttonColor: string;
  textColor: string;
  diagonalPattern?: boolean;
}

const ONBOARDING_DATA: OnboardingSlide[] = [
  {
    key: 'welcome',
    title_es: 'La gestión fiscal',
    title_fr: 'La gestion fiscale',
    title_en: 'Fiscal management',
    subtitle_es: 'nunca fue tan sencilla. Su plataforma oficial para consultas, declaraciones y pagos seguros.',
    subtitle_fr: 'n\'a jamais été aussi simple. Votre plateforme officielle pour les consultations, déclarations et paiements sécurisés.',
    subtitle_en: 'has never been so simple. Your official platform for consultations, declarations and secure payments.',
    image: require('../assets/images/flag.jpg'),
    gradientColors: ['#ffffff', '#ffffff'], // Pure white background
    buttonText_es: 'Iniciar',
    buttonText_fr: 'Commencer',
    buttonText_en: 'Start',
    buttonColor: Colors.brand.red,
    textColor: Colors.brand.green,
    diagonalPattern: false,
  },
  {
    key: 'features',
    title_es: 'Consulta Sencilla',
    title_fr: 'Consultation Simple',
    title_en: 'Simple Consultation',
    subtitle_es: 'Acceda al instante a toda su información fiscal. ¡Se acabaron los dolores de cabeza!',
    subtitle_fr: 'Accédez instantanément à toutes vos informations fiscales. Fini les maux de tête!',
    subtitle_en: 'Instantly access all your tax information. No more headaches!',
    animation: require('../assets/animations/calculatrice.json'),
    gradientColors: ['#004aad', '#003585'],
    buttonText_es: 'Iniciar la exploración',
    buttonText_fr: 'Commencer l\'exploration',
    buttonText_en: 'Start exploring',
    buttonColor: '#ffffff',
    textColor: '#ffffff',
    diagonalPattern: true,
  },
  {
    key: 'taxabot',
    title_es: 'TaxaBot AI',
    title_fr: 'TaxaBot IA',
    title_en: 'TaxaBot AI',
    subtitle_es: '¡Adiós a la complejidad tributaria! TaxaBot AI: su guía fiscal personal',
    subtitle_fr: 'Adieu à la complexité fiscale! TaxaBot AI: votre guide fiscal personnel',
    subtitle_en: 'Goodbye tax complexity! TaxaBot AI: your personal tax guide',
    animation: require('../assets/animations/robot.json'),
    gradientColors: ['#499003', '#367a02'],
    buttonText_es: 'Ver cómo TaxaBot le asiste',
    buttonText_fr: 'Voir comment TaxaBot vous assiste',
    buttonText_en: 'See how TaxaBot assists you',
    buttonColor: Colors.brand.yellow,
    textColor: '#ffffff',
    diagonalPattern: true,
  },
];

interface NewOnboardingScreenProps {
  onComplete: () => void;
  language?: 'es' | 'fr' | 'en';
}

const NewOnboardingScreen: React.FC<NewOnboardingScreenProps> = ({
  onComplete,
  language = 'es',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // Staggered entrance animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const mediaAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered sequence: logo → media → text → button
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(mediaAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After entrance animation completes, start continuous pulse animation
      startLogoPulse();
    });
  }, []);

  const startLogoPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const renderDiagonalPattern = () => (
    <View style={StyleSheet.absoluteFillObject}>
      {[...Array(20)].map((_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: 2,
            height: SCREEN_HEIGHT * 1.5,
            backgroundColor: 'rgba(255,255,255,0.05)',
            transform: [
              { rotate: '45deg' },
              { translateX: i * 50 - SCREEN_WIDTH / 2 },
            ],
          }}
        />
      ))}
    </View>
  );

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    const titleKey = `title_${language}` as keyof OnboardingSlide;
    const subtitleKey = `subtitle_${language}` as keyof OnboardingSlide;
    const buttonTextKey = `buttonText_${language}` as keyof OnboardingSlide;

    return (
      <View style={styles.slideContainer}>
        <LinearGradient
          colors={item.gradientColors}
          style={StyleSheet.absoluteFillObject}
        />

        {item.diagonalPattern && renderDiagonalPattern()}

        <StatusBar
          barStyle={index === 0 ? 'dark-content' : 'light-content'}
          backgroundColor={item.gradientColors[0]}
        />

        <View style={styles.contentContainer}>
          {/* Logo at top for first screen */}
          {index === 0 && (
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: logoAnim,
                  transform: [
                    {
                      translateY: logoAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      })
                    },
                    { scale: logoPulse } // Continuous pulse animation
                  ]
                }
              ]}
            >
              <Image
                source={require('../assets/images/taxasge.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
          )}

          {/* Animation or Image */}
          <Animated.View
            style={[
              styles.animationContainer,
              {
                transform: [{ scale }],
                opacity: Animated.multiply(opacity, mediaAnim),
              },
            ]}
          >
            {item.animation ? (
              <View style={[
                styles.lottieWrapper,
                index === 2 && styles.lottieCircleBackground,
              ]}>
                <LottieView
                  source={item.animation}
                  autoPlay
                  loop
                  style={styles.lottieAnimation}
                />
              </View>
            ) : item.image ? (
              <View style={styles.imageWrapper}>
                {/* White circle background behind flag */}
                <View style={styles.imageBackground} />
                <Image
                  source={item.image}
                  style={styles.flagImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}
          </Animated.View>

          {/* Text Content with Background for Visibility */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: textAnim,
                transform: [{
                  translateY: textAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                }]
              }
            ]}
          >
            {/* Semi-transparent background behind text */}
            <View style={styles.textBackground} />

            <Text
              style={[
                styles.title,
                { color: item.textColor },
              ]}
            >
              {item[titleKey] as string}
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: index === 0 ? Colors.text.secondary : item.textColor },
              ]}
            >
              {item[subtitleKey] as string}
            </Text>
          </Animated.View>

          {/* CTA Button */}
          <Animated.View
            style={{
              opacity: buttonAnim,
              transform: [{
                scale: buttonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }]
            }}
          >
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: item.buttonColor,
                  ...Shadows.lg,
                },
              ]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.buttonText,
                  {
                    color:
                      item.buttonColor === '#ffffff'
                        ? Colors.brand.blue
                        : item.buttonColor === Colors.brand.yellow
                        ? Colors.text.primary
                        : Colors.neutral.white,
                  },
                ]}
              >
                {item[buttonTextKey] as string}
              </Text>
              <View style={styles.buttonIcon}>
                <Text
                  style={[
                    styles.arrowIcon,
                    {
                      color:
                        item.buttonColor === '#ffffff'
                          ? Colors.brand.blue
                          : item.buttonColor === Colors.brand.yellow
                          ? Colors.text.primary
                          : Colors.neutral.white,
                    },
                  ]}
                >
                  →
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  };

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      {ONBOARDING_DATA.map((_, index) => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity,
                backgroundColor:
                  currentIndex === 0
                    ? Colors.brand.green
                    : Colors.neutral.white,
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderSlide}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={event => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );
          setCurrentIndex(newIndex);
        }}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
      />

      {renderPagination()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? Spacing.xxxl : Spacing.xl,
    paddingHorizontal: Spacing.screenPadding,
  },
  logoContainer: {
    marginTop: Platform.OS === 'ios' ? 40 : 20,
    marginBottom: Spacing.md,
  },
  logo: {
    width: 180,
    height: 70,
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxHeight: LOTTIE_SIZE + 60,
  },
  lottieWrapper: {
    width: LOTTIE_SIZE,
    height: LOTTIE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieCircleBackground: {
    backgroundColor: Colors.brand.greenLight,
    borderRadius: LOTTIE_SIZE / 2,
    padding: Spacing.lg,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  imageWrapper: {
    width: SCREEN_WIDTH * 0.7,
    height: LOTTIE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageBackground: {
    position: 'absolute',
    width: LOTTIE_SIZE,
    height: LOTTIE_SIZE,
    borderRadius: LOTTIE_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  flagImage: {
    width: '90%',
    height: '90%',
    zIndex: 1,
  },
  textContainer: {
    width: '100%',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  textBackground: {
    position: 'absolute',
    top: -Spacing.md,
    left: 0,
    right: 0,
    bottom: -Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: Spacing.borderRadius.lg,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: Spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    ...Typography.bodyLarge,
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.borderRadius.full,
    minWidth: SCREEN_WIDTH * 0.75,
    marginBottom: Spacing.md,
  },
  buttonText: {
    ...Typography.buttonLarge,
    marginRight: Spacing.sm,
  },
  buttonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 140 : 120,
    alignSelf: 'center',
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

export default NewOnboardingScreen;
