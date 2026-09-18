/**
 * Apple Sign-In Button Component
 * Custom styled button for Apple authentication matching Google button style
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Pressable, Platform } from 'react-native';
import { theme } from '../constants/theme';

interface AppleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  style,
}) => {
  const [pressed, setPressed] = useState(false);

  // Only show on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      android_ripple={{ color: '#e5e7eb' }}
      style={[styles.appleButton, pressed && styles.appleButtonPressed, style]}
    >
      <View style={styles.buttonContent}>
        {!loading && (
          <Image
            source={require('../assets/icons/apple-logo.png')}
            style={styles.appleImage}
            resizeMode="contain"
          />
        )}
        {loading ? (
          <ActivityIndicator color={theme.Colors.text} />
        ) : (
          <Text style={styles.appleButtonText}>Continue with Apple</Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  appleButton: {
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
  appleButtonPressed: {
    transform: [{ translateY: 1 }],
    ...theme.Shadows.none,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleImage: {
    width: 24,
    height: 24,
    marginRight: theme.Spacing.sm,
  },
  appleButtonText: {
    color: theme.Colors.text,
    fontSize: theme.Typography.fontSize.base,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
});

export default AppleSignInButton;

