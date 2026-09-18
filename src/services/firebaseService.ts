/**
 * Firebase Service
 * Handles Firebase authentication and Google Sign-In
 */

import firebase from '@react-native-firebase/app';
import auth, { AppleAuthProvider } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "pulse-c6df9.firebaseapp.com",
  projectId: "pulse-c6df9",
  storageBucket: "pulse-c6df9.firebasestorage.app",
  messagingSenderId: "240600042189",
  appId: "1:240600042189:android:762b89a0f68779265df784"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '240600042189-4slm22oorgpscaqduj2al8gbpsoh7j75.apps.googleusercontent.com',
  iosClientId: '240600042189-c7ea9oihao2h9ndsqksl8tvf83hapaju.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  offlineAccess: true,
});

interface SignInResult {
  success: boolean;
  user?: any;
  error?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  interests?: string[];
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class FirebaseService {
  private auth: any;
  private currentUser: any;
  private db: any;

  constructor() {
    this.auth = auth();
    this.db = firestore();
    this.currentUser = null;
    
    // Test Firestore connection
    this.testFirestoreConnection();
    
    this.initAuthListener();
  }

  // Test Firestore connection
  testFirestoreConnection = async () => {
    try {
      console.log('🔵 Testing Firestore connection...');
      const testRef = this.db.collection('_test').doc('connection');
      await testRef.set({ test: true, timestamp: firestore.Timestamp.now() });
      await testRef.delete();
      console.log('✅ Firestore connection working!');
    } catch (error: any) {
      console.error('❌ Firestore connection FAILED:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
      });
    }
  };

  initAuthListener = () => {
    this.auth.onAuthStateChanged(async (user: any) => {
      this.currentUser = user;
      if (user && user.uid) {
        // Simply create user if not exists
        await this.ensureUserExists(user.uid, user.email || '');
      }
    });
  };

  signInWithGoogle = async (): Promise<SignInResult> => {
    try {
      // Check if your device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Clear any stale session to ensure fresh token issuance
      try { await GoogleSignin.signOut(); } catch {}

      // Get the user's ID token
      const signInResponse: any = await GoogleSignin.signIn();
      let idToken = signInResponse?.idToken;
      if (!idToken) {
        // Fallback: fetch tokens explicitly (some devices return tokens only via this API)
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens?.idToken;
      }
      if (!idToken) {
        // One more fallback: try silent sign-in then fetch tokens
        try {
          await GoogleSignin.signInSilently();
          const tokensAfterSilent = await GoogleSignin.getTokens();
          idToken = tokensAfterSilent?.idToken;
        } catch {}
      }
      if (!idToken) throw new Error('Missing idToken from Google Sign-In response');

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      this.currentUser = userCredential.user;

      // Verify user object is valid
      if (!this.currentUser || !this.currentUser.uid) {
        throw new Error('Invalid user object returned from sign-in');
      }

      // Create user in Firestore if not exists
      const email = this.currentUser.email || '';
      const createResult = await this.ensureUserExists(this.currentUser.uid, email);
      
      if (!createResult.success) {
        console.error('❌ FAILED to create user in Firestore:', createResult.error);
        // Still allow sign-in to proceed, but log the error
      }

      await this.persistUserSession(this.currentUser);
      return { success: true, user: this.currentUser };
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  };

  signInWithApple = async (): Promise<SignInResult> => {
    try {
      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        // As per the FAQ of react-native-apple-authentication, the name should come first in the following array.
        // See: https://github.com/invertase/react-native-apple-authentication#faqs
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      // Ensure Apple returned a user identityToken
      if (!appleAuthRequestResponse.identityToken) {
        return { success: false, error: 'Apple Sign-In failed - no identity token returned' };
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = AppleAuthProvider.credential(identityToken, nonce);

      // Sign the user in with the credential
      const userCredential = await auth().signInWithCredential(appleCredential);
      this.currentUser = userCredential.user;

      // Verify user object is valid
      if (!this.currentUser || !this.currentUser.uid) {
        throw new Error('Invalid user object returned from sign-in');
      }

      // Create user in Firestore if not exists
      const email = this.currentUser.email || appleAuthRequestResponse.email || '';
      const createResult = await this.ensureUserExists(this.currentUser.uid, email);
      
      if (!createResult.success) {
        console.error('❌ FAILED to create user in Firestore:', createResult.error);
      }

      await this.persistUserSession(this.currentUser);
      return { success: true, user: this.currentUser };
    } catch (error: any) {
      console.error('Apple Sign-In error:', error);
      
      // Handle user cancellation (error code 1001)
      if (error.code === 1001 || error.message?.includes('canceled')) {
        return { success: false, error: 'Sign in was canceled' };
      }
      
      return { success: false, error: this.getErrorMessage(error) };
    }
  };

  signInWithEmail = async (email: string, password: string): Promise<SignInResult> => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      this.currentUser = userCredential.user;

      // Verify user object is valid
      if (!this.currentUser || !this.currentUser.uid) {
        throw new Error('Invalid user object returned from sign-in');
      }

      // Create user in Firestore if not exists
      const createResult = await this.ensureUserExists(this.currentUser.uid, email);
      
      if (!createResult.success) {
        console.error('❌ FAILED to create user in Firestore:', createResult.error);
      }

      await this.persistUserSession(this.currentUser);
      return { success: true, user: this.currentUser };
    } catch (error: any) {
      console.error('Email Sign-In error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  };

  signUpWithEmail = async (email: string, password: string): Promise<SignInResult> => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      this.currentUser = userCredential.user;

      // Verify user object is valid
      if (!this.currentUser || !this.currentUser.uid) {
        throw new Error('Invalid user object returned from sign-up');
      }

      // Create user in Firestore if not exists
      const createResult = await this.ensureUserExists(this.currentUser.uid, email);
      
      if (!createResult.success) {
        console.error('❌ FAILED to create user in Firestore:', createResult.error);
      }

      await this.persistUserSession(this.currentUser);
      return { success: true, user: this.currentUser };
    } catch (error: any) {
      console.error('Email Sign-Up error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  };

  resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await auth().sendPasswordResetEmail(email);
      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  };

  signOut = async (): Promise<SignInResult> => {
    try {
      // Always sign out from Firebase first to invalidate app session
      try {
        await auth().signOut();
      } catch (e) {
        // Ignore if already signed out
      }

      // Best-effort Google sign-out (some environments return HTTP 400 on revoke)
      try {
        try { await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false }); } catch {}
        try { await GoogleSignin.revokeAccess(); } catch {}
        try { await GoogleSignin.signOut(); } catch {}
      } catch {}

      await AsyncStorage.removeItem('userSession');
      this.currentUser = null;
      return { success: true };
    } catch (error: any) {
      console.error('Sign-out error:', error);
      // Even if Google sign-out fails, ensure Firebase state is cleared
      this.currentUser = null;
      await AsyncStorage.removeItem('userSession');
      return { success: false, error: this.getErrorMessage(error) };
    }
  };

  deleteUserAccount = async (): Promise<{ success: boolean; error?: string; requiresRecentLogin?: boolean }> => {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'No authenticated user' };
      }

