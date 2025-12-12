import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { RootState, AppDispatch } from '../store/store';
import { loginUser, clearError, logout } from '../store/slices/authSlice';

import LogoHeader from '../components/auth/LogoHeader';
import FormInput from '../components/auth/FormInput';
import PrimaryButton from '../components/common/PrimaryButton';
import LoadingModal from '../components/common/LoadingModal';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [showSuccessLoading, setShowSuccessLoading] = useState(false);
  const [showAdminOnlyModal, setShowAdminOnlyModal] = useState(false);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [logoScale] = useState(new Animated.Value(0.8));
  const [pulseAnim] = useState(new Animated.Value(1));

  const dispatch = useDispatch<AppDispatch>();
  const { error: globalError } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 15,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for decorative elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const validateInputs = () => {
    let hasError = false;
    setUsernameError('');
    setPasswordError('');

    if (!username.trim()) {
      setUsernameError('Username is required');
      hasError = true;
    } else if (username.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters');
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.trim().length < 4) {
      setPasswordError('Password must be at least 4 characters');
      hasError = true;
    }

    return !hasError;
  };

  const isAdminOrOwner = (role: string | undefined): boolean => {
    if (!role) return false;
    const normalizedRole = role.toUpperCase();
    return normalizedRole === 'ADMIN' || normalizedRole === 'OWNER';
  };

  const handleAdminOnlyDismiss = () => {
    setShowAdminOnlyModal(false);
    // Clear credentials and logout
    setUsername('');
    setPassword('');
    dispatch(logout());
  };

  const handleLogin = async () => {
    // Clear previous errors
    dispatch(clearError());
    setUsernameError('');
    setPasswordError('');

    // Validate inputs FIRST - before any loading
    if (!validateInputs()) {
      // Validation failed - errors are already set by validateInputs()
      // Don't proceed, don't show loading
      return;
    }

    // Validation passed - now make API call (no loading spinner for errors)
    setIsChecking(true);
    try {
      const result = await dispatch(
        loginUser({
          username: username.trim(),
          password: password.trim(),
        }),
      ).unwrap();

      // Check if user is admin or owner
      const userRole = result?.user?.role;
      if (!isAdminOrOwner(userRole)) {
        // Not an admin - show popup and don't proceed
        setIsChecking(false);
        setShowAdminOnlyModal(true);
        return;
      }

      // Success - show success loading
      setShowSuccessLoading(true);
    } catch (err: any) {
      // API error - show inline without loading
      const errorMsg = typeof err === 'string' ? err : err?.message || '';
      if (errorMsg.includes('inactive') || errorMsg.includes('only for owners') || errorMsg.includes('administrators only')) {
        // Show admin-only modal for role-related errors
        setShowAdminOnlyModal(true);
      } else {
        setPasswordError('Incorrect username or password');
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
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
            <Text style={styles.adminOnlyTitle}>Admin Access Only</Text>
            <Text style={styles.adminOnlyMessage}>
              This App Is For Administrators Only. Please Contact Your Manager If You Need Access.
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

      {/* Animated Background Gradient Effect */}
      <View style={styles.gradientBackground}>
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />
      </View>

      {/* Decorative Circles */}
      <Animated.View
        style={[
          styles.decorativeCircle1,
          { transform: [{ scale: pulseAnim }] }
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle2,
          { transform: [{ scale: pulseAnim }] }
        ]}
      />

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
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              {/* Logo Section with Animation */}
              <Animated.View
                style={[
                  styles.logoContainer,
                  { transform: [{ scale: logoScale }] }
                ]}
              >
                <View style={styles.logoWrapper}>
                  <View style={styles.logoIconContainer}>
                    <MaterialCommunityIcon name="shield-check" size={56} color="#7CC39F" />
                  </View>
                  <Text style={styles.appTitle}>PayMint Owner</Text>
                  <Text style={styles.appSubtitle}>Business Management Portal</Text>
                </View>
              </Animated.View>

              {/* Login Card with Glassmorphism */}
              <View style={styles.loginCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerIconContainer}>
                    <Icon name="log-in" size={24} color="#7CC39F" />
                  </View>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.welcomeText}>Welcome Back!</Text>
                    <Text style={styles.instructionText}>
                      Sign In To Access Your Dashboard
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

                  {globalError && !usernameError && !passwordError ? (
                    <View style={styles.globalErrorContainer}>
                      <MaterialCommunityIcon name="alert-circle" size={18} color="#D55263" />
                      <Text style={styles.globalErrorText}>{globalError}</Text>
                    </View>
                  ) : null}

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

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.footerBadge}>
                  <MaterialCommunityIcon name="information" size={14} color="#64748B" />
                  <Text style={styles.footerText}>
                    Administrator Credentials Required
                  </Text>
                </View>
              </View>
            </Animated.View>
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
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#7CC39F',
    opacity: 0.08,
  },
  gradientLayer2: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#A8BBBF',
    opacity: 0.06,
  },
  gradientLayer3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#F8FAFC',
    opacity: 0.1,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#7CC39F',
    opacity: 0.08,
    top: -100,
    right: -100,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#D0C962',
    opacity: 0.06,
    bottom: -80,
    left: -80,
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
    elevation: 12,
    borderWidth: 3,
    borderColor: 'rgba(124, 195, 159, 0.2)',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F1D2B',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7CC39F',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  // Login Card
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(124, 195, 159, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F1D2B',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  instructionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // Form
  formContainer: {
    marginBottom: 20,
  },
  globalErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#D55263',
    gap: 10,
  },
  globalErrorText: {
    flex: 1,
    color: '#D55263',
    fontSize: 14,
    fontWeight: '600',
  },

  // Security Badge
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  securityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7CC39F',
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  footerText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },

  // Admin Only Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  adminOnlyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124, 195, 159, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  adminOnlyTitle: {
    fontSize: 22,
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
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  adminOnlyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default LoginScreen;

