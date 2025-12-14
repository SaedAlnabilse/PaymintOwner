import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment-timezone';
import { OrderDetails } from '../../types/reports';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

interface OrderDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    order: OrderDetails | null;
    isLoading?: boolean;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
    visible,
    onClose,
    order,
    isLoading,
}) => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);

    if (!visible) return null;

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
                                    <View style={[styles.statusBadge, { backgroundColor: order.status === 'COMPLETED' ? '#DCFCE7' : '#FEE2E2' }]}>
                                        <Text style={[styles.statusText, { color: order.status === 'COMPLETED' ? '#166534' : '#991B1B' }]}>
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

                        </ScrollView>
                    ) : (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>Failed To Load Order Details</Text>
                        </View>
                    )}
                </View>
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
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        width: '90%',
        maxWidth: 400,
        height: '85%',
        backgroundColor: colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
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
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
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
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase'
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
    }
});

export default OrderDetailsModal;
