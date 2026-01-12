import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { RootState } from '../store/store';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
}

const BillingScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const { account, establishments } = useSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with actual API calls
  const [invoices] = useState<Invoice[]>([
    {
      id: '1',
      date: '2024-01-01',
      amount: 20,
      status: 'paid',
      description: 'Monthly subscription - January 2024',
    },
    {
      id: '2',
      date: '2024-02-01',
      amount: 20,
      status: 'paid',
      description: 'Monthly subscription - February 2024',
    },
    {
      id: '3',
      date: '2024-03-01',
      amount: 20,
      status: 'pending',
      description: 'Monthly subscription - March 2024',
    },
  ]);

  const activeEstablishments = establishments.filter(
    (e) => e.subscriptionStatus === 'ACTIVE' || e.subscriptionStatus === 'TRIALING'
  );
  const monthlyFee = 20 * activeEstablishments.length;

  const onRefresh = () => {
    setRefreshing(true);
    // Fetch billing data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: '#E8F5E9', color: '#2E7D32', text: 'Paid' };
      case 'pending':
        return { bg: '#FFF3E0', color: '#EF6C00', text: 'Pending' };
      case 'failed':
        return { bg: '#FFEBEE', color: '#C62828', text: 'Failed' };
      default:
        return { bg: '#F5F5F5', color: '#757575', text: 'Unknown' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={[styles.container, { backgroundColor: COLORS.background }]}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7CC39F']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitle}>
              <View style={styles.headerIconContainer}>
                <Icon name="credit-card" size={28} color="#000" />
              </View>
              <View>
                <Text style={[styles.title, { color: COLORS.textPrimary }]}>Billing</Text>
                <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                  Manage subscription & payments
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Current Plan */}
        <View style={[styles.planCard, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.planHeader}>
            <View style={[styles.planBadge, { backgroundColor: '#F0FDF4' }]}>
              <Icon name="crown" size={20} color="#7CC39F" />
              <Text style={styles.planBadgeText}>Current Plan</Text>
            </View>
          </View>
          <Text style={[styles.planName, { color: COLORS.textPrimary }]}>Standard Monthly</Text>
          <View style={styles.planPricing}>
            <Text style={[styles.planPrice, { color: '#7CC39F' }]}>{monthlyFee} JOD</Text>
            <Text style={[styles.planPeriod, { color: COLORS.textSecondary }]}>/month</Text>
          </View>
          <Text style={[styles.planDescription, { color: COLORS.textSecondary }]}>
            20 JOD × {activeEstablishments.length} active location(s)
          </Text>
          <TouchableOpacity style={styles.managePlanButton}>
            <Text style={styles.managePlanButtonText}>Manage Subscription</Text>
            <Icon name="chevron-right" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Active Locations */}
        <View style={[styles.section, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="store" size={20} color="#1976D2" />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
                Active Locations
              </Text>
              <Text style={[styles.sectionSubtitle, { color: COLORS.textSecondary }]}>
                {activeEstablishments.length} establishment(s) billed
              </Text>
            </View>
          </View>
          {activeEstablishments.map((est, index) => (
            <View
              key={est.id}
              style={[
                styles.locationItem,
                index < activeEstablishments.length - 1 && styles.locationItemBorder,
              ]}
            >
              <View style={[styles.locationIcon, { backgroundColor: COLORS.backgroundSecondary }]}>
                <Icon name="store-outline" size={20} color={COLORS.textSecondary} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationName, { color: COLORS.textPrimary }]}>{est.name}</Text>
                <Text style={[styles.locationType, { color: COLORS.textSecondary }]}>
                  {est.type} • {est.currency}
                </Text>
              </View>
              <View
                style={[
                  styles.locationStatusBadge,
                  {
                    backgroundColor:
                      est.subscriptionStatus === 'ACTIVE' ? '#E8F5E9' : '#FFF3E0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.locationStatusText,
                    {
                      color: est.subscriptionStatus === 'ACTIVE' ? '#2E7D32' : '#EF6C00',
                    },
                  ]}
                >
                  {est.subscriptionStatus}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={[styles.section, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Icon name="credit-card-outline" size={20} color="#EF6C00" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
                Payment Method
              </Text>
              <Text style={[styles.sectionSubtitle, { color: COLORS.textSecondary }]}>
                Your saved payment method
              </Text>
            </View>
          </View>
          <View style={styles.paymentMethodCard}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#1A1A2E' }]}>
              <Icon name="credit-card" size={24} color="#FFF" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardNumber, { color: COLORS.textPrimary }]}>
                •••• •••• •••• 4242
              </Text>
              <Text style={[styles.cardExpiry, { color: COLORS.textSecondary }]}>
                Expires 12/25
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.changeCardButton, { backgroundColor: COLORS.backgroundSecondary }]}
            >
              <Text style={[styles.changeCardButtonText, { color: COLORS.textSecondary }]}>
                Change
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addPaymentButton}>
            <Icon name="plus" size={18} color="#7CC39F" />
            <Text style={styles.addPaymentButtonText}>Add New Payment Method</Text>
          </TouchableOpacity>
        </View>

        {/* Invoices */}
        <View style={[styles.section, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F3E8FF' }]}>
              <Icon name="file-document-outline" size={20} color="#9333EA" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>Invoices</Text>
              <Text style={[styles.sectionSubtitle, { color: COLORS.textSecondary }]}>
                Your billing history
              </Text>
            </View>
          </View>
          {invoices.map((invoice, index) => {
            const statusStyle = getStatusStyle(invoice.status);
            return (
              <TouchableOpacity
                key={invoice.id}
                style={[
                  styles.invoiceItem,
                  index < invoices.length - 1 && styles.invoiceItemBorder,
                ]}
              >
                <View style={styles.invoiceInfo}>
                  <Text style={[styles.invoiceDate, { color: COLORS.textPrimary }]}>
                    {formatDate(invoice.date)}
                  </Text>
                  <Text style={[styles.invoiceDescription, { color: COLORS.textSecondary }]}>
                    {invoice.description}
                  </Text>
                </View>
                <View style={styles.invoiceRight}>
                  <Text style={[styles.invoiceAmount, { color: COLORS.textPrimary }]}>
                    {invoice.amount} JOD
                  </Text>
                  <View style={[styles.invoiceStatusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.invoiceStatusText, { color: statusStyle.color }]}>
                      {statusStyle.text}
                    </Text>
                  </View>
                </View>
                <Icon name="download" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Support */}
        <View style={[styles.supportCard, { backgroundColor: COLORS.cardBackground }]}>
          <View style={[styles.supportIcon, { backgroundColor: '#E8F5E9' }]}>
            <Icon name="headphones" size={24} color="#2E7D32" />
          </View>
          <View style={styles.supportInfo}>
            <Text style={[styles.supportTitle, { color: COLORS.textPrimary }]}>Need Help?</Text>
            <Text style={[styles.supportText, { color: COLORS.textSecondary }]}>
              Contact our support team for billing inquiries.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: COLORS.backgroundSecondary }]}
          >
            <Text style={[styles.contactButtonText, { color: COLORS.textPrimary }]}>Contact</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
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
  planCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  planHeader: {
    marginBottom: 16,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7CC39F',
  },
  planName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '800',
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  planDescription: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
  },
  managePlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7CC39F',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  managePlanButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  locationItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '700',
  },
  locationType: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  locationStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  locationStatusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  cardIconContainer: {
    width: 48,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardExpiry: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  changeCardButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeCardButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#7CC39F',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addPaymentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7CC39F',
  },
  invoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  invoiceItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceDate: {
    fontSize: 15,
    fontWeight: '700',
  },
  invoiceDescription: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  invoiceRight: {
    alignItems: 'flex-end',
    marginRight: 14,
  },
  invoiceAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  invoiceStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  invoiceStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  supportCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  supportInfo: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  supportText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  contactButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  contactButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default BillingScreen;
