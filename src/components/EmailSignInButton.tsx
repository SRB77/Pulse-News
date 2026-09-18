import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { theme } from '../constants/theme';
import { EmailIcon } from './Icons';

interface EmailSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

const EmailSignInButton: React.FC<EmailSignInButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  style,
}) => {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      android_ripple={{ color: '#e5e7eb' }}
      style={[styles.button, pressed && styles.buttonPressed, style]}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator color={theme.Colors.text} />
        ) : (
          <>
            <EmailIcon size={22} color={theme.Colors.text} />
            <Text style={styles.buttonText}>Continue with Email</Text>
          </>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.Colors.background,
    borderWidth: 1,
    borderColor: theme.Colors.borderLight,
    borderRadius: theme.BorderRadius.full,
    paddingHorizontal: theme.Spacing.md,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.Shadows.sm,
  },
  buttonPressed: {
    transform: [{ translateY: 1 }],
    ...theme.Shadows.none,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: theme.Colors.text,
    fontSize: theme.Typography.fontSize.base,
    fontWeight: theme.Typography.fontWeight.semiBold,
    marginLeft: theme.Spacing.md,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
});

export default EmailSignInButton;
