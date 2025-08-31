import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Square, Settings, Bookmark, BookmarkCheck, Volume2, SkipBack, SkipForward, Repeat } from 'lucide-react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { getSurahById, Ayah } from '@/constants/quran-data';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { TOP_RECITERS } from '@/constants/reciters';

export default function SurahScreen() {
  const { id } = useLocalSearchParams();
  const surahId = parseInt(id as string);
  const surah = getSurahById(surahId);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set());
  const [selectedReciter, setSelectedReciter] = useState('almatroud');
  const [showTransliteration, setShowTransliteration] = useState(false);
  
  const audioPlayer = useAudioPlayer();
  
  useEffect(() => {
    audioPlayer.setReciter(selectedReciter);
  }, [selectedReciter, audioPlayer]);
  
  useEffect(() => {
    if (audioPlayer.autoScroll && audioPlayer.currentAyah && scrollViewRef.current) {
      // Auto-scroll to current ayah
      const ayahIndex = audioPlayer.currentAyah - 1;
      const estimatedPosition = ayahIndex * 150; // Rough estimate
      scrollViewRef.current.scrollTo({ y: estimatedPosition, animated: true });
    }
  }, [audioPlayer.currentAyah, audioPlayer.autoScroll]);
  
  if (!surah) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Surah not found</Text>
      </SafeAreaView>
    );
  }
  
  const handlePlayWholeSurah = async () => {
    try {
      await audioPlayer.playWholeSurah(surah.id, surah.ayahs);
    } catch (error) {
      console.error('Error playing whole surah:', error);
      Alert.alert('Error', 'Failed to play surah. Please try again.');
    }
  };
  
  const handlePlayAyah = async (ayahNumber: number) => {
    try {
      await audioPlayer.playAyah(surah.id, ayahNumber);
    } catch (error) {
      console.error('Error playing ayah:', error);
      Alert.alert('Error', 'Failed to play ayah. Please try again.');
    }
  };
  
  const toggleBookmark = (ayahNumber: number) => {
    const newBookmarks = new Set(bookmarkedAyahs);
    if (newBookmarks.has(ayahNumber)) {
      newBookmarks.delete(ayahNumber);
    } else {
      newBookmarks.add(ayahNumber);
    }
    setBookmarkedAyahs(newBookmarks);
  };
  
  const currentReciter = TOP_RECITERS.find(r => r.id === selectedReciter);
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: surah.name,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textOnPrimary,
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      
      {/* Header */}
      <LinearGradient colors={Colors.gradients.islamic as [string, string]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.surahName}>{surah.name}</Text>
          <Text style={styles.surahArabicName}>{surah.arabicName}</Text>
          <Text style={styles.surahInfo}>
            {surah.englishName} • {surah.ayahs} verses • {surah.revelationType}
          </Text>
          <Text style={styles.reciterInfo}>
            Reciter: {currentReciter?.name || 'Sheikh Almatroud'}
          </Text>
        </View>
      </LinearGradient>
      
      {/* Main Controls */}
      <View style={styles.mainControls}>
        <TouchableOpacity
          style={styles.playWholeSurahButton}
          onPress={handlePlayWholeSurah}
          disabled={audioPlayer.isLoading}
        >
          <LinearGradient
            colors={Colors.gradients.islamic as [string, string]}
            style={styles.playWholeSurahGradient}
          >
            {audioPlayer.isPlaying && audioPlayer.playbackMode === 'continuous' ? (
              <Pause size={24} color={Colors.textOnPrimary} />
            ) : (
              <Play size={24} color={Colors.textOnPrimary} />
            )}
            <Text style={styles.playWholeSurahText}>
              {audioPlayer.isLoading ? 'Loading...' : 'Play Whole Surah'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(!showSettings)}
        >
          <Settings size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Playback Status */}
      {audioPlayer.isPlaying && (
        <View style={styles.playbackStatus}>
          <Text style={styles.playbackStatusText}>
            Playing: Ayah {audioPlayer.currentAyah} 
            {audioPlayer.playbackMode === 'continuous' && ' (Continuous)'}
            {audioPlayer.playbackMode === 'range' && ` (Range ${audioPlayer.rangeStart}-${audioPlayer.rangeEnd})`}
          </Text>
          <TouchableOpacity onPress={audioPlayer.stopPlayback} style={styles.stopButton}>
            <Square size={16} color={Colors.error} fill={Colors.error} />
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Settings Panel */}
      {showSettings && (
        <View style={styles.settingsPanel}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Playback Mode:</Text>
            <View style={styles.settingButtons}>
              {(['single', 'continuous', 'range'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.settingButton,
                    audioPlayer.playbackMode === mode && styles.settingButtonActive
                  ]}
                  onPress={() => audioPlayer.setPlaybackMode(mode)}
                >
                  <Text style={[
                    styles.settingButtonText,
                    audioPlayer.playbackMode === mode && styles.settingButtonTextActive
                  ]}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Repeat Count: {audioPlayer.repeatCount}x</Text>
            <View style={styles.settingButtons}>
              {[1, 2, 3, 5, 10].map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.settingButton,
                    audioPlayer.repeatCount === count && styles.settingButtonActive
                  ]}
                  onPress={() => audioPlayer.setRepeatCount(count)}
                >
                  <Text style={[
                    styles.settingButtonText,
                    audioPlayer.repeatCount === count && styles.settingButtonTextActive
                  ]}>
                    {count}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Pause Between Ayahs: {audioPlayer.pauseBetweenAyahs}s</Text>
            <View style={styles.settingButtons}>
              {[0, 1, 2, 3, 5].map((seconds) => (
                <TouchableOpacity
                  key={seconds}
                  style={[
                    styles.settingButton,
                    audioPlayer.pauseBetweenAyahs === seconds && styles.settingButtonActive
                  ]}
                  onPress={() => audioPlayer.setPauseBetweenAyahs(seconds)}
                >
                  <Text style={[
                    styles.settingButtonText,
                    audioPlayer.pauseBetweenAyahs === seconds && styles.settingButtonTextActive
                  ]}>
                    {seconds}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.settingRow}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => audioPlayer.setAutoScroll(!audioPlayer.autoScroll)}
            >
              <Text style={styles.settingLabel}>Auto-scroll: </Text>
              <Text style={[
                styles.toggleText,
                audioPlayer.autoScroll ? styles.toggleTextActive : styles.toggleTextInactive
              ]}>
                {audioPlayer.autoScroll ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingRow}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowTransliteration(!showTransliteration)}
            >
              <Text style={styles.settingLabel}>Transliteration: </Text>
              <Text style={[
                styles.toggleText,
                showTransliteration ? styles.toggleTextActive : styles.toggleTextInactive
              ]}>
                {showTransliteration ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Audio Controls */}
      {audioPlayer.isPlaying && (
        <View style={styles.audioControls}>
          <TouchableOpacity onPress={audioPlayer.playPrevious} style={styles.controlButton}>
            <SkipBack size={20} color={Colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={audioPlayer.isPlaying ? audioPlayer.pausePlayback : audioPlayer.resumePlayback}
            style={styles.controlButton}
          >
            {audioPlayer.isPlaying ? (
              <Pause size={20} color={Colors.primary} />
            ) : (
              <Play size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={audioPlayer.playNext} style={styles.controlButton}>
            <SkipForward size={20} color={Colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.repeatIndicator}>
            <Repeat size={16} color={Colors.textSecondary} />
            <Text style={styles.repeatText}>{audioPlayer.currentRepeat + 1}/{audioPlayer.repeatCount}</Text>
          </View>
        </View>
      )}
      
      {/* Ayahs List */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {surah.verses.map((ayah: Ayah) => (
          <View 
            key={ayah.number} 
            style={[
              styles.ayahCard,
              audioPlayer.currentAyah === ayah.number && styles.ayahCardActive
            ]}
          >
            <View style={styles.ayahHeader}>
              <View style={styles.ayahNumber}>
                <Text style={styles.ayahNumberText}>{ayah.number}</Text>
              </View>
              
              <View style={styles.ayahActions}>
                <TouchableOpacity
                  onPress={() => toggleBookmark(ayah.number)}
                  style={styles.actionButton}
                >
                  {bookmarkedAyahs.has(ayah.number) ? (
                    <BookmarkCheck size={20} color={Colors.islamicGold} />
                  ) : (
                    <Bookmark size={20} color={Colors.textLight} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => handlePlayAyah(ayah.number)}
                  style={styles.actionButton}
                  disabled={audioPlayer.isLoading}
                >
                  <Volume2 size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.ayahArabicText}>{ayah.text}</Text>
            
            {showTransliteration && ayah.transliteration && (
              <Text style={styles.ayahTransliteration}>{ayah.transliteration}</Text>
            )}
            
            <Text style={styles.ayahTranslation}>{ayah.translation}</Text>
            
            <View style={styles.ayahMeta}>
              <Text style={styles.metaText}>Juz {ayah.juz} • Hizb {ayah.hizb}</Text>
            </View>
          </View>
        ))}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>End of Surah {surah.name}</Text>
          <Text style={styles.footerSubtext}>{surah.englishName}</Text>
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
  errorText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  surahName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  surahArabicName: {
    fontSize: 28,
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  surahInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 4,
  },
  reciterInfo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
    gap: 12,
  },
  playWholeSurahButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  playWholeSurahGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  playWholeSurahText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playbackStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.primaryOverlay,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  playbackStatusText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  stopButtonText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
  },
  settingsPanel: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
    gap: 16,
  },
  settingRow: {
    gap: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  settingButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  settingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  settingButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  settingButtonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  settingButtonTextActive: {
    color: Colors.textOnPrimary,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: Colors.primary,
  },
  toggleTextInactive: {
    color: Colors.textLight,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
    gap: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
  },
  repeatText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  ayahCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.surfaceVariant,
  },
  ayahCardActive: {
    borderLeftColor: Colors.islamicGold,
    backgroundColor: Colors.primaryOverlay,
  },
  ayahHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ayahNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  ayahNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  ayahActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayahArabicText: {
    fontSize: 22,
    lineHeight: 36,
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 12,
    fontWeight: '500',
  },
  ayahTransliteration: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  ayahTranslation: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  ayahMeta: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: 20,
  },
  footerText: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
});