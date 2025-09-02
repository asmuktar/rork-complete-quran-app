import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Download, Trash2, CheckCircle, AlertCircle, HardDrive } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import audioDownloadService, { ReciterDownloadInfo, DownloadProgress } from '@/services/audio-download-service';
import { TOP_RECITERS } from '@/constants/reciters';

interface DownloadManagerProps {
  reciterId?: string;
  onDownloadComplete?: () => void;
}

export default function DownloadManager({ reciterId, onDownloadComplete }: DownloadManagerProps) {
  const [downloadedReciters, setDownloadedReciters] = useState<ReciterDownloadInfo[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map());
  const [isDownloading, setIsDownloading] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ totalSize: 0, availableSize: 0 });

  useEffect(() => {
    loadDownloadedReciters();
    loadStorageInfo();
    
    // Listen for download progress
    const progressListener = (progress: DownloadProgress) => {
      setDownloadProgress(prev => {
        const newMap = new Map(prev);
        newMap.set(`${progress.reciterId}-${progress.surahId}`, progress);
        return newMap;
      });
    };

    audioDownloadService.addProgressListener(progressListener);

    return () => {
      audioDownloadService.removeProgressListener(progressListener);
    };
  }, []);

  const loadDownloadedReciters = async () => {
    try {
      const reciters = await audioDownloadService.getDownloadedReciters();
      setDownloadedReciters(reciters);
    } catch (error) {
      console.error('Error loading downloaded reciters:', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const info = await audioDownloadService.getStorageUsage();
      setStorageInfo(info);
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const handleDownloadReciter = async (targetReciterId: string) => {
    const reciter = TOP_RECITERS.find(r => r.id === targetReciterId);
    if (!reciter) return;

    Alert.alert(
      'Download Reciter',
      `Download essential surahs for ${reciter.name}? This will include Al-Fatihah, Ayat al-Kursi, and other commonly recited verses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            setIsDownloading(true);
            try {
              await audioDownloadService.downloadReciter(targetReciterId);
              await loadDownloadedReciters();
              await loadStorageInfo();
              onDownloadComplete?.();
              Alert.alert('Success', `${reciter.name} has been downloaded successfully!`);
            } catch (error) {
              console.error('Download error:', error);
              Alert.alert('Error', 'Failed to download reciter. Please try again.');
            } finally {
              setIsDownloading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteReciter = async (targetReciterId: string) => {
    const reciter = TOP_RECITERS.find(r => r.id === targetReciterId);
    if (!reciter) return;

    Alert.alert(
      'Delete Downloaded Audio',
      `Delete all downloaded audio for ${reciter.name}? This will free up storage space but you'll need to re-download to use offline.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await audioDownloadService.deleteReciterAudio(targetReciterId);
              await loadDownloadedReciters();
              await loadStorageInfo();
              Alert.alert('Success', `${reciter.name} audio has been deleted.`);
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete reciter audio.');
            }
          }
        }
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isReciterDownloaded = (targetReciterId: string): boolean => {
    return downloadedReciters.some(r => r.reciterId === targetReciterId);
  };

  const getReciterDownloadInfo = (targetReciterId: string): ReciterDownloadInfo | undefined => {
    return downloadedReciters.find(r => r.reciterId === targetReciterId);
  };

  // If specific reciter is provided, show single reciter management
  if (reciterId) {
    const reciter = TOP_RECITERS.find(r => r.id === reciterId);
    const isDownloaded = isReciterDownloaded(reciterId);
    const downloadInfo = getReciterDownloadInfo(reciterId);
    const isDefault = audioDownloadService.isDefaultReciter(reciterId);

    if (!reciter) return null;

    return (
      <View style={styles.singleReciterContainer}>
        <View style={styles.reciterHeader}>
          <View style={styles.reciterInfo}>
            <Text style={styles.reciterName}>{reciter.name}</Text>
            <Text style={styles.reciterMeta}>
              {isDefault && '⭐ Default • '}
              {isDownloaded ? `${downloadInfo?.downloadedSurahs.length || 0} surahs downloaded` : 'Not downloaded'}
            </Text>
          </View>
          
          <View style={styles.actionButtons}>
            {isDownloaded ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteReciter(reciterId)}
                disabled={isDownloading}
              >
                <Trash2 size={16} color={Colors.error} />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.downloadButton]}
                onPress={() => handleDownloadReciter(reciterId)}
                disabled={isDownloading}
              >
                <Download size={16} color={Colors.textOnPrimary} />
                <Text style={styles.actionButtonText}>
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isDownloaded && downloadInfo && (
          <View style={styles.downloadDetails}>
            <Text style={styles.downloadDetailsText}>
              Downloaded: {new Date(downloadInfo.lastUpdated).toLocaleDateString()}
            </Text>
            <Text style={styles.downloadDetailsText}>
              Surahs: {downloadInfo.downloadedSurahs.join(', ')}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Full download manager view
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Storage Info */}
      <View style={styles.storageCard}>
        <LinearGradient
          colors={Colors.gradients.primary as [string, string]}
          style={styles.storageGradient}
        >
          <HardDrive size={24} color={Colors.textOnPrimary} />
          <View style={styles.storageInfo}>
            <Text style={styles.storageTitle}>Storage Usage</Text>
            <Text style={styles.storageText}>
              Audio: {formatFileSize(storageInfo.totalSize)}
            </Text>
            <Text style={styles.storageText}>
              Available: {formatFileSize(storageInfo.availableSize)}
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Default Reciters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Reciters</Text>
        <Text style={styles.sectionSubtitle}>
          These reciters come with essential ayahs pre-loaded
        </Text>
        
        {audioDownloadService.getDefaultReciters().map(defaultReciterId => {
          const reciter = TOP_RECITERS.find(r => r.id === defaultReciterId);
          const isDownloaded = isReciterDownloaded(defaultReciterId);
          const downloadInfo = getReciterDownloadInfo(defaultReciterId);
          
          if (!reciter) return null;
          
          return (
            <View key={defaultReciterId} style={styles.reciterCard}>
              <View style={styles.reciterCardHeader}>
                <CheckCircle size={20} color={Colors.success} />
                <View style={styles.reciterCardInfo}>
                  <Text style={styles.reciterCardName}>{reciter.name}</Text>
                  <Text style={styles.reciterCardMeta}>
                    {isDownloaded 
                      ? `${downloadInfo?.downloadedSurahs.length || 0} surahs available offline`
                      : 'Ready to download'
                    }
                  </Text>
                </View>
                
                {!isDownloaded && (
                  <TouchableOpacity
                    style={styles.downloadIconButton}
                    onPress={() => handleDownloadReciter(defaultReciterId)}
                    disabled={isDownloading}
                  >
                    <Download size={16} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Downloaded Reciters */}
      {downloadedReciters.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloaded Reciters</Text>
          
          {downloadedReciters.map(downloadInfo => {
            const reciter = TOP_RECITERS.find(r => r.id === downloadInfo.reciterId);
            if (!reciter) return null;
            
            return (
              <View key={downloadInfo.reciterId} style={styles.reciterCard}>
                <View style={styles.reciterCardHeader}>
                  <CheckCircle size={20} color={Colors.success} />
                  <View style={styles.reciterCardInfo}>
                    <Text style={styles.reciterCardName}>{reciter.name}</Text>
                    <Text style={styles.reciterCardMeta}>
                      {downloadInfo.downloadedSurahs.length} surahs • 
                      Downloaded {new Date(downloadInfo.lastUpdated).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.deleteIconButton}
                    onPress={() => handleDeleteReciter(downloadInfo.reciterId)}
                  >
                    <Trash2 size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Available Reciters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available for Download</Text>
        
        {TOP_RECITERS
          .filter(reciter => !isReciterDownloaded(reciter.id))
          .slice(0, 10)
          .map(reciter => (
            <View key={reciter.id} style={styles.reciterCard}>
              <View style={styles.reciterCardHeader}>
                <AlertCircle size={20} color={Colors.textLight} />
                <View style={styles.reciterCardInfo}>
                  <Text style={styles.reciterCardName}>{reciter.name}</Text>
                  <Text style={styles.reciterCardMeta}>
                    {reciter.country} • {reciter.audioQuality}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.downloadIconButton}
                  onPress={() => handleDownloadReciter(reciter.id)}
                  disabled={isDownloading}
                >
                  <Download size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  singleReciterContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  reciterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reciterInfo: {
    flex: 1,
  },
  reciterName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  reciterMeta: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  downloadButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textOnPrimary,
  },
  deleteButtonText: {
    color: Colors.error,
  },
  downloadDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
  },
  downloadDetailsText: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 2,
  },
  storageCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  storageGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  storageInfo: {
    flex: 1,
  },
  storageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    marginBottom: 4,
  },
  storageText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  reciterCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reciterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reciterCardInfo: {
    flex: 1,
  },
  reciterCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  reciterCardMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  downloadIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});