import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  iconName: string;
  error?: string;
  secureTextEntry?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  iconName,
  error,
  secureTextEntry = false,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  return (
    <View style={styles.inputWrapper}>
      <View
        style={[
          styles.inputContainer,
          error ? styles.errorBorder : null,
          isFocused ? styles.inputFocused : null,
        ]}
      >
        <Icon
          name={error ? 'alert-circle' : iconName}
          size={20}
          color={error ? '#D55263' : isFocused ? '#7CC39F' : '#999999'}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={label}
          placeholderTextColor="#B0B0B0"
          secureTextEntry={!isPasswordVisible}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIconContainer}
          >
            <Icon
              name={isPasswordVisible ? 'eye' : 'eye-off'}
              size={20}
              color={isFocused ? '#7CC39F' : '#B0B0B0'}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="x-circle" size={14} color="#D55263" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  eyeIconContainer: {
    padding: 4,
  },
  inputFocused: {
    borderColor: '#7CC39F',
    borderWidth: 2,
  },
  errorBorder: {
    borderColor: '#D55263',
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
    gap: 6,
  },
  errorText: {
    color: '#D55263',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});

export default FormInput;
