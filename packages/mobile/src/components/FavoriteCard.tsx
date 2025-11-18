/**
 * TaxasGE Mobile - Favorite Card Component
 * Displays a favorite service with actions
 * Date: 2025-10-22
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Icon } from './Icon';

export interface FavoriteService {
  id: number;
  fiscal_service_code: string;
  notes?: string;
  tags?: string;
  created_at: string;
  // From join with fiscal_services
  name_es?: string;
  name_fr?: string;
  name_en?: string;
  service_type?: string;
  tasa_expedicion?: number;
  ministry_name?: string;
}

export interface FavoriteCardProps {
  favorite: FavoriteService;
  language: 'es' | 'fr' | 'en';
  onPress?: () => void;
  onCalculate?: () => void;
  onRemove?: () => void;
}

const TEXTS = {
  es: {
    calculate: 'Calcular',
    remove: 'Quitar',
    expedition: 'Expedición',
    noName: 'Servicio sin nombre',
  },
  fr: {
    calculate: 'Calculer',
    remove: 'Retirer',
    expedition: 'Expédition',
    noName: 'Service sans nom',
  },
  en: {
    calculate: 'Calculate',
    remove: 'Remove',
    expedition: 'Expedition',
    noName: 'Unnamed service',
  },
};

/**
 * Get service name based on language
 */
const getServiceName = (
  favorite: FavoriteService,
  language: 'es' | 'fr' | 'en'
): string => {
  const nameKey = `name_${language}` as keyof FavoriteService;
  const name = favorite[nameKey];

  if (typeof name === 'string' && name.trim() !== '') {
    return name;
  }

  // Fallback to other languages
  if (favorite.name_es) return favorite.name_es;
  if (favorite.name_fr) return favorite.name_fr;
  if (favorite.name_en) return favorite.name_en;

  return TEXTS[language].noName;
};

/**
 * Format currency amount
 */
const formatCurrency = (amount: number | undefined): string => {
  if (typeof amount !== 'number') return '-';
  return `${amount.toLocaleString('fr-FR')} XAF`;
};

/**
 * Parse tags from JSON string
 */
const parseTags = (tagsJson: string | undefined): string[] => {
  if (!tagsJson) return [];
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const FavoriteCard: React.FC<FavoriteCardProps> = ({
  favorite,
  language,
  onPress,
  onCalculate,
  onRemove,
}) => {
  const texts = TEXTS[language];
  const serviceName = getServiceName(favorite, language);
  const tags = parseTags(favorite.tags);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.serviceCode}>{String(favorite.fiscal_service_code)}</Text>
          <Text style={styles.serviceName} numberOfLines={2}>
            {String(serviceName)}
          </Text>
          {favorite.ministry_name && (
            <Text style={styles.ministry} numberOfLines={1}>
              {String(favorite.ministry_name)}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <Icon name="star-filled" size={24} color="#FFD700" />
        </View>
      </View>

      <View style={styles.cardBody}>
        {typeof favorite.tasa_expedicion === 'number' && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>{String(texts.expedition)}:</Text>
            <Text style={styles.priceValue}>
              {formatCurrency(favorite.tasa_expedicion)}
            </Text>
          </View>
        )}

        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{String(tag)}</Text>
              </View>
            ))}
          </View>
        )}

        {favorite.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {String(favorite.notes)}
          </Text>
        )}
      </View>

      <View style={styles.cardActions}>
        {onCalculate && (
          <TouchableOpacity
            style={[styles.actionButton, styles.calculateButton]}
            onPress={(e) => {
              e.stopPropagation();
              onCalculate();
            }}>
            <Text style={styles.actionButtonText}>{String(texts.calculate)}</Text>
          </TouchableOpacity>
        )}
        {onRemove && (
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={(e) => {
              e.stopPropagation();
              onRemove();
            }}>
            <Text style={styles.removeButtonText}>{String(texts.remove)}</Text>
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
    borderColor: '#FFD700',
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
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ministry: {
    fontSize: 12,
    color: '#666666',
  },
  favoriteIcon: {
    fontSize: 24,
  },
  cardBody: {
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00AA00',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  notes: {
    fontSize: 13,
    color: '#666666',
    fontStyle: 'italic',
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
  calculateButton: {
    backgroundColor: '#007AFF',
  },
  removeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
