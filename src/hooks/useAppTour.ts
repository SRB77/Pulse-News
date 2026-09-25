import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseService } from '../services/firebaseService';

const WALKTHROUGH_SHOWN_KEY = 'walkthroughShown';
const USER_WALKTHROUGH_SHOWN_KEY = 'userWalkthroughShown_'; // Prefix + userId

export const useWalkthrough = () => {
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkWalkthroughStatus = async () => {
      setIsChecking(true);
      try {
        const currentUser = firebaseService.getAuth().currentUser;
        const isSignedIn = !!currentUser;

        if (isSignedIn) {
          // Logged-in user: Check if walkthrough has been shown for this user
          const userId = currentUser.uid;
          const shownKey = `${USER_WALKTHROUGH_SHOWN_KEY}${userId}`;
          const hasShown = await AsyncStorage.getItem(shownKey);
          
          if (!hasShown) {
            // First time this user sees the feed - show walkthrough
            setShowWalkthrough(true);
          } else {
            setShowWalkthrough(false);
          }
        } else {
          // Guest user: Show walkthrough only on first app open
          const guestWalkthroughShown = await AsyncStorage.getItem(WALKTHROUGH_SHOWN_KEY);
          
          if (!guestWalkthroughShown) {
            // First time guest - show walkthrough
            setShowWalkthrough(true);
          } else {
            setShowWalkthrough(false);
          }
        }
      } catch (error) {
        console.error('Error checking walkthrough status:', error);
        // On error, don't show walkthrough to avoid annoying users
        setShowWalkthrough(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkWalkthroughStatus();
  }, []);

  // Listen for auth state changes - if user signs in, check if they've seen walkthrough
  useEffect(() => {
    const unsubscribe = firebaseService.getAuth().onAuthStateChanged(async (user) => {
      if (user) {
        // User just signed in - check if they've seen walkthrough
        const userId = user.uid;
        const shownKey = `${USER_WALKTHROUGH_SHOWN_KEY}${userId}`;
        const hasShown = await AsyncStorage.getItem(shownKey);

        if (!hasShown) {
          // First time this user signed in - show walkthrough once
          setShowWalkthrough(true);
        } else {
          setShowWalkthrough(false);
        }
      } else {
        // User signed out - check guest walkthrough status
        const guestWalkthroughShown = await AsyncStorage.getItem(WALKTHROUGH_SHOWN_KEY);
        setShowWalkthrough(!guestWalkthroughShown);
      }
    });

    return unsubscribe;
  }, []);

  const completeWalkthrough = async () => {
    try {
      const currentUser = firebaseService.getAuth().currentUser;
      const isSignedIn = !!currentUser;

      if (isSignedIn) {
        // Mark walkthrough as shown for this user
        const userId = currentUser.uid;
        const shownKey = `${USER_WALKTHROUGH_SHOWN_KEY}${userId}`;
        await AsyncStorage.setItem(shownKey, 'true');
      } else {
        // Mark walkthrough as shown for guest
        await AsyncStorage.setItem(WALKTHROUGH_SHOWN_KEY, 'true');
      }
    } catch (error) {
      console.error('Error saving walkthrough status:', error);
    }
    setShowWalkthrough(false);
  };

  const skipWalkthrough = async () => {
    try {
      const currentUser = firebaseService.getAuth().currentUser;
      const isSignedIn = !!currentUser;

      if (isSignedIn) {
        // Mark walkthrough as shown for this user
        const userId = currentUser.uid;
        const shownKey = `${USER_WALKTHROUGH_SHOWN_KEY}${userId}`;
        await AsyncStorage.setItem(shownKey, 'true');
      } else {
        // Mark walkthrough as shown for guest
        await AsyncStorage.setItem(WALKTHROUGH_SHOWN_KEY, 'true');
      }
    } catch (error) {
      console.error('Error saving walkthrough status:', error);
    }
    setShowWalkthrough(false);
  };

  return {
    showWalkthrough: showWalkthrough && !isChecking,
    completeWalkthrough,
    skipWalkthrough,
  };
};

