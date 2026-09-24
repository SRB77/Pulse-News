/**
 * Settings Screen Component
 * Screen for app settings and account management
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { firebaseService } from '../services/firebaseService';
import { ShareIcon, DocumentIcon, PrivacyIcon, ContactIcon, LogoutIcon, DeleteIcon, ChevronLeftIcon } from '../components/Icons';
// Contact converted to screen

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(false);
  // removed modal state

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out Pulse - Your daily news companion! Get crisp, personalized news updates.',
        title: 'Pulse - News App',
      });
    } catch (error) {
      console.error('Error sharing app:', error);
      Alert.alert('Error', 'Failed to share the app');
    }
  };

  const handleTermsAndConditions = () => {
    navigation.navigate('TermsConditions');
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const handleContactUs = () => {
    navigation.navigate('Contact');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await firebaseService.signOut();
              // After logout, go to Feed; Feed will enforce guest limit (5)
              navigation.reset({
                index: 0,
                routes: [{ name: 'Feed' }],
              });
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteProfile = () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete your profile? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'This will permanently delete your account and all data. Are you absolutely sure?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    setIsLoading(true);
                    try {
                      // In a real app, you would implement account deletion
                      Alert.alert('Success', 'Account deletion feature would be implemented here.');
                      // await firebaseService.deleteAccount();
                      // navigation.navigate('Welcome');
                    } catch (error) {
                      console.error('Error deleting account:', error);
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
                    } finally {
                      setIsLoading(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const settingsItems = [
    {
      id: 'share',
      title: 'Share this app',
      icon: <ShareIcon size={20} color={theme.Colors.textSecondary} />,
      onPress: handleShareApp,
      showArrow: false,
    },
    {
      id: 'terms',
      title: 'Terms and Conditions',
      icon: <DocumentIcon size={20} color={theme.Colors.textSecondary} />,
      onPress: handleTermsAndConditions,
      showArrow: true,
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: <PrivacyIcon size={20} color={theme.Colors.textSecondary} />,
      onPress: handlePrivacyPolicy,
      showArrow: true,
    },
    {
      id: 'contact',
      title: 'Contact us',
      icon: <ContactIcon size={20} color={theme.Colors.textSecondary} />,
      onPress: handleContactUs,
      showArrow: true,
    },
    {
      id: 'delete',
      title: 'Delete profile',
      icon: <DeleteIcon size={20} color="#EF4444" />,
      onPress: handleDeleteProfile,
      showArrow: false,
      isDestructive: true,
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: <LogoutIcon size={20} color="#EF4444" />,
      onPress: handleLogout,
      showArrow: false,
      isDestructive: true,
    },
  ];

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
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Settings List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.settingsItem,
                index === settingsItems.length - 1 && styles.lastItem,
                item.isDestructive && styles.destructiveItem,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <View style={styles.itemLeft}>
                <View style={styles.iconContainer}>
                  {item.icon}
                </View>
                <Text style={[
                  styles.itemTitle,
                  item.isDestructive && styles.destructiveText
                ]}>
                  {item.title}
                </Text>
              </View>
              {item.showArrow && (
                <Text style={styles.arrow}>›</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Contact screen used instead of modal */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.background,
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
    elevation: 2,
  },
  backButton: {
    padding: theme.Spacing.xs,
  },
  backIcon: {
    color: theme.Colors.primary,
    fontSize: 24,
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: theme.Spacing.lg,
    paddingBottom: theme.Spacing.xl,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.Spacing.md,
    paddingHorizontal: 0,
    backgroundColor: '#FFFFFF',
    marginHorizontal: theme.Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  destructiveItem: {
    borderBottomColor: '#E9ECEF',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.Spacing.md,
  },
  itemTitle: {
    fontSize: theme.Typography.fontSize.sm,
    fontWeight: theme.Typography.fontWeight.medium,
    color: theme.Colors.text,
    flex: 1,
    fontFamily: theme.Typography.fontFamily.medium,
  },
  destructiveText: {
    color: '#EF4444',
  },
  arrow: {
    fontSize: theme.Typography.fontSize.xl,
    color: theme.Colors.textTertiary,
    fontWeight: theme.Typography.fontWeight.normal,
    fontFamily: theme.Typography.fontFamily.regular,
  },
});

export default SettingsScreen;
