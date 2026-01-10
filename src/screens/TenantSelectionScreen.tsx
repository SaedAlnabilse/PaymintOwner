import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { selectTenant } from '../store/slices/authSlice';
import { apiClient } from '../services/apiClient';

interface Establishment {
  id: string;
  name: string;
  type?: string;
  currency?: string;
  logo?: string;
}

const TenantSelectionScreen = () => {
  const [ownerPosId, setOwnerPosId] = useState('');
  const [ownerPosPassword, setOwnerPosPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slugFocused, setSlugFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // State for establishment selection modal
  const [showEstablishmentModal, setShowEstablishmentModal] = useState(false);
  const [availableEstablishments, setAvailableEstablishments] = useState<Establishment[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<{ type: string; name?: string } | null>(null);

  const dispatch = useDispatch<AppDispatch>();

  const handleConnect = async () => {
    setError('');
    if (!ownerPosId.trim() || !ownerPosPassword.trim()) {
      setError('Please enter both Owner ID and Password');
      return;
    }

    setIsLoading(true);
    try {
      // Try new establishment endpoint first
      let response;
      try {
        response = await apiClient.post('/api/establishments/verify-pos', {
          ownerPosId: ownerPosId.trim(),
          ownerPosPassword: ownerPosPassword.trim(),
        });
      } catch (newEndpointError: any) {
        // Fallback to legacy tenant endpoint for backward compatibility
        if (newEndpointError.response?.status === 404) {
          response = await apiClient.post('/api/auth/verify-tenant', {
            tenantSlug: ownerPosId.trim().toLowerCase(),
            restaurantPassword: ownerPosPassword.trim(),
          });

          if (response.data) {
            dispatch(selectTenant(response.data));
          }
          return;
        } else {
          throw newEndpointError;
        }
      }

      if (response.data) {
        const { type, requiresEstablishmentSelection, establishments, establishment, account, brand } = response.data;

        // Check if user needs to select from multiple establishments
        if (requiresEstablishmentSelection && establishments && establishments.length > 1) {
          // Store the list and show selection modal
          setAvailableEstablishments(establishments);
          setOwnerInfo({
            type: type || 'account',
            name: account?.name || brand?.name || 'Your Account'
          });
          setShowEstablishmentModal(true);
          return;
        }

        // Single establishment - auto-select it
        const selectedEst = establishment || establishments?.[0];
        if (selectedEst) {
          const establishmentData = {
            id: selectedEst.id,
            name: selectedEst.name,
            slug: selectedEst.id, // Use ID as slug for new system
          };
          dispatch(selectTenant(establishmentData));
        } else {
          // Fallback: Legacy response format
          const establishmentData = {
            id: response.data.id || response.data.establishmentId,
            name: response.data.name || response.data.establishmentName,
            slug: response.data.slug || response.data.tenantSlug || ownerPosId.trim(),
          };
          dispatch(selectTenant(establishmentData));
        }
      }
    } catch (err: any) {
      console.error('❌ Establishment verification failed:', err);
      setError(err.response?.data?.message || 'Failed to connect. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEstablishment = (est: Establishment) => {
    const establishmentData = {
      id: est.id,
      name: est.name,
      slug: est.id, // Use ID as slug for account-level logins
    };
    dispatch(selectTenant(establishmentData));
    setShowEstablishmentModal(false);
  };

  const renderEstablishmentItem = ({ item }: { item: Establishment }) => (
    <TouchableOpacity
      style={styles.establishmentItem}
      onPress={() => handleSelectEstablishment(item)}
      activeOpacity={0.7}
    >
      <View style={styles.establishmentIcon}>
        <MaterialCommunityIcon name="store" size={24} color="#7CC39F" />
      </View>
      <View style={styles.establishmentInfo}>
        <Text style={styles.establishmentName}>{item.name}</Text>
        {item.type && (
          <Text style={styles.establishmentType}>{item.type} • {item.currency || 'USD'}</Text>
        )}
      </View>
      <Icon name="chevron-right" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.logoContainer}>
                <View style={styles.logoIconContainer}>
                  <MaterialCommunityIcon name="store-cog" size={56} color="#7CC39F" />
                </View>
                <Text style={styles.appTitle}>Connect Business</Text>
                <Text style={styles.appSubtitle}>Owner Access Portal</Text>
              </View>

              <View style={styles.loginCard}>
                <Text style={styles.instructionText}>
                  Enter your Owner ID and password to manage your business.
                </Text>

                <View style={styles.formContainer}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Owner ID</Text>
                    <View style={[
                      styles.inputContainer,
                      slugFocused && styles.inputFocused,
                      !!error && styles.errorBorder
                    ]}>
                      <Icon name="hash" size={20} color={slugFocused ? "#7CC39F" : "#94A3B8"} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. mycompany"
                        placeholderTextColor="#94A3B8"
                        value={ownerPosId}
                        onChangeText={(text) => {
                          setOwnerPosId(text);
                          setError('');
                        }}
                        onFocus={() => setSlugFocused(true)}
                        onBlur={() => setSlugFocused(false)}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Owner Password</Text>
                    <View style={[
                      styles.inputContainer,
                      passwordFocused && styles.inputFocused,
                      !!error && styles.errorBorder
                    ]}>
                      <Icon name="lock" size={20} color={passwordFocused ? "#7CC39F" : "#94A3B8"} />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!passwordVisible}
                        value={ownerPosPassword}
                        onChangeText={(text) => {
                          setOwnerPosPassword(text);
                          setError('');
                        }}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                      />
                      <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                        <Icon name={passwordVisible ? "eye" : "eye-off"} size={20} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {!!error && (
                    <View style={styles.errorContainer}>
                      <Icon name="alert-circle" size={16} color="#D55263" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.connectButton, isLoading && styles.disabledButton]}
                    onPress={handleConnect}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.connectButtonText}>Connect Business</Text>
                        <Icon name="arrow-right" size={20} color="#FFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>PayMint Business Management</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Establishment Selection Modal */}
        <Modal
          visible={showEstablishmentModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEstablishmentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcon name="store-check" size={48} color="#7CC39F" />
                <Text style={styles.modalTitle}>Select Establishment</Text>
                <Text style={styles.modalSubtitle}>
                  {ownerInfo?.name ? `Welcome, ${ownerInfo.name}` : 'Choose an establishment to manage'}
                </Text>
              </View>

              <FlatList
                data={availableEstablishments}
                renderItem={renderEstablishmentItem}
                keyExtractor={(item) => item.id}
                style={styles.establishmentList}
                showsVerticalScrollIndicator={false}
              />

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEstablishmentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  content: {
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7CC39F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F1D2B',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  instructionText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F1D2B',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  inputFocused: {
    borderColor: '#7CC39F',
    backgroundColor: '#FFF',
  },
  errorBorder: {
    borderColor: '#D55263',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F1D2B',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF1F2',
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: '#D55263',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  connectButton: {
    backgroundColor: '#7CC39F',
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    shadowColor: '#7CC39F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  connectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F1D2B',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  establishmentList: {
    maxHeight: 280,
  },
  establishmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  establishmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  establishmentInfo: {
    flex: 1,
  },
  establishmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1D2B',
    marginBottom: 4,
  },
  establishmentType: {
    fontSize: 13,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  cancelButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
});

export default TenantSelectionScreen;
