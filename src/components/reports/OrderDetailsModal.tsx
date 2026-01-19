import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Pressable,
    Alert,
    TextInput
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment-timezone';
import { OrderDetails } from '../../types/reports';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../services/apiClient';

interface OrderDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    order: OrderDetails | null;
    isLoading?: boolean;
    onRefundSuccess?: () => void;
}

const REFUND_REASONS = [
    'Customer request',
    'Wrong order',
    'Quality issue',
    'Item not available',
    'Other',
];

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
    visible,
    onClose,
    order,
    isLoading,
    onRefundSuccess,
}) => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);

    const [showRefundModal, setShowRefundModal] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [isProcessingRefund, setIsProcessingRefund] = useState(false);

    if (!visible) return null;

    const canRefund = order &&
        order.status !== 'REFUNDED' &&
        order.status !== 'HELD' &&
        !order.isRefunded;

    const handleRefund = async () => {
        if (!order) return;

        const reason = selectedReason === 'Other' ? customReason : selectedReason;
        if (!reason.trim()) {
            Alert.alert('Error', 'Please select or enter a refund reason');
            return;
        }

        setIsProcessingRefund(true);
        try {
            await apiClient.post(`/api/orders/${order.id}/refund`, { reason });
            Alert.alert('Success', 'Order has been refunded successfully');
            setShowRefundModal(false);
            setSelectedReason('');
            setCustomReason('');
            onRefundSuccess?.();
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to process refund');
        } finally {
            setIsProcessingRefund(false);
        }
    };

    // Helper to calculate total discount percentage if not provided directly
    const discountPercentage = order && order.subtotal > 0 && order.discountAmount
        ? Math.round((order.discountAmount / order.subtotal) * 100)
        : 0;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.modalOverlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Receipt Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : order ? (
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.content}
                            showsVerticalScrollIndicator={true}
                            bounces={true}
                        >
                            {/* Receipt Header Info */}
                            <View style={styles.receiptHeader}>
                                <View style={styles.orderMeta}>
                                    <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
                                    <View style={[
                                        styles.statusBadge,
                                        order.status === 'COMPLETED' ? styles.statusBadgeCompleted : styles.statusBadgeCancelled
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            order.status === 'COMPLETED' ? styles.statusTextCompleted : styles.statusTextCancelled
                                        ]}>
                                            {order.status}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.dateText}>
                                    {moment(order.createdAt).format('MMM D, YYYY h:mm A')}
                                </Text>

                                <View style={styles.staffRow}>
                                    <Icon name="account-circle-outline" size={16} color={COLORS.textSecondary} />
                                    <Text style={styles.staffText}>Taken By: {order.employeeName || 'Unknown'}</Text>
                                </View>

                                {/* Order Note */}
                                {order.note && (
                                    <Text style={styles.orderNoteSimple}>Note: {order.note}</Text>
                                )}
                            </View>

                            <View style={styles.divider} />

                            {/* Items List */}
                            <View style={styles.itemsList}>
                                {order.items.map((item, index) => (
                                    <View key={index} style={styles.itemRow}>
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemName}>
                                                {item.quantity}x {item.name}
                                            </Text>
                                            {item.selectedAttributes?.map((attr, i) => (
                                                <Text key={i} style={styles.itemVariant}>
                                                    • {attr.name ? `${attr.name}: ` : ''}{attr.value}
                                                </Text>
                                            ))}
                                            {item.note && (
                                                <Text style={styles.itemNote}>Note: {item.note}</Text>
                                            )}
                                        </View>
                                        <Text style={styles.itemPrice}>
                                            {((item.price || 0) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })} JOD
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.divider} />

                            {/* Totals */}
                            <View style={styles.totalsSection}>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Subtotal</Text>
                                    <Text style={styles.totalValue}>
                                        {(order.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} JOD
                                    </Text>
                                </View>

                                {(order.discountAmount || 0) > 0 && (
                                    <View style={styles.totalRow}>
                                        <Text style={[styles.totalLabel, { color: COLORS.error || '#D55263' }]}>
                                            Discount {discountPercentage > 0 ? `(${discountPercentage}%)` : ''}
                                        </Text>
                                        <Text style={[styles.totalValue, { color: COLORS.error || '#D55263' }]}>
                                            -{(order.discountAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} JOD
                                        </Text>
                                    </View>
                                )}

                                {(order.tax > 0) && (
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>Tax</Text>
                                        <Text style={styles.totalValue}>
                                            {order.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })} JOD
                                        </Text>
                                    </View>
                                )}

                                <View style={[styles.totalRow, styles.grandTotalRow]}>
                                    <Text style={styles.grandTotalLabel}>Total</Text>
                                    <Text style={styles.grandTotalValue}>
                                        {order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} JOD
                                    </Text>
                                </View>
                            </View>

                            {/* Payment Info */}
                            <View style={styles.paymentInfo}>
                                <View style={styles.paymentRow}>
                                    <Icon name={order.paymentMethod === 'CASH' ? 'cash' : 'credit-card'} size={20} color={COLORS.textSecondary} />
                                    <Text style={styles.paymentMethod}>Paid with {order.paymentMethod}</Text>
                                </View>
                            </View>

                            {/* Refund Button */}
                            {canRefund && (
                                <TouchableOpacity
                                    style={styles.refundButton}
                                    onPress={() => setShowRefundModal(true)}
                                >
                                    <Icon name="cash-refund" size={20} color="#FFF" />
                                    <Text style={styles.refundButtonText}>Process Refund</Text>
                                </TouchableOpacity>
                            )}

                            {/* Refunded Badge */}
                            {(order.isRefunded || order.status === 'REFUNDED') && (
                                <View style={styles.refundedBadge}>
                                    <Icon name="alert-circle" size={18} color={COLORS.error} />
                                    <Text style={styles.refundedText}>
                                        This order has been refunded
                                        {order.refundReason ? `: ${order.refundReason}` : ''}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    ) : (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>Failed To Load Order Details</Text>
                        </View>
                    )}
                </View>

                {/* Refund Confirmation Modal */}
                <Modal
                    visible={showRefundModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowRefundModal(false)}
                >
                    <View style={styles.refundModalOverlay}>
                        <Pressable style={styles.backdrop} onPress={() => setShowRefundModal(false)} />
                        <View style={styles.refundModalContent}>
                            <View style={styles.refundModalHeader}>
                                <Icon name="cash-refund" size={32} color={COLORS.error} />
                                <Text style={styles.refundModalTitle}>Process Refund</Text>
                                <Text style={styles.refundModalSubtitle}>
                                    Refund {order?.total?.toLocaleString('en-US', { minimumFractionDigits: 2 })} JOD for Order #{order?.orderNumber}
                                </Text>
                            </View>

                            <Text style={styles.refundReasonLabel}>Select Reason:</Text>
                            <View style={styles.refundReasonsContainer}>
                                {REFUND_REASONS.map((reason) => (
                                    <TouchableOpacity
                                        key={reason}
                                        style={[
                                            styles.refundReasonChip,
                                            selectedReason === reason && styles.refundReasonChipSelected
                                        ]}
                                        onPress={() => setSelectedReason(reason)}
                                    >
                                        <Text style={[
                                            styles.refundReasonChipText,
                                            selectedReason === reason && styles.refundReasonChipTextSelected
                                        ]}>
                                            {reason}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {selectedReason === 'Other' && (
                                <TextInput
                                    style={styles.customReasonInput}
                                    placeholder="Enter custom reason..."
                                    placeholderTextColor={COLORS.textTertiary}
                                    value={customReason}
                                    onChangeText={setCustomReason}
                                    multiline
                                />
                            )}

                            <View style={styles.refundModalActions}>
                                <TouchableOpacity
                                    style={styles.refundCancelButton}
                                    onPress={() => {
                                        setShowRefundModal(false);
                                        setSelectedReason('');
                                        setCustomReason('');
                                    }}
                                >
                                    <Text style={styles.refundCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.refundConfirmButton,
                                        (!selectedReason || isProcessingRefund) && styles.refundConfirmButtonDisabled
                                    ]}
                                    onPress={handleRefund}
                                    disabled={!selectedReason || isProcessingRefund}
                                >
                                    {isProcessingRefund ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Text style={styles.refundConfirmText}>Confirm Refund</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </Modal>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20, // Add padding
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        width: '100%',
        maxWidth: 450,
        maxHeight: '85%',
        backgroundColor: colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
        flex: 1, // Allow flex growth
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    loadingContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center'
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    receiptHeader: {
        marginBottom: 20
    },
    orderMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    orderNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    statusBadgeCompleted: {
        backgroundColor: '#DCFCE7',
    },
    statusBadgeCancelled: {
        backgroundColor: '#FEE2E2',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    statusTextCompleted: {
        color: '#166534',
    },
    statusTextCancelled: {
        color: '#991B1B',
    },
    dateText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8
    },
    staffRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    staffText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500'
    },
    orderNoteSimple: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
        marginTop: 4,
    },
    orderNoteContainer: {
        marginTop: 12,
        backgroundColor: '#FEF3C7',
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#D0C962',
    },
    orderNoteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    orderNoteTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400E',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    orderNoteText: {
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 16,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: colors.border
    },
    itemsList: {
        gap: 12
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    itemInfo: {
        flex: 1,
        paddingRight: 16
    },
    itemName: {
        fontSize: 15,
        color: colors.textPrimary,
        fontWeight: '500',
        marginBottom: 2
    },
    itemVariant: {
        fontSize: 13,
        color: colors.textSecondary
    },
    itemNote: {
        fontSize: 13,
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginTop: 2
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary
    },
    totalsSection: {
        gap: 8
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    totalLabel: {
        fontSize: 14,
        color: colors.textSecondary
    },
    totalValue: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '600'
    },
    grandTotalRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border
    },
    grandTotalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary
    },
    grandTotalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary
    },
    paymentInfo: {
        marginTop: 24,
        backgroundColor: colors.background,
        padding: 12,
        borderRadius: 8
    },
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'center'
    },
    paymentMethod: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500'
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    errorText: {
        color: colors.error
    },
    // Refund styles
    refundButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.error,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 20,
    },
    refundButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    refundedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.errorBg || '#FEE2E2',
        padding: 12,
        borderRadius: 10,
        marginTop: 20,
    },
    refundedText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: colors.error,
    },
    refundModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    refundModalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    refundModalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    refundModalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textPrimary,
        marginTop: 12,
    },
    refundModalSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
    refundReasonLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 12,
    },
    refundReasonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    refundReasonChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.background,
    },
    refundReasonChipSelected: {
        borderColor: colors.error,
        backgroundColor: colors.errorBg || '#FEE2E2',
    },
    refundReasonChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    refundReasonChipTextSelected: {
        color: colors.error,
    },
    customReasonInput: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: colors.textPrimary,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    refundModalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    refundCancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.background,
        alignItems: 'center',
    },
    refundCancelText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    refundConfirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.error,
        alignItems: 'center',
    },
    refundConfirmButtonDisabled: {
        opacity: 0.5,
    },
    refundConfirmText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
});

export default OrderDetailsModal;
