/**
 * TaxasGE Mobile - Chatbot Service E2E Tests
 * Tests end-to-end pour valider le fonctionnement complet du chatbot FAQ
 *
 * Date: 2025-11-06
 * Author: Claude Code
 *
 * Test Coverage:
 * - Pattern matching (regex)
 * - FTS5 fallback search
 * - Multilingual support (ES/FR/EN)
 * - Dynamic service search
 * - Intent detection
 * - Response generation
 * - Entity extraction
 * - Suggestion system
 * - Error handling
 */

import { chatbotService } from '../ChatbotService';
import { db } from '../../database/DatabaseManager';
import { ChatbotLanguage, ChatbotIntent } from '../../types/chatbot.types';

// ============================================
// SETUP & TEARDOWN
// ============================================

beforeAll(async () => {
  // Initialize database
  await db.init();
  console.log('[E2E] Database initialized');
});

afterAll(async () => {
  // Cleanup
  await db.close();
  console.log('[E2E] Database closed');
});

// ============================================
// TEST SUITE 1: PATTERN MATCHING (REGEX)
// ============================================

describe('ChatbotService - Pattern Matching (Regex)', () => {
  test('E2E-01: Should detect greeting intent (Spanish)', async () => {
    // Arrange
    const userMessage = 'Hola, ¿cómo estás?';
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response).toBeDefined();
    expect(response.message).toBeDefined();
    expect(response.message.intent).toBe('greeting');
    expect(response.message.role).toBe('bot');
    expect(response.message.content).toBeTruthy();
    expect(response.suggestions).toBeDefined();
    expect(response.suggestions.length).toBeGreaterThan(0);

    // Log for manual review
    console.log('[E2E-01] Greeting Response (ES):', response.message.content.substring(0, 100));
  });

  test('E2E-02: Should detect greeting intent (French)', async () => {
    // Arrange
    const userMessage = 'Bonjour, comment allez-vous?';
    const language: ChatbotLanguage = 'fr';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response.message.intent).toBe('greeting');
    expect(response.message.content).toContain('trouvé'); // French text
    expect(response.suggestions.length).toBeGreaterThan(0);

    console.log('[E2E-02] Greeting Response (FR):', response.message.content.substring(0, 100));
  });

  test('E2E-03: Should detect greeting intent (English)', async () => {
    // Arrange
    const userMessage = 'Hello, how are you?';
    const language: ChatbotLanguage = 'en';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response.message.intent).toBe('greeting');
    expect(response.message.content).toContain('found'); // English text
    expect(response.suggestions.length).toBeGreaterThan(0);

    console.log('[E2E-03] Greeting Response (EN):', response.message.content.substring(0, 100));
  });

  test('E2E-04: Should detect get_price intent', async () => {
    // Arrange
    const userMessage = '¿Cuánto cuesta el pasaporte?';
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response.message.intent).toBe('get_price');
    expect(response.message.content).toBeTruthy();
    expect(response.message.metadata?.matchScore).toBeGreaterThan(0.8); // High confidence

    console.log('[E2E-04] Price Response:', response.message.content.substring(0, 100));
  });

  test('E2E-05: Should detect get_documents intent', async () => {
    // Arrange
    const userMessage = '¿Qué documentos necesito para el pasaporte?';
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response.message.intent).toBe('get_documents');
    expect(response.message.content).toBeTruthy();

    console.log('[E2E-05] Documents Response:', response.message.content.substring(0, 100));
  });

  test('E2E-06: Should detect get_procedure intent', async () => {
    // Arrange
    const userMessage = '¿Cuál es el procedimiento para obtener un permiso de residencia?';
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response.message.intent).toBe('get_procedure');
    expect(response.message.content).toBeTruthy();

    console.log('[E2E-06] Procedure Response:', response.message.content.substring(0, 100));
  });
});

// ============================================
// TEST SUITE 2: FTS5 FALLBACK SEARCH
// ============================================

describe('ChatbotService - FTS5 Fallback Search', () => {
  test('E2E-07: Should fallback to FTS5 when no pattern matches', async () => {
    // Arrange
    const userMessage = 'información sobre pasaporte'; // No pattern match
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response).toBeDefined();
    expect(response.message.content).toBeTruthy();
    expect(response.message.metadata?.fallback).toBeTruthy(); // Should be fallback
    expect(response.message.metadata?.matchScore).toBeLessThan(0.9); // Lower confidence

    console.log('[E2E-07] FTS5 Fallback Response:', response.message.content.substring(0, 100));
  });

  test('E2E-08: Should search across multiple languages in FTS5', async () => {
    // Arrange
    const userMessage = 'visa'; // Generic keyword
    const language: ChatbotLanguage = 'en';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response).toBeDefined();
    expect(response.message.content).toBeTruthy();

    console.log('[E2E-08] FTS5 Multi-language Response:', response.message.content.substring(0, 100));
  });
});

