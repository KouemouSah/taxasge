import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, RadioButton, Switch, Button, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@core/theme';

interface StepSelectionProps {
  workflowCode: string;
  onCreateSession: (solicitudType: string, motivo?: string, isMinor?: boolean) => void;
  isCreating: boolean;
}

const SOLICITUD_TYPES = ['expedicion', 'renovacion', 'duplicado'];
const MOTIVOS = ['VENCIMIENTO', 'PERDIDA', 'ROBO', 'DETERIORO'];

export function StepSelection({ workflowCode, onCreateSession, isCreating }: StepSelectionProps) {
  const { t } = useTranslation();
  const { colors, spacing } = useAppTheme();

  const [solicitudType, setSolicitudType] = useState('expedicion');
  const [motivo, setMotivo] = useState<string | undefined>(undefined);
  const [isMinor, setIsMinor] = useState(false);

  const showMotivo = solicitudType === 'renovacion' || solicitudType === 'duplicado';

  const handleContinue = useCallback(() => {
    onCreateSession(solicitudType, showMotivo ? motivo : undefined, isMinor || undefined);
  }, [onCreateSession, solicitudType, motivo, isMinor, showMotivo]);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.md }}>
      {/* Solicitud Type */}
      <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '600', marginBottom: 8 }}>
        {t('wizard.selection.type')}
      </Text>
      <RadioButton.Group onValueChange={setSolicitudType} value={solicitudType}>
        {SOLICITUD_TYPES.map((type) => (
          <RadioButton.Item
            key={type}
            label={t(`wizard.selection.${type}`)}
            value={type}
            style={styles.radioItem}
          />
        ))}
      </RadioButton.Group>

      {/* Motivo (if renovacion/duplicado) */}
      {showMotivo && (
        <>
          <Divider style={{ marginVertical: 12 }} />
          <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '600', marginBottom: 8 }}>
            {t('wizard.selection.motivo')}
          </Text>
          <RadioButton.Group onValueChange={setMotivo} value={motivo ?? ''}>
            {MOTIVOS.map((m) => (
              <RadioButton.Item
                key={m}
                label={t(`wizard.selection.motivo_${m.toLowerCase()}`)}
                value={m}
                style={styles.radioItem}
              />
            ))}
          </RadioButton.Group>
        </>
      )}

      {/* Is Minor — only for PASAPORTE workflow */}
      {workflowCode.toUpperCase().includes('PASAPORTE') && (
        <>
          <Divider style={{ marginVertical: 12 }} />
          <View style={styles.switchRow}>
            <Text variant="bodyMedium" style={{ color: colors.onSurface, flex: 1 }}>
              {t('wizard.selection.isMinor')}
            </Text>
            <Switch value={isMinor} onValueChange={setIsMinor} />
          </View>
        </>
      )}

      {/* Continue */}
      <Button
        mode="contained"
        onPress={handleContinue}
        loading={isCreating}
        disabled={isCreating || (showMotivo && !motivo)}
        style={{ marginTop: 24, borderRadius: 8 }}
        contentStyle={{ paddingVertical: 4 }}
      >
        {t('wizard.selection.continue')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  radioItem: { paddingVertical: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
});
