/**
 * News Service
 * Handles fetching news data with pagination support
 */

import { NewsItem, NewsResponse } from '../types';

// Mock news data for demonstration
const MOCK_NEWS_DATA: NewsItem[] = [
  {
    id: '1',
    headline: 'Revolutionary AI Breakthrough Changes Everything',
    content: 'Scientists have made a groundbreaking discovery in artificial intelligence that could revolutionize how we interact with technology. The new system demonstrates unprecedented capabilities in natural language processing and problem-solving.',
    imageUrl: 'https://picsum.photos/400/200?random=1',
    source: 'Tech Today',
    newsTags: ['Technology', 'AI', 'Innovation'],
    areaTags: ['Global', 'Science'],
    timestamp: '2 hours ago',
    author: 'Sarah Johnson'
  },
  {
    id: '2',
    headline: 'Climate Summit Reaches Historic Agreement',
    content: 'World leaders have reached a historic agreement at the latest climate summit, committing to ambitious new targets for carbon reduction. The deal represents a major step forward in global climate action.',
    imageUrl: 'https://picsum.photos/400/200?random=2',
    source: 'Global News',
    newsTags: ['Environment', 'Politics', 'Climate'],
    areaTags: ['International', 'Policy'],
    timestamp: '4 hours ago',
    author: 'Michael Chen'
  },
  {
    id: '3',
    headline: 'Space Mission Discovers New Exoplanet',
    content: 'NASA\'s latest space mission has discovered a potentially habitable exoplanet located in a nearby star system. The planet shows promising signs of having liquid water and a stable atmosphere.',
    imageUrl: 'https://picsum.photos/400/200?random=3',
    source: 'Space Weekly',
    newsTags: ['Space', 'Science', 'Discovery'],
    areaTags: ['Space', 'Research'],
    timestamp: '6 hours ago',
    author: 'Dr. Emily Rodriguez'
  },
  {
    id: '4',
    headline: 'Economic Markets Show Strong Recovery',
    content: 'Global financial markets have shown remarkable resilience and recovery following recent economic challenges. Analysts are optimistic about continued growth in key sectors.',
    imageUrl: 'https://picsum.photos/400/200?random=4',
    source: 'Financial Times',
    newsTags: ['Economy', 'Finance', 'Markets'],
    areaTags: ['Global', 'Business'],
    timestamp: '8 hours ago',
    author: 'James Wilson'
  },
  {
    id: '5',
    headline: 'Medical Breakthrough Offers Hope for Rare Disease',
    content: 'Researchers have developed a new treatment approach that shows promising results for patients with a previously untreatable rare genetic disorder. Early clinical trials are showing remarkable success rates.',
    imageUrl: 'https://picsum.photos/400/200?random=5',
    source: 'Medical Journal',
    newsTags: ['Health', 'Medicine', 'Research'],
    areaTags: ['Healthcare', 'Science'],
    timestamp: '10 hours ago',
    author: 'Dr. Lisa Park'
  },
  {
    id: '6',
    headline: 'Renewable Energy Reaches New Milestone',
    content: 'Renewable energy sources have reached a historic milestone, now providing over 50% of electricity generation in several major countries. This achievement marks a significant shift toward sustainable energy.',
    imageUrl: 'https://picsum.photos/400/200?random=6',
    source: 'Energy Today',
    newsTags: ['Energy', 'Environment', 'Sustainability'],
    areaTags: ['Global', 'Technology'],
    timestamp: '12 hours ago',
    author: 'Alex Thompson'
  },
  {
    id: '7',
    headline: 'Cultural Festival Celebrates Diversity',
    content: 'The annual cultural festival has brought together communities from around the world to celebrate diversity and shared humanity. The event featured music, art, and cuisine from dozens of countries.',
    imageUrl: 'https://picsum.photos/400/200?random=7',
    source: 'Culture Weekly',
    newsTags: ['Culture', 'Community', 'Arts'],
    areaTags: ['Local', 'Events'],
    timestamp: '14 hours ago',
    author: 'Maria Santos'
  },
  {
    id: '8',
    headline: 'Sports Team Achieves Historic Victory',
    content: 'In a stunning upset, the underdog team has achieved a historic victory against the defending champions. The game will be remembered as one of the greatest moments in sports history.',
    imageUrl: 'https://picsum.photos/400/200?random=8',
    source: 'Sports Central',
    newsTags: ['Sports', 'Victory', 'Achievement'],
    areaTags: ['Sports', 'Entertainment'],
    timestamp: '16 hours ago',
    author: 'Tom Anderson'
  },
  {
    id: '9',
    headline: 'Educational Technology Transforms Learning',
    content: 'New educational technology platforms are revolutionizing how students learn and teachers teach. The innovative tools are showing significant improvements in student engagement and learning outcomes.',
    imageUrl: 'https://picsum.photos/400/200?random=9',
    source: 'Education Today',
    newsTags: ['Education', 'Technology', 'Innovation'],
    areaTags: ['Education', 'Technology'],
    timestamp: '18 hours ago',
    author: 'Dr. Robert Kim'
  },
  {
    id: '10',
    headline: 'Urban Planning Initiative Improves City Life',
    content: 'A comprehensive urban planning initiative has transformed city infrastructure, improving quality of life for residents. The project includes new parks, efficient transportation, and sustainable housing solutions.',
    imageUrl: 'https://picsum.photos/400/200?random=10',
    source: 'City News',
    newsTags: ['Urban Planning', 'Infrastructure', 'Community'],
    areaTags: ['Local', 'Development'],
    timestamp: '20 hours ago',
    author: 'Jennifer Lee'
  }
];