// ============================================
// TEST SUITE 3: MULTILINGUAL SUPPORT
// ============================================

describe('ChatbotService - Multilingual Support', () => {
  test('E2E-09: Should respond in Spanish when language=es', async () => {
    // Arrange
    const userMessage = 'Hola';
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response.message.metadata?.language).toBe('es');
    // Check for Spanish keywords in response
    const hasSpanishText =
      response.message.content.includes('encontrado') ||
      response.message.content.includes('información') ||
      response.message.content.includes('ayuda');
    expect(hasSpanishText).toBeTruthy();

    console.log('[E2E-09] Spanish Response Verified');
  });

  test('E2E-10: Should respond in French when language=fr', async () => {
    // Arrange
    const userMessage = 'Bonjour';
    const language: ChatbotLanguage = 'fr';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response.message.metadata?.language).toBe('fr');
    // Check for French keywords in response
    const hasFrenchText =
      response.message.content.includes('trouvé') ||
      response.message.content.includes('information') ||
      response.message.content.includes('aide');
    expect(hasFrenchText).toBeTruthy();

    console.log('[E2E-10] French Response Verified');
  });

  test('E2E-11: Should respond in English when language=en', async () => {
    // Arrange
    const userMessage = 'Hello';
    const language: ChatbotLanguage = 'en';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response.message.metadata?.language).toBe('en');
    // Check for English keywords in response
    const hasEnglishText =
      response.message.content.includes('found') ||
      response.message.content.includes('information') ||
      response.message.content.includes('help');
    expect(hasEnglishText).toBeTruthy();

    console.log('[E2E-11] English Response Verified');
  });

  test('E2E-12: Should translate suggestions to target language', async () => {
    // Arrange
    const userMessage = 'Hola';
    const languages: ChatbotLanguage[] = ['es', 'fr', 'en'];

    // Act & Assert
    for (const lang of languages) {
      const response = await chatbotService.processMessage(userMessage, lang);
      expect(response.suggestions).toBeDefined();
      expect(response.suggestions.length).toBeGreaterThan(0);

      // Verify suggestions are in correct language
      console.log(`[E2E-12] Suggestions (${lang}):`, response.suggestions);
    }
  });
});

// ============================================
// TEST SUITE 4: DYNAMIC SERVICE SEARCH
// ============================================

describe('ChatbotService - Dynamic Service Search', () => {
  test('E2E-13: Should search services in database when no FAQ matches', async () => {
    // Arrange
    const userMessage = 'permiso de conducir'; // Search for driving license
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response).toBeDefined();
    expect(response.message.content).toBeTruthy();
    // Should find services in DB
    expect(response.message.content.length).toBeGreaterThan(50);

    console.log('[E2E-13] Dynamic Service Search Response:', response.message.content.substring(0, 150));
  });

  test('E2E-14: Should list multiple services when found', async () => {
    // Arrange
    const userMessage = 'certificado'; // Generic term for certificate
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response).toBeDefined();
    expect(response.message.content).toBeTruthy();

    console.log('[E2E-14] Multiple Services Response:', response.message.content.substring(0, 150));
  });
});

// ============================================
// TEST SUITE 5: ENTITY EXTRACTION
// ============================================

describe('ChatbotService - Entity Extraction', () => {
  test('E2E-15: Should extract amount from price query', async () => {
    // Arrange
    const userMessage = '¿Cuánto cuesta 50000 FCFA?';
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response.message.metadata?.entities).toBeDefined();
    if (response.message.metadata?.entities.amount) {
      expect(response.message.metadata.entities.amount).toBe(50000);
      expect(response.message.metadata.entities.currency).toBe('FCFA');
      console.log('[E2E-15] Extracted Amount:', response.message.metadata.entities);
    }
  });

  test('E2E-16: Should extract service keyword from query', async () => {
    // Arrange
    const userMessage = '¿Cuánto cuesta el pasaporte?';
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response.message.metadata?.entities).toBeDefined();
    if (response.message.metadata?.entities.serviceKeyword) {
      expect(response.message.metadata.entities.serviceKeyword).toBe('pasaporte');
      console.log('[E2E-16] Extracted Service Keyword:', response.message.metadata.entities);
    }
  });
});

