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
import { PayInPayOutLogEntry } from '../../types/reports';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

interface PayInPayOutLogModalProps {
  visible: boolean;
  onClose: () => void;
  logs: PayInPayOutLogEntry[];
  isLoading: boolean;
  type: 'PAY_IN' | 'PAY_OUT' | 'BOTH';
}

const LogItem = React.memo(({ item, COLORS }: { item: PayInPayOutLogEntry; COLORS: any }) => {
  const isPayIn = item.type === 'PAY_IN';
  const styles = createStyles(COLORS);
  return (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <View style={styles.typeContainer}>
          <Icon
            name={isPayIn ? 'arrow-down-circle' : 'arrow-up-circle'}
            size={20}
            color={isPayIn ? COLORS.primary : COLORS.error}
          />
          <Text
            style={[
              styles.logType,
              { color: isPayIn ? COLORS.primary : COLORS.error },
            ]}
          >
            {isPayIn ? 'Pay In' : 'Pay Out'}
          </Text>
        </View>
        <Text style={styles.logAmount}>
          {item.amount?.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          JOD
        </Text>
      </View>

      {item.reason && (
        <Text style={styles.logReason}>Reason: {item.reason}</Text>
      )}

      {item.note && (
        <Text style={styles.logNote}>Note: {item.note}</Text>
      )}

      <View style={styles.logFooter}>
        <View style={styles.userContainer}>
          <Icon name="account" size={14} color={COLORS.textSecondary} />
          <Text style={styles.logUser}>{item.userName}</Text>
        </View>
        <Text style={styles.logTime}>
          {moment(item.timestamp).format('MMM D, h:mm A')}
        </Text>
      </View>
    </View>
  );
});

const PayInPayOutLogModal: React.FC<PayInPayOutLogModalProps> = ({
  visible,
  onClose,
  logs,
  isLoading,
  type,
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);

  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      if (type === 'BOTH') return ['PAY_IN', 'PAY_OUT'].includes(log.type);
      return log.type === type;
    });
  }, [logs, type]);

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
            <Text style={styles.title}>
              {type === 'PAY_IN'
                ? 'Pay In Log'
                : type === 'PAY_OUT'
                  ? 'Pay Out Log'
                  : 'Pay Log'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              {filteredLogs.length > 0 ? (
                filteredLogs.map((item) => (
                  <LogItem key={item.id} item={item} COLORS={COLORS} />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Icon name="text-box-search-outline" size={48} color={COLORS.textTertiary} />
                  <Text style={styles.emptyText}>No Records Found</Text>
                </View>
              )}
            </ScrollView>
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
    maxWidth: 500,
    height: '80%',
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
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  logItem: {
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logType: {
    fontSize: 14,
    fontWeight: '600',
  },
  logAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logReason: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
    fontWeight: '500'
  },
  logNote: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic'
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logUser: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  logTime: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    color: colors.textTertiary,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PayInPayOutLogModal;
