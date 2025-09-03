import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  version: string; // Cache version for invalidation
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly DEFAULT_MAX_SIZE = 100;
  private readonly CACHE_VERSION = '1.1.0'; // Updated for better compatibility
  private readonly STORAGE_PREFIX = 'cache_';
  private readonly METADATA_KEY = 'cache_metadata';
  
  // Cache configurations for different data types
  private readonly cacheConfigs: Record<string, CacheConfig> = {
    'quran_surahs': { ttl: 24 * 60 * 60 * 1000, maxSize: 1, version: this.CACHE_VERSION }, // 24 hours
    'quran_ayahs': { ttl: 60 * 60 * 1000, maxSize: 50, version: this.CACHE_VERSION }, // 1 hour
    'prayer_times': { ttl: 60 * 60 * 1000, maxSize: 10, version: this.CACHE_VERSION }, // 1 hour
    'hadith_collections': { ttl: 24 * 60 * 60 * 1000, maxSize: 1, version: this.CACHE_VERSION }, // 24 hours
    'hadith_search': { ttl: 30 * 60 * 1000, maxSize: 20, version: this.CACHE_VERSION }, // 30 minutes
    'quran_search': { ttl: 30 * 60 * 1000, maxSize: 20, version: this.CACHE_VERSION }, // 30 minutes
    'islamic_calendar': { ttl: 24 * 60 * 60 * 1000, maxSize: 5, version: this.CACHE_VERSION }, // 24 hours
    'translations': { ttl: 24 * 60 * 60 * 1000, maxSize: 100, version: this.CACHE_VERSION }, // 24 hours
    'audio_metadata': { ttl: 7 * 24 * 60 * 60 * 1000, maxSize: 50, version: this.CACHE_VERSION }, // 7 days
  };

  constructor() {
    this.initializeCache();
    this.startCleanupInterval();
  }

  private async initializeCache() {
    try {
      // Load cache metadata
      const metadata = await this.getCacheMetadata();
      
      // Clear cache if version mismatch
      if (metadata.version !== this.CACHE_VERSION) {
        console.log(`📦 Cache version mismatch (${metadata.version} → ${this.CACHE_VERSION}), clearing cache for compatibility`);
        await this.clearAll();
        await this.setCacheMetadata({ version: this.CACHE_VERSION, lastCleanup: Date.now() });
        console.log('✅ Cache cleared and updated to new version');
      }
      
      // Preload frequently accessed data into memory cache
      await this.preloadMemoryCache();
    } catch (error) {
      console.error('Error initializing cache:', error);
      // Try to recover by clearing cache
      try {
        await this.clearAll();
        await this.setCacheMetadata({ version: this.CACHE_VERSION, lastCleanup: Date.now() });
        console.log('✅ Cache recovered after error');
      } catch (recoveryError) {
        console.error('Failed to recover cache:', recoveryError);
      }
    }
  }

  private async preloadMemoryCache() {
    try {
      // Preload small, frequently accessed data
      const preloadKeys = ['quran_surahs', 'hadith_collections'];
      
      for (const key of preloadKeys) {
        const cached = await this.getFromStorage(key);
        if (cached && !this.isExpired(cached)) {
          this.memoryCache.set(key, cached);
        }
      }
    } catch (error) {
      console.error('Error preloading memory cache:', error);
    }
  }

  private startCleanupInterval() {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60 * 60 * 1000);
  }

  private async cleanupExpiredEntries() {
    try {
      // Cleanup memory cache
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key);
        }
      }
      
      // Cleanup persistent cache
      const metadata = await this.getCacheMetadata();
      const now = Date.now();
      
      // Only run full cleanup once per day
      if (now - metadata.lastCleanup > 24 * 60 * 60 * 1000) {
        await this.cleanupPersistentCache();
        await this.setCacheMetadata({ ...metadata, lastCleanup: now });
      }
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  private async cleanupPersistentCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.STORAGE_PREFIX));
      
      const expiredKeys: string[] = [];
      
      for (const key of cacheKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const entry: CacheEntry<any> = JSON.parse(data);
            if (this.isExpired(entry)) {
              expiredKeys.push(key);
            }
          }
        } catch {
          // Invalid entry, mark for deletion
          expiredKeys.push(key);
        }
      }
      
      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
      }
    } catch (error) {
      console.error('Error cleaning up persistent cache:', error);
    }
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  private getConfig(cacheType: string): CacheConfig {
    return this.cacheConfigs[cacheType] || {
      ttl: this.DEFAULT_TTL,
      maxSize: this.DEFAULT_MAX_SIZE,
      version: this.CACHE_VERSION
    };
  }

  private createCacheEntry<T>(data: T, config: CacheConfig): CacheEntry<T> {
    const now = Date.now();
    return {
      data,
      timestamp: now,
      expiresAt: now + config.ttl,
      version: config.version
    };
  }

  private getStorageKey(cacheType: string, key: string): string {
    return `${this.STORAGE_PREFIX}${cacheType}_${key}`;
  }

  private async getFromStorage(key: string): Promise<CacheEntry<any> | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  private async setToStorage(key: string, entry: CacheEntry<any>): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  }

  private async getCacheMetadata(): Promise<{ version: string; lastCleanup: number }> {
    try {
      const data = await AsyncStorage.getItem(this.METADATA_KEY);
      return data ? JSON.parse(data) : { version: '', lastCleanup: 0 };
    } catch {
      return { version: '', lastCleanup: 0 };
    }
  }

  private async setCacheMetadata(metadata: { version: string; lastCleanup: number }): Promise<void> {
    try {
      await AsyncStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error setting cache metadata:', error);
    }
  }

  // Public API
  async get<T>(cacheType: string, key: string): Promise<T | null> {
    const cacheKey = this.getStorageKey(cacheType, key);
    
    // Check memory cache first (fastest)
    let entry = this.memoryCache.get(cacheKey) || null;
    
    if (!entry) {
      // Check persistent storage
      entry = await this.getFromStorage(cacheKey);
      
      // Add to memory cache if found and not expired
      if (entry && !this.isExpired(entry)) {
        this.memoryCache.set(cacheKey, entry);
      }
    }
    
    if (!entry || this.isExpired(entry)) {
      // Clean up expired entry
      if (entry) {
        this.memoryCache.delete(cacheKey);
        await AsyncStorage.removeItem(cacheKey);
      }
      return null;
    }
    
    return entry.data as T;
  }

  async set<T>(cacheType: string, key: string, data: T): Promise<void> {
    const config = this.getConfig(cacheType);
    const entry = this.createCacheEntry(data, config);
    const cacheKey = this.getStorageKey(cacheType, key);
    
    // Store in memory cache
    this.memoryCache.set(cacheKey, entry);
    
    // Store in persistent cache
    await this.setToStorage(cacheKey, entry);
    
    // Enforce memory cache size limits
    await this.enforceMemoryCacheSize(cacheType, config.maxSize);
  }

  private async enforceMemoryCacheSize(cacheType: string, maxSize: number) {
    const prefix = this.getStorageKey(cacheType, '');
    const typeEntries = Array.from(this.memoryCache.entries())
      .filter(([key]) => key.startsWith(prefix))
      .sort(([, a], [, b]) => b.timestamp - a.timestamp); // Sort by newest first
    
    if (typeEntries.length > maxSize) {
      const toRemove = typeEntries.slice(maxSize);
      toRemove.forEach(([key]) => {
        this.memoryCache.delete(key);
      });
    }
  }

  async invalidate(cacheType: string, key?: string): Promise<void> {
    if (key) {
      // Invalidate specific key
      const cacheKey = this.getStorageKey(cacheType, key);
      this.memoryCache.delete(cacheKey);
      await AsyncStorage.removeItem(cacheKey);
    } else {
      // Invalidate all keys of this type
      const prefix = this.getStorageKey(cacheType, '');
      
      // Remove from memory cache
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(prefix)) {
          this.memoryCache.delete(key);
        }
      }
      
      // Remove from persistent cache
      const keys = await AsyncStorage.getAllKeys();
      const keysToRemove = keys.filter(key => key.startsWith(prefix));
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
    }
  }

  async clearAll(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear persistent cache
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(this.STORAGE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  }

  // Batch operations for better performance
  async getMultiple<T>(cacheType: string, keys: string[]): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {};
    
    // Use Promise.all for concurrent access
    const promises = keys.map(async (key) => {
      const data = await this.get<T>(cacheType, key);
      return { key, data };
    });
    
    const resolved = await Promise.all(promises);
    resolved.forEach(({ key, data }) => {
      results[key] = data;
    });
    
    return results;
  }

  async setMultiple<T>(cacheType: string, entries: Record<string, T>): Promise<void> {
    const promises = Object.entries(entries).map(([key, data]) => 
      this.set(cacheType, key, data)
    );
    
    await Promise.all(promises);
  }

  // Cache statistics
  getStats(): {
    memorySize: number;
    memorySizeByType: Record<string, number>;
    hitRate: number;
  } {
    const memorySizeByType: Record<string, number> = {};
    
    for (const key of this.memoryCache.keys()) {
      const type = key.split('_')[1] || 'unknown';
      memorySizeByType[type] = (memorySizeByType[type] || 0) + 1;
    }
    
    return {
      memorySize: this.memoryCache.size,
      memorySizeByType,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  // Preload commonly used data
  async preloadEssentialData(): Promise<void> {
    try {
      console.log('📦 Preloading essential data...');
      
      // This will be called by the app initialization
      // to preload commonly accessed data
      const essentialData = [
        { type: 'quran_surahs', key: 'all' },
        { type: 'hadith_collections', key: 'all' },
      ];
      
      // Check if data exists in cache, if not, it will be loaded on first access
      for (const { type, key } of essentialData) {
        await this.get(type, key);
      }
      console.log('✅ Essential data preloading completed');
    } catch (error) {
      console.error('Error preloading essential data:', error);
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;