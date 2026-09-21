import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseService } from './firebaseService';
import firestore from '@react-native-firebase/firestore';

export interface BookmarkItem {
  id: string;
  headline: string;
  content: string;
  imageUrl: string;
  source: string;
  timestamp: string;
  author: string;
  bookmarkedAt?: string; // When the article was bookmarked (optional for backward compatibility)
}

const STORAGE_KEY = 'bookmarks';

// Fallback: Get bookmarks from AsyncStorage (for offline/guest users)
async function getBookmarksFromStorage(): Promise<BookmarkItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Fallback: Save bookmarks to AsyncStorage (for offline/guest users)
async function setBookmarksToStorage(items: BookmarkItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// Get bookmarks from Firebase (for authenticated users)
async function getBookmarksFromFirebase(): Promise<BookmarkItem[]> {
  try {
    const currentUser = firebaseService.getCurrentUser();
    if (!currentUser) {
      return await getBookmarksFromStorage(); // Fallback to AsyncStorage
    }

    const db = firestore();
    const bookmarksRef = db.collection('users').doc(currentUser.uid).collection('bookmarks');
    const snapshot = await bookmarksRef.orderBy('bookmarkedAt', 'desc').get();

    const bookmarks: BookmarkItem[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      bookmarks.push({
        id: doc.id, // Use article ID as the bookmark ID
        headline: data.headline || '',
        content: data.content || '',
        imageUrl: data.imageUrl || '',
        source: data.source || '',
        timestamp: data.timestamp || '',
        author: data.author || '',
        bookmarkedAt: data.bookmarkedAt?.toDate?.()?.toISOString() || data.bookmarkedAt || new Date().toISOString(),
      });
    });

    // Sync to AsyncStorage for offline access
    await setBookmarksToStorage(bookmarks);
    return bookmarks;
  } catch (error) {
    console.error('Error fetching bookmarks from Firebase:', error);
    // Fallback to AsyncStorage on error
    return await getBookmarksFromStorage();
  }
}

// Save bookmark to Firebase
async function saveBookmarkToFirebase(item: BookmarkItem): Promise<void> {
  try {
    const currentUser = firebaseService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const db = firestore();
    const bookmarkRef = db.collection('users').doc(currentUser.uid).collection('bookmarks').doc(item.id);
    
    const bookmarkData = {
      ...item,
      bookmarkedAt: firestore.FieldValue.serverTimestamp(),
    };

    await bookmarkRef.set(bookmarkData, { merge: true });
    
    // Also update AsyncStorage for offline access
    const current = await getBookmarksFromStorage();
    if (!current.some(b => b.id === item.id)) {
      await setBookmarksToStorage([{ ...item, bookmarkedAt: new Date().toISOString() }, ...current]);
    }
  } catch (error) {
    console.error('Error saving bookmark to Firebase:', error);
    throw error;
  }
}

// Remove bookmark from Firebase
async function removeBookmarkFromFirebase(articleId: string): Promise<void> {
  try {
    const currentUser = firebaseService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const db = firestore();
    const bookmarkRef = db.collection('users').doc(currentUser.uid).collection('bookmarks').doc(articleId);
    await bookmarkRef.delete();
    
    // Also update AsyncStorage
    const current = await getBookmarksFromStorage();
    await setBookmarksToStorage(current.filter(b => b.id !== articleId));
  } catch (error) {
    console.error('Error removing bookmark from Firebase:', error);
    throw error;
  }
}

// Get bookmarks (from Firebase if authenticated, otherwise from AsyncStorage)
export async function getBookmarks(): Promise<BookmarkItem[]> {
  const currentUser = firebaseService.getCurrentUser();
  if (currentUser) {
    return await getBookmarksFromFirebase();
  } else {
    return await getBookmarksFromStorage();
  }
}

export async function toggleBookmark(item: BookmarkItem): Promise<boolean> {
  const currentUser = firebaseService.getCurrentUser();
  
  // Fast check: Try to get from AsyncStorage first (synchronous read if possible)
  // This is much faster than loading all bookmarks
  let current: BookmarkItem[];
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      current = Array.isArray(parsed) ? parsed : [];
    } else {
      current = [];
    }
  } catch {
    current = [];
  }
  
  const exists = current.some(b => b.id === item.id);
  const newState = !exists;
  
  // Update AsyncStorage immediately for instant UI update (optimistic update)
  let next: BookmarkItem[];
  if (exists) {
    next = current.filter(b => b.id !== item.id);
  } else {
    const bookmarkedItem = {
      ...item,
      bookmarkedAt: new Date().toISOString()
    };
    next = [bookmarkedItem, ...current];
  }
  
  // Don't await - fire and forget for instant response
  setBookmarksToStorage(next).catch(err => console.error('Error saving bookmark:', err));
  
  // Sync with Firebase in the background (fire and forget)
  if (currentUser) {
    // Use setTimeout to make this non-blocking
    Promise.resolve().then(async () => {
      try {
        if (exists) {
          // Remove bookmark from Firebase
          await removeBookmarkFromFirebase(item.id);
          // Update article bookmark count (decrement)
          await firebaseService.decrementArticleBookmarkCount(item.id);
        } else {
          // Add bookmark to Firebase
          await saveBookmarkToFirebase(item);
          // Update article bookmark count (increment)
          await firebaseService.incrementArticleBookmarkCount(item.id);
        }
      } catch (error) {
        console.error('Error syncing bookmark to Firebase:', error);
        // On error, sync back from Firebase to AsyncStorage
        try {
          const firebaseBookmarks = await getBookmarksFromFirebase();
          await setBookmarksToStorage(firebaseBookmarks);
        } catch (syncError) {
          console.error('Error syncing back from Firebase:', syncError);
        }
      }
    });
  }
  
  // Return immediately with new state
  return newState;
}

export async function isBookmarked(id: string): Promise<boolean> {
  const current = await getBookmarks();
  return current.some(b => b.id === id);
}

export async function removeBookmark(id: string): Promise<void> {
  const currentUser = firebaseService.getCurrentUser();
  
  try {
    if (currentUser) {
      await removeBookmarkFromFirebase(id);
      await firebaseService.decrementArticleBookmarkCount(id);
    } else {
      const current = await getBookmarksFromStorage();
      await setBookmarksToStorage(current.filter(b => b.id !== id));
    }
  } catch (error) {
    console.error('Error removing bookmark:', error);
    // Fallback
    const current = await getBookmarksFromStorage();
    await setBookmarksToStorage(current.filter(b => b.id !== id));
  }
}

export async function getBookmarkedIds(): Promise<Set<string>> {
  const current = await getBookmarks();
  return new Set(current.map(b => b.id));
}



