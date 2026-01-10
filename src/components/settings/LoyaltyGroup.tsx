import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { LoyaltyConfig, LoyaltyReward } from '../../types/salesManagement';
import LoyaltyRewardModal from './LoyaltyRewardModal';
import ConfirmationModal from '../common/ConfirmationModal';

interface Category {
  id: string;
  name: string;
}

interface LoyaltyGroupProps {
  config: LoyaltyConfig;
  onChange: (newConfig: any) => void;
  currency: string;
  categories: Category[];
}

const LoyaltyGroup: React.FC<LoyaltyGroupProps> = ({ config, onChange, currency, categories }) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState<string | null>(null);

  // Helper to safely parse numbers
  const parseNumber = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, '');
    return parseFloat(clean) || 0;
  };

  const handleRewardSave = (reward: LoyaltyReward) => {
    let updatedRewards;
    if (editingReward) {
      updatedRewards = config.rewards.map(r => r.id === reward.id ? reward : r);
    } else {
      updatedRewards = [...(config.rewards || []), reward];
    }
    onChange({ ...config, enabled: true, rewards: updatedRewards });
    setShowRewardModal(false);
    setEditingReward(null);
  };

  const confirmDeleteReward = (id: string) => {
    setRewardToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteReward = () => {
    if (rewardToDelete) {
      const updatedRewards = config.rewards.filter(r => r.id !== rewardToDelete);
      onChange({ ...config, rewards: updatedRewards });
    }
    setShowDeleteConfirm(false);
    setRewardToDelete(null);
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'DISCOUNT': return 'percent';
      case 'FREE_ITEM': return 'gift';
      default: return 'star';
    }
  };

  const getRewardDescription = (reward: LoyaltyReward) => {
    switch (reward.type) {
      case 'DISCOUNT':
        return `${reward.discountPercentage}% OFF`;
      case 'FREE_ITEM':
        return reward.freeCategoryName ? `Free from ${reward.freeCategoryName}` : 'Free Item Reward';
      default:
        return '';
    }
  };

  return (
    <View style={styles.group}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="star-circle-outline" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
          <Text style={[styles.groupTitle, { color: COLORS.textPrimary }]}>Loyalty Program</Text>
        </View>
      </View>

      {/* Earning Rules */}
      <View style={[styles.section, { borderTopColor: COLORS.borderLight }]}>
        <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
          <Icon name="trending-up" size={16} color={COLORS.primary} /> Earning Rules
        </Text>
        <View style={[styles.earningRuleCard, { backgroundColor: COLORS.background, borderColor: COLORS.borderLight }]}>
          <View style={styles.earningRuleRow}>

            {/* Currency Per Point */}
            <View style={styles.ruleFieldBlock}>
              <Text style={[styles.ruleLabelText, { color: COLORS.textSecondary }]}>For every</Text>
              <View style={[styles.inputCard, { borderColor: COLORS.borderLight, backgroundColor: COLORS.white }]}>
                <View style={[styles.prefixBox, { borderRightColor: COLORS.borderLight, backgroundColor: COLORS.background }]}>
                  <Text style={[styles.currencyText, { color: COLORS.primary }]}>{currency}</Text>
                </View>
                <TextInput
                  style={[styles.input, { color: COLORS.textPrimary }]}
                  value={config.currencyPerPoint ? String(config.currencyPerPoint) : ''}
                  onChangeText={(val) => onChange({ ...config, enabled: true, currencyPerPoint: parseNumber(val) })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
            </View>

            {/* Points Per Currency */}
            <View style={styles.ruleFieldBlock}>
              <Text style={[styles.ruleLabelText, { color: COLORS.textSecondary }]}>Customer gets</Text>
              <View style={[styles.inputCard, { borderColor: COLORS.borderLight, backgroundColor: COLORS.white }]}>
                <View style={[styles.prefixBox, { borderRightColor: COLORS.borderLight, backgroundColor: COLORS.background }]}>
                  <Text style={[styles.prefixText, { color: COLORS.primary }]}>PTS</Text>
                </View>
                <TextInput
                  style={[styles.input, { color: COLORS.textPrimary }]}
                  value={config.pointsPerCurrency ? String(config.pointsPerCurrency) : ''}
                  onChangeText={(val) => onChange({ ...config, enabled: true, pointsPerCurrency: parseNumber(val) })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
            </View>



          </View>
        </View>
      </View>

      {/* Rewards Section */}
      <View style={[styles.section, { borderTopColor: COLORS.borderLight }]}>
        <View style={styles.rewardHeader}>
          <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
            <Icon name="gift" size={16} color={COLORS.primary} /> Rewards
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: COLORS.primary }]}
            onPress={() => {
              setEditingReward(null);
              setShowRewardModal(true);
            }}
          >
            <Icon name="plus" size={18} color="#FFF" />
            <Text style={styles.addButtonText}>Add Reward</Text>
          </TouchableOpacity>
        </View>

        {(!config.rewards || config.rewards.length === 0) ? (
          <View style={[styles.emptyState, { backgroundColor: COLORS.background }]}>
            <Icon name="gift-outline" size={32} color={COLORS.textTertiary} />
            <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>No Rewards Configured</Text>
            <Text style={[styles.emptySubtext, { color: COLORS.textTertiary }]}>Add rewards to encourage customer loyalty</Text>
          </View>
        ) : (
          <View style={styles.rewardsList}>
            {config.rewards.map((reward) => (
              <View key={reward.id} style={[styles.rewardCard, { backgroundColor: COLORS.background, borderColor: COLORS.borderLight }]}>
                <View style={[styles.rewardIcon, { backgroundColor: COLORS.primary + '15' }]}>
                  <Icon name={getRewardIcon(reward.type)} size={20} color={COLORS.primary} />
                </View>
                <View style={styles.rewardInfo}>
                  <Text style={[styles.rewardName, { color: COLORS.textPrimary }]}>{reward.name}</Text>
                  <Text style={[styles.rewardDetails, { color: COLORS.textSecondary }]}>
                    {getRewardDescription(reward)} • {reward.pointsRequired} pts
                  </Text>
                </View>
                <View style={styles.rewardActions}>
                  <TouchableOpacity style={styles.rewardActionBtn} onPress={() => { setEditingReward(reward); setShowRewardModal(true); }}>
                    <Icon name="pencil" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rewardActionBtn} onPress={() => confirmDeleteReward(reward.id)}>
                    <Icon name="delete" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <LoyaltyRewardModal
        isVisible={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        onSave={handleRewardSave}
        reward={editingReward}
        categories={categories}
      />

      <ConfirmationModal
        isVisible={showDeleteConfirm}
        title="Delete Reward"
        message="Are you sure you want to delete this reward?"
        confirmText="Delete"
        confirmColor={COLORS.error}
        onConfirm={handleDeleteReward}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  group: {
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  earningRuleCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  earningRuleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ruleFieldBlock: {
    flex: 1,
    minWidth: 100,
  },
  ruleLabelText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputCard: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    height: 44,
  },
  prefixBox: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  currencyText: { fontSize: 12, fontWeight: '700' },
  prefixText: { fontSize: 10, fontWeight: '700' },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 15,
    fontWeight: '700',
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  rewardsList: {
    gap: 10,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  rewardDetails: {
    fontSize: 12,
  },
  rewardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rewardActionBtn: {
    padding: 6,
  },
});

export default LoyaltyGroup;