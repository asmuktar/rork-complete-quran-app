import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import resourceManager from './resource-manager';

export interface DownloadProgress {
  reciterId: string;
  surahId: number;
  progress: number;
  totalBytes: number;
  downloadedBytes: number;
  isComplete: boolean;
  error?: string;
}

export interface ReciterDownloadInfo {
  reciterId: string;
  name: string;
  downloadedSurahs: number[];
  totalSize: number;
  downloadedSize: number;
  isDefault: boolean;
  lastUpdated: string;
}

class AudioDownloadService {
  private downloadQueue: Map<string, DownloadProgress> = new Map();
  private listeners: ((progress: DownloadProgress) => void)[] = [];
  private readonly AUDIO_DIR = Platform.OS === 'web' ? 'audio/' : `${FileSystem.documentDirectory}audio/`;
  private readonly STORAGE_KEY = 'downloaded_reciters';
  private webAudioCache: Map<string, string> = new Map(); // For web audio URLs
  
  // Default reciters that come pre-loaded (only verified working ones)
  private readonly DEFAULT_RECITERS = [
    'mishary-alafasy',
    'saad-al-ghamdi'
  ];

  constructor() {
    this.initializeAudioDirectory();
  }

  private async initializeAudioDirectory() {
    if (Platform.OS === 'web') {
      // Web doesn't need directory initialization
      return;
    }
    
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.AUDIO_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.AUDIO_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Error initializing audio directory:', error);
    }
  }

  private getAudioUrl(reciterId: string, surahNumber: number, ayahNumber: number): string {
    const paddedSurah = surahNumber.toString().padStart(3, '0');
    const paddedAyah = ayahNumber.toString().padStart(3, '0');
    
    // Verified working reciters
    const workingReciters: Record<string, string> = {
      'almatroud': 'Almatroud_128kbps',
      'mishary-alafasy': 'Alafasy_128kbps',
      'abdullah-basfar': 'Abdullah_Basfar_192kbps',
      'saad-al-ghamdi': 'Saad_Al-Ghamdi_128kbps',
      'ali-al-hudhaify': 'Ali_Al-Hudhaify_128kbps',
      'abu-bakr-al-shatri': 'Abu_Bakr_Al-Shatri_128kbps',
      'ahmad-al-ajmi': 'Ahmad_Al-Ajmi_128kbps',
      'mohamed-siddiq-al-minshawi': 'Minshawi_Mujawwad_128kbps',
      'mohamed-al-tablawi': 'Tablawi_128kbps'
    };
    
    // Reciters that need fallback (known to have issues)
    const fallbackReciters: Record<string, string> = {
      'abdur-rahman-sudais': 'Alafasy_128kbps',
      'maher-al-muaiqly': 'Alafasy_128kbps',
      'aliyu-jabir': 'Alafasy_128kbps',
      'bandar-baleela': 'Alafasy_128kbps',
      'yasser-al-dosari': 'Alafasy_128kbps',
      'khalid-al-jalil': 'Alafasy_128kbps',
      'nasser-al-qatami': 'Alafasy_128kbps',
      'fares-abbad': 'Alafasy_128kbps',
      'salah-al-budair': 'Alafasy_128kbps',
      'omar-al-kazabri': 'Alafasy_128kbps',
      'idris-abkar': 'Alafasy_128kbps'
    };
    
    // Use working reciter if available, otherwise use fallback
    const reciterFolder = workingReciters[reciterId] || fallbackReciters[reciterId] || 'Alafasy_128kbps';
    return `https://everyayah.com/data/${reciterFolder}/${paddedSurah}${paddedAyah}.mp3`;
  }

  private getLocalFilePath(reciterId: string, surahNumber: number, ayahNumber: number): string {
    const paddedSurah = surahNumber.toString().padStart(3, '0');
    const paddedAyah = ayahNumber.toString().padStart(3, '0');
    return `${this.AUDIO_DIR}${reciterId}/${paddedSurah}${paddedAyah}.mp3`;
  }

  private async ensureReciterDirectory(reciterId: string) {
    if (Platform.OS === 'web') {
      // Web doesn't need directory creation
      return;
    }
    
    const reciterDir = `${this.AUDIO_DIR}${reciterId}/`;
    const dirInfo = await FileSystem.getInfoAsync(reciterDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(reciterDir, { intermediates: true });
    }
  }

  async isAudioAvailableLocally(reciterId: string, surahNumber: number, ayahNumber: number): Promise<boolean> {
    if (Platform.OS === 'web') {
      // On web, check if we have cached the URL
      const cacheKey = `${reciterId}-${surahNumber}-${ayahNumber}`;
      return this.webAudioCache.has(cacheKey);
    }
    
    try {
      const localPath = this.getLocalFilePath(reciterId, surahNumber, ayahNumber);
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      return fileInfo.exists;
    } catch (error) {
      console.error('Error checking local audio availability:', error);
      return false;
    }
  }

  async getAudioUri(reciterId: string, surahNumber: number, ayahNumber: number): Promise<string> {
    if (Platform.OS === 'web') {
      // On web, always use online URLs
      const onlineUrl = this.getAudioUrl(reciterId, surahNumber, ayahNumber);
      const cacheKey = `${reciterId}-${surahNumber}-${ayahNumber}`;
      this.webAudioCache.set(cacheKey, onlineUrl);
      console.log(`Using online audio (web): ${onlineUrl}`);
      return onlineUrl;
    }
    
    // Check if available locally first
    const isLocal = await this.isAudioAvailableLocally(reciterId, surahNumber, ayahNumber);
    
    if (isLocal) {
      const localPath = this.getLocalFilePath(reciterId, surahNumber, ayahNumber);
      console.log(`Using local audio: ${localPath}`);
      return localPath;
    }
    
    // Fall back to online URL
    const onlineUrl = this.getAudioUrl(reciterId, surahNumber, ayahNumber);
    console.log(`Using online audio: ${onlineUrl}`);
    return onlineUrl;
  }

  async downloadAyah(reciterId: string, surahNumber: number, ayahNumber: number): Promise<boolean> {
    const downloadKey = `${reciterId}-${surahNumber}-${ayahNumber}`;
    
    if (Platform.OS === 'web') {
      // On web, simulate download by caching the URL with performance tracking
      return resourceManager.trackApiCall(
        `audio-cache-${reciterId}`,
        async () => {
          const remoteUrl = this.getAudioUrl(reciterId, surahNumber, ayahNumber);
          
          // Check if URL is accessible with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          try {
            const response = await fetch(remoteUrl, { 
              method: 'HEAD',
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`Audio file not available: ${response.status}`);
            }
          } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Audio file check timeout');
            }
            throw error;
          }
          
          // Cache the URL
          this.webAudioCache.set(downloadKey, remoteUrl);
          
          // Simulate progress
          const progress: DownloadProgress = {
            reciterId,
            surahId: surahNumber,
            progress: 1,
            totalBytes: 1000, // Simulated size
            downloadedBytes: 1000,
            isComplete: true
          };
          
          this.downloadQueue.set(downloadKey, progress);
          this.notifyListeners(progress);
          
          console.log(`Web: Cached audio URL: ${downloadKey}`);
          await this.updateReciterDownloadInfo(reciterId, surahNumber);
          return true;
        },
        async () => {
          // Check if already cached
          return this.webAudioCache.has(downloadKey) ? true : null;
        }
      ).catch(error => {
        console.error(`Error caching ayah ${downloadKey}:`, error);
        
        const errorProgress: DownloadProgress = {
          reciterId,
          surahId: surahNumber,
          progress: 0,
          totalBytes: 0,
          downloadedBytes: 0,
          isComplete: false,
          error: error instanceof Error ? error.message : 'Caching failed'
        };
        
        this.downloadQueue.set(downloadKey, errorProgress);
        this.notifyListeners(errorProgress);
        return false;
      });
    }
    
    try {
      // Check if already downloaded
      if (await this.isAudioAvailableLocally(reciterId, surahNumber, ayahNumber)) {
        console.log(`Audio already downloaded: ${downloadKey}`);
        return true;
      }

      await this.ensureReciterDirectory(reciterId);
      
      const remoteUrl = this.getAudioUrl(reciterId, surahNumber, ayahNumber);
      const localPath = this.getLocalFilePath(reciterId, surahNumber, ayahNumber);
      
      console.log(`Downloading: ${remoteUrl} -> ${localPath}`);
      
      // Check if URL is accessible before attempting download
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(remoteUrl, { 
          method: 'HEAD',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Audio file not available: ${response.status}`);
        }
      } catch (error) {
        console.warn(`Audio file may not be available: ${remoteUrl}`, error);
        // Don't continue with download if we know it will fail
        throw new Error(`Audio file not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      const downloadResumable = FileSystem.createDownloadResumable(
        remoteUrl,
        localPath,
        {},
        (downloadProgress) => {
          const progress: DownloadProgress = {
            reciterId,
            surahId: surahNumber,
            progress: downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite,
            totalBytes: downloadProgress.totalBytesExpectedToWrite,
            downloadedBytes: downloadProgress.totalBytesWritten,
            isComplete: false
          };
          
          this.downloadQueue.set(downloadKey, progress);
          this.notifyListeners(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        const finalProgress: DownloadProgress = {
          reciterId,
          surahId: surahNumber,
          progress: 1,
          totalBytes: result.headers['content-length'] ? parseInt(result.headers['content-length']) : 0,
          downloadedBytes: result.headers['content-length'] ? parseInt(result.headers['content-length']) : 0,
          isComplete: true
        };
        
        this.downloadQueue.set(downloadKey, finalProgress);
        this.notifyListeners(finalProgress);
        
        console.log(`Successfully downloaded: ${downloadKey}`);
        await this.updateReciterDownloadInfo(reciterId, surahNumber);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error downloading ayah ${reciterId}-${surahNumber}-${ayahNumber}:`, error);
      
      const errorProgress: DownloadProgress = {
        reciterId,
        surahId: surahNumber,
        progress: 0,
        totalBytes: 0,
        downloadedBytes: 0,
        isComplete: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
      
      this.downloadQueue.set(downloadKey, errorProgress);
      this.notifyListeners(errorProgress);
      
      return false;
    }
  }

  async downloadSurah(reciterId: string, surahNumber: number, totalAyahs: number): Promise<boolean> {
    console.log(`Starting download of Surah ${surahNumber} for reciter ${reciterId} (${totalAyahs} ayahs)`);
    
    return resourceManager.trackApiCall(
      `surah-download-${reciterId}-${surahNumber}`,
      async () => {
        let successCount = 0;
        
        // Batch downloads in smaller chunks to avoid overwhelming the system
        const BATCH_SIZE = 5;
        for (let i = 0; i < totalAyahs; i += BATCH_SIZE) {
          const batchPromises: Promise<boolean>[] = [];
          
          for (let ayah = i + 1; ayah <= Math.min(i + BATCH_SIZE, totalAyahs); ayah++) {
            batchPromises.push(this.downloadAyah(reciterId, surahNumber, ayah));
          }
          
          const batchResults = await Promise.allSettled(batchPromises);
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
              successCount++;
            } else {
              console.error(`Failed to download ayah ${i + index + 1} of surah ${surahNumber}`);
            }
          });
          
          // Small delay between batches to prevent overwhelming the server
          if (i + BATCH_SIZE < totalAyahs) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        const isComplete = successCount === totalAyahs;
        console.log(`Surah ${surahNumber} download complete: ${successCount}/${totalAyahs} ayahs`);
        
        return isComplete;
      }
    );
  }

  async downloadReciter(reciterId: string, surahsToDownload: number[] = []): Promise<void> {
    // If no specific surahs provided, download most common ones
    const defaultSurahs = surahsToDownload.length > 0 ? surahsToDownload : [1, 2, 18, 36, 55, 67, 112, 113, 114];
    
    console.log(`Starting download of reciter ${reciterId} for surahs:`, defaultSurahs);
    
    // Surah ayah counts for the default surahs
    const surahAyahCounts: Record<number, number> = {
      1: 7,   // Al-Fatihah
      2: 286, // Al-Baqarah
      18: 110, // Al-Kahf
      36: 83,  // Ya-Sin
      55: 78,  // Ar-Rahman
      67: 30,  // Al-Mulk
      112: 4,  // Al-Ikhlas
      113: 5,  // Al-Falaq
      114: 6   // An-Nas
    };
    
    for (const surahNumber of defaultSurahs) {
      const ayahCount = surahAyahCounts[surahNumber] || 10; // Default fallback
      await this.downloadSurah(reciterId, surahNumber, ayahCount);
    }
  }

  async downloadSelectedSurahs(reciterId: string, surahIds: number[]): Promise<void> {
    console.log(`Starting download of selected surahs for reciter ${reciterId}:`, surahIds);
    
    // Import SURAHS to get ayah counts
    const { SURAHS } = await import('@/constants/quran-data');
    
    for (const surahId of surahIds) {
      const surah = SURAHS.find(s => s.id === surahId);
      if (surah) {
        await this.downloadSurah(reciterId, surahId, surah.ayahs);
      } else {
        console.warn(`Surah with ID ${surahId} not found`);
      }
    }
  }

  private async updateReciterDownloadInfo(reciterId: string, surahNumber: number) {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const downloadedReciters: Record<string, ReciterDownloadInfo> = stored ? JSON.parse(stored) : {};
      
      if (!downloadedReciters[reciterId]) {
        downloadedReciters[reciterId] = {
          reciterId,
          name: reciterId,
          downloadedSurahs: [],
          totalSize: 0,
          downloadedSize: 0,
          isDefault: this.DEFAULT_RECITERS.includes(reciterId),
          lastUpdated: new Date().toISOString()
        };
      }
      
      if (!downloadedReciters[reciterId].downloadedSurahs.includes(surahNumber)) {
        downloadedReciters[reciterId].downloadedSurahs.push(surahNumber);
        downloadedReciters[reciterId].lastUpdated = new Date().toISOString();
      }
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(downloadedReciters));
    } catch (error) {
      console.error('Error updating reciter download info:', error);
    }
  }

  async getDownloadedReciters(): Promise<ReciterDownloadInfo[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const downloadedReciters: Record<string, ReciterDownloadInfo> = stored ? JSON.parse(stored) : {};
      return Object.values(downloadedReciters);
    } catch (error) {
      console.error('Error getting downloaded reciters:', error);
      return [];
    }
  }

  async isReciterDownloaded(reciterId: string): Promise<boolean> {
    const downloadedReciters = await this.getDownloadedReciters();
    return downloadedReciters.some(r => r.reciterId === reciterId && r.downloadedSurahs.length > 0);
  }

  async deleteReciterAudio(reciterId: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // On web, clear cached URLs for this reciter
        const keysToDelete: string[] = [];
        this.webAudioCache.forEach((_, key) => {
          if (key.startsWith(`${reciterId}-`)) {
            keysToDelete.push(key);
          }
        });
        
        keysToDelete.forEach(key => this.webAudioCache.delete(key));
        
        // Update storage
        const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
        const downloadedReciters: Record<string, ReciterDownloadInfo> = stored ? JSON.parse(stored) : {};
        delete downloadedReciters[reciterId];
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(downloadedReciters));
        
        console.log(`Web: Cleared cached audio for reciter: ${reciterId}`);
        return true;
      }
      
      const reciterDir = `${this.AUDIO_DIR}${reciterId}/`;
      const dirInfo = await FileSystem.getInfoAsync(reciterDir);
      
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(reciterDir);
        
        // Update storage
        const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
        const downloadedReciters: Record<string, ReciterDownloadInfo> = stored ? JSON.parse(stored) : {};
        delete downloadedReciters[reciterId];
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(downloadedReciters));
        
        console.log(`Deleted reciter audio: ${reciterId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error deleting reciter audio ${reciterId}:`, error);
      return false;
    }
  }

  async getStorageUsage(): Promise<{ totalSize: number; availableSize: number }> {
    try {
      if (Platform.OS === 'web') {
        return { totalSize: 0, availableSize: 0 };
      }
      
      const dirInfo = await FileSystem.getInfoAsync(this.AUDIO_DIR);
      if (!dirInfo.exists) {
        return { totalSize: 0, availableSize: 0 };
      }
      
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      const audioFiles = await this.getAudioDirectorySize();
      
      return {
        totalSize: audioFiles,
        availableSize: freeSpace
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return { totalSize: 0, availableSize: 0 };
    }
  }

  private async getAudioDirectorySize(): Promise<number> {
    if (Platform.OS === 'web') {
      // On web, return estimated size based on cached items
      return this.webAudioCache.size * 1000; // Rough estimate
    }
    
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.AUDIO_DIR);
      if (!dirInfo.exists) return 0;
      
      // This is a simplified calculation - in a real app you'd recursively calculate
      return dirInfo.size || 0;
    } catch (error) {
      console.error('Error calculating directory size:', error);
      return 0;
    }
  }

  addProgressListener(listener: (progress: DownloadProgress) => void) {
    this.listeners.push(listener);
  }

  removeProgressListener(listener: (progress: DownloadProgress) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(progress: DownloadProgress) {
    this.listeners.forEach(listener => {
      try {
        listener(progress);
      } catch (error) {
        console.error('Error in progress listener:', error);
      }
    });
  }

  getDownloadProgress(reciterId: string, surahId: number): DownloadProgress | null {
    const key = `${reciterId}-${surahId}`;
    return this.downloadQueue.get(key) || null;
  }

  isDefaultReciter(reciterId: string): boolean {
    return this.DEFAULT_RECITERS.includes(reciterId);
  }

  getDefaultReciters(): string[] {
    return [...this.DEFAULT_RECITERS];
  }

  async initializeDefaultReciters(): Promise<void> {
    console.log('Initializing default reciters...');
    
    return resourceManager.trackApiCall(
      'initialize-default-reciters',
      async () => {
        // Check if default reciters are already initialized
        const stored = await AsyncStorage.getItem('default_reciters_initialized');
        if (stored === 'true') {
          console.log('Default reciters already initialized');
          return;
        }
    
    // Download essential ayahs for default reciters (expanded list)
    const essentialAyahs = [
      { surah: 1, ayah: 1 }, // Al-Fatihah opening
      { surah: 1, ayah: 2 }, // Al-Fatihah second ayah
      { surah: 1, ayah: 3 }, // Al-Fatihah third ayah
      { surah: 1, ayah: 4 }, // Al-Fatihah fourth ayah
      { surah: 1, ayah: 5 }, // Al-Fatihah fifth ayah
      { surah: 1, ayah: 6 }, // Al-Fatihah sixth ayah
      { surah: 1, ayah: 7 }, // Al-Fatihah last ayah
      { surah: 2, ayah: 255 }, // Ayat al-Kursi
      { surah: 2, ayah: 286 }, // Last ayah of Al-Baqarah
      { surah: 112, ayah: 1 }, // Al-Ikhlas
      { surah: 112, ayah: 2 }, // Al-Ikhlas
      { surah: 112, ayah: 3 }, // Al-Ikhlas
      { surah: 112, ayah: 4 }, // Al-Ikhlas
      { surah: 113, ayah: 1 }, // Al-Falaq
      { surah: 113, ayah: 2 }, // Al-Falaq
      { surah: 113, ayah: 3 }, // Al-Falaq
      { surah: 113, ayah: 4 }, // Al-Falaq
      { surah: 113, ayah: 5 }, // Al-Falaq
      { surah: 114, ayah: 1 }, // An-Nas
      { surah: 114, ayah: 2 }, // An-Nas
      { surah: 114, ayah: 3 }, // An-Nas
      { surah: 114, ayah: 4 }, // An-Nas
      { surah: 114, ayah: 5 }, // An-Nas
      { surah: 114, ayah: 6 }, // An-Nas
    ];
    
    // Initialize default reciters with better error handling and progress tracking
    const initPromises = this.DEFAULT_RECITERS.map(async (reciterId, index) => {
      console.log(`Initializing default reciter ${index + 1}/${this.DEFAULT_RECITERS.length}: ${reciterId}`);
      
      // Test with a single ayah first to verify reciter works
      try {
        const testSuccess = await this.downloadAyah(reciterId, 1, 1);
        if (!testSuccess) {
          console.warn(`Reciter ${reciterId} test failed, skipping initialization`);
          return;
        }
      } catch (error) {
        console.warn(`Reciter ${reciterId} test failed:`, error);
        return;
      }
      
      const downloadPromises = essentialAyahs.slice(1).map(async ({ surah, ayah }) => {
        try {
          const success = await this.downloadAyah(reciterId, surah, ayah);
          return success;
        } catch (error) {
          console.error(`Failed to download essential ayah ${surah}:${ayah} for ${reciterId}:`, error);
          return false;
        }
      });
      
      const results = await Promise.allSettled(downloadPromises);
      const actualSuccessCount = 1 + results.filter(r => r.status === 'fulfilled' && r.value).length;
      
      console.log(`Reciter ${reciterId} initialization: ${actualSuccessCount}/${essentialAyahs.length} ayahs downloaded`);
      
      // Mark reciter as partially initialized even if not all downloads succeeded
      if (actualSuccessCount > 0) {
        await this.updateReciterDownloadInfo(reciterId, 1); // Mark as having some content
      }
    });
    
    const initResults = await Promise.allSettled(initPromises);
    const successfulInits = initResults.filter(r => r.status === 'fulfilled').length;
    
    console.log(`Default reciters initialization: ${successfulInits}/${this.DEFAULT_RECITERS.length} reciters processed`);
    
        // Mark as initialized
        await AsyncStorage.setItem('default_reciters_initialized', 'true');
        console.log('Default reciters initialization complete');
      }
    );
  }
}

export const audioDownloadService = new AudioDownloadService();
export default audioDownloadService;