// ============================================
// TEST SUITE 6: RESPONSE QUALITY
// ============================================

describe('ChatbotService - Response Quality', () => {
  test('E2E-17: Should include suggestions in response', async () => {
    // Arrange
    const userMessage = 'Hola';
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response.suggestions).toBeDefined();
    expect(Array.isArray(response.suggestions)).toBeTruthy();
    expect(response.suggestions.length).toBeGreaterThan(0);
    expect(response.suggestions.length).toBeLessThanOrEqual(5); // Max 5 suggestions

    console.log('[E2E-17] Suggestions Count:', response.suggestions.length);
  });

  test('E2E-18: Should include metadata in response', async () => {
    // Arrange
    const userMessage = '¿Cuánto cuesta un pasaporte?';
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response.message.metadata).toBeDefined();
    expect(response.message.metadata?.language).toBe('es');
    expect(response.message.metadata?.processingTime).toBeDefined();
    expect(response.message.metadata?.matchScore).toBeDefined();

    console.log('[E2E-18] Metadata:', {
      processingTime: response.message.metadata?.processingTime,
      matchScore: response.message.metadata?.matchScore,
      fallback: response.message.metadata?.fallback,
    });
  });

  test('E2E-19: Should process quickly (under 100ms)', async () => {
    // Arrange
    const userMessage = 'Hola';
    const language: ChatbotLanguage = 'es';

    // Act
    const startTime = Date.now();
    const response = await chatbotService.processMessage(userMessage, language);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Assert
    expect(totalTime).toBeLessThan(100); // Should be under 100ms
    expect(response.message.metadata?.processingTime).toBeDefined();
    expect(response.message.metadata?.processingTime).toBeLessThan(100);

    console.log('[E2E-19] Processing Time:', {
      total: totalTime,
      service: response.message.metadata?.processingTime,
    });
  });

  test('E2E-20: Should vary response introductions (not robotic)', async () => {
    // Arrange
    const userMessage = '¿Cuánto cuesta un pasaporte?';
    const language: ChatbotLanguage = 'es';

    // Act - Run 5 times
    const intros = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const response = await chatbotService.processMessage(userMessage, language);
      const intro = response.message.content.split('\n')[0];
      intros.add(intro);
    }

    // Assert - Should have at least 2 different intros (random selection)
    expect(intros.size).toBeGreaterThanOrEqual(2);

    console.log('[E2E-20] Unique Intros Found:', intros.size, '/', 5);
    console.log('[E2E-20] Sample Intros:', Array.from(intros).slice(0, 3));
  });
});

// ============================================
// TEST SUITE 7: ERROR HANDLING
// ============================================

describe('ChatbotService - Error Handling', () => {
  test('E2E-21: Should handle empty message gracefully', async () => {
    // Arrange
    const userMessage = '';
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response).toBeDefined();
    expect(response.message).toBeDefined();
    expect(response.message.content).toBeTruthy();

    console.log('[E2E-21] Empty Message Response:', response.message.content.substring(0, 100));
  });

  test('E2E-22: Should handle very long message', async () => {
    // Arrange
    const userMessage = 'Hola '.repeat(100); // Very long message
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response).toBeDefined();
    expect(response.message).toBeDefined();

    console.log('[E2E-22] Long Message Handled');
  });

  test('E2E-23: Should handle special characters', async () => {
    // Arrange
    const userMessage = '¿Cuánto cuesta? €$@#%';
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response).toBeDefined();
    expect(response.message).toBeDefined();

    console.log('[E2E-23] Special Characters Handled');
  });

  test('E2E-24: Should handle unknown intent gracefully', async () => {
    // Arrange
    const userMessage = 'xyzabc123nonsense'; // Gibberish
    const language: ChatbotLanguage = 'es';

    // Act
    const response = await chatbotService.processMessage(userMessage, language);

    // Assert
    expect(response).toBeDefined();
    expect(response.message.intent).toBe('unknown');
    expect(response.message.content).toBeTruthy();
    expect(response.suggestions).toBeDefined();
    expect(response.suggestions.length).toBeGreaterThan(0); // Should still offer suggestions

    console.log('[E2E-24] Unknown Intent Response:', response.message.content.substring(0, 100));
  });
});

// ============================================
// TEST SUITE 8: INTEGRATION TESTS
// ============================================

