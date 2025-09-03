import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { quranApi } from './quran-api';
import { SURAHS } from '@/constants/quran-data';
import { HADITH_COLLECTIONS } from '@/constants/hadith-data';

interface OfflineData {
  surahs: any[];
  translations: { [key: string]: any };
  audio: { [key: string]: string };
  hadithCollections: any[];
  prayerTimes: { [key: string]: any };
  lastUpdated: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry?: number;
}

class OfflineService {
  private readonly CACHE_PREFIX = '@islamic_app_cache:';
  private readonly OFFLINE_DATA_KEY = '@islamic_app_offline_data';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private isOnline = true;
  private offlineData: OfflineData | null = null;

  constructor() {
    this.initializeNetworkListener();
    this.loadOfflineData();
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener((state: any) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.isOnline) {
        console.log('Back online - syncing data');
        this.syncWhenOnline();
      }
    });
  }

  private async loadOfflineData() {
    try {
      const data = await AsyncStorage.getItem(this.OFFLINE_DATA_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        // Validate data structure to prevent corruption
        if (this.isValidOfflineData(parsedData)) {
          this.offlineData = parsedData;
        } else {
          console.log('Invalid offline data detected, resetting to clean state');
          await this.resetToCleanState();
        }
      } else {
        // Initialize with basic data
        await this.resetToCleanState();
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
      await this.resetToCleanState();
    }
  }
  
  private isValidOfflineData(data: any): boolean {
    // Check if the data has the expected structure
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.surahs)) return false;
    
    // Check if surahs have the expected local structure
    const firstSurah = data.surahs[0];
    if (firstSurah && (firstSurah.numberInSurah !== undefined || firstSurah.manzil !== undefined)) {
      // This indicates API data structure, which we want to avoid
      return false;
    }
    
    return true;
  }
  
  private async resetToCleanState() {
    this.offlineData = {
      surahs: SURAHS,
      translations: {},
      audio: {},
      hadithCollections: HADITH_COLLECTIONS,
      prayerTimes: {},
      lastUpdated: Date.now()
    };
    await this.saveOfflineData();
  }

  private async saveOfflineData() {
    try {
      if (this.offlineData) {
        await AsyncStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(this.offlineData));
      }
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  // Cache management
  async setCache(key: string, data: any, expiry?: number): Promise<void> {
    try {
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now(),
        expiry: expiry || Date.now() + this.CACHE_DURATION
      };
      await AsyncStorage.setItem(`${this.CACHE_PREFIX}${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  async getCache(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cacheEntry: CacheEntry = JSON.parse(cached);
      
      // Check if cache is expired
      if (cacheEntry.expiry && Date.now() > cacheEntry.expiry) {
        await this.clearCache(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  async clearCache(key?: string): Promise<void> {
    try {
      if (key) {
        await AsyncStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
      } else {
        // Clear all cache
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(k => k.startsWith(this.CACHE_PREFIX));
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Offline-first data fetching
  async getSurah(surahNumber: number, edition: string = 'ar.alafasy'): Promise<any> {
    const cacheKey = `surah_${surahNumber}_${edition}`;
    
    // Try cache first
    const cached = await this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // If offline, return from offline data
    if (!this.isOnline) {
      const offlineSurah = this.offlineData?.surahs.find(s => s.number === surahNumber);
      if (offlineSurah) {
        return offlineSurah;
      }
      throw new Error('Surah not available offline');
    }

    // Fetch from API and cache
    try {
      const data = await quranApi.getSurah(surahNumber, edition);
      await this.setCache(cacheKey, data);
      
      // Don't update offline data with API data to prevent structure conflicts
      // Keep local SURAHS data intact
      
      return data;
    } catch (error) {
      // If API fails, try offline data
      const offlineSurah = this.offlineData?.surahs.find(s => s.number === surahNumber);
      if (offlineSurah) {
        return offlineSurah;
      }
      throw error;
    }
  }

  async searchQuran(query: string, edition: string = 'en.sahih'): Promise<any> {
    const cacheKey = `search_${query}_${edition}`;
    
    // Try cache first
    const cached = await this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // If offline, perform local search
    if (!this.isOnline) {
      return this.performOfflineSearch(query);
    }

    // Fetch from API and cache
    try {
      const data = await quranApi.searchQuran(query, edition);
      await this.setCache(cacheKey, data, Date.now() + (6 * 60 * 60 * 1000)); // 6 hours cache for search
      return data;
    } catch {
      // Fallback to offline search
      return this.performOfflineSearch(query);
    }
  }

  private performOfflineSearch(query: string): any {
    if (!this.offlineData) {
      return { matches: [] };
    }

    const matches: any[] = [];
    const searchTerm = query.toLowerCase();

    // Search through cached surahs
    this.offlineData.surahs.forEach(surah => {
      if (surah.ayahs) {
        surah.ayahs.forEach((ayah: any) => {
          if (ayah.text && ayah.text.toLowerCase().includes(searchTerm)) {
            matches.push({
              ...ayah,
              surah: {
                number: surah.number,
                name: surah.name,
                englishName: surah.englishName
              }
            });
          }
        });
      }
    });

    return { matches };
  }

  async getAllSurahs(): Promise<any> {
    const cacheKey = 'all_surahs';
    
    // Try cache first
    const cached = await this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // If offline, return from offline data
    if (!this.isOnline) {
      return this.offlineData?.surahs || SURAHS;
    }

    // Fetch from API and cache
    try {
      const data = await quranApi.getAllSurahs();
      await this.setCache(cacheKey, data);
      
      // Don't update offline data with API data to prevent structure conflicts
      // Keep local SURAHS data intact
      
      return data;
    } catch {
      // Fallback to offline data
      return this.offlineData?.surahs || SURAHS;
    }
  }

  async getHadithCollections(): Promise<any> {
    const cacheKey = 'hadith_collections';
    
    // Try cache first
    const cached = await this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Always return offline data for hadith collections
    const collections = this.offlineData?.hadithCollections || HADITH_COLLECTIONS;
    await this.setCache(cacheKey, collections);
    return collections;
  }

  async syncWhenOnline(): Promise<void> {
    if (!this.isOnline) return;

    try {
      console.log('Syncing data while online...');
      
      // Sync surahs
      const surahs = await quranApi.getAllSurahs();
      await this.setCache('all_surahs', surahs);
      
      // Don't update offline data with API data to prevent structure conflicts
      // Keep local SURAHS data intact
      if (this.offlineData) {
        this.offlineData.lastUpdated = Date.now();
        await this.saveOfflineData();
      }
      
      console.log('Data sync completed');
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }

  // Preload essential data for offline use
  async preloadEssentialData(): Promise<void> {
    if (!this.isOnline) return;

    try {
      console.log('Preloading essential data...');
      
      // Preload first 10 surahs with translations
      const essentialSurahs = [1, 2, 3, 4, 5, 36, 67, 112, 113, 114]; // Common surahs
      
      for (const surahNumber of essentialSurahs) {
        try {
          await this.getSurah(surahNumber, 'ar.alafasy');
          await this.getSurah(surahNumber, 'en.sahih');
        } catch (error) {
          console.error(`Error preloading surah ${surahNumber}:`, error);
        }
      }
      
      console.log('Essential data preloaded');
    } catch (error) {
      console.error('Error preloading data:', error);
    }
  }

  // Network status
  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  // Storage management
  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.CACHE_PREFIX));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await this.clearCache();
      await AsyncStorage.removeItem(this.OFFLINE_DATA_KEY);
      this.offlineData = null;
      await this.loadOfflineData();
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }
}

export const offlineService = new OfflineService();
export default offlineService;