/**
 * Feed Screen Component
 * Inshorts-style news feed with single card view and infinite scrolling
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Animated, ActivityIndicator, Share, InteractionManager, PanResponder, Platform, Linking, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { firebaseService } from '../services/firebaseService';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../constants/theme';
import NewsCard from '../components/NewsCard.tsx';
import AdCard from '../components/AdCard';
import { AutoPlayIcon, SettingsIcon, InfiniteIcon, FilterIcon } from '../components/Icons';
import { toggleBookmark, getBookmarkedIds } from '../services/bookmarkService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PreferencesModal from './PreferencesModal';
import Svg, { Path, Circle } from 'react-native-svg';
import Speech from '@mhpdev/react-native-speech';
import WalkthroughScreen from '../components/WalkthroughScreen';
import { useWalkthrough } from '../hooks/useAppTour';

const { width, height } = Dimensions.get('window');

// Generic height calculation utility
const calculateAvailableHeight = (insets: any, headerHeight: number = 48, bottomNavHeight: number = 60) => {
  return height - insets.top - insets.bottom - headerHeight - bottomNavHeight;
};

// Generic snap interval calculation
const calculateSnapInterval = (insets: any, headerHeight: number = 48, bottomNavHeight: number = 60) => {
  return calculateAvailableHeight(insets, headerHeight, bottomNavHeight);
};

interface NewsItem {
  id: string;
  headline: string;
  content: string;
  imageUrl: string;
  source: string;
  newsTags: string[];
  areaTags: string[];
  timestamp: string;
  author: string;
  tags?: string[];
  category?: string;
  youtubeVideoUrl?: string; // YouTube video URL
}

const FeedScreen: React.FC = () => {
  // Walkthrough
  const { showWalkthrough, completeWalkthrough, skipWalkthrough } = useWalkthrough();
  
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [filterOptions, setFilterOptions] = useState<string[]>(['all', 'north eastern', 'nagaland', 'india']); // Default fallback
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [ads, setAds] = useState<Array<{ id: string; imageUrl: string }>>([]);
  const [loadingNews, setLoadingNews] = useState<boolean>(true);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const isSignedIn = !!firebaseService.getAuth().currentUser;
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [savedCurrentIndex, setSavedCurrentIndex] = useState<number>(0);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
  const [bookmarkingIds, setBookmarkingIds] = useState<Set<string>>(new Set());
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [tagIdToNameMap, setTagIdToNameMap] = useState<Map<string, string>>(new Map());
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [autoPlayMode, setAutoPlayMode] = useState<boolean>(false);
  const autoPlayCardIdRef = useRef<string | null>(null);
  const currentIndexRef = useRef<number>(0);
  
  // Track initial mount to prevent unnecessary reloads
  const isInitialMountRef = useRef(true);
  const hasLoadedNewsOnceRef = useRef(false);

  // Animation values for loading (same as NewsDetailScreen)
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  // Refs for walkthrough highlights
  const filterSectionRef = useRef<View>(null);
  const actionButtonsLayoutRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const toggleSwitchRef = useRef<View>(null);
  const cardStackRef = useRef<View>(null);

  // Measure functions for walkthrough
  const measureFilterSection = useCallback(async () => {
    return new Promise<{ x: number; y: number; width: number; height: number } | null>((resolve) => {
      if (filterSectionRef.current) {
        // Use requestAnimationFrame to ensure layout is complete
        requestAnimationFrame(() => {
          if (filterSectionRef.current) {
            filterSectionRef.current.measureInWindow((x, y, width, height) => {
              // Validate the measurement
              if (width > 0 && height > 0 && x >= 0 && y >= 0) {
                resolve({ x, y, width, height });
              } else {
                // Invalid measurement, try again after a short delay
                setTimeout(() => {
                  if (filterSectionRef.current) {
                    filterSectionRef.current.measureInWindow((x2, y2, width2, height2) => {
                      resolve({ x: x2, y: y2, width: width2, height: height2 });
                    });
                  } else {
                    resolve(null);
                  }
                }, 100);
              }
            });
          } else {
            resolve(null);
          }
        });
      } else {
        resolve(null);
      }
    });
  }, []);

  const measureActionButtons = useCallback(async () => {
    return new Promise<{ x: number; y: number; width: number; height: number } | null>((resolve) => {
      if (actionButtonsLayoutRef.current) {
        resolve(actionButtonsLayoutRef.current);
      } else {
        resolve(null);
      }
    });
  }, []);

  const measureToggleSwitch = useCallback(async () => {
    return new Promise<{ x: number; y: number; width: number; height: number } | null>((resolve) => {
      if (toggleSwitchRef.current) {
        toggleSwitchRef.current.measureInWindow((x, y, width, height) => {
          resolve({ x, y, width, height });
        });
      } else {
        resolve(null);
      }
    });
  }, []);

  const measureCardStack = useCallback(async () => {
    return new Promise<{ x: number; y: number; width: number; height: number } | null>((resolve) => {
      if (cardStackRef.current) {
        cardStackRef.current.measureInWindow((x, y, width, height) => {
          resolve({ x, y, width, height });
        });
      } else {
        resolve(null);
      }
    });
  }, []);

  // Callback to capture action buttons position from NewsCard
  const handleActionButtonsMeasure = useCallback((layout: { x: number; y: number; width: number; height: number }) => {
    actionButtonsLayoutRef.current = layout;
  }, []);

  // Walkthrough highlight targets
  const walkthroughTargets = useMemo(() => [
    {
      id: 'region-tags',
      measure: measureFilterSection,
      title: 'Region Tags',
      description: 'Tap on region tags at the top to filter news by location. You can change your account settings from here.',
      tooltipPosition: 'bottom' as const,
    },
    {
      id: 'action-buttons',
      measure: measureActionButtons,
      title: 'Action Buttons',
      description: 'Use the speaker to listen to articles, bookmark to save them, or share with friends.',
      tooltipPosition: 'top' as const,
    },
    {
      id: 'toggle-controls',
      measure: measureToggleSwitch,
      title: 'Toggle Controls',
      description: 'Enable auto-play mode for hands-free listening, or tap the filter icon to customize your preferences.',
      tooltipPosition: 'top' as const,
    },
    {
      id: 'swipe-up',
      measure: measureCardStack,
      title: 'Swipe Up',
      description: 'Swipe up to move to the next article.',
      tooltipPosition: 'bottom' as const,
    },
    {
      id: 'swipe-down',
      measure: measureCardStack,
      title: 'Swipe Down',
      description: 'Swipe down to go back to the previous article.',
      tooltipPosition: 'bottom' as const,
    },
    {
      id: 'swipe-left',
      measure: measureCardStack,
      title: 'Swipe Left',
      description: 'Swipe left to dislike an article.',
      tooltipPosition: 'bottom' as const,
    },
    {
      id: 'swipe-right',
      measure: measureCardStack,
      title: 'Swipe Right',
      description: 'Swipe right to like an article.',
      tooltipPosition: 'bottom' as const,
    },
  ], [measureFilterSection, measureActionButtons, measureToggleSwitch, measureCardStack]);


  // Filter news items based on user interests - EXACT STRING MATCHING
  const filterNewsByInterests = useCallback((news: NewsItem[]): NewsItem[] => {
    // If user not signed in or no interests, show all news
    if (!isSignedIn || !userInterests || userInterests.length === 0) {
      return news;
    }
    
    // Normalize user interests to lowercase strings (for comparison)
    const normalizedInterests = userInterests
      .map(i => String(i).toLowerCase().trim())
      .filter(i => i.length > 0); // Remove empty strings
    
    if (normalizedInterests.length === 0) {
      return news; // No valid interests, show all
    }
    
    // Filter news: only show articles where at least one tag matches a user interest
    let debugCount = 0;
    const filtered = news.filter((item) => {
      // Get tags from article - prioritize tags field, then newsTags, then category
      const articleTags = (item as any).tags || item.newsTags || [];
      const category = (item as any).category;
      
      // Collect all article tags as normalized strings (lowercase, trimmed)
      const normalizedArticleTags: string[] = [];
      
      // Process tags array
      if (Array.isArray(articleTags)) {
        articleTags.forEach((tag: any) => {
          if (tag !== null && tag !== undefined) {
            const tagStr = String(tag).toLowerCase().trim();
            if (tagStr.length > 0) {
              normalizedArticleTags.push(tagStr);
            }
          }
        });
      } else if (typeof articleTags === 'string') {
        // Handle case where tags might be a single string
        const tagStr = articleTags.toLowerCase().trim();
        if (tagStr.length > 0) {
          normalizedArticleTags.push(tagStr);
        }
      }
      
      // Add category if exists
      if (category !== null && category !== undefined) {
        const categoryStr = String(category).toLowerCase().trim();
        if (categoryStr.length > 0) {
          normalizedArticleTags.push(categoryStr);
        }
      }
      
      // Check if ANY article tag matches ANY user interest (exact string match)
      const hasMatch = normalizedArticleTags.some(articleTag => 
        normalizedInterests.some(interest => interest === articleTag)
      );
      
      // Debug logging for first few items
      if (debugCount < 3) {
        console.log('Article filtering check:', {
          headline: item.headline?.substring(0, 50),
          articleTags: normalizedArticleTags,
          userInterests: normalizedInterests,
          hasMatch
        });
        debugCount++;
      }
      
      return hasMatch;
    });
    
    console.log(`[FILTER] Filtered ${filtered.length} articles from ${news.length} total. User interests:`, normalizedInterests);
    
    return filtered;
  }, [isSignedIn, userInterests]);

  // Fetch news and ads from Firestore - OPTIMIZED for faster loading
  const loadNewsAndAds = useCallback(async (filter?: string, skipLoadingState: boolean = false) => {
    try {
      if (!skipLoadingState) {
        setLoadingNews(true);
      }
      
      // Fetch news and ads in parallel for faster loading
      // Use smaller limit on initial load for faster response
      const initialLimit = hasLoadedNewsOnceRef.current ? 50 : 20;
      const [newsResult, adsResult] = await Promise.all([
        firebaseService.fetchNews(filter, initialLimit),
        firebaseService.fetchAds(10) // Reduced ad limit for faster loading
      ]);
      
      // Mark as loaded after first successful fetch
      if (newsResult.success && !hasLoadedNewsOnceRef.current) {
        hasLoadedNewsOnceRef.current = true;
      }
      
      // Process news - filter based on user preferences BEFORE setting
      if (newsResult.success && newsResult.news) {
        // Apply filtering immediately if user is signed in and has preferences
        let newsToDisplay = newsResult.news;
        if (isSignedIn && userInterests && userInterests.length > 0) {
          // Only show news that matches user preferences
          newsToDisplay = filterNewsByInterests(newsResult.news);
        }
        
        // Set filtered news items
        setNewsItems(newsToDisplay);
      } else {
        console.error('Failed to fetch news:', newsResult.error);
        // Fallback to mock data if Firestore fails
        setNewsItems(getMockNewsData());
      }

      // Process ads
      if (adsResult.success && adsResult.ads) {
        const transformedAds = adsResult.ads.map((ad: any) => ({
          id: ad.id,
          imageUrl: ad.imageUrl || '',
          redirectLink: ad.redirectLink || '',
        }));
        setAds(transformedAds);
      } else {
        console.error('Failed to fetch ads:', adsResult.error);
        // Fallback to default ads if Firestore fails
        setAds([
          { id: 'ad-1', imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=1200&fit=crop' },
          { id: 'ad-2', imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=1200&fit=crop' },
          { id: 'ad-3', imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=1200&fit=crop' },
          { id: 'ad-4', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=1200&fit=crop' },
        ]);
      }
    } catch (error) {
      console.error('Error loading news and ads:', error);
      // Fallback to mock data on error
      setNewsItems(getMockNewsData());
      setAds([
        { id: 'ad-1', imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=1200&fit=crop' },
        { id: 'ad-2', imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=1200&fit=crop' },
        { id: 'ad-3', imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=1200&fit=crop' },
        { id: 'ad-4', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=1200&fit=crop' },
      ]);
    } finally {
      if (!skipLoadingState) {
        setLoadingNews(false);
      }
    }
  }, [filterNewsByInterests, isSignedIn, userInterests]);

  // Load tag mappings (ID to name) in case articles use tag IDs
  const loadTagMappings = useCallback(async () => {
    try {
      // Import firestore directly to access tags collection
      const firestore = require('@react-native-firebase/firestore').default();
      const tagsSnapshot = await firestore.collection('tags').get();
      const idToNameMap = new Map<string, string>();
      
      tagsSnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        if (data.name) {
          idToNameMap.set(doc.id, data.name);
          idToNameMap.set(data.name.toLowerCase(), data.name); // Also map name to itself for lookup
        }
      });
      
      setTagIdToNameMap(idToNameMap);
      console.log('Loaded tag mappings:', Array.from(idToNameMap.entries()));
    } catch (error) {
      console.error('Error loading tag mappings:', error);
    }
  }, []);

  // Load user interests from profile
  const loadUserInterests = useCallback(async () => {
    try {
      console.log('Loading user interests from profile...');
      const profileResult = await firebaseService.getUserProfile();
      if (profileResult.success && profileResult.profile) {
        const interests = profileResult.profile.interests || [];
        console.log('Loaded user interests from profile:', interests);
        setUserInterests(interests);
        setUserProfile(profileResult.profile);
      } else {
        console.log('No profile found or failed to load profile:', profileResult.error);
        setUserInterests([]);
      }
    } catch (error) {
      console.error('Error loading user interests:', error);
      setUserInterests([]);
    }
  }, []);

  React.useEffect(() => {
    getBookmarkedIds().then(setBookmarkedIds);
    
    // Check if guest has already reached limit - navigate to signup screen
    if (!isSignedIn) {
      AsyncStorage.getItem(GUEST_LIMIT_REACHED_KEY).then((reached) => {
        if (reached === 'true') {
          navigation.navigate('MandatorySignup');
        }
      });
    } else {
      // Clear the flag when signed in
      AsyncStorage.removeItem(GUEST_LIMIT_REACHED_KEY);
      
      // Load user interests from profile
      loadUserInterests();
    }
  }, [isSignedIn, navigation, loadUserInterests]);

  // Keys for persistent memory
  const SCROLL_INDEX_KEY = 'feedScrollPosition';
  const LAST_ITEM_ID_KEY = 'feedLastItemId';
  const GUEST_LIMIT_REACHED_KEY = 'guestLimitReached';
  const sessionSeedRef = useRef<number>(Date.now());
  const restoredOnceRef = useRef<boolean>(false);

  // Save scroll position to AsyncStorage
  const saveScrollPosition = async (index: number) => {
    try {
      await AsyncStorage.setItem(SCROLL_INDEX_KEY, index.toString());
    } catch (error) {
      console.error('Error saving scroll position:', error);
    }
  };

  // Load scroll position from AsyncStorage
  const loadScrollPosition = async (): Promise<number> => {
    try {
      const savedPosition = await AsyncStorage.getItem(SCROLL_INDEX_KEY);
      return savedPosition ? parseInt(savedPosition, 10) : 0;
    } catch (error) {
      console.error('Error loading scroll position:', error);
      return 0;
    }
  };

  // Loading animation effect (same as NewsDetailScreen) - only for initial loading
  React.useEffect(() => {
    if (loadingNews && newsItems.length === 0) {
      const createWaveAnimation = () => {
        const waveDuration = 800;
        
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
      };

      createWaveAnimation();
    } else {
      // Reset animations when not loading
      dot1Anim.setValue(0);
      dot2Anim.setValue(0);
      dot3Anim.setValue(0);
    }
  }, [loadingNews, newsItems.length]);


  const handleToggleBookmark = useCallback(async (item: NewsItem) => {
    // Prevent rapid toggles that could cause flickering
    if (bookmarkingIds.has(item.id)) {
      return;
    }
    
    // Update UI immediately (optimistic update)
    const currentBookmarked = bookmarkedIds.has(item.id);
    const newBookmarkedState = !currentBookmarked;
    
    setBookmarkingIds(prev => new Set(prev).add(item.id));
    
    // Update bookmark state immediately for instant feedback
    setBookmarkedIds(prev => {
      const newSet = new Set(prev);
      if (newBookmarkedState) {
        newSet.add(item.id);
      } else {
        newSet.delete(item.id);
      }
      return newSet;
    });
    
    // Sync with Firebase/AsyncStorage in the background
    try {
      const nextState = await toggleBookmark({
        id: item.id,
        headline: item.headline,
        content: item.content,
        imageUrl: item.imageUrl,
        source: item.source,
        timestamp: item.timestamp,
        author: item.author,
      });
      
      // Verify the state matches (should always match since we updated optimistically)
      if (nextState !== newBookmarkedState) {
        // If states don't match, sync from storage
        const updated = await getBookmarkedIds();
        setBookmarkedIds(updated);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert optimistic update on error
      setBookmarkedIds(prev => {
        const newSet = new Set(prev);
        if (currentBookmarked) {
          newSet.add(item.id);
        } else {
          newSet.delete(item.id);
        }
        return newSet;
      });
    } finally {
      // Remove from bookmarking set
      setBookmarkingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  }, [bookmarkedIds, bookmarkingIds, toggleBookmark, getBookmarkedIds]);

  // Card stack animations - current card, next card behind, and old current card (for swipe down)
  const cardStackAnimations = useRef([
    {
      translateY: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1), // Current card - fully opaque
    },
    {
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0.98),
      opacity: new Animated.Value(1), // Next card behind - fully visible
    },
  ]).current;

  // Static animation values for old current card (stays in place when swiping down)
  const oldCurrentCardAnimations = useRef({
    translateY: new Animated.Value(0),
    scale: new Animated.Value(1),
    opacity: new Animated.Value(1),
  }).current;


  // Check for guest limit after card swipe
  React.useEffect(() => {
    if (!isSignedIn && indexBeyondFreeLimit(currentIndex)) {
      AsyncStorage.setItem(GUEST_LIMIT_REACHED_KEY, 'true');
      navigation.navigate('MandatorySignup');
    }
  }, [currentIndex, isSignedIn]);

  // Update current index ref when it changes (for auto-play and other refs)
  React.useEffect(() => {
    currentIndexRef.current = currentIndex;
    console.log('[FeedScreen] Current index updated to:', currentIndex);
  }, [currentIndex]);

  const handleShare = useCallback(async (item: NewsItem) => {
    try {
      // Create deep link URL
      const deepLinkUrl = `pulse://article/${item.id}`;
      
      // App Store and Play Store URLs (update these with actual store URLs when published)
      // Format: https://apps.apple.com/app/id[APP_ID] for iOS
      // Format: https://play.google.com/store/apps/details?id=[PACKAGE_NAME] for Android
      const appStoreUrl = 'https://apps.apple.com/app/pulse/id123456789'; // TODO: Replace with actual App Store URL
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.mk2004.pulse'; // Using bundle ID from config
      
      // Format share message with both deep link and store fallback
      const contentPreview = item.content.substring(0, 200) + (item.content.length > 200 ? '...' : '');
      const shareMessage = `${item.headline}\n\n${contentPreview}\n\n📱 Read full article in Pulse app:\n${deepLinkUrl}\n\nDon't have the app?\n${Platform.OS === 'ios' ? appStoreUrl : playStoreUrl}`;
      
      if (Platform.OS === 'ios') {
        // iOS: Share with both message and URL
        // The url parameter helps iOS recognize it, but may not make it clickable in all apps
        await Share.share({
          title: item.headline,
          message: shareMessage,
          url: deepLinkUrl,
        });
      } else {
        // Android: Share with message (URL included in message)
        await Share.share({
          title: item.headline,
          message: shareMessage,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, []);

  // Dynamic height calculations using utility functions
  const HEADER_HEIGHT = 56; // Updated to match new header height
  const BOTTOM_NAV_HEIGHT = 60;
  const availableHeight = calculateAvailableHeight(insets, HEADER_HEIGHT, BOTTOM_NAV_HEIGHT);
  const snapInterval = calculateSnapInterval(insets, HEADER_HEIGHT, BOTTOM_NAV_HEIGHT);

  // Save current index when navigating away (moved below for linter order)

  // Mock news data with tags
  const getMockNewsData = (): NewsItem[] => {
    const images = [
      'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1498598453630-d58556bc93a9?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1493810329807-515f1d59eb4c?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1558981359-219d6364c9f0?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1520975684859-0f37b06f2d16?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=1200&fit=crop'
    ];

    const sources = ['The Hindu', 'Times of India', 'Economic Times', 'BBC', 'Reuters', 'NDTV'];
    const tags: Array<keyof NewsItem> = ['newsTags']; // placeholder to satisfy TS generic usage
    const areaChoices = ['india', 'nagaland', 'north eastern'] as const;
    const newsTagsPool = ['politics', 'business', 'technology', 'health', 'science', 'sports', 'travel', 'entertainment'];

    const longParagraph = (topic: string) => (
      `${topic} is seeing a wave of developments across the region. Analysts note a blend of structural changes and consumer trends shaping outcomes. ` +
      `In conversations with stakeholders, we found nuanced perspectives on growth, access, and innovation. ` +
      `Meanwhile, local voices emphasized lived experiences, highlighting both opportunities and concerns.

` +
      `Experts pointed to data over the past 12 months showing measurable improvements, while cautioning that long-term resilience will require sustained investment. ` +
      `Case studies from multiple districts illustrate how policy, entrepreneurship, and community networks can accelerate adoption.

` +
      `Looking ahead, the next quarter will likely bring deeper integrations with technology and public infrastructure, creating possibilities for inclusive expansion.`
    );

    const items: NewsItem[] = Array.from({ length: 100 }).map((_, i) => {
      const idx = i + 1;
      const topic = ['Technology', 'Health', 'Tourism', 'Policy', 'Environment', 'Education', 'Startups', 'Culture'][idx % 8];
      const headline = `${topic} update #${idx}: Key developments and insights`;
      const content = longParagraph(topic) + '\n\n' + longParagraph(`${topic} in Nagaland`) + '\n\n' + longParagraph(`${topic} across India`);
      const imageUrl = images[idx % images.length];
      const source = sources[idx % sources.length];
      const author = ['Staff Reporter', 'Bureau Desk', 'Correspondent', 'Analyst'][idx % 4];
      const areaTags = [areaChoices[idx % areaChoices.length]] as unknown as string[];
      const newsTags = [newsTagsPool[idx % newsTagsPool.length], newsTagsPool[(idx + 3) % newsTagsPool.length]];
      return {
        id: String(idx),
        headline,
        content,
        imageUrl,
        source,
        newsTags,
        areaTags,
        timestamp: `${(idx % 12) + 1}h ago`,
        author,
      };
    });
    return items;
  };

  // Fetch filter options from Firestore
  const loadFilterOptions = async () => {
    try {
      const result = await firebaseService.fetchRegionFilters();
      if (result.success && result.filters) {
        // Remove duplicates while preserving order
        const uniqueFilters = Array.from(new Set(result.filters));
        setFilterOptions(uniqueFilters);
      } else if (result.filters) {
        // Use fallback filters from error response - remove duplicates
        const uniqueFilters = Array.from(new Set(result.filters));
        setFilterOptions(uniqueFilters);
      } else {
        console.error('Failed to fetch filter options:', result.error);
        // Keep default filters
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
      // Keep default filters
    }
  };



  // Initialize filter options, news and ads data - optimized for parallel loading
  React.useEffect(() => {
    // Load everything in parallel for faster initial load
    const loadInitialData = async () => {
      // Start loading news immediately (critical path)
      const newsPromise = loadNewsAndAds(selectedFilter);
      
      // Load user interests and tag mappings in parallel (non-blocking)
      const promises: Promise<any>[] = [newsPromise];
      
      if (isSignedIn) {
        promises.push(loadUserInterests());
      }
      
      // Load tag mappings in background (non-critical)
      promises.push(loadTagMappings());
      
      // Wait for critical path (news) to complete
      await newsPromise;
      
      // Defer non-critical operations
      InteractionManager.runAfterInteractions(() => {
        loadFilterOptions();
      });
    };
    
    loadInitialData();
    
    // Mark initial mount as complete faster
    setTimeout(() => {
      isInitialMountRef.current = false;
    }, 500);
  }, []);

  // Reload news when filter changes (only after initial load)
  React.useEffect(() => {
    // Only reload if we've already loaded data once (to avoid double loading on mount)
    // Use hasLoadedNewsOnceRef to track if initial load happened, not newsItems.length
    if (hasLoadedNewsOnceRef.current && !loadingNews) {
      setIsFiltering(true);
      loadNewsAndAds(selectedFilter).finally(() => {
        setIsFiltering(false);
      });
    }
  }, [selectedFilter]);

  // Reload news when user interests change (if signed in) - only if news is already loaded
  React.useEffect(() => {
    // Only reload if we have existing news items and interests changed
    // This prevents reloading on initial mount when interests are first loaded
    if (isSignedIn && newsItems.length > 0 && !loadingNews) {
      if (userInterests && userInterests.length > 0) {
        // User has preferences - reload and filter news
        setIsFiltering(true);
        loadNewsAndAds(selectedFilter).finally(() => {
          setIsFiltering(false);
        });
      } else {
        // User has no preferences - show all news (re-filter to remove any previous filtering)
      setIsFiltering(true);
      loadNewsAndAds(selectedFilter).finally(() => {
        setIsFiltering(false);
      });
      }
    }
  }, [userInterests, isSignedIn, selectedFilter, loadNewsAndAds]);

  // Reload user interests when screen comes into focus (in case preferences were updated)
  useFocusEffect(
    useCallback(() => {
      if (isSignedIn) {
        loadUserInterests();
      }
    }, [isSignedIn, loadUserInterests])
  );

  // Add new news item for refresh
  const addNewNewsItem = () => {
    const newItem: NewsItem = {
      id: `${Date.now()}`,
      headline: 'Breaking: New Development in Technology Sector',
      content: 'Latest updates from the technology sector show significant advancements in AI and machine learning. Companies are investing heavily in research and development to stay competitive in the rapidly evolving market.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
      source: 'Tech News',
      newsTags: ['technology', 'business'],
      areaTags: ['india'],
      timestamp: 'just now',
      author: 'Tech Reporter'
    };
    setNewsItems(prev => [newItem, ...prev]);
  };

  // Filter news based on selected filter AND user interests (memoized for performance)
  const filteredNews = React.useMemo(() => {
    // First, apply user interest filtering if signed in and has interests
    let interestFiltered = newsItems;
    if (isSignedIn && userInterests && userInterests.length > 0) {
      console.log(`[FILTER] Applying interest filter. News items: ${newsItems.length}, User interests:`, userInterests);
      interestFiltered = filterNewsByInterests(newsItems);
      console.log(`[FILTER] After interest filter: ${interestFiltered.length} items`);
    } else {
      console.log(`[FILTER] No interest filtering - signed in: ${isSignedIn}, interests count: ${userInterests?.length || 0}`);
    }
    
    // Then, apply region filter if not 'all'
    if (selectedFilter === 'all') return interestFiltered;
    const filterLower = selectedFilter.toLowerCase();
    return interestFiltered.filter(item => {
      // Check if item has regions array (from Firebase)
      if ((item as any).regions && Array.isArray((item as any).regions)) {
        return (item as any).regions.some((r: string) => r.toLowerCase() === filterLower);
      }
      // Fallback to areaTags for backward compatibility
      if (item.areaTags && Array.isArray(item.areaTags)) {
        return item.areaTags.some((tag: string) => tag.toLowerCase() === filterLower);
      }
      return false;
    });
  }, [newsItems, selectedFilter, isSignedIn, userInterests, filterNewsByInterests]);

  // Insert ads after random intervals (5–7) and avoid repeating the same ad ID consecutively (deterministic per session)
  const feedWithAds = React.useMemo(() => {
    const feedItems: Array<{ type: 'news' | 'ad'; item?: NewsItem | { id: string; imageUrl: string; redirectLink?: string }; index: number }> = [];
    
    // Use ads from Firestore or fallback to empty array
    const availableAds = ads.length > 0 ? ads : [];

    // Simple deterministic PRNG for session-stable randomness
    const prng = (() => {
      let a = sessionSeedRef.current % 2147483647;
      if (a <= 0) a += 2147483646;
      return () => (a = (a * 16807) % 2147483647) / 2147483647;
    })();
    const randGap = () => 5 + Math.floor(prng() * 3); // 5, 6, or 7
    let nextAdAt = randGap();
    let lastAdId: string | null = null;

    for (let index = 0; index < filteredNews.length; index += 1) {
      const item = filteredNews[index];
      feedItems.push({ type: 'news', item, index });

      // Only insert ads if we have ads available
      if (availableAds.length > 0 && index + 1 === nextAdAt) {
        // Pick an ad that is not the same as the previous one (by ID)
        let adIdx = Math.floor(prng() * availableAds.length);
        let selectedAd = availableAds[adIdx];
        
        // Ensure we don't repeat the same ad consecutively
        if (lastAdId !== null && availableAds.length > 1) {
          let safety = 0;
          while (selectedAd.id === lastAdId && safety < 10) {
            adIdx = Math.floor(prng() * availableAds.length);
            selectedAd = availableAds[adIdx];
            safety += 1;
          }
        }
        
        // If still same after 10 tries (unlikely but possible with few ads), just use it
        lastAdId = selectedAd.id;

        feedItems.push({
          type: 'ad',
          item: selectedAd,
          index: feedItems.length,
        });

        nextAdAt += randGap();
      }
    }

    return feedItems;
  }, [filteredNews, ads, sessionSeedRef.current]);

  // Track if animation is in progress
  const isAnimatingRef = useRef(false);
  // Track the old current card index when swiping down (so it stays rendered behind)
  const oldCurrentIndexRef = useRef<number | null>(null);

  // Card navigation functions
  const moveToNextCard = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex < feedWithAds.length - 1 && !isAnimatingRef.current) {
        isAnimatingRef.current = true;
        const nextIndex = prevIndex + 1;
        
        // Clear oldCurrentIndexRef when swiping up (so behind card logic works correctly)
        oldCurrentIndexRef.current = null;
        
        // Clear animation flag after animation completes (400ms to match card animation)
        setTimeout(() => {
          isAnimatingRef.current = false;
        }, 400);
        
        // Use requestAnimationFrame to batch the animation start
        requestAnimationFrame(() => {
          // Next card (now at position 0) starts from behind (scaled down, lower opacity)
          if (cardStackAnimations[0]) {
            // Start from behind position
            cardStackAnimations[0].translateY.setValue(0);
            cardStackAnimations[0].scale.setValue(0.98); // Scaled down
            cardStackAnimations[0].opacity.setValue(1); // Fully visible
          }
          
          // Animate next card coming forward from behind
          if (cardStackAnimations[0]) {
            // Set opacity to 1 immediately (no fade)
            cardStackAnimations[0].opacity.setValue(1);
            
            // Animate only scale - natural card reveal
            Animated.timing(cardStackAnimations[0].scale, {
              toValue: 1,
              duration: 400, // Faster but still natural
              easing: Easing.out(Easing.cubic), // Natural, organic easing curve
              useNativeDriver: true,
            }).start();
          }
          
          // Set up the new next card behind (card 1) if exists
          if (nextIndex + 1 < feedWithAds.length && cardStackAnimations[1]) {
            cardStackAnimations[1].translateY.setValue(0);
            cardStackAnimations[1].scale.setValue(0.98);
            cardStackAnimations[1].opacity.setValue(1); // New next card behind - fully visible
          } else if (cardStackAnimations[1]) {
            // No more cards, hide it
            cardStackAnimations[1].opacity.setValue(0);
          }
          
          // The old current card (NewsCard) handles its own upward animation
        });
        
        return nextIndex;
      }
      return prevIndex;
    });
  }, [feedWithAds.length, height]);

  const moveToPrevCard = useCallback(() => {
    if (currentIndex > 0 && !isAnimatingRef.current) {
      isAnimatingRef.current = true; // Prevent rapid calls
      const prevIndex = currentIndex - 1;
      
      // Track the old current card that will be animating downward
      // Set this BEFORE state update to ensure it's available in the next render
      oldCurrentIndexRef.current = currentIndex;
      
      // Update index - React will render previous card
      // Use functional update to ensure we have the latest state
      setCurrentIndex(prevIndex);
      
      // Clear the old current card after animation completes (400ms to match animation)
      setTimeout(() => {
        oldCurrentIndexRef.current = null;
      }, 400);
      
      // Reset isAnimatingRef immediately so card becomes interactive right away
      // The animation continues in the background but doesn't block interactions
      isAnimatingRef.current = false;
      
      // Use requestAnimationFrame to batch the animation start
      requestAnimationFrame(() => {
        // Previous card (now at position 0) starts from top of screen (off-screen)
        if (cardStackAnimations[0]) {
          // Start from top of screen (negative translateY) and scaled down
          cardStackAnimations[0].translateY.setValue(-height - 50); // Start from top, off-screen
          cardStackAnimations[0].scale.setValue(0.98); // Scaled down
          cardStackAnimations[0].opacity.setValue(1); // Full opacity immediately - no fade
        }
        
        // Animate previous card coming down from top and scaling up
        if (cardStackAnimations[0]) {
          // Animate both translateY (from top to center) and scale (from 0.98 to 1)
          Animated.parallel([
            Animated.timing(cardStackAnimations[0].translateY, {
              toValue: 0,
              duration: 400, // Faster but still natural - matches swipe up
              easing: Easing.out(Easing.cubic), // Natural, organic easing curve - matches swipe up
              useNativeDriver: true,
            }),
            Animated.timing(cardStackAnimations[0].scale, {
              toValue: 1,
              duration: 400, // Faster but still natural - matches swipe up
              easing: Easing.out(Easing.cubic), // Natural, organic easing curve - matches swipe up
              useNativeDriver: true,
            }),
          ]).start();
        }
        
        // Set up the behind card (card 1) - previous card when swiping down, next card when swiping up
        // When swiping down, we want the previous card (prevIndex - 1) behind, not the next card
        const behindIndex = prevIndex > 0 ? prevIndex - 1 : prevIndex + 1; // Previous card if exists, otherwise next card
        if (behindIndex >= 0 && behindIndex < feedWithAds.length && cardStackAnimations[1]) {
          cardStackAnimations[1].translateY.setValue(0);
          cardStackAnimations[1].scale.setValue(0.98);
          cardStackAnimations[1].opacity.setValue(1); // Card behind - fully visible
        } else if (cardStackAnimations[1]) {
          // No more cards, hide it
          cardStackAnimations[1].opacity.setValue(0);
        }
        
        // The old current card (NewsCard) handles its own downward animation
      });
    }
  }, [currentIndex, feedWithAds.length, height]);

  const handleDislike = useCallback(async (item: NewsItem) => {
    // Handle dislike action - could store in Firestore or just skip
    console.log('Disliked item:', item.id);
    // Navigate to next card after dislike
    moveToNextCard();
  }, [moveToNextCard]);

  // Simple feed length tracking
  const prevFeedLengthRef = useRef(feedWithAds.length);
  
  React.useEffect(() => {
      prevFeedLengthRef.current = feedWithAds.length;
  }, [feedWithAds.length]);

  // Handle filter changes and reset position if needed
  React.useEffect(() => {
    // When filter changes, show loading state briefly to prevent flickering
    setIsFiltering(true);
    
    // Reset to first item
    setCurrentIndex(0);
    setSavedCurrentIndex(0);
    
    // Use a timeout to ensure smooth transition
    const timeoutId = setTimeout(() => {
      setIsFiltering(false);
    }, 150);
    
    return () => clearTimeout(timeoutId);
  }, [selectedFilter, filteredNews.length]); // Depend on filteredNews.length for stability


  const handlePressCard = useCallback(async (item: NewsItem) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(LAST_ITEM_ID_KEY, item.id),
        AsyncStorage.setItem(SCROLL_INDEX_KEY, String(currentIndex)),
      ]);
    } catch {}
    if (isSignedIn) {
      navigation.push('NewsDetail', { item, _key: item.id });
    } else {
      // If guest and exceeded free quota, send to welcome
      if (indexBeyondFreeLimit(currentIndex)) {
        navigation.navigate('Welcome');
      } else {
        navigation.push('NewsDetail', { item, _key: item.id });
      }
    }
  }, [currentIndex, isSignedIn, navigation]);

  const FREE_LIMIT = 5;
  const indexBeyondFreeLimit = (index: number) => index >= FREE_LIMIT - 1; // Trigger on 5th card (index 4)

  // Calculate card height accounting for margins - reduced height for more bottom space
  const cardHeight = availableHeight - theme.Spacing.xs - theme.Spacing.md - theme.Spacing.sm; // Top and bottom padding with extra reduction

  // Stable callbacks for card actions
  const handleSignInPress = useCallback(() => {
    navigation.navigate('Welcome');
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadNewsAndAds(selectedFilter).finally(() => {
      setRefreshing(false);
      setCurrentIndex(0);
    });
  }, [selectedFilter, loadNewsAndAds]);

  // Card stack render - current card + card behind (previous when swiped down, next when swiped up)
  const renderCardStack = () => {
    const currentItem = feedWithAds[currentIndex];
    const nextItem = currentIndex + 1 < feedWithAds.length ? feedWithAds[currentIndex + 1] : null;
    const prevItem = currentIndex > 0 ? feedWithAds[currentIndex - 1] : null;
    // Get the old current card that stays behind when swiping down
    const oldCurrentIndex = oldCurrentIndexRef.current;
    const oldCurrentItem = oldCurrentIndex !== null ? feedWithAds[oldCurrentIndex] : null;
    
    // Determine which card to show behind:
    // - If we swiped down: show the old current card behind (so previous card stacks over it)
    // - Otherwise (swiping up or at rest): show the next card behind
    const swipedDown = oldCurrentIndex !== null && oldCurrentIndex > currentIndex;
    const behindItem = swipedDown ? oldCurrentItem : nextItem;

    return (
      <View style={styles.cardStackContainer}>
        {/* Card behind - previous when swiped down, next when swiped up */}
        {behindItem && (
        <Animated.View
            key={behindItem.type === 'ad' ? `ad-${behindItem.item?.id}` : `news-${(behindItem.item as NewsItem)?.id}`}
          style={[
            styles.cardStackItem,
            {
              transform: [
                  { translateY: cardStackAnimations[1].translateY },
                  { scale: cardStackAnimations[1].scale },
              ],
                opacity: cardStackAnimations[1].opacity,
                zIndex: oldCurrentItem ? 2 : 3, // Lower zIndex when it's the old current card animating down
            },
          ]}
            pointerEvents="none"
        >
            {behindItem.type === 'ad' ? (
            <AdCard 
                id={behindItem.item?.id || ''}
                imageUrl={behindItem.item?.imageUrl || ''}
                redirectLink={(behindItem.item as any)?.redirectLink}
              height={cardHeight}
              isSignedIn={isSignedIn}
                onSignInPress={handleSignInPress}
                onSwipeUp={undefined}
                onSwipeDown={undefined}
              />
            ) : behindItem.item && 'headline' in behindItem.item ? (
              <NewsCard 
                item={behindItem.item as NewsItem} 
                height={cardHeight} 
                onPress={undefined}
                onBookmark={undefined}
                onDislike={undefined}
                onShare={undefined}
                isBookmarked={bookmarkedIds.has(behindItem.item.id)}
                isBookmarking={bookmarkingIds.has(behindItem.item.id)}
                onSwipeComplete={undefined}
                onSwipeUp={undefined}
                onSwipeDown={undefined}
              />
            ) : null}
            {/* Dark overlay to make behind card appear darker */}
            <View style={styles.cardBehindOverlay} />
          </Animated.View>
        )}

        {/* Current card - slides down from top when swiping down */}
        {currentItem && (
          <Animated.View
            key={currentItem.type === 'ad' ? `ad-${currentItem.item?.id}` : `news-${(currentItem.item as NewsItem)?.id}`}
            style={[
              styles.cardStackItem,
              {
                transform: [
                  { translateY: cardStackAnimations[0].translateY },
                  { scale: cardStackAnimations[0].scale },
                ],
                opacity: cardStackAnimations[0].opacity,
                zIndex: oldCurrentItem ? 15 : 10, // Higher than behind card but lower than header (20) when swiping down
              },
            ]}
            pointerEvents="auto" // Always interactive
          >
            {currentItem.type === 'ad' ? (
              <AdCard 
                id={currentItem.item?.id || ''}
                imageUrl={currentItem.item?.imageUrl || ''}
                redirectLink={(currentItem.item as any)?.redirectLink}
                height={cardHeight}
                isSignedIn={isSignedIn}
                onSignInPress={handleSignInPress}
              onSwipeUp={currentIndex < feedWithAds.length - 1 ? moveToNextCard : undefined}
                onSwipeDown={currentIndex > 0 ? moveToPrevCard : undefined}
              />
            ) : currentItem.item && 'headline' in currentItem.item ? (
            <NewsCard 
                item={currentItem.item as NewsItem} 
              height={cardHeight} 
              onPress={handlePressCard}
              onActionButtonsMeasure={handleActionButtonsMeasure}
              onBookmark={handleToggleBookmark}
              onDislike={handleDislike}
              onShare={handleShare}
                isBookmarked={bookmarkedIds.has(currentItem.item.id)}
                isBookmarking={bookmarkingIds.has(currentItem.item.id)}
              onSwipeComplete={currentIndex < feedWithAds.length - 1 ? moveToNextCard : undefined}
              onSwipeUp={currentIndex < feedWithAds.length - 1 ? moveToNextCard : undefined}
                onSwipeDown={currentIndex > 0 ? moveToPrevCard : undefined}
              autoPlayMode={autoPlayMode}
              onAutoPlayNext={handleAutoPlayNext}
            />
          ) : null}
        </Animated.View>
        )}

      </View>
    );
  };


  // Save current index when navigating away (after feedWithAds is defined)
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      
      // Load saved position on mount
      const loadPosition = async () => {
        const [savedPosition, lastItemId] = await Promise.all([
          loadScrollPosition(),
          AsyncStorage.getItem(LAST_ITEM_ID_KEY)
        ]);

        // Prefer last clicked item id if present
        let targetIndex = savedPosition;
        if (lastItemId) {
          const found = feedWithAds.findIndex(
            (fi) => fi.type === 'news' && fi.item?.id === lastItemId
          );
          if (found >= 0) targetIndex = found;
          // Clear after a successful read so it doesn't force future restores
          try { await AsyncStorage.removeItem(LAST_ITEM_ID_KEY); } catch {}
        }

        if (mounted && targetIndex >= 0 && !restoredOnceRef.current) {
          setSavedCurrentIndex(targetIndex);
          setCurrentIndex(targetIndex);
          restoredOnceRef.current = true;
        }
      };

      loadPosition();
      
      // When screen loses focus, save current position
      return () => {
        mounted = false;
        if (currentIndex > 0) {
          setSavedCurrentIndex(currentIndex);
          saveScrollPosition(currentIndex);
        }
      };
    }, [currentIndex, snapInterval, feedWithAds.length])
  );

  // Toggle auto-play mode
  const toggleAutoPlay = useCallback(() => {
    const newAutoPlayMode = !autoPlayMode;
    setAutoPlayMode(newAutoPlayMode);
    
    if (!newAutoPlayMode) {
      // If turning off, stop any ongoing TTS
      Speech.stop();
      autoPlayCardIdRef.current = null;
    }
    // If turning on, NewsCard will automatically start TTS via its useEffect
  }, [autoPlayMode]);

  // Store handleAutoPlayNext and autoPlayMode in refs to avoid stale closures
  const handleAutoPlayNextRef = useRef<(() => void) | undefined>(undefined);
  const autoPlayModeRef = useRef(autoPlayMode);
  
  // Update autoPlayMode ref when it changes
  useEffect(() => {
    autoPlayModeRef.current = autoPlayMode;
  }, [autoPlayMode]);
  
  // Handle auto-play: when TTS finishes, move to next card
  // The NewsCard component will automatically start TTS for the new card
  const handleAutoPlayNext = useCallback(() => {
    console.log('[AutoPlay] ===== handleAutoPlayNext CALLED =====');
    console.log('[AutoPlay] autoPlayMode:', autoPlayModeRef.current);
    console.log('[AutoPlay] currentIndex:', currentIndex);
    console.log('[AutoPlay] feedWithAds.length:', feedWithAds.length);
    
    if (!autoPlayModeRef.current) {
      console.log('[AutoPlay] Auto-play mode is off, returning');
      return;
    }
    
    // Get current index from state
    const currentIdx = currentIndex;
    const nextIndex = currentIdx + 1;
    
    console.log('[AutoPlay] Current index:', currentIdx, 'Next index:', nextIndex);
    
    if (nextIndex >= feedWithAds.length) {
      // Reached end, turn off auto-play
      console.log('[AutoPlay] Reached end of feed, turning off auto-play');
      setAutoPlayMode(false);
      autoPlayCardIdRef.current = null;
      Speech.stop();
      return;
    }
    
    const nextItem = feedWithAds[nextIndex];
    console.log('[AutoPlay] Next item type:', nextItem?.type);
    
    // If next item is an ad, move to it first (the useEffect will handle 5-second skip if no text)
    if (nextItem && nextItem.type === 'ad') {
      const adItem = nextItem.item as any;
      const hasAdText = adItem?.adText && adItem.adText.trim().length > 0;
      
      if (hasAdText) {
        // Ad has text - could potentially read it, but for now just move to it and let user see it
        console.log('[AutoPlay] Ad has text, moving to ad card');
        moveToNextCard();
        // After a longer delay, continue (ads with text get more time)
        setTimeout(() => {
          if (autoPlayModeRef.current && handleAutoPlayNextRef.current) {
            handleAutoPlayNextRef.current();
          }
        }, 10000); // 10 seconds for ads with text
      } else {
        // Ad has no text - move to it, useEffect will skip after 5 seconds
        console.log('[AutoPlay] Ad has no text, moving to ad (will auto-skip in 5s)');
        moveToNextCard();
      }
    } else {
      // It's a news item, move to it - NewsCard will auto-start TTS
      console.log('[AutoPlay] Moving to next news item at index:', nextIndex);
      moveToNextCard();
    }
  }, [currentIndex, feedWithAds, moveToNextCard]);
  
  // Update ref when callback changes
  useEffect(() => {
    handleAutoPlayNextRef.current = handleAutoPlayNext;
  }, [handleAutoPlayNext]);

  // Auto-skip ads after 5 seconds if they don't have text (during auto-play)
  useEffect(() => {
    if (!autoPlayMode) return;
    
    const currentItem = feedWithAds[currentIndex];
    
    // Check if current item is an ad
    if (currentItem && currentItem.type === 'ad') {
      const adItem = currentItem.item as any;
      const hasAdText = adItem?.adText && adItem.adText.trim().length > 0;
      
      console.log('[AutoPlay] Current item is an ad, hasAdText:', hasAdText);
      
      // If ad has no text, skip it after 5 seconds
      if (!hasAdText) {
        console.log('[AutoPlay] Ad has no text, will skip in 5 seconds');
        const skipTimer = setTimeout(() => {
          if (autoPlayModeRef.current && handleAutoPlayNextRef.current) {
            console.log('[AutoPlay] 5 seconds passed, skipping ad');
            handleAutoPlayNextRef.current();
          }
        }, 5000); // 5 seconds
        
        return () => {
          clearTimeout(skipTimer);
        };
      }
    }
  }, [currentIndex, feedWithAds, autoPlayMode]);

  const capitalizeFilter = (text: string): string => {
    if (text === 'all') return 'All';
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.appName}>pulse</Text>
        <View style={styles.greenDot} />
      </View>
      
      <View style={styles.filterSection} ref={filterSectionRef}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterScrollContent}
          bounces={false}
          scrollEventThrottle={16}
          decelerationRate="fast"
        >
          {filterOptions.map((filter, index) => (
            <TouchableOpacity
              key={`${filter}-${index}`}
              style={[
                styles.filterCapsule,
                selectedFilter === filter && styles.filterCapsuleActive
              ]}
              onPress={() => {
                setSelectedFilter(filter);
                // Save current index when filter changes
                setSavedCurrentIndex(currentIndexRef.current);
                setCurrentIndex(0);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                {capitalizeFilter(filter)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );


  // Handle preferences save
  const handlePreferencesSave = async (preferences: { interests?: string[] }) => {
    if (isSignedIn) {
      try {
        const result = await firebaseService.saveUserProfile({
          interests: preferences.interests || [],
        });
        if (result.success) {
          // Reload user interests to update the feed
          await loadUserInterests();
          // Reload news with new filtering
          setIsFiltering(true);
          await loadNewsAndAds(selectedFilter);
          setIsFiltering(false);
        }
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    }
  };

  // Render loading animation (same as NewsDetailScreen)
  const renderLoadingAnimation = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        {/* Animated dots */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[
            styles.loadingDot,
            {
              transform: [{
                translateY: dot1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -12]
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
                  outputRange: [0, -12]
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
                  outputRange: [0, -12]
                })
              }],
              opacity: dot3Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1]
              })
            }
          ]} />
        </View>
        
        <Text style={styles.loadingText}>Loading articles...</Text>
      </View>
    </View>
  );

  // Render empty state when no news is available for the selected category
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyContent}>
        {/* Compact Icon */}
        <View style={styles.emptyIconContainer}>
          <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
                stroke={theme.Colors.primary}
              strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M7 8h10M7 12h10M7 16h7"
                stroke={theme.Colors.primary}
              strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.6}
              />
            </Svg>
        </View>
        
        <Text style={styles.emptyTitle}>No News Available</Text>
        <Text style={styles.emptyText}>
          No articles for <Text style={styles.emptyTextBold}>"{capitalizeFilter(selectedFilter)}"</Text> at the moment.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {/* Show loading animation only for initial article loading, not filtering */}
      {loadingNews && newsItems.length === 0 && renderLoadingAnimation()}
      
      {/* Show empty state when no news is available (not loading and not filtering) */}
      {!loadingNews && !isFiltering && feedWithAds.length === 0 && renderEmptyState()}
      
      {feedWithAds.length > 0 && (
        <View style={styles.cardStackWrapper} ref={cardStackRef}>
          {renderCardStack()}
        </View>
      )}
      
      {/* Toggle Switch */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggleSwitch} ref={toggleSwitchRef}>
          {/* Left Segment - Auto Play */}
          <TouchableOpacity
            style={[
              styles.toggleSegment,
              autoPlayMode && styles.toggleSegmentActive
            ]}
            onPress={toggleAutoPlay}
            activeOpacity={0.8}
          >
            <InfiniteIcon 
              size={22} 
              color={autoPlayMode ? theme.Colors.primary : '#FFFFFF'} 
            />
          </TouchableOpacity>
          
          {/* Separator */}
          <View style={styles.toggleSeparator} />
          
          {/* Right Segment - Filter/Settings */}
          <TouchableOpacity
            style={[
              styles.toggleSegment,
              showPreferencesModal && styles.toggleSegmentActive
            ]}
            onPress={() => setShowPreferencesModal(true)}
            activeOpacity={0.8}
          >
            <FilterIcon 
              size={22} 
              color={showPreferencesModal ? theme.Colors.primary : '#FFFFFF'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Preferences Modal */}
      <PreferencesModal
        visible={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        onSave={handlePreferencesSave}
        initialPreferences={{
          interests: userProfile?.interests || userInterests || [],
        }}
      />

      {/* Walkthrough */}
      <WalkthroughScreen
        visible={showWalkthrough}
        onComplete={completeWalkthrough}
        onSkip={skipWalkthrough}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.backgroundQuaternary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.md,
    borderBottomLeftRadius: theme.BorderRadius.lg,
    borderBottomRightRadius: theme.BorderRadius.lg,
    height: 56, // Slightly taller for better proportions
    zIndex: 20, // Higher than cards so swiping cards go behind it
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0, // Prevent shrinking
    paddingRight: theme.Spacing.sm, // Add spacing before filter section
  },
  autoPlayButton: {
    marginLeft: theme.Spacing.sm,
    padding: theme.Spacing.xs,
    borderRadius: theme.BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoPlayButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // Light green background when active
  },
  headerFilterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.Spacing.sm,
    padding: 0, // Remove any default padding
  },
  appName: {
    fontSize: theme.Typography.fontSize.xl,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: '#000000',
    marginLeft: theme.Spacing.sm,
    flexShrink: 0, // Prevent text from shrinking
    includeFontPadding: false, // Remove extra padding on Android
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: theme.Spacing.xs,
    marginBottom: theme.Spacing.xs,
    backgroundColor: theme.Colors.primary, // Changed to primary color
  },
  gradientOverlayLeft: {
    position: 'absolute',
    left: 0, // Start from the left edge of filter section
    top: 0,
    bottom: 0,
    width: 24, // Narrower gradient for subtler effect
    zIndex: 10, // Higher z-index to ensure it's above scrollable content
    pointerEvents: 'none', // Allow touch events to pass through
  },
  gradientOverlayRight: {
    position: 'absolute',
    right: 0, // Start from the left edge of filter section
    top: 0,
    bottom: 0,
    width: 24, // Narrower gradient for subtler effect
    zIndex: 10, // Higher z-index to ensure it's above scrollable content
    pointerEvents: 'none', // Allow touch events to pass through
  },
  filterSection: {
    flex: 1,
    marginLeft: theme.Spacing.lg,
    position: 'relative',
    zIndex: 0, // Below the gradient
  },
  filterScrollView: {
    flex: 1,
  },
  filterScrollContent: {
    paddingLeft: theme.Spacing.sm,
    paddingRight: theme.Spacing.xl,
  },
  filterCapsule: {
    backgroundColor: theme.Colors.backgroundTertiary,
    borderRadius: theme.BorderRadius.full,
    paddingHorizontal: theme.Spacing.md,
    marginRight: theme.Spacing.sm,
    borderWidth: 1,
    borderColor: theme.Colors.borderLight,
    minHeight: 24, // Fixed minimum height to prevent text cropping
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCapsuleActive: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
  filterText: {
    fontSize: theme.Typography.fontSize.sm,
    fontWeight: theme.Typography.fontWeight.medium,
    color: theme.Colors.textSecondary,
    lineHeight: 14, // Fixed line height to prevent cropping
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.medium,
  },
  filterTextActive: {
    color: theme.Colors.textWhite,
    fontWeight: theme.Typography.fontWeight.semiBold,
    lineHeight: 14, // Consistent line height
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  flatList: {
    flex: 1,
    position: 'relative',
  },
  flatListContent: {
    paddingTop: 0,
    paddingBottom: 80, // Account for fixed bottom navigation
    paddingHorizontal: theme.Spacing.sm,
  },
  stackedCard: {
    position: 'absolute',
    top: theme.Spacing.md + 20,
    left: 0,
    right: 0,
    zIndex: 1,
    transform: [{ scale: 0.95 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  nextCard: {
    top: theme.Spacing.md + 20,
    zIndex: 2,
  },
  currentCard: {
    position: 'absolute',
    top: theme.Spacing.md,
    left: 0,
    right: 0,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  cardStackWrapper: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: theme.Spacing.sm,
    paddingTop: theme.Spacing.xs,
    paddingBottom: theme.Spacing.xl, // Increased bottom margin between feed and bottom bar
  },
  cardStackContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    marginBottom: theme.Spacing.lg, // Increased bottom margin
    marginTop: theme.Spacing.sm, // Add top margin to feed cards
  },
  cardStackItem: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardBehindOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Dark overlay to make behind card appear darker
    borderRadius: theme.BorderRadius.lg,
  },
  accountContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.xl,
  },
  profileHeaderRow: {
    position: 'absolute',
    top: theme.Spacing.lg,
    right: theme.Spacing.lg,
    left: theme.Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileSection: {
    marginTop: theme.Spacing['2xl'],
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.Colors.backgroundTertiary,
    marginBottom: theme.Spacing.md,
  },
  profileName: {
    fontSize: theme.Typography.fontSize.xl,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  editProfileChip: {
    marginTop: theme.Spacing.md,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.BorderRadius.full,
    backgroundColor: theme.Colors.backgroundTertiary,
  },
  savedTitle: {
    fontSize: theme.Typography.fontSize.lg,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    marginBottom: theme.Spacing.sm,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  accountTitle: {
    fontSize: theme.Typography.fontSize['2xl'],
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    marginBottom: theme.Spacing.sm,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  accountSubtitle: {
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.textSecondary,
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.regular,
  },
  // Loading Animation Styles (same as NewsDetailScreen)
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.background,
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.Spacing.sm,
    marginBottom: theme.Spacing.lg,
    height: 30,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.Colors.primary,
  },
  loadingText: {
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.textSecondary,
    fontWeight: theme.Typography.fontWeight.medium,
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.lg,
    backgroundColor: theme.Colors.background,
  },
  emptyContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.Colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.md,
    borderWidth: 1.5,
    borderColor: theme.Colors.borderLight,
  },
  emptyTitle: {
    fontSize: theme.Typography.fontSize.xl,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    textAlign: 'center',
    marginBottom: theme.Spacing.xs,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  emptyText: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textSecondary,
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.regular,
    lineHeight: 20,
  },
  emptyTextBold: {
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.primary,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  toggleContainer: {
    position: 'absolute',
    right: theme.Spacing.md,
    bottom: theme.Spacing.lg + 60, // keep above bottom navigation
    alignItems: 'center',
    zIndex: 50,
    elevation: 50,
  },
  toggleSwitch: {
    flexDirection: 'row',
    backgroundColor: '#000000', // Black background
    borderRadius: 30, // Make it circular (pill shape)
    padding: 3,
    height: 50, // Fixed height for circular shape
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleSegment: {
    width: 40,
    backgroundColor: 'rgba(156, 163, 175, 0.3)', // Light greyish transparent separator

    height: 40, // Black background for inactive state
    borderRadius: 27, // Make segments perfectly circular
    alignItems: 'center',
    justifyContent: 'center'
  },
  toggleSeparator: {
    width: 1.5,
    height: 30,
    backgroundColor: 'rgba(156, 163, 175, 0.4)', // Light greyish transparent separator
    marginHorizontal: 4,
  },
  toggleSegmentActive: {
    backgroundColor: '#FFFFFF', // White background when active
    borderWidth: 1,
    borderColor: theme.Colors.primary, // Green border
  },
});

export default FeedScreen;