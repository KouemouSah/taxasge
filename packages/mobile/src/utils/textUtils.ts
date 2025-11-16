/**
 * TaxasGE Mobile - Text Utilities
 * Correction orthographique, synonymes, normalisation
 * Date: 2025-11-07
 */

// ============================================
// CORRECTION ORTHOGRAPHIQUE - LEVENSHTEIN
// ============================================

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 * (nombre minimum d'opérations pour transformer a en b)
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  // Initialiser la première colonne
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialiser la première ligne
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Remplir la matrice
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Substitution
          matrix[i][j - 1] + 1, // Insertion
          matrix[i - 1][j] + 1 // Suppression
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Trouve le mot le plus proche dans une liste de mots
 * Retourne null si la distance minimale > maxDistance
 */
export function findClosestWord(
  word: string,
  wordList: string[],
  maxDistance: number = 2
): { word: string; distance: number } | null {
  let minDistance = Infinity;
  let closestWord: string | null = null;

  for (const candidate of wordList) {
    const distance = levenshteinDistance(word.toLowerCase(), candidate.toLowerCase());

    if (distance < minDistance) {
      minDistance = distance;
      closestWord = candidate;
    }
  }

  if (closestWord && minDistance <= maxDistance) {
    return { word: closestWord, distance: minDistance };
  }

  return null;
}

/**
 * Corrige les fautes d'orthographe dans un texte
 * Utilise une liste de mots-clés connus
 */
export function correctSpelling(text: string, keywords: string[]): string {
  const words = text.split(/\s+/);
  const correctedWords = words.map((word) => {
    // Nettoyer le mot (enlever ponctuation)
    const cleanWord = word.replace(/[.,!?;:]/g, '');
    const closest = findClosestWord(cleanWord, keywords, 2);

    if (closest && closest.distance > 0) {
      // Remplacement avec conservation de la ponctuation
      return word.replace(cleanWord, closest.word);
    }

    return word;
  });

  return correctedWords.join(' ');
}

// ============================================
// GESTION DES SYNONYMES
// ============================================

/**
 * Table de synonymes pour les termes fiscaux courants
 */
export const SYNONYMS: Record<string, string[]> = {
  // Services
  pasaporte: ['pasaporte', 'pasporte', 'pasaporto', 'documento de viaje'],
  dni: ['dni', 'documento de identidad', 'cédula', 'identificación', 'carnet de identidad'],
  legalizar: ['legalizar', 'autenticar', 'apostillar', 'certificar', 'validar'],
  registrar: ['registrar', 'inscribir', 'dar de alta', 'matricular'],

  // Entreprises
  empresa: ['empresa', 'negocio', 'compañía', 'sociedad', 'firma'],
  micro: ['micro', 'microempresa', 'pequeño negocio'],
  pequeña: ['pequeña', 'pequeña empresa', 'pyme'],
  mediana: ['mediana', 'mediana empresa'],

  // Prix et coûts
  costo: ['costo', 'precio', 'vale', 'cuánto cuesta', 'tarifa', 'tasa', 'monto'],
  pagar: ['pagar', 'abonar', 'cancelar', 'saldar'],
  gratis: ['gratis', 'gratuito', 'sin costo', 'libre'],

  // Documents
  documento: ['documento', 'papel', 'certificado', 'constancia'],
  formulario: ['formulario', 'planilla', 'formato', 'solicitud'],
  copia: ['copia', 'fotocopia', 'duplicado'],

  // Procédures
  procedimiento: ['procedimiento', 'trámite', 'proceso', 'gestión'],
  solicitar: ['solicitar', 'pedir', 'requerir', 'tramitar'],
  renovar: ['renovar', 'actualizar', 'extender'],

  // Temps
  tiempo: ['tiempo', 'plazo', 'duración', 'demora'],
  urgente: ['urgente', 'rápido', 'express', 'prioritario', 'inmediato'],

  // Lieux
  oficina: ['oficina', 'ventanilla', 'mostrador', 'dependencia'],
  ministerio: ['ministerio', 'secretaría', 'departamento'],
};

/**
 * Normalise un mot en son terme principal (canonical form)
 */
export function normalizeToCanonical(word: string): string {
  const lowerWord = word.toLowerCase();

  for (const [canonical, synonyms] of Object.entries(SYNONYMS)) {
    if (synonyms.some((syn) => lowerWord.includes(syn))) {
      return canonical;
    }
  }

  return lowerWord;
}

/**
 * Expande une query avec tous les synonymes possibles
 * Retourne un tableau de variantes
 */
export function expandWithSynonyms(text: string): string[] {
  const normalized = text.toLowerCase();
  const variants = new Set<string>([normalized]);

  // Pour chaque groupe de synonymes
  for (const [canonical, synonyms] of Object.entries(SYNONYMS)) {
    for (const synonym of synonyms) {
      if (normalized.includes(synonym)) {
        // Ajouter toutes les variantes
        synonyms.forEach((variant) => {
          const expanded = normalized.replace(synonym, variant);
          if (expanded !== normalized) {
            variants.add(expanded);
          }
        });
      }
    }
  }

  return Array.from(variants);
}

/**
 * Extrait les mots-clés principaux d'une query en les normalisant
 */
export function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const keywords = new Set<string>();

  words.forEach((word) => {
    // Nettoyer ponctuation
    const clean = word.replace(/[.,!?;:]/g, '');

    if (clean.length >= 3) {
      // Ignorer mots trop courts
      // Normaliser vers forme canonique
      const canonical = normalizeToCanonical(clean);
      keywords.add(canonical);

      // Ajouter aussi le mot original
      keywords.add(clean);
    }
  });

  return Array.from(keywords);
}

// ============================================
// MOTS-CLÉS FISCAUX CONNUS
// ============================================

/**
 * Liste complète de mots-clés pour correction orthographique
 */
export const FISCAL_KEYWORDS = [
  // Services communs
  'pasaporte',
  'legalización',
  'diploma',
  'documento',
  'certificado',
  'permiso',
  'licencia',
  'visa',
  'carnet',

  // Entreprises
  'empresa',
  'micro',
  'pequeña',
  'mediana',
  'negocio',
  'registro',
  'comercio',

  // Ministères
  'ministerio',
  'asuntos',
  'exteriores',
  'cooperación',
  'comercio',
  'promoción',
  'pymes',
  'aviación',
  'civil',

  // Actions
  'legalizar',
  'renovar',
  'solicitar',
  'tramitar',
  'pagar',
  'consultar',

  // Prix
  'costo',
  'precio',
  'tarifa',
  'tasa',
  'gratis',
  'gratuito',

  // Documents
  'dni',
  'identidad',
  'cédula',
  'formulario',
  'copia',
  'original',

  // Temps
  'tiempo',
  'plazo',
  'días',
  'urgente',
  'rápido',

  // Questions
  'cuánto',
  'cuesta',
  'necesito',
  'requiero',
  'dónde',
  'cómo',
  'qué',
  'cuál',
];

/**
 * Applique correction orthographique + expansion synonymes
 */
export function enhanceQuery(query: string): {
  corrected: string;
  variants: string[];
  keywords: string[];
} {
  // 1. Corriger orthographe
  const corrected = correctSpelling(query, FISCAL_KEYWORDS);

  // 2. Générer variantes avec synonymes
  const variants = expandWithSynonyms(corrected);

  // 3. Extraire mots-clés
  const keywords = extractKeywords(corrected);

  return {
    corrected,
    variants,
    keywords,
  };
}
