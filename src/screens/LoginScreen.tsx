import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { RootState, AppDispatch } from '../store/store';
import { loginUser, clearError, logout } from '../store/slices/authSlice';

import FormInput from '../components/auth/FormInput';
import PrimaryButton from '../components/common/PrimaryButton';
import LoadingModal from '../components/common/LoadingModal';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [showSuccessLoading, setShowSuccessLoading] = useState(false);
  const [showAdminOnlyModal, setShowAdminOnlyModal] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { error: globalError } = useSelector((state: RootState) => state.auth);

  const validateInputs = () => {
    let hasError = false;
    setUsernameError('');
    setPasswordError('');

    if (!username.trim()) {
      setUsernameError('Username is required');
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    }

    return !hasError;
  };

  const isAdminOrOwner = (role?: string): boolean => {
    if (!role) return false;
    const normalizedRole = role.toUpperCase();
    return normalizedRole === 'ADMIN' || normalizedRole === 'OWNER';
  };

  const handleAdminOnlyDismiss = () => {
    setShowAdminOnlyModal(false);
    setUsername('');
    setPassword('');
    dispatch(logout());
  };

  const handleLogin = async () => {
    dispatch(clearError());
    setUsernameError('');
    setPasswordError('');

    if (!validateInputs()) {
      return;
    }

    setIsChecking(true);
    try {
      const result = await dispatch(
        loginUser({
          username: username.trim(),
          password: password.trim(),
        }),
      ).unwrap();

      const userRole = result?.user?.role;
      if (!isAdminOrOwner(userRole)) {
        setIsChecking(false);
        setShowAdminOnlyModal(true);
        return;
      }

      setShowSuccessLoading(true);
    } catch (err: any) {
      const errorMsg = typeof err === 'string' ? err : err?.message || '';
      if (errorMsg.includes('inactive') || errorMsg.includes('only for owners') || errorMsg.includes('administrators only')) {
        setShowAdminOnlyModal(true);
      } else {
        // Decide where to show the error
        if (errorMsg.toLowerCase().includes('password')) { // Simple check for password related errors
          setPasswordError('Incorrect username or password');
        } else {
          // Fallback to global error display logic managed by Redux state,
          // or manually set a general error if needed.
          // The globalError from redux will be displayed in the UI.
        }
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <LoadingModal
        visible={showSuccessLoading}
        text="Logging In..."
        success={showSuccessLoading}
      />

      {/* Admin Only Modal */}
      <Modal
        visible={showAdminOnlyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleAdminOnlyDismiss}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.adminOnlyModal}>
            <View style={styles.adminOnlyIconContainer}>
              <MaterialCommunityIcon name="shield-lock" size={48} color="#7CC39F" />
            </View>
            <Text style={styles.adminOnlyTitle}>Access Denied</Text>
            <Text style={styles.adminOnlyMessage}>
              This application is restricted to Administrators and Owners only.
            </Text>
            <TouchableOpacity
              style={styles.adminOnlyButton}
              onPress={handleAdminOnlyDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.adminOnlyButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              {/* Logo Section */}
              <View style={styles.logoContainer}>
                <View style={styles.logoWrapper}>
                  <View style={styles.logoIconContainer}>
                    <MaterialCommunityIcon name="shield-check" size={56} color="#7CC39F" />
                  </View>
                  <Text style={styles.appTitle}>PayMint Owner</Text>
                  <Text style={styles.appSubtitle}>Business Management Portal</Text>
                </View>
              </View>

              {/* Login Card */}
              <View style={styles.loginCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerIconContainer}>
                    <Icon name="log-in" size={24} color="#7CC39F" />
                  </View>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.welcomeText}>Welcome Back</Text>
                    <Text style={styles.instructionText}>
                      Please sign in to continue
                    </Text>
                  </View>
                </View>

                <View style={styles.formContainer}>
                  <FormInput
                    label="Username"
                    iconName="user"
                    value={username}
                    onChangeText={text => {
                      setUsername(text);
                      if (usernameError) setUsernameError('');
                    }}
                    error={usernameError}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <FormInput
                    label="Password"
                    iconName="lock"
                    value={password}
                    onChangeText={text => {
                      setPassword(text);
                      if (passwordError) setPasswordError('');
                    }}
                    error={passwordError}
                    secureTextEntry={true}
                  />

                  {(globalError || passwordError) && (
                    <View style={styles.globalErrorContainer}>
                      <MaterialCommunityIcon name="alert-circle" size={18} color="#D55263" />
                      <Text style={styles.globalErrorText}>
                        {passwordError || globalError || "Authentication failed"}
                      </Text>
                    </View>
                  )}

                  <PrimaryButton
                    title="Sign In"
                    onPress={handleLogin}
                    isLoading={isChecking}
                  />
                </View>

                {/* Security Badge */}
                <View style={styles.securityBadge}>
                  <MaterialCommunityIcon name="shield-lock" size={16} color="#7CC39F" />
                  <Text style={styles.securityText}>Secure Admin Access</Text>
                </View>
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
    paddingVertical: 20,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },

  // Logo Section
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    alignItems: 'center',
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
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F1D2B',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // Login Card
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1D2B',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  instructionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // Form
  formContainer: {
    marginBottom: 8,
  },
  globalErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  globalErrorText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 10,
  },

  // Security Badge
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  securityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.3,
  },

  // Admin Only Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  adminOnlyModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  adminOnlyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  adminOnlyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F1D2B',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  adminOnlyMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
  },
  adminOnlyButton: {
    backgroundColor: '#7CC39F',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 14,
    shadowColor: '#7CC39F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  adminOnlyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default LoginScreen;
