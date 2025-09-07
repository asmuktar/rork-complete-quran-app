// Client-side utilities for handling concurrent API requests
import { trpcClient } from '@/lib/trpc';

// Utility for making multiple concurrent tRPC calls
export async function concurrentTrpcCalls<T>(
  calls: (() => Promise<T>)[],
  options: {
    batchSize?: number;
    delayBetweenBatches?: number;
    retries?: number;
  } = {}
): Promise<{ success: boolean; data?: T; error?: string }[]> {
  const { batchSize = 5, delayBetweenBatches = 100, retries = 2 } = options;
  const results: { success: boolean; data?: T; error?: string }[] = [];

  // Process calls in batches to avoid overwhelming the server
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (call) => {
        let lastError: Error | null = null;
        
        // Retry logic
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const result = await call();
            return result;
          } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            
            if (attempt < retries) {
              // Wait before retrying with exponential backoff
              const delay = 1000 * Math.pow(2, attempt);
              await new Promise(resolve => setTimeout(resolve, delay));
              console.log(`Retrying API call, attempt ${attempt + 2}/${retries + 1}`);
            }
          }
        }
        
        throw lastError;
      })
    );
    
    const processedResults = batchResults.map(result => 
      result.status === 'fulfilled'
        ? { success: true, data: result.value }
        : { success: false, error: result.reason?.message || 'Unknown error' }
    );
    
    results.push(...processedResults);
    
    // Small delay between batches to be respectful to the server
    if (i + batchSize < calls.length && delayBetweenBatches > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  return results;
}

// Utility for concurrent Quran data fetching
export async function fetchAllSurahsConcurrently() {
  console.log('🔄 Fetching all surahs concurrently...');
  
  try {
    // First get the list of surahs
    const surahs = await trpcClient.quran.surahs.query();
    console.log(`📖 Found ${surahs.length} surahs, fetching content concurrently...`);
    
    // Create calls for fetching each surah's content
    const surahCalls = surahs.slice(0, 10).map((surah: any) => () => 
      trpcClient.quran.surah.query({ id: surah.id })
    );
    
    // Execute concurrent calls
    const results = await concurrentTrpcCalls(surahCalls, {
      batchSize: 3, // Fetch 3 surahs at a time
      delayBetweenBatches: 200, // 200ms delay between batches
      retries: 2
    });
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successfully fetched ${successful.length} surahs`);
    if (failed.length > 0) {
      console.log(`❌ Failed to fetch ${failed.length} surahs`);
    }
    
    return {
      successful: successful.map(r => r.data),
      failed: failed.length,
      total: results.length
    };
  } catch (error) {
    console.error('Error in concurrent surah fetching:', error);
    throw error;
  }
}

// Utility for concurrent Hadith data fetching
export async function fetchAllHadithCollectionsConcurrently() {
  console.log('🔄 Fetching all hadith collections concurrently...');
  
  try {
    // First get the list of collections
    const collections = await trpcClient.hadith.getCollections.query();
    console.log(`📚 Found ${collections.length} collections, fetching hadiths concurrently...`);
    
    // Create calls for fetching hadiths from each collection
    const hadithCalls = collections.slice(0, 5).map(collection => () => 
      trpcClient.hadith.getHadiths.query({ 
        collection: collection.id, 
        page: 1, 
        limit: 10 
      })
    );
    
    // Execute concurrent calls
    const results = await concurrentTrpcCalls(hadithCalls, {
      batchSize: 2, // Fetch 2 collections at a time
      delayBetweenBatches: 300, // 300ms delay between batches
      retries: 2
    });
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successfully fetched hadiths from ${successful.length} collections`);
    if (failed.length > 0) {
      console.log(`❌ Failed to fetch hadiths from ${failed.length} collections`);
    }
    
    return {
      successful: successful.map(r => r.data),
      failed: failed.length,
      total: results.length
    };
  } catch (error) {
    console.error('Error in concurrent hadith fetching:', error);
    throw error;
  }
}

// Utility for concurrent Islamic data fetching (prayer times, calendar, etc.)
export async function fetchIslamicDataConcurrently(latitude: number, longitude: number) {
  console.log('🔄 Fetching Islamic data concurrently...');
  
  const islamicCalls = [
    () => trpcClient.islamic.getPrayerTimes.query({ latitude, longitude }),
    () => trpcClient.islamic.getCalendar.query({}),
    () => trpcClient.islamic.getEvents.query({})
  ];
  
  const results = await concurrentTrpcCalls(islamicCalls, {
    batchSize: 3, // All at once since they're independent
    delayBetweenBatches: 0,
    retries: 2
  });
  
  const [prayerTimes, calendar, events] = results;
  
  console.log('✅ Islamic data fetching completed');
  
  return {
    prayerTimes: prayerTimes.success ? prayerTimes.data : null,
    calendar: calendar.success ? calendar.data : null,
    events: events.success ? events.data : null,
    errors: results.filter(r => !r.success).map(r => r.error)
  };
}

// Performance monitoring for concurrent requests
export class ConcurrentRequestMonitor {
  private static instance: ConcurrentRequestMonitor;
  private activeRequests = new Map<string, { start: number; type: string }>();
  private completedRequests: { type: string; duration: number; success: boolean }[] = [];
  
  static getInstance(): ConcurrentRequestMonitor {
    if (!ConcurrentRequestMonitor.instance) {
      ConcurrentRequestMonitor.instance = new ConcurrentRequestMonitor();
    }
    return ConcurrentRequestMonitor.instance;
  }
  
  startRequest(id: string, type: string): void {
    this.activeRequests.set(id, { start: Date.now(), type });
    console.log(`🚀 Started ${type} request [${id}]`);
  }
  
  endRequest(id: string, success: boolean): void {
    const request = this.activeRequests.get(id);
    if (request) {
      const duration = Date.now() - request.start;
      this.completedRequests.push({ type: request.type, duration, success });
      this.activeRequests.delete(id);
      
      const status = success ? '✅' : '❌';
      console.log(`${status} Completed ${request.type} request [${id}] in ${duration}ms`);
    }
  }
  
  getStats() {
    const successful = this.completedRequests.filter(r => r.success);
    const failed = this.completedRequests.filter(r => !r.success);
    const avgDuration = successful.length > 0 
      ? successful.reduce((sum, r) => sum + r.duration, 0) / successful.length 
      : 0;
    
    return {
      active: this.activeRequests.size,
      completed: this.completedRequests.length,
      successful: successful.length,
      failed: failed.length,
      averageDuration: Math.round(avgDuration),
      successRate: this.completedRequests.length > 0 
        ? Math.round((successful.length / this.completedRequests.length) * 100) 
        : 0
    };
  }
  
  reset(): void {
    this.activeRequests.clear();
    this.completedRequests = [];
  }
}

// Global monitor instance
export const requestMonitor = ConcurrentRequestMonitor.getInstance();