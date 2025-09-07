import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// Enhanced fetch with retry logic
async function enhancedFetch(
  url: string, 
  options?: RequestInit & { retries?: number; retryDelay?: number }
): Promise<Response> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options || {};
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || attempt === retries) {
        return response;
      }
      
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === retries) {
        break;
      }
      
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retry attempt ${attempt + 1}/${retries} for ${url} after ${delay}ms`);
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

// Concurrent API calls utility
async function concurrentApiCalls<T>(
  calls: (() => Promise<T>)[],
  batchSize = 10
): Promise<{ success: boolean; data?: T; error?: string }[]> {
  const results: { success: boolean; data?: T; error?: string }[] = [];
  
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(call => call())
    );
    
    const processedResults = batchResults.map(result => 
      result.status === 'fulfilled'
        ? { success: true, data: result.value }
        : { success: false, error: result.reason?.message || 'Unknown error' }
    );
    
    results.push(...processedResults);
    
    if (i + batchSize < calls.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

// Use multiple API sources for better reliability
const QURAN_API_BASE = "https://api.quran.com/api/v4";
const ALQURAN_API_BASE = "https://api.alquran.cloud/v1";
const QURANAPI_BASE = "https://quranapi.pages.dev/api";

// API endpoints with fallbacks
const API_ENDPOINTS = {
  surahs: [
    `${QURAN_API_BASE}/chapters?language=en`,
    `${ALQURAN_API_BASE}/surah`,
    `${QURANAPI_BASE}/surahs.json`
  ],
  surah: (id: number) => [
    `${QURAN_API_BASE}/chapters/${id}?language=en`,
    `${ALQURAN_API_BASE}/surah/${id}/editions/ar.alafasy,en.sahih`,
    `${QURANAPI_BASE}/surah/${id}.json`
  ],
  verses: (id: number) => [
    `${QURAN_API_BASE}/verses/by_chapter/${id}?language=en&words=true&translations=131,20`,
    `${ALQURAN_API_BASE}/surah/${id}/ar.alafasy`,
    `${QURANAPI_BASE}/surah/${id}/ayahs.json`
  ]
};

export const getSurahsProcedure = publicProcedure
  .query(async () => {
    console.log('Fetching all surahs with concurrent API calls...');
    
    // Try multiple APIs concurrently for better reliability
    const apiCalls = API_ENDPOINTS.surahs.map(url => async () => {
      const response = await enhancedFetch(url, { retries: 2 });
      const data = await response.json();
      
      // Normalize data format based on API source
      if (url.includes('quran.com')) {
        return data.chapters || [];
      } else if (url.includes('alquran.cloud')) {
        return data.data?.map((surah: any) => ({
          id: surah.number,
          name_simple: surah.englishName,
          name_arabic: surah.name,
          verses_count: surah.numberOfAyahs,
          revelation_place: surah.revelationType?.toLowerCase() || 'meccan'
        })) || [];
      } else if (url.includes('quranapi.pages.dev')) {
        return data.map((surah: any) => ({
          id: surah.id,
          name_simple: surah.name,
          name_arabic: surah.arabic,
          verses_count: surah.ayahs,
          revelation_place: surah.type?.toLowerCase() || 'meccan'
        })) || [];
      }
      return [];
    });
    
    const results = await concurrentApiCalls(apiCalls, 3);
    
    // Return the first successful result
    for (const result of results) {
      if (result.success && result.data && result.data.length > 0) {
        console.log(`Successfully fetched ${result.data.length} surahs`);
        return result.data;
      }
    }
    
    console.error('All API calls failed for surahs');
    throw new Error('Failed to fetch surahs from all sources');
  });

export const getSurahProcedure = publicProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    console.log(`Fetching surah ${input.id} with concurrent API calls...`);
    
    // Fetch chapter info and verses concurrently from multiple sources
    const chapterCalls = API_ENDPOINTS.surah(input.id).map(url => async () => {
      const response = await enhancedFetch(url, { retries: 2 });
      const data = await response.json();
      
      if (url.includes('quran.com')) {
        return { type: 'quran.com', data: data.chapter };
      } else if (url.includes('alquran.cloud')) {
        const arabicData = data.data?.find((d: any) => d.edition?.identifier === 'ar.alafasy');
        return {
          type: 'alquran.cloud',
          data: {
            id: input.id,
            name_simple: arabicData?.englishName || `Surah ${input.id}`,
            name_arabic: arabicData?.name || '',
            verses_count: arabicData?.numberOfAyahs || 0,
            revelation_place: arabicData?.revelationType?.toLowerCase() || 'meccan'
          }
        };
      }
      return { type: 'unknown', data: null };
    });
    
    const versesCalls = API_ENDPOINTS.verses(input.id).map(url => async () => {
      const response = await enhancedFetch(url, { retries: 2 });
      const data = await response.json();
      
      if (url.includes('quran.com')) {
        return { type: 'quran.com', data: data.verses || [] };
      } else if (url.includes('alquran.cloud')) {
        return {
          type: 'alquran.cloud',
          data: data.data?.ayahs?.map((ayah: any) => ({
            id: ayah.number,
            verse_number: ayah.numberInSurah,
            verse_key: `${input.id}:${ayah.numberInSurah}`,
            text_uthmani: ayah.text,
            translations: []
          })) || []
        };
      }
      return { type: 'unknown', data: [] };
    });
    
    // Execute all calls concurrently
    const [chapterResults, versesResults] = await Promise.all([
      concurrentApiCalls(chapterCalls, 3),
      concurrentApiCalls(versesCalls, 3)
    ]);
    
    // Find first successful chapter result
    let chapter = null;
    for (const result of chapterResults) {
      if (result.success && result.data?.data) {
        chapter = result.data.data;
        break;
      }
    }
    
    // Find first successful verses result
    let verses: any[] = [];
    for (const result of versesResults) {
      if (result.success && result.data?.data && result.data.data.length > 0) {
        verses = result.data.data;
        break;
      }
    }
    
    if (!chapter) {
      throw new Error(`Failed to fetch chapter ${input.id} from all sources`);
    }
    
    console.log(`Successfully fetched surah ${input.id} with ${verses.length} verses`);
    
    return {
      chapter,
      verses
    };
  });

export const getAllVersesWithTranslationsProcedure = publicProcedure
  .query(async () => {
    console.log('Fetching all verses with translations...');
    
    const apiCalls = [
      async () => {
        const response = await enhancedFetch(
          `${QURAN_API_BASE}/verses/by_page/1?language=en&words=true&translations=131,20&per_page=6236`,
          { retries: 1 }
        );
        const data = await response.json();
        return data.verses || [];
      },
      async () => {
        // Fallback: fetch all surahs and their verses
        const surahsResponse = await enhancedFetch(`${ALQURAN_API_BASE}/surah`, { retries: 1 });
        const surahsData = await surahsResponse.json();
        
        if (!surahsData.data) return [];
        
        // Fetch first few surahs as sample data
        const sampleSurahs = surahsData.data.slice(0, 5);
        const verseCalls = sampleSurahs.map((surah: any) => async () => {
          const response = await enhancedFetch(
            `${ALQURAN_API_BASE}/surah/${surah.number}/editions/ar.alafasy,en.sahih`,
            { retries: 1 }
          );
          const data = await response.json();
          
          if (data.data && Array.isArray(data.data)) {
            const arabicData = data.data.find((d: any) => d.edition?.identifier === 'ar.alafasy');
            const englishData = data.data.find((d: any) => d.edition?.identifier === 'en.sahih');
            
            return arabicData?.ayahs?.map((ayah: any, index: number) => {
              const englishAyah = englishData?.ayahs?.[index];
              return {
                id: ayah.number,
                verse_number: ayah.numberInSurah,
                verse_key: `${surah.number}:${ayah.numberInSurah}`,
                text_uthmani: ayah.text,
                translations: englishAyah ? [{
                  id: 131,
                  text: englishAyah.text
                }] : []
              };
            }) || [];
          }
          return [];
        });
        
        const results = await concurrentApiCalls(verseCalls, 3);
        return results.flatMap((result: any) => result.success ? result.data || [] : []);
      }
    ];
    
    const results = await concurrentApiCalls(apiCalls, 2);
    
    // Return the first successful result with data
    for (const result of results) {
      if (result.success && result.data && result.data.length > 0) {
        console.log(`Successfully fetched ${result.data.length} verses`);
        return result.data;
      }
    }
    
    console.log('No verses found, returning empty array for local search fallback');
    return [];
  });