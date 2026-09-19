import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { theme } from '../constants/theme';

interface SignupModalProps {
  visible: boolean;
  onClose: () => void;
  onSignIn?: () => void;
  title?: string;
  subtitle?: string;
  primaryCtaLabel?: string;
}

const SignupModal: React.FC<SignupModalProps> = ({
  visible,
  onClose,
  onSignIn,
  title = 'Create an account',
  subtitle = 'Sign in to personalize your feed and sync bookmarks across devices.',
  primaryCtaLabel = 'Sign up / Log in',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Background blur that blocks interactions */}
        <BlurView
          style={styles.backdropBlur}
          blurType={Platform.OS === 'ios' ? 'light' : 'light'}
          blurAmount={20}
          reducedTransparencyFallbackColor="rgba(255,255,255,0.88)"
        />

        {/* Glassmorphism card */}
        <View style={styles.cardContainer}>
          <BlurView
            style={styles.cardBlur}
            blurType={Platform.OS === 'ios' ? 'light' : 'light'}
            blurAmount={12}
            reducedTransparencyFallbackColor="rgba(255,255,255,0.9)"
          />

          <View style={styles.cardContent}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.primaryButton}
              onPress={onSignIn}
            >
              <Text style={styles.primaryButtonText}>{primaryCtaLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={onClose}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdropBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContainer: {
    width: '86%',
    borderRadius: theme.BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  cardBlur: {
    ...StyleSheet.absoluteFillObject as any,
  },
  cardContent: {
    padding: theme.Spacing.xl,
  },
  title: {
    fontSize: theme.Typography.fontSize['2xl'],
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    textAlign: 'center',
    marginBottom: theme.Spacing.sm,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  subtitle: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.Spacing.lg,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  primaryButton: {
    backgroundColor: theme.Colors.primary,
    paddingVertical: theme.Spacing.md,
    borderRadius: theme.BorderRadius.full,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.Colors.textWhite,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: theme.Spacing.md,
    paddingVertical: theme.Spacing.xs,
  },
  secondaryButtonText: {
    color: theme.Colors.textSecondary,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
});

export default SignupModal;


