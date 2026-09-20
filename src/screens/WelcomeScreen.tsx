/**
 * Welcome Screen Component
 * Initial screen with animated logo and Google Sign-In button
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppleSignInButton from '../components/AppleSignInButton';
import GoogleSignInButton from '../components/GoogleSignInButton';
import EmailSignInButton from '../components/EmailSignInButton';
import { theme } from '../constants/theme';
import { firebaseService } from '../services/firebaseService';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onSkip?: () => void;
  onGetStarted?: () => void;
  onOnboardingComplete?: () => void;
  hideButtons?: boolean;
  hideSkipButton?: boolean;
  splashMode?: boolean; // when true, acts like a splash for signed-in users
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onSkip, 
  onGetStarted, 
  onOnboardingComplete,
  hideButtons = false,
  hideSkipButton = false,
  splashMode = false,
}) => {
  const navigation = useNavigation<any>();
  const isDarkMode = useColorScheme() === 'dark';
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const pulseScaleAnim = useRef(new Animated.Value(0.8)).current;
  const crispNewsAnim = useRef(new Animated.Value(0)).current;
  const crispNewsSlideAnim = useRef(new Animated.Value(50)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;
  const screenFadeAnim = useRef(new Animated.Value(1)).current;
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      const result = await firebaseService.signInWithGoogle();
      if (result.success) {
        // User account is created automatically on sign-in, go directly to Feed
        navigation.replace('Feed');
      } else {
        Alert.alert('Sign-In Failed', result.error || 'Something went wrong during Google Sign-In.');
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Sign-In Error', 'An unexpected error occurred during Google Sign-In.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await firebaseService.signInWithApple();
      if (result.success) {
        // User account is created automatically on sign-in, go directly to Feed
        navigation.replace('Feed');
      } else {
        // Don't show alert if user canceled
        if (result.error !== 'Sign in was canceled') {
          Alert.alert('Sign-In Failed', result.error || 'Something went wrong during Apple Sign-In.');
        }
      }
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      Alert.alert('Sign-In Error', 'An unexpected error occurred during Apple Sign-In.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(crispNewsAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(crispNewsSlideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonsAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // In splash mode, auto-navigate to Feed after animations complete with fade-out
  useEffect(() => {
    if (splashMode) {
      const timer = setTimeout(() => {
        // Fade out the entire screen
        Animated.timing(screenFadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          // Navigate after fade-out completes
          navigation.replace('Feed');
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [splashMode, navigation, screenFadeAnim]);

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeAreaTop} edges={['top', 'left', 'right']}>
        <Animated.View style={[styles.container, { opacity: screenFadeAnim }]}>
          <StatusBar 
            barStyle={isDarkMode ? "light-content" : "dark-content"}
            backgroundColor={isDarkMode ? "#1F2937" : "#FFFFFF"}
            translucent={false}
          />

      {/* Logo and Tagline */}
      <View style={styles.logoOverlay}>
        {/* Pulse Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: pulseAnim,
              transform: [{ scale: pulseScaleAnim }],
            }
          ]}
        >
          <Text style={styles.logo}>pulse</Text>
          <View style={styles.logoAccent} />
        </Animated.View>
        
        {/* CRISP NEWS Tagline */}
        <Animated.View
          style={[
            {
              opacity: crispNewsAnim,
              transform: [{ translateY: crispNewsSlideAnim }]
            }
          ]}
        >
          <Text style={styles.tagline}>CRISP NEWS</Text>
        </Animated.View>
      </View>

      {/* Action Buttons Overlay */}
      {!hideButtons && !splashMode && (
        <View style={styles.buttonOverlay}>
          <Animated.View
            style={[
              styles.overlayButtons,
              {
                opacity: buttonsAnim,
              }
            ]}
          >
            <AppleSignInButton
              onPress={handleAppleSignIn}
              loading={isLoading}
              disabled={isLoading}
              style={styles.appleSignInButton}
            />
            <GoogleSignInButton
              onPress={handleGetStarted}
              loading={isLoading}
              disabled={isLoading}
              style={styles.googleSignInButton}
            />
            <EmailSignInButton
              onPress={() => navigation.navigate('Auth', { fromRoute: 'Welcome' })}
              style={styles.emailButton}
            />
            <Animated.View style={{ alignItems: 'center', marginTop: theme.Spacing.sm }}>
              <Text
                onPress={() => {
                  // Fade out before navigating
                  Animated.timing(screenFadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                  }).start(() => {
                    if (onSkip) {
                      onSkip();
                    } else {
                      navigation.navigate('Feed');
                    }
                  });
                }}
                style={styles.skipText}
              >
                Skip for now
              </Text>
            </Animated.View>
          </Animated.View>
        </View>
      )}
        </Animated.View>
      </SafeAreaView>
      <SafeAreaView style={styles.safeAreaBottom} edges={['bottom']} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeAreaTop: {
    flex: 1,
    backgroundColor: theme.Colors.background,
  },
  safeAreaBottom: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: theme.Colors.background,
  },
  logoOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.Spacing.sm,
  },
  logo: {
    fontSize: theme.Typography.fontSize['5xl'],
    fontWeight: theme.Typography.fontWeight.medium,
    color: theme.Colors.text,
    letterSpacing: 3,
    fontFamily: theme.Typography.fontFamily.medium,
  },
  logoAccent: {
    width: 12,
    height: 12,
    borderRadius: theme.BorderRadius.full,
    backgroundColor: theme.Colors.primary,
    marginLeft: theme.Spacing.sm,
  },
  tagline: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textSecondary,
    letterSpacing: 1.5,
    marginRight: -48,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  buttonOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.Spacing.lg,
    alignItems: 'center',
  },
  overlayButtons: {
    width: '100%',
    gap: theme.Spacing.xs,
  },
  overlayButtonSpacing: {
    marginTop: theme.Spacing.sm,
  },
  appleSignInButton: {
    width: '90%',
    marginBottom: theme.Spacing.md,
    alignSelf: 'center',
  },
  googleSignInButton: {
    width: '90%',
    marginBottom: theme.Spacing.md,
    alignSelf: 'center',
  },
  emailButton: {
    width: '90%',
    marginBottom: theme.Spacing.sm,
    alignSelf: 'center',
  },
  skipText: {
    color: theme.Colors.textSecondary,
    opacity: 0.9,
    fontSize: theme.Typography.fontSize.sm,
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.regular,
  },
});

export default WelcomeScreen;
