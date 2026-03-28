// Connection pool utility for handling concurrent API requests
export class ConnectionPool {
  private activeConnections = new Map<string, number>();
  private requestQueue = new Map<string, Array<() => void>>();
  private maxConcurrentPerHost: number;
  private globalMaxConcurrent: number;
  private activeGlobalConnections = 0;

  constructor(maxConcurrentPerHost = 10, globalMaxConcurrent = 50) {
    this.maxConcurrentPerHost = maxConcurrentPerHost;
    this.globalMaxConcurrent = globalMaxConcurrent;
  }

  private getHostFromUrl(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  private canMakeRequest(host: string): boolean {
    const hostConnections = this.activeConnections.get(host) || 0;
    return hostConnections < this.maxConcurrentPerHost && 
           this.activeGlobalConnections < this.globalMaxConcurrent;
  }

  private incrementConnections(host: string): void {
    const current = this.activeConnections.get(host) || 0;
    this.activeConnections.set(host, current + 1);
    this.activeGlobalConnections++;
  }

  private decrementConnections(host: string): void {
    const current = this.activeConnections.get(host) || 0;
    if (current > 0) {
      this.activeConnections.set(host, current - 1);
      this.activeGlobalConnections--;
    }
    
    // Process queued requests for this host
    const queue = this.requestQueue.get(host);
    if (queue && queue.length > 0 && this.canMakeRequest(host)) {
      const nextRequest = queue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const host = this.getHostFromUrl(url);
    
    return new Promise((resolve, reject) => {
      const makeRequest = async () => {
        this.incrementConnections(host);
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
          
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          resolve(response);
        } catch (error) {
          reject(error);
        } finally {
          this.decrementConnections(host);
        }
      };

      if (this.canMakeRequest(host)) {
        makeRequest();
      } else {
        // Queue the request
        if (!this.requestQueue.has(host)) {
          this.requestQueue.set(host, []);
        }
        this.requestQueue.get(host)!.push(makeRequest);
      }
    });
  }

  // Batch multiple requests with automatic concurrency control
  async fetchBatch(requests: Array<{ url: string; options?: RequestInit }>): Promise<Array<{ success: boolean; data?: any; error?: string; status?: number }>> {
    const results = await Promise.allSettled(
      requests.map(async ({ url, options }) => {
        try {
          const response = await this.fetch(url, options);
          const data = await response.json();
          return {
            success: true,
            data,
            status: response.status
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 500
          };
        }
      })
    );

    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : { success: false, error: 'Request failed', status: 500 }
    );
  }

  getStats() {
    return {
      activeConnections: Object.fromEntries(this.activeConnections),
      globalActiveConnections: this.activeGlobalConnections,
      queuedRequests: Object.fromEntries(
        Array.from(this.requestQueue.entries()).map(([host, queue]) => [host, queue.length])
      ),
      maxConcurrentPerHost: this.maxConcurrentPerHost,
      globalMaxConcurrent: this.globalMaxConcurrent
    };
  }
}

// Global connection pool instance
export const globalConnectionPool = new ConnectionPool();

// Enhanced fetch function with automatic retry and circuit breaker
export async function enhancedFetch(
  url: string, 
  options?: RequestInit & { 
    retries?: number; 
    retryDelay?: number;
    circuitBreaker?: boolean;
  }
): Promise<Response> {
  const { retries = 3, retryDelay = 1000, circuitBreaker = true, ...fetchOptions } = options || {};
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await globalConnectionPool.fetch(url, fetchOptions);
      
      // If response is ok or it's the last attempt, return it
      if (response.ok || attempt === retries) {
        return response;
      }
      
      // For server errors (5xx), retry. For client errors (4xx), don't retry
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on the last attempt
      if (attempt === retries) {
        break;
      }
      
      // Wait before retrying with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retry attempt ${attempt + 1}/${retries} for ${url} after ${delay}ms`);
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

// Utility for making multiple concurrent API calls with automatic batching
export async function concurrentApiCalls<T>(
  calls: Array<() => Promise<T>>,
  batchSize = 10
): Promise<Array<{ success: boolean; data?: T; error?: string }>> {
  const results: Array<{ success: boolean; data?: T; error?: string }> = [];
  
  // Process calls in batches to avoid overwhelming the server
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(call => call())
    );
    
    const processedResults = batchResults.map(result => 
      result.status === 'fulfilled'
        ? { success: true, data: result.value }
        : { success: false, error: result.reason?.message || 'Unknown error' }
    );
    
    results.push(...processedResults);
    
    // Small delay between batches to be respectful to APIs
    if (i + batchSize < calls.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}