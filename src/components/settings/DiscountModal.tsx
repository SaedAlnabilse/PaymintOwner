import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Pressable, Switch } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { Discount } from '../../types/salesManagement';
import ATMInput from '../common/ATMInput';

interface DiscountModalProps {
  isVisible: boolean;
  discount: Discount | null;
  onSave: (name: string, percentage: number, adminOnly: boolean, id?: string) => void;
  onClose: () => void;
}

const DiscountModal: React.FC<DiscountModalProps> = ({ isVisible, discount, onSave, onClose }) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [adminOnly, setAdminOnly] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setName(discount?.name || '');
      setPercentage(discount ? discount.percentage * 100 : 0);
      setAdminOnly(discount?.adminOnly || false);
    }
  }, [isVisible, discount]);

  const handleSave = () => {
    if (!name || percentage === 0) return;
    onSave(name, percentage / 100, adminOnly, discount?.id);
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.white }]}>
            <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>{discount ? 'Edit Discount' : 'Add Discount'}</Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: COLORS.textSecondary }]}>Name</Text>
              <TextInput style={[styles.input, { color: COLORS.textPrimary, backgroundColor: COLORS.background }]} value={name} onChangeText={setName} placeholder="e.g. Employee Discount" placeholderTextColor={COLORS.textTertiary} />
            </View>
            <ATMInput
              label="Percentage (%)"
              value={percentage}
              onChange={setPercentage}
              currency="%"
              placeholder="10.00"
            />

            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: COLORS.textSecondary, marginBottom: 0 }]}>Manager Only</Text>
              <Switch
                value={adminOnly}
                onValueChange={setAdminOnly}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}><Text style={{ color: COLORS.textSecondary }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: COLORS.primary }]}><Text style={{ color: '#fff' }}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const createStyles = (_colors: any) => StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  kav: { width: '100%', maxWidth: 400 },
  modalContent: { borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 10, padding: 14, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  cancelBtn: { padding: 12 },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 }
});

export default DiscountModal;
