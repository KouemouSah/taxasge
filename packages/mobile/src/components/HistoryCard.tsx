/**
 * TaxasGE Mobile - History Card Component
 * Displays a calculation history record with actions
 * Date: 2025-10-22
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { CalculationHistoryRecord } from '../database/services/CalculationHistoryService';

export interface HistoryCardProps {
  record: CalculationHistoryRecord;
  language: 'es' | 'fr' | 'en';
  onPress?: () => void;
  onRecalculate?: () => void;
  onDelete?: () => void;
}

const TEXTS = {
  es: {
    expedition: 'Expedición',
    renewal: 'Renovación',
    recalculate: 'Recalcular',
    delete: 'Eliminar',
    amount: 'Importe',
  },
  fr: {
    expedition: 'Expédition',
    renewal: 'Renouvellement',
    recalculate: 'Recalculer',
    delete: 'Supprimer',
    amount: 'Montant',
  },
  en: {
    expedition: 'Expedition',
    renewal: 'Renewal',
    recalculate: 'Recalculate',
    delete: 'Delete',
    amount: 'Amount',
  },
};

/**
 * Format date to locale string
 */
const formatDate = (dateString: string, language: 'es' | 'fr' | 'en'): string => {
  try {
    const date = new Date(dateString);
    const locale = language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
};

/**
 * Format currency amount
 */
const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('fr-FR')} XAF`;
};

export const HistoryCard: React.FC<HistoryCardProps> = ({
  record,
  language,
  onPress,
  onRecalculate,
  onDelete,
}) => {
  const texts = TEXTS[language];
  const calculationType = record.calculation_type === 'expedition'
    ? texts.expedition
    : texts.renewal;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.serviceCode}>{String(record.fiscal_service_code)}</Text>
          {record.service_name && (
            <Text style={styles.serviceName} numberOfLines={1}>
              {String(record.service_name)}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.calculationType}>{String(calculationType)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>{String(texts.amount)}:</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(record.calculated_amount)}
          </Text>
        </View>
        <Text style={styles.date}>
          {formatDate(record.created_at, language)}
        </Text>
      </View>

      <View style={styles.cardActions}>
        {onRecalculate && (
          <TouchableOpacity
            style={[styles.actionButton, styles.recalculateButton]}
            onPress={(e) => {
              e.stopPropagation();
              onRecalculate();
            }}>
            <Text style={styles.actionButtonText}>{String(texts.recalculate)}</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}>
            <Text style={styles.deleteButtonText}>{String(texts.delete)}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  serviceCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: '#666666',
    flexWrap: 'wrap',
  },
  calculationType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardBody: {
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00AA00',
  },
  date: {
    fontSize: 12,
    color: '#999999',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  recalculateButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
