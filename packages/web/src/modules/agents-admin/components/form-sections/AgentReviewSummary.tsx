'use client';

import { UseFormReturn } from 'react-hook-form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface AgentReviewSummaryProps {
  form: UseFormReturn<any>;
  entityName?: string;
  roleName?: string;
  validationErrors?: ValidationIssue[];
  validationWarnings?: ValidationIssue[];
  /** Force accordion open (when validation results arrive) */
  forceOpen?: boolean;
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5 text-sm border-b last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export function AgentReviewSummary({
  form,
  entityName,
  roleName,
  validationErrors = [],
  validationWarnings = [],
  forceOpen = false,
}: AgentReviewSummaryProps) {
  const values = form.getValues();
  const hasIssues = validationErrors.length > 0 || validationWarnings.length > 0;

  const defaultValue = forceOpen || hasIssues ? 'review' : undefined;

  return (
    <Accordion type="single" collapsible defaultValue={defaultValue}>
      <AccordionItem value="review" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            {validationErrors.length > 0 ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : validationWarnings.length > 0 ? (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            )}
            <span>Résumé de vérification</span>
            {hasIssues && (
              <>
                {validationErrors.length > 0 && (
                  <Badge variant="destructive">{validationErrors.length} erreur(s)</Badge>
                )}
                {validationWarnings.length > 0 && (
                  <Badge variant="outline" className="border-orange-300 text-orange-700">
                    {validationWarnings.length} avertissement(s)
                  </Badge>
                )}
              </>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-2">
            {/* Validation issues */}
            {validationErrors.length > 0 && (
              <div className="space-y-1">
                {validationErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span><strong>{err.field}</strong>: {err.message}</span>
                  </div>
                ))}
              </div>
            )}
            {validationWarnings.length > 0 && (
              <div className="space-y-1">
                {validationWarnings.map((warn, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-orange-700">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span><strong>{warn.field}</strong>: {warn.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Summary fields */}
            <div className="divide-y">
              <SummaryRow label="Email" value={values.email} />
              <SummaryRow
                label="Nom complet"
                value={values.first_name && values.last_name ? `${values.first_name} ${values.last_name}` : undefined}
              />
              <SummaryRow label="Téléphone" value={values.phone_number} />
              <SummaryRow label="Langue" value={values.preferred_language?.toUpperCase()} />
              <SummaryRow label="Entité" value={entityName} />
              <SummaryRow label="Rôle RBAC" value={roleName} />
              <SummaryRow
                label="Superviseur"
                value={values.is_supervisor ? 'Oui' : 'Non'}
              />
              {values.is_supervisor && (
                <>
                  <SummaryRow
                    label="Peut assigner"
                    value={values.can_assign_tasks ? 'Oui' : 'Non'}
                  />
                  <SummaryRow
                    label="Peut réassigner"
                    value={values.can_reassign ? 'Oui' : 'Non'}
                  />
                </>
              )}
              {values.can_approve_unlimited !== undefined && (
                <SummaryRow
                  label="Approbation"
                  value={
                    values.can_approve_unlimited
                      ? 'Illimitée'
                      : values.max_approval_amount
                        ? `Max ${Number(values.max_approval_amount).toLocaleString()} XAF`
                        : 'Non configuré'
                  }
                />
              )}
              <SummaryRow
                label="Horaires"
                value={`${values.working_hours_start || '08:00'} — ${values.working_hours_end || '17:00'}`}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
