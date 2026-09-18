import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { firebaseService } from '../services/firebaseService';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { ChevronLeftIcon } from '../components/Icons';

type AuthMode = 'login' | 'signup' | 'forgot';

const AuthScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const fromRoute: 'Welcome' | 'MandatorySignup' | undefined = route.params?.fromRoute;
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (mode !== 'forgot') {
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      
      if (mode === 'signup') {
        if (!confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      if (mode === 'forgot') {
        const result = await firebaseService.resetPassword(email);
        if (result.success) {
          Alert.alert('Success', 'Password reset email sent! Check your inbox.', [
            { text: 'OK', onPress: () => setMode('login') }
          ]);
        } else {
          Alert.alert('Error', result.error || 'Failed to send reset email');
        }
      } else if (mode === 'signup') {
        const result = await firebaseService.signUpWithEmail(email, password);
        if (result.success) {
          // User account is created automatically on sign-up, go directly to Feed
          navigation.replace('Feed');
        } else {
          Alert.alert('Sign-Up Failed', result.error || 'Something went wrong');
        }
      } else {
        const result = await firebaseService.signInWithEmail(email, password);
        if (result.success) {
          // User account is created automatically on sign-in, go directly to Feed
          navigation.replace('Feed');
        } else {
          Alert.alert('Sign-In Failed', result.error || 'Something went wrong');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header fixed (not scrollable) */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            const state = navigation.getState?.();
            const prevName = state?.routes?.[state.routes.length - 2]?.name;
            if (prevName) {
              navigation.goBack();
              return;
            }
            if (fromRoute === 'MandatorySignup') {
              navigation.reset({ index: 0, routes: [{ name: 'MandatorySignup' }] });
            } else {
              navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            }
          }}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon size={24} color={theme.Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>
            {mode === 'signup' ? 'Sign Up' : mode === 'forgot' ? 'Reset Password' : 'Log In'}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Content (not scrollable) */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={keyboardOpen ? (Platform.OS === 'ios' ? 'padding' : 'height') : undefined}
        keyboardVerticalOffset={keyboardOpen ? insets.top + 56 : 0}
      >
      <View style={styles.content}>
          <Text style={styles.title}>
            {mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Forgot Password?' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'signup' 
              ? 'Sign up to get personalized news and save your favorite articles'
              : mode === 'forgot'
              ? 'Enter your email address and we\'ll send you a link to reset your password'
              : 'Sign in to continue reading'
            }
          </Text>

          <View style={styles.form}>
            <TextField
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              icon="email"
            />

            {mode !== 'forgot' && (
              <>
                <TextField
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="Enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={mode === 'signup' ? 'password-new' : 'password'}
                  error={errors.password}
                  icon="lock"
                  showPasswordToggle
                />

                {mode === 'signup' && (
                  <TextField
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                    }}
                    placeholder="Confirm your password"
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password-new"
                    error={errors.confirmPassword}
                    icon="lock"
                    showPasswordToggle
                  />
                )}
              </>
            )}

            {mode === 'login' && (
              <TouchableOpacity 
                style={styles.forgotPasswordButton}
                onPress={() => setMode('forgot')}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <Button
              title={mode === 'signup' ? 'Sign Up' : mode === 'forgot' ? 'Send Reset Link' : 'Log In'}
              onPress={handleSubmit}
              type="primary"
              size="medium"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
              style={styles.submitButton}
            />

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {mode === 'signup' ? 'Already have an account? ' : mode === 'forgot' ? 'Remember your password? ' : "Don't have an account? "}
              </Text>
              <TouchableOpacity onPress={() => {
                setMode(mode === 'signup' ? 'login' : 'signup');
                setErrors({});
              }}>
                <Text style={styles.switchLink}>
                  {mode === 'signup' ? 'Log In' : mode === 'forgot' ? 'Log In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 20,
  },
  backButton: {
    padding: theme.Spacing.xs,
  },
  headerTitleWrapper: {
    flex: 1,
    marginHorizontal: theme.Spacing.md,
  },
  headerTitle: {
    fontSize: theme.Typography.fontSize.lg,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  content: {
    flex: 1,
    padding: theme.Spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.Typography.fontSize['3xl'],
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    marginBottom: theme.Spacing.sm,
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  subtitle: {
    fontSize: theme.Typography.fontSize.base,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: theme.Spacing.xl,
    lineHeight: 22,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: theme.Spacing.xs,
    marginBottom: theme.Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.primary,
    fontWeight: theme.Typography.fontWeight.medium,
    fontFamily: theme.Typography.fontFamily.medium,
  },
  submitButton: {
    marginTop: theme.Spacing.md,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.Spacing.xl,
  },
  switchText: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textSecondary,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  switchLink: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.primary,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
});

export default AuthScreen;

