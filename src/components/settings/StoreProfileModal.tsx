import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ScrollView, TouchableWithoutFeedback } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppSettings } from '../../services/settings';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';

interface StoreProfileModalProps {
  visible: boolean;
  onClose: () => void;
  settings: AppSettings | null;
}

const StoreProfileModal: React.FC<StoreProfileModalProps> = ({ visible, onClose, settings }) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  if (!settings) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Store Profile</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Icon name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Logo Section */}
                <View style={styles.logoSection}>
                  <View style={styles.logoContainer}>
                    {settings.logo ? (
                      <Image source={{ uri: settings.logo }} style={styles.logo} />
                    ) : (
                      <Icon name="store" size={40} color={COLORS.textTertiary} />
                    )}
                  </View>
                  <Text style={styles.restaurantName}>{settings.restaurantName}</Text>
                  <Text style={styles.joinDate}>Joined {new Date(settings.createdAt).toLocaleDateString()}</Text>
                </View>

                {/* Details Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Business Hours</Text>
                  <View style={styles.row}>
                    <View style={styles.rowItem}>
                      <Icon name="clock-start" size={20} color={COLORS.primary} />
                      <View>
                        <Text style={styles.label}>Opening Time</Text>
                        <Text style={styles.value}>{settings.openingTime}</Text>
                      </View>
                    </View>
                    <View style={styles.rowItem}>
                      <Icon name="clock-end" size={20} color={COLORS.error} />
                      <View>
                        <Text style={styles.label}>Closing Time</Text>
                        <Text style={styles.value}>{settings.closingTime}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Additional Info</Text>
                  <View style={styles.infoItem}>
                    <Icon name="message-text-outline" size={20} color={COLORS.textSecondary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.label}>Farewell Message</Text>
                      <Text style={styles.value}>{settings.farewellMessage || 'None set'}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '80%',
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
  content: {
    padding: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.containerGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
  },
  infoContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

export default StoreProfileModal;
