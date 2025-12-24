import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform, KeyboardAvoidingView, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';

interface AppearanceModalProps {
  visible: boolean;
  onClose: () => void;
}

const AppearanceModal: React.FC<AppearanceModalProps> = ({ visible, onClose }) => {
  const { themeMode, setThemeMode, isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const modes = [
    { id: 'light', label: 'Light Mode', icon: 'white-balance-sunny' },
    { id: 'dark', label: 'Dark Mode', icon: 'weather-night' },
    { id: 'auto', label: 'System Default', icon: 'theme-light-dark' },
  ];

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
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Appearance</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.content}>
                {modes.map((mode) => (
                  <TouchableOpacity
                    key={mode.id}
                    style={[
                      styles.option,
                      themeMode === mode.id && styles.selectedOption
                    ]}
                    onPress={() => {
                      setThemeMode(mode.id as 'light' | 'dark' | 'auto');
                      onClose();
                    }}
                  >
                    <View style={styles.optionLeft}>
                      <Icon 
                        name={mode.icon} 
                        size={24} 
                        color={themeMode === mode.id ? COLORS.primary : COLORS.textSecondary} 
                      />
                      <Text style={[
                        styles.optionText,
                        themeMode === mode.id && styles.selectedOptionText
                      ]}>
                        {mode.label}
                      </Text>
                    </View>
                    {themeMode === mode.id && (
                      <Icon name="check" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
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
    width: '85%',
    maxWidth: 340,
    maxHeight: '85%',
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  content: {
    padding: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  selectedOption: {
    backgroundColor: 'rgba(124, 195, 159, 0.1)', // Primary with opacity
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  selectedOptionText: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default AppearanceModal;
