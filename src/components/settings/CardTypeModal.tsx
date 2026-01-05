import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Pressable, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { CardType } from '../../types/salesManagement';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { getImageUrl } from '../../config/api.config';

interface CardTypeModalProps {
  isVisible: boolean;
  cardType: CardType | null;
  onSave: (name: string, logoFile?: any, id?: string) => void;
  onClose: () => void;
}

const CardTypeModal: React.FC<CardTypeModalProps> = ({ isVisible, cardType, onSave, onClose }) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  const [name, setName] = useState('');
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      setName(cardType?.name || '');
      setSelectedImage(null);
      setPreviewUrl(getImageUrl(cardType?.logo || cardType?.imageUrl) || null);
    }
  }, [isVisible, cardType]);

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
    onSave(name, selectedImage, cardType?.id);
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.white }]}>
            <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>{cardType ? 'Edit Card Type' : 'Add Card Type'}</Text>
            
            <View style={styles.imageSection}>
              <Text style={[styles.label, { color: COLORS.textSecondary }]}>Card Logo/Icon</Text>
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
              <Text style={[styles.label, { color: COLORS.textSecondary }]}>Card Type Name</Text>
              <TextInput style={[styles.input, { color: COLORS.textPrimary, backgroundColor: COLORS.background }]} value={name} onChangeText={setName} placeholder="e.g. Visa, Mastercard" placeholderTextColor={COLORS.textTertiary} />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  kav: { width: '100%', maxWidth: 400 },
  modalContent: { borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  imageSection: { marginBottom: 20, alignItems: 'center' },
  imagePickerContainer: { width: '100%', alignItems: 'center', marginTop: 10 },
  uploadBtn: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  uploadText: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  previewContainer: { position: 'relative' },
  previewImage: { width: 120, height: 120, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: colors.white, borderRadius: 12 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, alignSelf: 'flex-start' },
  input: { borderRadius: 10, padding: 14, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  cancelBtn: { padding: 12 },
  cancelBtnText: { color: colors.textSecondary },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  saveBtnText: { color: '#fff' }
});

export default CardTypeModal;
