import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Book, MapPin, Volume2, RefreshCw } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { SURAHS } from '@/constants/quran-data';
import { offlineService } from '@/services/offline-service';

export default function SurahsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'meccan' | 'medinan'>('all');
  const [filteredSurahs, setFilteredSurahs] = useState<any[]>([]);
  const [surahs, setSurahs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioPlayer = useAudioPlayer();
  const surahsQuery = trpc.quran.surahs.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Load surahs data with fallback to local data
  useEffect(() => {
    const loadSurahs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to get data from tRPC first
        if (surahsQuery.data) {
          setSurahs(surahsQuery.data);
        } else if (surahsQuery.error) {
          // Fallback to offline service
          console.log('tRPC failed, using offline service');
          const offlineSurahs = await offlineService.getAllSurahs();
          setSurahs(offlineSurahs || SURAHS);
        } else {
          // Use local data as immediate fallback
          setSurahs(SURAHS);
        }
      } catch (err) {
        console.error('Error loading surahs:', err);
        setError('Failed to load surahs');
        // Final fallback to local data
        setSurahs(SURAHS);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSurahs();
  }, [surahsQuery.data, surahsQuery.error]);

  // Filter surahs based on search and filter
  useEffect(() => {
    if (!surahs.length) return;
    
    const filtered = surahs.filter((surah: any) => {
      // Handle both API format and local format
      const name = surah.name_simple || surah.name || surah.englishName || '';
      const translatedName = surah.translated_name?.name || surah.englishNameTranslation || '';
      const arabicName = surah.name_arabic || surah.arabicName || '';
      
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           translatedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           arabicName.includes(searchQuery);
      
      const revelationPlace = surah.revelation_place || surah.revelationType;
      const matchesFilter = filter === 'all' || 
                           (filter === 'meccan' && (revelationPlace === 'makkah' || revelationPlace === 'Meccan')) ||
                           (filter === 'medinan' && (revelationPlace === 'madinah' || revelationPlace === 'Medinan'));
      
      return matchesSearch && matchesFilter;
    });
    
    setFilteredSurahs(filtered);
  }, [searchQuery, filter, surahs]);

  const totalAyahs = 6236;
  

  
  const handlePlaySurah = async (surahId: number, totalAyahs: number) => {
    try {
      await audioPlayer.playWholeSurah(surahId, totalAyahs);
    } catch (error) {
      console.error('Error playing surah:', error);
      Alert.alert('Error', 'Failed to play surah. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Colors.gradients.islamic as [string, string]} style={styles.header}>
        <View style={styles.headerContent}>
          <Book size={28} color={Colors.textOnPrimary} />
          <Text style={styles.title}>Holy Qur&apos;an</Text>
          <Text style={styles.subtitle}>114 Surahs • {totalAyahs.toLocaleString()} Ayahs</Text>
        </View>
      </LinearGradient>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search surahs..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filterContainer}>
          {(['all', 'meccan', 'medinan'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
              onPress={() => setFilter(filterType)}
            >
              <Text style={[styles.filterText, filter === filterType && styles.filterTextActive]}>
                {filterType === 'all' ? 'All' : filterType === 'meccan' ? 'Meccan' : 'Medinan'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Surahs List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <RefreshCw size={48} color={Colors.primary} />
            <Text style={styles.loadingText}>Loading Surahs...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => {
                setError(null);
                surahsQuery.refetch();
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredSurahs.map((surah) => (
          <TouchableOpacity
            key={surah.id}
            style={styles.surahCard}
            onPress={() => router.push(`/surah/${surah.id || surah.number}` as any)}
            activeOpacity={0.8}
          >
            <View style={styles.surahNumber}>
              <Text style={styles.surahNumberText}>{surah.id || surah.number}</Text>
            </View>
            
            <View style={styles.surahInfo}>
              <View style={styles.surahTitleRow}>
                <Text style={styles.surahName}>{surah.name_simple || surah.name || surah.englishName}</Text>
                <Text style={styles.surahArabicName}>{surah.name_arabic || surah.arabicName}</Text>
              </View>
              <Text style={styles.surahEnglishName}>{surah.translated_name?.name || surah.englishNameTranslation}</Text>
              
              <View style={styles.surahMeta}>
                <View style={styles.metaItem}>
                  <Book size={14} color={Colors.textLight} />
                  <Text style={styles.metaText}>{surah.verses_count || surah.numberOfAyahs} verses</Text>
                </View>
                <View style={styles.metaItem}>
                  <MapPin size={14} color={Colors.textLight} />
                  <Text style={styles.metaText}>
                    {(surah.revelation_place === 'makkah' || surah.revelationType === 'Meccan') ? 'Meccan' : 'Medinan'}
                  </Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.playButton}
              onPress={(e) => {
                e.stopPropagation();
                handlePlaySurah(surah.id || surah.number, surah.verses_count || surah.numberOfAyahs);
              }}
              disabled={audioPlayer.isLoading}
            >
              <LinearGradient
                colors={Colors.gradients.islamic as [string, string]}
                style={styles.playGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Volume2 size={20} color={Colors.textOnPrimary} />
              </LinearGradient>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>&quot;Read in the name of your Lord who created&quot;</Text>
          <Text style={styles.footerSubtext}>- Quran 96:1</Text>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceVariant,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.textOnPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  surahCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderLeftColor: Colors.islamicGold,
    gap: 16,
  },
  surahNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  surahNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  surahInfo: {
    flex: 1,
  },
  surahTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  surahName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  surahArabicName: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '600',
  },
  surahEnglishName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  surahMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  playButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  playGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },
});