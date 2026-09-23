/**
 * App Navigator Component
 * Main navigation configuration for the app
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators, TransitionSpecs } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet, Linking } from 'react-native';
import WelcomeScreen from '../screens/WelcomeScreen';
import FeedScreen from '../screens/FeedScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import SettingsScreen from '../screens/AccountScreen';
import AppSettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
import ContactScreen from '../screens/ContactScreen';
import MandatorySignupScreen from '../screens/MandatorySignupScreen';
import AuthScreen from '../screens/AuthScreen';
import BottomNavigation from '../components/BottomNavigation';
import { firebaseService } from '../services/firebaseService';
import { theme } from '../constants/theme';

const Stack = createStackNavigator();

// Wrapper component that includes BottomNavigation for main screens
const MainScreenWrapper: React.FC<{ children: React.ReactNode; activeTab: 'feed' | 'account' }> = ({ children, activeTab }) => {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1 }}>
      {children}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          if (tab === 'feed') {
            navigation.navigate('Feed');
          } else if (tab === 'account') {
            const isSignedIn = !!firebaseService.getAuth().currentUser;
            if (isSignedIn) {
              navigation.navigate('Settings');
            } else {
              navigation.navigate('MandatorySignup');
            }
          }
        }} 
      />
    </View>
  );
};

const AppNavigator: React.FC = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigationRef = React.useRef<any>(null);

  // Handle user state changes
  function onAuthStateChanged(user: any) {
    console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = firebaseService.getAuth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  // Handle deep link navigation manually (we need to fetch article first)
  const handleDeepLink = React.useCallback(async (url: string) => {
    if (!url) {
      console.log('Deep link handler: No URL provided');
      return;
    }
    
    console.log('Handling deep link:', url);
    
    try {
      // Parse the URL: pulse://article/:articleId
      const match = url.match(/pulse:\/\/article\/([^\/]+)/);
      if (match && match[1]) {
        const articleId = match[1];
        console.log('Found article ID in deep link:', articleId);
        
        // Fetch the article by ID
        const result = await firebaseService.fetchArticleById(articleId);
        if (result.success && result.article) {
          console.log('Article fetched successfully, navigating to NewsDetail');
          
          // Wait for navigation to be ready, then navigate
          const navigateToArticle = () => {
            if (navigationRef.current?.isReady()) {
              navigationRef.current.navigate('NewsDetail', { 
                item: result.article,
                _key: articleId 
              });
              return true;
            }
            return false;
          };

          // Try immediately
          if (!navigateToArticle()) {
            // If not ready, wait and retry
            const retryInterval = setInterval(() => {
              if (navigateToArticle()) {
                clearInterval(retryInterval);
              }
            }, 200);
            
            // Stop retrying after 5 seconds
            setTimeout(() => clearInterval(retryInterval), 5000);
          }
        } else {
          console.error('Failed to fetch article:', result.error);
          // Fallback: navigate to Feed
          if (navigationRef.current?.isReady()) {
            navigationRef.current.navigate('Feed');
          }
        }
      } else {
        console.log('Deep link URL format not recognized:', url);
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }, []);

  useEffect(() => {
    // Handle initial URL (app opened from deep link)
    const handleInitialURL = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          console.log('App opened with initial URL:', url);
          // Wait a bit for navigation container to be ready
          setTimeout(() => handleDeepLink(url), 1000);
        }
      } catch (error) {
        console.error('Error getting initial URL:', error);
      }
    };

    handleInitialURL();

    // Handle URL events when app is already open
    const handleURL = ({ url }: { url: string }) => {
      console.log('Received URL event:', url);
      handleDeepLink(url);
    };

    const subscription = Linking.addEventListener('url', handleURL);

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  // Configure deep linking - we handle NewsDetail manually
  const linking = {
    prefixes: ['pulse://'],
    config: {
      screens: {
        Feed: '',
      },
    },
    async getInitialURL() {
      const url = await Linking.getInitialURL();
      // Don't let React Navigation auto-handle article links
      if (url && url.includes('/article/')) {
        return null; // We'll handle it manually
      }
      return url;
    },
    subscribe(listener: (url: string) => void) {
      const onReceiveURL = ({ url }: { url: string }) => {
        // For article deep links, handle manually (don't let React Navigation auto-handle)
        if (url && url.includes('/article/')) {
          // Trigger our manual handler
          handleDeepLink(url);
          return;
        }
        // For other URLs, let React Navigation handle it
        listener(url);
      };
      const subscription = Linking.addEventListener('url', onReceiveURL);
      return () => {
        subscription.remove();
      };
    },
  };

  if (initializing) {
    console.log('App is initializing...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
      </View>
    );
  }

  console.log('Rendering navigator. User:', user ? 'present' : 'null');

  return (
    <NavigationContainer 
      ref={navigationRef} 
      linking={linking}
      onReady={() => {
        console.log('Navigation container is ready');
        // Check for initial URL again once navigation is ready
        Linking.getInitialURL().then((url) => {
          if (url) {
            console.log('Navigation ready, handling initial URL:', url);
            handleDeepLink(url);
          }
        });
      }}
    >
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      >
        {user ? (
          // Signed-in users: go directly to Feed
          <>
            <Stack.Screen 
              name="Feed" 
              children={() => (
                <MainScreenWrapper activeTab="feed">
                  <FeedScreen />
                </MainScreenWrapper>
              )}
            />
            <Stack.Screen 
              name="NewsDetail" 
              component={NewsDetailScreen}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
            />
            <Stack.Screen 
              name="AppSettings" 
              component={AppSettingsScreen}
            />
            <Stack.Screen 
              name="PrivacyPolicy" 
              component={PrivacyPolicyScreen}
            />
            <Stack.Screen 
              name="TermsConditions" 
              component={TermsConditionsScreen}
            />
            <Stack.Screen 
              name="Contact" 
              component={ContactScreen}
            />
            <Stack.Screen 
              name="Settings" 
              children={() => (
                <MainScreenWrapper activeTab="account">
                  <SettingsScreen />
                </MainScreenWrapper>
              )}
            />
          </>
        ) : (
          // No user signed in: allow Welcome and Feed (guest)
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Feed" 
              children={() => (
                <MainScreenWrapper activeTab="feed">
                  <FeedScreen />
                </MainScreenWrapper>
              )}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen 
              name="Settings" 
              children={() => (
                <MainScreenWrapper activeTab="account">
                  <SettingsScreen />
                </MainScreenWrapper>
              )}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen 
              name="MandatorySignup" 
              component={MandatorySignupScreen}
              options={{ 
                headerShown: false,
                gestureEnabled: true,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.background,
  },
});

export default AppNavigator;
