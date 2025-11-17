// client/services/marketaux-service.ts
// Marketaux API Service for Financial News

const MARKETAUX_API_BASE = 'https://api.marketaux.com/v1';
const MARKETAUX_API_TOKEN = import.meta.env.VITE_MARKETAUX_API_TOKEN || '';

// Cache configuration
const CACHE_KEY = 'marketaux_news_cache';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

export interface MarketauxArticle {
    uuid: string;
    title: string;
    description: string;
    snippet: string;
    url: string;
    image_url: string;
    language: string;
    published_at: string;
    source: string;
    entities?: Array<{
        symbol: string;
        name: string;
        sentiment_score: number;
        industry?: string;
    }>;
}

export interface MarketauxResponse {
    meta: {
        found: number;
        returned: number;
        limit: number;
        page: number;
    };
    data: MarketauxArticle[];
}

interface CachedNews {
    articles: MarketauxArticle[];
    timestamp: number;
    searchKey: string;
}

/**
 * Get cached news from localStorage
 */
function getCachedNews(searchKey: string): MarketauxArticle[] | null {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const { articles, timestamp, searchKey: cachedKey }: CachedNews = JSON.parse(cached);

        // Check if cache is still valid (within CACHE_DURATION)
        const now = Date.now();
        const isExpired = now - timestamp > CACHE_DURATION;

        // Check if search key matches
        const isMatchingSearch = cachedKey === searchKey;

        if (isExpired || !isMatchingSearch) {
            // Cache expired or different search - remove it
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        console.log('✅ Using cached news articles (age:', Math.floor((now - timestamp) / 60000), 'minutes)');
        return articles;
    } catch (error) {
        console.error('Error reading news cache:', error);
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
}

/**
 * Save news to cache in localStorage
 */
function setCachedNews(articles: MarketauxArticle[], searchKey: string): void {
    try {
        const cacheData: CachedNews = {
            articles,
            timestamp: Date.now(),
            searchKey,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        console.log('💾 News articles cached successfully');
    } catch (error) {
        console.error('Error saving news to cache:', error);
        // If localStorage is full, try to clear old cache
        try {
            localStorage.removeItem(CACHE_KEY);
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                articles,
                timestamp: Date.now(),
                searchKey,
            }));
        } catch (retryError) {
            console.error('Failed to cache news even after cleanup:', retryError);
        }
    }
}

/**
 * Clear news cache manually
 */
export function clearNewsCache(): void {
    localStorage.removeItem(CACHE_KEY);
    console.log('🗑️ News cache cleared');
}

/**
 * Get cache age in minutes
 */
export function getCacheAge(): number | null {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const { timestamp }: CachedNews = JSON.parse(cached);
        return Math.floor((Date.now() - timestamp) / 60000);
    } catch {
        return null;
    }
}

/**
 * Fetch financial news from Marketaux API
 * Free tier: 100 requests per month
 * 
 * @param options - Query parameters
 * @returns Promise with news articles
 */
