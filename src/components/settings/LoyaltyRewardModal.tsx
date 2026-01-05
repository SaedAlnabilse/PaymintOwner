import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { LoyaltyReward } from '../../types/salesManagement';

interface Category {
  id: string;
  name: string;
}

interface LoyaltyRewardModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (reward: LoyaltyReward) => void;
  reward?: LoyaltyReward | null;
  categories: Category[];
}

const LoyaltyRewardModal = ({
  isVisible,
  onClose,
  onSave,
  reward,
  categories,
}: LoyaltyRewardModalProps) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const [rewardType, setRewardType] = useState<'DISCOUNT' | 'FREE_ITEM'>('DISCOUNT');
  const [pointsRequired, setPointsRequired] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [freeCategoryId, setFreeCategoryId] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (isVisible) {
      if (reward) {
        setRewardType(reward.type);
        setPointsRequired(String(reward.pointsRequired));
        setDiscountPercentage(reward.discountPercentage ? String(reward.discountPercentage) : '');
        setFreeCategoryId(reward.freeCategoryId || '');
      } else {
        setRewardType('DISCOUNT');
        setPointsRequired('');
        setDiscountPercentage('');
        setFreeCategoryId('');
      }
    }
  }, [isVisible, reward]);

  const handleSave = () => {
    const points = parseInt(pointsRequired) || 0;
    if (points <= 0) return;

    if (rewardType === 'DISCOUNT' && (!discountPercentage || parseFloat(discountPercentage) <= 0)) return;
    if (rewardType === 'FREE_ITEM' && !freeCategoryId) return;

    const autoName = rewardType === 'FREE_ITEM'
      ? 'Free Item'
      : `Discount ${discountPercentage}%`;

    const newReward: LoyaltyReward = {
      id: reward?.id || Date.now().toString(),
      name: autoName,
      type: rewardType,
      pointsRequired: points,
      discountPercentage: rewardType === 'DISCOUNT' ? parseFloat(discountPercentage) : undefined,
      freeCategoryId: rewardType === 'FREE_ITEM' ? freeCategoryId : undefined,
      freeCategoryName: rewardType === 'FREE_ITEM' ? categories.find(c => c.id === freeCategoryId)?.name : undefined,
    };
    onSave(newReward);
  };

  const selectedCategoryName = categories.find(c => c.id === freeCategoryId)?.name;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalBg}
      >
        <Pressable style={styles.overlay} onPress={onClose} />

        <View style={[styles.modalContainer, { backgroundColor: 'transparent' }]}>
          {/* Header Background */}
          <View style={[styles.headerBg, { backgroundColor: COLORS.primary }]}>
            <View style={styles.headerContent}>
              <View style={styles.iconBox}>
                <Icon name={reward ? 'pencil' : 'gift'} size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>
                  {reward ? 'Edit Reward' : 'Add Reward'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {rewardType === 'DISCOUNT' ? 'Configure discount details' : 'Select category for free item'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Card */}
          <View style={[styles.cardContent, { backgroundColor: COLORS.white }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

              {/* Reward Type Selector */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: COLORS.textSecondary }]}>Reward Type</Text>
                <View style={[styles.typeSelector, { backgroundColor: COLORS.background }]}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      rewardType === 'DISCOUNT' && [styles.selectedType, { backgroundColor: COLORS.white, shadowColor: COLORS.textPrimary }]
                    ]}
                    onPress={() => setRewardType('DISCOUNT')}
                  >
                    <Icon
                      name="percent"
                      size={16}
                      color={rewardType === 'DISCOUNT' ? COLORS.primary : COLORS.textSecondary}
                    />
                    <Text style={[
                      styles.typeText,
                      { color: rewardType === 'DISCOUNT' ? COLORS.textPrimary : COLORS.textSecondary }
                    ]}>Discount</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      rewardType === 'FREE_ITEM' && [styles.selectedType, { backgroundColor: COLORS.white, shadowColor: COLORS.textPrimary }]
                    ]}
                    onPress={() => setRewardType('FREE_ITEM')}
                  >
                    <Icon
                      name="gift"
                      size={16}
                      color={rewardType === 'FREE_ITEM' ? COLORS.primary : COLORS.textSecondary}
                    />
                    <Text style={[
                      styles.typeText,
                      { color: rewardType === 'FREE_ITEM' ? COLORS.textPrimary : COLORS.textSecondary }
                    ]}>Free Item</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dynamic Content */}
              {rewardType === 'DISCOUNT' ? (
                <View style={styles.fieldContainer}>
                  <Text style={[styles.fieldLabel, { color: COLORS.textSecondary }]}>Discount Percentage</Text>
                  <View style={[styles.inputCard, { borderColor: COLORS.borderLight, backgroundColor: COLORS.white }]}>
                    <View style={[styles.prefixBox, { borderRightColor: COLORS.borderLight, backgroundColor: COLORS.background }]}>
                      <Text style={[styles.prefixText, { color: COLORS.primary }]}>%</Text>
                    </View>
                    <TextInput
                      style={[styles.input, { color: COLORS.textPrimary }]}
                      value={discountPercentage}
                      onChangeText={setDiscountPercentage}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={COLORS.textTertiary}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.fieldContainer}>
                  <Text style={[styles.fieldLabel, { color: COLORS.textSecondary }]}>Select Category</Text>
                  <TouchableOpacity
                    style={[styles.categorySelector, { borderColor: COLORS.borderLight, backgroundColor: COLORS.background }]}
                    onPress={() => setShowCategoryPicker(true)}
                  >
                    <Text style={{ color: selectedCategoryName ? COLORS.textPrimary : COLORS.textTertiary }}>
                      {selectedCategoryName || 'Select a Category'}
                    </Text>
                    <Icon name="chevron-down" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Points Required */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: COLORS.textSecondary }]}>Points Required</Text>
                <View style={[styles.inputCard, { borderColor: COLORS.borderLight, backgroundColor: COLORS.white }]}>
                    <View style={[styles.prefixBox, { borderRightColor: COLORS.borderLight, backgroundColor: COLORS.background }]}>
                      <Text style={[styles.prefixText, { color: COLORS.primary }]}>PTS</Text>
                    </View>
                    <TextInput
                      style={[styles.input, { color: COLORS.textPrimary }]}
                      value={pointsRequired}
                      onChangeText={setPointsRequired}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={COLORS.textTertiary}
                    />
                </View>
                <Text style={[styles.helperText, { color: COLORS.textTertiary }]}>
                  Customer spends <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{pointsRequired || 0} points</Text> to get reward
                </Text>
              </View>

            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: COLORS.borderLight }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={[styles.cancelText, { color: COLORS.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primary + 'CC']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.saveGradient}
                >
                  <Icon name="check" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveText}>Save Reward</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Category Picker Modal */}
        <Modal
            visible={showCategoryPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCategoryPicker(false)}
        >
            <View style={[styles.modalBg, { justifyContent: 'flex-end' }]}>
                <Pressable style={styles.overlay} onPress={() => setShowCategoryPicker(false)} />
                <View style={[styles.pickerContainer, { backgroundColor: COLORS.white }]}>
                    <View style={[styles.pickerHeader, { borderBottomColor: COLORS.borderLight }]}>
                        <Text style={[styles.pickerTitle, { color: COLORS.textPrimary }]}>Select Category</Text>
                        <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                            <Icon name="close" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={categories}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.pickerItem, { borderBottomColor: COLORS.borderLight }]}
                                onPress={() => {
                                    setFreeCategoryId(item.id);
                                    setShowCategoryPicker(false);
                                }}
                            >
                                <Text style={[
                                    styles.pickerItemText, 
                                    { color: item.id === freeCategoryId ? COLORS.primary : COLORS.textPrimary, fontWeight: item.id === freeCategoryId ? '700' : '400' }
                                ]}>{item.name}</Text>
                                {item.id === freeCategoryId && <Icon name="check" size={20} color={COLORS.primary} />}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>

      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  modalBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    width: '95%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 28,
    overflow: 'hidden',
  },
  headerBg: {
    paddingTop: 32,
    paddingBottom: 45,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
  },
  cardContent: {
    marginTop: -25,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 4,
  },
  helperText: {
    marginTop: 8,
    marginLeft: 4,
    fontSize: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    height: 54,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
  },
  selectedType: {
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  typeText: {
    fontWeight: '700',
    fontSize: 14,
  },
  categorySelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
  },
  inputCard: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    height: 48,
  },
  prefixBox: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  prefixText: { fontSize: 16, fontWeight: '700' },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    gap: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.5,
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  // Picker Styles
  pickerContainer: {
      maxHeight: '60%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
  },
  pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
  },
  pickerTitle: {
      fontSize: 18,
      fontWeight: '700',
  },
  pickerItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
  },
  pickerItemText: {
      fontSize: 16,
  },
});

export default LoyaltyRewardModal;