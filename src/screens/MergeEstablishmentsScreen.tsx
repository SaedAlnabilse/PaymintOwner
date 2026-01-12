import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { RootState } from '../store/store';
import { apiClient } from '../services/apiClient';

interface Establishment {
  id: string;
  name: string;
  establishmentLoginId: string;
  type: string;
  subscriptionStatus: string;
}

interface Employee {
  assignmentId: string;
  employeeId: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

interface EstablishmentWithEmployees {
  establishmentId: string;
  establishmentName: string;
  employees: Employee[];
}

const MergeEstablishmentsScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const navigation = useNavigation<any>();
  const { establishments, isLoading: isAuthLoading } = useSelector((state: RootState) => state.auth);

  const [selectedEstablishments, setSelectedEstablishments] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [establishmentsWithEmployees, setEstablishmentsWithEmployees] = useState<EstablishmentWithEmployees[]>([]);
  const [mergeEmployees, setMergeEmployees] = useState(false);

  // Show loading if establishments haven't been loaded yet
  if (isAuthLoading && establishments.length === 0) {
    return (
      <ScreenContainer>
        <View style={[styles.container, styles.loadingContainer, { backgroundColor: COLORS.background }]}>
          <ActivityIndicator size="large" color="#7CC39F" />
          <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
            Loading establishments...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const availableEstablishments = (establishments || []).filter(
    (est) => est.subscriptionStatus === 'ACTIVE' || est.subscriptionStatus === 'TRIALING'
  );

  const toggleEstablishment = (id: string) => {
    setSelectedEstablishments((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId) ? prev.filter((i) => i !== employeeId) : [...prev, employeeId]
    );
  };

  const selectAllEmployees = () => {
    const allEmployeeIds = establishmentsWithEmployees.flatMap((est) =>
      est.employees.map((emp) => emp.employeeId)
    );
    // Remove duplicates (same employee in multiple establishments)
    const uniqueIds = [...new Set(allEmployeeIds)];
    setSelectedEmployees(uniqueIds);
  };

  const deselectAllEmployees = () => {
    setSelectedEmployees([]);
  };

  const loadEmployeesForMerging = async () => {
    if (selectedEstablishments.length < 2) return;

    setIsLoadingEmployees(true);
    try {
      const response = await apiClient.post('/api/brands/employees-for-merging', {
        establishmentIds: selectedEstablishments,
      });
      setEstablishmentsWithEmployees(response.data);
    } catch (err: any) {
      console.error('Failed to load employees:', err);
      Alert.alert('Error', 'Failed to load employees for selected establishments');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1 && selectedEstablishments.length < 2) {
      Alert.alert('Error', 'Please select at least 2 establishments to merge into a brand.');
      return;
    }
    if (currentStep === 2 && !brandName.trim()) {
      Alert.alert('Error', 'Please enter a brand name.');
      return;
    }

    if (currentStep === 2) {
      // Moving to employee selection step - load employees
      await loadEmployeesForMerging();
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleMerge = async () => {
    try {
      setIsSubmitting(true);
      await apiClient.post('/api/brands/merge', {
        name: brandName.trim(),
        description: brandDescription.trim(),
        establishmentIds: selectedEstablishments,
        mergeEmployeeIds: mergeEmployees ? selectedEmployees : [],
      });

      const successMessage = mergeEmployees && selectedEmployees.length > 0
        ? `Brand created successfully! ${selectedEmployees.length} employee(s) now have access to all establishments.`
        : 'Brand created successfully!';

      Alert.alert('Success', successMessage, [
        { text: 'OK', onPress: () => navigation.navigate('Brands') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'restaurant':
        return 'silverware-fork-knife';
      case 'cafe':
        return 'coffee';
      case 'bar':
        return 'glass-cocktail';
      case 'bakery':
        return 'cake-variant';
      case 'retail':
        return 'store';
      default:
        return 'store';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '#D55263';
      case 'MANAGER':
        return '#F59E0B';
      case 'CASHIER':
        return '#1976D2';
      default:
        return '#7CC39F';
    }
  };

  // Get unique employees (some employees may work at multiple establishments)
  const getUniqueEmployees = () => {
    const employeeMap = new Map<string, Employee & { establishments: string[] }>();

    for (const est of establishmentsWithEmployees) {
      for (const emp of est.employees) {
        if (employeeMap.has(emp.employeeId)) {
          employeeMap.get(emp.employeeId)!.establishments.push(est.establishmentName);
        } else {
          employeeMap.set(emp.employeeId, {
            ...emp,
            establishments: [est.establishmentName],
          });
        }
      }
    }

    return Array.from(employeeMap.values());
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: COLORS.textPrimary }]}>Select Establishments</Text>
        <Text style={[styles.stepSubtitle, { color: COLORS.textSecondary }]}>
          Choose which establishments you want to merge into a brand
        </Text>
      </View>

      {availableEstablishments.length < 2 ? (
        <View style={styles.warningContainer}>
          <Icon name="alert-circle" size={48} color="#D97706" />
          <Text style={[styles.warningTitle, { color: COLORS.textPrimary }]}>
            Not Enough Establishments
          </Text>
          <Text style={[styles.warningText, { color: COLORS.textSecondary }]}>
            You need at least 2 active establishments to create a brand. Create more establishments
            first.
          </Text>
          <TouchableOpacity
            style={styles.warningButton}
            onPress={() => navigation.navigate('Establishments')}
          >
            <Text style={styles.warningButtonText}>Manage Establishments</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.selectionInfo}>
            <Icon name="information-outline" size={18} color="#1976D2" />
            <Text style={[styles.selectionInfoText, { color: '#1976D2' }]}>
              {selectedEstablishments.length} of {availableEstablishments.length} selected
            </Text>
          </View>

          {availableEstablishments.map((est) => {
            const isSelected = selectedEstablishments.includes(est.id);
            return (
              <TouchableOpacity
                key={est.id}
                style={[
                  styles.establishmentCard,
                  { backgroundColor: COLORS.cardBackground },
                  isSelected && styles.establishmentCardSelected,
                ]}
                onPress={() => toggleEstablishment(est.id)}
              >
                <View style={styles.establishmentContent}>
                  <View style={[styles.establishmentIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Icon name={getTypeIcon(est.type)} size={24} color="#1976D2" />
                  </View>
                  <View style={styles.establishmentInfo}>
                    <Text style={[styles.establishmentName, { color: COLORS.textPrimary }]}>
                      {est.name}
                    </Text>
                    <Text style={[styles.establishmentSlug, { color: COLORS.textSecondary }]}>
                      @{est.establishmentLoginId}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                    { borderColor: isSelected ? '#7CC39F' : COLORS.border },
                  ]}
                >
                  {isSelected && <Icon name="check" size={16} color="#000" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: COLORS.textPrimary }]}>Brand Details</Text>
        <Text style={[styles.stepSubtitle, { color: COLORS.textSecondary }]}>
          Enter the details for your new brand
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Brand Name</Text>
        <View style={[styles.inputContainer, { backgroundColor: COLORS.cardBackground }]}>
          <Icon name="tag-heart" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={[styles.input, { color: COLORS.textPrimary }]}
            value={brandName}
            onChangeText={setBrandName}
            placeholder="e.g., Coffee House Group"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Description (Optional)</Text>
        <View
          style={[
            styles.inputContainerMulti,
            { backgroundColor: COLORS.cardBackground },
          ]}
        >
          <TextInput
            style={[styles.inputMulti, { color: COLORS.textPrimary }]}
            value={brandDescription}
            onChangeText={setBrandDescription}
            placeholder="Brief description of the brand..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={[styles.previewCard, { backgroundColor: COLORS.cardBackground }]}>
        <Text style={[styles.previewTitle, { color: COLORS.textSecondary }]}>
          Merging {selectedEstablishments.length} Establishments
        </Text>
        {selectedEstablishments.map((id) => {
          const est = availableEstablishments.find((e) => e.id === id);
          if (!est) return null;
          return (
            <View key={id} style={styles.previewItem}>
              <Icon name="check-circle" size={16} color="#7CC39F" />
              <Text style={[styles.previewItemText, { color: COLORS.textPrimary }]}>
                {est.name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderStep3 = () => {
    const uniqueEmployees = getUniqueEmployees();
    const totalEmployees = uniqueEmployees.length;

    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <Text style={[styles.stepTitle, { color: COLORS.textPrimary }]}>Merge Employees</Text>
          <Text style={[styles.stepSubtitle, { color: COLORS.textSecondary }]}>
            Select employees to give access to ALL establishments in the brand
          </Text>
        </View>

        {isLoadingEmployees ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7CC39F" />
            <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
              Loading employees...
            </Text>
          </View>
        ) : totalEmployees === 0 ? (
          <View style={styles.warningContainer}>
            <Icon name="account-off" size={48} color="#D97706" />
            <Text style={[styles.warningTitle, { color: COLORS.textPrimary }]}>
              No Employees Found
            </Text>
            <Text style={[styles.warningText, { color: COLORS.textSecondary }]}>
              There are no employees in the selected establishments. You can add employees later.
            </Text>
          </View>
        ) : (
          <>
            {/* Toggle for merging employees */}
            <TouchableOpacity
              style={[styles.toggleCard, { backgroundColor: COLORS.cardBackground }]}
              onPress={() => setMergeEmployees(!mergeEmployees)}
            >
              <View style={styles.toggleContent}>
                <Icon name="account-group" size={24} color="#7CC39F" />
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleTitle, { color: COLORS.textPrimary }]}>
                    Merge Employees
                  </Text>
                  <Text style={[styles.toggleSubtitle, { color: COLORS.textSecondary }]}>
                    Give selected employees access to all brand locations
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.toggleSwitch,
                  mergeEmployees && styles.toggleSwitchActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    mergeEmployees && styles.toggleKnobActive,
                  ]}
                />
              </View>
            </TouchableOpacity>

            {mergeEmployees && (
              <>
                <View style={styles.selectAllRow}>
                  <Text style={[styles.selectionInfoText, { color: '#1976D2' }]}>
                    {selectedEmployees.length} of {totalEmployees} employees selected
                  </Text>
                  <View style={styles.selectAllButtons}>
                    <TouchableOpacity onPress={selectAllEmployees} style={styles.selectAllBtn}>
                      <Text style={styles.selectAllBtnText}>Select All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={deselectAllEmployees} style={styles.selectAllBtn}>
                      <Text style={styles.selectAllBtnText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {uniqueEmployees.map((emp) => {
                  const isSelected = selectedEmployees.includes(emp.employeeId);
                  return (
                    <TouchableOpacity
                      key={emp.employeeId}
                      style={[
                        styles.employeeCard,
                        { backgroundColor: COLORS.cardBackground },
                        isSelected && styles.employeeCardSelected,
                      ]}
                      onPress={() => toggleEmployee(emp.employeeId)}
                    >
                      <View style={styles.employeeContent}>
                        <View style={[styles.employeeAvatar, { backgroundColor: '#E3F2FD' }]}>
                          <Text style={styles.employeeAvatarText}>
                            {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.employeeInfo}>
                          <Text style={[styles.employeeName, { color: COLORS.textPrimary }]}>
                            {emp.firstName} {emp.lastName}
                          </Text>
                          <Text style={[styles.employeeUsername, { color: COLORS.textSecondary }]}>
                            @{emp.username}
                          </Text>
                          <View style={styles.employeeMeta}>
                            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(emp.role) + '20' }]}>
                              <Text style={[styles.roleText, { color: getRoleColor(emp.role) }]}>
                                {emp.role}
                              </Text>
                            </View>
                            <Text style={[styles.establishmentCount, { color: COLORS.textSecondary }]}>
                              {emp.establishments.length} location(s)
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                          { borderColor: isSelected ? '#7CC39F' : COLORS.border },
                        ]}
                      >
                        {isSelected && <Icon name="check" size={16} color="#000" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </>
        )}
      </View>
    );
  };

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={styles.confirmContainer}>
        <View style={styles.confirmIconContainer}>
          <Icon name="link-variant" size={60} color="#7CC39F" />
        </View>
        <Text style={[styles.confirmTitle, { color: COLORS.textPrimary }]}>Ready to Merge</Text>
        <Text style={[styles.confirmSubtitle, { color: COLORS.textSecondary }]}>
          You're about to create a new brand with {selectedEstablishments.length} establishments.
        </Text>

        <View style={[styles.summaryCard, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Brand Name</Text>
            <Text style={[styles.summaryValue, { color: COLORS.textPrimary }]}>{brandName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Establishments</Text>
            <Text style={[styles.summaryValue, { color: COLORS.textPrimary }]}>
              {selectedEstablishments.length}
            </Text>
          </View>
          {mergeEmployees && selectedEmployees.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Merged Employees</Text>
              <Text style={[styles.summaryValue, { color: COLORS.textPrimary }]}>
                {selectedEmployees.length}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.infoCard, { backgroundColor: '#E3F2FD' }]}>
          <Icon name="information-outline" size={20} color="#1976D2" />
          <Text style={styles.infoText}>
            {mergeEmployees && selectedEmployees.length > 0
              ? 'Selected employees will be able to access all establishments using the brand login credentials.'
              : 'Establishments will be grouped under the brand. You can merge employees later from the brand settings.'}
          </Text>
        </View>
      </View>
    </View>
  );

  const totalSteps = 4;

  return (
    <ScreenContainer>
      <View style={[styles.container, { backgroundColor: COLORS.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Create Brand</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <View
                  style={[
                    styles.stepDot,
                    currentStep >= step && styles.stepDotActive,
                    currentStep === step && styles.stepDotCurrent,
                  ]}
                >
                  {currentStep > step ? (
                    <Icon name="check" size={12} color="#000" />
                  ) : (
                    <Text
                      style={[
                        styles.stepDotText,
                        { color: currentStep >= step ? '#000' : COLORS.textSecondary },
                      ]}
                    >
                      {step}
                    </Text>
                  )}
                </View>
                {step < totalSteps && (
                  <View
                    style={[
                      styles.stepLine,
                      { backgroundColor: currentStep > step ? '#7CC39F' : COLORS.border },
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollView>

        {/* Actions */}
        <View style={[styles.actionsContainer, { backgroundColor: COLORS.cardBackground }]}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.backBtn, { borderColor: COLORS.border }]}
              onPress={handleBack}
            >
              <Text style={[styles.backBtnText, { color: COLORS.textSecondary }]}>Back</Text>
            </TouchableOpacity>
          )}
          {currentStep < totalSteps ? (
            <TouchableOpacity
              style={[styles.nextBtn, selectedEstablishments.length < 2 && currentStep === 1 && { opacity: 0.5 }]}
              onPress={handleNext}
              disabled={(selectedEstablishments.length < 2 && currentStep === 1) || isLoadingEmployees}
            >
              {isLoadingEmployees ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>Continue</Text>
                  <Icon name="arrow-right" size={18} color="#000" />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.mergeBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleMerge}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Icon name="link-variant" size={18} color="#000" />
                  <Text style={styles.mergeBtnText}>Create Brand</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#7CC39F',
  },
  stepDotCurrent: {
    borderWidth: 3,
    borderColor: 'rgba(124, 195, 159, 0.3)',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 6,
    borderRadius: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectionInfoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  establishmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  establishmentCardSelected: {
    borderColor: '#7CC39F',
  },
  establishmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  establishmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  establishmentInfo: {
    flex: 1,
  },
  establishmentName: {
    fontSize: 16,
    fontWeight: '700',
  },
  establishmentSlug: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7CC39F',
  },
  warningContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  warningButton: {
    backgroundColor: '#7CC39F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  warningButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
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
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  inputContainerMulti: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputMulti: {
    fontSize: 15,
    fontWeight: '500',
    minHeight: 80,
  },
  previewCard: {
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  previewItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Employee selection styles
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  toggleSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#7CC39F',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  selectAllButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  selectAllBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  employeeCardSelected: {
    borderColor: '#7CC39F',
  },
  employeeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  employeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
  },
  employeeUsername: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  employeeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  establishmentCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  confirmContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  confirmIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  confirmSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryCard: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1565C0',
    lineHeight: 18,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  backBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#7CC39F',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  mergeBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#7CC39F',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mergeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
});

export default MergeEstablishmentsScreen;
