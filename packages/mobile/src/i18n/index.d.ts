/**
 * TaxasGE Mobile - i18n Type Declarations
 * TypeScript declarations for i18n system
 */

export type Language = 'es' | 'fr' | 'en';

export function t(language: Language, keyPath: string): string;

export function getSection(language: Language, section: string): any;

export function useTranslation(language: Language): (keyPath: string) => string;

export const translations: {
  es: any;
  fr: any;
  en: any;
};

declare const _default: {
  t: typeof t;
  getSection: typeof getSection;
  useTranslation: typeof useTranslation;
  translations: typeof translations;
};

export default _default;
