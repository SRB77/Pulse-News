/**
 * Type definitions for the Pulse app
 */

export interface NewsItem {
  id: string;
  headline: string;
  content: string;
  fullContent?: string; // Full HTML content from Firestore
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
}

export interface NewsResponse {
  articles: NewsItem[];
  hasMore: boolean;
  nextPage?: number;
}

export interface BookmarkItem {
  id: string;
  headline: string;
  content: string;
  imageUrl: string;
  source: string;
  timestamp: string;
  author: string;
  bookmarkedAt?: string;
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

export interface SignInResult {
  success: boolean;
  user?: any;
  error?: string;
}

export interface AdItem {
  id: string;
  imageUrl: string;
  active?: boolean;
  createdAt?: any;
  updatedAt?: any;
}


