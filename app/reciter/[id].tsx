import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Volume2, Play, Pause, Heart, Share2, Download, DownloadCloud } from 'lucide-react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { TOP_RECITERS } from '@/constants/reciters';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import DownloadManager from '@/components/DownloadManager';
import audioDownloadService from '@/services/audio-download-service';
import { trpc } from '@/lib/trpc';

export default function ReciterDetailScreen() {
  const { id } = useLocalSearchParams();
  const reciterId = id as string;
  const reciter = TOP_RECITERS.find(r => r.id === reciterId);
  const audioPlayer = useAudioPlayer();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [showDownloadManager, setShowDownloadManager] = useState(false);
  const [showSurahsList, setShowSurahsList] = useState(false);
  const [downloadedSurahs, setDownloadedSurahs] = useState<Set<number>>(new Set());
  
  // Fetch all surahs
  const surahsQuery = trpc.quran.surahs.useQuery();
  const surahs = surahsQuery.data || [];

  const checkDownloadStatus = useCallback(async () => {
    try {
      const downloaded = await audioDownloadService.isReciterDownloaded(reciterId);
      setIsDownloaded(downloaded);
    } catch (error) {
      console.error('Error checking download status:', error);
    }
  }, [reciterId]);

  useEffect(() => {
    checkDownloadStatus();
  }, [checkDownloadStatus]);

  if (!reciter) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Reciter Not Found' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Reciter not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handlePlaySample = async () => {
    try {
      if (isPlaying || audioPlayer.isPlaying) {
        await audioPlayer.stopPlayback();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        // Set the reciter first
        audioPlayer.setReciter(reciterId);
        console.log('Playing sample with reciter:', reciterId);
        // Play Al-Fatihah verse 1 as sample
        await audioPlayer.playAyah(1, 1);
        // Reset playing state when done
        setTimeout(() => setIsPlaying(false), 8000); // Increased timeout
      }
    } catch (error) {
      console.error('Error playing sample:', error);
      Alert.alert('Error', 'Failed to play sample audio. Please check your internet connection.');
      setIsPlaying(false);
    }
  };

  const handleShare = () => {
    Alert.alert('Share', `Share ${reciter.name} with others`);
  };

  // Removed unused handleDownload function
  
  const handleDownloadSurah = async (surahNumber: number) => {
    try {
      // Here you would implement individual surah download logic
      console.log(`Downloading surah ${surahNumber} for reciter ${reciterId}`);
      Alert.alert('Download Started', `Downloading Surah ${surahNumber}...`);
      
      // Simulate download completion
      setTimeout(() => {
        setDownloadedSurahs(prev => new Set([...prev, surahNumber]));
      }, 2000);
    } catch (error) {
      console.error('Error downloading surah:', error);
      Alert.alert('Error', 'Failed to download surah');
    }
  };
  
  useEffect(() => {
    const checkDownloadedSurahs = async () => {
      // Check which surahs are already downloaded
      const downloaded = new Set<number>();
      for (let i = 1; i <= 114; i++) {
        try {
          // For now, simulate checking download status
          // In a real implementation, you would check if the audio file exists
          const isDownloaded = Math.random() > 0.8; // Simulate some downloaded
          if (isDownloaded) {
            downloaded.add(i);
          }
        } catch {
          // Ignore errors for individual checks
        }
      }
      setDownloadedSurahs(downloaded);
    };
    
    if (showSurahsList) {
      checkDownloadedSurahs();
    }
  }, [showSurahsList, reciterId]);

  const handleDownloadComplete = () => {
    checkDownloadStatus();
    setShowDownloadManager(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: reciter.name,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textOnPrimary,
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      
      {/* Header */}
      <LinearGradient
        colors={Colors.gradients.islamic as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.reciterRank}>
            <Star size={24} color={Colors.textOnPrimary} fill={Colors.textOnPrimary} />
          </View>
          <Text style={styles.reciterName}>{reciter.name}</Text>
          <Text style={styles.reciterArabicName}>{reciter.arabicName}</Text>
          <Text style={styles.reciterCountry}>{reciter.country}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reciter.popularity}%</Text>
              <Text style={styles.statLabel}>Popularity</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reciter.audioQuality}</Text>
              <Text style={styles.statLabel}>Quality</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{isDownloaded ? 'Yes' : 'No'}</Text>
              <Text style={styles.statLabel}>Downloaded</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={handlePlaySample}>
          <LinearGradient
            colors={Colors.gradients.primary as [string, string]}
            style={styles.buttonGradient}
          >
            {isPlaying ? (
              <Pause size={20} color={Colors.textOnPrimary} />
            ) : (
              <Play size={20} color={Colors.textOnPrimary} />
            )}
            <Text style={styles.primaryButtonText}>
              {isPlaying || audioPlayer.isPlaying ? 'Stop Sample' : 'Play Sample'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.secondaryButton, isLiked && styles.likedButton]} 
          onPress={() => setIsLiked(!isLiked)}
        >
          <Heart 
            size={20} 
            color={isLiked ? Colors.error : Colors.primary} 
            fill={isLiked ? Colors.error : 'transparent'}
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
          <Share2 size={20} color={Colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.secondaryButton, isDownloaded && styles.downloadedButton]} 
          onPress={() => setShowSurahsList(true)}
        >
          <Download size={20} color={isDownloaded ? Colors.success : Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Download Manager Modal */}
      {showDownloadManager && (
        <View style={styles.downloadManagerContainer}>
          <View style={styles.downloadManagerHeader}>
            <Text style={styles.downloadManagerTitle}>Download Manager</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowDownloadManager(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <DownloadManager 
            reciterId={reciterId} 
            onDownloadComplete={handleDownloadComplete}
          />
        </View>
      )}
      
      {/* Surahs List Modal */}
      {showSurahsList && (
        <View style={styles.surahsListContainer}>
          <View style={styles.surahsListHeader}>
            <Text style={styles.surahsListTitle}>{reciter?.name} - Surahs</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowSurahsList(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.downloadAllContainer}>
            <TouchableOpacity 
              style={styles.downloadAllButton}
              onPress={() => {
                setShowSurahsList(false);
                setShowDownloadManager(true);
              }}
            >
              <DownloadCloud size={20} color={Colors.textOnPrimary} />
              <Text style={styles.downloadAllText}>Download All Database</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.surahsList} showsVerticalScrollIndicator={false}>
            {surahs.map((surah: any) => (
              <TouchableOpacity 
                key={surah.number}
                style={styles.surahItem}
                onPress={() => handleDownloadSurah(surah.number)}
              >
                <View style={styles.surahItemContent}>
                  <View style={styles.surahInfo}>
                    <Text style={styles.surahName}>Surah {surah.name}</Text>
                    <Text style={styles.surahSubtitle}>Download surah</Text>
                  </View>
                  
                  <View style={styles.downloadIconContainer}>
                    <Download 
                      size={20} 
                      color={downloadedSurahs.has(surah.number) ? Colors.success : Colors.primary} 
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{reciter.description}</Text>
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtiesContainer}>
            {reciter.specialties.map((specialty) => (
              <View key={specialty} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sample Ayahs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sample Recitations</Text>
          {reciter.sampleAyahs.map((sample) => (
            <TouchableOpacity 
              key={`${sample.surah}-${sample.ayah}`} 
              style={styles.recitationItem}
              onPress={async () => {
                try {
                  audioPlayer.setReciter(reciterId);
                  await audioPlayer.stopPlayback();
                  await audioPlayer.playAyah(sample.surah, sample.ayah);
                } catch (error) {
                  console.error('Error playing sample ayah:', error);
                  Alert.alert('Error', 'Failed to play sample ayah');
                }
              }}
            >
              <View style={styles.recitationInfo}>
                <Text style={styles.recitationName}>Surah {sample.surah}, Ayah {sample.ayah}</Text>
                <Text style={styles.recitationArabic}>{sample.text}</Text>
                <Text style={styles.sampleTranslation}>{sample.translation}</Text>
              </View>
              <View style={styles.recitationMeta}>
                <TouchableOpacity style={styles.playButton}>
                  <Volume2 size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Biography */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biography</Text>
          <Text style={styles.biography}>{reciter.biography}</Text>
        </View>
        
        {/* Recitation Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recitation Style</Text>
          <Text style={styles.biography}>{reciter.recitationStyle}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            &quot;And recite the Quran with measured recitation&quot;
          </Text>
          <Text style={styles.footerSubtext}>- Quran 73:4</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: 'center',
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  reciterRank: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  reciterName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  reciterArabicName: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  reciterCountry: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likedButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: Colors.primaryOverlay,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  specialtyText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  recitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  recitationInfo: {
    flex: 1,
  },
  recitationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  recitationArabic: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  recitationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recitationDuration: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biography: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  sampleTranslation: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: Colors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  downloadedButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: Colors.success,
  },
  downloadManagerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  downloadManagerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  downloadManagerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  surahsListContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  surahsListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  surahsListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  downloadAllContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  downloadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  downloadAllText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  surahsList: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  surahItem: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  surahItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  surahSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  downloadIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
});