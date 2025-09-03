import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export interface BookmarkedAyah {
  id: string;
  type: 'ayah';
  surahId: number;
  surahName: string;
  surahArabicName: string;
  ayahNumber: number;
  ayahText: string;
  translation: string;
  dateBookmarked: string;
  tags: string[];
  notes?: string;
  reciterId?: string;
  reciterName?: string;
}

export interface BookmarkedHadith {
  id: string;
  type: 'hadith';
  collectionId: string;
  collectionName: string;
  hadithNumber: number;
  hadithText: string;
  translation: string;
  narrator: string;
  grade?: string;
  dateBookmarked: string;
  tags: string[];
  notes?: string;
}

export interface BookmarkedDua {
  id: string;
  type: 'dua';
  title: string;
  arabicText: string;
  transliteration?: string;
  translation: string;
  source?: string;
  dateBookmarked: string;
  tags: string[];
  notes?: string;
}

export interface BookmarkedReciter {
  id: string;
  type: 'reciter';
  reciterId: string;
  reciterName: string;
  reciterArabicName?: string;
  style: string;
  dateBookmarked: string;
  tags: string[];
  notes?: string;
}

export type Bookmark = BookmarkedAyah | BookmarkedHadith | BookmarkedDua | BookmarkedReciter;

export interface BookmarkCollection {
  id: string;
  name: string;
  description?: string;
  bookmarkIds: string[];
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  color?: string;
  icon?: string;
}

const STORAGE_KEYS = {
  BOOKMARKS: 'app_bookmarks',
  COLLECTIONS: 'bookmark_collections',
  SETTINGS: 'bookmark_settings',
};

const DEFAULT_COLLECTIONS: BookmarkCollection[] = [
  {
    id: 'favorites',
    name: 'Favorites',
    description: 'Your most loved verses and content',
    bookmarkIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
    color: '#FF6B6B',
    icon: 'heart',
  },
  {
    id: 'memorization',
    name: 'For Memorization',
    description: 'Verses you want to memorize',
    bookmarkIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
    color: '#4ECDC4',
    icon: 'brain',
  },
  {
    id: 'daily-reading',
    name: 'Daily Reading',
    description: 'Content for daily reflection',
    bookmarkIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
    color: '#45B7D1',
    icon: 'book-open',
  },
];

const DEFAULT_SETTINGS = {
  autoSync: true,
  showPreview: true,
  defaultCollection: 'favorites',
  sortBy: 'dateBookmarked' as 'dateBookmarked' | 'alphabetical' | 'surahOrder',
  sortOrder: 'desc' as 'asc' | 'desc',
  enableNotifications: true,
  dailyReminderTime: '08:00',
};

