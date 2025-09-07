import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Square, Settings, Bookmark, BookmarkCheck, Volume2, SkipBack, SkipForward, Repeat, Brain, Target, CheckCircle2, XCircle } from 'lucide-react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { TOP_RECITERS } from '@/constants/reciters';
import { HafizProvider, useHafiz } from '@/contexts/hafiz-context';
import { usePersonalization, useThemedColors, useThemedTypography } from '@/contexts/personalization-context';
import { useBookmarks } from '@/contexts/bookmark-context';
import MemoryTestModal from '@/components/MemoryTestModal';
import NetworkStatus from '@/components/NetworkStatus';
import offlineService from '@/services/offline-service';

function SurahScreenContent() {
  const { id } = useLocalSearchParams();
  const surahId = parseInt(id as string);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Fetch surah data from API
  const surahQuery = trpc.quran.surah.useQuery({ id: surahId });
  const surah = surahQuery.data;
  
  const { settings } = usePersonalization();
  const themedColors = useThemedColors();
  const typography = useThemedTypography();
  const { bookmarks, addBookmark, removeBookmark } = useBookmarks();
  
  const [showSettings, setShowSettings] = useState(false);
  const [selectedReciter, setSelectedReciter] = useState(settings.defaultReciter.toString());
  const [showReciterSelection, setShowReciterSelection] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showHafizMode, setShowHafizMode] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  const audioPlayer = useAudioPlayer();
  const { updateProgress, progress, startSession, isSessionActive } = useHafiz();
  
  useEffect(() => {
    audioPlayer.setReciter(selectedReciter);
  }, [selectedReciter, audioPlayer]);
  
  useEffect(() => {
    const checkNetwork = () => {
      setIsOnline(offlineService.getNetworkStatus());
    };
    checkNetwork();
    const interval = setInterval(checkNetwork, 10000);
    return () => clearInterval(interval);
  }, []);
  
  // Get bookmarked ayahs for this surah
  const bookmarkedAyahs = React.useMemo(() => {
    return new Set(
      bookmarks
        .filter(b => b.type === 'ayah' && (b as any).surahId === surahId)
        .map(b => (b as any).ayahNumber)
    );
  }, [bookmarks, surahId]);
  
  const handleBookmarkAyah = async (ayahNumber: number) => {
    const ayah = surah?.verses?.find((v: any) => v.verse_number === ayahNumber);
    if (!ayah || !surah) return;
    
    const bookmarkId = `ayah-${surahId}-${ayahNumber}`;
    const isBookmarked = bookmarkedAyahs.has(ayahNumber);
    
    if (isBookmarked) {
      // Find the actual bookmark to remove
      const existingBookmark = bookmarks.find(b => 
        b.type === 'ayah' && 
        (b as any).surahId === surahId && 
        (b as any).ayahNumber === ayahNumber
      );
      if (existingBookmark) {
        await removeBookmark(existingBookmark.id);
      }
    } else {
      await addBookmark({
        type: 'ayah',
        surahId: surahId,
        surahName: surah.chapter?.name_simple || `Surah ${surahId}`,
        surahArabicName: surah.chapter?.name_arabic || '',
        ayahNumber,
        ayahText: ayah.text_uthmani,
        translation: ayah.translations?.[0]?.text || '',
        tags: []
      } as any);
    }
  };
  
  const handleReciterChange = (reciterId: string) => {
    setSelectedReciter(reciterId);
    audioPlayer.setReciter(reciterId);
    setShowReciterSelection(false);
  };
  
  useEffect(() => {
    if (audioPlayer.autoScroll && audioPlayer.currentAyah && scrollViewRef.current) {
      // Auto-scroll to current ayah
      const ayahIndex = audioPlayer.currentAyah - 1;
      const estimatedPosition = ayahIndex * 150; // Rough estimate
      scrollViewRef.current.scrollTo({ y: estimatedPosition, animated: true });
    }
  }, [audioPlayer.currentAyah, audioPlayer.autoScroll]);
  
  if (surahQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Loading surah...</Text>
      </SafeAreaView>
    );
  }
  
  if (surahQuery.isError || !surah) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error loading surah: {surahQuery.error?.message || 'Unknown error'}</Text>
      </SafeAreaView>
    );
  }
  
  const handlePlayWholeSurah = async () => {
    try {
      // Stop any current playback first
      await audioPlayer.stopPlayback();
      await audioPlayer.playWholeSurah(surahId, surah.verses?.length || 0);
    } catch (error) {
      console.error('Error playing whole surah:', error);
      Alert.alert('Error', 'Failed to play surah. Please try again.');
    }
  };
  
  const handlePlayAyah = async (ayahNumber: number) => {
    try {
      // Stop any current playback first
      await audioPlayer.stopPlayback();
      await audioPlayer.playAyah(surahId, ayahNumber);
    } catch (error) {
      console.error('Error playing ayah:', error);
      Alert.alert('Error', 'Failed to play ayah. Please try again.');
    }
  };
  
  const toggleBookmark = async (ayahNumber: number) => {
    await handleBookmarkAyah(ayahNumber);
  };
  
  const currentReciter = TOP_RECITERS.find(r => r.id === selectedReciter);
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: surah.chapter?.name_simple || `Surah ${surahId}`,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textOnPrimary,
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      
      {/* Header */}
      <LinearGradient colors={Colors.gradients.islamic as [string, string]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.surahName}>{surah.chapter?.name_simple || `Surah ${surahId}`}</Text>
          <Text style={styles.surahArabicName}>{surah.chapter?.name_arabic || ''}</Text>
          <Text style={styles.surahInfo}>
            {surah.chapter?.name_simple || `Surah ${surahId}`} • {surah.chapter?.verses_count || surah.verses?.length || 0} verses • {surah.chapter?.revelation_place || 'Meccan'}
          </Text>
          <TouchableOpacity 
            style={styles.reciterSelector}
            onPress={() => setShowReciterSelection(!showReciterSelection)}
          >
            <Text style={styles.reciterInfo}>
              Reciter: {currentReciter?.name || 'Mishary Alafasy'}
            </Text>
            <Text style={styles.reciterChangeText}>Tap to change</Text>
          </TouchableOpacity>
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
      
      {/* Reciter Selection Panel */}
      {showReciterSelection && (
        <View style={styles.reciterSelectionPanel}>
          <Text style={styles.panelTitle}>Select Reciter</Text>
          <ScrollView style={styles.reciterList} showsVerticalScrollIndicator={false}>
            {TOP_RECITERS.slice(0, 10).map((reciter) => (
              <TouchableOpacity
                key={reciter.id}
                style={[
                  styles.reciterOption,
                  selectedReciter === reciter.id && styles.reciterOptionSelected
                ]}
                onPress={() => handleReciterChange(reciter.id)}
              >
                <View style={styles.reciterOptionContent}>
                  <Text style={[
                    styles.reciterOptionName,
                    selectedReciter === reciter.id && styles.reciterOptionNameSelected
                  ]}>
                    {reciter.name}
                  </Text>
                  <Text style={[
                    styles.reciterOptionArabic,
                    selectedReciter === reciter.id && styles.reciterOptionArabicSelected
                  ]}>
                    {reciter.arabicName}
                  </Text>
                  <Text style={[
                    styles.reciterOptionCountry,
                    selectedReciter === reciter.id && styles.reciterOptionCountrySelected
                  ]}>
                    {reciter.country} • {reciter.audioQuality}
                  </Text>
                </View>
                {selectedReciter === reciter.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
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
        {/* Add Basmallah for all surahs except Al-Fatihah (1) and At-Tawbah (9) */}
        {surahId !== 1 && surahId !== 9 && (
          <View style={[styles.ayahCard, styles.basmallahCard]}>
            <View style={styles.ayahHeader}>
              <View style={[styles.ayahNumber, styles.basmallahNumber]}>
                <Text style={[styles.ayahNumberText, styles.basmallahNumberText]}>
                  بسم الله
                </Text>
              </View>
            </View>
            
            <Text style={[styles.ayahArabicText, styles.basmallahText]}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
            
            <Text style={styles.ayahTranslation}>
              In the name of Allah, the Entirely Merciful, the Especially Merciful.
            </Text>
          </View>
        )}
        
        {surah.verses?.map((ayah: any) => {
          return (
            <View 
              key={`${surahId}-${ayah.verse_number}`} 
              style={[
                styles.ayahCard,
                audioPlayer.currentAyah === ayah.verse_number && styles.ayahCardActive
              ]}
            >
              <View style={styles.ayahHeader}>
                <View style={styles.ayahNumber}>
                  <Text style={styles.ayahNumberText}>
                    {ayah.verse_number}
                  </Text>
                </View>
                
                <View style={styles.ayahActions}>
                  <TouchableOpacity
                    onPress={() => toggleBookmark(ayah.verse_number)}
                    style={styles.actionButton}
                  >
                    {bookmarkedAyahs.has(ayah.verse_number) ? (
                      <BookmarkCheck size={20} color={Colors.islamicGold} />
                    ) : (
                      <Bookmark size={20} color={Colors.textLight} />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => handlePlayAyah(ayah.verse_number)}
                    style={styles.actionButton}
                    disabled={audioPlayer.isLoading}
                  >
                    <Volume2 size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.ayahArabicText}>
                {ayah.text_uthmani}
              </Text>
              
              <Text style={styles.ayahTranslation}>{ayah.translations?.[0]?.text || ''}</Text>
              
              <View style={styles.ayahMeta}>
                <Text style={styles.metaText}>Juz {ayah.juz_number || 1} • Hizb {ayah.hizb_number || 1}</Text>
              </View>
            </View>
          );
        }) || []}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>End of Surah {surah.chapter?.name_simple || `Surah ${surahId}`}</Text>
          <Text style={styles.footerSubtext}>{surah.chapter?.name_simple || `Surah ${surahId}`}</Text>
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
  basmallahCard: {
    backgroundColor: Colors.primaryOverlay,
    borderLeftColor: Colors.islamicGold,
    marginVertical: 12,
  },
  basmallahNumber: {
    backgroundColor: Colors.islamicGold,
    borderColor: Colors.islamicGold,
    minWidth: 80,
  },
  basmallahNumberText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  basmallahText: {
    fontSize: 28,
    textAlign: 'center',
    color: Colors.primary,
    fontWeight: '600',
    marginVertical: 8,
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
  reciterSelector: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  reciterChangeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  reciterSelectionPanel: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
    maxHeight: 300,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  reciterList: {
    maxHeight: 250,
  },
  reciterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reciterOptionSelected: {
    backgroundColor: Colors.primaryOverlay,
    borderColor: Colors.primary,
  },
  reciterOptionContent: {
    flex: 1,
  },
  reciterOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  reciterOptionNameSelected: {
    color: Colors.primary,
  },
  reciterOptionArabic: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
    textAlign: 'right',
  },
  reciterOptionArabicSelected: {
    color: Colors.primary,
  },
  reciterOptionCountry: {
    fontSize: 12,
    color: Colors.textLight,
  },
  reciterOptionCountrySelected: {
    color: Colors.primary,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default function SurahScreen() {
  return (
    <HafizProvider>
      <SurahScreenContent />
    </HafizProvider>
  );
}