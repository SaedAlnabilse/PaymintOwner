import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';

// Supported currencies with their symbols
const CURRENCIES = [
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JOD' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BHD' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'EGP' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'IQD' },
];

interface CurrencyGroupProps {
  currency: string;
  onChange: (value: string) => void;
}

const CurrencyGroup: React.FC<CurrencyGroupProps> = ({ currency, onChange }) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);

  const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES.find(c => c.code === 'JOD') || CURRENCIES[0];

  const handleSelect = (currencyCode: string) => {
    // If selecting the same currency, just close
    if (currencyCode === currency) {
      setIsModalVisible(false);
      return;
    }
    // Store the pending currency and show confirmation modal
    setPendingCurrency(currencyCode);
    setIsModalVisible(false);
    setIsConfirmModalVisible(true);
  };

  const handleConfirmCurrencyChange = () => {
    // We do NOT call onChange here, simulating a request sent to support
    // if (pendingCurrency) {
    //   onChange(pendingCurrency);
    // }
    setIsConfirmModalVisible(false);
    setShowSuccessModal(true);
    setPendingCurrency(null);
  };

  const handleCancelCurrencyChange = () => {
    setIsConfirmModalVisible(false);
    setPendingCurrency(null);
  };

  const getPendingCurrencyName = () => {
    if (!pendingCurrency) return '';
    const curr = CURRENCIES.find(c => c.code === pendingCurrency);
    return curr ? `${curr.code} - ${curr.name}` : pendingCurrency;
  };

  return (
    <View style={styles.group}>
      <View style={styles.header}>
        <Icon name="currency-usd" size={20} color={COLORS.primary} style={styles.headerIcon} />
        <Text style={[styles.groupTitle, { color: COLORS.textPrimary }]}>Store Currency</Text>
      </View>
      
      <View style={styles.container}>
        <Text style={[styles.label, { color: COLORS.textSecondary }]}>Currency Code/Symbol</Text>
        
        <TouchableOpacity
          style={[styles.dropdown, { backgroundColor: COLORS.background, borderColor: COLORS.borderLight }]}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={[styles.dropdownText, { color: COLORS.textPrimary }]}>
            {selectedCurrency.code} - {selectedCurrency.name}
          </Text>
          <Icon name="chevron-down" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Currency Selection Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: COLORS.white }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHeader, { borderBottomColor: COLORS.borderLight }]}>
              <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>Choose Currency</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isSelected = item.code === currency;
                return (
                  <TouchableOpacity
                    style={[
                      styles.currencyItem,
                      { borderBottomColor: COLORS.borderLight },
                      isSelected && { backgroundColor: COLORS.primary + '15' }, // 15 is hex alpha
                    ]}
                    onPress={() => handleSelect(item.code)}
                  >
                    <View style={styles.currencyInfo}>
                      <Text
                        style={[
                          styles.currencyCode,
                          { color: isSelected ? COLORS.primary : COLORS.textPrimary },
                          isSelected && styles.selectedText,
                        ]}
                      >
                        {item.code}
                      </Text>
                      <Text
                        style={[
                          styles.currencyName,
                          { color: isSelected ? COLORS.primary : COLORS.textSecondary },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <Icon name="check" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              style={styles.currencyList}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Currency Change Confirmation Modal */}
      <Modal
        visible={isConfirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelCurrencyChange}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCancelCurrencyChange}
        >
          <Pressable
            style={[styles.confirmModalContent, { backgroundColor: COLORS.white }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.confirmIconContainer}>
              <Icon name="alert-circle-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={[styles.confirmTitle, { color: COLORS.textPrimary }]}>
              Currency Change Request
            </Text>
            <Text style={[styles.confirmMessage, { color: COLORS.textSecondary }]}>
              Are you sure you want to send a request to change the currency to {getPendingCurrencyName()}?
            </Text>
            <Text style={[styles.confirmNote, { color: COLORS.textTertiary }]}>
              This request will be sent to our support team. The currency change will be processed based on the current exchange rate. Please note that existing receipts and orders will remain in their original currency.
            </Text>
            <View style={styles.confirmButtonContainer}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: COLORS.borderLight }]}
                onPress={handleCancelCurrencyChange}
              >
                <Text style={[styles.cancelButtonText, { color: COLORS.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: COLORS.primary }]}
                onPress={handleConfirmCurrencyChange}
              >
                <Text style={styles.confirmButtonText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSuccessModal(false)}
        >
          <Pressable
            style={[styles.confirmModalContent, { backgroundColor: COLORS.white }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.successIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
              <Icon name="check-circle" size={48} color={COLORS.primary} />
            </View>
            <Text style={[styles.confirmTitle, { color: COLORS.textPrimary }]}>
              Request Sent
            </Text>
            <Text style={[styles.confirmMessage, { color: COLORS.textSecondary }]}>
              Your currency change request has been sent to our support team. We will review your request and process the change accordingly.
            </Text>
            <TouchableOpacity
              style={[styles.okButton, { backgroundColor: COLORS.primary }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.confirmButtonText}>OK</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: { marginRight: 10 },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  container: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  currencyList: {
    maxHeight: 400,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 45,
  },
  currencyName: {
    fontSize: 14,
    fontWeight: '400',
  },
  selectedText: {
    fontWeight: '700',
  },
  // Confirmation Modal Styles
  confirmModalContent: {
    width: '90%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  confirmIconContainer: {
    marginBottom: 16,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  confirmNote: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  confirmButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  okButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
});

export default CurrencyGroup;
