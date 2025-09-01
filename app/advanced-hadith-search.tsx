import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Filter, BookOpen, User } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';

interface SearchFilters {
  collection: string;
  narrator: string;
  topic: string;
  grade: string;
}

interface HadithResult {
  id: number;
  arab: string;
  translation: string;
  narrator: string;
  grade: string;
  collection: string;
  reference: string;
}

export default function AdvancedHadithSearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    collection: '',
    narrator: '',
    topic: '',
    grade: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<HadithResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchHadiths = async (query: string, collection?: string) => {
    try {
      setIsLoading(true);
      setHasSearched(false);
      
      // Enhanced mock search results with more variety
      const allMockResults: HadithResult[] = [
        {
          id: 1,
          arab: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
          translation: 'Actions are but by intention and every man shall have only that which he intended.',
          narrator: 'Umar ibn al-Khattab',
          grade: 'Sahih',
          collection: 'Sahih al-Bukhari',
          reference: 'Book 1, Hadith 1'
        },
        {
          id: 2,
          arab: 'الإِسْلاَمُ أَنْ تَشْهَدَ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ',
          translation: 'Islam is to testify that there is no god but Allah and Muhammad is the Messenger of Allah.',
          narrator: 'Abdullah ibn Umar',
          grade: 'Sahih',
          collection: 'Sahih Muslim',
          reference: 'Book 1, Hadith 8'
        },
        {
          id: 3,
          arab: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
          translation: 'Whoever believes in Allah and the Last Day should speak good or remain silent.',
          narrator: 'Abu Hurairah',
          grade: 'Sahih',
          collection: 'Sahih al-Bukhari',
          reference: 'Book 78, Hadith 136'
        },
        {
          id: 4,
          arab: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
          translation: 'A Muslim is one from whose tongue and hand the Muslims are safe.',
          narrator: 'Abdullah ibn Amr',
          grade: 'Sahih',
          collection: 'Sahih Muslim',
          reference: 'Book 1, Hadith 65'
        },
        {
          id: 5,
          arab: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
          translation: 'None of you believes until he loves for his brother what he loves for himself.',
          narrator: 'Anas ibn Malik',
          grade: 'Sahih',
          collection: 'Sahih al-Bukhari',
          reference: 'Book 2, Hadith 12'
        },
        {
          id: 6,
          arab: 'الدِّينُ النَّصِيحَةُ',
          translation: 'Religion is sincere advice.',
          narrator: 'Tamim ad-Dari',
          grade: 'Sahih',
          collection: 'Sahih Muslim',
          reference: 'Book 1, Hadith 95'
        },
        {
          id: 7,
          arab: 'مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ',
          translation: 'Whoever prays the two cool prayers (Fajr and Asr) will enter Paradise.',
          narrator: 'Abu Musa al-Ashari',
          grade: 'Sahih',
          collection: 'Sahih al-Bukhari',
          reference: 'Book 9, Hadith 41'
        },
        {
          id: 8,
          arab: 'الطَّهُورُ شَطْرُ الإِيمَانِ',
          translation: 'Cleanliness is half of faith.',
          narrator: 'Abu Malik al-Ashari',
          grade: 'Sahih',
          collection: 'Sahih Muslim',
          reference: 'Book 2, Hadith 1'
        }
      ];
      
      // Filter results based on query and collection
      let filteredResults = allMockResults.filter(hadith => {
        const matchesQuery = hadith.translation.toLowerCase().includes(query.toLowerCase()) ||
                           hadith.arab.includes(query) ||
                           hadith.narrator.toLowerCase().includes(query.toLowerCase());
        
        const matchesCollection = !filters.collection || 
                                 hadith.collection.toLowerCase().includes(filters.collection.toLowerCase());
        
        const matchesGrade = !filters.grade || hadith.grade === filters.grade;
        
        return matchesQuery && matchesCollection && matchesGrade;
      });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSearchResults(filteredResults);
      setIsLoading(false);
      setHasSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      setIsLoading(false);
      setHasSearched(true);
      Alert.alert('Search Error', 'Failed to search hadiths. Please try again.');
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Input Required', 'Please enter a search term.');
      return;
    }

    setIsLoading(true);
    setHasSearched(false);
    searchHadiths(searchQuery.trim(), filters.collection || undefined);
  };

  const resetFilters = () => {
    setFilters({
      collection: '',
      narrator: '',
      topic: '',
      grade: ''
    });
  };

  const collections = [
    { id: 'bukhari', name: 'Sahih al-Bukhari' },
    { id: 'muslim', name: 'Sahih Muslim' },
    { id: 'abudawud', name: 'Sunan Abu Dawud' },
    { id: 'tirmidhi', name: 'Jami at-Tirmidhi' },
    { id: 'nasai', name: 'Sunan an-Nasa\'i' },
    { id: 'ibnmajah', name: 'Sunan Ibn Majah' }
  ];

  const grades = ['Sahih', 'Hasan', 'Daif', 'Mawdu'];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradients.accent as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Search size={28} color={Colors.textOnPrimary} />
          <Text style={styles.title}>Advanced Hadith Search</Text>
          <Text style={styles.subtitle}>Search by topic, narrator, or collection</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Input */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Search size={20} color={Colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search hadiths by keyword, topic, or content..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={styles.filterToggle}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color={Colors.primary} />
            <Text style={styles.filterToggleText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersSection}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Collection</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[styles.filterButton, !filters.collection && styles.filterButtonActive]}
                    onPress={() => setFilters(prev => ({ ...prev, collection: '' }))}
                  >
                    <Text style={[styles.filterButtonText, !filters.collection && styles.filterButtonTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {collections.map((collection) => (
                    <TouchableOpacity
                      key={collection.id}
                      style={[styles.filterButton, filters.collection === collection.id && styles.filterButtonActive]}
                      onPress={() => setFilters(prev => ({ ...prev, collection: collection.id }))}
                    >
                      <Text style={[styles.filterButtonText, filters.collection === collection.id && styles.filterButtonTextActive]}>
                        {collection.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Grade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[styles.filterButton, !filters.grade && styles.filterButtonActive]}
                    onPress={() => setFilters(prev => ({ ...prev, grade: '' }))}
                  >
                    <Text style={[styles.filterButtonText, !filters.grade && styles.filterButtonTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {grades.map((grade) => (
                    <TouchableOpacity
                      key={grade}
                      style={[styles.filterButton, filters.grade === grade && styles.filterButtonActive]}
                      onPress={() => setFilters(prev => ({ ...prev, grade: grade }))}
                    >
                      <Text style={[styles.filterButtonText, filters.grade === grade && styles.filterButtonTextActive]}>
                        {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity style={styles.resetFiltersButton} onPress={resetFilters}>
              <Text style={styles.resetFiltersText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Button */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isLoading}
        >
          <LinearGradient
            colors={Colors.gradients.primary as [string, string]}
            style={styles.searchGradient}
          >
            <Search size={20} color={Colors.textOnPrimary} />
            <Text style={styles.searchButtonText}>
              {isLoading ? 'Searching...' : 'Search Hadiths'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Results */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Searching hadiths...</Text>
          </View>
        )}

        {!isLoading && hasSearched && searchResults.length === 0 && (
          <View style={styles.noResultsContainer}>
            <BookOpen size={48} color={Colors.textLight} />
            <Text style={styles.noResultsTitle}>No hadiths found</Text>
            <Text style={styles.noResultsText}>
              Try different keywords or adjust your filters
            </Text>
          </View>
        )}

        {!isLoading && searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsHeader}>
              {searchResults.length} hadith{searchResults.length !== 1 ? 's' : ''} found
            </Text>
            {searchResults.map((hadith, index) => (
              <View key={hadith.id} style={styles.hadithCard}>
                <View style={styles.hadithHeader}>
                  <View style={styles.hadithMeta}>
                    <Text style={styles.hadithCollection}>{hadith.collection}</Text>
                    <View style={[
                      styles.gradeBadge,
                      hadith.grade === 'Sahih' && styles.sahihBadge,
                      hadith.grade === 'Hasan' && styles.hasanBadge,
                      hadith.grade === 'Daif' && styles.daifBadge
                    ]}>
                      <Text style={styles.gradeText}>{hadith.grade}</Text>
                    </View>
                  </View>
                  <Text style={styles.hadithReference}>{hadith.reference}</Text>
                </View>

                <Text style={styles.hadithArabic}>{hadith.arab}</Text>
                <Text style={styles.hadithTranslation}>{hadith.translation}</Text>

                <View style={styles.hadithFooter}>
                  <View style={styles.narratorInfo}>
                    <User size={14} color={Colors.textLight} />
                    <Text style={styles.narratorText}>Narrated by: {hadith.narrator}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Search Tips */}
        {!hasSearched && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Search Tips</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>• Use specific keywords for better results</Text>
              <Text style={styles.tipItem}>• Filter by collection to narrow down results</Text>
              <Text style={styles.tipItem}>• Search in both Arabic and English</Text>
              <Text style={styles.tipItem}>• Use grade filters to find authentic hadiths</Text>
            </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  filterToggleText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  filtersSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: Colors.textOnPrimary,
  },
  resetFiltersButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resetFiltersText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  searchButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
    marginBottom: 24,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  hadithCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  hadithHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hadithMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hadithCollection: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sahihBadge: {
    backgroundColor: Colors.success,
  },
  hasanBadge: {
    backgroundColor: '#f59e0b',
  },
  daifBadge: {
    backgroundColor: '#ef4444',
  },
  gradeText: {
    fontSize: 10,
    color: Colors.textOnPrimary,
    fontWeight: 'bold',
  },
  hadithReference: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  hadithArabic: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'right',
    lineHeight: 28,
    marginBottom: 8,
    fontWeight: '500',
  },
  hadithTranslation: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
  },
  hadithFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
  },
  narratorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  narratorText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  tipsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});