/**
 * TaxasGE Mobile - Calculator Screen
 *
 * Dynamic form-based calculator for fiscal services.
 * Supports all 8 calculation methods with real-time validation.
 *
 * Date: 2025-10-21
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { GradientHeader } from '../components/GradientHeader';
import { Icon } from '../components/Icon';
import {
  FiscalService,
  getServiceName,
} from '../database/services/FiscalServicesService';
import {
  calculatorEngine,
  CalculationInput,
  CalculationResult,
} from '../services/CalculatorEngine';
import {
  calculationHistoryService,
  SaveCalculationParams,
} from '../database/services/CalculationHistoryService';
import { exportService } from '../services/ExportService';

export interface CalculatorScreenProps {
  service: FiscalService;
  language: 'es' | 'fr' | 'en';
  userId?: string; // Optional - defaults to 'local-user'
  onBack?: () => void;
}

const TEXTS = {
  es: {
    title: 'Calculadora',
    calculate: 'Calcular',
    save: 'Guardar',
    share: 'Compartir',
    exportPDF: 'Exportar PDF',
    exportImage: 'Exportar Imagen',
    calculationType: 'Tipo de Cálculo',
    expedition: 'Expedición',
    renewal: 'Renovación',
    result: 'Resultado',
    breakdown: 'Detalles del Cálculo',
    saveForLater: 'Guardar para más tarde',
    calculationSaved: 'Cálculo guardado exitosamente',
    error: 'Error',
    validationError: 'Por favor, complete todos los campos requeridos',
    calculationError: 'Error al calcular',
    amount: 'Monto',
    noCalculation: 'Ingrese los valores y presione Calcular',
  },
  fr: {
    title: 'Calculatrice',
    calculate: 'Calculer',
    save: 'Enregistrer',
    share: 'Partager',
    exportPDF: 'Exporter PDF',
    exportImage: 'Exporter Image',
    calculationType: 'Type de Calcul',
    expedition: 'Expédition',
    renewal: 'Renouvellement',
    result: 'Résultat',
    breakdown: 'Détails du Calcul',
    saveForLater: 'Enregistrer pour plus tard',
    calculationSaved: 'Calcul enregistré avec succès',
    error: 'Erreur',
    validationError: 'Veuillez remplir tous les champs requis',
    calculationError: 'Erreur de calcul',
    amount: 'Montant',
    noCalculation: 'Entrez les valeurs et appuyez sur Calculer',
  },
  en: {
    title: 'Calculator',
    calculate: 'Calculate',
    save: 'Save',
    share: 'Share',
    exportPDF: 'Export PDF',
    exportImage: 'Export Image',
    calculationType: 'Calculation Type',
    expedition: 'Expedition',
    renewal: 'Renewal',
    result: 'Result',
    breakdown: 'Calculation Details',
    saveForLater: 'Save for later',
    calculationSaved: 'Calculation saved successfully',
    error: 'Error',
    validationError: 'Please fill in all required fields',
    calculationError: 'Calculation error',
    amount: 'Amount',
    noCalculation: 'Enter values and press Calculate',
  },
};

export const CalculatorScreen: React.FC<CalculatorScreenProps> = ({
  service,
  language,
  userId = 'local-user', // Default user ID for offline use
  onBack,
}) => {
  const t = TEXTS[language];
  const resultViewRef = useRef<View>(null);

  // State
  const [calculationType, setCalculationType] = useState<'expedition' | 'renewal'>('expedition');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveForLater, setSaveForLater] = useState(false);

  // Get required input fields with translations - MEMOIZED to prevent re-renders
  const requiredFields = useMemo(() => {
    console.log('[CalculatorScreen] Getting required inputs for', service.service_code);
    const fields = calculatorEngine.getRequiredInputs(service, language);
    console.log('[CalculatorScreen] Required fields count:', fields.length);

    // Validate each field to detect potential issues
    fields.forEach((field, index) => {
      Object.keys(field).forEach(key => {
        const value = field[key as keyof typeof field];
        const valueType = typeof value;
        if (valueType === 'object' && value !== null && value !== undefined) {
          console.error(`[CalculatorScreen] ⚠️  Field ${index} key "${key}" is object:`, value);
        }
      });
    });

    return fields;
  }, [service, language]);

  // Get formula description if available - MEMOIZED to prevent re-renders
  const formulaDescription = useMemo(() => {
    const desc = calculatorEngine.getFormulaDescription(service, language);
    console.log('[CalculatorScreen] Formula description:', typeof desc, desc);
    return desc;
  }, [service, language]);

  // Group fields by section - MEMOIZED to prevent re-renders
  const groupedFields = useMemo(() => {
    return requiredFields.reduce((acc, field) => {
      const section = field.section || 'default';
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(field);
      return acc;
    }, {} as Record<string, typeof requiredFields>);
  }, [requiredFields]);

  // Handle input change
  const handleInputChange = useCallback((field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    // Clear result when inputs change
    setResult(null);
  }, []);

  // Validate inputs with enhanced validation
  const validateInputs = useCallback((): boolean => {
    for (const field of requiredFields) {
      const value = inputs[field.field];

      // Check if required field is empty
      if (field.required !== false && (!value || value.trim() === '')) {
        return false;
      }

      // If value provided, validate it
      if (value && value.trim() !== '') {
        const numValue = parseFloat(value);

        // Check if valid number
        if (isNaN(numValue)) {
          return false;
        }

        // Check min/max constraints
        if (field.min !== undefined && numValue < field.min) {
          return false;
        }
        if (field.max !== undefined && numValue > field.max) {
          return false;
        }
      }
    }
    return true;
  }, [requiredFields, inputs]);

  // Handle calculate
  const handleCalculate = useCallback(() => {
    try {
      setIsCalculating(true);

      // Validate inputs
      if (!validateInputs()) {
        Alert.alert(t.error, t.validationError);
        setIsCalculating(false);
        return;
      }

      // Prepare calculation input
      const calculationInput: CalculationInput = {};

      // Map form inputs to CalculationInput
      if (inputs.baseAmount) {
        calculationInput.baseAmount = parseFloat(inputs.baseAmount);
      }
      if (inputs.quantity) {
        calculationInput.quantity = parseFloat(inputs.quantity);
      }

      // For formula-based, collect all custom inputs
      if (service.calculation_method === 'formula_based') {
        calculationInput.customInputs = {};
        requiredFields.forEach(field => {
          const value = inputs[field.field];
          if (value) {
            calculationInput.customInputs![field.field] = parseFloat(value);
          }
        });
      }

      // Calculate
      const calculationResult = calculatorEngine.calculate(
        service,
        calculationType,
        calculationInput
      );

      setResult(calculationResult);

      console.log('[CalculatorScreen] Calculation result:', calculationResult);
    } catch (error) {
      console.error('[CalculatorScreen] Calculation error:', error);
      Alert.alert(t.error, `${t.calculationError}: ${error}`);
    } finally {
      setIsCalculating(false);
    }
  }, [inputs, calculationType, service, t, requiredFields, validateInputs]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!result) {
      Alert.alert(t.error, t.noCalculation);
      return;
    }

    try {
      setIsSaving(true);

      // Prepare calculation input for saving
      const calculationInput: CalculationInput = {};
      if (inputs.baseAmount) {
        calculationInput.baseAmount = parseFloat(inputs.baseAmount);
      }
      if (inputs.quantity) {
        calculationInput.quantity = parseFloat(inputs.quantity);
      }
      if (service.calculation_method === 'formula_based') {
        calculationInput.customInputs = {};
        requiredFields.forEach(field => {
          const value = inputs[field.field];
          if (value) {
            calculationInput.customInputs![field.field] = parseFloat(value);
          }
        });
      }

      const params: SaveCalculationParams = {
        userId,
        serviceCode: service.service_code,
        serviceName: getServiceName(service, language),
        calculationType,
        inputs: calculationInput,
        result,
        savedForLater: saveForLater,
      };

      await calculationHistoryService.saveCalculation(params);

      Alert.alert(t.calculationSaved);
    } catch (error) {
      console.error('[CalculatorScreen] Save error:', error);
      Alert.alert(t.error, `Failed to save: ${error}`);
    } finally {
      setIsSaving(false);
    }
  }, [result, inputs, userId, service, calculationType, language, saveForLater, t, requiredFields]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (!result) {
      Alert.alert(t.error, t.noCalculation);
      return;
    }

    try {
      await exportService.shareCalculation(result, service, language);
    } catch (error) {
      console.error('[CalculatorScreen] Share error:', error);
      Alert.alert(t.error, `Failed to share: ${error}`);
    }
  }, [result, service, language, t]);

  // Handle export PDF
  const handleExportPDF = useCallback(async () => {
    if (!result) {
      Alert.alert(t.error, t.noCalculation);
      return;
    }

    try {
      const html = await exportService.exportToPDF(result, service, language);
      Alert.alert('PDF', 'HTML content generated. Add react-native-html-to-pdf for full PDF support.');
      console.log('[CalculatorScreen] PDF HTML:', html);
    } catch (error) {
      console.error('[CalculatorScreen] Export PDF error:', error);
      Alert.alert(t.error, `Failed to export PDF: ${error}`);
    }
  }, [result, service, language, t]);

  // Handle export image
  const handleExportImage = useCallback(async () => {
    if (!result) {
      Alert.alert(t.error, t.noCalculation);
      return;
    }

    try {
      const uri = await exportService.exportToImage(resultViewRef, result, service);
      Alert.alert('Image', `Saved to: ${uri}`);
    } catch (error) {
      console.error('[CalculatorScreen] Export image error:', error);
      Alert.alert(t.error, `Failed to export image: ${error}`);
    }
  }, [result, service, t]);

  // Render input field with enhanced features
  const renderInputField = (field: {
    field: string;
    label: string;
    placeholder: string;
    type: string;
    hint?: string;
    unit?: string;
    required?: boolean;
    min?: number;
    max?: number;
  }) => {
    // Validate all string fields to prevent "Text must be within <Text>" errors
    const safeLabel = typeof field.label === 'string' && field.label.trim() !== '' ? field.label : field.field || 'Input';
    const safePlaceholder = typeof field.placeholder === 'string' ? field.placeholder : '';
    const safeHint = field.hint && typeof field.hint === 'string' && field.hint.trim() !== '' ? field.hint : null;
    const safeUnit = field.unit && typeof field.unit === 'string' && field.unit.trim() !== '' ? field.unit : null;

    // Build label with unit and optional indicator
    const labelText = safeUnit ? `${safeLabel} (${safeUnit})` : safeLabel;
    const isOptional = field.required === false;

    // Build validation hint
    let validationHint: string = '';
    if (field.min !== undefined && field.max !== undefined) {
      const hint = {
        es: `Valor entre ${field.min} y ${field.max}`,
        fr: `Valeur entre ${field.min} et ${field.max}`,
        en: `Value between ${field.min} and ${field.max}`,
      }[language];
      validationHint = typeof hint === 'string' ? hint : '';
    } else if (field.min !== undefined) {
      const hint = {
        es: `Mínimo: ${field.min}`,
        fr: `Minimum: ${field.min}`,
        en: `Minimum: ${field.min}`,
      }[language];
      validationHint = typeof hint === 'string' ? hint : '';
    } else if (field.max !== undefined) {
      const hint = {
        es: `Máximo: ${field.max}`,
        fr: `Maximum: ${field.max}`,
        en: `Maximum: ${field.max}`,
      }[language];
      validationHint = typeof hint === 'string' ? hint : '';
    }

    return (
      <View key={field.field} style={styles.inputContainer}>
        <View style={styles.inputLabelContainer}>
          <Text style={styles.inputLabel}>{String(labelText)}</Text>
          {isOptional && (
            <Text style={styles.optionalBadge}>
              {String(language === 'es' ? 'Opcional' : language === 'fr' ? 'Facultatif' : 'Optional')}
            </Text>
          )}
        </View>
        {safeHint && (
          <Text style={styles.inputHint}>{String(safeHint)}</Text>
        )}
        {validationHint && typeof validationHint === 'string' && validationHint.trim() !== '' && (
          <Text style={styles.validationHint}>{String(validationHint)}</Text>
        )}
        <TextInput
          style={styles.input}
          value={inputs[field.field] || ''}
          onChangeText={value => handleInputChange(field.field, value)}
          keyboardType="numeric"
          placeholder={safePlaceholder}
          placeholderTextColor="#999"
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#004aad" />

      {/* Modern Header */}
      <GradientHeader
        title={t.title}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Calculation Type Selector */}
        {(service.tasa_renovacion && service.tasa_renovacion > 0) && (
          <View style={styles.typeSelector}>
            <Text style={styles.sectionTitle}>{String(t.calculationType)}</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  calculationType === 'expedition' && styles.typeButtonActive,
                ]}
                onPress={() => setCalculationType('expedition')}>
                <Text
                  style={[
                    styles.typeButtonText,
                    calculationType === 'expedition' && styles.typeButtonTextActive,
                  ]}>
                  {String(t.expedition)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  calculationType === 'renewal' && styles.typeButtonActive,
                ]}
                onPress={() => setCalculationType('renewal')}>
                <Text
                  style={[
                    styles.typeButtonText,
                    calculationType === 'renewal' && styles.typeButtonTextActive,
                  ]}>
                  {String(t.renewal)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Formula Description */}
        {formulaDescription && typeof formulaDescription === 'string' && formulaDescription.trim() !== '' && (
          <View style={styles.formulaDescriptionSection}>
            <Icon name="info" size={20} color="#007AFF" style={styles.formulaDescriptionIcon} />
            <Text style={styles.formulaDescriptionText}>{String(formulaDescription)}</Text>
          </View>
        )}

        {/* Input Fields - Grouped by section */}
        {requiredFields.length > 0 && (
          <>
            {Object.keys(groupedFields).map(sectionKey => {
              const sectionFields = groupedFields[sectionKey];
              const showSectionHeader = sectionKey !== 'default' && Object.keys(groupedFields).length > 1;

              // CRITICAL: Ensure sectionKey is absolutely a valid string
              const safeSectionKey = typeof sectionKey === 'string' && sectionKey.trim() !== ''
                ? String(sectionKey)
                : 'section';

              return (
                <View key={safeSectionKey} style={styles.inputsSection}>
                  {showSectionHeader && (
                    <Text style={styles.sectionHeader}>{safeSectionKey}</Text>
                  )}
                  {sectionFields.map(renderInputField)}
                </View>
              );
            })}
          </>
        )}

        {/* Calculate Button */}
        <TouchableOpacity
          style={styles.calculateButton}
          onPress={handleCalculate}
          disabled={isCalculating}>
          {isCalculating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.calculateButtonText}>{String(t.calculate)}</Text>
          )}
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <View ref={resultViewRef} style={styles.resultSection}>
            <Text style={styles.sectionTitle}>{String(t.result)}</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>{String(t.amount)}</Text>
              <Text style={styles.resultAmount}>
                {String(formatAmount(result.amount))} XAF
              </Text>
            </View>

            {/* Breakdown */}
            {result.breakdown && result.breakdown.steps && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>{String(t.breakdown)}</Text>
                {result.breakdown.steps.filter(Boolean).map((step, index) => (
                  <Text key={index} style={styles.breakdownStep}>
                    • {String(step)}
                  </Text>
                ))}
              </View>
            )}

            {/* Save for later checkbox */}
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setSaveForLater(!saveForLater)}>
              <View style={[styles.checkboxBox, saveForLater && styles.checkboxBoxChecked]}>
                {saveForLater && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>{String(t.saveForLater)}</Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSave}
                disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Text style={styles.actionButtonText}>{String(t.save)}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Text style={styles.actionButtonText}>{String(t.share)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleExportPDF}>
                <Text style={styles.actionButtonText}>{String(t.exportPDF)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleExportImage}>
                <Text style={styles.actionButtonText}>{String(t.exportImage)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* No result message */}
        {!result && !isCalculating && (
          <View style={styles.noResultSection}>
            <Text style={styles.noResultText}>{String(t.noCalculation)}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function
const formatAmount = (amount: number): string => {
  return amount.toLocaleString('es-GQ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Content
  content: {
    padding: 16,
  },

  // Service Info
  serviceInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  serviceCode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Type Selector
  typeSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },

  // Formula Description
  formulaDescriptionSection: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  formulaDescriptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  formulaDescriptionText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },

  // Input Fields
  inputsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 12,
    marginTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inputHint: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  validationHint: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },

  // Calculate Button
  calculateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Result
  resultSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  resultBox: {
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resultAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
  },

  // Breakdown
  breakdownSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  breakdownStep: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },

  // Checkbox
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#007AFF',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1A1A1A',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },

  // No Result
  noResultSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  noResultText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default CalculatorScreen;
