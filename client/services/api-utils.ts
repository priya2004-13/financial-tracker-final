/// <reference types="vite/client" />
// client/services/api-utils.ts  
// Remove trailing slash from API_BASE_URL to prevent double slashes
console.log(import.meta.env.VITE_API_BASE_URL)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, '');

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Generic API error class
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public response?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Delay helper for retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced fetch with retry logic
export async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries = MAX_RETRIES
): Promise<Response> {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        // If response is ok, return it
        if (response.ok) {
            return response;
        }

        // If it's a client error (4xx), don't retry
        if (response.status >= 400 && response.status < 500) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(
                errorData.message || errorData.error || `Request failed with status ${response.status}`,
                response.status,
                errorData
            );
        }

        // If it's a server error (5xx) and we have retries left, retry
        if (retries > 0 && response.status >= 500) {
            console.warn(`Server error ${response.status}, retrying... (${retries} retries left)`);
            await delay(RETRY_DELAY);
            return fetchWithRetry(url, options, retries - 1);
        }

        // No more retries, throw error
        throw new ApiError(`Request failed with status ${response.status}`, response.status);
    } catch (error) {
        // Network errors - retry if we have retries left
        if (retries > 0 && error instanceof TypeError) {
            console.warn(`Network error, retrying... (${retries} retries left)`);
            await delay(RETRY_DELAY);
            return fetchWithRetry(url, options, retries - 1);
        }

        // If it's already an ApiError, rethrow it
        if (error instanceof ApiError) {
            throw error;
        }

        // Unknown error
        throw new ApiError(
            error instanceof Error ? error.message : 'Unknown error occurred'
        );
    }
}

// Generic GET request
export async function apiGet<T>(endpoint: string): Promise<T> {
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`);
    return response.json();
}

// Generic POST request
export async function apiPost<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response.json();
}

// Generic PUT request
export async function apiPut<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
}

// Generic DELETE request
export async function apiDelete<T>(endpoint: string): Promise<T> {
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
    });
    return response.json();
}

// Batch request helper (for split transactions)
export async function apiBatchPost<T>(endpoint: string, dataArray: any[]): Promise<T[]> {
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(dataArray),
    });
    const result = await response.json();
    return Array.isArray(result) ? result : [result];
}

// Health check
export async function checkApiHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
        });
        return response.ok;
    } catch {
        return false;
    }
}

// Optimistic update helper
export class OptimisticUpdateManager<T> {
    private originalData: T | null = null;

    constructor(private onRevert: (data: T) => void) { }

    startUpdate(data: T) {
        this.originalData = data;
    }

    revert() {
        if (this.originalData) {
            this.onRevert(this.originalData);
            this.originalData = null;
        }
    }

    commit() {
        this.originalData = null;
    }
}

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

export async function apiGetWithDedup<T>(endpoint: string): Promise<T> {
    const key = `GET:${endpoint}`;

    if (pendingRequests.has(key)) {
        return pendingRequests.get(key)!;
    }

    const promise = apiGet<T>(endpoint).finally(() => {
        pendingRequests.delete(key);
    });

    pendingRequests.set(key, promise);
    return promise;
}

// Export base URL for direct usage
export { API_BASE_URL };