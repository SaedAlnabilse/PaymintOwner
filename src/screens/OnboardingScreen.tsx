import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { apiClient } from '../services/apiClient';

const { width } = Dimensions.get('window');

const ESTABLISHMENT_TYPES = [
  { id: 'restaurant', name: 'Restaurant', icon: 'silverware-fork-knife' },
  { id: 'cafe', name: 'Cafe', icon: 'coffee' },
  { id: 'bar', name: 'Bar', icon: 'glass-cocktail' },
  { id: 'bakery', name: 'Bakery', icon: 'cake-variant' },
  { id: 'retail', name: 'Retail', icon: 'store' },
  { id: 'other', name: 'Other', icon: 'dots-horizontal' },
];

const CURRENCIES = [
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
];

const STEPS = [
  { id: 1, title: 'Business Type', icon: 'store' },
  { id: 2, title: 'Details', icon: 'text-box' },
  { id: 3, title: 'Settings', icon: 'cog' },
  { id: 4, title: 'Complete', icon: 'check-circle' },
];

const OnboardingScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const navigation = useNavigation<any>();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [establishmentType, setEstablishmentType] = useState('');
  const [name, setName] = useState('');
  const [establishmentLoginId, setEstablishmentLoginId] = useState('');
  const [establishmentPassword, setEstablishmentPassword] = useState('');
  const [currency, setCurrency] = useState('JOD');
  const [address, setAddress] = useState('');
  const [taxRate, setTaxRate] = useState('16');
  const [serviceCharge, setServiceCharge] = useState('0');

  const generateLoginId = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (!establishmentLoginId || establishmentLoginId === generateLoginId(name)) {
      setEstablishmentLoginId(generateLoginId(text));
    }
  };

  const validateStep = () => {
    setError('');
    switch (currentStep) {
      case 1:
        if (!establishmentType) {
          setError('Please select a business type');
          return false;
        }
        break;
      case 2:
        if (!name.trim()) {
          setError('Please enter your establishment name');
          return false;
        }
        if (!establishmentLoginId.trim()) {
          setError('Please enter a unique establishment ID');
          return false;
        }
        if (!establishmentPassword || establishmentPassword.length < 6) {
          setError('Please enter a password (min 6 chars)');
          return false;
        }
        break;
      case 3:
        if (!currency) {
          setError('Please select a currency');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      await apiClient.post('/api/establishments', {
        type: establishmentType,
        name: name.trim(),
        establishmentLoginId: establishmentLoginId.trim(),
        establishmentPassword: establishmentPassword,
        currency,
        address: address.trim(),
        taxRate: parseFloat(taxRate) / 100,
        serviceCharge: parseFloat(serviceCharge) / 100,
      });

      setCurrentStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create establishment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => (
        <React.Fragment key={step.id}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                currentStep >= step.id && styles.stepCircleActive,
                currentStep === step.id && styles.stepCircleCurrent,
              ]}
            >
              {currentStep > step.id ? (
                <Icon name="check" size={16} color="#000" />
              ) : (
                <Icon
                  name={step.icon}
                  size={16}
                  color={currentStep >= step.id ? '#000' : COLORS.textSecondary}
                />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                { color: currentStep >= step.id ? COLORS.textPrimary : COLORS.textSecondary },
              ]}
            >
              {step.title}
            </Text>
          </View>
          {index < STEPS.length - 1 && (
            <View
              style={[
                styles.stepLine,
                { backgroundColor: currentStep > step.id ? '#7CC39F' : COLORS.border },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: COLORS.textPrimary }]}>What type of business?</Text>
      <Text style={[styles.stepSubtitle, { color: COLORS.textSecondary }]}>
        Choose the category that best describes your establishment
      </Text>

      <View style={styles.typeGrid}>
        {ESTABLISHMENT_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeCard,
              { backgroundColor: COLORS.cardBackground },
              establishmentType === type.id && styles.typeCardSelected,
            ]}
            onPress={() => setEstablishmentType(type.id)}
          >
            <View
              style={[
                styles.typeIcon,
                {
                  backgroundColor: establishmentType === type.id ? '#7CC39F' : COLORS.backgroundSecondary,
                },
              ]}
            >
              <Icon
                name={type.icon}
                size={28}
                color={establishmentType === type.id ? '#000' : COLORS.textSecondary}
              />
            </View>
            <Text
              style={[
                styles.typeName,
                { color: establishmentType === type.id ? '#7CC39F' : COLORS.textPrimary },
              ]}
            >
              {type.name}
            </Text>
            {establishmentType === type.id && (
              <Icon name="check-circle" size={20} color="#7CC39F" style={styles.typeCheck} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: COLORS.textPrimary }]}>Establishment Details</Text>
      <Text style={[styles.stepSubtitle, { color: COLORS.textSecondary }]}>
        Tell us about your business
      </Text>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Establishment Name</Text>
        <View style={[styles.inputContainer, { backgroundColor: COLORS.cardBackground }]}>
          <Icon name="store" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={[styles.input, { color: COLORS.textPrimary }]}
            value={name}
            onChangeText={handleNameChange}
            placeholder="e.g., The Coffee House"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Establishment ID</Text>
        <View style={[styles.inputContainer, { backgroundColor: COLORS.cardBackground }]}>
          <Icon name="pound" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={[styles.input, { color: COLORS.textPrimary }]}
            value={establishmentLoginId}
            onChangeText={(text) => setEstablishmentLoginId(generateLoginId(text))}
            placeholder="my-coffee-shop"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none"
          />
        </View>
        <Text style={[styles.formHint, { color: COLORS.textSecondary }]}>
          Unique ID for POS login (e.g. store-1)
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Establishment Password</Text>
        <View style={[styles.inputContainer, { backgroundColor: COLORS.cardBackground }]}>
          <Icon name="lock-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={[styles.input, { color: COLORS.textPrimary }]}
            value={establishmentPassword}
            onChangeText={setEstablishmentPassword}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry
          />
        </View>
        <Text style={[styles.formHint, { color: COLORS.textSecondary }]}>
          Password for POS login (min 6 chars)
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Address (Optional)</Text>
        <View style={[styles.inputContainer, { backgroundColor: COLORS.cardBackground }]}>
          <Icon name="map-marker" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={[styles.input, { color: COLORS.textPrimary }]}
            value={address}
            onChangeText={setAddress}
            placeholder="Street address"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: COLORS.textPrimary }]}>Settings</Text>
      <Text style={[styles.stepSubtitle, { color: COLORS.textSecondary }]}>
        Configure your business settings
      </Text>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Currency</Text>
        <View style={styles.currencyGrid}>
          {CURRENCIES.map((cur) => (
            <TouchableOpacity
              key={cur.code}
              style={[
                styles.currencyCard,
                { backgroundColor: COLORS.cardBackground },
                currency === cur.code && styles.currencyCardSelected,
              ]}
              onPress={() => setCurrency(cur.code)}
            >
              <Text
                style={[
                  styles.currencySymbol,
                  { color: currency === cur.code ? '#7CC39F' : COLORS.textSecondary },
                ]}
              >
                {cur.symbol}
              </Text>
              <Text
                style={[
                  styles.currencyCode,
                  { color: currency === cur.code ? '#7CC39F' : COLORS.textPrimary },
                ]}
              >
                {cur.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Tax Rate (%)</Text>
        <View style={[styles.inputContainer, { backgroundColor: COLORS.cardBackground }]}>
          <Icon name="percent" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={[styles.input, { color: COLORS.textPrimary }]}
            value={taxRate}
            onChangeText={setTaxRate}
            placeholder="16"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Service Charge (%)</Text>
        <View style={[styles.inputContainer, { backgroundColor: COLORS.cardBackground }]}>
          <Icon name="hand-heart" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={[styles.input, { color: COLORS.textPrimary }]}
            value={serviceCharge}
            onChangeText={setServiceCharge}
            placeholder="0"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="decimal-pad"
          />
        </View>
        <Text style={[styles.formHint, { color: COLORS.textSecondary }]}>
          Optional service charge applied to orders
        </Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.completeContent}>
      <View style={styles.successIconContainer}>
        <Icon name="check-circle" size={100} color="#7CC39F" />
      </View>
      <Text style={[styles.completeTitle, { color: COLORS.textPrimary }]}>You're All Set!</Text>
      <Text style={[styles.completeSubtitle, { color: COLORS.textSecondary }]}>
        Your establishment "{name}" has been created successfully. You can now start managing your
        business.
      </Text>

      <View style={[styles.summaryCard, { backgroundColor: COLORS.cardBackground }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Business Type</Text>
          <Text style={[styles.summaryValue, { color: COLORS.textPrimary }]}>
            {ESTABLISHMENT_TYPES.find((t) => t.id === establishmentType)?.name}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Currency</Text>
          <Text style={[styles.summaryValue, { color: COLORS.textPrimary }]}>{currency}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Tax Rate</Text>
          <Text style={[styles.summaryValue, { color: COLORS.textPrimary }]}>{taxRate}%</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('Main')}
      >
        <Text style={styles.startButtonText}>Start Managing</Text>
        <Icon name="arrow-right" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: COLORS.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            {currentStep < 4 && currentStep > 1 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            )}
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>
                Create Establishment
              </Text>
            </View>
            {currentStep < 4 && <View style={{ width: 44 }} />}
          </View>

          {/* Step Indicator */}
          {currentStep < 4 && renderStepIndicator()}

          {/* Error */}
          {error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Actions */}
          {currentStep < 4 && (
            <View style={styles.actions}>
              {currentStep === 3 ? (
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Create Establishment</Text>
                      <Icon name="check" size={20} color="#000" />
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>Continue</Text>
                  <Icon name="arrow-right" size={20} color="#000" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#7CC39F',
  },
  stepCircleCurrent: {
    borderWidth: 3,
    borderColor: 'rgba(124, 195, 159, 0.3)',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  stepLine: {
    width: 30,
    height: 2,
    marginHorizontal: 4,
    marginBottom: 20,
    borderRadius: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 24,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: (width - 52) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    borderColor: '#7CC39F',
  },
  typeIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '700',
  },
  typeCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  slugPrefix: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  formHint: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    marginLeft: 4,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  currencyCard: {
    width: (width - 60) / 3,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencyCardSelected: {
    borderColor: '#7CC39F',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    marginTop: 24,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    backgroundColor: '#7CC39F',
    borderRadius: 14,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    backgroundColor: '#7CC39F',
    borderRadius: 14,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  completeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  completeSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  summaryCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7CC39F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});

export default OnboardingScreen;
