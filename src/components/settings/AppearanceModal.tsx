import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
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
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Appearance</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Icon name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

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
    width: '85%',
    maxWidth: 340,
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
