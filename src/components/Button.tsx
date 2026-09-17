/**
 * Reusable Button Component
 * Supports different types, sizes, and states with theme integration
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { theme } from '../constants/theme';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
  textStyle,
  children,
  ...props
}) => {
  const buttonStyles = [
    theme.ComponentStyles.button,
    type === 'primary' && theme.ComponentStyles.buttonPrimary,
    type === 'secondary' && theme.ComponentStyles.buttonSecondary,
    type === 'tertiary' && theme.ComponentStyles.buttonTertiary,
    size === 'small' && { paddingVertical: theme.Spacing.sm, paddingHorizontal: theme.Spacing.md },
    size === 'large' && { paddingVertical: theme.Spacing['2xl'], paddingHorizontal: theme.Spacing['3xl'] },
    fullWidth && { width: '100%' },
    disabled && { opacity: 0.6 },
    style,
  ];

  const buttonTextStyles = [
    theme.ComponentStyles.buttonText,
    type === 'primary' && theme.ComponentStyles.buttonTextPrimary,
    type === 'secondary' && theme.ComponentStyles.buttonTextSecondary,
    type === 'tertiary' && theme.ComponentStyles.buttonTextTertiary,
    { fontWeight: '800', letterSpacing: 1 },
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={type === 'tertiary' ? theme.Colors.primary : theme.Colors.textWhite} />
      ) : (
        children || <Text style={buttonTextStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
