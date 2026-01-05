import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ConfirmationModal from '../common/ConfirmationModal';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { PaymentMethod } from '../../types/salesManagement';
import { getImageUrl } from '../../config/api.config';

interface PaymentMethodGroupProps {
  paymentMethods: PaymentMethod[];
  onAdd: () => void;
  onEdit: (method: PaymentMethod) => void;
  onDelete: (id: string) => void;
}

const PaymentMethodGroup: React.FC<PaymentMethodGroupProps> = ({
  paymentMethods,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleDeletePress = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete);
    }
    setIsDeleteModalVisible(false);
    setItemToDelete(null);
  };

  const styles = createStyles(COLORS);

  return (
    <View style={styles.group}>
      <TouchableOpacity
        style={[styles.header, isOpen ? styles.headerOpen : styles.headerClosed]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={styles.headerLeft}>
          <Icon name="credit-card-outline" size={20} color={COLORS.primary} style={{marginRight: 10}} />
          <Text style={[styles.groupTitle, { color: COLORS.textPrimary }]}>Other Payment Methods</Text>
        </View>
        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.listContainer}>
          {paymentMethods.map((method, index) => (
            <View
              key={`pm-${method.id}-${index}`}
              style={[styles.item, index === paymentMethods.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: COLORS.background }]}>
                  {method.logo ? (
                    <Image source={{ uri: getImageUrl(method.logo) }} style={styles.methodLogo} resizeMode="contain" />
                  ) : (
                    <Icon name="cash-multiple" size={20} color={COLORS.textSecondary} />
                  )}
                </View>
                <Text style={[styles.name, { color: COLORS.textPrimary }]}>{method.name}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => onEdit(method)}
                  style={[styles.actionBtn, { backgroundColor: COLORS.primary + '15' }]}
                >
                  <Icon name="pencil" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeletePress(method.id)}
                  style={[styles.actionBtn, { backgroundColor: COLORS.errorBg }]}
                >
                  <Icon name="delete" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={onAdd}>
            <Icon name="plus-circle" size={20} color={COLORS.primary} />
            <Text style={[styles.addButtonText, { color: COLORS.primary }]}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmationModal
        isVisible={isDeleteModalVisible}
        title="Remove Payment Method"
        message="Are you sure you want to remove this payment method?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
      />
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  group: { marginBottom: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerClosed: { borderRadius: 12 },
  headerOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  groupTitle: { fontSize: 16, fontWeight: '700' },
  listContainer: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.borderLight,
    paddingHorizontal: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  methodLogo: { width: 28, height: 28 },
  name: { fontSize: 15, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 8 },
  addButtonText: { fontSize: 15, fontWeight: '700' },
});

export default PaymentMethodGroup;
