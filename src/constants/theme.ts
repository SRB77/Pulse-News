/**
 * Comprehensive Design System Theme
 * Centralized design tokens for colors, typography, spacing, shadows, and component styles
 */

import { StyleSheet, Platform } from 'react-native';

const resolveRobotoFont = (weight: string) =>
  Platform.select({
    ios: `Roboto-${weight}`,
    android: `Roboto${weight}`,
    default: `Roboto-${weight}`,
  }) ?? `Roboto-${weight}`;

const FontFamilies = {
  thin: resolveRobotoFont('Thin'),
  extraLight: resolveRobotoFont('ExtraLight'),
  light: resolveRobotoFont('Light'),
  regular: resolveRobotoFont('Regular'),
  medium: resolveRobotoFont('Medium'),
  semiBold: resolveRobotoFont('SemiBold'),
  bold: resolveRobotoFont('Bold'),
  extraBold: resolveRobotoFont('ExtraBold'),
  black: resolveRobotoFont('Black'),
} as const;

// Color Palette
export const Colors = {
  // Primary Brand Colors
  primary: '#305322', // Premium green
  primaryLight: '#4A6A3C',
  primaryDark: '#203A18',
  
  // Secondary Colors
  secondary: '#007BFF',
  secondaryLight: '#4FC3F7',
  secondaryDark: '#0277BD',
  
  // Neutral Colors
  background: '#FFFFFF', // Pure white background like reference
  backgroundSecondary: '#FFFFFF', // Pure white
  backgroundTertiary: '#F5F5F5', // Light gray for inputs
  backgroundQuaternary: '#d6d6d6', // Pure white background like reference
  
  // Text Colors
  text: '#000000', // Pure black like reference
  textSecondary: '#000000', // Black subtitle like reference
  textTertiary: '#9CA3AF', // Light grey for placeholders
  textLight: '#E0E0E0',
  textWhite: '#FFFFFF',
  
  // Border Colors
  border: '#E5E7EB', // Light grey borders
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',
  
  // Status Colors
  success: '#305322',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  info: '#3B82F6',
  infoLight: '#60A5FA',
  
  // Google Brand Colors
  googleBlue: '#4285F4',
  googleRed: '#EA4335',
  googleYellow: '#FBBC05',
  googleGreen: '#34A853',
  
  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
} as const;

// Typography System
export const Typography = {
  // Font Families
  fontFamily: FontFamilies,
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
    '6xl': 48,
  },
  
  // Line Heights (in pixels)
  lineHeight: {
    tight: 20,
    normal: 24,
    relaxed: 28,
    loose: 32,
  },
  
  // Font Weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  
  // Typography Styles
  styles: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 1.2,
      color: Colors.text,
      fontFamily: FontFamilies.extraBold,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 1.2,
      color: Colors.text,
      fontFamily: FontFamilies.semiBold,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 1.3,
      color: Colors.text,
      fontFamily: FontFamilies.semiBold,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 1.3,
      color: Colors.text,
      fontFamily: FontFamilies.semiBold,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 1.5,
      color: Colors.text,
      fontFamily: FontFamilies.regular,
    },
    bodyLarge: {
      fontSize: 18,
      fontWeight: '400' as const,
      lineHeight: 1.5,
      color: Colors.text,
      fontFamily: FontFamilies.regular,
    },
    small: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 1.4,
      color: Colors.textSecondary,
      fontFamily: FontFamilies.light,
    },
    // ...existing code...
  },
};

// Spacing System
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 80,
  '5xl': 96,
} as const;

// Border Radius System
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// Shadow System
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

// Component Styles
export const ComponentStyles = StyleSheet.create({
  // Button Styles
  button: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
  buttonSecondary: {
    backgroundColor: Colors.secondary,
    ...Shadows.sm,
  },
  buttonTertiary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonGoogle: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  buttonText: {
    color: Colors.textWhite,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.extraBold, // Premium bold
    letterSpacing: 1,
    fontFamily: FontFamilies.extraBold,
  },
  buttonTextPrimary: {
    color: Colors.textWhite,
    fontFamily: FontFamilies.extraBold,
  },
  buttonTextSecondary: {
    color: Colors.textWhite,
    fontFamily: FontFamilies.extraBold,
  },
  buttonTextTertiary: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: FontFamilies.medium,
  },
  buttonTextGoogle: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: FontFamilies.medium,
  },
  
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  containerCentered: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: Spacing.md,
  },
  
  // Card Styles
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  cardElevated: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  
  // Input Styles
  input: {
    height: 48,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    fontFamily: FontFamilies.regular,
  },
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  
  // Text Styles
  text: {
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    fontFamily: FontFamilies.regular,
  },
  textSecondary: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontFamily: FontFamilies.regular,
  },
  textWhite: {
    fontSize: Typography.fontSize.base,
    color: Colors.textWhite,
    fontFamily: FontFamilies.regular,
  },
});

// Theme Object
export const theme = {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ComponentStyles,
} as const;

export type Theme = typeof theme;
export type Colors = typeof Colors;
export type Typography = typeof Typography;
export type Spacing = typeof Spacing;
export type BorderRadius = typeof BorderRadius;
export type Shadows = typeof Shadows;
export type ComponentStyles = typeof ComponentStyles;
