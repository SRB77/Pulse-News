import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, KeyboardTypeOptions, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { theme } from '../constants/theme';
import { UserIcon, EmailIcon, LockIcon, EyeIcon, EyeOffIcon, CalendarIcon, PhoneIcon } from './Icons';

interface TextFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  icon?: string;
  showPasswordToggle?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  error?: string;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  style,
  inputStyle,
  labelStyle,
  icon,
  showPasswordToggle = false,
  autoCapitalize,
  autoComplete,
  error,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const getIcon = () => {
    if (icon === 'person') return <UserIcon size={20} color={isFocused ? theme.Colors.primary : theme.Colors.textSecondary} />;
    if (icon === 'email') return <EmailIcon size={20} color={isFocused ? theme.Colors.primary : theme.Colors.textSecondary} />;
    if (icon === 'phone') return <PhoneIcon size={20} color={isFocused ? theme.Colors.primary : theme.Colors.textSecondary} />;
    if (icon === 'calendar') return <CalendarIcon size={20} color={isFocused ? theme.Colors.primary : theme.Colors.textSecondary} />;
    if (icon === 'lock') return <LockIcon size={20} color={isFocused ? theme.Colors.primary : theme.Colors.textSecondary} />;
    return null;
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused, error && styles.inputContainerError]}>
        {icon && <View style={styles.iconContainer}>{getIcon()}</View>}
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.Colors.textTertiary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete as any}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            {isPasswordVisible ? (
              <EyeOffIcon size={20} color={theme.Colors.textSecondary} />
            ) : (
              <EyeIcon size={20} color={theme.Colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.Spacing.xl,
  },
  label: {
    fontSize: theme.Typography.fontSize.base,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    marginBottom: theme.Spacing.sm,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: theme.Colors.backgroundTertiary,
    borderRadius: theme.BorderRadius.full,
    borderWidth: 1,
    borderColor: theme.Colors.borderLight,
    paddingHorizontal: theme.Spacing.lg,
  },
  inputContainerFocused: {
    borderColor: theme.Colors.primary,
    borderWidth: 1,
    backgroundColor: theme.Colors.backgroundSecondary,
  },
  iconContainer: {
    marginRight: theme.Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.text,
    fontWeight: theme.Typography.fontWeight.normal,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  passwordToggle: {
    padding: theme.Spacing.xs,
  },
  inputContainerError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: theme.Typography.fontSize.sm,
    color: '#EF4444',
    marginTop: theme.Spacing.xs,
    marginLeft: theme.Spacing.md,
    fontFamily: theme.Typography.fontFamily.regular,
  },
});

export default TextField;