/**
 * TaxasGE Mobile - Profile Screen
 * User profile with language settings, history, and customization options
 * Date: 2025-11-17
 * Based on: perfil_1.png design + i18n system
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import { GradientHeader } from '../components/GradientHeader';
import { BottomTabBar, TabName } from '../components/BottomTabBar';
import { Icon } from '../components/Icon';
import { getSection } from '../i18n';
import { Colors, Spacing, Shadows } from '../theme';
import { APP_CONFIG } from '../config/AppConfig';

interface ProfileScreenProps {
  language: 'es' | 'fr' | 'en';
  onBack: () => void;
  onLanguageChange: (lang: 'es' | 'fr' | 'en') => void;
  onNavigate: (screen: string) => void;
  onTabPress: (tab: TabName) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  language,
  onBack,
  onLanguageChange,
  onNavigate,
  onTabPress,
}) => {
  const t = getSection(language, 'profileScreen');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState('greenPattern');

  const getCurrentLanguageName = () => {
    switch (language) {
      case 'es':
        return t.languages.spanish;
      case 'fr':
        return t.languages.french;
      case 'en':
        return t.languages.english;
      default:
        return 'Español';
    }
  };

  const getCurrentBackgroundName = () => {
    return t.backgroundOptions[selectedBackground as keyof typeof t.backgroundOptions] || t.backgroundOptions.greenPattern;
  };

  const handleTabPress = (tab: TabName) => {
    if (tab === 'profile') return; // Already on profile
    onNavigate(tab);
  };

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title={t.title} onBack={onBack} showBackButton={false} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sections.language}</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.7}>
            <Icon name="globe" size={24} color="#007AFF" style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t.settings.selectLanguage}</Text>
              <Text style={styles.settingValue}>{getCurrentLanguageName()}</Text>
            </View>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sections.history}</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => onNavigate('history')}
            activeOpacity={0.7}>
            <Icon name="clock" size={24} color="#007AFF" style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t.settings.calculationHistory}</Text>
            </View>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Customization Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sections.customization}</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowBackgroundModal(true)}
            activeOpacity={0.7}>
            <Icon name="palette" size={24} color="#007AFF" style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t.settings.chatbotBackground}</Text>
              <Text style={styles.settingValue}>{getCurrentBackgroundName()}</Text>
            </View>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sections.about}</Text>

          <View style={styles.settingRow}>
            <Icon name="info" size={24} color="#007AFF" style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t.settings.appVersion}</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <Icon name="document" size={24} color="#007AFF" style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t.settings.termsOfService}</Text>
            </View>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <Icon name="lock" size={24} color="#007AFF" style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t.settings.privacyPolicy}</Text>
            </View>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomTabBar activeTab="profile" onTabPress={handleTabPress} language={language} />

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.selectLanguageTitle}</Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <TouchableOpacity
                style={[styles.languageOption, language === 'es' && styles.languageOptionActive]}
                onPress={() => {
                  onLanguageChange('es');
                  setShowLanguageModal(false);
                }}
                activeOpacity={0.7}>
                <Icon name="flag-es" size={32} color="#000" style={styles.languageFlag} />
                <Text style={styles.languageLabel}>{t.languages.spanish}</Text>
                {language === 'es' && <Text style={styles.languageCheck}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.languageOption, language === 'fr' && styles.languageOptionActive]}
                onPress={() => {
                  onLanguageChange('fr');
                  setShowLanguageModal(false);
                }}
                activeOpacity={0.7}>
                <Icon name="flag-fr" size={32} color="#000" style={styles.languageFlag} />
                <Text style={styles.languageLabel}>{t.languages.french}</Text>
                {language === 'fr' && <Text style={styles.languageCheck}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.languageOption, language === 'en' && styles.languageOptionActive]}
                onPress={() => {
                  onLanguageChange('en');
                  setShowLanguageModal(false);
                }}
                activeOpacity={0.7}>
                <Icon name="flag-gb" size={32} color="#000" style={styles.languageFlag} />
                <Text style={styles.languageLabel}>{t.languages.english}</Text>
                {language === 'en' && <Text style={styles.languageCheck}>✓</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Background Selection Modal */}
      <Modal
        visible={showBackgroundModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBackgroundModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.selectBackgroundTitle}</Text>
              <TouchableOpacity
                onPress={() => setShowBackgroundModal(false)}
                style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <TouchableOpacity
                style={[
                  styles.backgroundOption,
                  selectedBackground === 'greenPattern' && styles.backgroundOptionActive,
                ]}
                onPress={() => {
                  setSelectedBackground('greenPattern');
                  setShowBackgroundModal(false);
                }}
                activeOpacity={0.7}>
                <View style={[styles.backgroundPreview, { backgroundColor: '#40E0D0' }]} />
                <Text style={styles.backgroundLabel}>{t.backgroundOptions.greenPattern}</Text>
                {selectedBackground === 'greenPattern' && <Text style={styles.backgroundCheck}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.backgroundOption,
                  selectedBackground === 'bluePattern' && styles.backgroundOptionActive,
                ]}
                onPress={() => {
                  setSelectedBackground('bluePattern');
                  setShowBackgroundModal(false);
                }}
                activeOpacity={0.7}>
                <View style={[styles.backgroundPreview, { backgroundColor: '#004aad' }]} />
                <Text style={styles.backgroundLabel}>{t.backgroundOptions.bluePattern}</Text>
                {selectedBackground === 'bluePattern' && <Text style={styles.backgroundCheck}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.backgroundOption,
                  selectedBackground === 'grayPattern' && styles.backgroundOptionActive,
                ]}
                onPress={() => {
                  setSelectedBackground('grayPattern');
                  setShowBackgroundModal(false);
                }}
                activeOpacity={0.7}>
                <View style={[styles.backgroundPreview, { backgroundColor: '#808080' }]} />
                <Text style={styles.backgroundLabel}>{t.backgroundOptions.grayPattern}</Text>
                {selectedBackground === 'grayPattern' && <Text style={styles.backgroundCheck}>✓</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#666666',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
    color: '#666666',
  },
  settingArrow: {
    fontSize: 20,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#666666',
  },
  modalContent: {
    padding: Spacing.lg,
  },

  // Language options
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    backgroundColor: '#F5F5F5',
  },
  languageOptionActive: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  languageFlag: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  languageLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  languageCheck: {
    fontSize: 24,
    color: Colors.primary,
  },

  // Background options
  backgroundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    backgroundColor: '#F5F5F5',
  },
  backgroundOptionActive: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  backgroundPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
    ...Shadows.sm,
  },
  backgroundLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  backgroundCheck: {
    fontSize: 24,
    color: Colors.primary,
  },
});

export default ProfileScreen;
