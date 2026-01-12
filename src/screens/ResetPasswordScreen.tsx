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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { apiClient } from '../services/apiClient';

const ResetPasswordScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const token = route.params?.token || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (pwd: string) => {
    const hasMinLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);

    return { hasMinLength, hasUpperCase, hasLowerCase, hasNumber };
  };

  const passwordChecks = validatePassword(password);
  const isPasswordValid = Object.values(passwordChecks).every((check) => check);

  const handleResetPassword = async () => {
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/api/auth/reset-password', {
        token,
        password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <ScreenContainer>
        <View style={[styles.container, { backgroundColor: COLORS.background }]}>
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <Icon name="check-circle" size={80} color="#7CC39F" />
            </View>
            <Text style={[styles.successTitle, { color: COLORS.textPrimary }]}>Password Reset!</Text>
            <Text style={[styles.successSubtitle, { color: COLORS.textSecondary }]}>
              Your password has been successfully reset. You can now sign in with your new password.
            </Text>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => navigation.navigate('AccountLogin')}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: COLORS.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <Icon name="lock-reset" size={40} color="#000" />
            </View>
            <Text style={[styles.title, { color: COLORS.textPrimary }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
              Create a new secure password for your account
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.formCard, { backgroundColor: COLORS.cardBackground }]}>
            {error ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: COLORS.textSecondary }]}>New Password</Text>
              <View style={[styles.inputContainer, { backgroundColor: COLORS.backgroundSecondary }]}>
                <Icon name="lock-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={[styles.input, { color: COLORS.textPrimary }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <View style={styles.requirementRow}>
                <Icon
                  name={passwordChecks.hasMinLength ? 'check-circle' : 'circle-outline'}
                  size={16}
                  color={passwordChecks.hasMinLength ? '#7CC39F' : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.requirementText,
                    { color: passwordChecks.hasMinLength ? '#7CC39F' : COLORS.textSecondary },
                  ]}
                >
                  At least 8 characters
                </Text>
              </View>
              <View style={styles.requirementRow}>
                <Icon
                  name={passwordChecks.hasUpperCase ? 'check-circle' : 'circle-outline'}
                  size={16}
                  color={passwordChecks.hasUpperCase ? '#7CC39F' : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.requirementText,
                    { color: passwordChecks.hasUpperCase ? '#7CC39F' : COLORS.textSecondary },
                  ]}
                >
                  One uppercase letter
                </Text>
              </View>
              <View style={styles.requirementRow}>
                <Icon
                  name={passwordChecks.hasLowerCase ? 'check-circle' : 'circle-outline'}
                  size={16}
                  color={passwordChecks.hasLowerCase ? '#7CC39F' : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.requirementText,
                    { color: passwordChecks.hasLowerCase ? '#7CC39F' : COLORS.textSecondary },
                  ]}
                >
                  One lowercase letter
                </Text>
              </View>
              <View style={styles.requirementRow}>
                <Icon
                  name={passwordChecks.hasNumber ? 'check-circle' : 'circle-outline'}
                  size={16}
                  color={passwordChecks.hasNumber ? '#7CC39F' : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.requirementText,
                    { color: passwordChecks.hasNumber ? '#7CC39F' : COLORS.textSecondary },
                  ]}
                >
                  One number
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: COLORS.textSecondary }]}>Confirm Password</Text>
              <View style={[styles.inputContainer, { backgroundColor: COLORS.backgroundSecondary }]}>
                <Icon name="lock-check" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={[styles.input, { color: COLORS.textPrimary }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Icon
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.matchError}>Passwords do not match</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Reset Password</Text>
                  <Icon name="arrow-right" size={20} color="#000" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backToLoginContainer}
            onPress={() => navigation.navigate('AccountLogin')}
          >
            <Icon name="arrow-left" size={16} color="#7CC39F" />
            <Text style={styles.backToLoginText}>Back to Sign In</Text>
          </TouchableOpacity>
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
    padding: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#7CC39F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
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
  requirementsContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchError: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 6,
    marginLeft: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    backgroundColor: '#7CC39F',
    borderRadius: 14,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7CC39F',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  signInButton: {
    backgroundColor: '#7CC39F',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});

export default ResetPasswordScreen;
