/**
 * TaxasGE Mobile - Composant Principal Application
 * Application de Gestion Fiscale pour la Guinée Équatoriale
 *
 * @author KOUEMOU SAH Jean Emac
 * @version 1.0.0 (RN 0.80.0)
 * @format
 */

import React from 'react';
import { View, Text, StatusBar, StyleSheet, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Composant racine de l'application TaxasGE
 *
 * Phase 3 Migration: Version minimale fonctionnelle
 * TODO Phase 4: Ajouter Redux, Navigation, Services
 */
const App = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.content}>
          <Text style={styles.title}>TaxasGE Mobile</Text>
          <Text style={styles.subtitle}>Gestion Fiscale - Guinée Équatoriale</Text>
          <Text style={styles.version}>React Native 0.80.0</Text>
          <Text style={styles.status}>✅ Migration Phase 5 - Émulateur OK!</Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  },
  version: {
    fontSize: 14,
    color: '#999999',
    marginTop: 20,
  },
  status: {
    fontSize: 14,
    color: '#00AA00',
    marginTop: 8,
  },
});

export default App;
