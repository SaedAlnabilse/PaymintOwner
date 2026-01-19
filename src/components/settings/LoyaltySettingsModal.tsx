import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { LoyaltyConfig } from '../../types/salesManagement';
import { getLoyaltyConfig, updateLoyaltyConfig } from '../../services/salesSettings';
import { categoriesService, Category } from '../../services/categoriesService';
import LoyaltyGroup from './LoyaltyGroup';

interface LoyaltySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  currency?: string;
  onUpdate?: () => void;
}

const LoyaltySettingsModal: React.FC<LoyaltySettingsModalProps> = ({
  visible,
  onClose,
  currency = '$',
  onUpdate,
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>({
    enabled: false,
    pointsPerCurrency: 1,
    currencyPerPoint: 1,
    rewards: [],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [configData, categoriesData] = await Promise.all([
        getLoyaltyConfig(),
        categoriesService.getAll(),
      ]);
      setLoyaltyConfig(configData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch loyalty data:', error);
      Alert.alert('Error', 'Failed to load loyalty settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchData();
      setHasChanges(false);
    }
  }, [visible, fetchData]);

  const handleConfigChange = (newConfig: LoyaltyConfig) => {
    setLoyaltyConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateLoyaltyConfig(loyaltyConfig);
      Alert.alert('Success', 'Loyalty settings saved successfully');
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Failed to save loyalty config:', error);
      Alert.alert('Error', 'Failed to save loyalty settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
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
          <View style={[styles.headerBg, { backgroundColor: COLORS.primary }]}>
            <View style={styles.headerContent}>
              <View style={styles.iconBox}>
                <Icon name="star-circle-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Loyalty Program</Text>
                <Text style={styles.headerSubtitle}>
                  Configure points and rewards
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Card */}
          <View style={[styles.cardContent, { backgroundColor: COLORS.background }]}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
                  Loading loyalty settings...
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <LoyaltyGroup
                  config={loyaltyConfig}
                  onChange={handleConfigChange}
                  currency={currency}
                  categories={categories.map(c => ({ id: c.id, name: c.name }))}
                />
              </ScrollView>
            )}

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: COLORS.borderLight, backgroundColor: COLORS.white }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={[styles.cancelText, { color: COLORS.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!hasChanges || isSaving}
              >
                <LinearGradient
                  colors={hasChanges ? [COLORS.primary, COLORS.primary + 'CC'] : [COLORS.border, COLORS.border]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveGradient}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Icon name="check" size={18} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.saveText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
      maxWidth: 520,
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
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 24,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
    },
    footer: {
      flexDirection: 'row',
      padding: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      gap: 16,
    },
    cancelBtn: {
      flex: 1,
      height: 54,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 16,
    },
    cancelText: {
      fontSize: 16,
      fontWeight: '700',
    },
    saveBtn: {
      flex: 1.5,
      height: 54,
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 4,
      shadowColor: 'rgba(0,0,0,0.2)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    saveBtnDisabled: {
      opacity: 0.7,
    },
    saveGradient: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '800',
    },
  });

export default LoyaltySettingsModal;