      const uid = this.currentUser.uid;

      // If user signed in with Apple, revoke the token
      try {
        const providerData = this.currentUser.providerData;
        const isAppleUser = providerData.some((provider: any) => provider.providerId === 'apple.com');
        
        if (isAppleUser) {
          // Get authorizationCode from Apple for revocation
          const { authorizationCode } = await appleAuth.performRequest({
            requestedOperation: appleAuth.Operation.REFRESH,
          });
          
          if (authorizationCode) {
            await auth().revokeToken(authorizationCode);
          }
        }
      } catch (revokeError) {
        console.warn('Error revoking Apple token:', revokeError);
        // Continue with account deletion even if revocation fails
      }

      try {
        await this.db.collection('users').doc(uid).delete();
      } catch (firestoreError) {
        console.warn('Error deleting Firestore profile:', firestoreError);
      }

      try {
        await AsyncStorage.multiRemove(['userProfile', 'userSession']);
      } catch (storageError) {
        console.warn('Error clearing cached profile data:', storageError);
      }

      try {
        await this.currentUser.delete();
      } catch (deleteError: any) {
        if (deleteError?.code === 'auth/requires-recent-login') {
          return {
            success: false,
            error: 'For security reasons, please sign in again before deleting your account.',
            requiresRecentLogin: true,
          };
        }
        throw deleteError;
      }

      try {
        await auth().signOut();
      } catch (signOutError) {
        console.warn('Sign out after delete failed (safe to ignore):', signOutError);
      }

