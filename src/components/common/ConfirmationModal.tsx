import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';

interface ConfirmationModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  confirmColor?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isVisible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  confirmColor,
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  
  const buttonColor = confirmColor || COLORS.primary;
  const finalConfirmText = confirmText || 'Delete';

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onCancel}
      statusBarTranslucent={true}
    >
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={[styles.modalView, { backgroundColor: COLORS.white }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalContent}>
            <View style={[styles.iconContainer, { backgroundColor: `${COLORS.primary}20` }]}>
              <Icon
                name="alert-circle-outline"
                size={55}
                color={COLORS.primary}
              />
            </View>
            <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>{title}</Text>
            <Text style={[styles.modalMessage, { color: COLORS.textSecondary }]}>{message}</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: COLORS.border }]}
                onPress={onCancel}
              >
                <Text style={[styles.cancelButtonText, { color: COLORS.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: buttonColor }]}
                onPress={onConfirm}
              >
                <Text style={[styles.confirmButtonText, { color: COLORS.white }]}>{finalConfirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    borderRadius: 16,
    width: '88%',
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 35,
    alignItems: 'center',
  },
  iconContainer: {
    borderRadius: 50,
    padding: 15,
    marginBottom: 20,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalMessage: {
    marginBottom: 30,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 10,
    fontWeight: '400',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 20,
  },
  cancelButton: {
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 45,
    minWidth: 140,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  confirmButton: {
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 45,
    minWidth: 140,
    flex: 1,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontWeight: '600',
    fontSize: 17,
    letterSpacing: 0.3,
  },
});

export default ConfirmationModal;
