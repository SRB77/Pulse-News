/**
 * Bottom Navigation Component
 * Fixed bottom navigation bar with Feed and Profile tabs
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FeedIcon, ProfileIcon } from './Icons';
import { theme } from '../constants/theme';

interface BottomNavigationProps {
  activeTab: 'feed' | 'account';
  onTabChange: (tab: 'feed' | 'account') => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.bottomNavigation}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onTabChange('feed')}
        activeOpacity={0.7}
      >
        <FeedIcon 
          size={20} 
          color={activeTab === 'feed' ? '#FFFFFF' : '#9CA3AF'} 
        />
        <Text style={[styles.navText, { color: activeTab === 'feed' ? '#FFFFFF' : '#9CA3AF' }]}>Feed</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onTabChange('account')}
        activeOpacity={0.7}
      >
        <ProfileIcon 
          size={20} 
          color={activeTab === 'account' ? '#FFFFFF' : '#9CA3AF'} 
        />
        <Text style={[styles.navText, { color: activeTab === 'account' ? '#FFFFFF' : '#9CA3AF' }]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavigation: {
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#000000', // Black background
    paddingHorizontal: theme.Spacing.xl,
    paddingVertical: theme.Spacing.sm,
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60, // Fixed height
    borderTopLeftRadius: theme.BorderRadius.lg,
    borderTopRightRadius: theme.BorderRadius.lg,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999, // Higher z-index to ensure it stays on top
    elevation: 10, // Android elevation for better layering
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: theme.Spacing.xs,
    paddingHorizontal: theme.Spacing.lg,
    borderRadius: theme.BorderRadius.sm,
    flex: 1, // Equal width for both tabs
    maxWidth: 120, // Prevent tabs from getting too wide
  },
  navText: {
    fontSize: theme.Typography.fontSize.xs,
    fontWeight: theme.Typography.fontWeight.medium,
    marginTop: theme.Spacing.xs,
    fontFamily: theme.Typography.fontFamily.medium,
  },
});

export default BottomNavigation;
