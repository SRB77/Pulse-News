/**
 * Walkthrough Overlay Component
 * Shows the actual screen with spotlight highlights on specific elements
 */

import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  Modal,
  InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { theme } from '../constants/theme';
import { SpeakerIcon, BookmarkIcon, ShareIcon, InfiniteIcon, FilterIcon } from './Icons';

const { width, height } = Dimensions.get('window');

interface HighlightTarget {
  id: string;
  measure: () => Promise<{ x: number; y: number; width: number; height: number } | null>;
  title: string;
  description: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

interface WalkthroughOverlayProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  highlightTargets: HighlightTarget[];
}

const WalkthroughOverlay: React.FC<WalkthroughOverlayProps> = ({
  visible,
  onComplete,
  onSkip,
  highlightTargets,
}) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirectionIndex, setSwipeDirectionIndex] = useState(0);
  const [highlightLayout, setHighlightLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const highlightScale = useRef(new Animated.Value(0.8)).current;
  const highlightOpacity = useRef(new Animated.Value(0)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipScale = useRef(new Animated.Value(0.9)).current;
  const swipeCarouselOffset = useRef(new Animated.Value(0)).current;
  const swipeCarouselDrag = useRef(new Animated.Value(0)).current;

  const swipeDirections = [
    { id: 'up', icon: '↑', title: 'Swipe Up', description: 'Next article', iconColor: theme.Colors.primary, bgColor: '#F0FDF4', borderColor: theme.Colors.primary, cardBorder: 'left' },
    { id: 'down', icon: '↓', title: 'Swipe Down', description: 'Previous article', iconColor: '#3B82F6', bgColor: '#EFF6FF', borderColor: '#3B82F6', cardBorder: 'left' },
    { id: 'left', icon: '←', title: 'Swipe Left', description: 'Dislike article', iconColor: '#EF4444', bgColor: '#FEF2F2', borderColor: '#EF4444', cardBorder: 'top' },
    { id: 'right', icon: '→', title: 'Swipe Right', description: 'Like article', iconColor: '#EF4444', bgColor: '#FEF2F2', borderColor: '#EF4444', cardBorder: 'top' },
  ];

  const currentTarget = highlightTargets[currentIndex];
  const isLastSlide = currentIndex === highlightTargets.length - 1;
  const isSwipeCardsStep = currentTarget?.id?.startsWith('swipe-') || false;
  const currentSwipeDirection = currentTarget?.id?.replace('swipe-', '') || '';
  
  // Check if we should show graphical mockup (all non-swipe steps now use mockups)
  const showGraphicalMockup = !isSwipeCardsStep;

  // Animate mockup appearance when slide changes (no measurement needed)
  useEffect(() => {
    if (!visible || !currentTarget) return;

    // Reset animations
    overlayOpacity.setValue(0);
    tooltipOpacity.setValue(0);
    tooltipScale.setValue(0.9);
    
    // Animate mockup appearance
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 300,
        delay: 50,
        useNativeDriver: true,
      }),
      Animated.spring(tooltipScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex, visible, currentTarget]);

  // Set swipe direction index based on current step
  useEffect(() => {
    if (isSwipeCardsStep && currentSwipeDirection) {
      const directionIndex = swipeDirections.findIndex(d => d.id === currentSwipeDirection);
      if (directionIndex >= 0) {
        setSwipeDirectionIndex(directionIndex);
        swipeCarouselOffset.setValue(-directionIndex * width);
        swipeCarouselDrag.setValue(0);
      }
    }
  }, [isSwipeCardsStep, currentSwipeDirection, width]);

  // Pan responder for swipe direction carousel
  const swipeCarouselPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          if (!isSwipeCardsStep) return false;
          const absDx = Math.abs(gesture.dx);
          return absDx > 5;
        },
        onPanResponderGrant: () => {
          swipeCarouselDrag.setOffset((swipeCarouselOffset as any).__getValue());
          swipeCarouselDrag.setValue(0);
        },
        onPanResponderMove: (_, gesture) => {
          if (!isSwipeCardsStep) return;
          const currentOffset = (swipeCarouselOffset as any).__getValue();
          const newValue = currentOffset + gesture.dx;
          const minValue = -(swipeDirections.length - 1) * width;
          const maxValue = 0;
          const clampedValue = Math.max(minValue, Math.min(maxValue, newValue));
          swipeCarouselDrag.setValue(clampedValue - currentOffset);
        },
        onPanResponderRelease: (_, gesture) => {
          if (!isSwipeCardsStep) return;
          swipeCarouselDrag.flattenOffset();
          const threshold = width * 0.25;
          const absDx = Math.abs(gesture.dx);
          const velocity = Math.abs(gesture.vx);
          const currentOffset = (swipeCarouselOffset as any).__getValue() + gesture.dx;

          if (absDx > threshold || velocity > 0.5) {
            if (gesture.dx > 0 && swipeDirectionIndex > 0) {
              // Swipe right - go to previous swipe direction
              setSwipeDirectionIndex(prev => prev - 1);
            } else if (gesture.dx < 0 && swipeDirectionIndex < swipeDirections.length - 1) {
              // Swipe left - go to next swipe direction
              setSwipeDirectionIndex(prev => prev + 1);
            } else {
              // Snap back to current position
              swipeCarouselOffset.setValue(-swipeDirectionIndex * width);
            }
          } else {
            // Snap back to current position if threshold not met
            swipeCarouselOffset.setValue(-swipeDirectionIndex * width);
          }
          swipeCarouselDrag.setValue(0);
        },
      }),
    [isSwipeCardsStep, swipeDirectionIndex, swipeDirections.length, width]
  );

  // Pan responder for main walkthrough navigation (works for all steps)
  const navigationPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          // Only respond to horizontal swipes
          const absDx = Math.abs(gesture.dx);
          const absDy = Math.abs(gesture.dy);
          // Require horizontal movement to be greater than vertical (to avoid conflicts with vertical scrolling)
          return absDx > 10 && absDx > absDy * 1.5;
        },
        onPanResponderGrant: () => {
          // Reset any ongoing animations
        },
        onPanResponderMove: (_, gesture) => {
          // Visual feedback could be added here if needed
        },
        onPanResponderRelease: (_, gesture) => {
          const threshold = width * 0.2; // 20% of screen width
          const absDx = Math.abs(gesture.dx);
          const velocity = Math.abs(gesture.vx);

          // Check if swipe is significant enough
          if (absDx > threshold || velocity > 0.3) {
            if (gesture.dx > 0) {
              // Swipe right - go to previous slide
              if (currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
              }
            } else {
              // Swipe left - go to next slide
              if (currentIndex < highlightTargets.length - 1) {
                setCurrentIndex(prev => prev + 1);
              } else {
                // On last slide, complete walkthrough
                onComplete();
              }
            }
          }
        },
      }),
    [currentIndex, highlightTargets.length, width, onComplete]
  );


  const handleNext = useCallback(() => {
    // Handle main walkthrough navigation
    if (currentIndex < highlightTargets.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentIndex, highlightTargets.length, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  // Reset to first step when walkthrough becomes visible
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
    }
  }, [visible]);

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!highlightLayout) return { top: height / 2, left: width / 2 };

    const tooltipWidth = width * 0.8;
    const tooltipHeight = 120;
    const padding = 20;
    const navigationButtonsHeight = 160; // Space for navigation buttons and indicators
    const position = currentTarget?.tooltipPosition || 'bottom';

    let top = 0;
    let left = highlightLayout.x + highlightLayout.width / 2 - tooltipWidth / 2;

    // Clamp left position
    left = Math.max(padding, Math.min(left, width - tooltipWidth - padding));

    switch (position) {
      case 'top':
        top = highlightLayout.y - tooltipHeight - padding;
        break;
      case 'bottom':
        top = highlightLayout.y + highlightLayout.height + padding;
        break;
      case 'left':
        top = highlightLayout.y + highlightLayout.height / 2 - tooltipHeight / 2;
        left = highlightLayout.x - tooltipWidth - padding;
        break;
      case 'right':
        top = highlightLayout.y + highlightLayout.height / 2 - tooltipHeight / 2;
        left = highlightLayout.x + highlightLayout.width + padding;
        break;
    }

    // Ensure tooltip stays on screen and doesn't overlap with navigation buttons
    const maxTop = height - tooltipHeight - insets.bottom - navigationButtonsHeight;
    top = Math.max(insets.top + 60, Math.min(top, maxTop));

    return { top, left };
  };

  const tooltipPos = getTooltipPosition();

  if (!visible || !currentTarget) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

        {/* Dark overlay for all steps - swipeable */}
        <View style={styles.darkOverlay} {...navigationPanResponder.panHandlers} />

        {/* Graphical Mockups for Non-Swipe Steps */}
        {showGraphicalMockup && (
          <View style={styles.swipeCarouselContainer} {...navigationPanResponder.panHandlers}>
            <View style={styles.swipeDirectionsContainer}>
              <View style={styles.swipeSection}>
                <Text style={styles.swipeSectionTitle}>{currentTarget.title}</Text>
                <View style={styles.swipeDirectionCardFull}>
                  {/* Region Tags Mockup */}
                  {currentTarget.id === 'region-tags' && (
                    <View style={styles.mockupContainer}>
                      <View style={styles.mockupHeader}>
                        <View style={styles.mockupLogo}>
                          <Text style={styles.mockupLogoText}>pulse</Text>
                          <View style={styles.mockupLogoDot} />
                        </View>
                      </View>
                      <View style={styles.mockupFilterSection}>
                        <View style={[styles.mockupFilterCapsule, styles.mockupFilterCapsuleActive]}>
                          <Text style={styles.mockupFilterTextActive}>All</Text>
                        </View>
                        <View style={styles.mockupFilterCapsule}>
                          <Text style={styles.mockupFilterText}>Kohima</Text>
                        </View>
                        <View style={styles.mockupFilterCapsule}>
                          <Text style={styles.mockupFilterText}>India</Text>
                        </View>
                        <View style={styles.mockupFilterCapsule}>
                          <Text style={styles.mockupFilterText}>North E</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Action Buttons Mockup */}
                  {currentTarget.id === 'action-buttons' && (
                    <View style={styles.mockupContainer}>
                      <View style={styles.mockupCard}>
                        <View style={styles.mockupCardHeader}>
                          <View style={styles.mockupLogo}>
                            <Text style={styles.mockupLogoText}>pulse</Text>
                            <View style={styles.mockupLogoDot} />
                          </View>
                        </View>
                        <View style={styles.mockupCardContent}>
                          <View style={styles.mockupCardLine} />
                          <View style={[styles.mockupCardLine, styles.mockupCardLineShort]} />
                          <View style={[styles.mockupCardLine, styles.mockupCardLineShort]} />
                        </View>
                        <View style={styles.mockupActionButtonsContainer}>
                          <View style={styles.mockupActionButton}>
                            <SpeakerIcon size={20} color={theme.Colors.text} />
                          </View>
                          <View style={styles.mockupActionButton}>
                            <BookmarkIcon size={20} color="#666666" filled={false} />
                          </View>
                          <View style={styles.mockupActionButton}>
                            <ShareIcon size={20} color="#666666" />
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Toggle Controls Mockup */}
                  {currentTarget.id === 'toggle-controls' && (
                    <View style={styles.mockupContainer}>
                      <View style={styles.mockupToggleContainer}>
                        <View style={styles.mockupToggleSwitch}>
                          <View style={[styles.mockupToggleSegment, styles.mockupToggleSegmentActive]}>
                            <InfiniteIcon size={20} color={theme.Colors.primary} />
                          </View>
                          <View style={styles.mockupToggleSeparator} />
                          <View style={styles.mockupToggleSegment}>
                            <FilterIcon size={20} color="#666666" />
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
                <Text style={styles.swipeDirectionTitle}>{currentTarget.title}</Text>
                <Text style={styles.swipeDirectionDescription}>{currentTarget.description}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Swipe Directions Info for Swipe Cards Step */}
        {isSwipeCardsStep && (
          <View style={styles.swipeCarouselContainer} {...navigationPanResponder.panHandlers}>
            <View style={styles.swipeDirectionsContainer}>
              {swipeDirections.map((direction, index) => {
                // Only show the current swipe direction
                if (direction.id !== currentSwipeDirection) {
                  return null;
                }
                
                console.log('Rendering direction:', direction.id, 'for step:', currentSwipeDirection);
                
                return (
                  <View key={direction.id} style={styles.swipeSection}>
                    <Text style={styles.swipeSectionTitle}>
                      {index < 2 ? 'Navigate Articles' : 'Rate Articles'}
                    </Text>
                    <View style={styles.swipeDirectionCardFull}>
                        {direction.id === 'up' || direction.id === 'down' ? (
                            // Navigation swipes - show card preview
                            <View style={styles.cardPreviewContainer}>
                              <View style={styles.cardPreview}>
                                <View style={styles.cardPreviewHeader}>
                                  <View style={styles.cardPreviewLogo}>
                                    <Text style={styles.cardPreviewLogoText}>pulse</Text>
                                    <View style={styles.cardPreviewLogoDot} />
                                  </View>
                                </View>
                                <View style={styles.cardPreviewContent}>
                                  <View style={styles.cardPreviewLine} />
                                  <View style={[styles.cardPreviewLine, styles.cardPreviewLineShort]} />
                                  <View style={[styles.cardPreviewLine, styles.cardPreviewLineShort]} />
                                </View>
                                <View style={styles.cardPreviewTags}>
                                  <View style={styles.cardPreviewTag} />
                                  <View style={styles.cardPreviewTag} />
                                </View>
                              </View>
                              <View style={[
                                styles.cardPreviewArrow,
                                direction.id === 'up' ? styles.cardPreviewArrowUp : styles.cardPreviewArrowDown
                              ]}>
                                <Text style={styles.cardPreviewArrowText}>
                                  {direction.id === 'up' ? '↑' : '↓'}
                                </Text>
                              </View>
                              {direction.id === 'up' && (
                                <View style={styles.cardPreviewNext}>
                                  <View style={styles.cardPreview}>
                                    <View style={styles.cardPreviewHeader}>
                                      <View style={styles.cardPreviewLogo}>
                                        <Text style={styles.cardPreviewLogoText}>pulse</Text>
                                        <View style={styles.cardPreviewLogoDot} />
                                      </View>
                                    </View>
                                    <View style={styles.cardPreviewContent}>
                                      <View style={styles.cardPreviewLine} />
                                      <View style={[styles.cardPreviewLine, styles.cardPreviewLineShort]} />
                                    </View>
                                  </View>
                                </View>
                              )}
                            </View>
                          ) : (
                            // Like/Dislike swipes - show card with overlay
                            <View style={styles.swipeCardDemoContainer}>
                              <View style={styles.swipeCardDemo}>
                                {/* Card Content */}
                                <View style={styles.swipeCardDemoHeader}>
                                  <View style={styles.swipeCardDemoLogo}>
                                    <Text style={styles.swipeCardDemoLogoText}>pulse</Text>
                                    <View style={styles.swipeCardDemoLogoDot} />
                                  </View>
                                </View>
                                <View style={styles.swipeCardDemoContent}>
                                  <View style={styles.swipeCardDemoLine} />
                                  <View style={[styles.swipeCardDemoLine, styles.swipeCardDemoLineShort]} />
                                  <View style={[styles.swipeCardDemoLine, styles.swipeCardDemoLineShort]} />
                                </View>
                                <View style={styles.swipeCardDemoTags}>
                                  <View style={styles.swipeCardDemoTag} />
                                  <View style={styles.swipeCardDemoTag} />
                                </View>
                                
                                {/* Swipe Overlay */}
                                <View
                                  style={[
                                    styles.swipeCardDemoOverlay,
                                    direction.id === 'right'
                                      ? styles.swipeCardDemoOverlayLike
                                      : styles.swipeCardDemoOverlayDislike,
                                  ]}
                                >
                                  {/* Badge */}
                                  <View
                                    style={[
                                      styles.swipeCardDemoBadge,
                                      direction.id === 'right'
                                        ? styles.swipeCardDemoBadgeLike
                                        : styles.swipeCardDemoBadgeDislike,
                                      direction.id === 'right'
                                        ? styles.swipeCardDemoBadgeRight
                                        : styles.swipeCardDemoBadgeLeft,
                                    ]}
                                  >
                                    {direction.id === 'right' ? (
                                      // Heart icon for like
                                      <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                                        <Path
                                          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                                          fill="#FFFFFF"
                                          stroke="#FFFFFF"
                                          strokeWidth={2}
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </Svg>
                                    ) : (
                                      // Thumbs down icon for dislike
                                      <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                                        <Path
                                          d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"
                                          stroke="#FFFFFF"
                                          strokeWidth={2}
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </Svg>
                                    )}
                                  </View>
                                </View>
                              </View>
                              <View style={[
                                styles.actionBadge,
                                { backgroundColor: direction.id === 'right' ? '#22C55E' : '#EF4444' }
                              ]}>
                                <Text style={styles.actionBadgeText}>
                                  {direction.id === 'right' ? 'LIKE' : 'DISLIKE'}
                                </Text>
                              </View>
                            </View>
                        )}
                        <Text style={styles.swipeDirectionTitle}>{direction.title}</Text>
                        <Text style={styles.swipeDirectionDescription}>{direction.description}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
        )}

        

        {/* Progress Indicators */}
        <View style={styles.indicators}>
          {highlightTargets.map((_, index) => (
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
            style={[styles.navButton, styles.prevNavButton]}
            onPress={handlePrev}
            disabled={currentIndex === 0}
          >
            <Text style={[styles.prevNavButtonText, currentIndex === 0 && styles.prevNavButtonTextDisabled]}>
              Prev
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {isLastSlide ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  skipButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 100,
    padding: theme.Spacing.sm,
    paddingHorizontal: theme.Spacing.md,
    borderRadius: theme.BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipButtonText: {
    fontSize: theme.Typography.fontSize.base,
    color: '#FFFFFF',
    fontFamily: theme.Typography.fontFamily.semiBold,
    fontWeight: theme.Typography.fontWeight.semiBold,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  overlaySection: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  highlightRing: {
    position: 'absolute',
    borderWidth: 0,
    borderColor: theme.Colors.primary,
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  tooltip: {
    position: 'absolute',
    width: width * 0.8,
    backgroundColor: theme.Colors.background,
    borderRadius: theme.BorderRadius.xl,
    padding: theme.Spacing.lg,
    zIndex: 10,
    ...theme.Shadows.xl,
  },
  tooltipTitle: {
    fontSize: theme.Typography.fontSize['2xl'],
    fontWeight: theme.Typography.fontWeight.bold,
    color: theme.Colors.text,
    marginBottom: theme.Spacing.sm,
    fontFamily: theme.Typography.fontFamily.bold,
  },
  tooltipDescription: {
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.textSecondary,
    lineHeight: 22,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  swipeCardsTooltip: {
    marginBottom: theme.Spacing['3xl'] || 48,
  },
  indicators: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    zIndex: 100,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: theme.Colors.primary,
  },
  indicatorGroup: {
    flexDirection: 'row',
    gap: theme.Spacing.xs,
    alignItems: 'center',
  },
  indicatorSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  navigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.Spacing.xl,
    paddingBottom: theme.Spacing.xl,
    gap: theme.Spacing.md,
    zIndex: 100,
  },
  navButton: {
    flex: 1,
    paddingVertical: theme.Spacing.md,
    borderRadius: theme.BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevNavButton: {
    backgroundColor: theme.Colors.background,
    borderWidth: 1,
    borderColor: theme.Colors.borderLight,
  },
  prevNavButtonText: {
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.text,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  prevNavButtonTextDisabled: {
    color: theme.Colors.textSecondary,
    opacity: 0.5,
  },
  nextButton: {
    backgroundColor: theme.Colors.primary,
    ...theme.Shadows.md,
  },
  nextButtonDisabled: {
    backgroundColor: theme.Colors.backgroundTertiary,
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.textWhite,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  mockCard: {
    position: 'absolute',
    backgroundColor: theme.Colors.background,
    borderRadius: theme.BorderRadius.xl,
    zIndex: 100,
    ...theme.Shadows.xl,
    overflow: 'hidden',
  },
  mockCardContent: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: theme.BorderRadius.xl,
  },
  mockCardImageContainer: {
    position: 'relative',
    width: '100%',
    height: '40%',
    minHeight: 200,
  },
  mockCardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    borderTopLeftRadius: theme.BorderRadius.xl,
    borderTopRightRadius: theme.BorderRadius.xl,
  },
  mockCardActionButtons: {
    position: 'absolute',
    bottom: -20,
    backgroundColor: theme.Colors.background,
    right: theme.Spacing.md,
    paddingHorizontal: theme.Spacing.xs,
    flexDirection: 'row',
    borderRadius: theme.BorderRadius.full,
    zIndex: 10,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockCardActionButton: {
    padding: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockCardLogo: {
    position: 'absolute',
    bottom: -20,
    flexDirection: 'row',
    left: theme.Spacing.md,
    backgroundColor: theme.Colors.background,
    borderRadius: theme.BorderRadius.full,
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 7,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexShrink: 0,
    minWidth: 80,
    minHeight: 30,
  },
  mockCardLogoText: {
    fontSize: theme.Typography.fontSize.sm,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: '#000000',
    flexShrink: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 16,
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  mockCardLogoDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    marginLeft: theme.Spacing.xs,
    backgroundColor: theme.Colors.primary,
    flexShrink: 0,
  },
  mockCardNewsContent: {
    flex: 1,
    padding: theme.Spacing.lg,
    paddingTop: theme.Spacing.lg + 8,
    paddingBottom: theme.Spacing.lg,
    backgroundColor: theme.Colors.background,
  },
  mockCardTitleRow: {
    marginBottom: theme.Spacing.md,
  },
  mockCardHeadline: {
    fontSize: theme.Typography.fontSize.xl,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: '#000000',
    lineHeight: 28,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  mockCardText: {
    fontSize: theme.Typography.fontSize.base,
    color: '#666666',
    marginBottom: theme.Spacing.md,
    lineHeight: 22,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  mockCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.xs,
    marginBottom: theme.Spacing.sm,
  },
  mockCardTag: {
    backgroundColor: theme.Colors.backgroundTertiary,
    borderRadius: theme.BorderRadius.sm,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
  },
  mockCardTagText: {
    fontSize: theme.Typography.fontSize.xs,
    color: theme.Colors.textTertiary,
    fontWeight: theme.Typography.fontWeight.normal,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  mockCardMeta: {
    marginTop: theme.Spacing.sm,
  },
  mockCardAuthor: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textTertiary,
    fontWeight: theme.Typography.fontWeight.normal,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  swipeHints: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -60,
    marginTop: -40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.Spacing.md,
  },
  swipeHintText: {
    fontSize: theme.Typography.fontSize.lg,
    color: theme.Colors.primary,
    fontWeight: theme.Typography.fontWeight.bold,
    fontFamily: theme.Typography.fontFamily.bold,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  swipeOverlay: {
    position: 'absolute',
    borderRadius: theme.BorderRadius.xl,
    zIndex: 101,
    overflow: 'hidden',
  },
  swipeOverlayLeft: {},
  swipeOverlayRight: {},
  swipeOverlayUp: {},
  swipeOverlayDown: {},
  swipeOverlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  swipeOverlayGradientLeft: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  swipeOverlayGradientRight: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  swipeOverlayGradientUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  swipeOverlayGradientDown: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  swipeIndicatorContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeIndicatorLeft: {
    left: theme.Spacing.xl,
    top: '50%',
    transform: [{ translateY: -30 }],
  },
  swipeIndicatorRight: {
    right: theme.Spacing.xl,
    top: '50%',
    transform: [{ translateY: -30 }],
  },
  swipeIndicatorUp: {
    top: theme.Spacing.xl,
    left: '50%',
    transform: [{ translateX: -60 }],
  },
  swipeIndicatorDown: {
    bottom: theme.Spacing.xl,
    left: '50%',
    transform: [{ translateX: -60 }],
  },
  swipeBadge: {
    backgroundColor: theme.Colors.background,
    paddingHorizontal: theme.Spacing.xl,
    paddingVertical: theme.Spacing.md,
    borderRadius: theme.BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    ...theme.Shadows.xl,
    borderWidth: 3,
    minWidth: 140,
    justifyContent: 'center',
  },
  swipeBadgeLeft: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  swipeBadgeRight: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  swipeBadgeUp: {
    borderColor: theme.Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  swipeBadgeDown: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  swipeBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeBadgeIconText: {
    fontSize: 20,
    fontWeight: theme.Typography.fontWeight.bold,
  },
  swipeBadgeIconLeft: {
    color: '#EF4444',
  },
  swipeBadgeIconRight: {
    color: '#EF4444',
  },
  swipeBadgeIconUp: {
    color: theme.Colors.primary,
  },
  swipeBadgeIconDown: {
    color: '#3B82F6',
  },
  swipeBadgeText: {
    fontSize: theme.Typography.fontSize.base,
    fontWeight: theme.Typography.fontWeight.bold,
    color: theme.Colors.text,
    fontFamily: theme.Typography.fontFamily.bold,
  },
  swipeArrowTrail: {
    position: 'absolute',
  },
  swipeArrowTrailLeft: {
    left: -50,
    top: '50%',
    transform: [{ translateY: -2 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swipeArrowTrailRight: {
    right: -50,
    top: '50%',
    transform: [{ translateY: -2 }],
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  swipeArrowTrailUp: {
    top: -50,
    left: '50%',
    transform: [{ translateX: -2 }],
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  swipeArrowTrailDown: {
    bottom: -50,
    left: '50%',
    transform: [{ translateX: -2 }],
    flexDirection: 'column-reverse',
    alignItems: 'center',
    gap: 8,
  },
  swipeArrowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  swipeArrowDotRed: {
    backgroundColor: '#EF4444',
  },
  swipeArrowDotGreen: {
    backgroundColor: theme.Colors.primary,
  },
  swipeArrowDotBlue: {
    backgroundColor: '#3B82F6',
  },
  swipeCarouselContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeCarousel: {
    flexDirection: 'row',
    width: width * 4, // 4 swipe directions
    height: '100%',
  },
  swipeCarouselItem: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDirectionsContainer: {
    width: '100%',
    paddingHorizontal: theme.Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 400,
  },
  swipeSection: {
    marginBottom: theme.Spacing.xl,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  swipeSectionTitle: {
    fontSize: theme.Typography.fontSize.xl,
    fontWeight: theme.Typography.fontWeight.bold,
    color: theme.Colors.textWhite,
    marginBottom: theme.Spacing.md,
    fontFamily: theme.Typography.fontFamily.bold,
    textAlign: 'center',
  },
  swipeVerticalGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.Spacing.lg,
    width: '100%',
  },
  swipeHorizontalGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.Spacing.lg,
    width: '100%',
  },
  swipeDirectionCard: {
    backgroundColor: theme.Colors.background,
    borderRadius: theme.BorderRadius.xl,
    padding: theme.Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.Shadows.xl,
    flex: 1,
    maxWidth: (width - theme.Spacing.lg * 2 - theme.Spacing.lg) / 2,
  },
  swipeDirectionCardFull: {
    backgroundColor: theme.Colors.background,
    borderRadius: theme.BorderRadius.xl,
    padding: theme.Spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.Shadows.xl,
    width: width * 0.85,
    minHeight: 280,
  },
  swipeDirectionCardVertical: {
    minHeight: 160,
    borderLeftWidth: 3,
    borderLeftColor: theme.Colors.primary,
  },
  swipeDirectionCardHorizontal: {
    minHeight: 160,
    borderTopWidth: 3,
    borderTopColor: '#EF4444',
  },
  swipeDirectionIconContainer: {
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.Spacing.md,
  },
  swipeDirectionIconContainerLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  swipeDirectionIconUp: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: theme.Colors.primary,
  },
  swipeDirectionIconDown: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  swipeDirectionIconLeft: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  swipeDirectionIconRight: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  swipeDirectionIcon: {
    fontSize: 32,
    fontWeight: theme.Typography.fontWeight.bold,
  },
  swipeDirectionIconLarge: {
    fontSize: 40,
  },
  swipeDirectionIconUpText: {
    color: theme.Colors.primary,
  },
  swipeDirectionIconDownText: {
    color: '#3B82F6',
  },
  swipeDirectionIconLeftText: {
    color: '#EF4444',
  },
  swipeDirectionIconRightText: {
    color: '#EF4444',
  },
  swipeDirectionTitle: {
    fontSize: theme.Typography.fontSize.lg,
    fontWeight: theme.Typography.fontWeight.bold,
    color: theme.Colors.text,
    marginBottom: theme.Spacing.xs,
    fontFamily: theme.Typography.fontFamily.bold,
    textAlign: 'center',
  },
  swipeDirectionDescription: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textSecondary,
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.regular,
  },
  cardPreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.Spacing.lg,
    position: 'relative',
  },
  cardPreview: {
    width: width * 0.6,
    backgroundColor: theme.Colors.background,
    borderRadius: theme.BorderRadius.lg,
    padding: theme.Spacing.md,
    ...theme.Shadows.md,
    borderWidth: 1,
    borderColor: theme.Colors.backgroundTertiary,
  },
  cardPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.Spacing.sm,
  },
  cardPreviewLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPreviewLogoText: {
    fontSize: theme.Typography.fontSize.sm,
    fontWeight: theme.Typography.fontWeight.bold,
    color: theme.Colors.text,
    fontFamily: theme.Typography.fontFamily.bold,
  },
  cardPreviewLogoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.Colors.primary,
    marginLeft: theme.Spacing.xs,
  },
  cardPreviewContent: {
    marginBottom: theme.Spacing.sm,
  },
  cardPreviewLine: {
    height: 8,
    backgroundColor: theme.Colors.backgroundTertiary,
    borderRadius: 4,
    marginBottom: theme.Spacing.xs,
  },
  cardPreviewLineShort: {
    width: '70%',
  },
  cardPreviewTags: {
    flexDirection: 'row',
    gap: theme.Spacing.xs,
  },
  cardPreviewTag: {
    width: 50,
    height: 6,
    backgroundColor: theme.Colors.backgroundTertiary,
    borderRadius: 3,
  },
  cardPreviewArrow: {
    marginVertical: theme.Spacing.md,
    alignItems: 'center',
  },
  cardPreviewArrowUp: {
    marginTop: theme.Spacing.sm,
  },
  cardPreviewArrowDown: {
    marginBottom: theme.Spacing.sm,
  },
  cardPreviewArrowText: {
    fontSize: 48,
    color: theme.Colors.primary,
    fontWeight: theme.Typography.fontWeight.bold,
  },
  cardPreviewNext: {
    marginTop: theme.Spacing.sm,
    opacity: 0.6,
  },
  swipeCardDemoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.Spacing.lg,
    width: '100%',
  },
  swipeCardDemo: {
    width: width * 0.7,
    height: 200,
    backgroundColor: theme.Colors.background,
    borderRadius: theme.BorderRadius.lg,
    padding: theme.Spacing.md,
    ...theme.Shadows.lg,
    borderWidth: 1,
    borderColor: theme.Colors.backgroundTertiary,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: theme.Spacing.md,
  },
  swipeCardDemoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.Spacing.sm,
  },
  swipeCardDemoLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeCardDemoLogoText: {
    fontSize: theme.Typography.fontSize.sm,
    fontWeight: theme.Typography.fontWeight.bold,
    color: theme.Colors.text,
    fontFamily: theme.Typography.fontFamily.bold,
  },
  swipeCardDemoLogoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.Colors.primary,
    marginLeft: theme.Spacing.xs,
  },
  swipeCardDemoContent: {
    marginBottom: theme.Spacing.sm,
    flex: 1,
  },
  swipeCardDemoLine: {
    height: 8,
    backgroundColor: theme.Colors.backgroundTertiary,
    borderRadius: 4,
    marginBottom: theme.Spacing.xs,
  },
  swipeCardDemoLineShort: {
    width: '70%',
  },
  swipeCardDemoTags: {
    flexDirection: 'row',
    gap: theme.Spacing.xs,
  },
  swipeCardDemoTag: {
    width: 50,
    height: 6,
    backgroundColor: theme.Colors.backgroundTertiary,
    borderRadius: 3,
  },
  swipeCardDemoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeCardDemoOverlayLike: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  swipeCardDemoOverlayDislike: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  swipeCardDemoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  swipeCardDemoBadgeLike: {
    backgroundColor: '#22C55E',
  },
  swipeCardDemoBadgeDislike: {
    backgroundColor: '#EF4444',
  },
  swipeCardDemoBadgeRight: {
    right: 20,
  },
  swipeCardDemoBadgeLeft: {
    left: 20,
  },
  actionBadge: {
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.full,
  },
  actionBadgeText: {
    fontSize: theme.Typography.fontSize.base,
    fontWeight: theme.Typography.fontWeight.bold,
    color: theme.Colors.textWhite,
    fontFamily: theme.Typography.fontFamily.bold,
    letterSpacing: 1,
  },
  // Mockup styles
  mockupContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.Spacing.md,
    width: '100%',
    paddingHorizontal: theme.Spacing.lg,
  },
  mockupLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockupLogoText: {
    fontSize: theme.Typography.fontSize.xl,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  mockupLogoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.Colors.primary,
    marginLeft: theme.Spacing.xs,
  },
  mockupFilterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.lg,
    gap: theme.Spacing.sm,
  },
  mockupFilterCapsule: {
    backgroundColor: theme.Colors.backgroundTertiary,
    borderRadius: theme.BorderRadius.full,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.xs,
    borderWidth: 1,
    borderColor: theme.Colors.borderLight,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockupFilterCapsuleActive: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
  mockupFilterText: {
    fontSize: theme.Typography.fontSize.sm,
    fontWeight: theme.Typography.fontWeight.medium,
    color: theme.Colors.textSecondary,
    fontFamily: theme.Typography.fontFamily.medium,
  },
  mockupFilterTextActive: {
    color: theme.Colors.textWhite,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  mockupCard: {
    width: width * 0.7,
    backgroundColor: theme.Colors.background,
    borderRadius: theme.BorderRadius.lg,
    padding: theme.Spacing.md,
    ...theme.Shadows.lg,
    borderWidth: 1,
    borderColor: theme.Colors.backgroundTertiary,
  },
  mockupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.Spacing.sm,
  },
  mockupCardContent: {
    marginBottom: theme.Spacing.md,
  },
  mockupCardLine: {
    height: 8,
    backgroundColor: theme.Colors.backgroundTertiary,
    borderRadius: 4,
    marginBottom: theme.Spacing.xs,
    width: '100%',
  },
  mockupCardLineShort: {
    width: '70%',
  },
  mockupActionButtonsContainer: {
    position: 'absolute',
    bottom: -20,
    backgroundColor: theme.Colors.background,
    right: theme.Spacing.md,
    paddingHorizontal: theme.Spacing.xs,
    flexDirection: 'row',
    borderRadius: theme.BorderRadius.full,
    zIndex: 10,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.Shadows.md,
  },
  mockupActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: theme.Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.borderLight,
  },
  mockupActionButton: {
    padding: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockupToggleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mockupToggleSwitch: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderRadius: 30,
    padding: 3,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockupToggleSegment: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockupToggleSegmentActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.Colors.primary,
  },
  mockupToggleSeparator: {
    width: 1.5,
    height: 30,
    backgroundColor: 'rgba(156, 163, 175, 0.4)',
    marginHorizontal: 4,
  },
});

export default WalkthroughOverlay;

