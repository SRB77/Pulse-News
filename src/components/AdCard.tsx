import React, { useRef, useMemo, useEffect } from 'react';
import { View, Image, StyleSheet, Animated, PanResponder, Dimensions, TouchableOpacity, Linking, Easing } from 'react-native';
import { theme } from '../constants/theme';
import { firebaseService } from '../services/firebaseService';

interface AdCardProps {
  id: string;
  imageUrl: string;
  redirectLink?: string;
  height: number;
  isSignedIn?: boolean;
  onSignInPress?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

const AdCardComponent: React.FC<AdCardProps> = ({ id, imageUrl, redirectLink, height, isSignedIn, onSignInPress, onSwipeUp, onSwipeDown }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const threshold = 30; // swipe distance to trigger action (lower = more sensitive)
  const viewCountedRef = useRef<boolean>(false);

  // Track ad view count when card is shown (only once per ad)
  useEffect(() => {
    if (!viewCountedRef.current && id) {
      viewCountedRef.current = true;
      // Track view in Firebase (fire and forget, non-blocking)
      firebaseService.incrementAdViewCount(id).catch((error) => {
        console.error('Error tracking ad view count:', error);
      });
    }
  }, [id]);

  // Handle ad click - redirect to URL and track click
  const handleAdClick = async () => {
    if (redirectLink) {
      try {
        // Track click in Firebase before redirecting
        await firebaseService.incrementAdClickCount(id);
        
        // Open URL in browser
        const canOpen = await Linking.canOpenURL(redirectLink);
        if (canOpen) {
          await Linking.openURL(redirectLink);
        } else {
          console.error('Cannot open URL:', redirectLink);
        }
      } catch (error) {
        console.error('Error handling ad click:', error);
        // Still try to open URL even if tracking fails
        try {
          await Linking.openURL(redirectLink);
        } catch (linkError) {
          console.error('Error opening URL:', linkError);
        }
      }
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          const absDy = Math.abs(gesture.dy);
          const absDx = Math.abs(gesture.dx);
          
          // Don't capture swipe down if onSwipeDown is undefined (first card)
          if (absDy > absDx && gesture.dy > 0 && !onSwipeDown) {
            return false;
          }
          
          // Don't capture swipe up if onSwipeUp is undefined (last card)
          if (absDy > absDx && gesture.dy < 0 && !onSwipeUp) {
            return false;
          }
          
          // Capture vertical swipes (if callbacks exist)
          return absDy > 5 && absDy > absDx * 0.5;
        },
        onPanResponderGrant: () => {
          translateY.setOffset((translateY as any).__getValue());
          translateY.setValue(0);
          // Keep opacity at 1 during gesture
          opacity.setValue(1);
        },
        onPanResponderMove: (_, gesture) => {
          // If swiping down, keep card in place (previous card will stack on top)
          // If swiping up, allow normal movement
          if (gesture.dy > 0) {
            translateY.setValue(0); // Keep card in place when swiping down
          } else {
            translateY.setValue(gesture.dy); // Allow normal movement when swiping up
          }
          opacity.setValue(1);
        },
        onPanResponderRelease: (_, gesture) => {
          translateY.flattenOffset();
          
          const absDy = Math.abs(gesture.dy);
          
          // Handle vertical swipe completion
          if (absDy > threshold) {
            if (gesture.dy < 0 && onSwipeUp) {
              // Swipe up - match NewsCard animation behavior
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
                // Reset card position for reuse after animation completes
                translateY.setValue(0);
                opacity.setValue(1);
              });
            } else if (gesture.dy > 0 && onSwipeDown) {
              // Swipe down - trigger callback, card stays in place, previous card stacks on top
              onSwipeDown();
              
              // Reset translateY to 0 - card stays in place, previous card stacks on top
              translateY.setValue(0);
              opacity.setValue(1);
            }
          } else {
            // Snap back smoothly if threshold not met
            Animated.parallel([
              Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 90,
                friction: 8,
              }),
              Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
          }
        },
        onPanResponderTerminate: () => {
          translateY.flattenOffset();
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 90,
              friction: 8,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    [translateY, opacity, onSwipeUp, onSwipeDown, height]
  );

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          height,
          transform: [{ translateY }],
          opacity,
        }
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity 
        activeOpacity={1}
        onPress={handleAdClick}
        style={styles.touchable}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: theme.BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.Colors.backgroundTertiary,
  },
  touchable: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

// Memoize AdCard to prevent unnecessary re-renders
const AdCard = React.memo(AdCardComponent, (prevProps, nextProps) => {
  // Only re-render if these props actually change
  return (
    prevProps.id === nextProps.id &&
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.height === nextProps.height &&
    prevProps.isSignedIn === nextProps.isSignedIn &&
    prevProps.onSignInPress === nextProps.onSignInPress &&
    prevProps.onSwipeUp === nextProps.onSwipeUp &&
    prevProps.onSwipeDown === nextProps.onSwipeDown
  );
});

export default AdCard;
