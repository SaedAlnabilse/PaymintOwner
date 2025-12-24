import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { selectTenant } from '../store/slices/authSlice';
import { apiClient } from '../services/apiClient';

const TenantSelectionScreen = () => {
  const [tenantSlug, setTenantSlug] = useState('');
  const [restaurantPassword, setRestaurantPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slugFocused, setSlugFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const dispatch = useDispatch<AppDispatch>();

  const handleConnect = async () => {
    setError('');
    if (!tenantSlug.trim() || !restaurantPassword.trim()) {
      setError('Please enter both Restaurant ID and Password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/auth/verify-tenant', {
        tenantSlug: tenantSlug.trim().toLowerCase(),
        restaurantPassword: restaurantPassword.trim(),
      });

      if (response.data) {
        dispatch(selectTenant(response.data));
      }
    } catch (err: any) {
      console.error('❌ Tenant verification failed:', err);
      setError(err.response?.data?.message || 'Failed to connect. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

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
                <Text style={styles.appTitle}>Connect Restaurant</Text>
                <Text style={styles.appSubtitle}>Owner Access Portal</Text>
              </View>

              <View style={styles.loginCard}>
                <Text style={styles.instructionText}>
                  Enter your Restaurant ID and password to manage your business.
                </Text>

                <View style={styles.formContainer}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Restaurant ID</Text>
                    <View style={[
                      styles.inputContainer,
                      slugFocused && styles.inputFocused,
                      !!error && styles.errorBorder
                    ]}>
                      <Icon name="home" size={20} color={slugFocused ? "#7CC39F" : "#94A3B8"} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. cafe-aroma"
                        placeholderTextColor="#94A3B8"
                        value={tenantSlug}
                        onChangeText={setTenantSlug}
                        onFocus={() => setSlugFocused(true)}
                        onBlur={() => setSlugFocused(false)}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Restaurant Password</Text>
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
                        value={restaurantPassword}
                        onChangeText={setRestaurantPassword}
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
                <Text style={styles.footerText}>PayMint Multi-Tenant SaaS</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  }
});

export default TenantSelectionScreen;
