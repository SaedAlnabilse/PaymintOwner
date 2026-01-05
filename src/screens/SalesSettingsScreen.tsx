import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import { ScreenContainer } from '../components/ScreenContainer';
import { salesSettingsService } from '../services/salesSettings';
import { categoriesService, Category } from '../services/categoriesService';
import { Discount, PaymentMethod, CardType, LoyaltyConfig } from '../types/salesManagement';

import CurrencyGroup from '../components/settings/CurrencyGroup';
import TaxRateGroup from '../components/settings/TaxRateGroup';
import DiscountGroup from '../components/settings/DiscountGroup';
import PaymentMethodGroup from '../components/settings/PaymentMethodGroup';
import CardTypeGroup from '../components/settings/CardTypeGroup';
import LoyaltyGroup from '../components/settings/LoyaltyGroup';

import DiscountModal from '../components/settings/DiscountModal';
import PaymentMethodModal from '../components/settings/PaymentMethodModal';
import CardTypeModal from '../components/settings/CardTypeModal';
import ConfirmationModal from '../components/common/ConfirmationModal';

const SalesSettingsScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Current State (Form Values)
  const [currency, setCurrency] = useState('JOD');
  const [taxRate, setTaxRate] = useState('');
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cardTypes, setCardTypes] = useState<CardType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>({
    enabled: false, pointsPerCurrency: 1, currencyPerPoint: 1, welcomeBonusPoints: 10, rewards: []
  });

  // Original State (to check for changes and discard)
  const [originalState, setOriginalState] = useState<any>(null);

  // Modals
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] = useState(false);
  const [cardTypeModalVisible, setCardTypeModalVisible] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Edit Context
  const [editingItem, setEditingItem] = useState<any>(null);

  // Delete Trackers (to handle batch delete)
  const [discountsToDelete, setDiscountsToDelete] = useState<string[]>([]);
  const [paymentMethodsToDelete, setPaymentMethodsToDelete] = useState<string[]>([]);
  const [cardTypesToDelete, setCardTypesToDelete] = useState<string[]>([]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, loyalty, cats] = await Promise.all([
        salesSettingsService.getAppSettings(),
        salesSettingsService.getLoyaltyConfig(),
        categoriesService.getAll(),
      ]);

      setCategories(cats);

      const state = {
        currency: settings.currency || 'JOD',
        taxRate: String(settings.taxRate ? Math.round(settings.taxRate * 100) : 0),
        discounts: settings.discounts || [],
        paymentMethods: settings.paymentMethods || [],
        cardTypes: settings.cardTypes || [],
        loyaltyConfig: loyalty || { enabled: false, pointsPerCurrency: 1, currencyPerPoint: 1, welcomeBonusPoints: 10, rewards: [] }
      };

      setCurrency(state.currency);
      setTaxRate(state.taxRate);
      setDiscounts([...state.discounts]);
      setPaymentMethods([...state.paymentMethods]);
      setCardTypes([...state.cardTypes]);
      setLoyaltyConfig({ ...state.loyaltyConfig });

      setOriginalState(JSON.parse(JSON.stringify(state)));

      setDiscountsToDelete([]);
      setPaymentMethodsToDelete([]);
      setCardTypesToDelete([]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const hasChanges = useMemo(() => {
    if (!originalState) return false;
    return (
      currency !== originalState.currency ||
      taxRate !== originalState.taxRate ||
      JSON.stringify(discounts) !== JSON.stringify(originalState.discounts) ||
      JSON.stringify(paymentMethods) !== JSON.stringify(originalState.paymentMethods) ||
      JSON.stringify(cardTypes) !== JSON.stringify(originalState.cardTypes) ||
      JSON.stringify(loyaltyConfig) !== JSON.stringify(originalState.loyaltyConfig) ||
      discountsToDelete.length > 0 ||
      paymentMethodsToDelete.length > 0 ||
      cardTypesToDelete.length > 0
    );
  }, [currency, taxRate, discounts, paymentMethods, cardTypes, loyaltyConfig, originalState, discountsToDelete, paymentMethodsToDelete, cardTypesToDelete]);

  const handleDiscard = () => {
    if (originalState) {
      setCurrency(originalState.currency);
      setTaxRate(originalState.taxRate);
      setDiscounts(JSON.parse(JSON.stringify(originalState.discounts)));
      setPaymentMethods(JSON.parse(JSON.stringify(originalState.paymentMethods)));
      setCardTypes(JSON.parse(JSON.stringify(originalState.cardTypes)));
      setLoyaltyConfig(JSON.parse(JSON.stringify(originalState.loyaltyConfig)));
      setDiscountsToDelete([]);
      setPaymentMethodsToDelete([]);
      setCardTypesToDelete([]);
    }
    setShowDiscardModal(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // 1. General Settings
      if (currency !== originalState.currency) await salesSettingsService.updateCurrency(currency);
      if (taxRate !== originalState.taxRate) await salesSettingsService.updateTaxRate(parseFloat(taxRate) / 100);
      if (JSON.stringify(loyaltyConfig) !== JSON.stringify(originalState.loyaltyConfig)) await salesSettingsService.updateLoyaltyConfig(loyaltyConfig);

      // 2. Batch Discounts
      for (const d of discounts) {
        if (d.id.startsWith('temp_')) {
          await salesSettingsService.addDiscount(d.name, d.percentage, d.adminOnly || false);
        } else {
          const original = originalState.discounts.find((orig: any) => orig.id === d.id);
          if (JSON.stringify(d) !== JSON.stringify(original)) await salesSettingsService.updateDiscount(d.id, d.name, d.percentage, d.adminOnly);
        }
      }
      for (const id of discountsToDelete) await salesSettingsService.deleteDiscount(id);

      // 3. Batch Payment Methods
      for (const pm of paymentMethods) {
        if (pm.id.startsWith('temp_')) {
          await salesSettingsService.addPaymentMethod(pm.name, (pm as any).tempFile);
        } else {
          const original = originalState.paymentMethods.find((orig: any) => orig.id === pm.id);
          if (JSON.stringify(pm) !== JSON.stringify(original) || (pm as any).tempFile) {
            await salesSettingsService.updatePaymentMethod(pm.id, pm.name, (pm as any).tempFile);
          }
        }
      }
      for (const id of paymentMethodsToDelete) await salesSettingsService.deletePaymentMethod(id);

      // 4. Batch Card Types
      for (const ct of cardTypes) {
        if (ct.id.startsWith('temp_')) {
          await salesSettingsService.addCardType(ct.name, (ct as any).tempFile);
        } else {
          const original = originalState.cardTypes.find((orig: any) => orig.id === ct.id);
          if (JSON.stringify(ct) !== JSON.stringify(original) || (ct as any).tempFile) {
            await salesSettingsService.updateCardType(ct.id, ct.name, (ct as any).tempFile);
          }
        }
      }
      for (const id of cardTypesToDelete) await salesSettingsService.deleteCardType(id);

      Alert.alert('Success', 'All changes saved successfully');
      await fetchSettings();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save some changes');
    } finally {
      setSaving(false);
    }
  };

  // --- Local Item Handlers ---

  const onSaveDiscount = (name: string, percentage: number, adminOnly: boolean, id?: string) => {
    if (id) {
      setDiscounts(prev => prev.map(d => d.id === id ? { ...d, name, percentage, adminOnly } : d));
    } else {
      setDiscounts(prev => [...prev, { id: `temp_${Date.now()}`, name, percentage, adminOnly, appSettingsId: '' }]);
    }
    setDiscountModalVisible(false);
  };

  const onDeleteDiscount = (id: string) => {
    setDiscounts(prev => prev.filter(d => d.id !== id));
    if (!id.startsWith('temp_')) setDiscountsToDelete(prev => [...prev, id]);
  };

  const onSavePaymentMethod = (name: string, logoFile?: any, id?: string) => {
    if (id) {
      setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, name, tempFile: logoFile } as any : p));
    } else {
      setPaymentMethods(prev => [...prev, { id: `temp_${Date.now()}`, name, appSettingsId: '', tempFile: logoFile } as any]);
    }
    setPaymentMethodModalVisible(false);
  };

  const onDeletePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(p => p.id !== id));
    if (!id.startsWith('temp_')) setPaymentMethodsToDelete(prev => [...prev, id]);
  };

  const onSaveCardType = (name: string, logoFile?: any, id?: string) => {
    if (id) {
      setCardTypes(prev => prev.map(c => c.id === id ? { ...c, name, tempFile: logoFile } as any : c));
    } else {
      setCardTypes(prev => [...prev, { id: `temp_${Date.now()}`, name, appSettingsId: '', tempFile: logoFile } as any]);
    }
    setCardTypeModalVisible(false);
  };

  const onDeleteCardType = (id: string) => {
    setCardTypes(prev => prev.filter(c => c.id !== id));
    if (!id.startsWith('temp_')) setCardTypesToDelete(prev => [...prev, id]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <ScreenContainer style={{ backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTagline}>STORE CONFIGURATION</Text>
            <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Sales Management</Text>
          </View>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.headerStatValue, { color: COLORS.textPrimary }]}>{discounts.length}</Text>
            <Text style={[styles.headerStatLabel, { color: COLORS.textSecondary }]}>Discounts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.headerStatValue, { color: COLORS.primary }]}>{paymentMethods.length}</Text>
            <Text style={[styles.headerStatLabel, { color: COLORS.textSecondary }]}>Payments</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.headerStatValue, { color: COLORS.primary }]}>
              {loyaltyConfig.rewards?.length || 0}
            </Text>
            <Text style={[styles.headerStatLabel, { color: COLORS.textSecondary }]}>Rewards</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <CurrencyGroup currency={currency} onChange={setCurrency} />
        <TaxRateGroup
          taxRate={taxRate ? parseFloat(taxRate) : 0}
          onChange={(val) => setTaxRate(val.toString())}
        />

        <DiscountGroup
          discounts={discounts}
          onAdd={() => { setEditingItem(null); setDiscountModalVisible(true); }}
          onEdit={(d) => { setEditingItem(d); setDiscountModalVisible(true); }}
          onDelete={onDeleteDiscount}
        />

        <PaymentMethodGroup
          paymentMethods={paymentMethods}
          onAdd={() => { setEditingItem(null); setPaymentMethodModalVisible(true); }}
          onEdit={(p) => { setEditingItem(p); setPaymentMethodModalVisible(true); }}
          onDelete={onDeletePaymentMethod}
        />

        <CardTypeGroup
          cardTypes={cardTypes}
          onAdd={() => { setEditingItem(null); setCardTypeModalVisible(true); }}
          onEdit={(c) => { setEditingItem(c); setCardTypeModalVisible(true); }}
          onDelete={onDeleteCardType}
        />

        <LoyaltyGroup config={loyaltyConfig} onChange={setLoyaltyConfig} currency={currency} categories={categories} />
      </ScrollView>

      {/* Fixed Footer Actions */}
      <View style={[styles.footer, { borderTopColor: COLORS.borderLight, backgroundColor: COLORS.white }]}>
        <TouchableOpacity
          style={[styles.discardBtn, !hasChanges && styles.disabledBtn]}
          onPress={() => setShowDiscardModal(true)}
          disabled={!hasChanges || saving}
        >
          <Text style={[styles.discardText, { color: COLORS.textSecondary }]}>Discard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: COLORS.primary }, !hasChanges && styles.disabledBtn]}
          onPress={handleSaveAll}
          disabled={!hasChanges || saving}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <DiscountModal isVisible={discountModalVisible} discount={editingItem} onSave={onSaveDiscount} onClose={() => setDiscountModalVisible(false)} />
      <PaymentMethodModal isVisible={paymentMethodModalVisible} paymentMethod={editingItem} onSave={onSavePaymentMethod} onClose={() => setPaymentMethodModalVisible(false)} />
      <CardTypeModal isVisible={cardTypeModalVisible} cardType={editingItem} onSave={onSaveCardType} onClose={() => setCardTypeModalVisible(false)} />

      <ConfirmationModal
        isVisible={showDiscardModal}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to revert all changes?"
        confirmText="Discard"
        confirmColor={COLORS.error}
        onConfirm={handleDiscard}
        onCancel={() => setShowDiscardModal(false)}
      />
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statItem: { alignItems: 'center' },
  headerStatValue: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  headerStatLabel: { fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, height: 24, backgroundColor: colors.borderLight },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 12,
    borderTopWidth: 1,
  },
  discardBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discardText: { fontSize: 16, fontWeight: '700' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.5 },
});

export default SalesSettingsScreen;