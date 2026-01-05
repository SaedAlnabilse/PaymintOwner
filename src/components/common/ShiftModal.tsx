import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import ATMInput from './ATMInput';

interface ShiftModalProps {
  visible: boolean;
  mode: 'start' | 'end';
  onClose: () => void;
  onConfirm: (amount: number, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

const ShiftModal: React.FC<ShiftModalProps> = ({
  visible,
  mode,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // Reset fields when modal opens
  useEffect(() => {
    if (visible) {
      setAmount(0);
      setNotes('');
    }
  }, [visible]);

  const handleConfirm = async () => {
    await onConfirm(amount, notes);
  };

  const isStart = mode === 'start';
  const title = isStart ? 'Open Register' : 'Close Register';
  const label = isStart ? 'Opening Float Amount' : 'Closing Cash Amount';
  const buttonText = isStart ? 'Open Shift' : 'Close Shift';
  const buttonColor = isStart ? COLORS.success : COLORS.error;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} disabled={isLoading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <ATMInput
              label={label}
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
            />

            {!isStart && (
              <>
                <Text style={styles.noteLabel}>Notes (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any discrepancies or comments..."
                  placeholderTextColor={COLORS.textTertiary}
                  multiline
                  numberOfLines={3}
                  editable={!isLoading}
                />
              </>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: buttonColor }]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>{buttonText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cancelText: {
    color: colors.textSecondary,
  },
  body: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.textSecondary,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.textSecondary,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: colors.background,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
    color: colors.textPrimary,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    height: '100%',
    color: colors.textPrimary,
  },
  textArea: {
    borderRadius: 12,
    padding: 12,
    height: 100,
    borderWidth: 1,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderColor: colors.borderLight,
  },
  footer: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ShiftModal;
