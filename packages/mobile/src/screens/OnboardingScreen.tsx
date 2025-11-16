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

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
  language: 'es' | 'fr' | 'en';
}

// TODO: Add proper onboarding images to src/assets/onboarding/
// Images removed temporarily to fix bundling - Metro cannot resolve paths outside mobile package
const ONBOARDING_DATA = {
  es: [
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/2.png'),
      title: 'Gestión Fiscal Simplificada',
      description: 'Consulta servicios fiscales de Guinea Ecuatorial de forma rápida y sencilla',
    },
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/3.png'),
      title: 'Consulta Inteligente',
      description: 'Busca servicios, calcula tasas y accede a información actualizada al instante',
    },
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/4.png'),
      title: 'Cálculo Exacto de Tasas',
      description: 'Calculadora integrada para conocer el monto exacto de tus trámites fiscales',
    },
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/5.png'),
      title: 'TaxaBot: Tu Asistente IA',
      description: 'Pregunta en lenguaje natural y recibe respuestas inmediatas sobre servicios fiscales',
    },
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/Inicio.png'),
      title: '¡Comencemos!',
      description: 'Todo listo para gestionar tus trámites fiscales de manera eficiente',
    },
  ],
  fr: [
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/2.png'),
      title: 'Gestion Fiscale Simplifiée',
      description: 'Consultez les services fiscaux de Guinée Équatoriale rapidement et simplement',
    },
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/3.png'),
      title: 'Consultation Intelligente',
      description: 'Recherchez des services, calculez des taxes et accédez aux informations à jour',
    },
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/4.png'),
      title: 'Calcul Exact des Taxes',
      description: 'Calculatrice intégrée pour connaître le montant exact de vos démarches fiscales',
    },
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/5.png'),
      title: 'TaxaBot: Votre Assistant IA',
      description: 'Posez des questions en langage naturel et recevez des réponses immédiates',
    },
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/Inicio.png'),
      title: 'Commençons !',
      description: 'Tout est prêt pour gérer vos démarches fiscales efficacement',
    },
  ],
  en: [
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/2.png'),
      title: 'Simplified Tax Management',
      description: 'Access Equatorial Guinea tax services quickly and easily',
    },
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/3.png'),
      title: 'Smart Consultation',
      description: 'Search services, calculate fees and access up-to-date information instantly',
    },
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/4.png'),
      title: 'Exact Fee Calculation',
      description: 'Integrated calculator to know the exact amount of your tax procedures',
    },
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/5.png'),
      title: 'TaxaBot: Your AI Assistant',
      description: 'Ask questions in natural language and get immediate answers about tax services',
    },
    {
      // image: require('../../.github/docs-internal/Documentations/MOBILE/Design/Inicio.png'),
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
          <View key={index} style={styles.slide}>
            {slide.image ? (
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
            <View style={styles.textContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
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
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#004aad',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  },
  button: {
    backgroundColor: '#004aad',
    borderRadius: 12,
    paddingVertical: 16,
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
