import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { BookOpen, User, Star, ChevronRight } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

interface Hadith {
  id: number;
  number: number;
  arab: string;
  translation: string;
  narrator: string;
  grade: string;
  book: string;
  chapter: string;
}

export default function HadithCollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [page, setPage] = useState<number>(1);
  const [allHadiths, setAllHadiths] = useState<Hadith[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const hadithsQuery = trpc.hadith.getHadiths.useQuery(
    { collection: id || 'bukhari', page, limit: 50 },
    {
      enabled: !!id,
    }
  );

  // Handle data updates
  React.useEffect(() => {
    if (hadithsQuery.data) {
      if (page === 1) {
        // Reset for first page
        setAllHadiths(hadithsQuery.data.hadiths);
      } else {
        // Append new hadiths for subsequent pages
        setAllHadiths(prev => {
          const existingNumbers = new Set(prev.map(h => h.number));
          const newHadiths = hadithsQuery.data.hadiths.filter(h => !existingNumbers.has(h.number));
          // Combine and sort by hadith number to maintain sequential order
          return [...prev, ...newHadiths].sort((a, b) => a.number - b.number);
        });
      }
      setHasMore(hadithsQuery.data.hasMore);
      console.log(`Loaded page ${page}, total hadiths: ${page === 1 ? hadithsQuery.data.hadiths.length : allHadiths.length + hadithsQuery.data.hadiths.length}`);
    }
  }, [hadithsQuery.data, page]);

  // Handle errors
  React.useEffect(() => {
    if (hadithsQuery.error) {
      Alert.alert('Error', hadithsQuery.error.message);
    }
  }, [hadithsQuery.error]);

  const getCollectionName = (collectionId: string) => {
    const collections: Record<string, string> = {
      bukhari: 'Sahih al-Bukhari',
      muslim: 'Sahih Muslim',
      abudawud: 'Sunan Abu Dawud',
      tirmidhi: 'Jami at-Tirmidhi',
      nasai: 'Sunan an-Nasai',
      ibnmajah: 'Sunan Ibn Majah',
    };
    return collections[collectionId] || 'Hadith Collection';
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toLowerCase()) {
      case 'sahih':
        return '#22c55e';
      case 'hasan':
        return '#f59e0b';
      case 'daif':
      case 'weak':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const loadMore = () => {
    if (!hadithsQuery.isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const renderHadith = (hadith: Hadith, index: number) => (
    <View key={`${hadith.id}-${index}`} style={styles.hadithCard}>
      <View style={styles.hadithHeader}>
        <View style={styles.hadithNumberContainer}>
          <Text style={styles.hadithSequence}>{index + 1}</Text>
          <Text style={styles.hadithOriginalNumber}>#{hadith.number}</Text>
        </View>
        <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(hadith.grade) }]}>
          <Star size={12} color="#ffffff" />
          <Text style={styles.gradeText}>{hadith.grade}</Text>
        </View>
      </View>
      
      <Text style={styles.arabicText}>{hadith.arab}</Text>
      <Text style={styles.translationText}>{hadith.translation}</Text>
      
      <View style={styles.hadithFooter}>
        <View style={styles.narratorInfo}>
          <User size={14} color="#9ca3af" />
          <Text style={styles.narratorText}>{hadith.narrator}</Text>
        </View>
        {hadith.book && (
          <View style={styles.bookInfo}>
            <BookOpen size={14} color="#9ca3af" />
            <Text style={styles.bookText}>{hadith.book}</Text>
          </View>
        )}
        {hadith.chapter && (
          <Text style={styles.chapterText}>{hadith.chapter}</Text>
        )}
      </View>
    </View>
  );

  if (hadithsQuery.isLoading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: getCollectionName(id || ''),
            headerStyle: { backgroundColor: '#1f2937' },
            headerTintColor: '#f9fafb',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d4af37" />
          <Text style={styles.loadingText}>Loading hadiths...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: getCollectionName(id || ''),
          headerStyle: { backgroundColor: '#1f2937' },
          headerTintColor: '#f9fafb',
        }}
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <BookOpen size={32} color="#d4af37" />
          <Text style={styles.title}>{getCollectionName(id || '')}</Text>
          <Text style={styles.subtitle}>
            {allHadiths.length} hadiths loaded
          </Text>
        </View>

        <View style={styles.hadithsList}>
          {allHadiths.map((hadith, index) => renderHadith(hadith, index))}
        </View>

        {hasMore && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={loadMore}
            disabled={hadithsQuery.isLoading}
          >
            {hadithsQuery.isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <ChevronRight size={20} color="#ffffff" />
            )}
            <Text style={styles.loadMoreText}>
              {hadithsQuery.isLoading ? 'Loading...' : 'Load More'}
            </Text>
          </TouchableOpacity>
        )}

        {!hasMore && allHadiths.length > 0 && (
          <View style={styles.endMessage}>
            <Text style={styles.endMessageText}>
              You&apos;ve reached the end of this collection
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#d1d5db',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f9fafb',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 4,
  },
  hadithsList: {
    gap: 16,
  },
  hadithCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  hadithHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hadithNumber: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  hadithNumberContainer: {
    alignItems: 'flex-start',
    gap: 2,
  },
  hadithSequence: {
    fontSize: 16,
    color: '#d4af37',
    fontWeight: 'bold',
  },
  hadithOriginalNumber: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  gradeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  arabicText: {
    fontSize: 18,
    color: '#f9fafb',
    textAlign: 'right',
    lineHeight: 28,
    marginBottom: 12,
    fontFamily: 'System',
  },
  translationText: {
    fontSize: 16,
    color: '#d1d5db',
    lineHeight: 24,
    marginBottom: 16,
  },
  hadithFooter: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 12,
    gap: 8,
  },
  narratorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  narratorText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  bookInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  chapterText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  loadMoreButton: {
    backgroundColor: '#d4af37',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  loadMoreText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  endMessage: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  endMessageText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
});