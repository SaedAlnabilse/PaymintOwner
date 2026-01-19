import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { getAppSettings, updateTaxRate, updateCurrency } from '../../services/salesSettings';

interface SalesSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const CURRENCIES = [
  { code: '$', name: 'US Dollar (USD)' },
  { code: '€', name: 'Euro (EUR)' },
  { code: '£', name: 'British Pound (GBP)' },
  { code: 'EGP', name: 'Egyptian Pound (EGP)' },
  { code: 'SAR', name: 'Saudi Riyal (SAR)' },
  { code: 'AED', name: 'UAE Dirham (AED)' },
];

const SalesSettingsModal: React.FC<SalesSettingsModalProps> = ({
  visible,
  onClose,
  onUpdate,
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const [taxRate, setTaxRate] = useState('');
  const [currency, setCurrency] = useState('$');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [originalTaxRate, setOriginalTaxRate] = useState('');
  const [originalCurrency, setOriginalCurrency] = useState('$');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const settings = await getAppSettings();
      const tax = settings.taxRate?.toString() || '0';
      const curr = settings.currency || '$';
      setTaxRate(tax);
      setCurrency(curr);
      setOriginalTaxRate(tax);
      setOriginalCurrency(curr);
    } catch (error) {
      console.error('Failed to fetch sales settings:', error);
      Alert.alert('Error', 'Failed to load sales settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchData();
      setHasChanges(false);
    }
  }, [visible, fetchData]);

  useEffect(() => {
    const taxChanged = taxRate !== originalTaxRate;
    const currencyChanged = currency !== originalCurrency;
    setHasChanges(taxChanged || currencyChanged);
  }, [taxRate, currency, originalTaxRate, originalCurrency]);

  const handleSave = async () => {
    const parsedTaxRate = parseFloat(taxRate) || 0;
    if (parsedTaxRate < 0 || parsedTaxRate > 100) {
      Alert.alert('Invalid Tax Rate', 'Tax rate must be between 0 and 100');
      return;
    }

    setIsSaving(true);
    try {
      const promises = [];
      if (taxRate !== originalTaxRate) {
        promises.push(updateTaxRate(parsedTaxRate));
      }
      if (currency !== originalCurrency) {
        promises.push(updateCurrency(currency));
      }
      await Promise.all(promises);
      Alert.alert('Success', 'Sales settings saved successfully');
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Failed to save sales settings:', error);
      Alert.alert('Error', 'Failed to save sales settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  const getCurrencyName = (code: string) => {
    return CURRENCIES.find(c => c.code === code)?.name || code;
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalBg}
      >
        <Pressable style={styles.overlay} onPress={handleClose} />

        <View style={[styles.modalContainer, { backgroundColor: 'transparent' }]}>
          {/* Header Background */}
          <View style={[styles.headerBg, { backgroundColor: COLORS.primary }]}>
            <View style={styles.headerContent}>
              <View style={styles.iconBox}>
                <Icon name="cash-register" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Sales Settings</Text>
                <Text style={styles.headerSubtitle}>
                  Tax rate and currency configuration
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Card */}
          <View style={[styles.cardContent, { backgroundColor: COLORS.white }]}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
                  Loading sales settings...
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Tax Rate */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.fieldLabel, { color: COLORS.textSecondary }]}>
                    Tax Rate
                  </Text>
                  <View style={[styles.inputCard, { borderColor: COLORS.borderLight, backgroundColor: COLORS.background }]}>
                    <View style={[styles.prefixBox, { borderRightColor: COLORS.borderLight, backgroundColor: COLORS.white }]}>
                      <Text style={[styles.prefixText, { color: COLORS.primary }]}>%</Text>
                    </View>
                    <TextInput
                      style={[styles.input, { color: COLORS.textPrimary }]}
                      value={taxRate}
                      onChangeText={setTaxRate}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={COLORS.textTertiary}
                    />
                  </View>
                  <Text style={[styles.helperText, { color: COLORS.textTertiary }]}>
                    This tax rate will be applied to all orders
                  </Text>
                </View>

                {/* Currency */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.fieldLabel, { color: COLORS.textSecondary }]}>
                    Currency
                  </Text>
                  <TouchableOpacity
                    style={[styles.currencySelector, { borderColor: COLORS.borderLight, backgroundColor: COLORS.background }]}
                    onPress={() => setShowCurrencyPicker(true)}
                  >
                    <View style={styles.currencyLeft}>
                      <View style={[styles.currencyIcon, { backgroundColor: COLORS.primary + '15' }]}>
                        <Text style={[styles.currencySymbol, { color: COLORS.primary }]}>{currency}</Text>
                      </View>
                      <Text style={[styles.currencyName, { color: COLORS.textPrimary }]}>
                        {getCurrencyName(currency)}
                      </Text>
                    </View>
                    <Icon name="chevron-down" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: COLORS.borderLight }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={[styles.cancelText, { color: COLORS.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!hasChanges || isSaving}
              >
                <LinearGradient
                  colors={hasChanges ? [COLORS.primary, COLORS.primary + 'CC'] : [COLORS.border, COLORS.border]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveGradient}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Icon name="check" size={18} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.saveText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Currency Picker Modal */}
        <Modal
          visible={showCurrencyPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCurrencyPicker(false)}
        >
          <View style={[styles.pickerModalBg]}>
            <Pressable style={styles.overlay} onPress={() => setShowCurrencyPicker(false)} />
            <View style={[styles.pickerContainer, { backgroundColor: COLORS.white }]}>
              <View style={[styles.pickerHeader, { borderBottomColor: COLORS.borderLight }]}>
                <Text style={[styles.pickerTitle, { color: COLORS.textPrimary }]}>Select Currency</Text>
                <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                  <Icon name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {CURRENCIES.map((curr) => (
                  <TouchableOpacity
                    key={curr.code}
                    style={[styles.pickerItem, { borderBottomColor: COLORS.borderLight }]}
                    onPress={() => {
                      setCurrency(curr.code);
                      setShowCurrencyPicker(false);
                    }}
                  >
                    <View style={styles.pickerItemLeft}>
                      <View style={[styles.currencyIcon, { backgroundColor: COLORS.primary + '15' }]}>
                        <Text style={[styles.currencySymbol, { color: COLORS.primary }]}>{curr.code}</Text>
                      </View>
                      <Text
                        style={[
                          styles.pickerItemText,
                          {
                            color: curr.code === currency ? COLORS.primary : COLORS.textPrimary,
                            fontWeight: curr.code === currency ? '700' : '400',
                          },
                        ]}
                      >
                        {curr.name}
                      </Text>
                    </View>
                    {curr.code === currency && <Icon name="check" size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
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
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
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
    inputCard: {
      flexDirection: 'row',
      borderRadius: 12,
      borderWidth: 1,
      overflow: 'hidden',
      height: 54,
    },
    prefixBox: {
      width: 50,
      justifyContent: 'center',
      alignItems: 'center',
      borderRightWidth: 1,
    },
    prefixText: {
      fontSize: 18,
      fontWeight: '700',
    },
    input: {
      flex: 1,
      paddingHorizontal: 16,
      fontSize: 18,
      fontWeight: '700',
    },
    currencySelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    currencyLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    currencyIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    currencySymbol: {
      fontSize: 14,
      fontWeight: '800',
    },
    currencyName: {
      fontSize: 16,
      fontWeight: '600',
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
    saveBtnDisabled: {
      opacity: 0.7,
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
    // Picker styles
    pickerModalBg: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
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
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    pickerItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    pickerItemText: {
      fontSize: 16,
    },
  });

export default SalesSettingsModal;
