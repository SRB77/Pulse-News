import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Animated, Share, Platform, Linking, Dimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { theme } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { BookmarkIcon, ShareIcon, ChevronLeftIcon } from '../components/Icons';
import { toggleBookmark } from '../services/bookmarkService';
import { isBookmarked as isBookmarkedService } from '../services/bookmarkService';

interface NewsItemRouteParam {
  id: string;
  headline: string;
  content: string;
  fullContent?: string; // HTML content from Firestore
  imageUrl: string;
  source: string;
  newsTags: string[];
  areaTags: string[];
  timestamp: string;
  author: string;
  category?: string;
  tags?: string[];
  readTime?: number;
  region?: string;
  journalistName?: string;
  publishedAt?: any; // Firestore timestamp
  createdAt?: any; // Firestore timestamp
  youtubeVideoUrl?: string; // YouTube video URL
}

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const NewsDetailScreen: React.FC<any> = ({ route }) => {
  const navigation = useNavigation<any>();
  const item: NewsItemRouteParam = route.params?.item;
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isBookmarking, setIsBookmarking] = useState<boolean>(false);
  const [videoPlaying, setVideoPlaying] = useState<boolean>(true);
  
  // Animation values
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simulate loading time
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1200); // 1.2 seconds loading time

    // Loading dots animation
    if (isLoading) {
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
    }

    return () => {
      clearTimeout(loadingTimer);
      dot1Anim.setValue(0);
      dot2Anim.setValue(0);
      dot3Anim.setValue(0);
    };
  }, [isLoading]);

  // Load initial bookmark state
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const state = await isBookmarkedService(item.id);
        if (mounted) setIsBookmarked(state);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [item.id]);

  const handleToggleBookmark = async () => {
    if (isBookmarking) return;
    try {
      setIsBookmarking(true);
      const next = await toggleBookmark({
        id: item.id,
        headline: item.headline,
        content: item.content,
        imageUrl: item.imageUrl,
        source: item.source,
        timestamp: item.timestamp,
        author: item.author,
      });
      setIsBookmarked(next);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleShare = async () => {
    try {
      const deepLinkUrl = `pulse://article/${item.id}`;
      
      // App Store and Play Store URLs (update these with actual store URLs when published)
      const appStoreUrl = 'https://apps.apple.com/app/pulse/id123456789'; // TODO: Replace with actual App Store URL
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.mk2004.pulse';
      
      const contentPreview = (item.fullContent || item.content).substring(0, 200) + ((item.fullContent || item.content).length > 200 ? '...' : '');
      const shareMessage = `${item.headline}\n\n${contentPreview}\n\n📱 Read full article in Pulse app:\n${deepLinkUrl}\n\nDon't have the app?\n${Platform.OS === 'ios' ? appStoreUrl : playStoreUrl}`;
      
      if (Platform.OS === 'ios') {
        await Share.share({
          title: item.headline,
          message: shareMessage,
          url: deepLinkUrl,
        });
      } else {
      await Share.share({
        title: item.headline,
          message: shareMessage,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Format date to readable format
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
        // Fallback to current date if invalid
        date = new Date();
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return item.timestamp || '';
      }

      // Format: "November 4, 2025" or "Nov 4, 2025"
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      // Fallback to timestamp string if formatting fails
      return item.timestamp || '';
    }
  };

  // Get the date to display
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

  // Decode HTML entities to actual symbols
  const decodeHtmlEntities = (text: string): string => {
    const entityMap: { [key: string]: string } = {
      '&bull;': '•',
      '&mdash;': '—',
      '&ndash;': '–',
      '&hellip;': '…',
      '&rsquo;': '\u2019', // Right single quotation mark
      '&lsquo;': '\u2018', // Left single quotation mark
      '&rdquo;': '\u201D', // Right double quotation mark
      '&ldquo;': '\u201C', // Left double quotation mark
      '&quot;': '"',
      '&apos;': "'",
      '&nbsp;': ' ',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™',
      '&euro;': '€',
      '&pound;': '£',
      '&yen;': '¥',
      '&cent;': '¢',
      '&deg;': '°',
      '&plusmn;': '±',
      '&frac12;': '½',
      '&frac14;': '¼',
      '&frac34;': '¾',
      '&times;': '×',
      '&divide;': '÷',
      '&sup2;': '²',
      '&sup3;': '³',
      '&micro;': 'µ',
      '&para;': '¶',
      '&middot;': '·',
      '&Alpha;': 'Α',
      '&Beta;': 'Β',
      '&Gamma;': 'Γ',
      '&Delta;': 'Δ',
      '&Epsilon;': 'Ε',
      '&Zeta;': 'Ζ',
      '&Eta;': 'Η',
      '&Theta;': 'Θ',
      '&Iota;': 'Ι',
      '&Kappa;': 'Κ',
      '&Lambda;': 'Λ',
      '&Mu;': 'Μ',
      '&Nu;': 'Ν',
      '&Xi;': 'Ξ',
      '&Omicron;': 'Ο',
      '&Pi;': 'Π',
      '&Rho;': 'Ρ',
      '&Sigma;': 'Σ',
      '&Tau;': 'Τ',
      '&Upsilon;': 'Υ',
      '&Phi;': 'Φ',
      '&Chi;': 'Χ',
      '&Psi;': 'Ψ',
      '&Omega;': 'Ω',
      '&alpha;': 'α',
      '&beta;': 'β',
      '&gamma;': 'γ',
      '&delta;': 'δ',
      '&epsilon;': 'ε',
      '&zeta;': 'ζ',
      '&eta;': 'η',
      '&theta;': 'θ',
      '&iota;': 'ι',
      '&kappa;': 'κ',
      '&lambda;': 'λ',
      '&mu;': 'μ',
      '&nu;': 'ν',
      '&xi;': 'ξ',
      '&omicron;': 'ο',
      '&pi;': 'π',
      '&rho;': 'ρ',
      '&sigmaf;': 'ς',
      '&sigma;': 'σ',
      '&tau;': 'τ',
      '&upsilon;': 'υ',
      '&phi;': 'φ',
      '&chi;': 'χ',
      '&psi;': 'ψ',
      '&omega;': 'ω',
    };

    // Replace named entities
    let decoded = text;
    for (const [entity, char] of Object.entries(entityMap)) {
      const regex = new RegExp(entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      decoded = decoded.replace(regex, char);
    }

    // Replace numeric entities (&#123; or &#x1F;)
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    });

    decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    return decoded;
  };

  // Parse HTML content to extract images and text
  const parseContent = useMemo(() => {
    const htmlContent = item.fullContent || item.content || '';
    
    // Extract image URLs from HTML (including URLs in text)
    const imageUrlRegex = /https?:\/\/[^\s"<>\)]+\.(jpg|jpeg|png|gif|webp)(\?[^\s"<>\)]*)?/gi;
    const imageUrls: string[] = [];
    const seenUrls = new Set<string>();
    
    let match;
    while ((match = imageUrlRegex.exec(htmlContent)) !== null) {
      const url = match[0];
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        imageUrls.push(url);
      }
    }

    // Extract text content by removing HTML tags and image URLs
    let textContent = htmlContent
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/https?:\/\/[^\s"<>\)]+\.(jpg|jpeg|png|gif|webp)(\?[^\s"<>\)]*)?/gi, '') // Remove image URLs from text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    // Decode HTML entities
    textContent = decodeHtmlEntities(textContent);

    // If no meaningful text content found (after removing URLs), use the summary/regular content
    if (!textContent || textContent.length < 10) {
      textContent = decodeHtmlEntities(item.content || '');
    }

    return { textContent, imageUrls };
  }, [item.fullContent, item.content]);

  const normalizedCategory = useMemo(() => {
    if (!item.category) return null;
    return String(item.category).trim().toLowerCase();
  }, [item.category]);

  const uniqueTags = useMemo(() => {
    const tagsArray: string[] = Array.isArray(item.tags)
      ? item.tags
      : item.tags
      ? [item.tags]
      : [];

    const seen = new Set<string>();
    const deduped: string[] = [];

    tagsArray.forEach((rawTag) => {
      if (rawTag === null || rawTag === undefined) return;
      const tagStr = String(rawTag).trim();
      if (!tagStr) return;

      const normalized = tagStr.toLowerCase();
      if (normalizedCategory && normalized === normalizedCategory) return;
      if (seen.has(normalized)) return;

      seen.add(normalized);
      deduped.push(tagStr);
    });

    return deduped;
  }, [item.tags, normalizedCategory]);

  const formatTagLabel = (label: string): string => {
    return label
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Render content with images
  const renderContent = () => {
    const { textContent, imageUrls } = parseContent;
    
    // Split by newlines and filter empty paragraphs
    let paragraphs = textContent.split(/\n+/).filter(p => p.trim().length > 0);
    
    // If no paragraphs found, split by periods or use the whole text
    if (paragraphs.length === 0) {
      paragraphs = [textContent];
    } else if (paragraphs.length === 1 && paragraphs[0].length > 500) {
      // If it's one long paragraph, try to split by sentences
      paragraphs = paragraphs[0].split(/(?<=[.!?])\s+/).filter(p => p.trim().length > 0);
    }

    return (
      <View>
        {paragraphs.map((paragraph, index) => {
          const trimmed = paragraph.trim();
          const isBulletPoint = trimmed.startsWith('•') || trimmed.startsWith('&bull;');
          
          return (
            <View key={index} style={styles.paragraphContainer}>
              <Text style={styles.body}>
                {trimmed}
              </Text>
            </View>
          );
        })}
        {imageUrls.length > 0 && (
          <View style={styles.contentImagesContainer}>
            {imageUrls.map((url, index) => (
              <Image 
                key={index} 
                source={{ uri: url }} 
                style={styles.contentImage}
                resizeMode="cover"
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No article found.</Text>
      </View>
    );
  }

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
        
        <Text style={styles.loadingText}>Loading article...</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return renderLoadingAnimation();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeftIcon size={24} color={theme.Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.headerTitle}>
            {item.headline}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerAction, isBookmarking && styles.headerActionDisabled]}
            onPress={handleToggleBookmark}
            activeOpacity={0.7}
            disabled={isBookmarking}
          >
            <BookmarkIcon
              size={22}
              color={isBookmarking ? '#999999' : (isBookmarked ? theme.Colors.primary : '#6B7280')}
              filled={isBookmarked && !isBookmarking}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction} onPress={handleShare} activeOpacity={0.7}>
            <ShareIcon size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* Show YouTube video if video URL exists, otherwise show image */}
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
              // Use full width minus padding (content has padding: theme.Spacing.md)
              const containerWidth = screenWidth - (theme.Spacing.md * 2);
              
              // Calculate height based on 16:9 aspect ratio using full container width
              const aspectRatio = 16 / 9;
              const playerWidth = containerWidth;
              const playerHeight = containerWidth / aspectRatio;
              
              // Handle when player is ready - ensure it starts playing
              const handleReady = () => {
                // Force play state to true when ready
                setVideoPlaying(true);
              };
              
              // Handle state changes to track playback
              const handleStateChange = (state: string) => {
                if (state === 'playing') {
                  setVideoPlaying(true);
                } else if (state === 'paused' || state === 'ended') {
                  setVideoPlaying(false);
                }
              };
              
              return (
                <View 
                  style={[styles.videoContainer, { height: playerHeight }]}
                  pointerEvents="box-none"
                >
                  <View 
                    style={{ width: '100%', height: '100%' }}
                    pointerEvents="auto"
                    onStartShouldSetResponder={() => true}
                    onResponderTerminationRequest={() => false}
                  >
                    <YoutubePlayer
                      height={playerHeight}
                      width={playerWidth}
                      videoId={videoId}
                      play={videoPlaying} // Autoplay
                      mute={true} // Start muted for guaranteed autoplay (user can unmute)
                      controls={1}
                      showFullscreenButton={true}
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
                      onError={(error: any) => {
                        console.warn('YouTube player error:', error);
                        // Fallback: open in YouTube app on error
                        openYouTubeVideo();
                      }}
                    />
                  </View>
                </View>
              );
            })() : (
              <View style={[styles.image, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={styles.mediaFallbackText}>Invalid video URL</Text>
              </View>
            );
          })()
        ) : item.imageUrl && item.imageUrl.trim() !== '' ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={styles.mediaFallbackText}>No image available</Text>
          </View>
        )}
        
        {/* Category and Tags */}
        {(item.category || uniqueTags.length > 0) && (
          <View style={styles.tagsContainer}>
            {item.category && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>• {formatTagLabel(item.category)}</Text>
              </View>
            )}
            {uniqueTags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>• {formatTagLabel(tag)}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.headline}>{item.headline}</Text>
        
        {/* Meta information */}
        <View style={styles.metaContainer}>
          <Text style={styles.meta}>
            {item.source && item.source.trim() ? `${item.source} • ` : ''}
            {displayDate}
            {(item.journalistName || item.author) && ` • by ${item.journalistName || item.author}`}
          </Text>
        </View>

        {/* Full content */}
        <View style={styles.contentBody}>
          {renderContent()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.background,
  },
  content: {
    padding: theme.Spacing.md,
    paddingTop: theme.Spacing.lg,
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
  headerTitleWrapper: {
    flex: 1,
    marginHorizontal: theme.Spacing.md,
  },
  headerTitle: {
    fontSize: theme.Typography.fontSize.lg,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    maxWidth: '75%',
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.Spacing.sm,
  },
  headerAction: {
    padding: theme.Spacing.xs,
  },
  headerActionDisabled: {
    opacity: 0.5,
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: theme.BorderRadius.lg,
    backgroundColor: theme.Colors.backgroundTertiary,
    marginBottom: theme.Spacing.lg,
  },
  videoContainer: {
    width: '100%',
    borderRadius: theme.BorderRadius.lg,
    backgroundColor: '#000000',
    overflow: 'hidden',
    marginBottom: theme.Spacing.lg,
    position: 'relative',
  },
  headline: {
    fontSize: theme.Typography.fontSize['xl'],
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    paddingHorizontal: theme.Spacing.md,
    marginBottom: theme.Spacing.sm,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm,
    paddingHorizontal: theme.Spacing.md,
    marginBottom: theme.Spacing.md,
  },
  categoryTag: {
    backgroundColor: theme.Colors.primary,
    borderRadius: theme.BorderRadius.sm,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.xs,
  },
  categoryText: {
    fontSize: theme.Typography.fontSize.xs,
    color: theme.Colors.textWhite,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  tag: {
    backgroundColor: theme.Colors.backgroundTertiary,
    borderRadius: theme.BorderRadius.sm,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
  },
  tagText: {
    fontSize: theme.Typography.fontSize.xs,
    color: theme.Colors.textTertiary,
    fontWeight: theme.Typography.fontWeight.normal,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  metaContainer: {
    paddingHorizontal: theme.Spacing.md,
    marginBottom: theme.Spacing.lg,
  },
  meta: {
    color: theme.Colors.textTertiary,
    fontSize: theme.Typography.fontSize.sm,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  contentBody: {
    paddingHorizontal: theme.Spacing.md,
    marginBottom: theme.Spacing.lg,
  },
  paragraphContainer: {
    marginBottom: theme.Spacing.md,
  },
  body: {
    color: '#666666',
    fontSize: theme.Typography.fontSize.base,
    lineHeight: 24,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  contentImagesContainer: {
    marginTop: theme.Spacing.lg,
    marginBottom: theme.Spacing.md,
  },
  contentImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.BorderRadius.md,
    marginBottom: theme.Spacing.md,
    backgroundColor: theme.Colors.backgroundTertiary,
  },
  authorContainer: {
    marginTop: theme.Spacing.lg,
    paddingTop: theme.Spacing.lg,
    paddingHorizontal: theme.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.borderLight,
  },
  author: {
    color: theme.Colors.textTertiary,
    fontSize: theme.Typography.fontSize.sm,
    fontWeight: theme.Typography.fontWeight.medium,
    fontFamily: theme.Typography.fontFamily.medium,
  },
  errorText: {
    color: theme.Colors.text,
    alignSelf: 'center',
    marginTop: theme.Spacing.xl,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  
  // Loading Animation Styles
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
  mediaFallbackText: {
    color: theme.Colors.textTertiary,
    fontFamily: theme.Typography.fontFamily.regular,
    fontSize: theme.Typography.fontSize.sm,
  },
});

export default NewsDetailScreen;


