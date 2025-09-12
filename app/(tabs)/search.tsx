import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Volume2, BookOpen, User, Loader, Play, Pause, StopCircle, Download, CheckCircle, Zap, Star, TrendingUp } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

import { trpc } from '@/lib/trpc';
import { SURAHS } from '@/constants/quran-data';
import { TOP_RECITERS, getReciterById } from '@/constants/reciters';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import audioDownloadService from '@/services/audio-download-service';
import offlineService from '@/services/offline-service';
import { usePersonalization } from '@/contexts/personalization-context';



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
  reciterId?: string;
  audioUrl?: string;
  relevanceScore?: number;
  matchType?: 'exact' | 'partial' | 'phonetic' | 'semantic' | 'contextual';
  surahName?: string;
  verseKey?: string;
  confidence?: number;
  isDownloaded?: boolean;
  downloadProgress?: number;
  contextualMatches?: string[];
  popularityBoost?: number;
  recitationQuality?: 'high' | 'medium' | 'standard';
}

export default function SearchScreen() {
  const { settings, fontSizeValue } = usePersonalization();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedReciter, setSelectedReciter] = useState(settings.defaultReciter.toString());
  const [downloadedReciters, setDownloadedReciters] = useState<string[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [trendingSearches] = useState(['Bismillah', 'Ayat al-Kursi', 'Al-Fatihah', 'Surah Yasin', 'Dua', 'Paradise', 'Forgiveness']);
  const [isOnline, setIsOnline] = useState(true);
  
  const { 
    isPlaying, 
    isLoading: audioLoading,
    currentAyah,
    currentSurah,
    playAyah,
    stopPlayback,
    pausePlayback,
    resumePlayback,
    setReciter
  } = useAudioPlayer();
  
  // Advanced search algorithm similar to Shazam with AI-like ranking
  const enhanceSearchResults = useCallback(async (data: any[], query: string): Promise<SearchResult[]> => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('No data provided to enhanceSearchResults');
      return [];
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.log('Invalid query provided to enhanceSearchResults');
      return [];
    }

    const results: (SearchResult | null)[] = await Promise.all(data.map(async (result: any) => {
      try {
        // Validate result structure
        if (!result || typeof result !== 'object') {
          console.warn('Invalid result object:', result);
          return null;
        }

        if (!result.verse_key || typeof result.verse_key !== 'string') {
          console.warn('Missing or invalid verse_key:', result.verse_key);
          return null;
        }

        const verseKeyParts = result.verse_key.split(':');
        if (verseKeyParts.length !== 2) {
          console.warn('Invalid verse_key format:', result.verse_key);
          return null;
        }

        const surahNumber = parseInt(verseKeyParts[0]);
        const ayahNumber = parseInt(verseKeyParts[1]);
        
        if (isNaN(surahNumber) || isNaN(ayahNumber) || surahNumber < 1 || ayahNumber < 1) {
          console.warn('Invalid surah or ayah number:', { surahNumber, ayahNumber });
          return null;
        }

        const surahInfo = SURAHS.find(s => s.id === surahNumber);
        const reciter = getReciterById(selectedReciter);
        
        // Ensure we have valid data before proceeding
        if (!surahInfo) {
          console.warn(`Surah not found for number: ${surahNumber}`);
          return null;
        }
        
        if (!reciter) {
          console.warn(`Reciter not found for ID: ${selectedReciter}`);
          return null;
        }
      
        // Calculate advanced relevance score using multiple AI-like factors
        let relevanceScore = 0;
        let matchType: 'exact' | 'partial' | 'phonetic' | 'semantic' | 'contextual' = 'contextual';
        let confidence = 0;
        let contextualMatches: string[] = [];
        let popularityBoost = 0;
        let isDownloaded = false;
        let recitationQuality: 'high' | 'medium' | 'standard' = 'standard';

        try {
          relevanceScore = await calculateAdvancedRelevanceScore(result, query);
        } catch (error) {
          console.warn('Error calculating relevance score:', error);
          relevanceScore = 10; // Default fallback score
        }

        try {
          matchType = determineAdvancedMatchType(result, query);
        } catch (error) {
          console.warn('Error determining match type:', error);
        }

        try {
          confidence = calculateConfidenceScore(result, query);
        } catch (error) {
          console.warn('Error calculating confidence score:', error);
          confidence = 0.5; // Default fallback confidence
        }

        try {
          contextualMatches = findContextualMatches(result, query);
        } catch (error) {
          console.warn('Error finding contextual matches:', error);
        }

        try {
          popularityBoost = calculatePopularityBoost(result.verse_key);
        } catch (error) {
          console.warn('Error calculating popularity boost:', error);
        }
        
        // Check if audio is downloaded locally
        try {
          isDownloaded = await audioDownloadService.isAudioAvailableLocally(selectedReciter, surahNumber, ayahNumber);
        } catch (error) {
          console.warn('Error checking audio availability:', error);
        }
        
        // Generate audio URL for the specific ayah
        let audioUrl = '';
        try {
          audioUrl = getAyahAudioUrl(surahNumber, ayahNumber, selectedReciter);
        } catch (error) {
          console.warn('Error generating audio URL:', error);
        }
        
        // Determine recitation quality based on reciter
        try {
          recitationQuality = getRecitationQuality(selectedReciter);
        } catch (error) {
          console.warn('Error determining recitation quality:', error);
        }
      
        return {
          id: `ayah-${result.verse_key}`,
          type: 'ayah' as const,
          title: `Surah ${surahInfo?.englishName || `#${surahNumber}`} - Ayah ${ayahNumber}`,
          subtitle: `${result.verse_key} • ${reciter?.name || 'Unknown Reciter'}`,
          arabicText: result.text_uthmani || '',
          translation: result.translations?.[0]?.text || result.translation || '',
          surahNumber,
          ayahNumber,
          surahName: surahInfo?.englishName || `Surah ${surahNumber}`,
          reciterName: reciter?.name || 'Unknown Reciter',
          reciterId: selectedReciter,
          audioUrl,
          relevanceScore,
          matchType,
          verseKey: result.verse_key,
          confidence,
          isDownloaded,
          contextualMatches,
          popularityBoost,
          recitationQuality,
        };
      } catch (error) {
        console.error('Error processing search result:', error, result);
        return null;
      }
    }));
    
    // Filter out null results from failed processing
    const validResults: SearchResult[] = results.filter((result): result is SearchResult => result !== null);
    
    if (validResults.length === 0) {
      console.warn('No valid results after processing');
      return [];
    }
    
    // Advanced Shazam-like ranking algorithm
    return validResults.sort((a, b) => {
      // Primary sort by confidence and relevance
      const scoreA = (a.relevanceScore || 0) + (a.confidence || 0) * 50 + (a.popularityBoost || 0);
      const scoreB = (b.relevanceScore || 0) + (b.confidence || 0) * 50 + (b.popularityBoost || 0);
      
      if (Math.abs(scoreA - scoreB) > 10) {
        return scoreB - scoreA;
      }
      
      // Secondary sort by download availability (local first)
      if (a.isDownloaded !== b.isDownloaded) {
        return a.isDownloaded ? -1 : 1;
      }
      
      // Tertiary sort by recitation quality
      const qualityOrder = { 'high': 3, 'medium': 2, 'standard': 1 };
      const qualityDiff = (qualityOrder[a.recitationQuality || 'standard'] || 1) - (qualityOrder[b.recitationQuality || 'standard'] || 1);
      if (qualityDiff !== 0) {
        return -qualityDiff;
      }
      
      return scoreB - scoreA;
    });
  }, [selectedReciter]);

  // Advanced AI-like relevance scoring with multiple sophisticated factors
  const calculateAdvancedRelevanceScore = useCallback(async (result: any, query: string): Promise<number> => {
    if (!result || !query) {
      return 0;
    }

    let score = 0;
    const queryLower = query.toLowerCase().trim();
    const arabicText = result.text_uthmani || '';
    const translation = (result.translations?.[0]?.text || result.translation || '').toLowerCase();
    const verseKey = result.verse_key || '';

    if (!queryLower || !translation) {
      return 0;
    }
    
    // 1. Exact phrase matching (Shazam-like precision)
    if (translation.includes(queryLower)) {
      const position = translation.indexOf(queryLower);
      score += 200; // Base exact match score
      
      // Boost for beginning of verse (more relevant)
      if (position < 20) score += 100;
      if (position === 0) score += 150;
      
      // Boost for complete word boundaries
      const beforeChar = position > 0 ? translation[position - 1] : ' ';
      const afterChar = position + queryLower.length < translation.length ? translation[position + queryLower.length] : ' ';
      if (/\s/.test(beforeChar) && /\s/.test(afterChar)) {
        score += 75; // Complete word match
      }
    }
    
    // 2. Advanced word-level analysis
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    const translationWords = translation.split(/\s+/);
    
    let wordMatchCount = 0;
    let consecutiveMatches = 0;
    let maxConsecutive = 0;
    
    queryWords.forEach((queryWord, qIndex) => {
      let bestWordScore = 0;
      let foundInSequence = false;
      
      translationWords.forEach((transWord: string, tIndex: number) => {
        const cleanTransWord = transWord.replace(/[^a-zA-Z]/g, '').toLowerCase();
        
        // Exact word match
        if (cleanTransWord === queryWord) {
          bestWordScore = Math.max(bestWordScore, 60);
          wordMatchCount++;
          
          // Check for consecutive word matches
          if (qIndex > 0 && tIndex > 0) {
            const prevQueryWord = queryWords[qIndex - 1];
            const prevTransWord = translationWords[tIndex - 1].replace(/[^a-zA-Z]/g, '').toLowerCase();
            if (prevTransWord === prevQueryWord) {
              consecutiveMatches++;
              foundInSequence = true;
            }
          }
        }
        // Partial word match (fuzzy matching)
        else if (cleanTransWord.includes(queryWord) && queryWord.length > 3) {
          bestWordScore = Math.max(bestWordScore, 30);
        }
        // Stem matching (basic)
        else if (queryWord.length > 4 && cleanTransWord.startsWith(queryWord.substring(0, 4))) {
          bestWordScore = Math.max(bestWordScore, 20);
        }
      });
      
      score += bestWordScore;
      if (foundInSequence) {
        maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
      } else {
        consecutiveMatches = 0;
      }
    });
    
    // Bonus for consecutive word matches (phrase integrity)
    score += maxConsecutive * 40;
    
    // Word coverage bonus
    const wordCoverage = wordMatchCount / Math.max(queryWords.length, 1);
    score += wordCoverage * 80;
    
    // 3. Arabic text matching with enhanced scoring
    if (arabicText.includes(query)) {
      score += 300; // Arabic exact match is highly valuable
      
      // Bonus for Arabic query at word boundaries
      const arabicWords = arabicText.split(/\s+/);
      const queryInArabic = arabicWords.some((word: string) => word.includes(query));
      if (queryInArabic) score += 100;
    }
    
    // 4. Semantic similarity (simplified)
    const semanticScore = calculateSemanticSimilarity(query, translation);
    score += semanticScore;
    
    // 5. Verse popularity and importance
    const popularityScore = calculatePopularityBoost(verseKey);
    score += popularityScore;
    
    // 6. Query length consideration (longer queries should be more precise)
    const queryComplexity = Math.min(queryWords.length * 10, 50);
    score += queryComplexity;
    
    // 7. Recency bias for search history
    if (searchHistory.includes(queryLower)) {
      score += 25; // Slight boost for previously searched terms
    }
    
    return Math.round(score);
  }, [searchHistory]);
  
  // Enhanced semantic similarity calculation
  const calculateSemanticSimilarity = useCallback((query: string, translation: string): number => {
    const semanticGroups = {
      divine: {
        keywords: ['god', 'allah', 'lord', 'creator', 'almighty', 'divine', 'deity'],
        arabicKeywords: ['الله', 'رب', 'إله'],
        score: 40
      },
      worship: {
        keywords: ['prayer', 'salah', 'worship', 'pray', 'prostrate', 'bow', 'kneel'],
        arabicKeywords: ['صلاة', 'عبادة', 'سجود'],
        score: 35
      },
      mercy: {
        keywords: ['mercy', 'merciful', 'compassion', 'forgiveness', 'kind', 'gentle'],
        arabicKeywords: ['رحمة', 'رحيم', 'غفور'],
        score: 35
      },
      paradise: {
        keywords: ['paradise', 'heaven', 'jannah', 'garden', 'eternal', 'bliss'],
        arabicKeywords: ['جنة', 'فردوس'],
        score: 30
      },
      guidance: {
        keywords: ['guidance', 'guide', 'path', 'way', 'direction', 'light'],
        arabicKeywords: ['هداية', 'صراط', 'نور'],
        score: 30
      },
      knowledge: {
        keywords: ['knowledge', 'wisdom', 'learn', 'teach', 'understand', 'know'],
        arabicKeywords: ['علم', 'حكمة', 'فهم'],
        score: 25
      }
    };
    
    let semanticScore = 0;
    const queryLower = query.toLowerCase();
    const translationLower = translation.toLowerCase();
    
    Object.values(semanticGroups).forEach(group => {
      const queryHasKeyword = group.keywords.some(keyword => queryLower.includes(keyword));
      const translationHasKeyword = group.keywords.some(keyword => translationLower.includes(keyword));
      
      if (queryHasKeyword && translationHasKeyword) {
        semanticScore += group.score;
      }
    });
    
    return semanticScore;
  }, []);
  
  // Calculate confidence score (0-1) based on match quality
  const calculateConfidenceScore = useCallback((result: any, query: string): number => {
    if (!result || !query) {
      return 0;
    }

    const translation = (result.translations?.[0]?.text || result.translation || '').toLowerCase();
    const queryLower = query.toLowerCase();

    if (!translation || !queryLower) {
      return 0;
    }
    
    // Exact match = high confidence
    if (translation.includes(queryLower)) {
      const matchLength = queryLower.length;
      const translationLength = translation.length;
      return Math.min(0.95, 0.6 + (matchLength / translationLength) * 0.35);
    }
    
    // Word-based confidence
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    const translationWords = translation.split(/\s+/);
    
    let matchingWords = 0;
    queryWords.forEach((qWord: string) => {
      if (translationWords.some((tWord: string) => tWord.includes(qWord))) {
        matchingWords++;
      }
    });
    
    const wordMatchRatio = matchingWords / Math.max(queryWords.length, 1);
    return Math.min(0.85, wordMatchRatio * 0.7);
  }, []);
  
  // Find contextual matches for better user understanding
  const findContextualMatches = useCallback((result: any, query: string): string[] => {
    if (!result || !query) {
      return [];
    }

    const translation = result.translations?.[0]?.text || result.translation || '';
    const queryLower = query.toLowerCase();
    const matches: string[] = [];

    if (!translation || !queryLower) {
      return [];
    }
    
    // Find sentences or phrases that contain the query
    const sentences = translation.split(/[.!?]+/);
    sentences.forEach((sentence: string) => {
      if (sentence.toLowerCase().includes(queryLower)) {
        const trimmed = sentence.trim();
        if (trimmed.length > 10 && trimmed.length < 100) {
          matches.push(trimmed);
        }
      }
    });
    
    return matches.slice(0, 2); // Limit to 2 contextual matches
  }, []);

  // Advanced match type determination with contextual analysis
  const determineAdvancedMatchType = useCallback((result: any, query: string): 'exact' | 'partial' | 'phonetic' | 'semantic' | 'contextual' => {
    if (!result || !query) {
      return 'contextual';
    }

    const translation = (result.translations?.[0]?.text || result.translation || '').toLowerCase();
    const queryLower = query.toLowerCase();
    const arabicText = result.text_uthmani || '';

    if (!translation || !queryLower) {
      return 'contextual';
    }
    
    // Exact match in Arabic (highest priority)
    if (arabicText.includes(query)) {
      return 'exact';
    }
    
    // Exact phrase match in translation
    if (translation.includes(queryLower)) {
      const position = translation.indexOf(queryLower);
      // Check if it's at word boundaries for true exact match
      const beforeChar = position > 0 ? translation[position - 1] : ' ';
      const afterChar = position + queryLower.length < translation.length ? translation[position + queryLower.length] : ' ';
      
      if (/\s/.test(beforeChar) && /\s/.test(afterChar)) {
        return 'exact';
      }
      return 'partial';
    }
    
    // Check for word-level matches
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    const translationWords = translation.split(/\s+/);
    
    let exactWordMatches = 0;
    let partialWordMatches = 0;
    
    queryWords.forEach((qWord: string) => {
      translationWords.forEach((tWord: string) => {
        const cleanTWord = tWord.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (cleanTWord === qWord) {
          exactWordMatches++;
        } else if (cleanTWord.includes(qWord) && qWord.length > 3) {
          partialWordMatches++;
        }
      });
    });
    
    // If most words match exactly
    if (exactWordMatches >= queryWords.length * 0.7) {
      return 'partial';
    }
    
    // Check for semantic similarity
    const semanticScore = calculateSemanticSimilarity(query, translation);
    if (semanticScore > 25) {
      return 'semantic';
    }
    
    // Check for contextual relevance
    const contextualMatches = findContextualMatches(result, query);
    if (contextualMatches.length > 0) {
      return 'contextual';
    }
    
    // Default to phonetic for any remaining matches
    return 'phonetic';
  }, [calculateSemanticSimilarity, findContextualMatches]);
  
  // Calculate popularity boost based on verse importance
  const calculatePopularityBoost = useCallback((verseKey: string): number => {
    const popularVerses = {
      '1:1': 100,   // Bismillah
      '1:2': 80,    // Al-Fatihah
      '1:7': 70,    // Al-Fatihah ending
      '2:255': 95,  // Ayat al-Kursi
      '2:286': 85,  // Last verse of Al-Baqarah
      '3:26': 75,   // Dua verse
      '18:10': 70,  // Cave companions
      '36:1': 80,   // Ya-Sin
      '55:13': 75,  // Ar-Rahman refrain
      '67:1': 70,   // Al-Mulk opening
      '112:1': 90,  // Al-Ikhlas
      '112:2': 85,  // Al-Ikhlas
      '112:3': 85,  // Al-Ikhlas
      '112:4': 85,  // Al-Ikhlas
      '113:1': 80,  // Al-Falaq
      '114:1': 80,  // An-Nas
    };
    
    return (popularVerses as Record<string, number>)[verseKey] || 0;
  }, []);
  
  // Determine recitation quality based on reciter
  const getRecitationQuality = useCallback((reciterId: string): 'high' | 'medium' | 'standard' => {
    const highQualityReciters = [
      'mishary-alafasy', 'abdur-rahman-sudais', 'maher-al-muaiqly',
      'abdullah-basfar', 'mohamed-siddiq-al-minshawi', 'bandar-baleela'
    ];
    
    const mediumQualityReciters = [
      'saad-al-ghamdi', 'ali-al-hudhaify', 'abu-bakr-al-shatri',
      'ahmad-al-ajmi', 'mohamed-al-tablawi', 'salah-al-budair'
    ];
    
    if (highQualityReciters.includes(reciterId)) return 'high';
    if (mediumQualityReciters.includes(reciterId)) return 'medium';
    return 'standard';
  }, []);
  
  // Check network status
  useEffect(() => {
    const checkNetwork = () => {
      setIsOnline(offlineService.getNetworkStatus());
    };
    checkNetwork();
    const interval = setInterval(checkNetwork, 5000);
    return () => clearInterval(interval);
  }, []);

  const searchMutation = trpc.quran.search.useMutation({
    onSuccess: async (data) => {
      try {
        console.log('Search API response:', data);
        const enhancedResults = await enhanceSearchResults(data || [], searchQuery);
        setSearchResults(enhancedResults);
        setIsLoading(false);
        
        // Add to search history
        if (searchQuery && searchQuery.trim() && !searchHistory.includes(searchQuery.toLowerCase())) {
          setSearchHistory(prev => [searchQuery.toLowerCase(), ...prev.slice(0, 9)]); // Keep last 10 searches
        }
      } catch (error) {
        console.error('Error processing search results:', error);
        setSearchResults([]);
        setIsLoading(false);
        Alert.alert('Search Error', 'Failed to process search results. Please try again.');
      }
    },
    onError: async (error) => {
      console.error('Search error:', error);
      
      // Try offline search as fallback
      try {
        if (searchQuery && searchQuery.trim()) {
          const offlineResults = await offlineService.searchQuran(searchQuery.trim());
          if (offlineResults && offlineResults.matches && Array.isArray(offlineResults.matches) && offlineResults.matches.length > 0) {
            const enhancedResults = await enhanceSearchResults(offlineResults.matches, searchQuery);
            setSearchResults(enhancedResults);
            setIsLoading(false);
            return;
          }
        }
      } catch (offlineError) {
        console.error('Offline search error:', offlineError);
      }
      
      setSearchResults([]);
      setIsLoading(false);
      Alert.alert(
        'Search Error', 
        isOnline 
          ? 'Failed to search verses. Please try again.' 
          : 'No internet connection. Limited offline search available.'
      );
    },
  });
  

  
  // Generate audio URL for specific ayah
  const getAyahAudioUrl = (surahNumber: number, ayahNumber: number, reciterId: string): string => {
    const reciter = getReciterById(reciterId);
    if (!reciter) return '';
    
    const paddedSurah = surahNumber.toString().padStart(3, '0');
    const paddedAyah = ayahNumber.toString().padStart(3, '0');
    
    // Use the reciter's audio URL pattern
    return `${reciter.audioUrl}${paddedSurah}${paddedAyah}.mp3`;
  };
  


  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    // Try offline search first if offline
    if (!isOnline) {
      try {
        const trimmedQuery = query.trim();
        if (trimmedQuery) {
          const offlineResults = await offlineService.searchQuran(trimmedQuery);
          if (offlineResults && offlineResults.matches && Array.isArray(offlineResults.matches) && offlineResults.matches.length > 0) {
            const enhancedResults = await enhanceSearchResults(offlineResults.matches, query);
            setSearchResults(enhancedResults);
            setIsLoading(false);
            
            // Add to search history
            if (!searchHistory.includes(query.toLowerCase())) {
              setSearchHistory(prev => [query.toLowerCase(), ...prev.slice(0, 9)]);
            }
            return;
          }
        }
      } catch (error) {
        console.error('Offline search error:', error);
      }
      
      setSearchResults([]);
      setIsLoading(false);
      Alert.alert('Offline Search', 'No results found in offline data.');
      return;
    }
    
    // Use the backend API for online search
    try {
      const trimmedQuery = query.trim();
      if (trimmedQuery) {
        searchMutation.mutate({ query: trimmedQuery });
      } else {
        setSearchResults([]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error initiating search:', error);
      setSearchResults([]);
      setIsLoading(false);
      Alert.alert('Search Error', 'Failed to initiate search. Please try again.');
    }
  }, [searchMutation, isOnline, searchHistory, enhanceSearchResults]);



  const handleTextSearch = useCallback((text: string) => {
    setSearchQuery(text);
    performSearch(text);
  }, [performSearch]);
  
  // Audio playback functions
  const handlePlayAyah = useCallback(async (result: SearchResult) => {
    if (!result.surahNumber || !result.ayahNumber) return;
    
    try {
      // Set the reciter first
      setReciter(selectedReciter);
      
      const isCurrentAyah = currentSurah === result.surahNumber && currentAyah === result.ayahNumber;
      
      if (isCurrentAyah && isPlaying) {
        await pausePlayback();
      } else if (isCurrentAyah && !isPlaying) {
        await resumePlayback();
      } else {
        await playAyah(result.surahNumber, result.ayahNumber);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Playback Error', 'Failed to play audio. Please try again.');
    }
  }, [currentSurah, currentAyah, isPlaying, playAyah, pausePlayback, resumePlayback, setReciter, selectedReciter]);
  
  const handleStopAudio = useCallback(async () => {
    try {
      await stopPlayback();
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }, [stopPlayback]);

  // Initialize downloaded reciters and progress tracking
  useEffect(() => {
    const initializeDownloadData = async () => {
      try {
        const downloadedRecitersList = await audioDownloadService.getDownloadedReciters();
        setDownloadedReciters(downloadedRecitersList.map(r => r.reciterId));
        
        // Initialize default reciters if not already done
        await audioDownloadService.initializeDefaultReciters();
      } catch (error) {
        console.error('Error initializing download data:', error);
      }
    };
    
    initializeDownloadData();
    
    // Set up download progress listener
    const progressListener = (progress: any) => {
      setDownloadProgress(prev => ({
        ...prev,
        [`${progress.reciterId}-${progress.surahId}`]: progress.progress
      }));
    };
    
    audioDownloadService.addProgressListener(progressListener);
    
    return () => {
      audioDownloadService.removeProgressListener(progressListener);
    };
  }, []);
  
  // Update reciter when selection changes
  useEffect(() => {
    setReciter(selectedReciter);
  }, [selectedReciter, setReciter]);
  
  // Memoized reciter availability check
  const reciterAvailability = useMemo(() => {
    return TOP_RECITERS.reduce((acc, reciter) => {
      acc[reciter.id] = {
        isDefault: audioDownloadService.isDefaultReciter(reciter.id),
        isDownloaded: downloadedReciters.includes(reciter.id),
        quality: getRecitationQuality(reciter.id)
      };
      return acc;
    }, {} as Record<string, { isDefault: boolean; isDownloaded: boolean; quality: 'high' | 'medium' | 'standard' }>);
  }, [downloadedReciters, getRecitationQuality]);

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
      const baseLabel = result.type === 'ayah' ? 'Ayah' : result.type === 'surah' ? 'Surah' : 'Reciter';
      if (result.matchType) {
        const matchLabels = {
          exact: '🎯 Exact Match',
          partial: '📝 Partial Match',
          phonetic: '🔊 Phonetic',
          semantic: '🧠 Semantic',
          contextual: '🔗 Contextual'
        };
        return `${baseLabel} • ${matchLabels[result.matchType]}`;
      }
      return baseLabel;
    };
    
    const getConfidenceIndicator = () => {
      if (!result.confidence) return null;
      
      const confidence = result.confidence;
      if (confidence > 0.8) return <Star size={12} color={Colors.success} />;
      if (confidence > 0.6) return <TrendingUp size={12} color={Colors.warning} />;
      return <Zap size={12} color={Colors.textLight} />;
    };
    
    const getDownloadStatus = () => {
      if (result.isDownloaded) {
        return <CheckCircle size={14} color={Colors.success} />;
      }
      
      const progressKey = `${result.reciterId}-${result.surahNumber}`;
      const progress = downloadProgress[progressKey];
      
      if (progress && progress > 0 && progress < 1) {
        return (
          <View style={styles.downloadProgress}>
            <Text style={styles.downloadProgressText}>{Math.round(progress * 100)}%</Text>
          </View>
        );
      }
      
      return <Download size={14} color={Colors.textLight} />;
    };
    
    const getRelevanceColor = () => {
      if (!result.relevanceScore) return Colors.textLight;
      if (result.relevanceScore > 100) return Colors.success;
      if (result.relevanceScore > 50) return Colors.warning;
      return Colors.textLight;
    };
    
    const isCurrentlyPlaying = currentSurah === result.surahNumber && currentAyah === result.ayahNumber && isPlaying;
    const isCurrentTrack = currentSurah === result.surahNumber && currentAyah === result.ayahNumber;

    return (
      <TouchableOpacity key={result.id} style={[
        styles.resultCard,
        isCurrentTrack && styles.resultCardActive
      ]}>
        <View style={styles.resultHeader}>
          <View style={styles.resultIcon}>
            {getIcon()}
          </View>
          <View style={styles.resultContent}>
            <View style={styles.resultTitleRow}>
              <Text style={styles.resultTitle} numberOfLines={1}>{result.title}</Text>
              <View style={styles.resultBadges}>
                <View style={[styles.typeLabel, { borderColor: getRelevanceColor() }]}>
                  <Text style={[styles.typeLabelText, { color: getRelevanceColor() }]}>
                    {getTypeLabel()}
                  </Text>
                </View>
                {getConfidenceIndicator()}
              </View>
            </View>
            {result.subtitle && (
              <Text style={styles.resultSubtitle} numberOfLines={1}>{result.subtitle}</Text>
            )}
            <View style={styles.resultMetrics}>
              {result.relevanceScore && result.relevanceScore > 0 && (
                <Text style={[styles.relevanceScore, { color: getRelevanceColor() }]}>
                  Score: {Math.round(result.relevanceScore)}
                </Text>
              )}
              {result.confidence && (
                <Text style={styles.confidenceScore}>
                  Confidence: {Math.round(result.confidence * 100)}%
                </Text>
              )}
              <View style={styles.downloadStatusContainer}>
                {getDownloadStatus()}
                <Text style={styles.downloadStatusText}>
                  {result.isDownloaded ? 'Downloaded' : 'Online'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Audio Controls */}
          <View style={styles.audioControls}>
            {result.audioUrl && (
              <TouchableOpacity
                style={[
                  styles.playButton,
                  isCurrentlyPlaying && styles.playButtonActive
                ]}
                onPress={() => handlePlayAyah(result)}
                disabled={audioLoading}
              >
                {audioLoading && isCurrentTrack ? (
                  <Loader size={16} color={Colors.textOnPrimary} />
                ) : isCurrentlyPlaying ? (
                  <Pause size={16} color={Colors.textOnPrimary} />
                ) : (
                  <Play size={16} color={Colors.textOnPrimary} />
                )}
              </TouchableOpacity>
            )}
            
            {isCurrentTrack && isPlaying && (
              <TouchableOpacity
                style={styles.stopButton}
                onPress={handleStopAudio}
              >
                <StopCircle size={16} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Currently Playing Indicator */}
        {isCurrentTrack && (
          <View style={styles.playingIndicator}>
            <View style={styles.playingDot} />
            <Text style={styles.playingText}>Now Playing</Text>
          </View>
        )}
        
        {result.arabicText && (
          <View style={styles.arabicContainer}>
            <Text style={styles.arabicText}>{result.arabicText}</Text>
            {result.translation && (
              <Text style={styles.translationText}>{result.translation}</Text>
            )}
            
            {/* Contextual matches for better understanding */}
            {result.contextualMatches && result.contextualMatches.length > 0 && (
              <View style={styles.contextualMatches}>
                <Text style={styles.contextualTitle}>Context:</Text>
                {result.contextualMatches.map((match, index) => (
                  <Text key={index} style={styles.contextualText}>
                    &quot;...{match}...&quot;
                  </Text>
                ))}
              </View>
            )}
            
            {/* Quality indicator */}
            {result.recitationQuality && (
              <View style={styles.qualityIndicator}>
                <Text style={[
                  styles.qualityText,
                  {
                    color: result.recitationQuality === 'high' ? Colors.success :
                           result.recitationQuality === 'medium' ? Colors.warning : Colors.textLight
                  }
                ]}>
                  {result.recitationQuality.toUpperCase()} QUALITY
                </Text>
              </View>
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
          <Text style={styles.subtitle}>
            {isOnline ? 'AI-Powered Text Search' : 'Offline Search Mode'}
          </Text>
        </View>
      </LinearGradient>

      {/* Search Container */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={20} color={Colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={[
                styles.searchInput,
                { fontSize: fontSizeValue }
              ]}
              placeholder={isOnline ? "Search verses, surahs, reciters..." : "Search offline content..."}
              value={searchQuery}
              onChangeText={handleTextSearch}
              placeholderTextColor={Colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          {/* Reciter Selection */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.reciterSelector}
            contentContainerStyle={styles.reciterSelectorContent}
          >
            {TOP_RECITERS.slice(0, 10).map((reciter) => {
              const availability = reciterAvailability[reciter.id];
              return (
                <TouchableOpacity
                  key={reciter.id}
                  style={[
                    styles.reciterChip,
                    selectedReciter === reciter.id && styles.reciterChipActive,
                    availability?.isDefault && styles.reciterChipDefault
                  ]}
                  onPress={() => setSelectedReciter(reciter.id)}
                >
                  <View style={styles.reciterChipContent}>
                    <Text style={[
                      styles.reciterChipText,
                      selectedReciter === reciter.id && styles.reciterChipTextActive
                    ]}>
                      {reciter.name.split(' ')[0]}
                    </Text>
                    <View style={styles.reciterIndicators}>
                      {availability?.isDefault && (
                        <View style={styles.defaultIndicator}>
                          <CheckCircle size={8} color={Colors.success} />
                        </View>
                      )}
                      {availability?.quality === 'high' && (
                        <Star size={8} color={Colors.islamicGold} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

        </View>
      </View>

      {/* Results */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Loader size={32} color={Colors.primary} />
            <Text style={styles.loadingText}>
              {isOnline ? 'Searching...' : 'Searching offline...'}
            </Text>
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
              • Search in Arabic or English{"\n"}
              {!isOnline && '• Currently in offline mode - limited content available'}
            </Text>
            
            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>Try searching for:</Text>
              <View style={styles.exampleTags}>
                <Text style={styles.exampleSubtitle}>Popular searches:</Text>
                <View style={styles.exampleTagsRow}>
                  {trendingSearches.slice(0, 4).map((example) => (
                    <TouchableOpacity
                      key={example}
                      style={styles.exampleTag}
                      onPress={() => handleTextSearch(example)}
                    >
                      <TrendingUp size={12} color={Colors.primary} />
                      <Text style={styles.exampleTagText}>{example}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {searchHistory.length > 0 && (
                  <>
                    <Text style={styles.exampleSubtitle}>Recent searches:</Text>
                    <View style={styles.exampleTagsRow}>
                      {searchHistory.slice(0, 3).map((search, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.exampleTag, styles.historyTag]}
                          onPress={() => handleTextSearch(search)}
                        >
                          <Text style={[styles.exampleTagText, styles.historyTagText]}>{search}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
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
              {!isOnline && '\n\nOffline mode: Limited content available'}
            </Text>
          </View>
        )}

        {!isLoading && searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeaderRow}>
              <Text style={styles.resultsHeader}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </Text>
              <Text style={styles.resultsSubheader}>
                Reciter: {getReciterById(selectedReciter)?.name || 'Unknown'}
              </Text>
            </View>
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
    alignItems: 'center',
    width: '100%',
  },
  exampleSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  exampleTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  exampleTag: {
    backgroundColor: Colors.primaryOverlay,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exampleTagText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  historyTag: {
    backgroundColor: Colors.secondaryOverlay,
    borderColor: Colors.secondary,
  },
  historyTagText: {
    color: Colors.secondary,
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
  resultBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  resultMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  relevanceScore: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  confidenceScore: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '500',
  },
  downloadStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadStatusText: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '500',
  },
  downloadProgress: {
    backgroundColor: Colors.primaryOverlay,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  downloadProgressText: {
    fontSize: 9,
    color: Colors.primary,
    fontWeight: '600',
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
  contextualMatches: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
  },
  contextualTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  contextualText: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  qualityIndicator: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  qualityText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // New styles for enhanced search
  resultCardActive: {
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.primaryOverlay,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  playButtonActive: {
    backgroundColor: Colors.secondary,
  },
  stopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    marginTop: 8,
  },
  playingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  playingText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  reciterSelector: {
    marginTop: 8,
  },
  reciterSelectorContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  reciterChip: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
  },
  reciterChipActive: {
    backgroundColor: Colors.primaryOverlay,
    borderColor: Colors.primary,
  },
  reciterChipDefault: {
    borderWidth: 2,
    borderColor: Colors.success,
  },
  reciterChipContent: {
    alignItems: 'center',
    gap: 2,
  },
  reciterChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  reciterChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  reciterIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  defaultIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primaryOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsHeaderRow: {
    marginBottom: 16,
  },
  resultsSubheader: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
});