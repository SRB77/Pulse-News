/**
 * Google Sign-In Button Component
 * Custom styled button for Google authentication with logo
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Pressable } from 'react-native';
import { theme } from '../constants/theme';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
  onPress, 
  loading = false, 
  disabled = false, 
  style 
}) => {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      android_ripple={{ color: '#e5e7eb' }}
      style={[styles.googleButton, pressed && styles.googleButtonPressed, style]}
    >
      <View style={styles.buttonContent}>
        {!loading && (
          <Image
            source={require('../assets/icons/google-logo.png')}
            style={styles.googleImage}
            resizeMode="contain"
          />
        )}
        {loading ? (
          <ActivityIndicator color={theme.Colors.text} />
        ) : (
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  googleButton: {
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
  googleButtonPressed: {
    transform: [{ translateY: 1 }],
    ...theme.Shadows.none,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleImage: {
    width: 24,
    height: 24,
    marginRight: theme.Spacing.sm,
  },
  googleButtonText: {
    color: theme.Colors.text,
    fontSize: theme.Typography.fontSize.base,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
});

export default GoogleSignInButton;
