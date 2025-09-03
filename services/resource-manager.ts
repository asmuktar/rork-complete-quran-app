import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import cacheService from './cache-service';

export interface ResourceStats {
  memoryUsage: {
    cache: number;
    audio: number;
    images: number;
    total: number;
  };
  storageUsage: {
    cache: number;
    audio: number;
    bookmarks: number;
    settings: number;
    total: number;
  };
  networkUsage: {
    requests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
  };
}

export interface PerformanceMetrics {
  apiResponseTimes: Record<string, number[]>;
  cachePerformance: {
    hits: number;
    misses: number;
    totalRequests: number;
  };
  memoryPressure: boolean;
  lastOptimization: number;
}

class ResourceManager {
  private performanceMetrics: PerformanceMetrics = {
    apiResponseTimes: {},
    cachePerformance: { hits: 0, misses: 0, totalRequests: 0 },
    memoryPressure: false,
    lastOptimization: 0
  };

  private readonly OPTIMIZATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MEMORY_PRESSURE_THRESHOLD = 0.8; // 80% memory usage
  private readonly MAX_API_RESPONSE_SAMPLES = 10;
  private readonly METRICS_STORAGE_KEY = 'performance_metrics';

  constructor() {
    this.initializeResourceManager();
    this.startPerformanceMonitoring();
  }

  private async initializeResourceManager() {
    try {
      // Load saved metrics
      const savedMetrics = await AsyncStorage.getItem(this.METRICS_STORAGE_KEY);
      if (savedMetrics) {
        const parsed = JSON.parse(savedMetrics);
        this.performanceMetrics = { ...this.performanceMetrics, ...parsed };
      }

      // Start optimization cycle
      this.scheduleOptimization();
    } catch (error) {
      console.error('Error initializing resource manager:', error);
    }
  }

