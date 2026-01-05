import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ConfirmationModal from '../common/ConfirmationModal';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { CardType } from '../../types/salesManagement';
import { getImageUrl } from '../../config/api.config';

interface CardTypeGroupProps {
  cardTypes: CardType[];
  onAdd: () => void;
  onEdit: (type: CardType) => void;
  onDelete: (id: string) => void;
}

const CardTypeGroup: React.FC<CardTypeGroupProps> = ({
  cardTypes,
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
          <Icon name="credit-card-settings-outline" size={20} color={COLORS.primary} style={styles.headerIcon} />
          <Text style={[styles.groupTitle, { color: COLORS.textPrimary }]}>Card Types</Text>
        </View>
        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.listContainer}>
          {cardTypes.map((type, index) => (
            <View
              key={`ct-${type.id}-${index}`}
              style={[styles.item, index === cardTypes.length - 1 && styles.lastItem]}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: COLORS.background }]}>
                  {type.logo || type.imageUrl ? (
                    <Image source={{ uri: getImageUrl(type.logo || type.imageUrl) }} style={styles.cardLogo} resizeMode="contain" />
                  ) : (
                    <Icon name="credit-card" size={20} color={COLORS.textSecondary} />
                  )}
                </View>
                <Text style={[styles.name, { color: COLORS.textPrimary }]}>{type.name}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => onEdit(type)}
                  style={[styles.actionBtn, { backgroundColor: COLORS.primary + '15' }]}
                >
                  <Icon name="pencil" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeletePress(type.id)}
                  style={[styles.actionBtn, { backgroundColor: COLORS.errorBg }]}
                >
                  <Icon name="delete" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={onAdd}>
            <Icon name="plus-circle" size={20} color={COLORS.primary} />
            <Text style={[styles.addButtonText, { color: COLORS.primary }]}>Add Card Type</Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmationModal
        isVisible={isDeleteModalVisible}
        title="Remove Card Type"
        message="Are you sure you want to remove this card type?"
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
  headerIcon: { marginRight: 10 },
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
  cardLogo: { width: 28, height: 28 },
  lastItem: {
    borderBottomWidth: 0,
  },
  name: { fontSize: 15, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 8 },
  addButtonText: { fontSize: 15, fontWeight: '700' },
});

export default CardTypeGroup;
