import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, BookmarkCheck, Volume2, Trash2, Search, Filter, Plus, Heart, Brain, BookOpen, Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useBookmarks, Bookmark as BookmarkType, BookmarkCollection } from '@/contexts/bookmark-context';



export default function BookmarksScreen() {
  const {
    bookmarks,
    collections,
    getBookmarksByCollection,
    removeBookmark,
    searchBookmarks,
    getBookmarkStats,
    getBookmarkTitle,
    isLoading
  } = useBookmarks();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [filterType, setFilterType] = useState<BookmarkType['type'] | 'all'>('all');

  const getFilteredBookmarks = () => {
    let filtered: BookmarkType[] = [];
    
    if (selectedCollection === 'all') {
      filtered = bookmarks;
    } else {
      filtered = getBookmarksByCollection(selectedCollection);
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(b => b.type === filterType);
    }
    
    if (searchQuery.trim()) {
      filtered = searchBookmarks(searchQuery, filterType === 'all' ? undefined : filterType);
    }
    
    return filtered;
  };

  const handleRemoveBookmark = (bookmarkId: string) => {
    Alert.alert(
      'Remove Bookmark',
      'Are you sure you want to remove this bookmark?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeBookmark(bookmarkId)
        }
      ]
    );
  };

  const navigateToContent = (bookmark: BookmarkType) => {
    switch (bookmark.type) {
      case 'ayah':
        router.push(`/surah/${bookmark.surahId}?ayah=${bookmark.ayahNumber}` as any);
        break;
      case 'hadith':
        router.push(`/hadith-collection/${bookmark.collectionId}?hadith=${bookmark.hadithNumber}` as any);
        break;
      case 'reciter':
        router.push(`/reciter/${bookmark.reciterId}` as any);
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCollectionIcon = (collection: BookmarkCollection) => {
    switch (collection.icon) {
      case 'heart': return Heart;
      case 'brain': return Brain;
      case 'book-open': return BookOpen;
      default: return Bookmark;
    }
  };

  const filteredBookmarks = getFilteredBookmarks();
  const stats = getBookmarkStats();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading bookmarks...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bookmarks..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Collection Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.collectionsContainer}>
        <TouchableOpacity
          style={[
            styles.collectionTab,
            selectedCollection === 'all' && styles.collectionTabActive
          ]}
          onPress={() => setSelectedCollection('all')}
        >
          <Text style={[
            styles.collectionTabText,
            selectedCollection === 'all' && styles.collectionTabTextActive
          ]}>All ({stats.total})</Text>
        </TouchableOpacity>
        
        {collections.map((collection) => {
          const Icon = getCollectionIcon(collection);
          const count = getBookmarksByCollection(collection.id).length;
          
          return (
            <TouchableOpacity
              key={collection.id}
              style={[
                styles.collectionTab,
                selectedCollection === collection.id && styles.collectionTabActive
              ]}
              onPress={() => setSelectedCollection(collection.id)}
            >
              <Icon size={16} color={selectedCollection === collection.id ? Colors.textOnPrimary : Colors.primary} />
              <Text style={[
                styles.collectionTabText,
                selectedCollection === collection.id && styles.collectionTabTextActive
              ]}>{collection.name} ({count})</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Type Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeFilterContainer}>
        {(['all', 'ayah', 'hadith', 'dua', 'reciter'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeFilterTab,
              filterType === type && styles.typeFilterTabActive
            ]}
            onPress={() => setFilterType(type)}
          >
            <Text style={[
              styles.typeFilterText,
              filterType === type && styles.typeFilterTextActive
            ]}>
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredBookmarks.length === 0 ? (
        <View style={styles.emptyState}>
          <BookmarkCheck size={64} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No Results Found' : 'No Bookmarks Yet'}
          </Text>
          <Text style={styles.emptyDescription}>
            {searchQuery 
              ? `No bookmarks match "${searchQuery}". Try a different search term.`
              : 'Start bookmarking your favorite content while exploring the app. They will appear here for easy access.'
            }
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
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={Colors.gradients.accent as [string, string]}
                style={styles.statGradient}
              >
                <Text style={styles.statNumber}>{stats.ayahs}</Text>
                <Text style={styles.statLabel}>Ayahs</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={Colors.gradients.sunset as [string, string]}
                style={styles.statGradient}
              >
                <Text style={styles.statNumber}>{stats.hadiths}</Text>
                <Text style={styles.statLabel}>Hadiths</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={Colors.gradients.islamic as [string, string]}
                style={styles.statGradient}
              >
                <Text style={styles.statNumber}>{stats.collections}</Text>
                <Text style={styles.statLabel}>Collections</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Bookmarks List */}
          <View style={styles.bookmarksSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCollection === 'all' ? 'All Bookmarks' : collections.find(c => c.id === selectedCollection)?.name}
              </Text>
              <Text style={styles.sectionCount}>({filteredBookmarks.length})</Text>
            </View>
            
            {filteredBookmarks.map((bookmark) => (
              <View key={bookmark.id} style={styles.bookmarkCard}>
                <TouchableOpacity
                  style={styles.bookmarkContent}
                  onPress={() => navigateToContent(bookmark)}
                  activeOpacity={0.8}
                >
                  <View style={styles.bookmarkHeader}>
                    <View style={styles.bookmarkInfo}>
                      <View style={styles.bookmarkTypeContainer}>
                        <Text style={styles.bookmarkType}>{bookmark.type.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.bookmarkTitle}>{getBookmarkTitle(bookmark)}</Text>
                      {bookmark.type === 'ayah' && (
                        <Text style={styles.bookmarkSubtitle}>{bookmark.surahArabicName}</Text>
                      )}
                      {bookmark.type === 'hadith' && (
                        <Text style={styles.bookmarkSubtitle}>Narrator: {bookmark.narrator}</Text>
                      )}
                      {bookmark.type === 'reciter' && (
                        <Text style={styles.bookmarkSubtitle}>{bookmark.style}</Text>
                      )}
                    </View>
                  </View>

                  {bookmark.type === 'ayah' && (
                    <>
                      <Text style={styles.arabicText}>{bookmark.ayahText}</Text>
                      <Text style={styles.translationText}>{bookmark.translation}</Text>
                    </>
                  )}
                  
                  {bookmark.type === 'hadith' && (
                    <>
                      <Text style={styles.arabicText}>{bookmark.hadithText}</Text>
                      <Text style={styles.translationText}>{bookmark.translation}</Text>
                    </>
                  )}
                  
                  {bookmark.type === 'dua' && (
                    <>
                      <Text style={styles.arabicText}>{bookmark.arabicText}</Text>
                      {bookmark.transliteration && (
                        <Text style={styles.transliterationText}>{bookmark.transliteration}</Text>
                      )}
                      <Text style={styles.translationText}>{bookmark.translation}</Text>
                    </>
                  )}

                  <View style={styles.bookmarkMeta}>
                    <Text style={styles.bookmarkDate}>
                      Saved on {formatDate(bookmark.dateBookmarked)}
                    </Text>
                    {bookmark.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {bookmark.tags.slice(0, 3).map((tag, index) => (
                          <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                        {bookmark.tags.length > 3 && (
                          <Text style={styles.moreTagsText}>+{bookmark.tags.length - 3}</Text>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.bookmarkActions}>
                  {bookmark.type === 'ayah' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {/* TODO: Play ayah */}}
                    >
                      <Volume2 size={20} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleRemoveBookmark(bookmark.id)}
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
              • Bookmark ayahs, hadiths, duas, and reciters across the app{'\n'}
              • Organize bookmarks into collections for better management{'\n'}
              • Use search to quickly find specific bookmarks{'\n'}
              • Add tags and notes to your bookmarks for context{'\n'}
              • Export your bookmarks to backup or share with others
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsCard}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity style={styles.quickActionButton}>
                <Plus size={20} color={Colors.primary} />
                <Text style={styles.quickActionText}>New Collection</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Settings size={20} color={Colors.primary} />
                <Text style={styles.quickActionText}>Settings</Text>
              </TouchableOpacity>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 12,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  collectionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  collectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  collectionTabActive: {
    backgroundColor: Colors.primary,
  },
  collectionTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  collectionTabTextActive: {
    color: Colors.textOnPrimary,
  },
  typeFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  typeFilterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: Colors.surfaceVariant,
  },
  typeFilterTabActive: {
    backgroundColor: Colors.primaryOverlay,
  },
  typeFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeFilterTextActive: {
    color: Colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionCount: {
    fontSize: 16,
    color: Colors.textLight,
    marginLeft: 8,
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkTypeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryOverlay,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  bookmarkType: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  bookmarkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  bookmarkSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  arabicText: {
    fontSize: 18,
    lineHeight: 28,
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 8,
    fontWeight: '500',
  },
  translationText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  transliterationText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.primaryOverlay,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  moreTagsText: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '600',
  },
  quickActionsCard: {
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
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primaryOverlay,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});