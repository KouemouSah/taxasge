import { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Alert,
  Animated,
  PanResponder,
  type ListRenderItemInfo,
} from 'react-native';
import {
  Text,
  IconButton,
  ActivityIndicator,
  Divider,
  TouchableRipple,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { useAppTheme } from '@core/theme';
import type { WizardRequiredDocument, DocumentPreview } from '../types/wizard.types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StepUploadProps {
  requiredDocuments: WizardRequiredDocument[];
  uploadingDocuments: Set<string>;
  onUploadDocument: (
    documentCode: string,
    fileUri: string,
    fileName: string,
  ) => Promise<DocumentPreview>;
  onDeleteDocument: (documentCode: string) => Promise<void>;
  onDocumentPreview: (preview: DocumentPreview) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMPRESS_WIDTH = 1500;
const COMPRESS_QUALITY = 0.7;
const SWIPE_THRESHOLD = -80;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepUpload({
  requiredDocuments,
  uploadingDocuments,
  onUploadDocument,
  onDeleteDocument,
  onDocumentPreview,
}: StepUploadProps) {
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();
  const [deletingDocs, setDeletingDocs] = useState<Set<string>>(new Set());

  // ── Image compression ────────────────────────────────────────────────

  const compressImage = useCallback(async (uri: string): Promise<string> => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: COMPRESS_WIDTH } }],
      { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
    );
    return result.uri;
  }, []);

  // ── Image picking ────────────────────────────────────────────────────

  const pickFromCamera = useCallback(async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t('wizard.upload.permissionRequired'),
        t('wizard.upload.cameraPermissionMessage'),
      );
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return null;
    return result.assets[0];
  }, [t]);

  const pickFromGallery = useCallback(async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t('wizard.upload.permissionRequired'),
        t('wizard.upload.galleryPermissionMessage'),
      );
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return null;
    return result.assets[0];
  }, [t]);

  // ── Upload handler ───────────────────────────────────────────────────

  const handlePickDocument = useCallback(
    (doc: WizardRequiredDocument) => {
      Alert.alert(t('wizard.upload.selectSource'), undefined, [
        {
          text: t('wizard.upload.camera'),
          onPress: async () => {
            const asset = await pickFromCamera();
            if (!asset) return;
            const compressedUri = await compressImage(asset.uri);
            const fileName = asset.fileName ?? `${doc.code}_${Date.now()}.jpg`;
            try {
              const preview = await onUploadDocument(doc.code, compressedUri, fileName);
              onDocumentPreview(preview);
            } catch {
              Alert.alert(t('wizard.upload.error'), t('wizard.upload.uploadFailed'));
            }
          },
        },
        {
          text: t('wizard.upload.gallery'),
          onPress: async () => {
            const asset = await pickFromGallery();
            if (!asset) return;
            const compressedUri = await compressImage(asset.uri);
            const fileName = asset.fileName ?? `${doc.code}_${Date.now()}.jpg`;
            try {
              const preview = await onUploadDocument(doc.code, compressedUri, fileName);
              onDocumentPreview(preview);
            } catch {
              Alert.alert(t('wizard.upload.error'), t('wizard.upload.uploadFailed'));
            }
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    },
    [pickFromCamera, pickFromGallery, compressImage, onUploadDocument, onDocumentPreview, t],
  );

  // ── Delete handler ───────────────────────────────────────────────────

  const handleDelete = useCallback(
    async (docCode: string) => {
      Alert.alert(t('wizard.upload.deleteTitle'), t('wizard.upload.deleteMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setDeletingDocs((prev) => new Set(prev).add(docCode));
            try {
              await onDeleteDocument(docCode);
            } catch {
              Alert.alert(t('wizard.upload.error'), t('wizard.upload.deleteFailed'));
            } finally {
              setDeletingDocs((prev) => {
                const next = new Set(prev);
                next.delete(docCode);
                return next;
              });
            }
          },
        },
      ]);
    },
    [onDeleteDocument, t],
  );

  // ── Row component with swipe-to-delete ───────────────────────────────

  const DocumentRow = useCallback(
    ({ item }: { item: WizardRequiredDocument }) => {
      const isUploading = uploadingDocuments.has(item.code);
      const isDeleting = deletingDocs.has(item.code);
      const translateX = useRef(new Animated.Value(0)).current;

      const panResponder = useRef(
        PanResponder.create({
          onMoveShouldSetPanResponder: (_, gesture) =>
            item.uploaded && Math.abs(gesture.dx) > 10 && Math.abs(gesture.dy) < 10,
          onPanResponderMove: (_, gesture) => {
            if (gesture.dx < 0) {
              translateX.setValue(gesture.dx);
            }
          },
          onPanResponderRelease: (_, gesture) => {
            if (gesture.dx < SWIPE_THRESHOLD && item.uploaded) {
              Animated.spring(translateX, {
                toValue: SWIPE_THRESHOLD,
                useNativeDriver: true,
              }).start();
            } else {
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
              }).start();
            }
          },
        }),
      ).current;

      const resetSwipe = useCallback(() => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }, [translateX]);

      return (
        <View style={styles.rowWrapper}>
          {/* Delete action behind the row */}
          {item.uploaded && (
            <View style={[styles.deleteAction, { backgroundColor: colors.error }]}>
              <IconButton
                icon="delete-outline"
                iconColor={colors.onError}
                size={20}
                onPress={() => {
                  resetSwipe();
                  handleDelete(item.code);
                }}
              />
            </View>
          )}

          <Animated.View
            style={[styles.rowContainer, { transform: [{ translateX }] }]}
            {...panResponder.panHandlers}
          >
            <TouchableRipple
              onPress={() => !isUploading && !isDeleting && handlePickDocument(item)}
              style={[
                styles.row,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.outlineVariant,
                },
              ]}
              disabled={isUploading || isDeleting}
            >
              <View style={styles.rowInner}>
                {/* Icon */}
                <MaterialCommunityIcons
                  name={item.uploaded ? 'file-check-outline' : 'file-upload-outline'}
                  size={22}
                  color={item.uploaded ? colors.success : colors.outline}
                  style={{ marginRight: spacing.sm }}
                />

                {/* Name + status */}
                <View style={styles.textContainer}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: colors.onSurface }}
                    numberOfLines={1}
                  >
                    {item.name_es}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{
                      color: item.uploaded ? colors.success : colors.outline,
                      marginTop: 2,
                    }}
                  >
                    {item.uploaded
                      ? t('wizard.upload.uploaded')
                      : t('wizard.upload.pending')}
                  </Text>
                </View>

                {/* Required badge */}
                {item.is_required && !item.uploaded && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.errorContainer, borderRadius: borderRadius.sm },
                    ]}
                  >
                    <Text variant="labelSmall" style={{ color: colors.error, fontWeight: '600' }}>
                      {t('wizard.upload.required')}
                    </Text>
                  </View>
                )}

                {/* Loading / check indicator */}
                {isUploading || isDeleting ? (
                  <ActivityIndicator
                    size={18}
                    color={colors.primary}
                    style={{ marginLeft: spacing.sm }}
                  />
                ) : item.uploaded ? (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={colors.success}
                    style={{ marginLeft: spacing.sm }}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.outline}
                    style={{ marginLeft: spacing.sm }}
                  />
                )}
              </View>
            </TouchableRipple>
          </Animated.View>
        </View>
      );
    },
    [
      uploadingDocuments,
      deletingDocs,
      colors,
      spacing,
      borderRadius,
      t,
      handlePickDocument,
      handleDelete,
    ],
  );

  // ── Render ───────────────────────────────────────────────────────────

  const uploadedCount = requiredDocuments.filter((d) => d.uploaded).length;
  const requiredCount = requiredDocuments.filter((d) => d.is_required).length;

  return (
    <View style={styles.container}>
      {/* Header summary */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '600' }}>
          {t('wizard.upload.title')}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.outline }}>
          {t('wizard.upload.progress', {
            uploaded: uploadedCount,
            total: requiredDocuments.length,
            required: requiredCount,
          })}
        </Text>
      </View>

      <Divider />

      {/* Document list */}
      <FlatList
        data={requiredDocuments}
        keyExtractor={(item) => item.code}
        renderItem={(info: ListRenderItemInfo<WizardRequiredDocument>) => (
          <DocumentRow item={info.item} />
        )}
        ItemSeparatorComponent={() => <Divider style={{ marginLeft: 46 }} />}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { gap: 2 },
  rowWrapper: { position: 'relative', overflow: 'hidden' },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContainer: { backgroundColor: 'transparent' },
  row: { borderBottomWidth: 0 },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textContainer: { flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, marginRight: 4 },
});
