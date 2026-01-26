/**
 * ExtractedDataSection - Display extracted form data
 *
 * @module agent-dashboard/components/pending/sections
 * @date 2026-01-26
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, FileText } from 'lucide-react';
import type { RequestPreviewExtractedData } from '../../../services/agent-requests-api';

// =============================================================================
// PROPS
// =============================================================================

interface ExtractedDataSectionProps {
  data: RequestPreviewExtractedData;
  isMinor: boolean;
  solicitudType: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ExtractedDataSection({
  data,
  isMinor,
  solicitudType,
}: ExtractedDataSectionProps) {
  const t = useTranslations('agent.pending.extractedFields');

  // Format date for display
  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Render a data field
  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || '-'}</p>
    </div>
  );

  // Check if renovation
  const isRenovacion = solicitudType?.toLowerCase() === 'renovacion';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Personal Data */}
        {isMinor ? (
          // Minor data from certificado_nacimiento
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label={t('nombres')} value={data.certNombre} />
            <Field
              label={t('apellidos')}
              value={[data.certPrimerApellido, data.certSegundoApellido].filter(Boolean).join(' ')}
            />
            <Field label={t('fechaNacimiento')} value={formatDate(data.certFechaNacimiento)} />
            <Field label={t('sexo')} value={data.sexo} />
            <Field label={t('lugarNacimiento')} value={data.certLugarNacimiento} />
            <Field label={t('representante')} value={data.rep1Nombre} />
            <Field label={t('docRepresentante')} value={data.rep1DocumentoNumero} />
          </div>
        ) : (
          // Adult data from DIP
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label={t('apellidos')} value={data.apellidos} />
            <Field label={t('nombres')} value={data.nombres} />
            <Field label={t('fechaNacimiento')} value={formatDate(data.fechaNacimiento)} />
            <Field label={t('sexo')} value={data.sexo} />
            <Field label={t('lugarNacimiento')} value={data.lugarNacimiento} />
            <Field label={t('naturalDe')} value={data.naturalDe} />
            <Field label={t('numeroDip')} value={data.numeroDip} />
            <Field label={t('nacionalidad')} value={data.nacionalidad} />
            <Field label={t('estadoCivil')} value={data.estadoCivil} />
            <Field label={t('profesion')} value={data.profesion} />
            <Field label={t('domicilio')} value={data.domicilio} />
          </div>
        )}

        {/* Filiation */}
        {(data.nombrePadre || data.nombreMadre) && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2 font-medium">{t('filiation')}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <Field label={t('nombrePadre')} value={data.nombrePadre} />
              <Field label={t('nombreMadre')} value={data.nombreMadre} />
            </div>
          </div>
        )}

        {/* Old Passport Data (for renovation) */}
        {isRenovacion && data.numeroPasaporteAntiguo && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {t('pasaporteAntiguo')}
            </p>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2">
              <Field label={t('numeroPasaporte')} value={data.numeroPasaporteAntiguo} />
              <Field label={t('fechaExpedicion')} value={formatDate(data.fechaExpedicionAntiguo)} />
              <Field label={t('fechaExpiracion')} value={formatDate(data.fechaExpiracionAntiguo)} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ExtractedDataSection;
