'use client';

/**
 * Receipt Verification Page
 *
 * Public page to verify payment receipt authenticity via QR code scan.
 * Validates HMAC token and displays receipt details if valid.
 *
 * URL: /verify/{receiptNumber}?t={token}
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { CheckCircle, XCircle, Loader2, Shield, FileText, Calendar, CreditCard, User, Building2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface VerificationResult {
  valid: boolean;
  receipt_number: string;
  message: string;
  payment_date?: string;
  amount?: number;
  currency?: string;
  payment_method?: string;
  payer_name?: string;
  workflow_code?: string;
  entity_code?: string;
  solicitud_type?: string;
  service_request_reference?: string;
  validated_by?: string;
  validated_at?: string;
}

const translations = {
  es: {
    title: 'Verificacion de Recibo',
    subtitle: 'Sistema de Verificacion de Pagos del Tesoro Publico',
    verifying: 'Verificando autenticidad...',
    valid_receipt: 'Recibo Valido',
    invalid_receipt: 'Recibo No Valido',
    receipt_number: 'Numero de Recibo',
    payment_date: 'Fecha de Pago',
    amount: 'Monto',
    payment_method: 'Metodo de Pago',
    payer: 'Pagador',
    workflow_code: 'Codigo de Tramite',
    entity: 'Entidad',
    request_type: 'Tipo de Solicitud',
    request_reference: 'Referencia de Solicitud',
    validated_by: 'Validado por',
    validation_date: 'Fecha de Validacion',
    missing_token: 'Token de verificacion no proporcionado',
    error: 'Error de Verificacion',
    error_message: 'No se pudo verificar el recibo. Intente nuevamente.',
    official_notice: 'Este sistema de verificacion es proporcionado por el Ministerio de Hacienda, Economia y Planificacion de Guinea Ecuatorial.',
    cash: 'Efectivo',
    check: 'Cheque',
    mobile_money: 'Mobile Money',
    card: 'Tarjeta',
    bank_transfer: 'Transferencia',
  },
  fr: {
    title: 'Verification du Recu',
    subtitle: 'Systeme de Verification des Paiements du Tresor Public',
    verifying: 'Verification de l\'authenticite...',
    valid_receipt: 'Recu Valide',
    invalid_receipt: 'Recu Non Valide',
    receipt_number: 'Numero de Recu',
    payment_date: 'Date de Paiement',
    amount: 'Montant',
    payment_method: 'Mode de Paiement',
    payer: 'Payeur',
    workflow_code: 'Code de Procedure',
    entity: 'Entite',
    request_type: 'Type de Demande',
    request_reference: 'Reference de Demande',
    validated_by: 'Valide par',
    validation_date: 'Date de Validation',
    missing_token: 'Token de verification non fourni',
    error: 'Erreur de Verification',
    error_message: 'Impossible de verifier le recu. Veuillez reessayer.',
    official_notice: 'Ce systeme de verification est fourni par le Ministere des Finances, de l\'Economie et de la Planification de Guinee Equatoriale.',
    cash: 'Especes',
    check: 'Cheque',
    mobile_money: 'Mobile Money',
    card: 'Carte',
    bank_transfer: 'Virement',
  },
  en: {
    title: 'Receipt Verification',
    subtitle: 'Public Treasury Payment Verification System',
    verifying: 'Verifying authenticity...',
    valid_receipt: 'Valid Receipt',
    invalid_receipt: 'Invalid Receipt',
    receipt_number: 'Receipt Number',
    payment_date: 'Payment Date',
    amount: 'Amount',
    payment_method: 'Payment Method',
    payer: 'Payer',
    workflow_code: 'Procedure Code',
    entity: 'Entity',
    request_type: 'Request Type',
    request_reference: 'Request Reference',
    validated_by: 'Validated by',
    validation_date: 'Validation Date',
    missing_token: 'Verification token not provided',
    error: 'Verification Error',
    error_message: 'Could not verify receipt. Please try again.',
    official_notice: 'This verification system is provided by the Ministry of Finance, Economy and Planning of Equatorial Guinea.',
    cash: 'Cash',
    check: 'Check',
    mobile_money: 'Mobile Money',
    card: 'Card',
    bank_transfer: 'Bank Transfer',
  },
};

export default function VerifyReceiptPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale() as 'es' | 'fr' | 'en';
  const t = translations[locale] || translations.es;

  const receiptNumber = params.receiptNumber as string;
  const token = searchParams.get('t');

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyReceipt = async () => {
      if (!token) {
        setError(t.missing_token);
        setLoading(false);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://taxasge-api.emacsah.com';
        const response = await fetch(
          `${apiUrl}/api/v1/verify/${encodeURIComponent(receiptNumber)}?t=${encodeURIComponent(token)}`
        );

        if (!response.ok) {
          throw new Error('Verification failed');
        }

        const data: VerificationResult = await response.json();
        setResult(data);
      } catch (err) {
        console.error('Verification error:', err);
        setError(t.error_message);
      } finally {
        setLoading(false);
      }
    };

    verifyReceipt();
  }, [receiptNumber, token, t]);

  const getPaymentMethodLabel = (method?: string): string => {
    if (!method) return '-';
    const methodMap: Record<string, keyof typeof t> = {
      cash: 'cash',
      check: 'check',
      mobile_money: 'mobile_money',
      card: 'card',
      bank_transfer: 'bank_transfer',
    };
    const key = methodMap[method];
    return key ? (t[key] as string) : method;
  };

  const formatAmount = (amount?: number, currency?: string): string => {
    if (!amount) return '-';
    return `${amount.toLocaleString()} ${currency || 'XAF'}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-lg font-medium text-gray-700">{t.verifying}</p>
              <p className="text-sm text-gray-500 font-mono">{receiptNumber}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-700">{t.error}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">{error}</p>
            <p className="mt-4 font-mono text-sm text-gray-400">{receiptNumber}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className={`min-h-screen py-8 px-4 ${result.valid ? 'bg-gradient-to-b from-green-50 to-white' : 'bg-gradient-to-b from-orange-50 to-white'}`}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
        </div>

        {/* Status Card */}
        <Card className={`mb-6 ${result.valid ? 'border-green-200' : 'border-orange-200'}`}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              {result.valid ? (
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-orange-600" />
                </div>
              )}
              <Badge
                variant={result.valid ? 'default' : 'destructive'}
                className={`text-lg px-4 py-2 ${result.valid ? 'bg-green-600' : 'bg-orange-600'}`}
              >
                {result.valid ? t.valid_receipt : t.invalid_receipt}
              </Badge>
              <p className="text-sm text-gray-500">{result.message}</p>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Details (only if valid) */}
        {result.valid && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                {t.receipt_number}: {result.receipt_number}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t.payment_date}</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {result.payment_date || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t.amount}</p>
                  <p className="font-bold text-lg text-green-700">
                    {formatAmount(result.amount, result.currency)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Payment Method & Payer */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t.payment_method}</p>
                  <p className="font-medium flex items-center gap-1">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    {getPaymentMethodLabel(result.payment_method)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t.payer}</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="h-4 w-4 text-gray-400" />
                    {result.payer_name || '-'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Service Info */}
              <div className="space-y-3">
                {result.workflow_code && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">{t.workflow_code}</p>
                    <p className="font-mono font-medium">{result.workflow_code}</p>
                  </div>
                )}
                {result.entity_code && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">{t.entity}</p>
                    <p className="font-medium flex items-center gap-1">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      {result.entity_code}
                    </p>
                  </div>
                )}
                {result.solicitud_type && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">{t.request_type}</p>
                    <p className="font-medium">{result.solicitud_type}</p>
                  </div>
                )}
                {result.service_request_reference && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">{t.request_reference}</p>
                    <p className="font-mono text-sm">{result.service_request_reference}</p>
                  </div>
                )}
              </div>

              {/* Validation Info */}
              {result.validated_by && (
                <>
                  <Separator />
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">{t.validated_by}</p>
                        <p className="font-medium text-sm">{result.validated_by}</p>
                      </div>
                      {result.validated_at && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase">{t.validation_date}</p>
                          <p className="font-medium text-sm">{result.validated_at}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Official Notice */}
        <p className="mt-6 text-xs text-center text-gray-400 px-4">
          {t.official_notice}
        </p>
      </div>
    </div>
  );
}
