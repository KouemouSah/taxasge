/**
 * TaxasGE Mobile - Composant Principal Application
 * Application de Gestion Fiscale pour la Guinée Équatoriale
 *
 * @author KOUEMOU SAH Jean Emac
 * @version 1.0.0 (RN 0.80.0)
 * @format
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from './providers/DatabaseProvider';
import { ChatbotScreen } from './screens/ChatbotScreen';

/**
 * Composant racine de l'application TaxasGE
 *
 * Phase actuelle: Intégration Chatbot FAQ (MVP1)
 */
const App = () => {
  const [currentScreen, setCurrentScreen] = useState('home');

  const renderHomeScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>TaxasGE Mobile</Text>
          <Text style={styles.subtitle}>Gestion Fiscale - Guinée Équatoriale</Text>
          <Text style={styles.version}>React Native 0.80.0</Text>
          <Text style={styles.status}>✅ Migration Phase 5 - Chatbot FAQ intégré</Text>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Menu Principal</Text>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setCurrentScreen('chatbot')}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>💬</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Chatbot Assistant</Text>
                <Text style={styles.buttonSubtitle}>
                  Posez vos questions sur les services fiscaux
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.disabledButton]}
            disabled={true}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>🔍</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.buttonTitle, styles.disabledText]}>
                  Rechercher Services
                </Text>
                <Text style={[styles.buttonSubtitle, styles.disabledText]}>
                  Bientôt disponible
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.disabledButton]}
            disabled={true}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>🧮</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.buttonTitle, styles.disabledText]}>Calculatrice</Text>
                <Text style={[styles.buttonSubtitle, styles.disabledText]}>
                  Bientôt disponible
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.disabledButton]}
            disabled={true}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>⭐</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.buttonTitle, styles.disabledText]}>Favoris</Text>
                <Text style={[styles.buttonSubtitle, styles.disabledText]}>
                  Bientôt disponible
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version MVP1 - Chatbot FAQ</Text>
          <Text style={styles.footerText}>Base de données: SQLite v3</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderChatbotScreen = () => (
    <ChatbotScreen onBack={() => setCurrentScreen('home')} />
  );

  return (
    <SafeAreaProvider>
      <DatabaseProvider autoSync={false}>
        {currentScreen === 'home' ? renderHomeScreen() : renderChatbotScreen()}
      </DatabaseProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
    textAlign: 'center',
  },
  version: {
    fontSize: 14,
    color: '#999999',
    marginTop: 12,
  },
  status: {
    fontSize: 14,
    color: '#00AA00',
    marginTop: 8,
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  menuButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#FAFAFA',
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  disabledText: {
    color: '#999999',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
});

export default App;
