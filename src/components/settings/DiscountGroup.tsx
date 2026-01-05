import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ConfirmationModal from '../common/ConfirmationModal';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { Discount } from '../../types/salesManagement';

interface DiscountGroupProps {
  discounts: Discount[];
  onAdd: () => void;
  onEdit: (discount: Discount) => void;
  onDelete: (id: string) => void;
}

const DiscountGroup: React.FC<DiscountGroupProps> = ({
  discounts,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<string | null>(null);

  const handleDeletePress = (id: string) => {
    setDiscountToDelete(id);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (discountToDelete) {
      onDelete(discountToDelete);
    }
    setIsDeleteModalVisible(false);
    setDiscountToDelete(null);
  };

  const styles = createStyles(COLORS);

  return (
    <View style={styles.group}>
      <TouchableOpacity
        style={[
          styles.header,
          isOpen ? styles.headerOpen : styles.headerClosed
        ]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={styles.headerLeft}>
          <Icon name="tag-multiple" size={20} color={COLORS.primary} style={styles.headerIcon} />
          <Text style={[styles.groupTitle, { color: COLORS.textPrimary }]}>Discounts</Text>
        </View>
        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={COLORS.textPrimary}
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.listContainer}>
          {discounts.map((discount, index) => (
            <View
              key={`discount-${discount.id}-${index}`}
              style={[styles.item, index === discounts.length - 1 && styles.lastItem]}
            >
              <View style={styles.discountInfo}>
                <Text style={[styles.name, { color: COLORS.textPrimary }]}>{discount.name}</Text>
                <View style={styles.discountDetails}>
                  <Text style={[styles.percentage, { color: COLORS.primary }]}>{Math.round(discount.percentage * 100)}% OFF</Text>
                  {discount.adminOnly && (
                    <View style={styles.adminBadge}>
                      <Icon name="shield-account" size={12} color={COLORS.textSecondary} />
                      <Text style={styles.adminBadgeText}>Manager Only</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => onEdit(discount)}
                  style={[styles.actionBtn, { backgroundColor: COLORS.primary + '15' }]}
                >
                  <Icon name="pencil" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeletePress(discount.id)}
                  style={[styles.actionBtn, { backgroundColor: COLORS.errorBg }]}
                >
                  <Icon name="delete" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={onAdd}>
            <Icon name="plus-circle" size={20} color={COLORS.primary} />
            <Text style={[styles.addButtonText, { color: COLORS.primary }]}>Add Discount</Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmationModal
        isVisible={isDeleteModalVisible}
        title="Remove Discount"
        message="Are you sure you want to remove this discount?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
      />
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  group: {
    marginBottom: 16,
  },
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: { marginRight: 10 },
  headerClosed: {
    borderRadius: 12,
  },
  headerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
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
  lastItem: {
    borderBottomWidth: 0,
  },
  discountInfo: { flex: 1 },
  discountDetails: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  percentage: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default DiscountGroup;
