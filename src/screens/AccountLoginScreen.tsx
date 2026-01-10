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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { loginAccount, clearError } from '../store/slices/authSlice';

const AccountLoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { error: globalError, isLoading } = useSelector((state: RootState) => state.auth);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateInputs = (): boolean => {
    let hasError = false;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    }

    return !hasError;
  };

  const handleLogin = async () => {
    dispatch(clearError());
    if (!validateInputs()) return;

    setIsSubmitting(true);
    try {
      await dispatch(
        loginAccount({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        })
      ).unwrap();
      // Navigation is handled automatically by AppNavigator based on auth state
    } catch (err: any) {
      const errorMsg = typeof err === 'string' ? err : err?.message || '';
      if (errorMsg.toLowerCase().includes('password') || errorMsg.toLowerCase().includes('credentials')) {
        setPasswordError('Invalid email or password');
      } else if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('not found')) {
        setEmailError('Account not found');
      }
    } finally {
      setIsSubmitting(false);
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
              {/* Logo Section */}
              <View style={styles.logoContainer}>
                <View style={styles.logoIconContainer}>
                  <MaterialCommunityIcon name="shield-account" size={56} color="#7CC39F" />
                </View>
                <Text style={styles.appTitle}>PayMint Owner</Text>
                <Text style={styles.appSubtitle}>Business Management Portal</Text>
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
                      Sign in with your account email
                    </Text>
                  </View>
                </View>

                <View style={styles.formContainer}>
                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        emailFocused && styles.inputFocused,
                        !!emailError && styles.errorBorder,
                      ]}
                    >
                      <Icon name="mail" size={20} color={emailFocused ? '#7CC39F' : '#94A3B8'} />
                      <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor="#94A3B8"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (emailError) setEmailError('');
                          dispatch(clearError());
                        }}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        autoComplete="email"
                      />
                    </View>
                    {!!emailError && (
                      <View style={styles.fieldErrorContainer}>
                        <Icon name="alert-circle" size={14} color="#D55263" />
                        <Text style={styles.fieldErrorText}>{emailError}</Text>
                      </View>
                    )}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        passwordFocused && styles.inputFocused,
                        !!passwordError && styles.errorBorder,
                      ]}
                    >
                      <Icon name="lock" size={20} color={passwordFocused ? '#7CC39F' : '#94A3B8'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!passwordVisible}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (passwordError) setPasswordError('');
                          dispatch(clearError());
                        }}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                      />
                      <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                        <Icon
                          name={passwordVisible ? 'eye' : 'eye-off'}
                          size={20}
                          color="#94A3B8"
                        />
                      </TouchableOpacity>
                    </View>
                    {!!passwordError && (
                      <View style={styles.fieldErrorContainer}>
                        <Icon name="alert-circle" size={14} color="#D55263" />
                        <Text style={styles.fieldErrorText}>{passwordError}</Text>
                      </View>
                    )}
                  </View>

                  {/* Global Error */}
                  {!!globalError && !emailError && !passwordError && (
                    <View style={styles.globalErrorContainer}>
                      <MaterialCommunityIcon name="alert-circle" size={18} color="#D55263" />
                      <Text style={styles.globalErrorText}>{globalError}</Text>
                    </View>
                  )}

                  {/* Login Button */}
                  <TouchableOpacity
                    style={[styles.loginButton, (isSubmitting || isLoading) && styles.disabledButton]}
                    onPress={handleLogin}
                    disabled={isSubmitting || isLoading}
                  >
                    {isSubmitting || isLoading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Sign In</Text>
                        <Icon name="arrow-right" size={20} color="#FFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Security Badge */}
                <View style={styles.securityBadge}>
                  <MaterialCommunityIcon name="shield-lock" size={16} color="#7CC39F" />
                  <Text style={styles.securityText}>Secure Account Access</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>PayMint Business Management</Text>
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
    maxWidth: 500,
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
  fieldErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  fieldErrorText: {
    color: '#D55263',
    fontSize: 12,
    fontWeight: '600',
  },
  globalErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    gap: 10,
  },
  globalErrorText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
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
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
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
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default AccountLoginScreen;
