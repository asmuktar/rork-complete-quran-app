import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// Use multiple API sources for better reliability
const QURAN_API_BASE = "https://api.quran.com/api/v4";
const ALQURAN_API_BASE = "https://api.alquran.cloud/v1";

export const getSurahsProcedure = publicProcedure
  .query(async () => {
    try {
      // Try primary API first
      let response = await fetch(`${QURAN_API_BASE}/chapters?language=en`);
      
      if (!response.ok) {
        console.log('Primary API failed, trying fallback...');
        // Fallback to alquran.cloud API
        response = await fetch(`${ALQURAN_API_BASE}/surah`);
        const data = await response.json();
        
        // Transform the data to match expected format
        return data.data?.map((surah: any) => ({
          id: surah.number,
          name_simple: surah.englishName,
          name_arabic: surah.name,
          verses_count: surah.numberOfAyahs,
          revelation_place: surah.revelationType.toLowerCase()
        })) || [];
      }
      
      const data = await response.json();
      return data.chapters || [];
    } catch (error) {
      console.error('Error fetching surahs:', error);
      throw new Error('Failed to fetch surahs');
    }
  });

export const getSurahProcedure = publicProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    try {
      // Try primary API first
      let chapterResponse = await fetch(`${QURAN_API_BASE}/chapters/${input.id}?language=en`);
      let versesResponse = await fetch(`${QURAN_API_BASE}/verses/by_chapter/${input.id}?language=en&words=true&translations=131,20`);
      
      if (!chapterResponse.ok || !versesResponse.ok) {
        console.log('Primary API failed for surah, trying fallback...');
        // Fallback to alquran.cloud API
        const fallbackResponse = await fetch(`${ALQURAN_API_BASE}/surah/${input.id}/editions/ar.alafasy,en.sahih`);
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.data && Array.isArray(fallbackData.data)) {
          const arabicData = fallbackData.data.find((d: any) => d.edition?.identifier === 'ar.alafasy');
          const englishData = fallbackData.data.find((d: any) => d.edition?.identifier === 'en.sahih');
          
          const verses = arabicData?.ayahs?.map((ayah: any, index: number) => {
            const englishAyah = englishData?.ayahs?.[index];
            return {
              id: ayah.number,
              verse_number: ayah.numberInSurah,
              verse_key: `${input.id}:${ayah.numberInSurah}`,
              text_uthmani: ayah.text,
              translations: englishAyah ? [{
                id: 131,
                text: englishAyah.text
              }] : []
            };
          }) || [];
          
          return {
            chapter: {
              id: input.id,
              name_simple: arabicData?.englishName || `Surah ${input.id}`,
              name_arabic: arabicData?.name || '',
              verses_count: arabicData?.numberOfAyahs || 0,
              revelation_place: arabicData?.revelationType?.toLowerCase() || 'meccan'
            },
            verses
          };
        }
      }
      
      const chapterData = await chapterResponse.json();
      const versesData = await versesResponse.json();
      
      return {
        chapter: chapterData.chapter,
        verses: versesData.verses || []
      };
    } catch (error) {
      console.error('Error fetching surah:', error);
      throw new Error('Failed to fetch surah');
    }
  });

export const getAllVersesWithTranslationsProcedure = publicProcedure
  .query(async () => {
    try {
      // Try to fetch all verses with translations for search functionality
      let response = await fetch(`${QURAN_API_BASE}/verses/by_page/1?language=en&words=true&translations=131,20&per_page=6236`);
      
      if (!response.ok) {
        console.log('Primary API failed for all verses, using local data...');
        // Return empty array to fall back to local search
        return [];
      }
      
      const data = await response.json();
      return data.verses || [];
    } catch (error) {
      console.error('Error fetching all verses:', error);
      // Don't throw error, return empty array to use local search
      return [];
    }
  });