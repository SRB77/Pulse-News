import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { firebaseService } from '../services/firebaseService';
import { getBookmarks, BookmarkItem } from '../services/bookmarkService';
import { EditIcon, SettingsIcon } from '../components/Icons';
import PreferencesModal from './PreferencesModal';

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

// Helper function to generate a consistent color based on name/email
const getInitialsColor = (name: string): string => {
  if (!name) return '#6C757D';
  
  // List of nice colors for avatar backgrounds
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
    '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12',
    '#E67E22', '#16A085', '#27AE60', '#2980B9', '#8E44AD',
  ];
  
  // Generate a consistent index based on the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const AccountScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [savedArticles, setSavedArticles] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  
  // Pagination state
  const [displayedArticles, setDisplayedArticles] = useState<BookmarkItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreArticles, setHasMoreArticles] = useState(true);
  const articlesPerPage = 5;
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [showSortModal, setShowSortModal] = useState(false);

  // Animation values for loading dots
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check if user is signed in
    const currentUser = firebaseService.getAuth().currentUser;
    console.log('AccountScreen - Current user:', currentUser);
    setUser(currentUser);
    loadUserProfile();
    loadBookmarks();
  }, []);

  // (guest UI moved below after helper declarations)

  const loadUserProfile = async () => {
    try {
      const result = await firebaseService.getUserProfile();
      if (result.success && result.profile) {
        console.log('AccountScreen - Loaded user profile:', result.profile);
        setUserProfile(result.profile);
      }
    } catch (error) {
      console.error('AccountScreen - Error loading user profile:', error);
    }
  };

  // Loading animation effect
  useEffect(() => {
    if (isLoadingMore) {
      // Create wave animation for dots
      const waveDuration = 600;
      
      const dot1Wave = Animated.loop(
        Animated.sequence([
          Animated.timing(dot1Anim, { toValue: 1, duration: waveDuration / 2, useNativeDriver: true }),
          Animated.timing(dot1Anim, { toValue: 0, duration: waveDuration / 2, useNativeDriver: true }),
        ])
      );

      const dot2Wave = Animated.loop(
        Animated.sequence([
          Animated.delay(150),
          Animated.timing(dot2Anim, { toValue: 1, duration: waveDuration / 2, useNativeDriver: true }),
          Animated.timing(dot2Anim, { toValue: 0, duration: waveDuration / 2, useNativeDriver: true }),
        ])
      );

      const dot3Wave = Animated.loop(
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(dot3Anim, { toValue: 1, duration: waveDuration / 2, useNativeDriver: true }),
          Animated.timing(dot3Anim, { toValue: 0, duration: waveDuration / 2, useNativeDriver: true }),
        ])
      );

      dot1Wave.start();
      dot2Wave.start();
      dot3Wave.start();
    } else {
      dot1Anim.setValue(0);
      dot2Anim.setValue(0);
      dot3Anim.setValue(0);
    }
  }, [isLoadingMore]);

  const loadBookmarks = async () => {
    try {
      console.log('AccountScreen - Loading bookmarks...');
      const bookmarks = await getBookmarks();
      console.log('AccountScreen - Loaded bookmarks:', bookmarks.length);
      setSavedArticles(bookmarks);
      
      // Initialize pagination with bookmarks
      initializePagination(bookmarks);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
      console.log('AccountScreen - Loading completed');
    }
  };

  const initializePagination = (articles: BookmarkItem[]) => {
    const sortedArticles = sortArticles(articles, sortBy);
    const initialArticles = sortedArticles.slice(0, articlesPerPage);
    setDisplayedArticles(initialArticles);
    setCurrentPage(1);
    setHasMoreArticles(sortedArticles.length > articlesPerPage);
  };

  const loadMoreArticles = () => {
    if (isLoadingMore || !hasMoreArticles) return;
    
    setIsLoadingMore(true);
    
    // Simulate loading delay
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const startIndex = (nextPage - 1) * articlesPerPage;
      const endIndex = startIndex + articlesPerPage;
      const sortedArticles = sortArticles(savedArticles, sortBy);
      const newArticles = sortedArticles.slice(startIndex, endIndex);
      
      if (newArticles.length > 0) {
        setDisplayedArticles(prev => [...prev, ...newArticles]);
        setCurrentPage(nextPage);
        setHasMoreArticles(endIndex < sortedArticles.length);
      } else {
        setHasMoreArticles(false);
      }
      
      setIsLoadingMore(false);
    }, 500); // 500ms delay to simulate loading
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handlePreferencesSave = async (preferences: {
    interests: string[];
  }) => {
    try {
      console.log('Saving preferences:', preferences);
      
      // Save interests to Firebase - only pass interests, updatedAt is handled automatically
      const result = await firebaseService.saveUserProfile({
        interests: preferences.interests,
      });
      if (!result.success) {
        console.error('Error saving preferences:', result.error);
        Alert.alert('Error', 'Failed to save preferences. Please try again.');
        return;
      }
      
      // Reload user profile to get updated data
      await loadUserProfile();
      
      Alert.alert('Success', 'Preferences updated successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  const handleSettings = () => {
    navigation.navigate('AppSettings');
  };

  const sortArticles = (articles: BookmarkItem[], sortType: 'newest' | 'oldest' | 'title') => {
    const sorted = [...articles];
    
    switch (sortType) {
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.bookmarkedAt || a.timestamp);
          const dateB = new Date(b.bookmarkedAt || b.timestamp);
          return dateB.getTime() - dateA.getTime();
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.bookmarkedAt || a.timestamp);
          const dateB = new Date(b.bookmarkedAt || b.timestamp);
          return dateA.getTime() - dateB.getTime();
        });
      case 'title':
        return sorted.sort((a, b) => a.headline.localeCompare(b.headline));
      default:
        return sorted;
    }
  };

  const handleSortChange = (newSortBy: 'newest' | 'oldest' | 'title') => {
    setSortBy(newSortBy);
    setShowSortModal(false);
    // Re-initialize pagination with new sorting
    initializePagination(savedArticles);
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    // Check if we've reached the bottom
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      loadMoreArticles();
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      }) + ' ' + date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return timestamp;
    }
  };

  console.log('AccountScreen - Rendering with:', { loading, savedArticlesLength: savedArticles.length, user: !!user });

  // If not signed in, show signup prompt
  if (!user) {
    return (
      <View style={guestStyles.container}>
        <View style={guestStyles.card}>
          <Text style={guestStyles.title}>Create your Pulse account</Text>
          <Text style={guestStyles.subtitle}>Save articles, sync across devices, and personalize your feed.</Text>
          <TouchableOpacity style={guestStyles.cta} onPress={() => navigation.navigate('Welcome')} activeOpacity={0.8}>
            <Text style={guestStyles.ctaText}>Sign up / Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
       {/* Header with Settings */}
       <View style={styles.header}>
         <View style={styles.headerLeft} />
         <View style={styles.headerRight}>
           <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
             <SettingsIcon size={20} color="#666666" />
           </TouchableOpacity>
         </View>
       </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarInitials, { backgroundColor: getInitialsColor(user?.displayName || user?.email || 'User') }]}>
              <Text style={styles.avatarText}>
                {getInitials(user?.displayName || user?.email || 'User')}
              </Text>
            </View>
          )}
        </View>
        {!!user?.displayName && (
          <Text style={styles.profileName}>
            {user.displayName}
          </Text>
        )}
        {!!user?.email && (
          <Text style={styles.profileEmail}>
            {user.email}
          </Text>
        )}
        <View style={styles.profileButtonsRow}>
          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <View style={styles.editProfileIconContainer}>
              <EditIcon size={14} color="#495057" />
            </View>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.editPreferencesButton} 
            onPress={() => setShowPreferencesModal(true)}
          >
            <View style={styles.editPreferencesIconContainer}>
              <SettingsIcon size={14} color="#495057" />
            </View>
            <Text style={styles.editPreferencesText}>Edit Preferences</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Saved Articles Section */}
      <View style={styles.savedSection}>
        <View style={styles.savedHeader}>
          <Text style={styles.savedTitle}>Saved</Text>
          <View style={styles.savedUnderline} />
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading saved articles...</Text>
          </View>
        ) : displayedArticles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved articles yet</Text>
            <Text style={styles.emptySubtext}>Bookmark articles from the feed to see them here</Text>
            <TouchableOpacity 
              style={styles.browseButton} 
              onPress={() => navigation.navigate('Feed')}
            >
              <Text style={styles.browseButtonText}>Browse Feed</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {displayedArticles.map((article, index) => (
              <View
                key={article.id}
                style={styles.articleItem}
              >
                <TouchableOpacity 
                  style={styles.articleItemContent}
                  onPress={() => navigation.navigate('NewsDetail', { item: article })}
                  activeOpacity={0.7}
                >
                  <View style={styles.articleContent}>
                    <Text style={styles.articleDate}>
                      {formatDate(article.bookmarkedAt ?? article.timestamp)}
                    </Text>
                    <Text style={styles.articleTitle}>{article.headline}</Text>
                  </View>
                  <Image 
                    source={{ uri: article.imageUrl }} 
                    style={styles.articleImage}
                    defaultSource={{ uri: 'https://via.placeholder.com/60x60/E0E0E0/999999?text=📰' }}
                  />
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Loading Indicator */}
            {isLoadingMore && (
              <View style={styles.loadingIndicator}>
                <View style={styles.loadingDots}>
                  <Animated.View style={[
                    styles.loadingDot,
                    {
                      transform: [{
                        translateY: dot1Anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -10]
                        })
                      }],
                      opacity: dot1Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1]
                      })
                    }
                  ]} />
                  <Animated.View style={[
                    styles.loadingDot,
                    {
                      transform: [{
                        translateY: dot2Anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -10]
                        })
                      }],
                      opacity: dot2Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1]
                      })
                    }
                  ]} />
                  <Animated.View style={[
                    styles.loadingDot,
                    {
                      transform: [{
                        translateY: dot3Anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -10]
                        })
                      }],
                      opacity: dot3Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1]
                      })
                    }
                  ]} />
                </View>
                <Text style={styles.loadingIndicatorText}>Loading more...</Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
    
    <PreferencesModal
      visible={showPreferencesModal}
      onClose={() => setShowPreferencesModal(false)}
      onSave={handlePreferencesSave}
      initialPreferences={{
        interests: userProfile?.interests || []
      }}
    />
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 80, // Account for bottom navigation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.md,
    backgroundColor: '#FFFFFF',
    elevation: 6,
    zIndex: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
  },
  settingsButton: {
    backgroundColor: '#F8F9FA',
    padding: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.full,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: theme.Spacing.lg,
  },
  avatarContainer: {
    marginBottom: theme.Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    borderWidth: 0,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: '#FFFFFF',
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  profileName: {
    fontSize: theme.Typography.fontSize.xl,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: '#000000',
    marginBottom: theme.Spacing.xs,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  profileEmail: {
    fontSize: theme.Typography.fontSize.sm,
    color: '#666666',
    marginBottom: theme.Spacing.md,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  profileButtonsRow: {
    flexDirection: 'row',
    gap: theme.Spacing.md,
    justifyContent: 'center',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.BorderRadius.full,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    gap: theme.Spacing.xs,
  },
  editProfileIconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfileText: {
    fontSize: theme.Typography.fontSize.xs,
    color: '#495057',
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  editPreferencesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.BorderRadius.full,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    gap: theme.Spacing.xs,
  },
  editPreferencesIconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPreferencesText: {
    fontSize: theme.Typography.fontSize.xs,
    color: '#495057',
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  savedSection: {
    paddingHorizontal: theme.Spacing.lg,
    marginBottom: theme.Spacing['4xl'],
    paddingTop: theme.Spacing.md,
  },
  savedHeader: {
    marginBottom: theme.Spacing.lg,
  },
  savedTitle: {
    fontSize: theme.Typography.fontSize.lg,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: '#000000',
    marginBottom: theme.Spacing.xs,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  savedUnderline: {
    width: 40,
    height: 3,
    backgroundColor: theme.Colors.primary,
    borderRadius: 2,
  },
  articleItem: {
    marginVertical: theme.Spacing.xs,
  },
  articleItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E9ECEF',
  },
  articleContent: {
    flex: 1,
    marginRight: theme.Spacing.md,
  },
  articleDate: {
    fontSize: theme.Typography.fontSize.xs,
    color: '#999999',
    marginBottom: theme.Spacing.xs,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  articleTitle: {
    fontSize: theme.Typography.fontSize.sm,
    color: '#000000',
    fontWeight: theme.Typography.fontWeight.medium,
    lineHeight: 20,
    fontFamily: theme.Typography.fontFamily.medium,
  },
  articleImage: {
    width: 60,
    height: 60,
    borderRadius: theme.BorderRadius.sm,
  },
  loadingContainer: {
    paddingVertical: theme.Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.Typography.fontSize.sm,
    color: '#6C757D',
    fontStyle: 'italic',
    fontFamily: theme.Typography.fontFamily.regular,
  },
  emptyContainer: {
    paddingVertical: theme.Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.Typography.fontSize.base,
    color: '#6C757D',
    fontWeight: theme.Typography.fontWeight.medium,
    marginBottom: theme.Spacing.xs,
    fontFamily: theme.Typography.fontFamily.medium,
  },
  emptySubtext: {
    fontSize: theme.Typography.fontSize.sm,
    color: '#ADB5BD',
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.regular,
  },
  browseButton: {
    backgroundColor: theme.Colors.primary,
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.full,
    marginTop: theme.Spacing.md,
  },
  browseButtonText: {
    fontSize: theme.Typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: theme.Typography.fontWeight.semiBold,
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  loadMoreButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.md,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    marginTop: theme.Spacing.md,
    marginHorizontal: theme.Spacing.lg,
  },
  loadMoreButtonText: {
    fontSize: theme.Typography.fontSize.sm,
    color: '#495057',
    fontWeight: theme.Typography.fontWeight.medium,
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.medium,
  },
  loadingIndicator: {
    paddingVertical: theme.Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.Spacing.sm,
    marginBottom: theme.Spacing.sm,
    height: 20,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.Colors.primary,
  },
  loadingIndicatorText: {
    fontSize: theme.Typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: theme.Typography.fontWeight.medium,
    fontFamily: theme.Typography.fontFamily.medium,
  },
});

export default AccountScreen;
 
const guestStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.BorderRadius.lg,
    padding: theme.Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: theme.Typography.fontSize['2xl'],
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    marginBottom: theme.Spacing.sm,
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  subtitle: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.Spacing.lg,
    lineHeight: 20,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  cta: {
    backgroundColor: theme.Colors.primary,
    paddingVertical: theme.Spacing.md,
    paddingHorizontal: theme.Spacing['2xl'],
    borderRadius: theme.BorderRadius.full,
    alignSelf: 'center',
    minWidth: 200,
  },
  ctaText: {
    color: theme.Colors.textWhite,
    fontWeight: theme.Typography.fontWeight.semiBold,
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
});


