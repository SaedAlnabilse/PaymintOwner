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
import { apiClient } from '../services/apiClient';

interface SignUpScreenProps {
  navigation: any;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Field errors
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [globalError, setGlobalError] = useState('');

  // Focus states
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    return { isValid: errors.length === 0, errors };
  };

  const validateInputs = (): boolean => {
    let hasError = false;
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGlobalError('');

    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      hasError = true;
    } else if (firstName.trim().length < 2) {
      setFirstNameError('First name must be at least 2 characters');
      hasError = true;
    }

    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      hasError = true;
    } else if (lastName.trim().length < 2) {
      setLastNameError('Last name must be at least 2 characters');
      hasError = true;
    }

    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    const passwordValidation = validatePassword(password);
    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (!passwordValidation.isValid) {
      setPasswordError(`Password must have: ${passwordValidation.errors.join(', ')}`);
      hasError = true;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your password');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    return !hasError;
  };

  const handleSignUp = async () => {
    if (!validateInputs()) return;

    setIsSubmitting(true);
    setGlobalError('');

    try {
      await apiClient.post('/api/accounts/register', {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      setRegisteredEmail(email.trim());
      setRegistrationSuccess(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      if (errorMsg.toLowerCase().includes('email')) {
        setEmailError(errorMsg);
      } else {
        setGlobalError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <Icon name="check" size={48} color="#7CC39F" />
            </View>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successSubtitle}>
              We've sent a verification link to{'\n'}
              <Text style={styles.successEmail}>{registeredEmail}</Text>
            </Text>
            <View style={styles.successHintContainer}>
              <Text style={styles.successHintText}>
                Didn't receive the email? Check your spam folder.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.goToLoginButton}
              onPress={() => navigation.navigate('AccountLogin')}
            >
              <Text style={styles.goToLoginButtonText}>Go to Login</Text>
              <Icon name="arrow-right" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Icon name="arrow-left" size={20} color="#64748B" />
                <Text style={styles.backButtonText}>Back to Login</Text>
              </TouchableOpacity>

              {/* Logo Section */}
              <View style={styles.logoContainer}>
                <View style={styles.logoIconContainer}>
                  <MaterialCommunityIcon name="account-plus" size={48} color="#7CC39F" />
                </View>
                <Text style={styles.appTitle}>Create Account</Text>
                <Text style={styles.appSubtitle}>Start your 7-day free trial</Text>
              </View>

              {/* Sign Up Card */}
              <View style={styles.signUpCard}>
                <View style={styles.formContainer}>
                  {/* Name Row */}
                  <View style={styles.nameRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>First Name</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          firstNameFocused && styles.inputFocused,
                          !!firstNameError && styles.errorBorder,
                        ]}
                      >
                        <Icon name="user" size={20} color={firstNameFocused ? '#7CC39F' : '#94A3B8'} />
                        <TextInput
                          style={styles.input}
                          placeholder="John"
                          placeholderTextColor="#94A3B8"
                          value={firstName}
                          onChangeText={(text) => {
                            setFirstName(text);
                            if (firstNameError) setFirstNameError('');
                          }}
                          onFocus={() => setFirstNameFocused(true)}
                          onBlur={() => setFirstNameFocused(false)}
                          autoCapitalize="words"
                        />
                      </View>
                      {!!firstNameError && (
                        <View style={styles.fieldErrorContainer}>
                          <Icon name="alert-circle" size={14} color="#D55263" />
                          <Text style={styles.fieldErrorText}>{firstNameError}</Text>
                        </View>
                      )}
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>Last Name</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          lastNameFocused && styles.inputFocused,
                          !!lastNameError && styles.errorBorder,
                        ]}
                      >
                        <TextInput
                          style={styles.input}
                          placeholder="Doe"
                          placeholderTextColor="#94A3B8"
                          value={lastName}
                          onChangeText={(text) => {
                            setLastName(text);
                            if (lastNameError) setLastNameError('');
                          }}
                          onFocus={() => setLastNameFocused(true)}
                          onBlur={() => setLastNameFocused(false)}
                          autoCapitalize="words"
                        />
                      </View>
                      {!!lastNameError && (
                        <View style={styles.fieldErrorContainer}>
                          <Icon name="alert-circle" size={14} color="#D55263" />
                          <Text style={styles.fieldErrorText}>{lastNameError}</Text>
                        </View>
                      )}
                    </View>
                  </View>

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
                        placeholder="Create a strong password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!passwordVisible}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (passwordError) setPasswordError('');
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

                  {/* Confirm Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        confirmPasswordFocused && styles.inputFocused,
                        !!confirmPasswordError && styles.errorBorder,
                      ]}
                    >
                      <Icon name="lock" size={20} color={confirmPasswordFocused ? '#7CC39F' : '#94A3B8'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm your password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!confirmPasswordVisible}
                        value={confirmPassword}
                        onChangeText={(text) => {
                          setConfirmPassword(text);
                          if (confirmPasswordError) setConfirmPasswordError('');
                        }}
                        onFocus={() => setConfirmPasswordFocused(true)}
                        onBlur={() => setConfirmPasswordFocused(false)}
                      />
                      <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
                        <Icon
                          name={confirmPasswordVisible ? 'eye' : 'eye-off'}
                          size={20}
                          color="#94A3B8"
                        />
                      </TouchableOpacity>
                    </View>
                    {!!confirmPasswordError && (
                      <View style={styles.fieldErrorContainer}>
                        <Icon name="alert-circle" size={14} color="#D55263" />
                        <Text style={styles.fieldErrorText}>{confirmPasswordError}</Text>
                      </View>
                    )}
                  </View>

                  {/* Global Error */}
                  {!!globalError && (
                    <View style={styles.globalErrorContainer}>
                      <MaterialCommunityIcon name="alert-circle" size={18} color="#D55263" />
                      <Text style={styles.globalErrorText}>{globalError}</Text>
                    </View>
                  )}

                  {/* Sign Up Button */}
                  <TouchableOpacity
                    style={[styles.signUpButton, isSubmitting && styles.disabledButton]}
                    onPress={handleSignUp}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.signUpButtonText}>Create Account</Text>
                        <Icon name="arrow-right" size={20} color="#FFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Already have account */}
                <View style={styles.loginLinkContainer}>
                  <Text style={styles.loginLinkText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('AccountLogin')}>
                    <Text style={styles.loginLink}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Benefits */}
              <View style={styles.benefitsContainer}>
                {[
                  { title: '7-Day Free Trial', desc: 'No credit card required' },
                  { title: 'Unlimited Employees', desc: 'Add your whole team' },
                  { title: 'Real-time Analytics', desc: 'Track sales instantly' },
                ].map((item, i) => (
                  <View key={i} style={styles.benefitItem}>
                    <View style={styles.benefitIcon}>
                      <Icon name="check" size={14} color="#7CC39F" />
                    </View>
                    <View>
                      <Text style={styles.benefitTitle}>{item.title}</Text>
                      <Text style={styles.benefitDesc}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
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
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
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
    fontSize: 28,
    fontWeight: '800',
    color: '#1F1D2B',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  signUpCard: {
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
  formContainer: {
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
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
    height: 52,
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
    flex: 1,
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
  signUpButton: {
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
  signUpButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  loginLink: {
    color: '#7CC39F',
    fontSize: 14,
    fontWeight: '700',
  },
  benefitsContainer: {
    marginTop: 24,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F1D2B',
  },
  benefitDesc: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#7CC39F',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F1D2B',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  successEmail: {
    color: '#1F1D2B',
    fontWeight: '700',
  },
  successHintContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  successHintText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  goToLoginButton: {
    backgroundColor: '#7CC39F',
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
    shadowColor: '#7CC39F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  goToLoginButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SignUpScreen;
