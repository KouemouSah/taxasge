/**
 * TaxasGE Mobile - Onboarding Screen
 * 5 splash screens to introduce the app
 *
 * Created: 2025-11-06
 * Synchronized with progressive data sync during presentation
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
  language: 'es' | 'fr' | 'en';
}

interface OnboardingSlide {
  type: 'logo' | 'lottie' | 'lottie-circle' | 'placeholder';
  lottieSource?: any;
  backgroundColor?: string;
  image?: any; // React Native ImageSourcePropType
  title: string;
  description: string;
}

// TODO: Add proper onboarding images to src/assets/onboarding/
// Images removed temporarily to fix bundling - Metro cannot resolve paths outside mobile package
const ONBOARDING_DATA: Record<'es' | 'fr' | 'en', OnboardingSlide[]> = {
  es: [
    {
      type: 'logo',
      title: 'Gestión Fiscal Simplificada',
      description: 'Consulta servicios fiscales de Guinea Ecuatorial de forma rápida y sencilla',
    },
    {
      type: 'lottie',
      lottieSource: require('../assets/animations/calculatrice.json'),
      title: 'Consulta Inteligente',
      description: 'Busca servicios, calcula tasas y accede a información actualizada al instante',
    },
    {
      type: 'lottie',
      lottieSource: require('../assets/animations/robot.json'),
      title: 'Cálculo Exacto de Tasas',
      description: 'Calculadora integrada para conocer el monto exacto de tus trámites fiscales',
    },
    {
      type: 'lottie-circle',
      lottieSource: require('../assets/animations/chatbot.json'),
      backgroundColor: '#FF0000',
      title: 'TaxaBot: Tu Asistente IA',
      description: 'Pregunta en lenguaje natural y recibe respuestas inmediatas sobre servicios fiscales',
    },
    {
      type: 'placeholder',
      title: '¡Comencemos!',
      description: 'Todo listo para gestionar tus trámites fiscales de manera eficiente',
    },
  ],
  fr: [
    {
      type: 'logo',
      title: 'Gestion Fiscale Simplifiée',
      description: 'Consultez les services fiscaux de Guinée Équatoriale rapidement et simplement',
    },
    {
      type: 'lottie',
      lottieSource: require('../assets/animations/calculatrice.json'),
      title: 'Consultation Intelligente',
      description: 'Recherchez des services, calculez des taxes et accédez aux informations à jour',
    },
    {
      type: 'lottie',
      lottieSource: require('../assets/animations/robot.json'),
      title: 'Calcul Exact des Taxes',
      description: 'Calculatrice intégrée pour connaître le montant exact de vos démarches fiscales',
    },
    {
      type: 'lottie-circle',
      lottieSource: require('../assets/animations/chatbot.json'),
      backgroundColor: '#FF0000',
      title: 'TaxaBot: Votre Assistant IA',
      description: 'Posez des questions en langage naturel et recevez des réponses immédiates',
    },
    {
      type: 'placeholder',
      title: 'Commençons !',
      description: 'Tout est prêt pour gérer vos démarches fiscales efficacement',
    },
  ],
  en: [
    {
      type: 'logo',
      title: 'Simplified Tax Management',
      description: 'Access Equatorial Guinea tax services quickly and easily',
    },
    {
      type: 'lottie',
      lottieSource: require('../assets/animations/calculatrice.json'),
      title: 'Smart Consultation',
      description: 'Search services, calculate fees and access up-to-date information instantly',
    },
    {
      type: 'lottie',
      lottieSource: require('../assets/animations/robot.json'),
      title: 'Exact Fee Calculation',
      description: 'Integrated calculator to know the exact amount of your tax procedures',
    },
    {
      type: 'lottie-circle',
      lottieSource: require('../assets/animations/chatbot.json'),
      backgroundColor: '#FF0000',
      title: 'TaxaBot: Your AI Assistant',
      description: 'Ask questions in natural language and get immediate answers about tax services',
    },
    {
      type: 'placeholder',
      title: "Let's Start!",
      description: 'Everything is ready to manage your tax procedures efficiently',
    },
  ],
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  language = 'es',
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const slides = ONBOARDING_DATA[language];

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    setCurrentPage(page);
  };

  const goToNext = () => {
    if (currentPage < slides.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({ x: width * nextPage, animated: true });
      setCurrentPage(nextPage);
    } else {
      onComplete();
    }
  };

  const skip = () => {
    onComplete();
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentPage ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Skip Button */}
      {currentPage < slides.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={skip}>
          <Text style={styles.skipText}>
            {language === 'es' ? 'Saltar' : language === 'fr' ? 'Passer' : 'Skip'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View
            key={index}
            style={[
              styles.slide,
              slide.backgroundColor && { backgroundColor: slide.backgroundColor }
            ]}
          >
            {/* Render based on slide type */}
            {slide.type === 'logo' ? (
              <View style={styles.firstSlideContainer}>
                <Image
                  source={require('../assets/images/taxasge.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <View style={styles.brandingContainer}>
                  <Text style={styles.brandingTitle}>TaxasGE</Text>
                  <Text style={styles.brandingSubtitle}>E-Fiscal Servicios</Text>
                </View>
                <View style={styles.flagsContainer}>
                  <Image
                    source={require('../assets/images/flag.jpg')}
                    style={styles.flagImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            ) : slide.type === 'lottie' && slide.lottieSource ? (
              <View style={styles.lottieAnimationContainer}>
                <LottieView
                  source={slide.lottieSource}
                  autoPlay
                  loop
                  style={styles.lottieAnimation}
                />
              </View>
            ) : slide.type === 'lottie-circle' && slide.lottieSource ? (
              <View style={styles.lottieCircleContainer}>
                <View style={styles.whiteCircle}>
                  <LottieView
                    source={slide.lottieSource}
                    autoPlay
                    loop
                    style={styles.lottieAnimationInCircle}
                  />
                </View>
              </View>
            ) : slide.image ? (
              <Image
                source={slide.image}
                style={styles.image}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.image, styles.placeholderImage]}>
                <Text style={styles.placeholderText}>🏛️</Text>
              </View>
            )}

            {/* Text container - centered for lottie slides, right-aligned for logo */}
            <View style={slide.type === 'logo' ? styles.textContainer : styles.textContainerCentered}>
              <Text style={slide.type === 'logo' ? styles.title : styles.titleCentered}>
                {slide.title}
              </Text>
              <Text style={slide.type === 'logo' ? styles.description : styles.descriptionCentered}>
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dots Indicator */}
      {renderDots()}

      {/* Next/Start Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={goToNext}>
          <Text style={styles.buttonText}>
            {currentPage === slides.length - 1
              ? language === 'es'
                ? 'Comenzar'
                : language === 'fr'
                ? 'Commencer'
                : 'Start'
              : language === 'es'
              ? 'Siguiente'
              : language === 'fr'
              ? 'Suivant'
              : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    height: height - 200,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15, // Distance with top for lottie animations
    paddingBottom: 10,
  },
  // First slide specific styles
  firstSlideContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: width * 1.12, // 40% larger than 0.8
    height: height * 0.5,
    marginBottom: 1, // 1px spacing as requested
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 20, // Medium spacing before flags
  },
  brandingTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2D5016', // Dark green
    textAlign: 'center',
  },
  brandingSubtitle: {
    fontSize: 18,
    fontWeight: 'normal',
    color: '#2D5016', // Dark green
    textAlign: 'center',
  },
  flagsContainer: {
    marginBottom: 20, // Same medium spacing after flags
  },
  flagImage: {
    width: 80,
    height: 60,
  },
  // Lottie animation styles
  lottieAnimationContainer: {
    width: '100%',
    height: height * 0.4, // 40% of page height
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5, // 5px distance to text
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  // Lottie with circle styles (for chatbot slide)
  lottieCircleContainer: {
    width: '100%',
    height: height * 0.4, // 40% of page height for both circle and lottie
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5, // 5px distance to text
  },
  whiteCircle: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  lottieAnimationInCircle: {
    width: '80%',
    height: '80%',
  },
  // Other slides
  image: {
    width: width * 0.8,
    height: height * 0.45,
    marginBottom: 40,
  },
  placeholderImage: {
    backgroundColor: '#f0f4f8',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 80,
  },
  // Text containers
  textContainer: {
    alignItems: 'flex-end', // Align to right (for logo slide)
    alignSelf: 'flex-end',
    paddingHorizontal: 30,
    width: '100%',
    marginBottom: 3, // Max 3px spacing to button
  },
  textContainerCentered: {
    alignItems: 'center', // Centered for lottie slides
    paddingHorizontal: 30,
    width: '100%',
    marginBottom: 3, // Max 3px spacing to button
  },
  // Title styles
  title: {
    fontSize: 32, // Larger title
    fontWeight: 'bold',
    color: '#004aad',
    textAlign: 'right', // Align right (for logo slide)
    marginBottom: 12,
    width: '100%',
  },
  titleCentered: {
    fontSize: 32, // Larger title
    fontWeight: 'bold',
    color: '#004aad',
    textAlign: 'center', // Centered for lottie slides
    marginBottom: 12,
    width: '100%',
  },
  // Description styles
  description: {
    fontSize: 16, // Same size
    color: '#666666',
    textAlign: 'right', // Align right (for logo slide)
    lineHeight: 24,
    width: '100%',
  },
  descriptionCentered: {
    fontSize: 16, // Same size
    color: '#666666',
    textAlign: 'center', // Centered for lottie slides
    lineHeight: 24,
    width: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3, // Max 3px to button
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  dotActive: {
    backgroundColor: '#004aad',
    width: 24,
  },
  dotInactive: {
    backgroundColor: '#CCCCCC',
  },
  buttonContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center', // Center button
  },
  button: {
    backgroundColor: '#004aad',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '50%', // 50% of container width
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
