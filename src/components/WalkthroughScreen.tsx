/**
 * Walkthrough Screen Component
 * Full-screen carousel walkthrough with swipe gestures
 */

import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Easing,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface WalkthroughSlide {
  id: string;
  title: string;
  description: string;
  image: any; // Image source (require() or uri)
}

interface WalkthroughScreenProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const WalkthroughScreen: React.FC<WalkthroughScreenProps> = ({ visible, onComplete, onSkip }) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const slides: WalkthroughSlide[] = [
    {
      id: 'slide-1',
      title: 'Region Tags',
      description: 'Tap on region tags at the top to filter news by location. You can change your account settings from here.',
      image: require('../assets/first.png'),
    },
    {
      id: 'slide-2',
      title: 'Action Buttons',
      description: 'Use the speaker to listen to articles, bookmark to save them, or share with friends.',
      image: require('../assets/second.png'),
    },
    {
      id: 'slide-3',
      title: 'Toggle Controls',
      description: 'Enable auto-play mode for hands-free listening, or tap the filter icon to customize your preferences.',
      image: require('../assets/third.png'),
    },
    {
      id: 'slide-4',
      title: 'Swipe Up',
      description: 'Swipe up to move to the next article',
      image: require('../assets/fourth.png'),
    },
    {
      id: 'slide-5',
      title: 'Swipe down',
      description: 'Swipe down to go back to the previous article',
      image: require('../assets/fifth.png'),
    },
    {
      id: 'slide-6',
      title: 'Swipe Right',
      description: 'Swipe Right to Like the article',
      image: require('../assets/sixth.png'),
    },
    {
      id: 'slide-7',
      title: 'Swipe Left',
      description: 'Swipe Left to Dislike the article',
      image: require('../assets/seventh.png'),
    }
  ];

  const baseOffset = useRef(new Animated.Value(0)).current;

  // Update base offset when currentIndex changes with animation
  useEffect(() => {
    Animated.spring(baseOffset, {
      toValue: -currentIndex * width,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [currentIndex, width]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          const absDx = Math.abs(gesture.dx);
          return absDx > 5;
        },
        onPanResponderGrant: () => {
          translateX.setOffset((translateX as any).__getValue());
          translateX.setValue(0);
        },
        onPanResponderMove: (_, gesture) => {
          translateX.setValue(gesture.dx);
        },
        onPanResponderRelease: (_, gesture) => {
          translateX.flattenOffset();
          const threshold = width * 0.25;
          const absDx = Math.abs(gesture.dx);
          const velocity = Math.abs(gesture.vx);

          if (absDx > threshold || velocity > 0.5) {
            if (gesture.dx > 0 && currentIndex > 0) {
              // Swipe right - go to previous slide
              setCurrentIndex(prev => prev - 1);
            } else if (gesture.dx < 0 && currentIndex < slides.length - 1) {
              // Swipe left - go to next slide
              setCurrentIndex(prev => prev + 1);
            } else {
              // Snap back
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
              }).start();
            }
          } else {
            // Snap back
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }).start();
          }
        },
      }),
    [currentIndex, slides.length, width, translateX]
  );

  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index >= slides.length) return;
    setCurrentIndex(index);
  }, [slides.length]);

  const handleNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      goToSlide(currentIndex + 1);
    } else {
      onComplete();
    }
  }, [currentIndex, slides.length, goToSlide, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    } else {
      onSkip(); // If on first slide, skip/close
    }
  }, [currentIndex, goToSlide, onSkip]);

  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      {/* Carousel */}
      <View style={styles.carouselContainer} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.carousel,
            {
              width: width * slides.length,
              transform: [
                { 
                  translateX: Animated.add(
                    baseOffset,
                    translateX
                  )
                }
              ],
            },
          ]}
        >
        {slides.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.slideContent}>
              {/* Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={slide.image}
                  style={styles.slideImage}
                  resizeMode="cover"
                />
              </View>

              {/* Description */}
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        ))}
        </Animated.View>
      </View>

      {/* Progress Indicators */}
      <View style={styles.indicators}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex && styles.indicatorActive,
            ]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.navButton, 
            styles.prevButton,
            currentIndex === 0 && styles.navButtonDisabled
          ]}
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <Text style={[
            styles.prevButtonText,
            currentIndex === 0 && styles.navButtonTextDisabled
          ]}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>{isLastSlide ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: theme.Spacing.lg,
    zIndex: 10,
    padding: theme.Spacing.sm,
  },
  skipButtonText: {
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.textSecondary,
    fontFamily: theme.Typography.fontFamily.medium,
  },
  carouselContainer: {
    flex: 1,
    overflow: 'hidden',
    width: width,
  },
  carousel: {
    flexDirection: 'row',
    height: '100%',
  },
  slide: {
    width: width,
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.xl,
    paddingTop: theme.Spacing['2xl'],
    flexShrink: 0,
  },
  slideContent: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
    justifyContent: 'flex-start',
  },
  imageContainer: {
    width: '100%',
    height: height * 0.55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
    paddingHorizontal: theme.Spacing.xs,
  },
  slideImage: {
    width: width * 0.65,
    height: '100%',
    borderRadius: theme.BorderRadius.xl,
    overflow: 'hidden',
  },
  description: {
    fontSize: theme.Typography.fontSize.lg,
    fontWeight: theme.Typography.fontWeight.medium,
    color: theme.Colors.text,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: theme.Spacing.xl,
    fontFamily: theme.Typography.fontFamily.medium,
    marginTop: theme.Spacing.lg,
    marginBottom: theme.Spacing.lg,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    marginBottom: theme.Spacing.xl,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.Colors.border,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: theme.Colors.primary,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.Spacing.xl,
    paddingBottom: theme.Spacing.xl,
    gap: theme.Spacing.md,
  },
  navButton: {
    flex: 1,
    paddingVertical: theme.Spacing.md,
    borderRadius: theme.BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButton: {
    backgroundColor: theme.Colors.backgroundTertiary,
  },
  prevButtonText: {
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.text,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonTextDisabled: {
    opacity: 0.5,
  },
  nextButton: {
    backgroundColor: theme.Colors.primary,
    ...theme.Shadows.md,
  },
  nextButtonText: {
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.textWhite,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
});

export default WalkthroughScreen;

