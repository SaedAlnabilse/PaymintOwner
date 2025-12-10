import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment-timezone';
import { fetchOrderById, fetchOrderByOrderNumber } from '../services/inventory';
import { fetchUserName } from '../services/reports';
import { OrderDetails, OrderItem } from '../types/reports';

interface BasicOrderInfo {
  id: string;
  orderNumber: number;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  employeeName: string;
  isRefunded: boolean;
  refundReason: string | null;
}

interface Props {
  route: {
    params: {
      orderId: string;
      orderNumber?: number;
      basicOrderInfo?: BasicOrderInfo;
    };
  };
  navigation: any;
}

const ReceiptDetailScreen = ({ route, navigation }: Props) => {
  const { orderId, orderNumber, basicOrderInfo } = route.params;
  const [receipt, setReceipt] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingBasicInfo, setUsingBasicInfo] = useState(false);

  useEffect(() => {
    const loadReceipt = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setUsingBasicInfo(false);

        let data: OrderDetails | null = null;

        // Try fetching by order number first (more reliable in POS systems)
        if (orderNumber) {
          try {
            data = await fetchOrderByOrderNumber(orderNumber);
          } catch (err) {
            console.log('Failed to fetch by order number, trying by ID...', err);
          }
        }

        // If that fails, try by ID
        if (!data && orderId) {
          try {
            data = await fetchOrderById(orderId);
          } catch (err) {
            console.log('Failed to fetch by ID:', err);
          }
        }

        if (data) {
          // Fix unknown employee name
          // Check both employeeId and userId, prioritizing employeeId if available
          const idToFetch = data.employeeId || (data as any).userId;
          
          if ((!data.employeeName || data.employeeName === 'Unknown') && idToFetch) {
            try {
              console.log('🔍 Fetching missing employee name for ID:', idToFetch);
              const name = await fetchUserName(idToFetch);
              if (name) {
                console.log('✅ Found employee name:', name);
                data.employeeName = name;
              }
            } catch (err) {
              console.log('Failed to fetch user name for receipt:', err);
            }
          }
          setReceipt(data);
        } else if (basicOrderInfo) {
          // Use fallback basic order info
          setUsingBasicInfo(true);
          setReceipt({
            id: basicOrderInfo.id,
            orderNumber: basicOrderInfo.orderNumber,
            totalAmount: basicOrderInfo.total,
            status: basicOrderInfo.status,
            items: [],
            createdAt: basicOrderInfo.createdAt,
            total: basicOrderInfo.total,
            subtotal: basicOrderInfo.total,
            tax: 0,
            paymentMethod: basicOrderInfo.paymentMethod as any,
            discount: null,
            taxes: [],
            employeeName: basicOrderInfo.employeeName,
            refundReason: basicOrderInfo.refundReason,
            isRefunded: basicOrderInfo.isRefunded,
          });
        } else {
          setError('Order not found. The details may not be available yet.');
        }
      } catch (err: any) {
        console.error('Failed to fetch receipt:', err);
        setError(err?.response?.data?.message || 'Failed to load receipt details');
      } finally {
        setIsLoading(false);
      }
    };
    loadReceipt();
  }, [orderId, orderNumber, basicOrderInfo]);

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} JOD`;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      CASH: 'Cash',
      cash: 'Cash',
      CARD: 'Card',
      card: 'Card',
      OTHER: 'Other',
      BILLING: 'Billing',
      TALABAT: 'Talabat',
      CAREEM: 'Careem',
      APPLE_PAY: 'Apple Pay',
      ZAIN_CASH: 'Zain Cash',
    };
    return methods[method] || method;
  };

  const calculateItemTotal = (item: OrderItem) => {
    const baseWithAttributes =
      item.basePrice +
      (item.itemSubAttributes || []).reduce((sum, sa) => {
        return item.selectedSubAttributeIds?.includes(sa.subAttribute.id)
          ? sum + (sa.subAttribute.price || 0)
          : sum;
      }, 0);
    const discountAmount = item.discount
      ? baseWithAttributes * item.discount.percentage * item.quantity
      : 0;
    return baseWithAttributes * item.quantity - discountAmount;
  };

  const calculateDiscountAmount = () => {
    if (!receipt) return 0;
    return receipt.items.reduce((sum, item) => {
      const baseWithAttributes =
        item.basePrice +
        (item.itemSubAttributes || []).reduce((subSum, sa) => {
          return item.selectedSubAttributeIds?.includes(sa.subAttribute.id)
            ? subSum + (sa.subAttribute.price || 0)
            : subSum;
        }, 0);
      return sum + (item.discount
        ? baseWithAttributes * item.quantity * item.discount.percentage
        : 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7CC39F" />
        <Text style={styles.loadingText}>Loading receipt...</Text>
      </View>
    );
  }

  if (error || !receipt) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcon name="error-outline" size={60} color="#D55263" />
        <Text style={styles.errorText}>{error || 'Receipt not found'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBackButton}
          >
            <View style={styles.backButtonCircle}>
              <Icon name="arrow-left" size={20} color="#1F1D2B" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>Order Details</Text>
            <Text style={styles.headerTitle}>Receipt #{receipt.orderNumber}</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Status Badge */}
        <View style={styles.statusBadgeContainer}>
          <View style={[
            styles.statusBadge,
            receipt.isRefunded ? styles.statusBadgeRefunded : styles.statusBadgePaid
          ]}>
            <MaterialCommunityIcon
              name={receipt.isRefunded ? "cash-refund" : "check-circle"}
              size={20}
              color={receipt.isRefunded ? "#D55263" : "#7CC39F"}
            />
            <Text style={[
              styles.statusBadgeText,
              receipt.isRefunded ? styles.statusBadgeTextRefunded : styles.statusBadgeTextPaid
            ]}>
              {receipt.isRefunded ? "REFUNDED" : "PAID"}
            </Text>
          </View>
        </View>

        {/* Payment Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcon name="credit-card-outline" size={24} color="#7CC39F" />
            <Text style={styles.cardTitle}>Payment Information</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcon name="cash" size={16} color="#737182" />
              <Text style={styles.infoLabel}>Payment Method</Text>
              <Text style={styles.infoValue}>{getPaymentMethodLabel(receipt.paymentMethod)}</Text>
            </View>

            <View style={styles.infoItem}>
              <MaterialCommunityIcon name="calendar" size={16} color="#737182" />
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>
                {moment(receipt.createdAt).tz('Asia/Amman').format('MMM D, YYYY')}
              </Text>
              <Text style={styles.infoValueSecondary}>
                {moment(receipt.createdAt).tz('Asia/Amman').format('hh:mm A')}
              </Text>
            </View>

            {receipt.employeeName && (
              <View style={styles.infoItem}>
                <MaterialCommunityIcon name="account" size={16} color="#737182" />
                <Text style={styles.infoLabel}>Served By</Text>
                <Text style={styles.infoValue}>{receipt.employeeName}</Text>
              </View>
            )}

            {receipt.invoiceNumber && (
              <View style={styles.infoItem}>
                <MaterialCommunityIcon name="file-document" size={16} color="#737182" />
                <Text style={styles.infoLabel}>Invoice Number</Text>
                <Text style={styles.infoValue}>{receipt.invoiceNumber}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Order Note */}
        {receipt.note && (
          <View style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <MaterialCommunityIcon name="note-text" size={18} color="#D0C962" />
              <Text style={styles.noteTitle}>Order Note</Text>
            </View>
            <Text style={styles.noteText}>{receipt.note}</Text>
          </View>
        )}

        {/* Limited Info Warning */}
        {usingBasicInfo && (
          <View style={styles.warningCard}>
            <MaterialIcon name="info" size={18} color="#D0C962" />
            <Text style={styles.warningText}>
              Detailed item information not available
            </Text>
          </View>
        )}

        {/* Items List */}
        {receipt.items.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcon name="shopping" size={24} color="#7CC39F" />
              <Text style={styles.cardTitle}>Order Items</Text>
              <View style={styles.itemsCountBadge}>
                <Text style={styles.itemsCountText}>{receipt.items.length}</Text>
              </View>
            </View>

            <View style={styles.itemsList}>
              {receipt.items.map((item, index) => {
                const selectedSubAttrs = item.itemSubAttributes?.filter(sa =>
                  item.selectedSubAttributeIds?.includes(sa.subAttribute.id)
                ) || [];
                const itemTotal = calculateItemTotal(item);

                return (
                  <View key={`${item.id}-${index}`} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemQuantityBadge}>
                        <Text style={styles.itemQuantityText}>{item.quantity}x</Text>
                      </View>
                      <Text style={styles.itemName}>{item.name}</Text>
                    </View>

                    {selectedSubAttrs.length > 0 && (
                      <View style={styles.itemModifiersContainer}>
                        {selectedSubAttrs.map((sa, idx) => (
                          <View key={idx} style={styles.modifierChip}>
                            <MaterialCommunityIcon name="plus-circle" size={12} color="#7CC39F" />
                            <Text style={styles.modifierText}>{sa.subAttribute.name}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {item.discount && (
                      <View style={styles.itemDiscountBadge}>
                        <MaterialCommunityIcon name="tag" size={12} color="#D55263" />
                        <Text style={styles.itemDiscountText}>
                          {item.discount.name} (-{(item.discount.percentage * 100).toFixed(0)}%)
                        </Text>
                      </View>
                    )}

                    {item.note && (
                      <View style={styles.itemNoteContainer}>
                        <MaterialCommunityIcon name="message-text" size={12} color="#D0C962" />
                        <Text style={styles.itemNoteText}>{item.note}</Text>
                      </View>
                    )}

                    <View style={styles.itemFooter}>
                      <Text style={styles.itemPriceLabel}>Item Total</Text>
                      <Text style={styles.itemPrice}>{itemTotal.toFixed(2)} JOD</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Totals Card */}
        <View style={styles.totalsCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcon name="calculator" size={24} color="#7CC39F" />
            <Text style={styles.cardTitle}>Order Summary</Text>
          </View>

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{receipt.subtotal.toFixed(2)} JOD</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={[styles.totalValue, styles.discountValue]}>
                {calculateDiscountAmount().toFixed(2)} JOD
              </Text>
            </View>

            {receipt.taxes && receipt.taxes.length > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Tax ({receipt.taxes.reduce((acc, tax) => acc + (tax.is_active ? tax.rate : 0), 0).toFixed(0)}%)
                </Text>
                <Text style={styles.totalValue}>{receipt.tax.toFixed(2)} JOD</Text>
              </View>
            ) : (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>{receipt.tax.toFixed(2)} JOD</Text>
              </View>
            )}

            {(receipt.paymentMethod === 'CASH' || receipt.paymentMethod === 'cash') && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Cash Tendered</Text>
                  <Text style={styles.totalValue}>{(receipt.cashTendered || receipt.total).toFixed(2)} JOD</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Change</Text>
                  <Text style={styles.totalValue}>{(receipt.change || 0).toFixed(2)} JOD</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.grandTotalContainer}>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.grandTotalValue}>{receipt.total.toFixed(2)} JOD</Text>
            </View>
          </View>
        </View>

        {/* Refund Info */}
        {receipt.isRefunded && (
          <View style={styles.refundCard}>
            <View style={styles.refundHeader}>
              <MaterialCommunityIcon name="alert-circle" size={24} color="#D55263" />
              <Text style={styles.refundTitle}>Order Refunded</Text>
            </View>
            {receipt.refundReason && (
              <View style={styles.refundReasonContainer}>
                <Text style={styles.refundReasonLabel}>Reason:</Text>
                <Text style={styles.refundReasonText}>{receipt.refundReason}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Base Container
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    color: '#737182',
    fontSize: 16,
    fontWeight: '500',
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#D55263',
    textAlign: 'center',
    fontWeight: '500',
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#7CC39F',
    borderRadius: 12,
    shadowColor: '#7CC39F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Header
  headerGradient: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#7CC39F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerBackButton: {
    marginRight: 12,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7CC39F',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F1D2B',
    letterSpacing: -0.5,
  },
  headerRight: {
    width: 40,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  // Status Badge
  statusBadgeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadgePaid: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeRefunded: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusBadgeTextPaid: {
    color: '#059669',
  },
  statusBadgeTextRefunded: {
    color: '#DC2626',
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1D2B',
    letterSpacing: -0.3,
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#737182',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1D2B',
  },
  infoValueSecondary: {
    fontSize: 13,
    fontWeight: '500',
    color: '#737182',
  },

  // Note Card
  noteCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#D0C962',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },

  // Warning Card
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },

  // Items
  itemsCountBadge: {
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemsCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7CC39F',
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  itemQuantityBadge: {
    backgroundColor: '#7CC39F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemQuantityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1D2B',
  },
  itemModifiersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  modifierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#7CC39F',
  },
  modifierText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7CC39F',
  },
  itemDiscountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 6,
  },
  itemDiscountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D55263',
  },
  itemNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    marginBottom: 8,
  },
  itemNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    fontStyle: 'italic',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  itemPriceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#737182',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1D2B',
  },

  // Totals
  totalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  totalsSection: {
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#737182',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 15,
    color: '#1F1D2B',
    fontWeight: '600',
  },
  discountValue: {
    color: '#D55263',
  },
  grandTotalContainer: {
    backgroundColor: '#7CC39F',
    marginHorizontal: -20,
    marginBottom: -20,
    marginTop: 20,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  // Refund Card
  refundCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#D55263',
  },
  refundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  refundTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  refundReasonContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
  },
  refundReasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  refundReasonText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
});

export default ReceiptDetailScreen;