// Generate more mock data by duplicating and modifying existing data
const generateMoreNews = (startId: number, count: number): NewsItem[] => {
  return Array.from({ length: count }, (_, index) => {
    const baseItem = MOCK_NEWS_DATA[index % MOCK_NEWS_DATA.length];
    return {
      ...baseItem,
      id: (startId + index).toString(),
      imageUrl: `https://picsum.photos/400/200?random=${startId + index}`,
      timestamp: `${(startId + index) * 2} hours ago`,
    };
  });
};

class NewsService {
  private static instance: NewsService;
  private allNews: NewsItem[] = [];
  private currentPage = 1;
  private readonly pageSize = 10;

  private constructor() {
    // Initialize with mock data
    this.allNews = [...MOCK_NEWS_DATA];
  }

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  /**
   * Fetch news articles with pagination
   */
  async fetchNews(page: number = 1, pageSize: number = this.pageSize): Promise<NewsResponse> {
    try {
      // Simulate API delay
      await new Promise<void>(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Generate more data if needed
      if (page > 1) {
        const startId = this.allNews.length + 1;
        const newArticles = generateMoreNews(startId, pageSize);
        this.allNews.push(...newArticles);
      }

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const articles = this.allNews.slice(startIndex, endIndex);

      // Simulate reaching end of data after 50 pages
      const hasMore = page < 50;

      return {
        articles,
        hasMore,
        nextPage: hasMore ? page + 1 : undefined,
      };
    } catch (error) {
      console.error('Error fetching news:', error);
      throw new Error('Failed to fetch news articles');
    }
  }

  /**
   * Search news articles
   */
  async searchNews(query: string, page: number = 1, pageSize: number = this.pageSize): Promise<NewsResponse> {
    try {
      // Simulate API delay
      await new Promise<void>(resolve => setTimeout(resolve, 800));

      const filteredNews = this.allNews.filter(article =>
        article.headline.toLowerCase().includes(query.toLowerCase()) ||
        article.content.toLowerCase().includes(query.toLowerCase()) ||
        article.newsTags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const articles = filteredNews.slice(startIndex, endIndex);

      const hasMore = endIndex < filteredNews.length;

      return {
        articles,
        hasMore,
        nextPage: hasMore ? page + 1 : undefined,
      };
    } catch (error) {
      console.error('Error searching news:', error);
      throw new Error('Failed to search news articles');
    }
  }

  /**
   * Get news by category/tag
   */
  async getNewsByCategory(category: string, page: number = 1, pageSize: number = this.pageSize): Promise<NewsResponse> {
    try {
      // Simulate API delay
      await new Promise<void>(resolve => setTimeout(resolve, 800));

      const filteredNews = this.allNews.filter(article =>
        article.newsTags.some(tag => tag.toLowerCase().includes(category.toLowerCase())) ||
        article.areaTags.some(tag => tag.toLowerCase().includes(category.toLowerCase()))
      );

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const articles = filteredNews.slice(startIndex, endIndex);

      const hasMore = endIndex < filteredNews.length;

      return {
        articles,
        hasMore,
        nextPage: hasMore ? page + 1 : undefined,
      };
    } catch (error) {
      console.error('Error fetching news by category:', error);
      throw new Error('Failed to fetch news by category');
    }
  }

  /**
   * Get trending news (most recent)
   */
  async getTrendingNews(page: number = 1, pageSize: number = this.pageSize): Promise<NewsResponse> {
    try {
      // Simulate API delay
      await new Promise<void>(resolve => setTimeout(resolve, 600));

      // Sort by timestamp (most recent first)
      const sortedNews = [...this.allNews].sort((a, b) => {
        const aTime = parseInt(a.timestamp.split(' ')[0]);
        const bTime = parseInt(b.timestamp.split(' ')[0]);
        return aTime - bTime;
      });

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const articles = sortedNews.slice(startIndex, endIndex);

      const hasMore = endIndex < sortedNews.length;

      return {
        articles,
        hasMore,
        nextPage: hasMore ? page + 1 : undefined,
      };
    } catch (error) {
      console.error('Error fetching trending news:', error);
      throw new Error('Failed to fetch trending news');
    }
  }

  /**
   * Refresh news data
   */
  async refreshNews(): Promise<NewsResponse> {
    try {
      // Reset to first page
      this.currentPage = 1;
      
      // Simulate API delay
      await new Promise<void>(resolve => setTimeout(resolve, 1200));

      // Return fresh data from the beginning
      const articles = this.allNews.slice(0, this.pageSize);
      
      return {
        articles,
        hasMore: this.allNews.length > this.pageSize,
        nextPage: this.allNews.length > this.pageSize ? 2 : undefined,
      };
    } catch (error) {
      console.error('Error refreshing news:', error);
      throw new Error('Failed to refresh news');
    }
  }
}

export const newsService = NewsService.getInstance();
