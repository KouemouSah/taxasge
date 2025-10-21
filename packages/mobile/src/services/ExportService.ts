/**
 * TaxasGE Mobile - Export Service
 *
 * Handles exporting calculations to PDF, Image, and sharing.
 * Uses react-native-view-shot for image capture and Share API.
 *
 * Date: 2025-10-21
 */

import { Share, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { CalculationResult } from './CalculatorEngine';
import { FiscalService } from '../database/services/FiscalServicesService';

/**
 * NOTE: This service uses react-native-view-shot for image capture.
 * File system operations are limited to temporary files.
 * For production, consider adding react-native-fs for permanent storage.
 */

export interface ExportOptions {
  format: 'pdf' | 'image' | 'text';
  quality?: number; // 0-1, for image
  includeBreakdown?: boolean;
}

class ExportService {
  /**
   * Export calculation to image
   * Uses react-native-view-shot to capture a view reference
   */
  async exportToImage(
    viewRef: any,
    calculation: CalculationResult,
    service: FiscalService,
    options?: ExportOptions
  ): Promise<string> {
    try {
      console.log('[ExportService] Exporting calculation to image');

      if (!viewRef || !viewRef.current) {
        throw new Error('View reference is required for image export');
      }

      // Capture the view as temporary file
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: options?.quality || 0.9,
        result: 'tmpfile',
      });

      console.log(`[ExportService] Image captured (temp): ${uri}`);
      console.warn(
        '[ExportService] Image saved to temporary location. ' +
        'For permanent storage, add react-native-fs to dependencies.'
      );

      return uri;
    } catch (error) {
      console.error('[ExportService] Export to image error:', error);
      throw new Error(`Failed to export to image: ${error}`);
    }
  }

  /**
   * Export calculation to PDF
   * Note: react-native-pdf is primarily a viewer, not a generator.
   * For PDF generation, we need react-native-html-to-pdf or backend service.
   *
   * For MVP, we return HTML content that can be shared or displayed.
   */
  async exportToPDF(
    calculation: CalculationResult,
    service: FiscalService,
    language: 'es' | 'fr' | 'en' = 'es'
  ): Promise<string> {
    try {
      console.log('[ExportService] Generating PDF content (HTML format)');

      // Generate HTML content
      const html = this.generateCalculationHTML(calculation, service, language);

      console.warn(
        '[ExportService] PDF generation requires react-native-html-to-pdf or react-native-fs. ' +
        'Returning HTML content for now. Consider adding these dependencies.'
      );

      return html;
    } catch (error) {
      console.error('[ExportService] Export to PDF error:', error);
      throw new Error(`Failed to export to PDF: ${error}`);
    }
  }

  /**
   * Export calculation to text format
   */
  async exportToText(
    calculation: CalculationResult,
    service: FiscalService,
    language: 'es' | 'fr' | 'en' = 'es'
  ): Promise<string> {
    try {
      console.log('[ExportService] Generating text content');

      const text = this.generateCalculationText(calculation, service, language);

      console.warn(
        '[ExportService] File system write requires react-native-fs. ' +
        'Returning text content for sharing.'
      );

      return text;
    } catch (error) {
      console.error('[ExportService] Export to text error:', error);
      throw new Error(`Failed to export to text: ${error}`);
    }
  }

  /**
   * Share calculation using native Share API
   */
  async shareCalculation(
    calculation: CalculationResult,
    service: FiscalService,
    language: 'es' | 'fr' | 'en' = 'es',
    imageUri?: string
  ): Promise<void> {
    try {
      console.log('[ExportService] Sharing calculation');

      const message = this.generateShareMessage(calculation, service, language);

      const shareOptions: any = {
        title: this.getServiceName(service, language),
        message,
      };

      // Add image URL if provided
      if (imageUri) {
        shareOptions.url = Platform.OS === 'ios' ? imageUri : `file://${imageUri}`;
      }

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        console.log('[ExportService] Calculation shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('[ExportService] Share dismissed');
      }
    } catch (error) {
      console.error('[ExportService] Share error:', error);
      throw new Error(`Failed to share calculation: ${error}`);
    }
  }

  /**
   * Generate HTML content for calculation
   */
  private generateCalculationHTML(
    calculation: CalculationResult,
    service: FiscalService,
    language: 'es' | 'fr' | 'en'
  ): string {
    const serviceName = this.getServiceName(service, language);
    const { amount, breakdown } = calculation;

    const labels = this.getLabels(language);

    let breakdownHTML = '';
    if (breakdown.steps && breakdown.steps.length > 0) {
      breakdownHTML = `
        <div class="breakdown">
          <h3>${labels.calculationDetails}</h3>
          <ul>
            ${breakdown.steps.map(step => `<li>${step}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${labels.calculationReceipt}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #007AFF;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      color: #007AFF;
      font-size: 24px;
    }
    .header p {
      margin: 5px 0 0;
      color: #666;
    }
    .service-info {
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .service-info h2 {
      margin: 0 0 10px;
      font-size: 18px;
      color: #333;
    }
    .service-info p {
      margin: 5px 0;
      color: #666;
    }
    .amount {
      text-align: center;
      margin: 30px 0;
      padding: 20px;
      background: #e8f4fd;
      border-radius: 8px;
      border: 2px solid #007AFF;
    }
    .amount h2 {
      margin: 0 0 10px;
      color: #666;
      font-size: 14px;
      text-transform: uppercase;
    }
    .amount .value {
      margin: 0;
      color: #007AFF;
      font-size: 36px;
      font-weight: bold;
    }
    .breakdown {
      margin: 20px 0;
    }
    .breakdown h3 {
      margin: 0 0 15px;
      font-size: 16px;
      color: #333;
    }
    .breakdown ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .breakdown li {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
      color: #666;
    }
    .breakdown li:last-child {
      border-bottom: none;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TaxasGE</h1>
      <p>${labels.calculationReceipt}</p>
    </div>

    <div class="service-info">
      <h2>${serviceName}</h2>
      <p><strong>${labels.serviceCode}:</strong> ${service.service_code}</p>
      <p><strong>${labels.calculationMethod}:</strong> ${calculation.method}</p>
    </div>

    <div class="amount">
      <h2>${labels.totalAmount}</h2>
      <p class="value">${this.formatAmount(amount)} XAF</p>
    </div>

    ${breakdownHTML}

    <div class="footer">
      <p>${labels.generatedOn}: ${new Date().toLocaleString(language)}</p>
      <p>TaxasGE Mobile - ${labels.fiscalManagement}</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text content for calculation
   */
  private generateCalculationText(
    calculation: CalculationResult,
    service: FiscalService,
    language: 'es' | 'fr' | 'en'
  ): string {
    const serviceName = this.getServiceName(service, language);
    const { amount, breakdown } = calculation;
    const labels = this.getLabels(language);

    let text = `
═══════════════════════════════════════
${labels.calculationReceipt.toUpperCase()}
═══════════════════════════════════════

${labels.service}: ${serviceName}
${labels.serviceCode}: ${service.service_code}
${labels.calculationMethod}: ${calculation.method}

───────────────────────────────────────
${labels.totalAmount.toUpperCase()}
───────────────────────────────────────
${this.formatAmount(amount)} XAF

`;

    if (breakdown.steps && breakdown.steps.length > 0) {
      text += `
───────────────────────────────────────
${labels.calculationDetails.toUpperCase()}
───────────────────────────────────────
`;
      breakdown.steps.forEach((step, index) => {
        if (step) {
          text += `${index + 1}. ${step}\n`;
        }
      });
    }

    text += `
───────────────────────────────────────
${labels.generatedOn}: ${new Date().toLocaleString(language)}
TaxasGE Mobile - ${labels.fiscalManagement}
═══════════════════════════════════════
    `.trim();

    return text;
  }

  /**
   * Generate message for sharing
   */
  private generateShareMessage(
    calculation: CalculationResult,
    service: FiscalService,
    language: 'es' | 'fr' | 'en'
  ): string {
    const serviceName = this.getServiceName(service, language);
    const { amount } = calculation;
    const labels = this.getLabels(language);

    return `
${labels.calculationReceipt}

${labels.service}: ${serviceName}
${labels.totalAmount}: ${this.formatAmount(amount)} XAF

${labels.generatedBy} TaxasGE Mobile
    `.trim();
  }

  /**
   * Get service name in appropriate language
   */
  private getServiceName(service: FiscalService, language: 'es' | 'fr' | 'en'): string {
    switch (language) {
      case 'fr':
        return service.name_fr || service.name_es;
      case 'en':
        return service.name_en || service.name_es;
      default:
        return service.name_es;
    }
  }

  /**
   * Format amount with thousand separators
   */
  private formatAmount(amount: number): string {
    return amount.toLocaleString('es-GQ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Get localized labels
   */
  private getLabels(language: 'es' | 'fr' | 'en'): Record<string, string> {
    const labels = {
      es: {
        calculationReceipt: 'Comprobante de Cálculo',
        service: 'Servicio',
        serviceCode: 'Código',
        calculationMethod: 'Método de Cálculo',
        totalAmount: 'Monto Total',
        calculationDetails: 'Detalles del Cálculo',
        generatedOn: 'Generado el',
        generatedBy: 'Generado por',
        fiscalManagement: 'Gestión Fiscal',
      },
      fr: {
        calculationReceipt: 'Reçu de Calcul',
        service: 'Service',
        serviceCode: 'Code',
        calculationMethod: 'Méthode de Calcul',
        totalAmount: 'Montant Total',
        calculationDetails: 'Détails du Calcul',
        generatedOn: 'Généré le',
        generatedBy: 'Généré par',
        fiscalManagement: 'Gestion Fiscale',
      },
      en: {
        calculationReceipt: 'Calculation Receipt',
        service: 'Service',
        serviceCode: 'Code',
        calculationMethod: 'Calculation Method',
        totalAmount: 'Total Amount',
        calculationDetails: 'Calculation Details',
        generatedOn: 'Generated on',
        generatedBy: 'Generated by',
        fiscalManagement: 'Fiscal Management',
      },
    };

    return labels[language];
  }
}

export const exportService = new ExportService();
