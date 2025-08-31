import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, BookmarkCheck, Volume2, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

interface BookmarkedAyah {
  id: string;
  surahId: number;
  surahName: string;
  surahArabicName: string;
  ayahNumber: number;
  ayahText: string;
  translation: string;
  dateBookmarked: Date;
}

// Mock bookmarked ayahs - in real app, this would come from AsyncStorage
const mockBookmarks: BookmarkedAyah[] = [
  {
    id: '1-1',
    surahId: 1,
    surahName: 'Al-Fatihah',
    surahArabicName: 'الفاتحة',
    ayahNumber: 1,
    ayahText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
    dateBookmarked: new Date('2024-01-15'),
  },
  {
    id: '2-255',
    surahId: 2,
    surahName: 'Al-Baqarah',
    surahArabicName: 'البقرة',
    ayahNumber: 255,
    ayahText: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
    translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence.',
    dateBookmarked: new Date('2024-01-10'),
  },
  {
    id: '36-1',
    surahId: 36,
    surahName: 'Ya-Sin',
    surahArabicName: 'يس',
    ayahNumber: 1,
    ayahText: 'يس',
    translation: 'Ya-Seen.',
    dateBookmarked: new Date('2024-01-05'),
  },
];

export default function BookmarksScreen() {
  const [bookmarks, setBookmarks] = useState<BookmarkedAyah[]>(mockBookmarks);
  // const [searchQuery, setSearchQuery] = useState('');

  const filteredBookmarks = bookmarks; // TODO: Add search functionality

  const removeBookmark = (bookmarkId: string) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
  };

  const navigateToAyah = (surahId: number, ayahNumber: number) => {
    router.push(`/surah/${surahId}?ayah=${ayahNumber}` as any);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Colors.gradients.islamic as [string, string]} style={styles.header}>
        <View style={styles.headerContent}>
          <Bookmark size={28} color={Colors.textOnPrimary} />
          <Text style={styles.title}>Bookmarks</Text>
          <Text style={styles.subtitle}>
            {bookmarks.length} saved {bookmarks.length === 1 ? 'ayah' : 'ayahs'}
          </Text>
        </View>
      </LinearGradient>

      {bookmarks.length === 0 ? (
        <View style={styles.emptyState}>
          <BookmarkCheck size={64} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
          <Text style={styles.emptyDescription}>
            Start bookmarking your favorite ayahs while reading the Quran. 
            They will appear here for easy access.
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/surahs' as any)}
          >
            <LinearGradient
              colors={Colors.gradients.islamic as [string, string]}
              style={styles.exploreGradient}
            >
              <Text style={styles.exploreButtonText}>Explore Quran</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={Colors.gradients.primary as [string, string]}
                style={styles.statGradient}
              >
                <Text style={styles.statNumber}>{bookmarks.length}</Text>
                <Text style={styles.statLabel}>Bookmarks</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={Colors.gradients.accent as [string, string]}
                style={styles.statGradient}
              >
                <Text style={styles.statNumber}>
                  {new Set(bookmarks.map(b => b.surahId)).size}
                </Text>
                <Text style={styles.statLabel}>Surahs</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={Colors.gradients.sunset as [string, string]}
                style={styles.statGradient}
              >
                <Text style={styles.statNumber}>
                  {bookmarks.length > 0 ? Math.ceil((Date.now() - Math.min(...bookmarks.map(b => b.dateBookmarked.getTime()))) / (1000 * 60 * 60 * 24)) : 0}
                </Text>
                <Text style={styles.statLabel}>Days</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Bookmarks List */}
          <View style={styles.bookmarksSection}>
            <Text style={styles.sectionTitle}>Your Bookmarks</Text>
            {filteredBookmarks.map((bookmark) => (
              <View key={bookmark.id} style={styles.bookmarkCard}>
                <TouchableOpacity
                  style={styles.bookmarkContent}
                  onPress={() => navigateToAyah(bookmark.surahId, bookmark.ayahNumber)}
                  activeOpacity={0.8}
                >
                  <View style={styles.bookmarkHeader}>
                    <View style={styles.surahInfo}>
                      <Text style={styles.surahName}>{bookmark.surahName}</Text>
                      <Text style={styles.surahArabicName}>{bookmark.surahArabicName}</Text>
                    </View>
                    <View style={styles.ayahNumber}>
                      <Text style={styles.ayahNumberText}>{bookmark.ayahNumber}</Text>
                    </View>
                  </View>

                  <Text style={styles.ayahText}>{bookmark.ayahText}</Text>
                  <Text style={styles.ayahTranslation}>{bookmark.translation}</Text>

                  <View style={styles.bookmarkMeta}>
                    <Text style={styles.bookmarkDate}>
                      Saved on {formatDate(bookmark.dateBookmarked)}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.bookmarkActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {/* TODO: Play ayah */}}
                  >
                    <Volume2 size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => removeBookmark(bookmark.id)}
                  >
                    <Trash2 size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Tips</Text>
            <Text style={styles.tipsText}>
              • Tap the bookmark icon while reading any ayah to save it{'\n'}
              • Use bookmarks for memorization practice{'\n'}
              • Share your favorite verses with friends{'\n'}
              • Review bookmarks regularly for spiritual reflection
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
  &quot;And We have made the Quran easy to remember&quot;
            </Text>
            <Text style={styles.footerSubtext}>- Quran 54:17</Text>
          </View>
        </ScrollView>
      )}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  exploreButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exploreGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
  },
  bookmarksSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  bookmarkCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.islamicGold,
    overflow: 'hidden',
  },
  bookmarkContent: {
    padding: 16,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  surahArabicName: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
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
  ayahText: {
    fontSize: 20,
    lineHeight: 32,
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 12,
    fontWeight: '500',
  },
  ayahTranslation: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  bookmarkMeta: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
    paddingTop: 8,
  },
  bookmarkDate: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  bookmarkActions: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
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
});