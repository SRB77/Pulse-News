/**
 * Edit Profile Screen Component
 * Screen for editing user profile details
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { firebaseService } from '../services/firebaseService';
import TextField from '../components/TextField';
import { ChevronLeftIcon } from '../components/Icons';
import { theme } from '../constants/theme';

// Helper function to get initials from name or email
const getInitials = (name: string): string => {
  if (!name) return 'U';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    // First letter of first name + first letter of last name
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  } else if (parts.length === 1) {
    // If it's an email, use first letter before @
    if (name.includes('@')) {
      return name.charAt(0).toUpperCase();
    }
    // First two letters of single name
    return name.substring(0, 2).toUpperCase();
  }
  return 'U';
};

// Helper function to get dark primary color for initials background
const getInitialsColor = (name: string): string => {
  return theme.Colors.primaryDark;
};

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const currentUser = firebaseService.getCurrentUser();
    const loadUserData = async () => {
      if (!currentUser) {
        navigation.goBack();
        return;
      }
      
      setUser(currentUser);
      await loadUserProfile(currentUser);
    };

    loadUserData();
  }, []);

  const loadUserProfile = async (userData: any) => {
    try {
      const result = await firebaseService.getUserProfile();
      if (result.success && result.profile) {
        const profile = result.profile;
        console.log('EditProfileScreen - Loaded profile:', profile);
        
        // Pre-fill form with existing data
        setFullName(profile.displayName || userData.displayName || '');
        setEmail(profile.email || userData.email || '');
        setPhone(profile.phoneNumber || '');
      } else {
        console.log('EditProfileScreen - No profile found, using Firebase user data');
        // Set default values from Firebase user
        setFullName(userData.displayName || '');
        setEmail(userData.email || '');
        setPhone(userData.phoneNumber || '');
      }
    } catch (error) {
      console.error('EditProfileScreen - Error loading user profile:', error);
      // Set default values from Firebase user
      setFullName(userData.displayName || '');
      setEmail(userData.email || '');
      setPhone(userData.phoneNumber || '');
    }
  };


  const handleCancel = () => {
    navigation.goBack();
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setIsLoading(true);

    try {
      const profileData = {
        displayName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phone.trim() || undefined, // Optional - only save if provided
        onboardingCompleted: true, // Mark as completed since they're editing
      };

      const result = await firebaseService.saveUserProfile(profileData);
      if (!result.success) {
        console.error('Error saving profile:', result.error);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
        return;
      }
      
      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ChevronLeftIcon size={24} color={theme.Colors.text} />
          </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profilePictureContainer}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.profilePicture} />
              ) : (
                <View style={[styles.profilePicturePlaceholder, { backgroundColor: getInitialsColor(fullName || user?.email || user?.displayName || 'User') }]}>
                  <Text style={styles.profilePictureText}>
                    {getInitials(fullName || user?.displayName || user?.email || 'User')}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName} numberOfLines={1}>
                {fullName || user?.displayName || 'Add your name'}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {email || user?.email || 'Add an email address'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.formCard}>


          <TextField
            label="Full Name"
            icon="person"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            style={styles.inputSpacing}
          />

          <TextField
            label="Email"
            icon="email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            style={styles.inputSpacing}
          />
          <TextField
            label="Phone Number (Optional)"
            icon="phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            style={styles.inputSpacing}
          />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonText, styles.secondaryActionText]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction, styles.actionButtonSpacing, isLoading && styles.actionButtonDisabled]}
            onPress={handleSaveProfile}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.Colors.textWhite} />
            ) : (
              <Text style={[styles.actionButtonText, styles.primaryActionText]}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.backgroundSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.lg,
    paddingBottom: theme.Spacing['3xl'],
  },
  
  // Header Styles - Match NewsDetailScreen
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
    elevation: 2,
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
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  
  profileCard: {
    backgroundColor: theme.Colors.background,
    borderRadius: theme.BorderRadius.xl,
    padding: theme.Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
    borderWidth: 1,
    borderColor: theme.Colors.borderLight,
    ...theme.Shadows.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePictureContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.Spacing.md,
    overflow: 'hidden',
  },
  profilePicture: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  profilePicturePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePictureText: {
    fontSize: 24,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: '#FFFFFF',
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.Typography.fontSize.lg,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  profileEmail: {
    marginTop: 4,
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textSecondary,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  
  formCard: {
    backgroundColor: theme.Colors.background,
    borderRadius: theme.BorderRadius.xl,
    padding: theme.Spacing.lg,
    borderWidth: 1,
    borderColor: theme.Colors.borderLight,
    ...theme.Shadows.sm,
    marginBottom: theme.Spacing.lg,
  },
  cardHeader: {
    marginBottom: theme.Spacing.md,
  },
  cardTitle: {
    fontSize: theme.Typography.fontSize.lg,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textSecondary,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  inputSpacing: {
    marginBottom: theme.Spacing.md,
  },
  inputLabel: {
    fontSize: theme.Typography.fontSize.base,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.textSecondary,
    marginBottom: theme.Spacing.xs,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.Spacing.lg,
    marginBottom: theme.Spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.Spacing.md,
    borderRadius: theme.BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: theme.Typography.fontSize.base,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  secondaryAction: {
    backgroundColor: theme.Colors.background,
    borderWidth: 1,
    borderColor: theme.Colors.borderLight,
  },
  secondaryActionText: {
    color: theme.Colors.text,
  },
  primaryAction: {
    backgroundColor: theme.Colors.primary,
  },
  primaryActionText: {
    color: theme.Colors.textWhite,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonSpacing: {
    marginLeft: theme.Spacing.md,
  },
});

export default EditProfileScreen;
