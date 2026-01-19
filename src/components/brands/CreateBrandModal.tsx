import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { RootState } from '../../store/store';
import { apiClient } from '../../services/apiClient';

interface Establishment {
  id: string;
  name: string;
  type?: string;
  currency?: string;
}

interface EmployeeForMerge {
  assignmentId: string;
  employeeId: string;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

interface EstablishmentWithEmployees {
  establishmentId: string;
  establishmentName: string;
  employees: EmployeeForMerge[];
}

interface CreateBrandModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'details' | 'establishments' | 'employees' | 'review';

const CreateBrandModal: React.FC<CreateBrandModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const { establishments } = useSelector((state: RootState) => state.auth);

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>('details');

  // Form state
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [brandLoginId, setBrandLoginId] = useState('');
  const [brandPassword, setBrandPassword] = useState('');

  // Selection state
  const [selectedEstablishments, setSelectedEstablishments] = useState<string[]>([]);
  const [employeesForMerge, setEmployeesForMerge] = useState<EstablishmentWithEmployees[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Loading state
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available establishments (not already in a brand)
  const availableEstablishments = (establishments || []).filter(
    (est: any) => !est.brandId
  );

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setCurrentStep('details');
      setBrandName('');
      setBrandDescription('');
      setBrandLoginId('');
      setBrandPassword('');
      setSelectedEstablishments([]);
      setEmployeesForMerge([]);
      setSelectedEmployees([]);
    }
  }, [visible]);

  // Fetch employees when moving to employees step
  const fetchEmployeesForMerge = async () => {
    if (selectedEstablishments.length < 2) return;

    setIsLoadingEmployees(true);
    try {
      const response = await apiClient.post('/api/brands/employees-for-merging', {
        establishmentIds: selectedEstablishments,
      });
      setEmployeesForMerge(response.data || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      Alert.alert('Error', 'Failed to load employees. Please try again.');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleEstablishmentSelect = (estId: string) => {
    setSelectedEstablishments((prev) =>
      prev.includes(estId)
        ? prev.filter((id) => id !== estId)
        : [...prev, estId]
    );
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAllEmployees = (estEmployees: EmployeeForMerge[]) => {
    const allIds = estEmployees.map((e) => e.employeeId);
    const allSelected = allIds.every((id) => selectedEmployees.includes(id));

    if (allSelected) {
      setSelectedEmployees((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedEmployees((prev) => [...new Set([...prev, ...allIds])]);
    }
  };

  const goToNextStep = () => {
    if (currentStep === 'details') {
      if (!brandName.trim()) {
        Alert.alert('Error', 'Please enter a brand name');
        return;
      }
      setCurrentStep('establishments');
    } else if (currentStep === 'establishments') {
      if (selectedEstablishments.length < 2) {
        Alert.alert('Error', 'Please select at least 2 establishments to merge');
        return;
      }
      fetchEmployeesForMerge();
      setCurrentStep('employees');
    } else if (currentStep === 'employees') {
      setCurrentStep('review');
    }
  };

  const goToPrevStep = () => {
    if (currentStep === 'establishments') {
      setCurrentStep('details');
    } else if (currentStep === 'employees') {
      setCurrentStep('establishments');
    } else if (currentStep === 'review') {
      setCurrentStep('employees');
    }
  };

  const handleCreateBrand = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/api/brands', {
        name: brandName.trim(),
        description: brandDescription.trim(),
        establishmentIds: selectedEstablishments,
        establishmentLoginId: brandLoginId.trim() || undefined,
        establishmentPassword: brandPassword || undefined,
        mergeEmployeeIds: selectedEmployees.length > 0 ? selectedEmployees : undefined,
      });

      Alert.alert(
        'Success',
        `Brand "${brandName}" created successfully!${
          selectedEmployees.length > 0
            ? ` ${selectedEmployees.length} employee(s) now have access to all locations.`
            : ''
        }`,
        [{ text: 'OK', onPress: () => { onClose(); onSuccess(); } }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {['details', 'establishments', 'employees', 'review'].map((step, index) => (
        <React.Fragment key={step}>
          <View
            style={[
              styles.stepDot,
              currentStep === step && styles.stepDotActive,
              ['establishments', 'employees', 'review'].indexOf(currentStep) >= index && styles.stepDotCompleted,
            ]}
          >
            <Text style={[
              styles.stepNumber,
              (currentStep === step || ['establishments', 'employees', 'review'].indexOf(currentStep) >= index) && styles.stepNumberActive,
            ]}>
              {index + 1}
            </Text>
          </View>
          {index < 3 && (
            <View
              style={[
                styles.stepLine,
                ['establishments', 'employees', 'review'].indexOf(currentStep) > index && styles.stepLineActive,
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderDetailsStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: COLORS.textPrimary }]}>Brand Details</Text>
      <Text style={[styles.stepSubtitle, { color: COLORS.textSecondary }]}>
        Enter the basic information for your new brand
      </Text>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Brand Name *</Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: COLORS.backgroundSecondary, color: COLORS.textPrimary }]}
          value={brandName}
          onChangeText={setBrandName}
          placeholder="e.g., Coffee House Chain"
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Description</Text>
        <TextInput
          style={[styles.formInputMulti, { backgroundColor: COLORS.backgroundSecondary, color: COLORS.textPrimary }]}
          value={brandDescription}
          onChangeText={setBrandDescription}
          placeholder="Brief description of the brand..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={[styles.infoCard, { backgroundColor: '#E3F2FD' }]}>
        <Icon name="information-outline" size={20} color="#1976D2" />
        <Text style={styles.infoCardText}>
          Optional: Set custom login credentials for the brand. If not provided, the first establishment's credentials will be used.
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Brand Login ID (Optional)</Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: COLORS.backgroundSecondary, color: COLORS.textPrimary }]}
          value={brandLoginId}
          onChangeText={setBrandLoginId}
          placeholder="e.g., coffee-house"
          placeholderTextColor={COLORS.textSecondary}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Brand Password (Optional)</Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: COLORS.backgroundSecondary, color: COLORS.textPrimary }]}
          value={brandPassword}
          onChangeText={setBrandPassword}
          placeholder="New password for brand login"
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry
        />
      </View>
    </ScrollView>
  );

  const renderEstablishmentsStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: COLORS.textPrimary }]}>Select Establishments</Text>
      <Text style={[styles.stepSubtitle, { color: COLORS.textSecondary }]}>
        Choose at least 2 establishments to merge into this brand
      </Text>

      <View style={styles.selectionInfo}>
        <Icon name="check-circle" size={16} color="#7CC39F" />
        <Text style={[styles.selectionInfoText, { color: COLORS.textSecondary }]}>
          {selectedEstablishments.length} selected
        </Text>
      </View>

      <FlatList
        data={availableEstablishments}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => {
          const isSelected = selectedEstablishments.includes(item.id);
          return (
            <TouchableOpacity
              style={[
                styles.selectionItem,
                { backgroundColor: COLORS.cardBackground },
                isSelected && styles.selectionItemSelected,
              ]}
              onPress={() => handleEstablishmentSelect(item.id)}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Icon name="check" size={16} color="#fff" />}
              </View>
              <View style={styles.selectionItemInfo}>
                <Text style={[styles.selectionItemName, { color: COLORS.textPrimary }]}>
                  {item.name}
                </Text>
                <Text style={[styles.selectionItemSub, { color: COLORS.textSecondary }]}>
                  {item.type} • {item.currency || 'USD'}
                </Text>
              </View>
              <Icon name="store" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.selectionList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderEmployeesStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: COLORS.textPrimary }]}>Select Employees for Brand Access</Text>
      <Text style={[styles.stepSubtitle, { color: COLORS.textSecondary }]}>
        Choose which employees should have access to ALL establishments in this brand
      </Text>

      <View style={[styles.warningCard, { backgroundColor: '#FFF3E0' }]}>
        <Icon name="alert-circle-outline" size={20} color="#E65100" />
        <Text style={styles.warningCardText}>
          Selected employees will be able to log in to any establishment in this brand using the brand credentials.
        </Text>
      </View>

      {isLoadingEmployees ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7CC39F" />
          <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
            Loading employees...
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {employeesForMerge.map((est) => (
            <View key={est.establishmentId} style={styles.employeeGroup}>
              <View style={styles.employeeGroupHeader}>
                <Icon name="store" size={18} color="#7CC39F" />
                <Text style={[styles.employeeGroupTitle, { color: COLORS.textPrimary }]}>
                  {est.establishmentName}
                </Text>
                <TouchableOpacity
                  style={styles.selectAllBtn}
                  onPress={() => handleSelectAllEmployees(est.employees)}
                >
                  <Text style={styles.selectAllText}>
                    {est.employees.every((e) => selectedEmployees.includes(e.employeeId))
                      ? 'Deselect All'
                      : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>

              {est.employees.map((emp) => {
                const isSelected = selectedEmployees.includes(emp.employeeId);
                return (
                  <TouchableOpacity
                    key={emp.employeeId}
                    style={[
                      styles.employeeItem,
                      { backgroundColor: COLORS.backgroundSecondary },
                      isSelected && styles.employeeItemSelected,
                    ]}
                    onPress={() => handleEmployeeSelect(emp.employeeId)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Icon name="check" size={14} color="#fff" />}
                    </View>
                    <View style={styles.employeeInfo}>
                      <Text style={[styles.employeeName, { color: COLORS.textPrimary }]}>
                        {emp.firstName} {emp.lastName}
                      </Text>
                      <Text style={[styles.employeeRole, { color: COLORS.textSecondary }]}>
                        @{emp.username} • {emp.role}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {selectedEmployees.length === 0 && (
            <View style={[styles.noSelectionCard, { backgroundColor: COLORS.backgroundSecondary }]}>
              <Icon name="account-off" size={32} color={COLORS.textSecondary} />
              <Text style={[styles.noSelectionText, { color: COLORS.textSecondary }]}>
                No employees selected. You can skip this step if you don't want to give any employees brand-wide access.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );

  const renderReviewStep = () => {
    const selectedEstNames = availableEstablishments
      .filter((e: any) => selectedEstablishments.includes(e.id))
      .map((e: any) => e.name);

    const selectedEmpNames = employeesForMerge
      .flatMap((e) => e.employees)
      .filter((emp) => selectedEmployees.includes(emp.employeeId))
      .map((emp) => `${emp.firstName} ${emp.lastName}`);

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.stepTitle, { color: COLORS.textPrimary }]}>Review & Create</Text>
        <Text style={[styles.stepSubtitle, { color: COLORS.textSecondary }]}>
          Review your brand configuration before creating
        </Text>

        <View style={[styles.reviewCard, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.reviewRow}>
            <Text style={[styles.reviewLabel, { color: COLORS.textSecondary }]}>Brand Name</Text>
            <Text style={[styles.reviewValue, { color: COLORS.textPrimary }]}>{brandName}</Text>
          </View>

          {brandDescription && (
            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: COLORS.textSecondary }]}>Description</Text>
              <Text style={[styles.reviewValue, { color: COLORS.textPrimary }]}>{brandDescription}</Text>
            </View>
          )}

          <View style={styles.reviewDivider} />

          <View style={styles.reviewRow}>
            <Text style={[styles.reviewLabel, { color: COLORS.textSecondary }]}>Establishments ({selectedEstNames.length})</Text>
          </View>
          {selectedEstNames.map((name, idx) => (
            <View key={idx} style={styles.reviewListItem}>
              <Icon name="store" size={16} color="#7CC39F" />
              <Text style={[styles.reviewListText, { color: COLORS.textPrimary }]}>{name}</Text>
            </View>
          ))}

          <View style={styles.reviewDivider} />

          <View style={styles.reviewRow}>
            <Text style={[styles.reviewLabel, { color: COLORS.textSecondary }]}>
              Employees with Brand Access ({selectedEmpNames.length})
            </Text>
          </View>
          {selectedEmpNames.length > 0 ? (
            selectedEmpNames.map((name, idx) => (
              <View key={idx} style={styles.reviewListItem}>
                <Icon name="account" size={16} color="#7CC39F" />
                <Text style={[styles.reviewListText, { color: COLORS.textPrimary }]}>{name}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.reviewNoItems, { color: COLORS.textSecondary }]}>
              No employees selected for brand-wide access
            </Text>
          )}
        </View>

        <View style={[styles.successCard, { backgroundColor: '#E8F5E9' }]}>
          <Icon name="check-circle" size={24} color="#2E7D32" />
          <View style={styles.successCardContent}>
            <Text style={styles.successCardTitle}>Ready to Create</Text>
            <Text style={styles.successCardText}>
              {selectedEmpNames.length > 0
                ? `${selectedEmpNames.length} employee(s) will be able to log in to any of the ${selectedEstNames.length} establishments using the brand credentials.`
                : `${selectedEstNames.length} establishments will be merged under this brand. You can add employee access later.`}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: COLORS.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: COLORS.cardBackground }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Icon name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Create Brand</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        {currentStep === 'details' && renderDetailsStep()}
        {currentStep === 'establishments' && renderEstablishmentsStep()}
        {currentStep === 'employees' && renderEmployeesStep()}
        {currentStep === 'review' && renderReviewStep()}

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: COLORS.cardBackground }]}>
          {currentStep !== 'details' && (
            <TouchableOpacity style={styles.backBtn} onPress={goToPrevStep}>
              <Icon name="chevron-left" size={20} color={COLORS.textSecondary} />
              <Text style={[styles.backBtnText, { color: COLORS.textSecondary }]}>Back</Text>
            </TouchableOpacity>
          )}

          {currentStep !== 'review' ? (
            <TouchableOpacity
              style={[styles.nextBtn, currentStep === 'details' && styles.nextBtnFull]}
              onPress={goToNextStep}
            >
              <Text style={styles.nextBtnText}>
                {currentStep === 'employees' ? 'Review' : 'Next'}
              </Text>
              <Icon name="chevron-right" size={20} color="#000" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.createBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleCreateBrand}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Icon name="check" size={20} color="#000" />
                  <Text style={styles.createBtnText}>Create Brand</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#7CC39F',
  },
  stepDotCompleted: {
    backgroundColor: '#7CC39F',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
  },
  stepNumberActive: {
    color: '#000',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#7CC39F',
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 24,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  formInputMulti: {
    minHeight: 100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1565C0',
    lineHeight: 18,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  warningCardText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#E65100',
    lineHeight: 18,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  selectionInfoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectionList: {
    paddingBottom: 20,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 14,
  },
  selectionItemSelected: {
    borderWidth: 2,
    borderColor: '#7CC39F',
  },
  selectionItemInfo: {
    flex: 1,
  },
  selectionItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectionItemSub: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7CC39F',
    borderColor: '#7CC39F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  employeeGroup: {
    marginBottom: 20,
  },
  employeeGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  employeeGroupTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  selectAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  employeeItemSelected: {
    borderWidth: 2,
    borderColor: '#7CC39F',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600',
  },
  employeeRole: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  noSelectionCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  noSelectionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  reviewCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  reviewRow: {
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 16,
  },
  reviewListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  reviewListText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reviewNoItems: {
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  successCardContent: {
    flex: 1,
  },
  successCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  successCardText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2E7D32',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7CC39F',
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextBtnFull: {
    marginLeft: 0,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  createBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7CC39F',
    paddingVertical: 14,
    borderRadius: 12,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});

export default CreateBrandModal;
