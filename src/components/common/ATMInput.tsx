import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { useATMInput } from '../../hooks/useATMInput';

interface ATMInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    currency?: string;
    placeholder?: string;
    error?: string;
}

const ATMInput: React.FC<ATMInputProps> = ({
    label,
    value,
    onChange,
    currency = 'JOD',
    placeholder = '0.00',
    error,
}) => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const styles = createStyles(COLORS);

    const {
        displayValue,
        numericValue,
        handleTextChange,
    } = useATMInput(value);

    // Sync internal numeric value to parent whenever text changes
    const onInternalChange = (text: string) => {
        handleTextChange(text);
        // Note: useATMInput's state update is async, but we can derive the next value 
        // or rely on the hook's returned numericValue if we adjust it to be more synchronous.
        // However, the standard handleTextChange in the hook already updates state.
        // To ensure the parent is always in sync, we call onChange with the NEW value.
        const digitsOnly = text.replace(/[^0-9]/g, '');
        const cents = digitsOnly === '' ? 0 : parseInt(digitsOnly, 10);
        onChange(cents / 100);
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: COLORS.textSecondary }]}>{label}</Text>

            <View
                style={[
                    styles.inputBox,
                    { backgroundColor: COLORS.background, borderColor: error ? COLORS.error : COLORS.borderLight }
                ]}
            >
                <Text style={[styles.currencyPrefix, { color: COLORS.textSecondary }]}>{currency}</Text>
                <TextInput
                    style={[styles.inputValue, { color: value > 0 ? COLORS.textPrimary : COLORS.textTertiary }]}
                    value={displayValue}
                    onChangeText={onInternalChange}
                    keyboardType="numeric"
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textTertiary}
                    selectionColor={COLORS.primary}
                    caretHidden={false}
                />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        marginBottom: 20,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 16,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        gap: 12,
    },
    currencyPrefix: {
        fontSize: 16,
        fontWeight: '700',
    },
    inputValue: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        height: '100%',
        padding: 0, // Remove native padding for better alignment
    },
    errorText: {
        color: colors.error,
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
        fontWeight: '500',
    },
});

export default ATMInput;
