'use client';

/**
 * Card component for a single extracted identifier
 * Shows type, value, document source, confidence, expiration, and action buttons
 */

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VerificationStatusBadge } from './VerificationStatusBadge';
import { cn } from '@/lib/utils';
import type { ExtractedIdentifier } from '../types';
import {
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  Percent,
} from 'lucide-react';

interface IdentifierCardProps {
  identifier: ExtractedIdentifier;
  onVerify?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
  className?: string;
}

const identifierTypeLabels: Record<string, string> = {
  dni: 'DNI',
  pasaporte: 'Pasaporte',
  permiso_residencia: 'Permiso de Residencia',
  certificado_conducir: 'Certificado de Conducir',
  matricula_vehiculo: 'Matrícula de Vehículo',
  nif: 'NIF',
  contrato_ornc: 'Contrato ORNC',
  registro_civil: 'Registro Civil',
  cuve: 'CUVE',
  permiso_circulacion: 'Permiso de Circulación',
  matricula_funcionario: 'Matrícula de Funcionario',
  numero_nombramiento: 'Número de Nombramiento',
  carnet_funcionario: 'Carnet de Funcionario',
};

export function IdentifierCard({
  identifier,
  onVerify,
  onReject,
  isLoading = false,
  className,
}: IdentifierCardProps) {
  const isPending = identifier.status === 'pending';
  const isVerified =
    identifier.status === 'verified' ||
    identifier.status === 'verified_manually';
  const isRejected =
    identifier.status === 'rejected' || identifier.status === 'fraud';

  return (
    <Card
      className={cn(
        'transition-all',
        isPending && 'border-yellow-300 bg-yellow-50/50 dark:bg-yellow-900/10',
        isVerified && 'border-green-300 bg-green-50/50 dark:bg-green-900/10',
        isRejected && 'border-red-300 bg-red-50/50 dark:bg-red-900/10',
        className
      )}
    >
      <CardContent className="pt-4 pb-2">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {identifierTypeLabels[identifier.identifierType] ||
                identifier.identifierType}
            </p>
            <p className="text-xl font-mono font-semibold tracking-wider">
              {identifier.value}
            </p>
          </div>
          <VerificationStatusBadge status={identifier.status} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="truncate">{identifier.documentName}</span>
          </div>

          {identifier.confidence !== null && (
            <div className="flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5" />
              <span>{Math.round(identifier.confidence * 100)}% confianza</span>
            </div>
          )}

          {identifier.expiresAt && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Expira:{' '}
                {new Date(identifier.expiresAt).toLocaleDateString('es-ES')}
              </span>
            </div>
          )}

          {identifier.verifiedAt && (
            <div className="flex items-center gap-1.5 col-span-2 text-green-600">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>
                Verificado:{' '}
                {new Date(identifier.verifiedAt).toLocaleDateString('es-ES')}
                {identifier.source && ` (${identifier.source})`}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      {isPending && (onVerify || onReject) && (
        <CardFooter className="pt-2 pb-4 gap-2">
          {onVerify && (
            <Button
              size="sm"
              onClick={onVerify}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Validar
            </Button>
          )}
          {onReject && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onReject}
              disabled={isLoading}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Rechazar
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
