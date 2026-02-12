import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { RootState } from '../store/store';
import { apiClient } from '../services/apiClient';

interface AccountDetails {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  establishmentLoginId?: string;
  createdAt: string;
  lastLoginAt?: string;
  emailVerified: boolean;
}

interface EstablishmentCredentials {
  id: string;
  name: string;
  establishmentLoginId: string;
  type: string;
  subscriptionStatus: string;
  createdAt: string;
}

interface BrandCredentials {
  id: string;
  name: string;
  establishmentLoginId: string;
  establishmentsCount: number;
  createdAt: string;
}

const AccountManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const { account, establishments } = useSelector((state: RootState) => state.auth);

  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [brands, setBrands] = useState<BrandCredentials[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    try {
      if (!refreshing) setIsLoading(true);

      // Fetch account details
      const accountResponse = await apiClient.get('/api/account/profile');
      setAccountDetails(accountResponse.data);

      // Fetch brands
      const brandsResponse = await apiClient.get('/api/brands');
      setBrands(brandsResponse.data || []);
    } catch (err) {
      console.error('Failed to fetch account data:', err);
      // Use Redux data as fallback
      if (account) {
        setAccountDetails({
          id: account.id,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          emailVerified: account.emailVerified || false,
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAccountData();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: '#E8F5E9', color: '#2E7D32', text: 'Active' };
      case 'TRIALING':
        return { bg: '#E3F2FD', color: '#1976D2', text: 'Trial' };
      case 'PAST_DUE':
        return { bg: '#FFEBEE', color: '#C62828', text: 'Past Due' };
      default:
        return { bg: '#F5F5F5', color: '#757575', text: status };
    }
  };

  if (isLoading && !accountDetails) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7CC39F" />
          <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
            Loading account information...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7CC39F']} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitle}>
              <View style={styles.headerIconContainer}>
                <Icon name="account-cog" size={28} color="#000" />
              </View>
              <View>
                <Text style={[styles.title, { color: COLORS.textPrimary }]}>Account Management</Text>
                <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                  View your credentials & info
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="account-circle" size={22} color="#7CC39F" />
            <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>Account Information</Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Icon name="account" size={18} color={COLORS.textSecondary} />
                <Text style={[styles.infoLabelText, { color: COLORS.textSecondary }]}>Full Name</Text>
              </View>
              <Text style={[styles.infoValue, { color: COLORS.textPrimary }]}>
                {accountDetails?.firstName} {accountDetails?.lastName}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Icon name="email" size={18} color={COLORS.textSecondary} />
                <Text style={[styles.infoLabelText, { color: COLORS.textSecondary }]}>Email</Text>
              </View>
              <View style={styles.infoValueRow}>
                <Text style={[styles.infoValue, { color: COLORS.textPrimary }]}>
                  {accountDetails?.email}
                </Text>
                {accountDetails?.emailVerified && (
                  <View style={styles.verifiedBadge}>
                    <Icon name="check-circle" size={14} color="#2E7D32" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Icon name="calendar" size={18} color={COLORS.textSecondary} />
                <Text style={[styles.infoLabelText, { color: COLORS.textSecondary }]}>Member Since</Text>
              </View>
              <Text style={[styles.infoValue, { color: COLORS.textPrimary }]}>
                {formatDate(accountDetails?.createdAt || '')}
              </Text>
            </View>
          </View>
        </View>

        {/* Account POS Credentials */}
        {accountDetails?.establishmentLoginId && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="key-variant" size={22} color="#9333EA" />
              <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>Account POS Login</Text>
            </View>

            <View style={[styles.credentialCard, { backgroundColor: COLORS.cardBackground }]}>
              <View style={styles.credentialHeader}>
                <View style={[styles.credentialIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Icon name="login" size={24} color="#9333EA" />
                </View>
                <View style={styles.credentialInfo}>
                  <Text style={[styles.credentialTitle, { color: COLORS.textPrimary }]}>
                    Master POS Credentials
                  </Text>
                  <Text style={[styles.credentialDesc, { color: COLORS.textSecondary }]}>
                    Use these to log into any of your establishments
                  </Text>
                </View>
              </View>

              <View style={styles.credentialDetails}>
                <View style={styles.credentialRow}>
                  <Text style={[styles.credentialLabel, { color: COLORS.textSecondary }]}>Login ID</Text>
                  <View style={styles.credentialValueRow}>
                    <Text style={[styles.credentialValue, { color: COLORS.textPrimary }]}>
                      {accountDetails.establishmentLoginId}
                    </Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => copyToClipboard(accountDetails.establishmentLoginId!, 'Login ID')}
                    >
                      <Icon name="content-copy" size={18} color="#7CC39F" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.credentialRow}>
                  <Text style={[styles.credentialLabel, { color: COLORS.textSecondary }]}>Password</Text>
                  <View style={styles.passwordNote}>
                    <Icon name="information" size={16} color={COLORS.textSecondary} />
                    <Text style={[styles.passwordNoteText, { color: COLORS.textSecondary }]}>
                      Password set during account creation
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Establishments Credentials */}
        {establishments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="store" size={22} color="#1976D2" />
              <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
                Establishments ({establishments.length})
              </Text>
            </View>

            {establishments.map((establishment) => {
              const statusStyle = getStatusStyle(establishment.subscriptionStatus);
              return (
                <View
                  key={establishment.id}
                  style={[styles.credentialCard, { backgroundColor: COLORS.cardBackground }]}
                >
                  <View style={styles.credentialHeader}>
                    <View style={[styles.credentialIcon, { backgroundColor: '#E3F2FD' }]}>
                      <Icon name="store-outline" size={24} color="#1976D2" />
                    </View>
                    <View style={styles.credentialInfo}>
                      <Text style={[styles.credentialTitle, { color: COLORS.textPrimary }]}>
                        {establishment.name}
                      </Text>
                      <View style={styles.credentialMeta}>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                          <Text style={[styles.statusText, { color: statusStyle.color }]}>
                            {statusStyle.text}
                          </Text>
                        </View>
                        <Text style={[styles.credentialType, { color: COLORS.textSecondary }]}>
                          {establishment.type}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.credentialDetails}>
                    <View style={styles.credentialRow}>
                      <Text style={[styles.credentialLabel, { color: COLORS.textSecondary }]}>
                        Establishment Login ID
                      </Text>
                      <View style={styles.credentialValueRow}>
                        <Text style={[styles.credentialValue, { color: COLORS.textPrimary }]}>
                          {establishment.establishmentLoginId}
                        </Text>
                        <TouchableOpacity
                          style={styles.copyButton}
                          onPress={() =>
                            copyToClipboard(establishment.establishmentLoginId, 'Establishment Login ID')
                          }
                        >
                          <Icon name="content-copy" size={18} color="#7CC39F" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.credentialRow}>
                      <Text style={[styles.credentialLabel, { color: COLORS.textSecondary }]}>
                        Password
                      </Text>
                      <View style={styles.passwordNote}>
                        <Icon name="information" size={16} color={COLORS.textSecondary} />
                        <Text style={[styles.passwordNoteText, { color: COLORS.textSecondary }]}>
                          Password set during establishment creation
                        </Text>
                      </View>
                    </View>

                    <View style={styles.credentialRow}>
                      <Text style={[styles.credentialLabel, { color: COLORS.textSecondary }]}>
                        Currency
                      </Text>
                      <Text style={[styles.credentialValue, { color: COLORS.textPrimary }]}>
                        {establishment.currency}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Brands Credentials */}
        {brands.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="tag-heart" size={22} color="#9333EA" />
              <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
                Brands ({brands.length})
              </Text>
            </View>

            {brands.map((brand) => (
              <View
                key={brand.id}
                style={[styles.credentialCard, { backgroundColor: COLORS.cardBackground }]}
              >
                <View style={styles.credentialHeader}>
                  <View style={[styles.credentialIcon, { backgroundColor: '#F3E8FF' }]}>
                    <Icon name="tag-heart" size={24} color="#9333EA" />
                  </View>
                  <View style={styles.credentialInfo}>
                    <Text style={[styles.credentialTitle, { color: COLORS.textPrimary }]}>
                      {brand.name}
                    </Text>
                    <Text style={[styles.credentialDesc, { color: COLORS.textSecondary }]}>
                      {brand.establishmentsCount} establishment
                      {brand.establishmentsCount !== 1 ? 's' : ''} linked
                    </Text>
                  </View>
                </View>

                <View style={styles.credentialDetails}>
                  <View style={styles.credentialRow}>
                    <Text style={[styles.credentialLabel, { color: COLORS.textSecondary }]}>
                      Brand Login ID
                    </Text>
                    <View style={styles.credentialValueRow}>
                      <Text style={[styles.credentialValue, { color: COLORS.textPrimary }]}>
                        {brand.establishmentLoginId}
                      </Text>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => copyToClipboard(brand.establishmentLoginId, 'Brand Login ID')}
                      >
                        <Icon name="content-copy" size={18} color="#7CC39F" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.credentialRow}>
                    <Text style={[styles.credentialLabel, { color: COLORS.textSecondary }]}>
                      Password
                    </Text>
                    <View style={styles.passwordNote}>
                      <Icon name="information" size={16} color={COLORS.textSecondary} />
                      <Text style={[styles.passwordNoteText, { color: COLORS.textSecondary }]}>
                        Password set during brand creation
                      </Text>
                    </View>
                  </View>

                  <View style={styles.credentialRow}>
                    <Text style={[styles.credentialLabel, { color: COLORS.textSecondary }]}>
                      Created
                    </Text>
                    <Text style={[styles.credentialValue, { color: COLORS.textPrimary }]}>
                      {formatDate(brand.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* No Data State */}
        {establishments.length === 0 && brands.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: COLORS.backgroundSecondary }]}>
              <Icon name="store-off" size={48} color={COLORS.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>
              No establishments or brands yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
              Create your first establishment to get started with PayMint.
            </Text>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    contentContainer: {
      paddingBottom: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 14,
      fontWeight: '500',
    },
    header: {
      padding: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      marginBottom: 20,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: '#7CC39F',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: '500',
      marginTop: 2,
    },
    section: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
    },
    infoCard: {
      borderRadius: 16,
      padding: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    infoLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    infoLabelText: {
      fontSize: 14,
      fontWeight: '500',
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    infoValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#E8F5E9',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    verifiedText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#2E7D32',
    },
    divider: {
      height: 1,
      backgroundColor: '#F1F5F9',
    },
    credentialCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    credentialHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
      marginBottom: 16,
    },
    credentialIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    credentialInfo: {
      flex: 1,
    },
    credentialTitle: {
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 4,
    },
    credentialDesc: {
      fontSize: 13,
      fontWeight: '500',
    },
    credentialMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 4,
    },
    credentialType: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    credentialDetails: {
      backgroundColor: '#F8FAFC',
      borderRadius: 12,
      padding: 14,
    },
    credentialRow: {
      marginBottom: 12,
    },
    credentialLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    credentialValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    credentialValue: {
      fontSize: 15,
      fontWeight: '600',
      flex: 1,
    },
    copyButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: '#E8F5E9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    passwordNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    passwordNoteText: {
      fontSize: 13,
      fontWeight: '500',
      fontStyle: 'italic',
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingTop: 60,
    },
    emptyIcon: {
      width: 100,
      height: 100,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default AccountManagementScreen;