export const fetchFinancialNews = async (options: {
    search?: string;
    language?: string;
    limit?: number;
    countries?: string;
    published_after?: string;
    useCache?: boolean; // New option to enable/disable cache
} = {}): Promise<MarketauxArticle[]> => {
    try {
        // Generate a unique cache key based on search parameters
        const searchKey = `${options.search || 'default'}_${options.language || 'en'}_${options.limit || 10}`;

        // Check cache first (unless explicitly disabled)
        const useCache = options.useCache !== false; // Default to true
        if (useCache) {
            const cachedArticles = getCachedNews(searchKey);
            if (cachedArticles) {
                return cachedArticles;
            }
        }

        // Check if API token is available
        if (!MARKETAUX_API_TOKEN) {
            console.warn('Marketaux API token not configured. Using fallback data.');
            return getFallbackNews();
        }

        console.log('🌐 Fetching fresh news from Marketaux API...');

        // Build query parameters
        const params = new URLSearchParams({
            api_token: MARKETAUX_API_TOKEN,
            language: options.language || 'en',
            limit: String(options.limit || 10),
            // Search for personal finance related topics
            search: options.search || 'personal finance OR budgeting OR savings OR investment tips',
            // Focus on US financial news
            countries: options.countries || 'us',
            // Group similar articles to avoid duplicates
            group_similar: 'true',
        });

        // Add published_after if provided (format: YYYY-MM-DD)
        if (options.published_after) {
            params.append('published_after', options.published_after);
        }

        const url = `${MARKETAUX_API_BASE}/news/all?${params.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        }).catch((fetchError) => {
            // Handle network errors (CORS, etc.)
            console.warn('⚠️ Network error accessing Marketaux API:', fetchError.message);
            throw new Error('CORS or network error');
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Marketaux API error:', errorData);

            // If rate limit reached or error, use fallback
            if (response.status === 429 || response.status === 402) {
                console.warn('⚠️ API limit reached. Using fallback news.');
                return getFallbackNews();
            }

            throw new Error(`Marketaux API error: ${response.status}`);
        }

        const data: MarketauxResponse = await response.json();

        // Cache the results if we have data
        if (data.data && data.data.length > 0) {
            if (useCache) {
                setCachedNews(data.data, searchKey);
            }
            return data.data;
        }

        // Return fallback if no data
        return getFallbackNews();

    } catch (error) {
        console.error('Error fetching financial news:', error);
        // Return fallback news on error
        return getFallbackNews();
    }
};

/**
 * Fetch trending financial topics
 * Uses specific finance-related search terms
 * Cached by default to reduce API calls
 */
export const fetchTrendingFinanceNews = async (limit: number = 5, useCache: boolean = true): Promise<MarketauxArticle[]> => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return fetchFinancialNews({
        search: 'money management OR financial planning OR budget tips OR saving strategies',
        limit,
        language: 'en',
        published_after: sevenDaysAgo.toISOString().split('T')[0], // YYYY-MM-DD format
        countries: 'us',
        useCache, // Pass cache preference
    });
};

/**
 * Fetch investment and market news
 * Useful for users interested in investment insights
 * Cached by default to reduce API calls
 */
export const fetchInvestmentNews = async (limit: number = 5, useCache: boolean = true): Promise<MarketauxArticle[]> => {
    return fetchFinancialNews({
        search: 'investment tips OR stock market insights OR portfolio management OR retirement planning',
        limit,
        language: 'en',
        countries: 'us',
        useCache, // Pass cache preference
    });
};

/**
 * Fallback news data when API is unavailable or limit is reached
 * These are curated financial education articles
 */
function getFallbackNews(): MarketauxArticle[] {
    return [
        {
            uuid: 'fallback-1',
            title: '10 Essential Budgeting Tips for 2025',
            description: 'Master your finances with these proven budgeting strategies that work for everyone.',
            snippet: 'Learn how to create a sustainable budget that actually works. From tracking expenses to setting realistic goals...',
            url: 'https://www.investopedia.com/budgeting-basics-1289589',
            image_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
            language: 'en',
            published_at: new Date(Date.now() - 86400000).toISOString(),
            source: 'Financial Education',
        },
        {
            uuid: 'fallback-2',
            title: 'Understanding the 50/30/20 Budget Rule',
            description: 'A comprehensive guide to the popular budgeting method that simplifies money management.',
            snippet: 'The 50/30/20 rule is a simple budgeting framework that allocates 50% to needs, 30% to wants, and 20% to savings...',
            url: 'https://www.nerdwallet.com/article/finance/nerdwallet-budget-calculator',
            image_url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
            language: 'en',
            published_at: new Date(Date.now() - 172800000).toISOString(),
            source: 'Personal Finance Guide',
        },
        {
            uuid: 'fallback-3',
            title: 'Smart Strategies to Build Your Emergency Fund',
            description: 'Expert advice on creating a financial safety net for unexpected expenses.',
            snippet: 'Financial experts recommend saving 3-6 months of expenses. Here\'s how to start and maintain your emergency fund...',
            url: 'https://www.bankrate.com/banking/savings/emergency-savings-account/',
            image_url: 'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?w=800',
            language: 'en',
            published_at: new Date(Date.now() - 259200000).toISOString(),
            source: 'Money Management',
        },
        {
            uuid: 'fallback-4',
            title: 'Cutting Monthly Expenses: Where to Start',
            description: 'Practical tips for reducing your monthly spending without sacrificing quality of life.',
            snippet: 'Discover areas where you can cut costs effectively, from subscriptions to utilities, and watch your savings grow...',
            url: 'https://www.consumerfinance.gov/consumer-tools/money-as-you-grow/',
            image_url: 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=800',
            language: 'en',
            published_at: new Date(Date.now() - 345600000).toISOString(),
            source: 'Finance Tips',
        },
        {
            uuid: 'fallback-5',
            title: 'Setting and Achieving Financial Goals',
            description: 'Learn how to set realistic financial goals and create actionable plans to achieve them.',
            snippet: 'Whether it\'s buying a home, saving for retirement, or building wealth, goal-setting is crucial for success...',
            url: 'https://www.mint.com/blog/goals/financial-goals/',
            image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800',
            language: 'en',
            published_at: new Date(Date.now() - 432000000).toISOString(),
            source: 'Financial Planning',
        },
    ];
}

/**
 * Format date for Marketaux API (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Get date X days ago for filtering recent news
 */
export function getDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return formatDateForAPI(date);
}
