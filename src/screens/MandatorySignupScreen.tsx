import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar, Animated, useColorScheme } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';

const MandatorySignupScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isDarkMode = useColorScheme() === 'dark';
  const newsImage = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#1F2937" : "#FFFFFF"}
        translucent={false}
      />
      
      {/* Background Image with Blur */}
      <ImageBackground
        source={{ uri: newsImage }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <Animated.View style={[styles.gradientWrapper, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
            style={styles.gradientOverlay}
          />
        </Animated.View>
      </ImageBackground>

      {/* Glassmorphism Card */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.glassCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <Text style={styles.title}>Sign up to continue</Text>
          <Text style={styles.subtitle}>
            You've reached the free article limit. Create an account to keep reading and personalize your feed.
          </Text>
          
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Welcome', { fromRoute: 'MandatorySignup' })}
          >
            <Text style={styles.primaryButtonText}>Sign up / Log in</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>pulse</Text>
            <View style={styles.logoAccent} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.xl,
  },
  glassCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    borderRadius: theme.BorderRadius.xl,
    padding: theme.Spacing['2xl'],
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
    overflow: 'hidden',
  },
  title: {
    fontSize: theme.Typography.fontSize['3xl'],
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: theme.Spacing.md,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  subtitle: {
    fontSize: theme.Typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: theme.Spacing.xl,
    lineHeight: 24,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  primaryButton: {
    backgroundColor: theme.Colors.primary,
    paddingVertical: theme.Spacing.md,
    borderRadius: theme.BorderRadius.full,
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: theme.Typography.fontSize.base,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.Spacing.lg,
  },
  logoText: {
    fontSize: theme.Typography.fontSize.xl,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 2,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  logoAccent: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.Colors.primary,
    marginLeft: theme.Spacing.xs,
  },
});

export default MandatorySignupScreen;

