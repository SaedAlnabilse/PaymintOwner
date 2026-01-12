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

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/api/accounts/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      setSentEmail(email.trim());
      setIsSuccess(true);
    } catch (err: any) {
      // Even if email doesn't exist, we show success for security reasons
      // Backend should handle this gracefully
      setSentEmail(email.trim());
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <Icon name="check-circle" size={48} color="#7CC39F" />
            </View>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successSubtitle}>
              We've sent a password reset link to:{'\n'}
              <Text style={styles.successEmail}>{sentEmail}</Text>
            </Text>

            <View style={styles.successHintContainer}>
              <Text style={styles.successHintText}>
                Didn't receive the email?{' '}
                <Text
                  style={styles.tryAgainLink}
                  onPress={() => setIsSuccess(false)}
                >
                  Try another email
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => navigation.navigate('AccountLogin')}
            >
              <Icon name="arrow-left" size={20} color="#1F1D2B" />
              <Text style={styles.backToLoginButtonText}>Back to Login</Text>
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

              {/* Card */}
              <View style={styles.card}>
                {/* Header */}
                <View style={styles.headerContainer}>
                  <View style={styles.headerIconContainer}>
                    <Icon name="mail" size={32} color="#7CC39F" />
                  </View>
                  <Text style={styles.title}>Forgot Password?</Text>
                  <Text style={styles.subtitle}>
                    No worries, we'll send you reset instructions.
                  </Text>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
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

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#000" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Reset Password</Text>
                    )}
                  </TouchableOpacity>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F1D2B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
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
    fontWeight: '600',
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
  submitButton: {
    backgroundColor: '#7CC39F',
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#7CC39F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
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
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F1D2B',
    marginBottom: 16,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  successEmail: {
    color: '#1F1D2B',
    fontWeight: '800',
  },
  successHintContainer: {
    marginTop: 32,
    marginBottom: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
    alignItems: 'center',
  },
  successHintText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  tryAgainLink: {
    color: '#7CC39F',
    fontWeight: '700',
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  backToLoginButtonText: {
    color: '#1F1D2B',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default ForgotPasswordScreen;