      this.currentUser = null;
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting user account:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  };

  getCurrentUser = () => {
    return this.currentUser;
  };

  getAuth = () => {
    return this.auth;
  };

  // Persistence methods
  persistUserSession = async (user: any) => {
    try {
      await AsyncStorage.setItem('userSession', JSON.stringify(user));
    } catch (error) {
      console.error('Error persisting user session:', error);
    }
  };

  loadUserSession = async () => {
    try {
      const userSession = await AsyncStorage.getItem('userSession');
      if (userSession) {
        this.currentUser = JSON.parse(userSession);
        // Re-authenticate with Firebase if necessary, or just set the user
        // For Google Sign-In, Firebase usually handles session restoration automatically
        // if the token is still valid. This is more for app-level state.
        return this.currentUser;
      }
      return null;
    } catch (error) {
      console.error('Error loading user session:', error);
      return null;
    }
  };

  getErrorMessage = (error: any): string => {
    if (error.code) {
      switch (error.code) {
        case 'auth/account-exists-with-different-credential':
          return 'An account with this email already exists. Please sign in with your existing method.';
        case 'auth/email-already-in-use':
          return 'This email is already registered. Please sign in instead.';
        case 'auth/invalid-credential':
          return 'Invalid credentials. Please try again.';
        case 'auth/invalid-email':
          return 'Invalid email address. Please check and try again.';
        case 'auth/user-disabled':
          return 'This user account has been disabled.';
        case 'auth/operation-not-allowed':
          return 'Email/password accounts are not enabled.';
        case 'auth/weak-password':
          return 'Password is too weak.';
        case 'auth/network-request-failed':
          return 'Network error. Please check your internet connection.';
        case 'auth/user-not-found':
          return 'User not found.';
        case 'auth/wrong-password':
          return 'Wrong password.';
        case 'auth/cancelled-popup-request':
          return 'Google Sign-In was cancelled.';
        case 'auth/popup-closed-by-user':
          return 'Google Sign-In popup was closed.';
        case 'auth/unauthorized-domain':
          return 'Unauthorized domain for Google Sign-In.';
        case 'DEVELOPER_ERROR':
          return 'Google Sign-In Developer Error. Please check your configuration.';
        case 'SIGN_IN_CANCELLED':
          return 'Google Sign-In was cancelled by the user.';
        case 'IN_PROGRESS':
          return 'Google Sign-In is already in progress.';
        case 'PLAY_SERVICES_NOT_AVAILABLE':
          return 'Google Play Services are not available or outdated.';
        default:
          return `Authentication error: ${error.message || error.code}`;
      }
    }
    return `An unknown error occurred: ${error.message || error}`;
  };

  // Simple helper: Create user in Firestore if not exists
  ensureUserExists = async (uid: string, email?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔵 ========== ensureUserExists START ==========');
      console.log('🔵 Parameters:', { uid, email });
      
      if (!uid) {
        console.error('❌ No uid provided');
        return { success: false, error: 'No uid provided' };
      }

      if (!this.db) {
        console.error('❌ Firestore database not initialized');
        return { success: false, error: 'Firestore database not initialized' };
      }

      console.log('🔵 Firestore DB initialized:', !!this.db);
      console.log('🔵 Accessing collection: users');
      
      const userRef = this.db.collection('users').doc(uid);
      console.log('🔵 User reference created for UID:', uid);
      
      console.log('🔵 Checking if user document exists...');
      const userDoc = await userRef.get();
      const docExists = userDoc.exists;
      const existingData = userDoc.data();
      
      console.log('🔵 User document exists?', docExists);
      console.log('🔵 Existing data:', existingData);

      // Get name from email (part before @) or use "User"
      let name = 'User';
      if (email && email.includes('@')) {
        name = email.split('@')[0];
        // Capitalize first letter
        name = name.charAt(0).toUpperCase() + name.slice(1);
      }

      // If user doesn't exist OR exists but has no data, create/update it
      if (!docExists || !existingData || !existingData.uid) {
        const now = firestore.Timestamp.fromDate(new Date());
        const userData = {
          uid,
          email: email || '',
          displayName: name,
          createdAt: now,
          updatedAt: now,
        };
        
        console.log('🔵 User data to save:', {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          createdAt: 'Timestamp',
          updatedAt: 'Timestamp',
        });
        
        console.log('🔵 Attempting to write to Firestore...');
        await userRef.set(userData);
        console.log('✅ Write operation completed!');
        
        // Verify it was created
        console.log('🔵 Verifying document was created...');
        const verifyDoc = await userRef.get();
        if (verifyDoc.exists) {
          const verifyData = verifyDoc.data();
          console.log('✅ VERIFIED: User document exists in Firestore');
          console.log('✅ Document data:', {
            uid: verifyData?.uid,
            email: verifyData?.email,
            displayName: verifyData?.displayName,
          });
        } else {
          console.error('❌ ERROR: User document was NOT created after write!');
          return { success: false, error: 'User document creation failed - document not found after write' };
        }
      } else {
        console.log('ℹ️ User already exists in Firestore with data');
      }

      console.log('✅ ========== ensureUserExists SUCCESS ==========');
      return { success: true };
    } catch (error: any) {
      console.error('❌ ========== ERROR in ensureUserExists ==========');
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error code:', error?.code);
      console.error('❌ Error stack:', error?.stack);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      return { success: false, error: error?.message || 'Unknown error' };
    }
  };

  // Firestore methods for user profile data
  saveUserProfile = async (profileData: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      // Use uid from profileData if provided (most reliable)
      let uid: string | undefined = profileData.uid;
      
      // Get currentUser for fallback and additional data
      let currentUser = this.currentUser;
      if (!currentUser) {
        currentUser = this.auth.currentUser;
        if (currentUser) {
          this.currentUser = currentUser;
        }
      }
      
      // If uid not provided, try to get from currentUser
      if (!uid && currentUser && currentUser.uid) {
        uid = currentUser.uid;
      }
      
      if (!uid) {
        console.error('saveUserProfile: No uid provided and no authenticated user found');
        return { success: false, error: 'No authenticated user or uid provided' };
      }

      const userRef = this.db.collection('users').doc(uid);
      const now = new Date();
      
      // Get existing profile to preserve fields that aren't being updated
      const existingDoc = await userRef.get();
      const existingProfile = existingDoc.exists ? (existingDoc.data() as any) : {};
      
      // Build update object - only include fields that are provided in profileData
      // Don't overwrite existing fields with null/undefined from currentUser
      const updateData: any = {
        updatedAt: now,
      };
      
      // Copy over only the fields provided in profileData
      Object.keys(profileData).forEach(key => {
        const value = (profileData as any)[key];
        if (value !== null && value !== undefined) {
          updateData[key] = value;
        }
      });
      
      // Only set uid, email, displayName if they don't exist in the profile OR if they're explicitly provided
      // This prevents overwriting existing profile data with null/undefined from auth
      if (!existingProfile.uid) {
        updateData.uid = uid;
      }
      
      // Only update email/displayName if they're explicitly provided OR if they don't exist in profile
      // AND currentUser has valid values (not null/undefined)
      if (profileData.email) {
        updateData.email = profileData.email;
      } else if (!existingProfile.email && currentUser && currentUser.email) {
        updateData.email = currentUser.email;
      }
      
      if (profileData.displayName) {
        updateData.displayName = profileData.displayName;
      } else if (!existingProfile.displayName && currentUser && currentUser.displayName) {
        updateData.displayName = currentUser.displayName;
      }
      
      // Preserve createdAt if it exists, otherwise set it
      if (existingProfile.createdAt) {
        // Don't overwrite existing createdAt
      } else if (profileData.createdAt) {
        updateData.createdAt = profileData.createdAt;
      } else if (!existingDoc.exists) {
        updateData.createdAt = now;
      }

      // Remove any null/undefined values before saving (but keep empty arrays)
      const cleanProfileToSave = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== null && value !== undefined)
      );

      // Use merge: true to only update the fields we're providing
      // Firestore will automatically preserve all other existing fields
      // We only send the fields we want to update, not the entire profile
      await userRef.set(cleanProfileToSave, { merge: true });
      
      // Reload the complete profile from Firestore to save to AsyncStorage
      // This ensures we have the full merged profile with all fields preserved
      const updatedDoc = await userRef.get();
      if (updatedDoc.exists) {
        const completeProfile = updatedDoc.data();
        if (completeProfile && typeof completeProfile === 'object') {
          // Convert Firestore timestamps to ISO strings for AsyncStorage
          // Preserve all fields from the complete profile
          const profileForStorage: any = { ...completeProfile };
          
          // Convert Firestore timestamps to Date objects for JSON serialization
          if (profileForStorage.createdAt && profileForStorage.createdAt.toDate) {
            profileForStorage.createdAt = profileForStorage.createdAt.toDate();
          }
          if (profileForStorage.updatedAt && profileForStorage.updatedAt.toDate) {
            profileForStorage.updatedAt = profileForStorage.updatedAt.toDate();
          }
          if (profileForStorage.dateOfBirth && profileForStorage.dateOfBirth.toDate) {
            profileForStorage.dateOfBirth = profileForStorage.dateOfBirth.toDate();
          }
          
          // Ensure all profile fields are preserved (displayName, email, phoneNumber, gender, etc.)
          // The completeProfile from Firestore should already have all fields after merge
          await AsyncStorage.setItem('userProfile', JSON.stringify(profileForStorage));
        }
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error saving user profile:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  };

  getUserProfile = async (): Promise<{ success: boolean; profile?: UserProfile; error?: string }> => {
    try {
      // Get current user from Firebase Auth if not set in service
      let currentUser = this.currentUser;
      if (!currentUser) {
        currentUser = this.auth.currentUser;
        if (currentUser) {
          this.currentUser = currentUser;
        }
      }
      
      if (!currentUser) {
        return { success: false, error: 'No authenticated user' };
      }

      // Always fetch from Firestore first to get the latest data
      const userRef = this.db.collection('users').doc(currentUser.uid);
      const doc = await userRef.get();
      
      if (doc.exists) {
        const firestoreData = doc.data() as any;
        
        // Convert Firestore Timestamps to Date objects
        const profile: any = { ...firestoreData };
        
        if (profile.dateOfBirth && profile.dateOfBirth.toDate) {
          profile.dateOfBirth = profile.dateOfBirth.toDate();
        } else if (profile.dateOfBirth && typeof profile.dateOfBirth === 'string') {
          profile.dateOfBirth = new Date(profile.dateOfBirth);
        }
        
        if (profile.createdAt && profile.createdAt.toDate) {
          profile.createdAt = profile.createdAt.toDate();
        } else if (profile.createdAt && typeof profile.createdAt === 'string') {
          profile.createdAt = new Date(profile.createdAt);
        }
        
        if (profile.updatedAt && profile.updatedAt.toDate) {
          profile.updatedAt = profile.updatedAt.toDate();
        } else if (profile.updatedAt && typeof profile.updatedAt === 'string') {
          profile.updatedAt = new Date(profile.updatedAt);
        }
        
        // Save to AsyncStorage for offline access - convert dates to ISO strings for JSON
        const profileForStorage: any = { ...profile };
        if (profileForStorage.dateOfBirth instanceof Date) {
          profileForStorage.dateOfBirth = profileForStorage.dateOfBirth.toISOString();
        }
        if (profileForStorage.createdAt instanceof Date) {
          profileForStorage.createdAt = profileForStorage.createdAt.toISOString();
        }
        if (profileForStorage.updatedAt instanceof Date) {
          profileForStorage.updatedAt = profileForStorage.updatedAt.toISOString();
        }
        
        await AsyncStorage.setItem('userProfile', JSON.stringify(profileForStorage));
        
        return { success: true, profile: profile as UserProfile };
      } else {
        // If not in Firestore, try AsyncStorage as fallback
        const cachedProfile = await AsyncStorage.getItem('userProfile');
        if (cachedProfile && cachedProfile !== 'null' && cachedProfile !== 'undefined') {
          try {
            const profile = JSON.parse(cachedProfile);
            // Convert date strings back to Date objects
            if (profile && typeof profile === 'object') {
              if (profile.dateOfBirth) {
                profile.dateOfBirth = new Date(profile.dateOfBirth);
              }
              if (profile.createdAt) {
                profile.createdAt = new Date(profile.createdAt);
              }
              if (profile.updatedAt) {
                profile.updatedAt = new Date(profile.updatedAt);
              }
              return { success: true, profile };
            }
          } catch (parseError) {
            console.error('Error parsing cached profile:', parseError);
          }
        }
        
        return { success: false, error: 'Profile not found' };
      }
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      
      // On error, try AsyncStorage as fallback
      try {
        const cachedProfile = await AsyncStorage.getItem('userProfile');
        if (cachedProfile && cachedProfile !== 'null' && cachedProfile !== 'undefined') {
          const profile = JSON.parse(cachedProfile);
          if (profile && typeof profile === 'object') {
            if (profile.dateOfBirth) {
              profile.dateOfBirth = new Date(profile.dateOfBirth);
            }
            if (profile.createdAt) {
              profile.createdAt = new Date(profile.createdAt);
            }
            if (profile.updatedAt) {
              profile.updatedAt = new Date(profile.updatedAt);
            }
            return { success: true, profile };
          }
        }
      } catch (fallbackError) {
        console.error('Error getting cached profile:', fallbackError);
      }
      
      return { success: false, error: error.message };
    }
  };

  checkOnboardingStatus = async (): Promise<{ success: boolean; completed: boolean; error?: string }> => {
    try {
      const result = await this.getUserProfile();
      if (result.success && result.profile) {
        return { success: true, completed: result.profile.onboardingCompleted || false };
      }
      return { success: true, completed: false };
    } catch (error: any) {
      console.error('Error checking onboarding status:', error);
      return { success: false, completed: false, error: error.message };
    }
  };

  // Utility method to clear corrupted AsyncStorage data
  clearCorruptedProfileData = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('userProfile');
      console.log('Cleared corrupted profile data from AsyncStorage');
    } catch (error) {
      console.error('Error clearing corrupted profile data:', error);
    }
  };

  // Firestore methods for news data
  fetchNews = async (filter?: string, limit: number = 50): Promise<{ success: boolean; news?: any[]; error?: string }> => {
    try {
      // Query from 'articles' collection with status 'published'
      let query: any = this.db.collection('articles').where('status', '==', 'published');

      // Apply filter if specified and not 'all'
      // Note: regions is an array field, use array-contains to check if region is in the array
      if (filter && filter !== 'all') {
        query = query.where('regions', 'array-contains', filter.toLowerCase());
      }

      // Try to order by publishedAt or createdAt
      let snapshot;
      try {
        query = query.orderBy('publishedAt', 'desc');
        query = query.limit(limit);
        snapshot = await query.get();
      } catch (publishedAtError) {
        try {
          // Reconstruct query for createdAt fallback
          query = this.db.collection('articles').where('status', '==', 'published');
          if (filter && filter !== 'all') {
            query = query.where('regions', 'array-contains', filter.toLowerCase());
          }
          query = query.orderBy('createdAt', 'desc');
          query = query.limit(limit);
          snapshot = await query.get();
        } catch (createdAtError) {
          // If both fail, just get without ordering
          console.warn('Could not order by publishedAt or createdAt, fetching without order');
          query = this.db.collection('articles').where('status', '==', 'published');
          if (filter && filter !== 'all') {
            query = query.where('regions', 'array-contains', filter.toLowerCase());
          }
          query = query.limit(limit);
          snapshot = await query.get();
        }
      }

      // Map Firestore documents to NewsItem format
      const news = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        // Use regions array if available, otherwise fallback to region string
        const regionsArray = Array.isArray(data.regions) ? data.regions : (data.region ? [data.region] : []);
        return {
          id: doc.id,
          // Map database fields to NewsItem fields
          headline: data.title || '',
          content: data.summary || data.content || '',
          fullContent: data.content || '', // Full HTML content from Firestore
          imageUrl: data.imageUrl || '',
          source: data.source || '',
          newsTags: Array.isArray(data.tags) ? data.tags : (data.category ? [data.category] : []),
          areaTags: regionsArray, // Use regions array directly
          timestamp: data.publishedAt ? this.formatTimestamp(data.publishedAt) : (data.createdAt ? this.formatTimestamp(data.createdAt) : ''),
          author: data.journalistName || data.author || '',
          category: data.category || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          readTime: data.readTime || undefined,
          region: regionsArray.length > 0 ? regionsArray[0] : '', // First region for backward compatibility
          regions: regionsArray, // Store full regions array
          publishedAt: data.publishedAt || null, // Preserve Firestore timestamp
          createdAt: data.createdAt || null, // Preserve Firestore timestamp
          youtubeVideoUrl: data.youtubeVideoUrl || undefined, // YouTube video URL
        };
      });

      // Always sort by most recent first (publishedAt or createdAt)
      news.sort((a: any, b: any) => {
        const aTime = a.publishedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
        const bTime = b.publishedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
        return bTime - aTime; // Descending order (newest first)
      });

      return { success: true, news };
    } catch (error: any) {
      console.error('Error fetching news:', error);
      // If the error is about missing index, try a simpler query
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        try {
          // Simplest query - just get published articles
          const simpleQuery = this.db.collection('articles')
            .where('status', '==', 'published')
            .limit(limit);
          const snapshot = await simpleQuery.get();
          
          let news = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            // Use regions array if available, otherwise fallback to region string
            const regionsArray = Array.isArray(data.regions) ? data.regions : (data.region ? [data.region] : []);
            return {
              id: doc.id,
              headline: data.title || '',
              content: data.summary || data.content || '',
              fullContent: data.content || '', // Full HTML content from Firestore
              imageUrl: data.imageUrl || '',
              source: data.source || '',
              newsTags: Array.isArray(data.tags) ? data.tags : (data.category ? [data.category] : []),
              areaTags: regionsArray, // Use regions array directly
              timestamp: data.publishedAt ? this.formatTimestamp(data.publishedAt) : (data.createdAt ? this.formatTimestamp(data.createdAt) : ''),
              author: data.journalistName || data.author || '',
              category: data.category || '',
              tags: Array.isArray(data.tags) ? data.tags : [],
              readTime: data.readTime || undefined,
              region: regionsArray.length > 0 ? regionsArray[0] : '', // First region for backward compatibility
              regions: regionsArray, // Store full regions array
              publishedAt: data.publishedAt || null, // Preserve Firestore timestamp
              createdAt: data.createdAt || null, // Preserve Firestore timestamp
            };
          });

          // Filter in memory if needed (check if selected filter is in regions array)
          if (filter && filter !== 'all') {
            const filterLower = filter.toLowerCase();
            news = news.filter((item: any) => {
              // Check if regions array contains the filter (case-insensitive)
              if (item.regions && Array.isArray(item.regions)) {
                return item.regions.some((r: string) => r.toLowerCase() === filterLower);
              }
              // Fallback to areaTags for backward compatibility
              if (item.areaTags && Array.isArray(item.areaTags)) {
                return item.areaTags.some((tag: string) => tag.toLowerCase() === filterLower);
              }
              return false;
            });
          }

          // Sort by publishedAt or createdAt in memory (most recent first)
          news.sort((a: any, b: any) => {
            const aTime = a.publishedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
            const bTime = b.publishedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
            return bTime - aTime; // Descending order (newest first)
          });

          return { success: true, news };
        } catch (fallbackError: any) {
          console.error('Fallback query also failed:', fallbackError);
          return { success: false, error: fallbackError.message };
        }
      }
      return { success: false, error: error.message };
    }
  };

  // Fetch a single article by ID
  fetchArticleById = async (articleId: string): Promise<{ success: boolean; article?: any; error?: string }> => {
    try {
      const articleRef = this.db.collection('articles').doc(articleId);
      const articleDoc = await articleRef.get();
      
      if (!articleDoc.exists) {
        return { success: false, error: 'Article not found' };
      }
      
      const data = articleDoc.data();
      // Use regions array if available, otherwise fallback to region string
      const regionsArray = Array.isArray(data?.regions) ? data.regions : (data?.region ? [data.region] : []);
      
      const article = {
        id: articleDoc.id,
        headline: data?.title || '',
        content: data?.summary || data?.content || '',
        fullContent: data?.content || '',
        imageUrl: data?.imageUrl || '',
        source: data?.source || '',
        newsTags: Array.isArray(data?.tags) ? data.tags : (data?.category ? [data.category] : []),
        areaTags: regionsArray,
        timestamp: data?.publishedAt ? this.formatTimestamp(data.publishedAt) : (data?.createdAt ? this.formatTimestamp(data.createdAt) : ''),
        author: data?.journalistName || data?.author || '',
        category: data?.category || '',
        tags: Array.isArray(data?.tags) ? data.tags : [],
        readTime: data?.readTime || undefined,
        region: regionsArray.length > 0 ? regionsArray[0] : '',
        regions: regionsArray,
        publishedAt: data?.publishedAt || null,
        createdAt: data?.createdAt || null,
      };
      
      return { success: true, article };
    } catch (error: any) {
      console.error('Error fetching article by ID:', error);
      return { success: false, error: error.message };
    }
  };

  // Helper method to format Firestore timestamps
  private formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return '';
    if (timestamp.toDate) {
      const date = timestamp.toDate();
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
    if (typeof timestamp === 'string') return timestamp;
    return '';
  };

  // Firestore methods for region/filter options
  fetchRegionFilters = async (): Promise<{ success: boolean; filters?: string[]; error?: string }> => {
    try {
      // Start with simplest query - no where/orderBy combinations to avoid index requirements
      const snapshot = await this.db.collection('regions').get();
      
      // Process all documents
      const filtersWithData = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          name: data.name || data.value || doc.id,
          active: data.active !== false, // Default to true if not specified
          priority: data.priority !== undefined ? data.priority : 999, // Use priority field, default to 999 if not present
          createdAt: data.createdAt?.toMillis?.() || 0,
        };
      });

      // Filter out inactive regions and empty names
      const validFilters = filtersWithData
        .filter((f: any) => f.name && f.name.trim() !== '' && f.active);

      // Sort by priority (ascending - lower priority numbers first), then by createdAt
      validFilters.sort((a: any, b: any) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority; // Lower priority numbers come first
        }
        return a.createdAt - b.createdAt;
      });

      const filters = validFilters.map((item: any) => item.name);

      // Always include 'all' as the first option
      return { success: true, filters: ['all', ...filters] };
    } catch (error: any) {
      console.error('Error fetching region filters:', error);
      // Return default filters on error
      return { success: false, error: error.message, filters: ['all', 'north eastern', 'nagaland', 'india'] };
    }
  };

  // Firestore methods for tags
  fetchTags = async (): Promise<{ success: boolean; tags?: string[]; error?: string }> => {
    try {
      // Fetch all tags from the tags collection
      const snapshot = await this.db.collection('tags').get();
      
      // Process all documents
      const tagsWithData = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          name: data.name || doc.id,
          createdAt: data.createdAt?.toMillis?.() || 0,
        };
      });

      // Filter out empty names
      const validTags = tagsWithData
        .filter((t: any) => t.name && t.name.trim() !== '');

      // Sort by createdAt (oldest first for consistency)
      validTags.sort((a: any, b: any) => {
        return a.createdAt - b.createdAt;
      });

      const tags = validTags.map((item: any) => item.name);

      return { success: true, tags };
    } catch (error: any) {
      console.error('Error fetching tags:', error);
      return { success: false, error: error.message };
    }
  };

  // Firestore methods for ads data
  fetchAds = async (limit: number = 20): Promise<{ success: boolean; ads?: any[]; error?: string }> => {
    try {
      // Query ads with status 'published'
      const snapshot = await this.db.collection('ads')
        .where('status', '==', 'published')
        .limit(limit * 2)
        .get();

      // Process all documents
      let ads = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          imageUrl: data.imageUrl || '',
          redirectLink: data.redirectLink || '',
          title: data.title || '',
          ...data,
        };
      });

      // Sort by createdAt in memory (descending - newest first)
      ads.sort((a: any, b: any) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      // Limit to requested number
      ads = ads.slice(0, limit);

      return { success: true, ads };
    } catch (error: any) {
      console.error('Error fetching ads:', error);
      return { success: false, error: error.message };
    }
  };

  // Increment ad view count
  incrementAdViewCount = async (adId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const adRef = this.db.collection('ads').doc(adId);
      
      await this.db.runTransaction(async (transaction: any) => {
        const adDoc = await transaction.get(adRef);
        
        if (!adDoc.exists) {
          throw new Error('Ad not found');
        }
        
        const currentCount = adDoc.data().views || 0;
        transaction.update(adRef, {
          views: currentCount + 1,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error incrementing ad view count:', error);
      return { success: false, error: error.message };
    }
  };

  // Increment ad click count
  incrementAdClickCount = async (adId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const adRef = this.db.collection('ads').doc(adId);
      
      await this.db.runTransaction(async (transaction: any) => {
        const adDoc = await transaction.get(adRef);
        
        if (!adDoc.exists) {
          throw new Error('Ad not found');
        }
        
        const currentCount = adDoc.data().clicks || 0;
        transaction.update(adRef, {
          clicks: currentCount + 1,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error incrementing ad click count:', error);
      return { success: false, error: error.message };
    }
  };

  // Increment article bookmark count
  incrementArticleBookmarkCount = async (articleId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const articleRef = this.db.collection('articles').doc(articleId);
      
      // Use Firestore transaction to safely increment
      await this.db.runTransaction(async (transaction: any) => {
        const articleDoc = await transaction.get(articleRef);
        
        if (!articleDoc.exists) {
          throw new Error('Article not found');
        }
        
        const currentCount = articleDoc.data().bookmarkCount || 0;
        transaction.update(articleRef, {
          bookmarkCount: currentCount + 1,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error incrementing bookmark count:', error);
      // Don't throw - bookmark should still work even if count update fails
      return { success: false, error: error.message };
    }
  };

  // Decrement article bookmark count
  decrementArticleBookmarkCount = async (articleId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const articleRef = this.db.collection('articles').doc(articleId);
      
      // Use Firestore transaction to safely decrement
      await this.db.runTransaction(async (transaction: any) => {
        const articleDoc = await transaction.get(articleRef);
        
        if (!articleDoc.exists) {
          throw new Error('Article not found');
        }
        
        const currentCount = articleDoc.data().bookmarkCount || 0;
        const newCount = Math.max(0, currentCount - 1); // Don't go below 0
        
        transaction.update(articleRef, {
          bookmarkCount: newCount,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error decrementing bookmark count:', error);
      // Don't throw - bookmark should still work even if count update fails
      return { success: false, error: error.message };
    }
  };

  // Get article bookmark count
  getArticleBookmarkCount = async (articleId: string): Promise<number> => {
    try {
      const articleRef = this.db.collection('articles').doc(articleId);
      const articleDoc = await articleRef.get();
      
      if (articleDoc.exists) {
        const data = articleDoc.data();
        return data?.bookmarkCount || 0;
      }
      return 0;
    } catch (error: any) {
      console.error('Error getting bookmark count:', error);
      return 0;
    }
  };

  // Increment article like count
  incrementArticleLikeCount = async (articleId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const articleRef = this.db.collection('articles').doc(articleId);
      
      await this.db.runTransaction(async (transaction: any) => {
        const articleDoc = await transaction.get(articleRef);
        
        if (!articleDoc.exists) {
          throw new Error('Article not found');
        }
        
        const currentCount = articleDoc.data().likes || 0;
        transaction.update(articleRef, {
          likes: currentCount + 1,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error incrementing like count:', error);
      return { success: false, error: error.message };
    }
  };

  // Increment article dislike count
  incrementArticleDislikeCount = async (articleId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const articleRef = this.db.collection('articles').doc(articleId);
      
      await this.db.runTransaction(async (transaction: any) => {
        const articleDoc = await transaction.get(articleRef);
        
        if (!articleDoc.exists) {
          throw new Error('Article not found');
        }
        
        const currentCount = articleDoc.data().dislikes || 0;
        transaction.update(articleRef, {
          dislikes: currentCount + 1,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error incrementing dislike count:', error);
      return { success: false, error: error.message };
    }
  };

  // Decrement article like count
  decrementArticleLikeCount = async (articleId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const articleRef = this.db.collection('articles').doc(articleId);
      
      await this.db.runTransaction(async (transaction: any) => {
        const articleDoc = await transaction.get(articleRef);
        
        if (!articleDoc.exists) {
          throw new Error('Article not found');
        }
        
        const currentCount = articleDoc.data().likes || 0;
        const newCount = Math.max(0, currentCount - 1); // Don't go below 0
        transaction.update(articleRef, {
          likes: newCount,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error decrementing like count:', error);
      return { success: false, error: error.message };
    }
  };

  // Decrement article dislike count
  decrementArticleDislikeCount = async (articleId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const articleRef = this.db.collection('articles').doc(articleId);
      
      await this.db.runTransaction(async (transaction: any) => {
        const articleDoc = await transaction.get(articleRef);
        
        if (!articleDoc.exists) {
          throw new Error('Article not found');
        }
        
        const currentCount = articleDoc.data().dislikes || 0;
        const newCount = Math.max(0, currentCount - 1); // Don't go below 0
        transaction.update(articleRef, {
          dislikes: newCount,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error decrementing dislike count:', error);
      return { success: false, error: error.message };
    }
  };

  // Increment article view count
  incrementArticleViewCount = async (articleId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const articleRef = this.db.collection('articles').doc(articleId);
      
      // Use atomic increment instead of transaction - simpler and doesn't require indexes
      await articleRef.update({
        views: firestore.FieldValue.increment(1),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      
      return { success: true };
    } catch (error: any) {
      // Silently fail for view count - it's not critical
      console.error('Error incrementing view count:', error);
      return { success: false, error: error.message };
    }
  };
}

export const firebaseService = new FirebaseService();
