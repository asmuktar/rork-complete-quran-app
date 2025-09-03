import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
  private readonly AUDIO_DIR = `${FileSystem.documentDirectory}audio/`;
  private readonly STORAGE_KEY = 'downloaded_reciters';
  
  // Default reciters that come pre-loaded
  private readonly DEFAULT_RECITERS = [
    'mishary-alafasy',
    'abdur-rahman-sudais',
    'maher-al-muaiqly'
  ];

  constructor() {
    this.initializeAudioDirectory();
  }

  private async initializeAudioDirectory() {
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
    
    const reciterAudioMap: Record<string, string> = {
      'almatroud': 'Almatroud_128kbps',
      'mishary-alafasy': 'Alafasy_128kbps',
      'abdur-rahman-sudais': 'Abdurrahman_As-Sudais_192kbps',
      'maher-al-muaiqly': 'Maher_AlMuaiqly_128kbps',
      'abdullah-basfar': 'Abdullah_Basfar_192kbps',
      'saad-al-ghamdi': 'Saad_Al-Ghamdi_128kbps',
      'ali-al-hudhaify': 'Ali_Al-Hudhaify_128kbps',
      'abu-bakr-al-shatri': 'Abu_Bakr_Al-Shatri_128kbps',
      'ahmad-al-ajmi': 'Ahmad_Al-Ajmi_128kbps',
      'mohamed-siddiq-al-minshawi': 'Minshawi_Mujawwad_128kbps',
      'mohamed-al-tablawi': 'Tablawi_128kbps',
      'aliyu-jabir': 'Aliyu_Jabir_128kbps',
      'bandar-baleela': 'Bandar_Baleela_192kbps',
      'yasser-al-dosari': 'Yasser_Al-Dosari_128kbps',
      'khalid-al-jalil': 'Khalid_Al-Jalil_128kbps',
      'nasser-al-qatami': 'Nasser_Al-Qatami_128kbps',
      'fares-abbad': 'Fares_Abbad_128kbps',
      'salah-al-budair': 'Salah_Al-Budair_128kbps',
      'omar-al-kazabri': 'Omar_Al-Kazabri_128kbps',
      'idris-abkar': 'Idris_Abkar_128kbps'
    };
    
    const reciterFolder = reciterAudioMap[reciterId] || 'Alafasy_128kbps';
    return `https://everyayah.com/data/${reciterFolder}/${paddedSurah}${paddedAyah}.mp3`;
  }

  private getLocalFilePath(reciterId: string, surahNumber: number, ayahNumber: number): string {
    const paddedSurah = surahNumber.toString().padStart(3, '0');
    const paddedAyah = ayahNumber.toString().padStart(3, '0');
    return `${this.AUDIO_DIR}${reciterId}/${paddedSurah}${paddedAyah}.mp3`;
  }

  private async ensureReciterDirectory(reciterId: string) {
    const reciterDir = `${this.AUDIO_DIR}${reciterId}/`;
    const dirInfo = await FileSystem.getInfoAsync(reciterDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(reciterDir, { intermediates: true });
    }
  }

  async isAudioAvailableLocally(reciterId: string, surahNumber: number, ayahNumber: number): Promise<boolean> {
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
    try {
      const downloadKey = `${reciterId}-${surahNumber}-${ayahNumber}`;
      
      // Check if already downloaded
      if (await this.isAudioAvailableLocally(reciterId, surahNumber, ayahNumber)) {
        console.log(`Audio already downloaded: ${downloadKey}`);
        return true;
      }

      await this.ensureReciterDirectory(reciterId);
      
      const remoteUrl = this.getAudioUrl(reciterId, surahNumber, ayahNumber);
      const localPath = this.getLocalFilePath(reciterId, surahNumber, ayahNumber);
      
      console.log(`Downloading: ${remoteUrl} -> ${localPath}`);
      
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
      
      const downloadKey = `${reciterId}-${surahNumber}-${ayahNumber}`;
      this.downloadQueue.set(downloadKey, errorProgress);
      this.notifyListeners(errorProgress);
      
      return false;
    }
  }

  async downloadSurah(reciterId: string, surahNumber: number, totalAyahs: number): Promise<boolean> {
    console.log(`Starting download of Surah ${surahNumber} for reciter ${reciterId} (${totalAyahs} ayahs)`);
    
    let successCount = 0;
    const downloadPromises: Promise<boolean>[] = [];
    
    for (let ayah = 1; ayah <= totalAyahs; ayah++) {
      downloadPromises.push(this.downloadAyah(reciterId, surahNumber, ayah));
    }
    
    const results = await Promise.allSettled(downloadPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        successCount++;
      } else {
        console.error(`Failed to download ayah ${index + 1} of surah ${surahNumber}`);
      }
    });
    
    const isComplete = successCount === totalAyahs;
    console.log(`Surah ${surahNumber} download complete: ${successCount}/${totalAyahs} ayahs`);
    
    return isComplete;
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
    
    // Check if default reciters are already initialized
    const stored = await AsyncStorage.getItem('default_reciters_initialized');
    if (stored === 'true') {
      console.log('Default reciters already initialized');
      return;
    }
    
    // Download essential ayahs for default reciters
    const essentialAyahs = [
      { surah: 1, ayah: 1 }, // Al-Fatihah opening
      { surah: 1, ayah: 2 }, // Al-Fatihah second ayah
      { surah: 1, ayah: 7 }, // Al-Fatihah last ayah
      { surah: 2, ayah: 255 }, // Ayat al-Kursi
      { surah: 112, ayah: 1 }, // Al-Ikhlas
      { surah: 112, ayah: 2 }, // Al-Ikhlas
      { surah: 112, ayah: 3 }, // Al-Ikhlas
      { surah: 112, ayah: 4 }, // Al-Ikhlas
      { surah: 113, ayah: 1 }, // Al-Falaq
      { surah: 114, ayah: 1 }, // An-Nas
    ];
    
    // Initialize default reciters in parallel for better performance
    const initPromises = this.DEFAULT_RECITERS.map(async (reciterId) => {
      console.log(`Initializing default reciter: ${reciterId}`);
      
      const downloadPromises = essentialAyahs.map(async ({ surah, ayah }) => {
        try {
          await this.downloadAyah(reciterId, surah, ayah);
        } catch (error) {
          console.error(`Failed to download essential ayah ${surah}:${ayah} for ${reciterId}:`, error);
        }
      });
      
      await Promise.allSettled(downloadPromises);
    });
    
    await Promise.allSettled(initPromises);
    
    // Mark as initialized
    await AsyncStorage.setItem('default_reciters_initialized', 'true');
    console.log('Default reciters initialization complete');
  }
}

export const audioDownloadService = new AudioDownloadService();
export default audioDownloadService;