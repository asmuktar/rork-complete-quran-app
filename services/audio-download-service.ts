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
    'saad-al-ghamdi',
    'abdullah-basfar'
  ];
  
  // Essential surahs that should be available by default
  private readonly ESSENTIAL_SURAHS = [
    { id: 1, ayahs: 7 },   // Al-Fatihah
    { id: 112, ayahs: 4 }, // Al-Ikhlas
    { id: 113, ayahs: 5 }, // Al-Falaq
    { id: 114, ayahs: 6 }  // An-Nas
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

  private getReciterFolder(reciterId: string): string {
    const workingReciters: Record<string, string> = {
      'mishary-alafasy': 'Alafasy_128kbps',
      'saad-al-ghamdi': 'Saad_Al-Ghamdi_128kbps',
      'abdullah-basfar': 'Abdullah_Basfar_192kbps',
      'ali-al-hudhaify': 'Ali_Al-Hudhaify_128kbps',
      'abu-bakr-al-shatri': 'Abu_Bakr_Al-Shatri_128kbps',
      'ahmad-al-ajmi': 'Ahmad_Al-Ajmi_128kbps',
      'mohamed-siddiq-al-minshawi': 'Minshawi_Mujawwad_128kbps',
      'mohamed-al-tablawi': 'Tablawi_128kbps',
      'abdur-rahman-sudais': 'Abdurrahman_As-Sudais_192kbps',
      'maher-al-muaiqly': 'Maher_AlMuaiqly_128kbps'
    };
    
    return workingReciters[reciterId] || 'Alafasy_128kbps';
  }

  private getAudioUrl(reciterId: string, surahNumber: number, ayahNumber: number): string {
    const paddedSurah = surahNumber.toString().padStart(3, '0');
    const paddedAyah = ayahNumber.toString().padStart(3, '0');
    
    // Verified working reciters with correct folder names
    const workingReciters: Record<string, string> = {
      'mishary-alafasy': 'Alafasy_128kbps',
      'saad-al-ghamdi': 'Saad_Al-Ghamdi_128kbps',
      'abdullah-basfar': 'Abdullah_Basfar_192kbps',
      'ali-al-hudhaify': 'Ali_Al-Hudhaify_128kbps',
      'abu-bakr-al-shatri': 'Abu_Bakr_Al-Shatri_128kbps',
      'ahmad-al-ajmi': 'Ahmad_Al-Ajmi_128kbps',
      'mohamed-siddiq-al-minshawi': 'Minshawi_Mujawwad_128kbps',
      'mohamed-al-tablawi': 'Tablawi_128kbps',
      'abdur-rahman-sudais': 'Abdurrahman_As-Sudais_192kbps',
      'maher-al-muaiqly': 'Maher_AlMuaiqly_128kbps'
    };
    
    // All other reciters fallback to Alafasy (most reliable)
    const reciterFolder = workingReciters[reciterId] || 'Alafasy_128kbps';
    
    // Try multiple URL patterns for better compatibility
    const baseUrls = [
      `https://everyayah.com/data/${reciterFolder}/${paddedSurah}${paddedAyah}.mp3`,
      `https://www.everyayah.com/data/${reciterFolder}/${paddedSurah}${paddedAyah}.mp3`,
      `https://cdn.everyayah.com/data/${reciterFolder}/${paddedSurah}${paddedAyah}.mp3`
    ];
    
    // Return the primary URL (we'll handle fallbacks in the download method)
    return baseUrls[0];
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
          // Try multiple URL patterns for web as well
          const paddedSurah = surahNumber.toString().padStart(3, '0');
          const paddedAyah = ayahNumber.toString().padStart(3, '0');
          const reciterFolder = this.getReciterFolder(reciterId);
          
          const possibleUrls = [
            `https://everyayah.com/data/${reciterFolder}/${paddedSurah}${paddedAyah}.mp3`,
            `https://www.everyayah.com/data/${reciterFolder}/${paddedSurah}${paddedAyah}.mp3`,
            `https://cdn.everyayah.com/data/${reciterFolder}/${paddedSurah}${paddedAyah}.mp3`,
            // Fallback to Alafasy if original reciter doesn't work
            `https://everyayah.com/data/Alafasy_128kbps/${paddedSurah}${paddedAyah}.mp3`
          ];
          
          let workingUrl: string | null = null;
          
          // Test each URL to find a working one
          for (const testUrl of possibleUrls) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout
              
              const response = await fetch(testUrl, { 
                method: 'HEAD',
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              
              if (response.ok) {
                workingUrl = testUrl;
                console.log(`Web: Found working URL: ${testUrl}`);
                break;
              }
            } catch {
              // Continue to next URL
              continue;
            }
          }
          
          if (!workingUrl) {
            throw new Error(`No working audio URL found for ${reciterId} ${surahNumber}:${ayahNumber}`);
          }
          
          // Cache the working URL
          this.webAudioCache.set(downloadKey, workingUrl);
          
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
      
      // Try multiple URL patterns for better compatibility
      const paddedSurah = surahNumber.toString().padStart(3, '0');
      const paddedAyah = ayahNumber.toString().padStart(3, '0');
      const reciterFolder = this.getReciterFolder(reciterId);
      
      const possibleUrls = [
        `https://everyayah.com/data/${reciterFolder}/${paddedSurah}${paddedAyah}.mp3`,
        `https://www.everyayah.com/data/${reciterFolder}/${paddedSurah}${paddedAyah}.mp3`,
        `https://cdn.everyayah.com/data/${reciterFolder}/${paddedSurah}${paddedAyah}.mp3`,
        // Fallback to Alafasy if original reciter doesn't work
        `https://everyayah.com/data/Alafasy_128kbps/${paddedSurah}${paddedAyah}.mp3`
      ];
      
      let workingUrl = remoteUrl;
      let urlFound = false;
      
      // Test each URL to find a working one
      for (const testUrl of possibleUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout
          
          const response = await fetch(testUrl, { 
            method: 'HEAD',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            workingUrl = testUrl;
            urlFound = true;
            console.log(`Found working URL: ${testUrl}`);
            break;
          }
        } catch {
          // Continue to next URL
          continue;
        }
      }
      
      if (!urlFound) {
        console.warn(`No working URL found for ${reciterId} ${surahNumber}:${ayahNumber}`);
        // Still try the original URL as last resort
      }
      
      const downloadResumable = FileSystem.createDownloadResumable(
        workingUrl,
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
        const BATCH_SIZE = 3; // Reduced batch size for better reliability
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
              const ayahNum = i + index + 1;
              console.warn(`Failed to download ayah ${ayahNum} of surah ${surahNumber} for ${reciterId}`);
            }
          });
          
          // Progress logging
          const progress = Math.round((Math.min(i + BATCH_SIZE, totalAyahs) / totalAyahs) * 100);
          console.log(`Surah ${surahNumber} progress: ${progress}% (${successCount}/${Math.min(i + BATCH_SIZE, totalAyahs)} ayahs)`);
          
          // Small delay between batches to prevent overwhelming the server
          if (i + BATCH_SIZE < totalAyahs) {
            await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay
          }
        }
        
        const isComplete = successCount === totalAyahs;
        const successRate = Math.round((successCount / totalAyahs) * 100);
        
        if (isComplete) {
          console.log(`✅ Surah ${surahNumber} download complete: ${successCount}/${totalAyahs} ayahs (100%)`);
        } else {
          console.log(`⚠️ Surah ${surahNumber} download partial: ${successCount}/${totalAyahs} ayahs (${successRate}%)`);
        }
        
        // Consider it successful if we got at least 80% of the ayahs
        return successRate >= 80;
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
        const stored = await AsyncStorage.getItem('default_reciters_initialized_v2');
        if (stored === 'true') {
          console.log('Default reciters already initialized');
          return;
        }
        
        console.log('Starting fresh initialization of default reciters...');
        
        // Initialize default reciters with essential surahs
        const initPromises = this.DEFAULT_RECITERS.map(async (reciterId, index) => {
          console.log(`Initializing default reciter ${index + 1}/${this.DEFAULT_RECITERS.length}: ${reciterId}`);
          
          let totalSuccessCount = 0;
          
          // Download essential complete surahs
          for (const surah of this.ESSENTIAL_SURAHS) {
            console.log(`Downloading Surah ${surah.id} for ${reciterId}...`);
            
            try {
              const success = await this.downloadSurah(reciterId, surah.id, surah.ayahs);
              if (success) {
                totalSuccessCount += surah.ayahs;
                console.log(`✅ Successfully downloaded Surah ${surah.id} for ${reciterId}`);
              } else {
                console.warn(`⚠️ Failed to download complete Surah ${surah.id} for ${reciterId}`);
              }
            } catch (error) {
              console.error(`❌ Error downloading Surah ${surah.id} for ${reciterId}:`, error);
            }
            
            // Small delay between surahs
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // Also download some key individual ayahs
          const keyAyahs = [
            { surah: 2, ayah: 255 }, // Ayat al-Kursi
            { surah: 2, ayah: 286 }, // Last ayah of Al-Baqarah
          ];
          
          for (const { surah, ayah } of keyAyahs) {
            try {
              const success = await this.downloadAyah(reciterId, surah, ayah);
              if (success) {
                totalSuccessCount++;
                console.log(`✅ Downloaded key ayah ${surah}:${ayah} for ${reciterId}`);
              }
            } catch (error) {
              console.error(`❌ Error downloading key ayah ${surah}:${ayah} for ${reciterId}:`, error);
            }
          }
          
          console.log(`Reciter ${reciterId} initialization complete: ${totalSuccessCount} ayahs downloaded`);
          
          // Mark reciter as initialized if we got at least some content
          if (totalSuccessCount > 0) {
            await this.updateReciterDownloadInfo(reciterId, 1);
            return true;
          }
          
          return false;
        });
        
        const initResults = await Promise.allSettled(initPromises);
        const successfulInits = initResults.filter(r => r.status === 'fulfilled' && r.value).length;
        
        console.log(`Default reciters initialization complete: ${successfulInits}/${this.DEFAULT_RECITERS.length} reciters successfully initialized`);
        
        // Mark as initialized even if not all reciters succeeded
        await AsyncStorage.setItem('default_reciters_initialized_v2', 'true');
        console.log('✅ Default reciters initialization process finished');
      }
    );
  }
}

export const audioDownloadService = new AudioDownloadService();
export default audioDownloadService;