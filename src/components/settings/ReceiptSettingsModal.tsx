import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Pressable
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { AppSettings, updateAppSettings } from '../../services/settings';

interface ReceiptSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: AppSettings | null;
  onUpdate: () => void;
}

const ReceiptSettingsModal: React.FC<ReceiptSettingsModalProps> = ({
  visible,
  onClose,
  settings,
  onUpdate
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const [restaurantName, setRestaurantName] = useState('');
  const [farewellMessage, setFarewellMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && settings) {
      setRestaurantName(settings.restaurantName || '');
      setFarewellMessage(settings.farewellMessage || 'Thank you for your visit!');
    }
  }, [visible, settings]);

  const handleSave = async () => {
    if (!restaurantName.trim()) {
      Alert.alert('Error', 'Restaurant name is required');
      return;
    }

    setLoading(true);
    try {
      await updateAppSettings({
        restaurantName: restaurantName.trim(),
        farewellMessage: farewellMessage.trim(),
      });
      onUpdate();
      onClose();
      Alert.alert('Success', 'Receipt settings updated');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update receipt settings');
    } finally {
      setLoading(false);
    }
  };

  const ReceiptPreview = () => (
    <View style={styles.previewContainer}>
      <View style={styles.previewPaper}>
        {/* Paper texture effect */}
        <View style={styles.previewHeader}>
          <View style={styles.previewLogoPlaceholder}>
             <Icon name="store" size={24} color="#CBD5E1" />
          </View>
          <Text style={styles.previewTitle}>{restaurantName || 'Restaurant Name'}</Text>
          <Text style={styles.previewText}>Amman, Jordan</Text>
          <Text style={styles.previewText}>+962 79 123 4567</Text>
        </View>

        <View style={styles.previewDivider}>
           <Text style={styles.previewDividerText}>--------------------------------</Text>
        </View>

        <View style={styles.previewRow}>
           <Text style={styles.previewText}>Order #1024</Text>
           <Text style={styles.previewText}>12:30 PM</Text>
        </View>

        <View style={styles.previewDivider}>
           <Text style={styles.previewDividerText}>--------------------------------</Text>
        </View>

        <View style={styles.previewItemRow}>
           <Text style={styles.previewItemName}>1x Latte</Text>
           <Text style={styles.previewItemPrice}>3.50</Text>
        </View>
         <View style={styles.previewItemRow}>
           <Text style={styles.previewItemName}>1x Cheesecake</Text>
           <Text style={styles.previewItemPrice}>4.00</Text>
        </View>

        <View style={[styles.previewDivider, { marginTop: 10 }]}>
           <Text style={styles.previewDividerText}>--------------------------------</Text>
        </View>

        <View style={styles.previewTotalRow}>
           <Text style={styles.previewTotalLabel}>TOTAL</Text>
           <Text style={styles.previewTotalValue}>7.50 JOD</Text>
        </View>
        
        <View style={styles.previewFooter}>
            <Text style={styles.previewFooterText}>{farewellMessage || 'Thank you for your visit!'}</Text>
        </View>
         <View style={styles.tearLine}>
            {Array.from({ length: 15 }).map((_, i) => (
                <View key={i} style={styles.tearTriangle} />
            ))}
        </View>
      </View>
      <Text style={[styles.previewLabel, { color: COLORS.textSecondary }]}>Live Preview</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={[styles.modalContent, { backgroundColor: COLORS.surface }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: COLORS.textPrimary }]}>Receipt Settings</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              keyboardShouldPersistTaps="handled"
            >
              <ReceiptPreview />

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: COLORS.textSecondary }]}>Restaurant Name</Text>
                <TextInput
                  style={[styles.input, { color: COLORS.textPrimary, backgroundColor: COLORS.background, borderColor: COLORS.border }]}
                  value={restaurantName}
                  onChangeText={setRestaurantName}
                  placeholder="Enter restaurant name"
                  placeholderTextColor={COLORS.textTertiary}
                />
                <Text style={[styles.hint, { color: COLORS.textTertiary }]}>Appears at the top of your receipt</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: COLORS.textSecondary }]}>Footer Message</Text>
                <TextInput
                  style={[styles.input, { color: COLORS.textPrimary, backgroundColor: COLORS.background, borderColor: COLORS.border, height: 80 }]}
                  value={farewellMessage}
                  onChangeText={setFarewellMessage}
                  placeholder="e.g. Thank you, come again!"
                  placeholderTextColor={COLORS.textTertiary}
                  multiline
                />
                <Text style={[styles.hint, { color: COLORS.textTertiary }]}>Appears at the bottom of the receipt</Text>
              </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: COLORS.border }]}>
               <TouchableOpacity 
                  style={[styles.cancelButton, { borderColor: COLORS.border }]}
                  onPress={onClose}
               >
                  <Text style={[styles.cancelButtonText, { color: COLORS.textSecondary }]}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: COLORS.primary }]}
                  onPress={handleSave}
                  disabled={loading}
               >
                  {loading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                  )}
               </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '100%',
    flexShrink: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    // flex: 1 removed to allow self-sizing
  },
  scrollContent: {
    paddingBottom: 20,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewPaper: {
    width: 260,
    backgroundColor: '#FFF',
    padding: 16,
    paddingBottom: 30,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden' // for tear line
  },
  previewLogoPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 2,
  },
  previewText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  previewDivider: {
    alignItems: 'center',
    marginVertical: 4,
    overflow: 'hidden',
    height: 12
  },
  previewDividerText: {
    fontSize: 10,
     color: '#CBD5E1',
     letterSpacing: 2
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  previewItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  previewItemName: {
     fontSize: 12,
     color: '#334155',
     fontWeight: '500'
  },
  previewItemPrice: {
     fontSize: 12,
     color: '#334155',
     fontWeight: '600'
  },
  previewTotalRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginTop: 4,
     marginBottom: 12
  },
  previewTotalLabel: {
     fontSize: 13,
     fontWeight: '800',
     color: '#0F172A'
  },
  previewTotalValue: {
     fontSize: 13,
     fontWeight: '800',
     color: '#0F172A'
  },
  previewFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
  previewFooterText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  tearLine: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 8,
      flexDirection: 'row',
      overflow: 'hidden'
  },
  tearTriangle: {
      width: 16,
      height: 16,
      backgroundColor: '#f1f5f9', // Match background or slightly darker
      transform: [{ rotate: '45deg' }],
      top: 4,
      marginRight: 2
  },
  previewLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  hint: {
    fontSize: 11,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ReceiptSettingsModal;