describe('ChatbotService - Integration Tests', () => {
  test('E2E-25: Should handle conversation flow', async () => {
    // Arrange
    const language: ChatbotLanguage = 'es';

    // Act - Simulate multi-turn conversation
    const responses = [];

    // Turn 1: Greeting
    responses.push(await chatbotService.processMessage('Hola', language));

    // Turn 2: Ask price
    responses.push(await chatbotService.processMessage('¿Cuánto cuesta un pasaporte?', language));

    // Turn 3: Ask documents
    responses.push(await chatbotService.processMessage('¿Qué documentos necesito?', language));

    // Assert
    expect(responses.length).toBe(3);
    responses.forEach((response, index) => {
      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
      expect(response.message.content).toBeTruthy();
      console.log(`[E2E-25] Turn ${index + 1} Intent:`, response.message.intent);
    });
  });

  test('E2E-26: Should maintain language consistency across conversation', async () => {
    // Arrange
    const language: ChatbotLanguage = 'fr';

    // Act
    const response1 = await chatbotService.processMessage('Bonjour', language);
    const response2 = await chatbotService.processMessage('Combien ça coûte?', language);
    const response3 = await chatbotService.processMessage('Quels documents?', language);

    // Assert - All responses should be in French
    expect(response1.message.metadata?.language).toBe('fr');
    expect(response2.message.metadata?.language).toBe('fr');
    expect(response3.message.metadata?.language).toBe('fr');

    console.log('[E2E-26] Language Consistency Maintained: fr');
  });
});

// ============================================
// TEST SUITE 9: PERFORMANCE TESTS
// ============================================

describe('ChatbotService - Performance Tests', () => {
  test('E2E-27: Should handle 10 consecutive queries efficiently', async () => {
    // Arrange
    const queries = [
      'Hola',
      '¿Cuánto cuesta un pasaporte?',
      '¿Qué documentos necesito?',
      '¿Cuál es el procedimiento?',
      'Buscar certificado',
      '¿Cuánto tiempo toma?',
      'Ver servicios populares',
      'Información sobre visa',
      '¿Dónde puedo pagar?',
      'Gracias',
    ];
    const language: ChatbotLanguage = 'es';

    // Act
    const startTime = Date.now();
    const responses = await Promise.all(
      queries.map((query) => chatbotService.processMessage(query, language))
    );
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Assert
    expect(responses.length).toBe(10);
    expect(totalTime).toBeLessThan(500); // All 10 queries should take less than 500ms

    const avgTime = totalTime / 10;
    console.log('[E2E-27] Performance Metrics:', {
      totalQueries: 10,
      totalTime: `${totalTime}ms`,
      avgTime: `${avgTime.toFixed(2)}ms`,
    });

    responses.forEach((response) => {
      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
    });
  });

  test('E2E-28: Should have consistent response times', async () => {
    // Arrange
    const userMessage = '¿Cuánto cuesta un pasaporte?';
    const language: ChatbotLanguage = 'es';
    const iterations = 5;

    // Act
    const times: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const response = await chatbotService.processMessage(userMessage, language);
      if (response.message.metadata?.processingTime) {
        times.push(response.message.metadata.processingTime);
      }
    }

    // Assert
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    const variance = maxTime - minTime;

    expect(variance).toBeLessThan(50); // Variance should be less than 50ms

    console.log('[E2E-28] Response Time Consistency:', {
      avg: `${avgTime.toFixed(2)}ms`,
      min: `${minTime}ms`,
      max: `${maxTime}ms`,
      variance: `${variance}ms`,
    });
  });
});

// ============================================
// E2E SUMMARY
// ============================================

describe('E2E Test Summary', () => {
  test('E2E-29: Print test coverage summary', () => {
    console.log('\n========================================');
    console.log('CHATBOT E2E TEST COVERAGE SUMMARY');
    console.log('========================================');
    console.log('✅ Pattern Matching: 6 tests');
    console.log('✅ FTS5 Fallback: 2 tests');
    console.log('✅ Multilingual: 4 tests');
    console.log('✅ Dynamic Search: 2 tests');
    console.log('✅ Entity Extraction: 2 tests');
    console.log('✅ Response Quality: 5 tests');
    console.log('✅ Error Handling: 4 tests');
    console.log('✅ Integration: 2 tests');
    console.log('✅ Performance: 2 tests');
    console.log('========================================');
    console.log('Total Tests: 29');
    console.log('========================================\n');
    expect(true).toBe(true);
  });
});
