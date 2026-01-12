import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { apiClient } from '../services/apiClient';

const VerifyEmailScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const token = route.params?.token || '';
  const email = route.params?.email || '';

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setIsVerifying(false);
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      setIsVerifying(true);
      setError('');
      await apiClient.post('/api/auth/verify-email', { token });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. The link may have expired.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('Email address not available. Please sign up again.');
      return;
    }

    try {
      setIsResending(true);
      setError('');
      await apiClient.post('/api/auth/resend-verification', { email });
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  // Verifying state
  if (isVerifying) {
    return (
      <ScreenContainer>
        <View style={[styles.container, { backgroundColor: COLORS.background }]}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#7CC39F" />
            <Text style={[styles.loadingTitle, { color: COLORS.textPrimary }]}>
              Verifying Email...
            </Text>
            <Text style={[styles.loadingSubtitle, { color: COLORS.textSecondary }]}>
              Please wait while we verify your email address.
            </Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <ScreenContainer>
        <View style={[styles.container, { backgroundColor: COLORS.background }]}>
          <View style={styles.centerContent}>
            <View style={styles.successIconContainer}>
              <Icon name="email-check" size={80} color="#7CC39F" />
            </View>
            <Text style={[styles.successTitle, { color: COLORS.textPrimary }]}>Email Verified!</Text>
            <Text style={[styles.successSubtitle, { color: COLORS.textSecondary }]}>
              Your email address has been successfully verified. You can now sign in to your account.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('AccountLogin')}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
              <Icon name="arrow-right" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // Resend success state
  if (resendSuccess) {
    return (
      <ScreenContainer>
        <View style={[styles.container, { backgroundColor: COLORS.background }]}>
          <View style={styles.centerContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="email-send" size={60} color="#1976D2" />
            </View>
            <Text style={[styles.title, { color: COLORS.textPrimary }]}>Email Sent!</Text>
            <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
              We've sent a new verification email to{' '}
              <Text style={styles.emailHighlight}>{email}</Text>. Please check your inbox.
            </Text>
            <View style={[styles.infoCard, { backgroundColor: COLORS.cardBackground }]}>
              <Icon name="information-outline" size={20} color={COLORS.textSecondary} />
              <Text style={[styles.infoText, { color: COLORS.textSecondary }]}>
                The verification link will expire in 24 hours. Don't forget to check your spam folder.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('AccountLogin')}
            >
              <Text style={styles.primaryButtonText}>Go to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // Error or no token state (show waiting for verification)
  return (
    <ScreenContainer>
      <View style={[styles.container, { backgroundColor: COLORS.background }]}>
        <View style={styles.centerContent}>
          {error ? (
            <>
              <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="email-alert" size={60} color="#DC2626" />
              </View>
              <Text style={[styles.title, { color: COLORS.textPrimary }]}>Verification Failed</Text>
              <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>{error}</Text>
            </>
          ) : (
            <>
              <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="email-outline" size={60} color="#D97706" />
              </View>
              <Text style={[styles.title, { color: COLORS.textPrimary }]}>Verify Your Email</Text>
              <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                {email ? (
                  <>
                    We've sent a verification email to{' '}
                    <Text style={styles.emailHighlight}>{email}</Text>. Please click the link in the
                    email to verify your account.
                  </>
                ) : (
                  'Please click the verification link we sent to your email address.'
                )}
              </Text>
            </>
          )}

          <View style={[styles.infoCard, { backgroundColor: COLORS.cardBackground }]}>
            <Icon name="lightbulb-outline" size={20} color="#D97706" />
            <Text style={[styles.infoText, { color: COLORS.textSecondary }]}>
              Didn't receive the email? Check your spam folder or request a new verification link.
            </Text>
          </View>

          {email && (
            <TouchableOpacity
              style={[styles.resendButton, isResending && { opacity: 0.7 }]}
              onPress={handleResendEmail}
              disabled={isResending}
            >
              {isResending ? (
                <ActivityIndicator size="small" color="#7CC39F" />
              ) : (
                <>
                  <Icon name="email-sync" size={20} color="#7CC39F" />
                  <Text style={styles.resendButtonText}>Resend Verification Email</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('AccountLogin')}
          >
            <Icon name="arrow-left" size={16} color={COLORS.textSecondary} />
            <Text style={[styles.backButtonText, { color: COLORS.textSecondary }]}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  successSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emailHighlight: {
    fontWeight: '700',
    color: '#7CC39F',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7CC39F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#7CC39F',
    marginBottom: 16,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7CC39F',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VerifyEmailScreen;
