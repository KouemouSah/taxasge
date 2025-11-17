/**
 * TaxasGE Mobile - i18n System
 * Centralized translations for ES/FR/EN
 */

import es from './es.json';
import fr from './fr.json';
import en from './en.json';

const translations = {
  es,
  fr,
  en,
};

/**
 * Get translation for a given key path
 * @param {string} language - 'es' | 'fr' | 'en'
 * @param {string} keyPath - Dot notation path (e.g., 'homeScreen.title')
 * @returns {string} Translation or key if not found
 */
export const t = (language, keyPath) => {
  const keys = keyPath.split('.');
  let value = translations[language];

  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
    } else {
      console.warn(`[i18n] Translation not found for key: ${keyPath} in language: ${language}`);
      return keyPath;
    }
  }

  return value || keyPath;
};

/**
 * Get all translations for a section
 * @param {string} language - 'es' | 'fr' | 'en'
 * @param {string} section - Section name (e.g., 'homeScreen')
 * @returns {object} Translation object
 */
export const getSection = (language, section) => {
  return translations[language]?.[section] || {};
};

/**
 * React hook for translations
 * @param {string} language - 'es' | 'fr' | 'en'
 * @returns {function} Translation function
 */
export const useTranslation = (language) => {
  return (keyPath) => t(language, keyPath);
};

export default {
  t,
  getSection,
  useTranslation,
  translations,
};
