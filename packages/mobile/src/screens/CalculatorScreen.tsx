/**
 * TaxasGE Mobile - Calculator Screen
 *
 * Dynamic form-based calculator for fiscal services.
 * Supports all 8 calculation methods with real-time validation.
 *
 * Date: 2025-10-21
 */

import React, { useState, useRef, useCallback } from 'react';
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
import {
  FiscalService,
  getServiceName,
  getServiceDescription,
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
  userId: string;
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
  userId,
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

  // Get required input fields
  const requiredFields = calculatorEngine.getRequiredInputs(service);

  // Handle input change
  const handleInputChange = useCallback((field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    // Clear result when inputs change
    setResult(null);
  }, []);

  // Validate inputs
  const validateInputs = (): boolean => {
    for (const field of requiredFields) {
      const value = inputs[field.field];
      if (!value || value.trim() === '') {
        return false;
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        return false;
      }
    }
    return true;
  };

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

  // Render input field
  const renderInputField = (field: { field: string; label: string; type: string }) => {
    return (
      <View key={field.field} style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{field.label}</Text>
        <TextInput
          style={styles.input}
          value={inputs[field.field] || ''}
          onChangeText={value => handleInputChange(field.field, value)}
          keyboardType="numeric"
          placeholder={`Enter ${field.label.toLowerCase()}`}
          placeholderTextColor="#999"
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t.title}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Service Info */}
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{getServiceName(service, language)}</Text>
          <Text style={styles.serviceCode}>{service.service_code}</Text>
          {getServiceDescription(service, language) && (
            <Text style={styles.serviceDescription}>
              {getServiceDescription(service, language)}
            </Text>
          )}
        </View>

        {/* Calculation Type Selector */}
        {(service.tasa_renovacion && service.tasa_renovacion > 0) && (
          <View style={styles.typeSelector}>
            <Text style={styles.sectionTitle}>{t.calculationType}</Text>
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
                  {t.expedition}
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
                  {t.renewal}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input Fields */}
        {requiredFields.length > 0 && (
          <View style={styles.inputsSection}>
            {requiredFields.map(renderInputField)}
          </View>
        )}

        {/* Calculate Button */}
        <TouchableOpacity
          style={styles.calculateButton}
          onPress={handleCalculate}
          disabled={isCalculating}>
          {isCalculating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.calculateButtonText}>{t.calculate}</Text>
          )}
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <View ref={resultViewRef} style={styles.resultSection}>
            <Text style={styles.sectionTitle}>{t.result}</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>{t.amount}</Text>
              <Text style={styles.resultAmount}>
                {formatAmount(result.amount)} XAF
              </Text>
            </View>

            {/* Breakdown */}
            {result.breakdown && result.breakdown.steps && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>{t.breakdown}</Text>
                {result.breakdown.steps.filter(Boolean).map((step, index) => (
                  <Text key={index} style={styles.breakdownStep}>
                    • {step}
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
              <Text style={styles.checkboxLabel}>{t.saveForLater}</Text>
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
                  <Text style={styles.actionButtonText}>{t.save}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Text style={styles.actionButtonText}>{t.share}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleExportPDF}>
                <Text style={styles.actionButtonText}>{t.exportPDF}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleExportImage}>
                <Text style={styles.actionButtonText}>{t.exportImage}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* No result message */}
        {!result && !isCalculating && (
          <View style={styles.noResultSection}>
            <Text style={styles.noResultText}>{t.noCalculation}</Text>
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  headerRight: {
    width: 40,
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
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
