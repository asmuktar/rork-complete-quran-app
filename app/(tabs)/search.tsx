import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, Alert, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Mic, MicOff, Volume2, BookOpen, User, Loader, Play, Pause } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Audio } from 'expo-av';
import quranApi from '@/services/quran-api';
import { SURAHS, searchSurahs } from '@/constants/quran-data';

const { width } = Dimensions.get('window');

interface SearchResult {
  id: string;
  type: 'ayah' | 'surah' | 'reciter';
  title: string;
  subtitle?: string;
  description?: string;
  arabicText?: string;
  translation?: string;
  surahNumber?: number;
  ayahNumber?: number;
  reciterName?: string;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-stop recording after 10 seconds
  const RECORDING_DURATION = 10000;
  
  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isRecording) pulse();
        });
      };
      pulse();
      
      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= RECORDING_DURATION / 1000) {
            handleVoiceSearch(); // Auto-stop
            return 0;
          }
          return prev + 1;
        });
      }, 1000) as any;
      
      // Auto-stop after duration
      timerRef.current = setTimeout(() => {
        if (isRecording) {
          handleVoiceSearch();
        }
      }, RECORDING_DURATION) as any;
    } else {
      // Reset animation
      pulseAnim.setValue(1);
      setRecordingTime(0);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isRecording, pulseAnim]);

  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    // Simulate search delay
    setTimeout(() => {
      const results: SearchResult[] = [];
      const lowercaseQuery = query.toLowerCase();

      // Search surahs
      const surahResults = searchSurahs(query);
      surahResults.slice(0, 3).forEach(surah => {
        results.push({
          id: `surah-${surah.id}`,
          type: 'surah',
          title: surah.name,
          subtitle: surah.englishName,
          description: `${surah.ayahs} verses • ${surah.revelationType}`,
          surahNumber: surah.id,
        });
      });

      // Mock Quran search results
      if (lowercaseQuery.includes('bismillah') || lowercaseQuery.includes('بسم')) {
        results.push({
          id: 'ayah-1-1',
          type: 'ayah',
          title: 'Al-Fatihah 1:1',
          arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
          surahNumber: 1,
          ayahNumber: 1,
        });
      }

      if (lowercaseQuery.includes('allah') || lowercaseQuery.includes('الله')) {
        results.push(
          {
            id: 'ayah-2-255',
            type: 'ayah',
            title: 'Al-Baqarah 2:255',
            arabicText: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
            translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence.',
            surahNumber: 2,
            ayahNumber: 255,
          },
          {
            id: 'ayah-112-1',
            type: 'ayah',
            title: 'Al-Ikhlas 112:1',
            arabicText: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
            translation: 'Say, "He is Allah, [who is] One,"',
            surahNumber: 112,
            ayahNumber: 1,
          }
        );
      }

      // Mock surah results
      if (lowercaseQuery.includes('fatihah') || lowercaseQuery.includes('فاتحة')) {
        results.push({
          id: 'surah-1',
          type: 'surah',
          title: 'Al-Fatihah',
          subtitle: 'The Opening',
          description: '7 verses • Meccan',
          surahNumber: 1,
        });
      }

      setSearchResults(results);
      setIsLoading(false);
    }, 800);
  }, []);

  const handleVoiceSearch = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsProcessing(true);
      
      try {
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          
          if (uri) {
            // Process the audio with STT API
            const formData = new FormData();
            
            if (Platform.OS === 'web') {
              // Web implementation would need MediaRecorder API
              Alert.alert('Voice Search', 'Voice search is not available on web. Please use text search.');
              setIsProcessing(false);
              return;
            } else {
              // Mobile implementation
              const uriParts = uri.split('.');
              const fileType = uriParts[uriParts.length - 1];
              
              const audioFile = {
                uri,
                name: `recording.${fileType}`,
                type: `audio/${fileType}`
              } as any;
              
              formData.append('audio', audioFile);
            }
            
            try {
              const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
                method: 'POST',
                body: formData,
              });
              
              if (response.ok) {
                const result = await response.json();
                const transcribedText = result.text;
                
                if (transcribedText && transcribedText.trim()) {
                  setSearchQuery(transcribedText);
                  performSearch(transcribedText);
                } else {
                  Alert.alert('Voice Search', 'Could not understand the audio. Please try again.');
                }
              } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
            } catch (fetchError) {
              console.error('Fetch error:', fetchError);
              throw new Error('Network error occurred');
            }
          }
        }
      } catch (error) {
        console.error('Voice search error:', error);
        Alert.alert('Voice Search Error', 'Failed to process voice search. Please try again.');
      } finally {
        setIsProcessing(false);
        recordingRef.current = null;
      }
    } else {
      // Start recording
      try {
        if (Platform.OS === 'web') {
          Alert.alert('Voice Search', 'Voice search is not available on web. Please use text search.');
          return;
        }
        
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant microphone permission to use voice search.');
          return;
        }
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          android: {
            extension: '.m4a',
            outputFormat: 2, // MPEG_4
            audioEncoder: 3, // AAC
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: 1, // LINEARPCM
            audioQuality: 1, // HIGH
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm;codecs=opus',
            bitsPerSecond: 128000,
          },
        });
        
        await recording.startAsync();
        recordingRef.current = recording;
        setIsRecording(true);
        setRecordingTime(0);
      } catch (error) {
        console.error('Failed to start recording:', error);
        Alert.alert('Recording Error', 'Failed to start voice recording. Please try again.');
      }
    }
  }, [isRecording, performSearch]);

  const handleTextSearch = useCallback((text: string) => {
    setSearchQuery(text);
    performSearch(text);
  }, [performSearch]);

  const renderSearchResult = (result: SearchResult) => {
    const getIcon = () => {
      switch (result.type) {
        case 'ayah':
          return <BookOpen size={20} color={Colors.primary} />;
        case 'surah':
          return <Volume2 size={20} color={Colors.secondary} />;
        case 'reciter':
          return <User size={20} color={Colors.accent} />;
        default:
          return <Search size={20} color={Colors.textLight} />;
      }
    };

    const getTypeLabel = () => {
      switch (result.type) {
        case 'ayah':
          return 'Ayah';
        case 'surah':
          return 'Surah';
        case 'reciter':
          return 'Reciter';
        default:
          return '';
      }
    };

    return (
      <TouchableOpacity key={result.id} style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <View style={styles.resultIcon}>
            {getIcon()}
          </View>
          <View style={styles.resultContent}>
            <View style={styles.resultTitleRow}>
              <Text style={styles.resultTitle}>{result.title}</Text>
              <View style={styles.typeLabel}>
                <Text style={styles.typeLabelText}>{getTypeLabel()}</Text>
              </View>
            </View>
            {result.subtitle && (
              <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
            )}
            {result.description && (
              <Text style={styles.resultDescription}>{result.description}</Text>
            )}
          </View>
        </View>
        
        {result.arabicText && (
          <View style={styles.arabicContainer}>
            <Text style={styles.arabicText}>{result.arabicText}</Text>
            {result.translation && (
              <Text style={styles.translationText}>{result.translation}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradients.islamic as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Search size={28} color={Colors.textOnPrimary} />
          <Text style={styles.title}>Ayat Search</Text>
          <Text style={styles.subtitle}>Voice & Text Search</Text>
        </View>
      </LinearGradient>

      {/* Search Container */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={20} color={Colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search verses, surahs, reciters..."
              value={searchQuery}
              onChangeText={handleTextSearch}
              placeholderTextColor={Colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[
                styles.micButton,
                isRecording && styles.micButtonActive,
                isLoading && styles.micButtonLoading,
              ]}
              onPress={handleVoiceSearch}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader size={20} color={Colors.textOnPrimary} />
              ) : isRecording ? (
                <MicOff size={20} color={Colors.textOnPrimary} />
              ) : (
                <Mic size={20} color={isRecording ? Colors.textOnPrimary : Colors.textLight} />
              )}
            </TouchableOpacity>
          </View>
          
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Listening... Speak now</Text>
            </View>
          )}
        </View>
      </View>

      {/* Results */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading && !isRecording && (
          <View style={styles.loadingContainer}>
            <Loader size={32} color={Colors.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {!isLoading && !hasSearched && (
          <View style={styles.placeholderContainer}>
            <View style={styles.placeholderIcon}>
              <Search size={48} color={Colors.textLight} />
            </View>
            <Text style={styles.placeholderTitle}>Search the Holy Quran</Text>
            <Text style={styles.placeholderText}>
              • Type to search verses, surahs, or reciters{"\n"}
              • Use voice search by tapping the microphone{"\n"}
              • Search in Arabic or English
            </Text>
            
            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>Try searching for:</Text>
              <View style={styles.exampleTags}>
                {['Bismillah', 'Al-Fatihah', 'Ayat al-Kursi', 'Mishary'].map((example) => (
                  <TouchableOpacity
                    key={example}
                    style={styles.exampleTag}
                    onPress={() => handleTextSearch(example)}
                  >
                    <Text style={styles.exampleTagText}>{example}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {!isLoading && hasSearched && searchResults.length === 0 && (
          <View style={styles.noResultsContainer}>
            <BookOpen size={48} color={Colors.textLight} />
            <Text style={styles.noResultsTitle}>No results found</Text>
            <Text style={styles.noResultsText}>
              Try different keywords or check your spelling
            </Text>
          </View>
        )}

        {!isLoading && searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsHeader}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </Text>
            {searchResults.map(renderSearchResult)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  searchSection: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchContainer: {
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 1,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '400',
  },
  micButton: {
    padding: 10,
    borderRadius: 22,
    backgroundColor: Colors.surfaceVariant,
    marginLeft: 8,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  micButtonActive: {
    backgroundColor: Colors.error,
  },
  micButtonLoading: {
    backgroundColor: Colors.primary,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  recordingText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  placeholderIcon: {
    marginBottom: 20,
    opacity: 0.5,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  examplesContainer: {
    alignItems: 'center',
    width: '100%',
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  exampleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  exampleTag: {
    backgroundColor: Colors.primaryOverlay,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  exampleTagText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
    gap: 16,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  resultsContainer: {
    padding: 20,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.islamicGold,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  typeLabel: {
    backgroundColor: Colors.secondaryOverlay,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
  },
  resultSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  resultDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  arabicContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
  },
  arabicText: {
    fontSize: 20,
    color: Colors.primary,
    textAlign: 'right',
    lineHeight: 32,
    marginBottom: 8,
    fontWeight: '500',
  },
  translationText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});