import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Pressable, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { PaymentMethod } from '../../types/salesManagement';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { getImageUrl } from '../../config/api.config';

interface PaymentMethodModalProps {
  isVisible: boolean;
  paymentMethod: PaymentMethod | null;
  onSave: (name: string, logoFile?: any, id?: string) => void;
  onClose: () => void;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isVisible, paymentMethod, onSave, onClose }) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  const [name, setName] = useState('');
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      setName(paymentMethod?.name || '');
      setSelectedImage(null);
      setPreviewUrl(paymentMethod?.logo ? getImageUrl(paymentMethod.logo) || null : null);
    }
  }, [isVisible, paymentMethod]);

  const handleChoosePhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.assets && response.assets.length > 0) {
        setSelectedImage(response.assets[0]);
        setPreviewUrl(response.assets[0].uri || null);
      }
    });
  };

  const handleSave = () => {
    if (!name) return;
    onSave(name, selectedImage, paymentMethod?.id);
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{paymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}</Text>

            <View style={styles.imageSection}>
              <Text style={[styles.label, { color: COLORS.textSecondary }]}>Logo</Text>
              <View style={styles.imagePickerContainer}>
                {previewUrl ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: previewUrl }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => { setSelectedImage(null); setPreviewUrl(null); }}>
                      <Icon name="close-circle" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={[styles.uploadBtn, { borderColor: COLORS.primary }]} onPress={handleChoosePhoto}>
                    <Icon name="camera-plus" size={32} color={COLORS.primary} />
                    <Text style={[styles.uploadText, { color: COLORS.primary }]}>Upload Logo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: COLORS.textSecondary }]}>Method Name</Text>
              <TextInput
                style={[styles.input, { color: COLORS.textPrimary, backgroundColor: COLORS.background }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Voucher, Crypto"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardAvoidingView: {
    width: '100%',
    maxWidth: 600,
    flex: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 32,
    paddingTop: 12, // Reduced for handle
    paddingHorizontal: 24,
    paddingBottom: 0,
    width: '100%',
    maxHeight: '85%',
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 24,
    overflow: 'hidden',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  imageSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  imagePickerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  uploadBtn: {
    width: 140,
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  previewContainer: {
    position: 'relative',
  },
  previewImage: {
    width: 140,
    height: 140,
    borderRadius: 16,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default PaymentMethodModal;