export const [BookmarkProvider, useBookmarks] = createContextHook(() => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<BookmarkCollection[]>(DEFAULT_COLLECTIONS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [bookmarksData, collectionsData, settingsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS),
        AsyncStorage.getItem(STORAGE_KEYS.COLLECTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      if (bookmarksData) {
        setBookmarks(JSON.parse(bookmarksData));
      }
      
      if (collectionsData) {
        const savedCollections = JSON.parse(collectionsData);
        const mergedCollections = [...DEFAULT_COLLECTIONS];
        savedCollections.forEach((saved: BookmarkCollection) => {
          const existingIndex = mergedCollections.findIndex(c => c.id === saved.id);
          if (existingIndex >= 0) {
            mergedCollections[existingIndex] = { ...mergedCollections[existingIndex], ...saved };
          } else {
            mergedCollections.push(saved);
          }
        });
        setCollections(mergedCollections);
      }
      
      if (settingsData) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsData) });
      }
    } catch (error) {
      console.error('Error loading bookmark data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBookmarks = async (newBookmarks: Bookmark[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(newBookmarks));
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  };

  const saveCollections = async (newCollections: BookmarkCollection[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(newCollections));
      setCollections(newCollections);
    } catch (error) {
      console.error('Error saving collections:', error);
    }
  };

  const saveSettings = async (newSettings: typeof DEFAULT_SETTINGS) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const addToCollection = useCallback(async (collectionId: string, bookmarkId: string) => {
    const updatedCollections = collections.map(collection => {
      if (collection.id === collectionId && !collection.bookmarkIds.includes(bookmarkId)) {
        return {
          ...collection,
          bookmarkIds: [...collection.bookmarkIds, bookmarkId],
          updatedAt: new Date().toISOString(),
        };
      }
      return collection;
    });
    await saveCollections(updatedCollections);
  }, [collections]);

  const addBookmark = useCallback(async (bookmarkData: Omit<Bookmark, 'id' | 'dateBookmarked'>, collectionId?: string) => {
    const newBookmark: Bookmark = {
      ...bookmarkData,
      id: `${bookmarkData.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dateBookmarked: new Date().toISOString(),
    } as Bookmark;

    const updatedBookmarks = [newBookmark, ...bookmarks];
    await saveBookmarks(updatedBookmarks);

    if (collectionId) {
      await addToCollection(collectionId, newBookmark.id);
    } else {
      await addToCollection(settings.defaultCollection, newBookmark.id);
    }

    return newBookmark;
  }, [bookmarks, settings.defaultCollection, addToCollection]);

  const removeBookmark = useCallback(async (bookmarkId: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    await saveBookmarks(updatedBookmarks);

    const updatedCollections = collections.map(collection => ({
      ...collection,
      bookmarkIds: collection.bookmarkIds.filter(id => id !== bookmarkId),
      updatedAt: new Date().toISOString(),
    }));
    await saveCollections(updatedCollections);
  }, [bookmarks, collections]);

  const updateBookmark = useCallback(async (bookmarkId: string, updates: Partial<Bookmark>) => {
    const updatedBookmarks = bookmarks.map(bookmark =>
      bookmark.id === bookmarkId ? { ...bookmark, ...updates } : bookmark
    );
    await saveBookmarks(updatedBookmarks);
  }, [bookmarks]);

  const isBookmarked = useCallback((type: Bookmark['type'], identifier: string): boolean => {
    switch (type) {
      case 'ayah':
        const [surahId, ayahNumber] = identifier.split('-').map(Number);
        return bookmarks.some(b => 
          b.type === 'ayah' && 
          (b as BookmarkedAyah).surahId === surahId && 
          (b as BookmarkedAyah).ayahNumber === ayahNumber
        );
      case 'hadith':
        const [collectionId, hadithNumber] = identifier.split('-');
        return bookmarks.some(b => 
          b.type === 'hadith' && 
          (b as BookmarkedHadith).collectionId === collectionId && 
          (b as BookmarkedHadith).hadithNumber === parseInt(hadithNumber)
        );
      case 'reciter':
        return bookmarks.some(b => 
          b.type === 'reciter' && 
          (b as BookmarkedReciter).reciterId === identifier
        );
      case 'dua':
        return bookmarks.some(b => 
          b.type === 'dua' && 
          (b as BookmarkedDua).title === identifier
        );
      default:
        return false;
    }
  }, [bookmarks]);

  const toggleBookmark = useCallback(async (bookmarkData: Omit<Bookmark, 'id' | 'dateBookmarked'>, identifier: string, collectionId?: string) => {
    if (isBookmarked(bookmarkData.type, identifier)) {
      const existingBookmark = bookmarks.find(b => {
        switch (b.type) {
          case 'ayah':
            const [surahId, ayahNumber] = identifier.split('-').map(Number);
            return b.type === 'ayah' && 
              (b as BookmarkedAyah).surahId === surahId && 
              (b as BookmarkedAyah).ayahNumber === ayahNumber;
          case 'hadith':
            const [collId, hadithNum] = identifier.split('-');
            return b.type === 'hadith' && 
              (b as BookmarkedHadith).collectionId === collId && 
              (b as BookmarkedHadith).hadithNumber === parseInt(hadithNum);
          case 'reciter':
            return b.type === 'reciter' && (b as BookmarkedReciter).reciterId === identifier;
          case 'dua':
            return b.type === 'dua' && (b as BookmarkedDua).title === identifier;
          default:
            return false;
        }
      });
      
      if (existingBookmark) {
        await removeBookmark(existingBookmark.id);
        return false;
      }
    } else {
      await addBookmark(bookmarkData, collectionId);
      return true;
    }
    return false;
  }, [bookmarks, isBookmarked, addBookmark, removeBookmark]);

  const getBookmarkTitle = useCallback((bookmark: Bookmark): string => {
    switch (bookmark.type) {
      case 'ayah':
        return `${bookmark.surahName} ${bookmark.ayahNumber}`;
      case 'hadith':
        return `${bookmark.collectionName} ${bookmark.hadithNumber}`;
      case 'dua':
        return bookmark.title;
      case 'reciter':
        return bookmark.reciterName;
      default:
        return 'Unknown';
    }
  }, []);

  const getBookmarksByCollection = useCallback((collectionId: string): Bookmark[] => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return [];

    return collection.bookmarkIds
      .map(id => bookmarks.find(b => b.id === id))
      .filter((bookmark): bookmark is Bookmark => bookmark !== undefined)
      .sort((a, b) => {
        switch (settings.sortBy) {
          case 'alphabetical':
            const aTitle = getBookmarkTitle(a);
            const bTitle = getBookmarkTitle(b);
            return settings.sortOrder === 'asc' 
              ? aTitle.localeCompare(bTitle)
              : bTitle.localeCompare(aTitle);
          case 'surahOrder':
            if (a.type === 'ayah' && b.type === 'ayah') {
              const aSurah = (a as BookmarkedAyah).surahId;
              const bSurah = (b as BookmarkedAyah).surahId;
              if (aSurah !== bSurah) {
                return settings.sortOrder === 'asc' ? aSurah - bSurah : bSurah - aSurah;
              }
              const aAyah = (a as BookmarkedAyah).ayahNumber;
              const bAyah = (b as BookmarkedAyah).ayahNumber;
              return settings.sortOrder === 'asc' ? aAyah - bAyah : bAyah - aAyah;
            }
          case 'dateBookmarked':
          default:
            const aDate = new Date(a.dateBookmarked).getTime();
            const bDate = new Date(b.dateBookmarked).getTime();
            return settings.sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
        }
      });
  }, [collections, bookmarks, settings.sortBy, settings.sortOrder, getBookmarkTitle]);

  const searchBookmarks = useCallback((query: string, type?: Bookmark['type']): Bookmark[] => {
    const lowercaseQuery = query.toLowerCase();
    
    return bookmarks.filter(bookmark => {
      if (type && bookmark.type !== type) return false;
      
      const searchableText = [
        getBookmarkTitle(bookmark),
        ...bookmark.tags,
        bookmark.notes || '',
      ];
      
      switch (bookmark.type) {
        case 'ayah':
          searchableText.push(
            bookmark.ayahText,
            bookmark.translation,
            bookmark.surahArabicName
          );
          break;
        case 'hadith':
          searchableText.push(
            bookmark.hadithText,
            bookmark.translation,
            bookmark.narrator
          );
          break;
        case 'dua':
          searchableText.push(
            bookmark.arabicText,
            bookmark.transliteration || '',
            bookmark.translation,
            bookmark.source || ''
          );
          break;
        case 'reciter':
          searchableText.push(
            bookmark.reciterArabicName || '',
            bookmark.style
          );
          break;
      }
      
      return searchableText.some(text => 
        text.toLowerCase().includes(lowercaseQuery)
      );
    });
  }, [bookmarks, getBookmarkTitle]);

  const getBookmarkStats = useCallback(() => {
    const stats = {
      total: bookmarks.length,
      ayahs: bookmarks.filter(b => b.type === 'ayah').length,
      hadiths: bookmarks.filter(b => b.type === 'hadith').length,
      duas: bookmarks.filter(b => b.type === 'dua').length,
      reciters: bookmarks.filter(b => b.type === 'reciter').length,
      collections: collections.filter(c => !c.isDefault).length,
      tags: [...new Set(bookmarks.flatMap(b => b.tags))].length,
    };
    
    return stats;
  }, [bookmarks, collections]);

  const createCollection = useCallback(async (collectionData: Omit<BookmarkCollection, 'id' | 'createdAt' | 'updatedAt' | 'bookmarkIds'>) => {
    const newCollection: BookmarkCollection = {
      ...collectionData,
      id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bookmarkIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedCollections = [...collections, newCollection];
    await saveCollections(updatedCollections);
    return newCollection;
  }, [collections]);

  const updateCollection = useCallback(async (collectionId: string, updates: Partial<BookmarkCollection>) => {
    const updatedCollections = collections.map(collection =>
      collection.id === collectionId 
        ? { ...collection, ...updates, updatedAt: new Date().toISOString() }
        : collection
    );
    await saveCollections(updatedCollections);
  }, [collections]);

  const deleteCollection = useCallback(async (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    if (collection?.isDefault) {
      throw new Error('Cannot delete default collections');
    }

    const updatedCollections = collections.filter(c => c.id !== collectionId);
    await saveCollections(updatedCollections);
  }, [collections]);

  const removeFromCollection = useCallback(async (collectionId: string, bookmarkId: string) => {
    const updatedCollections = collections.map(collection => {
      if (collection.id === collectionId) {
        return {
          ...collection,
          bookmarkIds: collection.bookmarkIds.filter(id => id !== bookmarkId),
          updatedAt: new Date().toISOString(),
        };
      }
      return collection;
    });
    await saveCollections(updatedCollections);
  }, [collections]);

  const exportBookmarks = useCallback(async (): Promise<string> => {
    const exportData = {
      bookmarks,
      collections: collections.filter(c => !c.isDefault),
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [bookmarks, collections]);

  const importBookmarks = useCallback(async (importData: string): Promise<{ success: boolean; message: string }> => {
    try {
      const data = JSON.parse(importData);
      
      if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
        return { success: false, message: 'Invalid import data format' };
      }
      
      const existingIds = new Set(bookmarks.map(b => b.id));
      const newBookmarks = data.bookmarks.filter((b: Bookmark) => !existingIds.has(b.id));
      
      const updatedBookmarks = [...bookmarks, ...newBookmarks];
      await saveBookmarks(updatedBookmarks);
      
      if (data.collections && Array.isArray(data.collections)) {
        const existingCollectionIds = new Set(collections.map(c => c.id));
        const newCollections = data.collections.filter((c: BookmarkCollection) => 
          !existingCollectionIds.has(c.id) && !c.isDefault
        );
        
        const updatedCollections = [...collections, ...newCollections];
        await saveCollections(updatedCollections);
      }
      
      return { 
        success: true, 
        message: `Successfully imported ${newBookmarks.length} bookmarks` 
      };
    } catch {
      return { 
        success: false, 
        message: 'Failed to parse import data' 
      };
    }
  }, [bookmarks, collections]);

  const updateSettings = useCallback(async (newSettings: Partial<typeof DEFAULT_SETTINGS>) => {
    const updatedSettings = { ...settings, ...newSettings };
    await saveSettings(updatedSettings);
  }, [settings]);

  return useMemo(() => ({
    bookmarks,
    collections,
    settings,
    isLoading,
    addBookmark,
    removeBookmark,
    updateBookmark,
    isBookmarked,
    toggleBookmark,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    getBookmarksByCollection,
    searchBookmarks,
    getBookmarkStats,
    exportBookmarks,
    importBookmarks,
    updateSettings,
    getBookmarkTitle,
  }), [
    bookmarks,
    collections,
    settings,
    isLoading,
    addBookmark,
    removeBookmark,
    updateBookmark,
    isBookmarked,
    toggleBookmark,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    getBookmarksByCollection,
    searchBookmarks,
    getBookmarkStats,
    exportBookmarks,
    importBookmarks,
    updateSettings,
    getBookmarkTitle,
  ]);
});