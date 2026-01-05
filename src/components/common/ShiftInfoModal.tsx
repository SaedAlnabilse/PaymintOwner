import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment-timezone';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';

interface ShiftInfoModalProps {
  visible: boolean;
  onClose: () => void;
  shift: any; // Can be Shift or null
  status: 'OPEN' | 'CLOSED';
}

const ShiftInfoModal: React.FC<ShiftInfoModalProps> = ({
  visible,
  onClose,
  shift,
  status,
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const isOpen = status === 'OPEN';
  const title = isOpen ? 'Current Active Shift' : 'Last Closed Shift';
  
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Icon 
                name={isOpen ? "store-clock" : "store-remove"} 
                size={24} 
                color={isOpen ? COLORS.primary : COLORS.error} 
              />
              <Text style={[styles.title, { color: COLORS.textPrimary }]}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {shift ? (
            <View style={styles.body}>
              {/* User Info */}
              <View style={styles.infoSection}>
                <Text style={[styles.label, { color: COLORS.textSecondary }]}>USER</Text>
                <View style={styles.valueRow}>
                  <View style={[styles.avatar, { backgroundColor: COLORS.primary + '15' }]}>
                    <Text style={[styles.avatarText, { color: COLORS.primary }]}>
                      {(shift.user?.name || 'Staff').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.value, { color: COLORS.textPrimary }]}>
                    {shift.user?.name || shift.user?.username || 'System User'}
                  </Text>
                </View>
              </View>

              {/* Amount Info */}
              <View style={styles.infoSection}>
                <Text style={[styles.label, { color: COLORS.textSecondary }]}>
                  {isOpen ? 'OPENING BALANCE' : 'CLOSING BALANCE'}
                </Text>
                <Text style={[styles.amountValue, { color: isOpen ? COLORS.primary : COLORS.textPrimary }]}>
                  {(isOpen ? (shift.openingBalance || shift.cashFloat) : (shift.closingBalance || shift.actualCash))?.toLocaleString('en-US', { minimumFractionDigits: 2 })} JOD
                </Text>
              </View>

              {/* Time Info */}
              <View style={styles.infoSection}>
                <Text style={[styles.label, { color: COLORS.textSecondary }]}>
                  {isOpen ? 'SHIFT STARTED' : 'SHIFT ENDED'}
                </Text>
                <View style={styles.valueRow}>
                  <Icon name="clock-outline" size={18} color={COLORS.textSecondary} />
                  <Text style={[styles.timeValue, { color: COLORS.textPrimary }]}>
                    {moment(isOpen ? shift.startTime : (shift.endTime || shift.timestamp)).format('MMM D, h:mm A')}
                  </Text>
                </View>
              </View>

              {!isOpen && shift.closeReason && (
                <View style={styles.infoSection}>
                  <Text style={[styles.label, { color: COLORS.textSecondary }]}>CLOSE REASON</Text>
                  <Text style={[styles.value, { color: COLORS.textPrimary }]}>{shift.closeReason}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyBody}>
              <Text style={{ color: COLORS.textSecondary }}>No shift data available</Text>
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: COLORS.primary }]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  body: {
    gap: 20,
  },
  emptyBody: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  infoSection: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ShiftInfoModal;