  private startPerformanceMonitoring() {
    // Monitor memory usage periodically
    setInterval(() => {
      this.checkMemoryPressure();
    }, 30 * 1000); // Every 30 seconds

    // Save metrics periodically
    setInterval(() => {
      this.saveMetrics();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private scheduleOptimization() {
    setInterval(() => {
      this.optimizeResources();
    }, this.OPTIMIZATION_INTERVAL);
  }

  private async checkMemoryPressure() {
    try {
      if (Platform.OS === 'web') {
        // Web memory monitoring (limited)
        const memInfo = (performance as any).memory;
        if (memInfo) {
          const usedRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
          this.performanceMetrics.memoryPressure = usedRatio > this.MEMORY_PRESSURE_THRESHOLD;
          
          if (this.performanceMetrics.memoryPressure) {
            console.warn('Memory pressure detected, triggering optimization');
            await this.optimizeResources();
          }
        }
      } else {
        // Mobile memory monitoring would require native modules
        // For now, we'll use cache size as a proxy
        const cacheStats = cacheService.getStats();
        if (cacheStats.memorySize > 100) { // Arbitrary threshold
          this.performanceMetrics.memoryPressure = true;
          await this.optimizeResources();
        }
      }
    } catch (error) {
      console.error('Error checking memory pressure:', error);
    }
  }

  private async optimizeResources() {
    const now = Date.now();
    
    // Don't optimize too frequently
    if (now - this.performanceMetrics.lastOptimization < this.OPTIMIZATION_INTERVAL) {
      return;
    }

    console.log('Starting resource optimization...');
    
    try {
      // 1. Clean up expired cache entries
      await this.cleanupExpiredCache();
      
      // 2. Optimize memory usage
      await this.optimizeMemoryUsage();
      
      // 3. Preload frequently accessed data
      await this.preloadCriticalData();
      
      // 4. Clean up old metrics
      this.cleanupOldMetrics();
      
      this.performanceMetrics.lastOptimization = now;
      console.log('Resource optimization completed');
    } catch (error) {
      console.error('Error during resource optimization:', error);
    }
  }

  private async cleanupExpiredCache() {
    // This is handled by the cache service automatically
    console.log('Cache cleanup handled by cache service');
  }

  private async optimizeMemoryUsage() {
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Clear large objects from memory if under pressure
      if (this.performanceMetrics.memoryPressure) {
        console.log('Memory pressure detected, clearing non-essential data');
        // Could clear image caches, audio buffers, etc.
      }
    } catch (error) {
      console.error('Error optimizing memory usage:', error);
    }
  }

  private async preloadCriticalData() {
    try {
      // Preload essential data that's likely to be accessed soon
      await cacheService.preloadEssentialData();
    } catch (error) {
      console.error('Error preloading critical data:', error);
    }
  }

  private cleanupOldMetrics() {
    // Keep only recent API response time samples
    for (const endpoint in this.performanceMetrics.apiResponseTimes) {
      const samples = this.performanceMetrics.apiResponseTimes[endpoint];
      if (samples.length > this.MAX_API_RESPONSE_SAMPLES) {
        this.performanceMetrics.apiResponseTimes[endpoint] = samples.slice(-this.MAX_API_RESPONSE_SAMPLES);
      }
    }
  }

  private async saveMetrics() {
    try {
      await AsyncStorage.setItem(this.METRICS_STORAGE_KEY, JSON.stringify(this.performanceMetrics));
    } catch (error) {
      console.error('Error saving performance metrics:', error);
    }
  }

  // Public API for tracking performance
  private recordApiCall(endpoint: string, responseTime: number, fromCache: boolean = false) {
    // Track response times
    if (!this.performanceMetrics.apiResponseTimes[endpoint]) {
      this.performanceMetrics.apiResponseTimes[endpoint] = [];
    }
    
    this.performanceMetrics.apiResponseTimes[endpoint].push(responseTime);
    
    // Keep only recent samples
    if (this.performanceMetrics.apiResponseTimes[endpoint].length > this.MAX_API_RESPONSE_SAMPLES) {
      this.performanceMetrics.apiResponseTimes[endpoint].shift();
    }

    // Track cache performance
    this.performanceMetrics.cachePerformance.totalRequests++;
    if (fromCache) {
      this.performanceMetrics.cachePerformance.hits++;
    } else {
      this.performanceMetrics.cachePerformance.misses++;
    }
  }

  getAverageResponseTime(endpoint: string): number {
    const samples = this.performanceMetrics.apiResponseTimes[endpoint];
    if (!samples || samples.length === 0) return 0;
    
    return samples.reduce((sum, time) => sum + time, 0) / samples.length;
  }

  getCacheHitRate(): number {
    const { hits, totalRequests } = this.performanceMetrics.cachePerformance;
    return totalRequests > 0 ? hits / totalRequests : 0;
  }

  async getResourceStats(): Promise<ResourceStats> {
    try {
      const cacheStats = cacheService.getStats();
      
      // Estimate storage usage
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
      const bookmarkKeys = allKeys.filter(key => key.includes('bookmark'));
      const settingKeys = allKeys.filter(key => key.includes('setting') || key.includes('preference'));
      const audioKeys = allKeys.filter(key => key.includes('audio') || key.includes('reciter'));

      return {
        memoryUsage: {
          cache: cacheStats.memorySize,
          audio: 0, // Would need native module to get actual audio memory usage
          images: 0, // Would need native module to get actual image memory usage
          total: cacheStats.memorySize
        },
        storageUsage: {
          cache: cacheKeys.length,
          audio: audioKeys.length,
          bookmarks: bookmarkKeys.length,
          settings: settingKeys.length,
          total: allKeys.length
        },
        networkUsage: {
          requests: this.performanceMetrics.cachePerformance.totalRequests,
          cacheHits: this.performanceMetrics.cachePerformance.hits,
          cacheMisses: this.performanceMetrics.cachePerformance.misses,
          hitRate: this.getCacheHitRate()
        }
      };
    } catch (error) {
      console.error('Error getting resource stats:', error);
      return {
        memoryUsage: { cache: 0, audio: 0, images: 0, total: 0 },
        storageUsage: { cache: 0, audio: 0, bookmarks: 0, settings: 0, total: 0 },
        networkUsage: { requests: 0, cacheHits: 0, cacheMisses: 0, hitRate: 0 }
      };
    }
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  // Utility method to wrap API calls with performance tracking
  async trackApiCall<T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    cacheCheck?: () => Promise<T | null>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Check cache first if provided
      if (cacheCheck) {
        const cached = await cacheCheck();
        if (cached) {
          const responseTime = Date.now() - startTime;
          this.recordApiCall(endpoint, responseTime, true);
          return cached;
        }
      }
      
      // Make API call
      const result = await apiCall();
      const responseTime = Date.now() - startTime;
      this.recordApiCall(endpoint, responseTime, false);
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordApiCall(endpoint, responseTime, false);
      throw error;
    }
  }

  // Manual optimization trigger
  async forceOptimization(): Promise<void> {
    this.performanceMetrics.lastOptimization = 0; // Reset to force optimization
    await this.optimizeResources();
  }

  // Clear all performance data
  async clearMetrics(): Promise<void> {
    this.performanceMetrics = {
      apiResponseTimes: {},
      cachePerformance: { hits: 0, misses: 0, totalRequests: 0 },
      memoryPressure: false,
      lastOptimization: 0
    };
    
    await AsyncStorage.removeItem(this.METRICS_STORAGE_KEY);
  }

  // Get recommendations for performance improvements
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const hitRate = this.getCacheHitRate();
    
    if (hitRate < 0.5) {
      recommendations.push('Cache hit rate is low. Consider preloading frequently accessed data.');
    }
    
    if (this.performanceMetrics.memoryPressure) {
      recommendations.push('Memory pressure detected. Consider clearing unused data or reducing cache size.');
    }
    
    // Check for slow endpoints
    for (const [endpoint, times] of Object.entries(this.performanceMetrics.apiResponseTimes)) {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      if (avgTime > 3000) { // 3 seconds
        recommendations.push(`${endpoint} is responding slowly (${avgTime.toFixed(0)}ms average). Consider caching or optimization.`);
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! No specific recommendations at this time.');
    }
    
    return recommendations;
  }
}

export const resourceManager = new ResourceManager();
export default resourceManager;