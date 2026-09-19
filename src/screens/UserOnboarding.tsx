
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { firebaseService } from '../services/firebaseService';
import Chip from '../components/Chip';
import { AnimatedSuccessIcon } from '../components/Icons';
import { theme } from '../constants/theme';

const UserOnboarding: React.FC = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'interests' | 'success'>('interests');
  const [interests, setInterests] = useState<string[]>([]);
  const [allInterests, setAllInterests] = useState<string[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const currentUser = firebaseService.getCurrentUser();
    const authInstance = firebaseService.getAuth();
    const firebaseUser = authInstance?.currentUser || currentUser;

    if (firebaseUser) {
      setUser(firebaseUser);
    } else {
      firebaseService.loadUserSession().then(sessionUser => {
        if (sessionUser) {
          setUser(sessionUser);
        } else {
          navigation.navigate('Welcome' as never);
        }
      });
    }
  }, []);

  // Fetch interests when component mounts
  useEffect(() => {
    const fetchInterests = async () => {
      setLoadingInterests(true);
      try {
        const result = await firebaseService.fetchTags();
        if (result.success && result.tags) {
          setAllInterests(result.tags);
        } else {
          console.error('Error fetching interests:', result.error);
          // Fallback to default interests
          setAllInterests(['World', 'India', 'Business', 'Technology', 'Sports', 'Entertainment', 'Science', 'Health']);
        }
      } catch (error) {
        console.error('Error fetching interests:', error);
        // Fallback to default interests
        setAllInterests(['World', 'India', 'Business', 'Technology', 'Sports', 'Entertainment', 'Science', 'Health']);
      } finally {
        setLoadingInterests(false);
      }
    };
    fetchInterests();
  }, []);

  const handleNext = async () => {
    if (step === 'interests') {
      if (interests.length === 0) {
        Alert.alert('Select Interests', 'Please select at least one news interest.');
        return;
      }
      try {
        setIsLoading(true);

        // Get current user to ensure we have uid
        const authInstance = firebaseService.getAuth();
        const firebaseUser = authInstance?.currentUser;
        
        // Get uid from Firebase Auth user (most reliable)
        let userUid: string | undefined;
        if (firebaseUser && firebaseUser.uid) {
          userUid = firebaseUser.uid;
        } else {
          // Fallback to service's current user
          const currentUser = firebaseService.getCurrentUser();
          if (currentUser && currentUser.uid) {
            userUid = currentUser.uid;
          }
        }
        
        if (!userUid) {
          throw new Error('No authenticated user found. Please sign in again.');
        }

        // Update profile with interests and mark onboarding as complete
        const saveResult = await firebaseService.saveUserProfile({
          uid: userUid,
          interests,
          onboardingCompleted: true,
        });

        if (!saveResult.success) {
          throw new Error(saveResult.error || 'Failed to save preferences');
        }

        setStep('success');
      } catch (error: any) {
        console.error('Error completing onboarding:', error);
        Alert.alert('Save Failed', error?.message || 'Could not save your preferences. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFinish = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Feed' as never }],
    });
  };

  const handleBack = () => {
    if (step === 'interests') {
      // Navigate to Welcome screen
      navigation.navigate('Welcome' as never);
    }
  };

  const toggleInterest = (i: string) => {
    setInterests(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]));
  };

  const renderInterests = () => (
    <>
      <View style={styles.header}>
      <Text style={styles.headerTitle}>What news interests you?</Text>
      <Text style={styles.headerSubtitle}>Select topics to tailor your feed.</Text>
      </View>
      
      <View style={styles.elevatedCard}>
        {loadingInterests ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.Colors.primary} />
            <Text style={styles.loadingInterestsText}>Loading interests...</Text>
          </View>
        ) : allInterests.length > 0 ? (
          <View style={styles.chipWrap}>
            {allInterests.map(i => (
              <Chip key={i} label={i} selected={interests.includes(i)} onPress={() => toggleInterest(i)} />
            ))}
          </View>
        ) : (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={styles.emptyInterestsText}>No interests available</Text>
          </View>
        )}
      </View>
    </>
  );

  const renderSuccess = () => (
    <View style={styles.successWrap} key="success-screen">
      <AnimatedSuccessIcon key="animated-icon" size={88} />
      <Text style={styles.successTitle}>Profile ready!</Text>
      <Text style={styles.successSubtitle}>You can now explore your personalised feed.</Text>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      {/* Back Button - Show on profile and interests steps */}
      {step !== 'success' && (
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonContent}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M5 12l6-6M5 12l6 6"
                stroke={theme.Colors.text}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.backButtonText}>Back</Text>
          </View>
        </TouchableOpacity>
      )}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, step === 'success' && styles.scrollContentCentered]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 'interests' && renderInterests()}
        {step === 'success' && renderSuccess()}
      </ScrollView>
      <View style={styles.footer}>
        {step !== 'success' && (
          <View style={styles.stepIndicator}>
            {['interests', 'success'].map((s, index) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  step === s && styles.stepDotActive,
                ]}
              />
            ))}
          </View>
        )}
        {step !== 'success' ? (
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.ctaButton, styles.buttonSpacing, isLoading && styles.ctaButtonDisabled]}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[theme.Colors.primaryDark, theme.Colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.Colors.textWhite} />
              ) : (
                <Text style={styles.gradientButtonText}>Continue</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleFinish}
            style={styles.ctaButton}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[theme.Colors.primaryDark, theme.Colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Text style={styles.gradientButtonText}>Continue to App</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    
    flex: 1,
    backgroundColor: theme.Colors.backgroundSecondary, // White background like reference
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.Spacing.xl,
    paddingTop: theme.Spacing.lg,
    paddingBottom: 0,
  },
  scrollContentCentered: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.backgroundSecondary,
  },
  loadingText: {
    marginTop: theme.Spacing.md,
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.text,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  
  // Header Styles - Clean and minimal like reference
  headerContainer: {
    alignItems: 'center',
    marginBottom: theme.Spacing['2xl'],
    paddingTop: theme.Spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.Spacing['2xl'],
    paddingHorizontal: theme.Spacing.md,
  },
  headerTitle: {
    fontSize: theme.Typography.fontSize['2xl'],
    fontWeight: theme.Typography.fontWeight.bold,
    color: theme.Colors.text,
    textAlign: 'center',
    marginBottom: theme.Spacing.sm,
    fontFamily: theme.Typography.fontFamily.bold,
  },
  profileImageCompact: {
    width: 40,
    height: 40,
    borderRadius: theme.BorderRadius.full,
    backgroundColor: theme.Colors.backgroundTertiary,
    borderWidth: 2,
    borderColor: theme.Colors.primary,
    marginVertical: theme.Spacing.xs,
    alignSelf: 'center',
  },

  // Card Styles - White card with subtle shadow like reference
  elevatedCard: {
    backgroundColor: theme.Colors.backgroundSecondary,
    borderRadius: theme.BorderRadius.xl,
    paddingHorizontal: theme.Spacing.md,

    color: theme.Colors.text,
    marginBottom: theme.Spacing.lg,
    marginTop: theme.Spacing.md,
  },
  headerSubtitle: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.Spacing.xs,
    marginBottom: 0,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  formContainer: {
    marginTop: theme.Spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.Typography.fontSize.lg,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    marginBottom: theme.Spacing.lg,
    marginTop: theme.Spacing.sm,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },

  // Checkbox Row
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
  },
  forgotPassword: {
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.error,
    fontWeight: theme.Typography.fontWeight.normal,
    fontFamily: theme.Typography.fontFamily.regular,
  },

  // Chip Styles
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.sm,
    marginBottom: theme.Spacing.sm,
  },
  chipSpacing: {
    marginBottom: theme.Spacing.sm,
  },

  // Success Screen
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.Spacing.lg,
  },
  successTitle: {
    fontSize: theme.Typography.fontSize['2xl'],
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.bold,
  },
  successSubtitle: {
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.Typography.lineHeight.relaxed,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  loadingInterestsText: {
    marginTop: theme.Spacing.sm,
    color: theme.Colors.textTertiary,
    fontFamily: theme.Typography.fontFamily.regular,
    fontSize: theme.Typography.fontSize.sm,
  },
  emptyInterestsText: {
    color: theme.Colors.textTertiary,
    fontFamily: theme.Typography.fontFamily.regular,
    fontSize: theme.Typography.fontSize.sm,
  },

  // Footer Styles - Clean footer like reference
  footer: {
    paddingHorizontal: theme.Spacing.xl,
    paddingTop: theme.Spacing.md,
    paddingBottom: theme.Spacing.md,
    backgroundColor: theme.Colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.borderLight,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.Spacing.sm,
    gap: theme.Spacing.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: theme.BorderRadius.full,
    backgroundColor: theme.Colors.border,
  },
  stepDotActive: {
    backgroundColor: theme.Colors.primary,
    width: 24,
  },
  stepDotCompleted: {
    backgroundColor: theme.Colors.success,
  },
  
  // Button Styles - Clean pill buttons like reference
  buttonSpacing: {
    marginBottom: theme.Spacing.sm,
  },
  ctaButton: {
    borderRadius: theme.BorderRadius.full,
    overflow: 'hidden',
    marginTop: theme.Spacing.xs,
  },
  gradientButton: {
    width: '100%',

    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.BorderRadius.full,
    minHeight: 56,
  },
  gradientButtonText: {
    color: theme.Colors.textWhite,
    fontSize: theme.Typography.fontSize.lg,
    fontWeight: theme.Typography.fontWeight.extraBold,
    letterSpacing: 1,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  ctaButtonDisabled: {
    opacity: 0.8,
  },
  backButton: {
    paddingHorizontal: theme.Spacing.xl,
    paddingTop: theme.Spacing.md,
    paddingBottom: theme.Spacing.sm,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
  },
  backButtonText: {
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.text,
    fontFamily: theme.Typography.fontFamily.regular,
  },
});

export default UserOnboarding;
export default UserOnboarding;