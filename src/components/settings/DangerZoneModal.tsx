import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { apiClient } from '../../services/apiClient';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { AppDispatch } from '../../store/store';

interface DangerZoneModalProps {
  visible: boolean;
  onClose: () => void;
  restaurantName?: string;
}

const DangerZoneModal: React.FC<DangerZoneModalProps> = ({
  visible,
  onClose,
  restaurantName = 'My Restaurant',
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  const dispatch = useDispatch<AppDispatch>();

  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const CONFIRM_PHRASE = 'DELETE';
  const canDelete = confirmText.toUpperCase() === CONFIRM_PHRASE;

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.delete('/api/establishments/current');
      Alert.alert(
        'Establishment Deleted',
        'Your establishment and all associated data have been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: () => {
              dispatch(logout());
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to delete establishment:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to delete establishment. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setShowConfirmation(false);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalBg}
      >
        <Pressable style={styles.overlay} onPress={handleClose} />

        <View style={[styles.modalContainer, { backgroundColor: 'transparent' }]}>
          {/* Header Background */}
          <View style={[styles.headerBg, { backgroundColor: COLORS.error }]}>
            <View style={styles.headerContent}>
              <View style={styles.iconBox}>
                <Icon name="alert-octagon" size={24} color={COLORS.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Danger Zone</Text>
                <Text style={styles.headerSubtitle}>
                  Irreversible actions
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Card */}
          <View style={[styles.cardContent, { backgroundColor: COLORS.white }]}>
            {!showConfirmation ? (
              <View style={styles.content}>
                <View style={[styles.warningCard, { backgroundColor: COLORS.errorBg, borderColor: COLORS.error + '30' }]}>
                  <Icon name="alert" size={24} color={COLORS.error} />
                  <View style={styles.warningTextContainer}>
                    <Text style={[styles.warningTitle, { color: COLORS.error }]}>
                      Delete Establishment
                    </Text>
                    <Text style={[styles.warningText, { color: COLORS.textSecondary }]}>
                      Once you delete your establishment, there is no going back. This will permanently delete:
                    </Text>
                  </View>
                </View>

                <View style={styles.deleteList}>
                  <View style={styles.deleteItem}>
                    <Icon name="check-circle" size={18} color={COLORS.error} />
                    <Text style={[styles.deleteItemText, { color: COLORS.textPrimary }]}>
                      All products and categories
                    </Text>
                  </View>
                  <View style={styles.deleteItem}>
                    <Icon name="check-circle" size={18} color={COLORS.error} />
                    <Text style={[styles.deleteItemText, { color: COLORS.textPrimary }]}>
                      All orders and transaction history
                    </Text>
                  </View>
                  <View style={styles.deleteItem}>
                    <Icon name="check-circle" size={18} color={COLORS.error} />
                    <Text style={[styles.deleteItemText, { color: COLORS.textPrimary }]}>
                      All customer data and loyalty points
                    </Text>
                  </View>
                  <View style={styles.deleteItem}>
                    <Icon name="check-circle" size={18} color={COLORS.error} />
                    <Text style={[styles.deleteItemText, { color: COLORS.textPrimary }]}>
                      All staff accounts and permissions
                    </Text>
                  </View>
                  <View style={styles.deleteItem}>
                    <Icon name="check-circle" size={18} color={COLORS.error} />
                    <Text style={[styles.deleteItemText, { color: COLORS.textPrimary }]}>
                      All settings and configurations
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: COLORS.error }]}
                  onPress={() => setShowConfirmation(true)}
                >
                  <Icon name="delete-forever" size={20} color="#FFF" />
                  <Text style={styles.deleteButtonText}>Delete {restaurantName}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.content}>
                <View style={[styles.confirmCard, { backgroundColor: COLORS.background, borderColor: COLORS.borderLight }]}>
                  <Icon name="alert-circle-outline" size={48} color={COLORS.error} />
                  <Text style={[styles.confirmTitle, { color: COLORS.textPrimary }]}>
                    Are you absolutely sure?
                  </Text>
                  <Text style={[styles.confirmText, { color: COLORS.textSecondary }]}>
                    This action cannot be undone. This will permanently delete{' '}
                    <Text style={{ fontWeight: '700', color: COLORS.error }}>{restaurantName}</Text>{' '}
                    and all associated data.
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: COLORS.textSecondary }]}>
                    Type <Text style={{ fontWeight: '800', color: COLORS.error }}>DELETE</Text> to confirm
                  </Text>
                  <TextInput
                    style={[
                      styles.confirmInput,
                      {
                        borderColor: canDelete ? COLORS.error : COLORS.borderLight,
                        backgroundColor: COLORS.background,
                        color: COLORS.textPrimary,
                      },
                    ]}
                    value={confirmText}
                    onChangeText={setConfirmText}
                    placeholder="Type DELETE"
                    placeholderTextColor={COLORS.textTertiary}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: COLORS.border }]}
                    onPress={() => {
                      setShowConfirmation(false);
                      setConfirmText('');
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: COLORS.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmDeleteButton,
                      {
                        backgroundColor: canDelete ? COLORS.error : COLORS.border,
                      },
                    ]}
                    onPress={handleDelete}
                    disabled={!canDelete || isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Icon name="delete-forever" size={18} color="#FFF" />
                        <Text style={styles.confirmDeleteText}>Delete Forever</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    modalBg: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    overlay: {
      position: 'absolute',
      width: '100%',
      height: '100%',
    },
    modalContainer: {
      width: '95%',
      maxWidth: 480,
      maxHeight: '90%',
      borderRadius: 28,
      overflow: 'hidden',
    },
    headerBg: {
      paddingTop: 32,
      paddingBottom: 45,
      paddingHorizontal: 24,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: '#FFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFF',
      marginBottom: 2,
    },
    headerSubtitle: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.9)',
    },
    closeBtn: {
      padding: 8,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 50,
    },
    cardContent: {
      marginTop: -25,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: 'hidden',
    },
    content: {
      padding: 24,
    },
    warningCard: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      gap: 12,
      marginBottom: 20,
    },
    warningTextContainer: {
      flex: 1,
    },
    warningTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },
    warningText: {
      fontSize: 13,
      lineHeight: 20,
    },
    deleteList: {
      gap: 12,
      marginBottom: 24,
    },
    deleteItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    deleteItemText: {
      fontSize: 14,
      fontWeight: '500',
    },
    deleteButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 14,
    },
    deleteButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '700',
    },
    confirmCard: {
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
      marginBottom: 24,
    },
    confirmTitle: {
      fontSize: 18,
      fontWeight: '800',
      marginTop: 16,
      marginBottom: 8,
    },
    confirmText: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
    },
    inputContainer: {
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 10,
    },
    confirmInput: {
      height: 54,
      borderWidth: 2,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 2,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      height: 54,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 14,
      borderWidth: 1,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '700',
    },
    confirmDeleteButton: {
      flex: 1.5,
      height: 54,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      borderRadius: 14,
    },
    confirmDeleteText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '700',
    },
  });

export default DangerZoneModal;
