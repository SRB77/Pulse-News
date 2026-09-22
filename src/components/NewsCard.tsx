/**
 * News Card Component
 * Individual news card with image, content, and action buttons
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, PanResponder, Easing, Linking, Platform } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { BookmarkIcon, ShareIcon, SpeakerIcon } from './Icons';
import { theme } from '../constants/theme';
import Speech from '@mhpdev/react-native-speech';
import { Screen } from 'react-native-screens';
import Svg, { Path, Circle } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { firebaseService } from '../services/firebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

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
  publishedAt?: any; // Firestore timestamp
  createdAt?: any; // Firestore timestamp
  youtubeVideoUrl?: string; // YouTube video URL
}

interface NewsCardProps {
  item: NewsItem;
  height: number;
  onPress?: (item: NewsItem) => void;
  onBookmark?: (item: NewsItem) => void;
  onDislike?: (item: NewsItem) => void;
  onShare?: (item: NewsItem) => void;
  isBookmarked?: boolean;
  isBookmarking?: boolean;
  onSwipeComplete?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  autoPlayMode?: boolean;
  onAutoPlayNext?: () => void;
  onActionButtonsMeasure?: (layout: { x: number; y: number; width: number; height: number }) => void;
}

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const NewsCardComponent: React.FC<NewsCardProps> = ({ item, height, onPress, onBookmark, onDislike, onShare, isBookmarked, isBookmarking, onSwipeComplete, onSwipeUp, onSwipeDown, autoPlayMode = false, onAutoPlayNext, onActionButtonsMeasure }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const threshold = 30; // swipe distance to trigger action (lower = more sensitive, like Tinder)
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const feedbackScale = useRef(new Animated.Value(0.9)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.8)).current;
  const badgeRotation = useRef(new Animated.Value(0)).current;
  const prevBookmarkedRef = useRef<boolean | undefined>(undefined);
  const bookmarkButtonScale = useRef(new Animated.Value(1)).current;
  const viewCountedRef = useRef<boolean>(false);
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const [videoPlayingStates, setVideoPlayingStates] = useState<Map<string, boolean>>(new Map());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set());
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackColor, setFeedbackColor] = useState<string>('#10B981'); // green by default
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0); // 0 to 1 for swipe progress
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentSpeakingCardIdRef = useRef<string | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionButtonsRef = useRef<View>(null);

  // TTS Functions
  const stopTTS = useCallback(() => {
    if (isSpeaking || currentSpeakingCardIdRef.current === item.id) {
      Speech.stop();
      setIsSpeaking(false);
      currentSpeakingCardIdRef.current = null;
      // Clear fallback timer
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    }
  }, [isSpeaking, item.id]);

  const toggleTTS = useCallback(() => {
    if (isSpeaking && currentSpeakingCardIdRef.current === item.id) {
      // Stop if currently speaking this card
      stopTTS();
    } else {
      // Stop any other card that might be speaking
      if (currentSpeakingCardIdRef.current && currentSpeakingCardIdRef.current !== item.id) {
        Speech.stop();
      }
      
      // Clear any existing fallback timer
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      
      // Start speaking this card
      const textToSpeak = `${item.headline}. ${item.content}`;
      currentSpeakingCardIdRef.current = item.id;
      setIsSpeaking(true);
      
      // Estimate speech duration for fallback timer
      const wordCount = textToSpeak.split(/\s+/).length;
      const estimatedDuration = (wordCount / 150) * 60 * 1000; // ~150 words per minute
      
      // Set up fallback timer in case onDone doesn't fire
      fallbackTimerRef.current = setTimeout(() => {
        console.log('[TTS] Manual TTS fallback timer fired - onDone might not have been called');
        if (currentSpeakingCardIdRef.current === item.id) {
          setIsSpeaking(false);
          currentSpeakingCardIdRef.current = null;
          fallbackTimerRef.current = null;
        }
      }, estimatedDuration + 2000); // Add 2 seconds buffer
      
      // Use callbacks for immediate state updates
      (Speech.speak as any)(textToSpeak, {
        onStart: () => {
          if (currentSpeakingCardIdRef.current === item.id) {
            setIsSpeaking(true);
          }
        },
        onDone: () => {
          console.log('[TTS] Manual TTS onDone called for card:', item.id);
          // Clear fallback timer since onDone fired
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
          }
          if (currentSpeakingCardIdRef.current === item.id) {
            setIsSpeaking(false);
            currentSpeakingCardIdRef.current = null;
            
            // If auto-play mode is on, trigger next card
            if (autoPlayMode && onAutoPlayNext) {
              onAutoPlayNext();
            }
          }
        },
        onCancel: () => {
          console.log('[TTS] Manual TTS cancelled for card:', item.id);
          // Clear fallback timer
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
          }
          if (currentSpeakingCardIdRef.current === item.id) {
            setIsSpeaking(false);
            currentSpeakingCardIdRef.current = null;
          }
        },
      });
    }
  }, [isSpeaking, item.id, item.headline, item.content, stopTTS, autoPlayMode, onAutoPlayNext]);

  // Cleanup: stop TTS when component unmounts
  useEffect(() => {
    return () => {
      if (currentSpeakingCardIdRef.current === item.id) {
        Speech.stop();
        setIsSpeaking(false);
        currentSpeakingCardIdRef.current = null;
      }
      // Clear fallback timer
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [item.id]);

  // Store onAutoPlayNext and autoPlayMode in refs to avoid stale closures
  const onAutoPlayNextRef = useRef(onAutoPlayNext);
  const autoPlayModeRef = useRef(autoPlayMode);
  useEffect(() => {
    onAutoPlayNextRef.current = onAutoPlayNext;
    autoPlayModeRef.current = autoPlayMode;
  }, [onAutoPlayNext, autoPlayMode]);

  // Auto-start TTS when auto-play mode is enabled and this card becomes current
  useEffect(() => {
    if (autoPlayMode) {
      // Stop any previous TTS from other cards
      if (currentSpeakingCardIdRef.current && currentSpeakingCardIdRef.current !== item.id) {
        Speech.stop();
        currentSpeakingCardIdRef.current = null;
        setIsSpeaking(false);
      }
      
      // Only start TTS if we're not already speaking this card
      if (currentSpeakingCardIdRef.current !== item.id) {
        // Small delay to ensure card is fully rendered before starting TTS
        const timer = setTimeout(() => {
          // Double-check conditions after delay using refs
          if (autoPlayModeRef.current && currentSpeakingCardIdRef.current !== item.id) {
            const textToSpeak = `${item.headline}. ${item.content}`;
            currentSpeakingCardIdRef.current = item.id;
            setIsSpeaking(true);
            
            console.log('[TTS] Starting speech for card:', item.id);
            
            // Estimate speech duration (rough calculation: ~150 words per minute)
            const wordCount = textToSpeak.split(/\s+/).length;
            const estimatedDuration = (wordCount / 150) * 60 * 1000; // Convert to milliseconds
            console.log('[TTS] Estimated duration:', estimatedDuration, 'ms for', wordCount, 'words');
            
            // Clear any existing fallback timer
            if (fallbackTimerRef.current) {
              clearTimeout(fallbackTimerRef.current);
              fallbackTimerRef.current = null;
            }
            
            // Set up a fallback timer in case onDone doesn't fire
            fallbackTimerRef.current = setTimeout(() => {
              console.log('[TTS] Fallback timer fired - onDone might not have been called');
              if (currentSpeakingCardIdRef.current === item.id && autoPlayModeRef.current && onAutoPlayNextRef.current) {
                console.log('[TTS] Using fallback to trigger next card');
                currentSpeakingCardIdRef.current = null;
                setIsSpeaking(false);
                fallbackTimerRef.current = null;
                try {
                  onAutoPlayNextRef.current();
                } catch (error) {
                  console.error('[TTS] Error in fallback callback:', error);
                }
              }
            }, estimatedDuration + 2000); // Add 2 seconds buffer
            
            (Speech.speak as any)(textToSpeak, {
              onStart: () => {
                console.log('[TTS] Speech started for card:', item.id);
                if (currentSpeakingCardIdRef.current === item.id) {
                  setIsSpeaking(true);
                }
              },
              onDone: () => {
                console.log('[TTS] ===== Speech onDone CALLED ===== for card:', item.id);
                // Clear fallback timer since onDone fired
                if (fallbackTimerRef.current) {
                  clearTimeout(fallbackTimerRef.current);
                  fallbackTimerRef.current = null;
                }
                if (currentSpeakingCardIdRef.current === item.id) {
                  setIsSpeaking(false);
                  currentSpeakingCardIdRef.current = null;
                  
                  // If auto-play mode is still on, trigger next card (use ref to get latest value)
                  if (autoPlayModeRef.current && onAutoPlayNextRef.current) {
                    console.log('[TTS] Triggering next card immediately...');
                    console.log('[TTS] onAutoPlayNextRef.current exists:', !!onAutoPlayNextRef.current);
                    // Call immediately - no delay needed
                    try {
                      onAutoPlayNextRef.current();
                    } catch (error) {
                      console.error('[TTS] Error calling onAutoPlayNext:', error);
                    }
                  } else {
                    console.log('[TTS] Not triggering next - autoPlayMode:', autoPlayModeRef.current, 'hasCallback:', !!onAutoPlayNextRef.current);
                  }
                } else {
                  console.log('[TTS] Card ID mismatch - current:', currentSpeakingCardIdRef.current, 'expected:', item.id);
                }
              },
              onCancel: () => {
                console.log('[TTS] Speech cancelled for card:', item.id);
                // Clear fallback timer
                if (fallbackTimerRef.current) {
                  clearTimeout(fallbackTimerRef.current);
                  fallbackTimerRef.current = null;
                }
                if (currentSpeakingCardIdRef.current === item.id) {
                  setIsSpeaking(false);
                  currentSpeakingCardIdRef.current = null;
                }
              },
            });
          }
        }, 500); // Delay to ensure card animation completes
        
        return () => clearTimeout(timer);
      }
    } else {
      // If auto-play mode is turned off, stop TTS
      if (currentSpeakingCardIdRef.current === item.id) {
        Speech.stop();
        setIsSpeaking(false);
        currentSpeakingCardIdRef.current = null;
      }
    }
  }, [autoPlayMode, item.id, item.headline, item.content]);

  // Load liked/disliked articles from AsyncStorage
  useEffect(() => {
    const loadLikedDisliked = async () => {
      try {
        const likedData = await AsyncStorage.getItem('likedArticles');
        const dislikedData = await AsyncStorage.getItem('dislikedArticles');
        if (likedData) {
          setLikedIds(new Set(JSON.parse(likedData)));
        }
        if (dislikedData) {
          setDislikedIds(new Set(JSON.parse(dislikedData)));
        }
      } catch (error) {
        console.error('Error loading liked/disliked articles:', error);
      }
    };
    loadLikedDisliked();
  }, []);

  // Track view count when card is shown (only once per card)
  useEffect(() => {
    if (!viewCountedRef.current) {
      viewCountedRef.current = true;
      // Track view in Firebase (fire and forget, non-blocking)
      firebaseService.incrementArticleViewCount(item.id).catch((error) => {
        console.error('Error tracking view count:', error);
      });
    }
  }, [item.id]);

  // Format date function
  const formatDate = (timestamp: any): string => {
    try {
      let date: Date;
      
      // Handle Firestore timestamp
      if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return item.timestamp || '';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return item.timestamp || '';
      }
      
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return item.timestamp || '';
    }
  };

  // Calculate display date
  const displayDate = useMemo(() => {
    if (item.publishedAt) {
      return formatDate(item.publishedAt);
    } else if (item.createdAt) {
      return formatDate(item.createdAt);
    } else {
      // Try to parse from timestamp string
      return item.timestamp || '';
    }
  }, [item.publishedAt, item.createdAt, item.timestamp]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          const absDx = Math.abs(gesture.dx);
          const absDy = Math.abs(gesture.dy);
          
          // Don't capture swipe down if onSwipeDown is undefined (first card)
          if (absDy > absDx && gesture.dy > 0 && !onSwipeDown) {
            return false;
          }
          
          // Don't capture swipe up if onSwipeUp is undefined (last card)
          if (absDy > absDx && gesture.dy < 0 && !onSwipeUp) {
            return false;
          }
          
          // Capture horizontal swipes, swipe up, and swipe down (if callbacks exist)
          return (absDx > 5 || absDy > 5) && (absDx > absDy * 0.5 || absDy > absDx * 0.5);
        },
        onPanResponderGrant: () => {
          // Stop TTS when user starts swiping
          stopTTS();
          // Reset any ongoing animations
          translateX.setOffset((translateX as any).__getValue());
          translateX.setValue(0);
          translateY.setOffset((translateY as any).__getValue());
          translateY.setValue(0);
        },
        onPanResponderMove: (_, gesture) => {
          const absDx = Math.abs(gesture.dx);
          const absDy = Math.abs(gesture.dy);
          
          // Handle horizontal swipes (like/dislike)
          if (absDx > absDy) {
            translateX.setValue(gesture.dx);
            
            // Calculate swipe progress (0 to 1)
            const progress = Math.min(Math.abs(gesture.dx) / threshold, 1);
            setSwipeProgress(progress);
            
            // Check if already liked/disliked
            const isLiked = likedIds.has(item.id);
            const isDisliked = dislikedIds.has(item.id);
            
            // Minimal, elegant progressive feedback
            if (gesture.dx > 25) {
              setSwipeDirection('right');
              if (isLiked) {
                // Already liked - show feedback with badge
                setFeedbackText('Already Liked');
                setFeedbackColor('#10B981');
                feedbackOpacity.setValue(Math.min(progress, 1));
                feedbackScale.setValue(0.9 + (progress * 0.1));
                badgeOpacity.setValue(Math.min(progress * 1.2, 1));
                badgeScale.setValue(0.8 + (progress * 0.2));
                badgeRotation.setValue(progress * 8);
              } else {
                setFeedbackText('Liked');
                setFeedbackColor('#10B981');
                // Simple linear progression
                feedbackOpacity.setValue(Math.min(progress, 1));
                badgeOpacity.setValue(Math.min(progress * 1.2, 1));
                badgeScale.setValue(0.8 + (progress * 0.2)); // 0.8 to 1.0
                badgeRotation.setValue(progress * 8); // Max 8 degrees
              }
            } else if (gesture.dx < -25) {
              setSwipeDirection('left');
              if (isDisliked) {
                // Already disliked - show feedback with badge
                setFeedbackText('Already Disliked');
                setFeedbackColor('#EF4444');
                feedbackOpacity.setValue(Math.min(progress, 1));
                feedbackScale.setValue(0.9 + (progress * 0.1));
                badgeOpacity.setValue(Math.min(progress * 1.2, 1));
                badgeScale.setValue(0.8 + (progress * 0.2));
                badgeRotation.setValue(-progress * 8);
              } else {
                setFeedbackText('Disliked');
                setFeedbackColor('#EF4444');
                // Simple linear progression
                feedbackOpacity.setValue(Math.min(progress, 1));
                badgeOpacity.setValue(Math.min(progress * 1.2, 1));
                badgeScale.setValue(0.8 + (progress * 0.2)); // 0.8 to 1.0
                badgeRotation.setValue(-progress * 8); // Max -8 degrees
              }
            } else {
              setSwipeDirection(null);
              setSwipeProgress(0);
              feedbackOpacity.setValue(0);
              badgeOpacity.setValue(0);
              badgeScale.setValue(0.8);
              badgeRotation.setValue(0);
            }
            
            // No scaling - just smooth movement
          } else if (absDy > absDx && gesture.dy < 0) {
            // Swipe UP (negative dy) - match AdCard behavior exactly
            translateY.setValue(gesture.dy);
            
            // No text feedback for vertical swipes, just smooth movement
            setSwipeDirection(null);
            feedbackOpacity.setValue(0);
            
            // Keep opacity at 1 during swipe - no fading
            opacity.setValue(1);
          } else if (absDy > absDx && gesture.dy > 0) {
            // Swipe DOWN (positive dy) - keep card in place, previous card will stack on top
            // Reset translateY to 0 immediately so card doesn't move down
            translateY.setValue(0);
            
            // No text feedback for vertical swipes, just smooth movement
            setSwipeDirection(null);
            feedbackOpacity.setValue(0);
            
            // Keep opacity at 1 during swipe - no fading
            opacity.setValue(1);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          // Stop TTS on any swipe release
          stopTTS();
          translateX.flattenOffset();
          translateY.flattenOffset();
          
          const absDx = Math.abs(gesture.dx);
          const absDy = Math.abs(gesture.dy);
          
          // Handle horizontal swipe completion (like/dislike)
          if (absDx > absDy && absDx > threshold) {
            const screenWidth = Dimensions.get('window').width;
            
            // Check if already liked/disliked before animating
            const isLiked = likedIds.has(item.id);
            const isDisliked = dislikedIds.has(item.id);

            // If already liked/disliked in the same direction, don't swipe away - just snap back
            if ((gesture.dx > 0 && isLiked) || (gesture.dx < 0 && isDisliked)) {
              // Already in this state - snap back and show feedback with badge
              setSwipeDirection(gesture.dx > 0 ? 'right' : 'left');
              setFeedbackText(gesture.dx > 0 ? 'Already Liked' : 'Already Disliked');
              setFeedbackColor(gesture.dx > 0 ? '#10B981' : '#EF4444');
              feedbackOpacity.setValue(0);
              feedbackScale.setValue(0.9);
              
              Animated.parallel([
                Animated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 90,
                  friction: 8,
                }),
                Animated.timing(badgeOpacity, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.spring(badgeScale, {
                  toValue: 1,
                  useNativeDriver: true,
                  tension: 90,
                  friction: 8,
                }),
                Animated.spring(badgeRotation, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 90,
                  friction: 8,
                }),
                Animated.timing(feedbackOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
                Animated.spring(feedbackScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
              ]).start(() => {
                Animated.parallel([
                  Animated.timing(feedbackOpacity, { toValue: 0, delay: 600, duration: 180, useNativeDriver: true }),
                  Animated.timing(badgeOpacity, { toValue: 0, delay: 600, duration: 180, useNativeDriver: true }),
                ]).start(() => {
                  setFeedbackText('');
                  setSwipeDirection(null);
                });
              });
              return;
            }

            // Track like/dislike in Firebase IMMEDIATELY (before animation)
            let shouldShowToggleFeedback = false;
            let toggleFeedbackText = '';
            let toggleFeedbackColor = '';
            
            if (gesture.dx > 0) {
              // Swiping RIGHT (Like)
              if (isLiked) {
                // Already liked - toggle to dislike: decrement like, increment dislike
                console.log('Toggling from LIKE to DISLIKE for article:', item.id);
                shouldShowToggleFeedback = true;
                toggleFeedbackText = 'Changed to Dislike';
                toggleFeedbackColor = '#EF4444';
                const newLikedIds = new Set(likedIds);
                newLikedIds.delete(item.id);
                const newDislikedIds = new Set(dislikedIds);
                newDislikedIds.add(item.id);
                setLikedIds(newLikedIds);
                setDislikedIds(newDislikedIds);
                AsyncStorage.setItem('likedArticles', JSON.stringify(Array.from(newLikedIds))).catch(() => {});
                AsyncStorage.setItem('dislikedArticles', JSON.stringify(Array.from(newDislikedIds))).catch(() => {});
                
                // Decrement like count, increment dislike count
                firebaseService.decrementArticleLikeCount(item.id).then((result) => {
                  console.log('Like count decrement result:', result);
                }).catch((error) => {
                  console.error('Error decrementing like count:', error);
                });
                
                firebaseService.incrementArticleDislikeCount(item.id).then((result) => {
                  console.log('Dislike count increment result:', result);
                }).catch((error) => {
                  console.error('Error incrementing dislike count:', error);
                });
                
                if (onDislike) {
                  onDislike(item);
                }
              } else {
                // Not liked yet - add like
                console.log('Tracking LIKE for article:', item.id);
                const newLikedIds = new Set(likedIds);
                newLikedIds.add(item.id);
                // Remove from disliked if it was previously disliked
                const newDislikedIds = new Set(dislikedIds);
                newDislikedIds.delete(item.id);
                setLikedIds(newLikedIds);
                setDislikedIds(newDislikedIds);
                AsyncStorage.setItem('likedArticles', JSON.stringify(Array.from(newLikedIds))).catch(() => {});
                AsyncStorage.setItem('dislikedArticles', JSON.stringify(Array.from(newDislikedIds))).catch(() => {});
                
                // If previously disliked, decrement dislike count
                if (isDisliked) {
                  firebaseService.decrementArticleDislikeCount(item.id).then((result) => {
                    console.log('Dislike count decrement result (toggle to like):', result);
                  }).catch((error) => {
                    console.error('Error decrementing dislike count:', error);
                  });
                }
                
                // Increment like count
                firebaseService.incrementArticleLikeCount(item.id).then((result) => {
                  console.log('Like count increment result:', result);
                }).catch((error) => {
                  console.error('Error tracking like count:', error);
                });
              }
            } else if (gesture.dx < 0) {
              // Swiping LEFT (Dislike)
              if (isDisliked) {
                // Already disliked - toggle to like: decrement dislike, increment like
                console.log('Toggling from DISLIKE to LIKE for article:', item.id);
                shouldShowToggleFeedback = true;
                toggleFeedbackText = 'Changed to Like';
                toggleFeedbackColor = '#10B981';
                const newDislikedIds = new Set(dislikedIds);
                newDislikedIds.delete(item.id);
                const newLikedIds = new Set(likedIds);
                newLikedIds.add(item.id);
                setDislikedIds(newDislikedIds);
                setLikedIds(newLikedIds);
                AsyncStorage.setItem('dislikedArticles', JSON.stringify(Array.from(newDislikedIds))).catch(() => {});
                AsyncStorage.setItem('likedArticles', JSON.stringify(Array.from(newLikedIds))).catch(() => {});
                
                // Decrement dislike count, increment like count
                firebaseService.decrementArticleDislikeCount(item.id).then((result) => {
                  console.log('Dislike count decrement result:', result);
                }).catch((error) => {
                  console.error('Error decrementing dislike count:', error);
                });
                
                firebaseService.incrementArticleLikeCount(item.id).then((result) => {
                  console.log('Like count increment result:', result);
                }).catch((error) => {
                  console.error('Error incrementing like count:', error);
                });
              } else {
                // Not disliked yet - add dislike
                console.log('Tracking DISLIKE for article:', item.id);
                const newDislikedIds = new Set(dislikedIds);
                newDislikedIds.add(item.id);
                // Remove from liked if it was previously liked
                const newLikedIds = new Set(likedIds);
                newLikedIds.delete(item.id);
                setDislikedIds(newDislikedIds);
                setLikedIds(newLikedIds);
                AsyncStorage.setItem('dislikedArticles', JSON.stringify(Array.from(newDislikedIds))).catch(() => {});
                AsyncStorage.setItem('likedArticles', JSON.stringify(Array.from(newLikedIds))).catch(() => {});
                
                // If previously liked, decrement like count
                if (isLiked) {
                  firebaseService.decrementArticleLikeCount(item.id).then((result) => {
                    console.log('Like count decrement result (toggle to dislike):', result);
                  }).catch((error) => {
                    console.error('Error decrementing like count:', error);
                  });
                }
                
                // Increment dislike count
                firebaseService.incrementArticleDislikeCount(item.id).then((result) => {
                  console.log('Dislike count increment result:', result);
                }).catch((error) => {
                  console.error('Error tracking dislike count:', error);
                });
                
                if (onDislike) {
                  onDislike(item);
                }
              }
            }

            // Trigger callback immediately so next card becomes visible and interactive right away
            if (onSwipeComplete) {
              onSwipeComplete();
            }

            // Hide overlay and badge when animation starts (fade out quickly)
            Animated.parallel([
              Animated.timing(feedbackOpacity, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(badgeOpacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.timing(badgeScale, {
                toValue: 0.5,
                duration: 150,
                useNativeDriver: true,
              }),
            ]).start(() => {
              setSwipeDirection(null);
              setSwipeProgress(0);
            });

            // Animate card off screen - smooth and fast, no scaling
            Animated.spring(translateX, {
              toValue: gesture.dx > 0 ? screenWidth * 1.5 : -screenWidth * 1.5,
              useNativeDriver: true,
              tension: 90,
              friction: 7,
            }).start(() => {
              // Reset animations
              badgeRotation.setValue(0);
              badgeScale.setValue(0.8);
              
              // Show toggle feedback if needed (for previously liked/disliked items)
              if (shouldShowToggleFeedback) {
                setFeedbackText(toggleFeedbackText);
                setFeedbackColor(toggleFeedbackColor);
                setSwipeDirection(null); // Clear swipe direction to show feedback pill
                feedbackOpacity.setValue(0);
                feedbackScale.setValue(0.9);
                Animated.parallel([
                  Animated.timing(feedbackOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
                  Animated.spring(feedbackScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
                ]).start(() => {
                  Animated.timing(feedbackOpacity, { toValue: 0, delay: 600, duration: 180, useNativeDriver: true }).start(() => {
                    setFeedbackText('');
                  });
                });
              }
            });
          } else if (absDy > absDx && absDy > threshold && gesture.dy < 0) {
            // Swipe UP (negative dy) - match AdCard animation behavior exactly
            if (onSwipeUp) {
              // Get current position (where user released)
              const currentY = (translateY as any).__getValue();
              // Calculate distance to travel to go off screen (add extra to ensure it's completely gone)
              const targetY = -height - 50;
              
              // Trigger callback immediately so next card becomes visible and interactive right away
              onSwipeUp();
              
              // Animate card naturally upward - like lifting a card from a deck
              Animated.timing(translateY, {
                toValue: targetY,
                duration: 400, // Faster but still natural
                easing: Easing.out(Easing.cubic), // Natural, organic easing curve
                useNativeDriver: true,
              }).start(() => {
                // Keep card off-screen and hidden after animation
                // Don't reset - let the component unmount naturally when FeedScreen updates
                opacity.setValue(0);
              });
            } else {
              // Snap back smoothly if threshold not met
              Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }).start();
              setSwipeDirection(null);
              setSwipeProgress(0);
              feedbackOpacity.setValue(0);
              badgeOpacity.setValue(0);
              badgeScale.setValue(0.8);
              badgeRotation.setValue(0);
            }
          } else if (absDy > absDx && absDy > threshold && gesture.dy > 0) {
            // Swipe DOWN (positive dy) - animate card down, reverse of swipe up
            // Hide overlay immediately for vertical swipes
            Animated.timing(feedbackOpacity, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }).start(() => {
              setSwipeDirection(null);
            });
            
            if (onSwipeDown) {
              // Trigger callback immediately so previous card becomes visible and interactive right away
              onSwipeDown();
              
              // Reset translateY to 0 - card stays in place, previous card stacks on top
              translateY.setValue(0);
              opacity.setValue(1);
            } else {
              // Snap back smoothly if threshold not met
              Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }).start();
              // Keep opacity at 1 - no animation needed
              opacity.setValue(1);
            }
            setSwipeDirection(null);
            setSwipeProgress(0);
            feedbackOpacity.setValue(0);
            badgeOpacity.setValue(0);
            badgeScale.setValue(0.8);
            badgeRotation.setValue(0);
          } else if (absDy > absDx && gesture.dy > 0) {
            // Swipe down but threshold not met - just reset
            translateY.setOffset(0);
            translateY.setValue(0);
            setSwipeDirection(null);
            setSwipeProgress(0);
            feedbackOpacity.setValue(0);
            badgeOpacity.setValue(0);
            badgeScale.setValue(0.8);
            badgeRotation.setValue(0);
          } else {
            // Snap back smoothly if threshold not met (horizontal swipe cancelled)
            const isLiked = likedIds.has(item.id);
            const isDisliked = dislikedIds.has(item.id);
            const wasAlreadyLikedOrDisliked = (gesture.dx > 25 && isLiked) || (gesture.dx < -25 && isDisliked);
            
            // If was already liked/disliked, show feedback with badge
            if (wasAlreadyLikedOrDisliked) {
              setSwipeDirection(gesture.dx > 25 ? 'right' : 'left');
              setFeedbackText(gesture.dx > 25 ? 'Already Liked' : 'Already Disliked');
              setFeedbackColor(gesture.dx > 25 ? '#10B981' : '#EF4444');
              feedbackScale.setValue(0.9);
              
              Animated.parallel([
                Animated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 90,
                  friction: 8,
                }),
                Animated.timing(badgeOpacity, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.spring(badgeScale, {
                  toValue: 1,
                  useNativeDriver: true,
                  tension: 90,
                  friction: 8,
                }),
                Animated.spring(badgeRotation, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 90,
                  friction: 8,
                }),
                Animated.timing(feedbackOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
                Animated.spring(feedbackScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
              ]).start(() => {
                Animated.parallel([
                  Animated.timing(feedbackOpacity, { toValue: 0, delay: 600, duration: 180, useNativeDriver: true }),
                  Animated.timing(badgeOpacity, { toValue: 0, delay: 600, duration: 180, useNativeDriver: true }),
                ]).start(() => {
                  setFeedbackText('');
                  setSwipeDirection(null);
                });
              });
            } else {
              Animated.parallel([
                Animated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 90,
                  friction: 8,
                }),
                Animated.timing(badgeOpacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.spring(badgeScale, {
                  toValue: 0.8,
                  useNativeDriver: true,
                  tension: 90,
                  friction: 8,
                }),
                Animated.spring(badgeRotation, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 90,
                  friction: 8,
                }),
              ]).start();
              setSwipeDirection(null);
              setSwipeProgress(0);
              feedbackOpacity.setValue(0);
            }
          }
        },
        onPanResponderTerminate: () => {
          // Stop TTS when gesture is terminated
          stopTTS();
          translateX.flattenOffset();
          translateY.flattenOffset();
          Animated.parallel([
            Animated.spring(translateX, { 
              toValue: 0, 
              useNativeDriver: true,
              tension: 90,
              friction: 8,
            }),
            Animated.spring(translateY, { 
              toValue: 0, 
              useNativeDriver: true,
              tension: 90,
              friction: 8,
            }),
            Animated.timing(badgeOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(badgeScale, {
              toValue: 0.8,
              useNativeDriver: true,
              tension: 90,
              friction: 8,
            }),
            Animated.spring(badgeRotation, {
              toValue: 0,
              useNativeDriver: true,
              tension: 90,
              friction: 8,
            }),
          ]).start();
          setSwipeDirection(null);
          setSwipeProgress(0);
          feedbackOpacity.setValue(0);
        },
      }),
    [item, onBookmark, onDislike, isBookmarking, translateX, translateY, feedbackOpacity, badgeOpacity, badgeScale, badgeRotation, onSwipeComplete, onSwipeUp, onSwipeDown, height, stopTTS]
  );

  // Show visual feedback when bookmark state changes
  useEffect(() => {
    if (prevBookmarkedRef.current === undefined) {
      prevBookmarkedRef.current = !!isBookmarked;
      return;
    }
    if (prevBookmarkedRef.current !== isBookmarked) {
      const added = !!isBookmarked;
      setFeedbackText(added ? 'Bookmarked' : 'Removed from bookmarks');
      setFeedbackColor(added ? theme.Colors.primary : '#B91C1C');
      feedbackOpacity.setValue(0);
      feedbackScale.setValue(0.9);
      Animated.parallel([
        Animated.timing(feedbackOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.spring(feedbackScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
      ]).start(() => {
        Animated.timing(feedbackOpacity, { toValue: 0, delay: 600, duration: 180, useNativeDriver: true }).start();
      });
      prevBookmarkedRef.current = !!isBookmarked;
    }
  }, [isBookmarked, feedbackOpacity, feedbackScale]);

  // Tinder-like rotation - more pronounced rotation
  const rotation = translateX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-25deg', '0deg', '25deg'], // More rotation like Tinder
    extrapolate: 'clamp',
  });

  return (
    <Animated.View 
      style={[
        styles.swipeContainer, 
        { 
          transform: [
            { translateX },
            { translateY },
            { rotate: rotation },
          ],
        }
      ]} 
      {...panResponder.panHandlers}
    >
      <TouchableOpacity activeOpacity={1} onPress={() => onPress && onPress(item)} style={[styles.newsCard, { height, maxHeight: height }]}>
      <View style={styles.imageContainer}>
        {/* Show YouTube video if video URL exists (prioritize video over image), otherwise show image */}
        {item.youtubeVideoUrl ? (
          (() => {
            const videoId = getYouTubeVideoId(item.youtubeVideoUrl);
            const openYouTubeVideo = () => {
              if (item.youtubeVideoUrl) {
                const youtubeUrl = item.youtubeVideoUrl.startsWith('http') ? item.youtubeVideoUrl : `https://www.youtube.com/watch?v=${videoId}`;
                Linking.openURL(youtubeUrl).catch(err => console.error('Failed to open YouTube:', err));
              }
            };
            
            return videoId ? (() => {
              const screenWidth = Dimensions.get('window').width;
              // Card has paddingHorizontal: theme.Spacing.sm in FeedScreen's cardStackWrapper
              // So the actual card width is screen width minus that padding
              const cardPadding = theme.Spacing.sm * 2; // Left and right padding
              const cardWidth = screenWidth - cardPadding;
              
              // Calculate height based on 16:9 aspect ratio using full card width
              const aspectRatio = 16 / 9;
              const playerWidth = cardWidth;
              const playerHeight = cardWidth / aspectRatio;
              
              // Use calculated height for container
              const containerHeight = playerHeight;
              
              // Handle errors
              const handleError = (error: any) => {
                console.warn('YouTube player error:', error);
                setVideoErrors(prev => {
                  const newSet = new Set(prev);
                  newSet.add(videoId);
                  return newSet;
                });
              };
              
              // Handle when player is ready - ensure it starts playing
              const handleReady = () => {
                // Force play state to true when ready
                setVideoPlayingStates(prev => {
                  const newMap = new Map(prev);
                  newMap.set(videoId, true);
                  return newMap;
                });
              };
              
              // Handle state changes to track playback
              const handleStateChange = (state: string) => {
                if (state === 'playing') {
                  setVideoPlayingStates(prev => {
                    const newMap = new Map(prev);
                    newMap.set(videoId, true);
                    return newMap;
                  });
                } else if (state === 'paused' || state === 'ended') {
                  setVideoPlayingStates(prev => {
                    const newMap = new Map(prev);
                    newMap.set(videoId, false);
                    return newMap;
                  });
                }
              };
              
              // Get current playing state for this video
              const isPlaying = videoPlayingStates.get(videoId) ?? true;
              
              if (videoErrors.has(videoId)) {
                return (
                  <View 
                    style={[styles.videoContainer, { height: containerHeight }]}
                    pointerEvents="box-none"
                  >
                    <View 
                      style={styles.videoErrorContainer}
                      pointerEvents="auto"
                    >
                      <Text style={styles.videoErrorText}>Unable to load video</Text>
                      <TouchableOpacity 
                        style={styles.videoErrorButton}
                        onPress={openYouTubeVideo}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.videoErrorButtonText}>Open in YouTube</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
              
              return (
                <View 
                  style={[styles.videoContainer, { height: containerHeight }]}
                  pointerEvents="box-none"
                >
                  <View 
                    style={styles.videoPlayerWrapper}
                    pointerEvents="auto"
                    onStartShouldSetResponder={() => true}
                    onResponderTerminationRequest={() => false}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <YoutubePlayer
                      height={playerHeight}
                      width={playerWidth}
                      videoId={videoId}
                      play={isPlaying} // Autoplay
                      mute={true} // Start muted for guaranteed autoplay (user can unmute)
                      controls={1}
                      showFullscreenButton={true}
                      webViewStyle={{ 
                        opacity: 0.99,
                        backgroundColor: 'transparent',
                        width: '100%',
                        height: '100%',
                      }}
                      initialPlayerParams={{
                        autoplay: 1, // Enable autoplay
                        modestbranding: 1, // Reduces YouTube logo prominence
                        rel: 0, // Don't show related videos
                        playsinline: 1, // Play inline on iOS
                        iv_load_policy: 3, // Hide annotations
                        cc_load_policy: 0, // Hide closed captions by default
                        disablekb: 0, // Allow keyboard controls
                        fs: 1, // Allow fullscreen
                      }}
                      onReady={handleReady}
                      onChangeState={handleStateChange}
                      onError={handleError}
                      onHttpError={handleError}
                    />
                  </View>
                </View>
              );
            })() : (
              <View style={[styles.newsImage, { height: Math.max(height * 0.4, 200), backgroundColor: theme.Colors.backgroundTertiary, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={styles.mediaFallbackText}>Invalid video URL</Text>
              </View>
            );
          })()
        ) : item.imageUrl && item.imageUrl.trim() !== '' ? (
          <Image source={{ uri: item.imageUrl }} style={[styles.newsImage, { height: Math.max(height * 0.4, 200) }]} />
        ) : (
          <View style={[styles.newsImage, { height: Math.max(height * 0.4, 200), backgroundColor: theme.Colors.backgroundTertiary, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={styles.mediaFallbackText}>No image available</Text>
          </View>
        )}
        
        {/* Action buttons overlaid on image */}
        <View 
          ref={actionButtonsRef}
          style={styles.actionButtonsContainer}
          onLayout={() => {
            if (onActionButtonsMeasure && actionButtonsRef.current) {
              // Use setTimeout to ensure layout is complete
              setTimeout(() => {
                actionButtonsRef.current?.measureInWindow((x, y, width, height) => {
                  onActionButtonsMeasure({ x, y, width, height });
                });
              }, 100);
            }
          }}
        >
          <TouchableOpacity 
            style={[styles.actionButton, isSpeaking && styles.actionButtonActive]} 
            onPress={(e) => {
              e.stopPropagation();
              toggleTTS();
            }}
          >
            <SpeakerIcon 
              size={isSpeaking ? 18 : 20} 
              color={isSpeaking ? '#FFFFFF' : '#666666'} 
              active={isSpeaking}
            />
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: bookmarkButtonScale }] }}>
            <TouchableOpacity 
              style={[styles.actionButton, isBookmarking && styles.actionButtonDisabled]} 
              onPress={(e) => {
                e.stopPropagation();
                if (!isBookmarking && onBookmark) {
                  // Immediate scale animation for instant feedback
                  Animated.sequence([
                    Animated.spring(bookmarkButtonScale, {
                      toValue: 1.3,
                      useNativeDriver: true,
                      speed: 20,
                      bounciness: 8,
                    }),
                    Animated.spring(bookmarkButtonScale, {
                      toValue: 1,
                      useNativeDriver: true,
                      speed: 20,
                      bounciness: 8,
                    }),
                  ]).start();
                  onBookmark(item);
                }
              }}
              disabled={isBookmarking}
            >
              <BookmarkIcon 
                size={20} 
                color={isBookmarking ? '#999999' : (isBookmarked ? theme.Colors.primary : '#666666')} 
                filled={isBookmarked && !isBookmarking}
              />
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={(e) => {
              e.stopPropagation();
              onShare && onShare(item);
            }}
          >
            <ShareIcon size={20} color="#666666" />
          </TouchableOpacity>
        </View>
        
        {/* Persistent Liked/Disliked Icons */}
        {likedIds.has(item.id) && (
          <View style={styles.statusIconContainer}>
            <View style={styles.statusIconBadge}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill="#FFFFFF"
                />
              </Svg>
            </View>
          </View>
        )}
        {dislikedIds.has(item.id) && (
          <View style={styles.statusIconContainer}>
            <View style={[styles.statusIconBadge, styles.statusIconBadgeRed]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </View>
        )}
        
        {/* Pulse logo capsule on left */}
        <View style={styles.logoCapsule}>
          <Text style={styles.logoText} numberOfLines={1} adjustsFontSizeToFit={false}>pulse</Text>
          <View style={styles.greenDot} />
        </View>
      </View>
      
      <View style={styles.newsContent}>
        <View style={styles.titleRow}>
          <Text style={styles.newsHeadline} numberOfLines={2} ellipsizeMode="tail">{item.headline}</Text>
        </View>
        
        <Text style={styles.newsText} numberOfLines={8} ellipsizeMode="tail">{item.content}</Text>
        
        <View style={styles.tagsContainer}>
          {item.newsTags.map((tag, index) => (
            <View key={index} style={styles.newsTag}>
              <Text style={styles.newsTagText}>• {tag.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.metaContainer}>
          <Text style={styles.author} numberOfLines={1} ellipsizeMode="tail">
            by {item.author}
            {displayDate && ` • ${displayDate}`}
          </Text>
        </View>
      </View>
        {/* Minimal Swipe Feedback Overlay */}
        {swipeDirection && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.swipeFeedbackOverlay,
              {
                opacity: feedbackOpacity,
                backgroundColor: swipeDirection === 'right' 
                  ? 'rgba(16, 185, 129, 0.12)' 
                  : 'rgba(239, 68, 68, 0.12)',
              },
            ]}
          />
        )}
        
        {/* Minimal Elegant Badge */}
        {swipeDirection && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.swipeBadge,
              // Show on left for like (swipe right), on right for dislike (swipe left)
              swipeDirection === 'right' ? styles.swipeBadgeLeft : styles.swipeBadgeRight,
              {
                opacity: badgeOpacity,
                transform: [
                  { scale: badgeScale },
                  { rotate: badgeRotation.interpolate({
                      inputRange: [-12, 0, 12],
                      outputRange: ['-8deg', '0deg', '8deg'],
                    })
                  },
                ],
              },
            ]}
          >
            <View style={[
              styles.swipeBadgeContainer,
              swipeDirection === 'right' ? styles.swipeBadgeContainerGreen : styles.swipeBadgeContainerRed
            ]}>
              {swipeDirection === 'right' ? (
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    fill="#FFFFFF"
                  />
                </Svg>
              ) : (
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
            </View>
          </Animated.View>
        )}
        
        {/* Center feedback pill (for bookmark feedback or already liked/disliked) */}
        {feedbackText && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.feedbackPill,
              {
                opacity: feedbackOpacity,
                transform: [{ scale: feedbackScale }],
                backgroundColor: feedbackColor,
              },
            ]}
          >
            <Text style={styles.feedbackText}>{feedbackText}</Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.BorderRadius.lg,
    overflow: 'hidden',
    flex: 1,
  },
  newsImage: {
    width: '100%',
    borderTopLeftRadius: theme.BorderRadius.lg,
    borderTopRightRadius: theme.BorderRadius.lg,
    backgroundColor: theme.Colors.backgroundTertiary,
  },
  videoContainer: {
    width: '100%',
    borderTopLeftRadius: theme.BorderRadius.lg,
    borderTopRightRadius: theme.BorderRadius.lg,
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  videoPlayerWrapper: {
    width: '100%',
    height: '100%',
  },
  videoErrorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.md,
  },
  videoErrorText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.Typography.fontSize.base,
    marginBottom: theme.Spacing.md,
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.regular,
  },
  videoErrorButton: {
    backgroundColor: theme.Colors.primary,
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.md,
  },
  videoErrorButtonText: {
    color: '#FFFFFF',
    fontSize: theme.Typography.fontSize.base,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: theme.BorderRadius.lg,
    borderTopRightRadius: theme.BorderRadius.lg,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: -20,
    backgroundColor: theme.Colors.background,
    right: theme.Spacing.md,
    paddingHorizontal: theme.Spacing.xs,
    flexDirection: 'row',
    borderRadius: theme.BorderRadius.full,
    zIndex: 10,
    minWidth: 80, // Ensure minimum width for buttons
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCapsule: {
    position: 'absolute',
    bottom: -20,
    flexDirection: 'row',
    left: theme.Spacing.md,
    backgroundColor: theme.Colors.background,
    borderRadius: theme.BorderRadius.full,
    paddingHorizontal: 12, // Increased padding for better spacing
    paddingTop: 7, // Adequate top padding to prevent text clipping
    paddingBottom: 7, // Adequate bottom padding to prevent text clipping
    zIndex: 10,
    alignItems: 'center', // Center items vertically
    justifyContent: 'flex-start',
    flexShrink: 0, // Prevent shrinking
    minWidth: 80, // Increased minimum width to ensure "pulse" text is fully visible
    minHeight: 30, // Minimum height to ensure text fits vertically without clipping (14px font + 7px top + 7px bottom + 2px buffer)
  },
  logoText: {
    fontSize: theme.Typography.fontSize.sm, // 14px
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: '#000000',
    flexShrink: 0, // Prevent text from shrinking
    includeFontPadding: false, // Remove extra padding on Android - critical for preventing overflow
    textAlignVertical: 'center', // Center text vertically on Android
    lineHeight: 16, // Explicit line height (14px font + 2px for descenders like 'e', 'p')
    paddingTop: 0, // No top padding
    paddingBottom: 0, // No bottom padding
    marginTop: 0, // No top margin
    marginBottom: 0, // No bottom margin
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    marginLeft: theme.Spacing.xs,
    backgroundColor: theme.Colors.primary, // Changed to primary color
    flexShrink: 0, // Prevent dot from shrinking
  },
  newsContent: {
    flex: 1,
    padding: theme.Spacing.lg,
    paddingTop: theme.Spacing.lg + 8, // pull content slightly up to reduce perceived gap
    paddingBottom: theme.Spacing.lg,
  },
  titleRow: {
    marginBottom: theme.Spacing.md,
  },
  newsHeadline: {
    fontSize: theme.Typography.fontSize['xl'],
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: '#000000',
    lineHeight: 28,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  newsText: {
    fontSize: theme.Typography.fontSize.base,
    color: '#666666',
    marginBottom: theme.Spacing.md,
    lineHeight: 22,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.xs,
    marginBottom: theme.Spacing.sm,
  },
  newsTag: {
    backgroundColor: theme.Colors.backgroundTertiary,
    borderRadius: theme.BorderRadius.sm,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
  },
  newsTagText: {
    fontSize: theme.Typography.fontSize.xs,
    color: theme.Colors.textTertiary,
    fontWeight: theme.Typography.fontWeight.normal,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  metaContainer: {
    marginTop: theme.Spacing.sm,
  },
  author: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textTertiary,
    fontWeight: theme.Typography.fontWeight.normal,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  actionButton: {
    padding: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonActive: {
    backgroundColor: theme.Colors.primaryDark, // Dark primary color background when active
  },
  swipeContainer: {
    width: '100%',
    flex: 1,
  },
  feedbackPill: {
    position: 'absolute',
    bottom: 64, // closer to bottom bar
    alignSelf: 'center',
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackText: {
    color: '#FFFFFF',
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontSize: theme.Typography.fontSize.sm,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  mediaFallbackText: {
    color: theme.Colors.textTertiary,
    fontSize: theme.Typography.fontSize.sm,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  swipeFeedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.BorderRadius.lg,
  },
  swipeBadge: {
    position: 'absolute',
    top: '45%',
  },
  swipeBadgeRight: {
    right: 32,
  },
  swipeBadgeLeft: {
    left: 32,
  },
  swipeBadgeContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  swipeBadgeContainerGreen: {
    backgroundColor: '#10B981',
  },
  swipeBadgeContainerRed: {
    backgroundColor: '#EF4444',
  },
  statusIconContainer: {
    position: 'absolute',
    top: theme.Spacing.md,
    right: theme.Spacing.md,
    zIndex: 15,
  },
  statusIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusIconBadgeRed: {
    backgroundColor: '#DC2626', // Dark solid red
  },
});

// Memoize NewsCard to prevent unnecessary re-renders
const NewsCard = React.memo(NewsCardComponent, (prevProps, nextProps) => {
  // Only re-render if these props actually change
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.height === nextProps.height &&
    prevProps.isBookmarked === nextProps.isBookmarked &&
    prevProps.isBookmarking === nextProps.isBookmarking &&
    prevProps.autoPlayMode === nextProps.autoPlayMode &&
    prevProps.onPress === nextProps.onPress &&
    prevProps.onBookmark === nextProps.onBookmark &&
    prevProps.onDislike === nextProps.onDislike &&
    prevProps.onShare === nextProps.onShare &&
    prevProps.onSwipeComplete === nextProps.onSwipeComplete &&
    prevProps.onSwipeUp === nextProps.onSwipeUp &&
    prevProps.onSwipeDown === nextProps.onSwipeDown &&
    prevProps.onAutoPlayNext === nextProps.onAutoPlayNext
  );
});

export default NewsCard;