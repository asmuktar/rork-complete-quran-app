import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import quranApi from "../../../../../services/quran-api";

export const getSurahsProcedure = publicProcedure
  .query(async () => {
    console.log('Fetching all surahs using QuranApiService...');
    
    try {
      const surahs = await quranApi.getAllSurahs();
      console.log(`Successfully fetched ${surahs.length} surahs`);
      return surahs;
    } catch (error) {
      console.error('Error fetching surahs:', error);
      throw new Error('Failed to fetch surahs from API');
    }
  });

export const getSurahProcedure = publicProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    console.log(`Fetching surah ${input.id} using QuranApiService...`);
    
    try {
      const surahData = await quranApi.getSurah(input.id);
      
      if (!surahData || !surahData.ayahs || surahData.ayahs.length === 0) {
        throw new Error(`No data found for surah ${input.id}`);
      }
      
      console.log(`Successfully fetched surah ${input.id} with ${surahData.ayahs.length} verses`);
      
      // Transform to expected format
      return {
        chapter: {
          id: input.id,
          name_simple: surahData.englishName || `Surah ${input.id}`,
          name_arabic: surahData.name || '',
          verses_count: surahData.numberOfAyahs || surahData.ayahs.length,
          revelation_place: 'meccan' // Default, could be enhanced
        },
        verses: surahData.ayahs.map((ayah: any) => ({
          id: ayah.number,
          verse_number: ayah.numberInSurah,
          verse_key: `${input.id}:${ayah.numberInSurah}`,
          text_uthmani: ayah.text,
          translations: ayah.translation ? [{
            id: 131,
            text: ayah.translation
          }] : [],
          juz_number: ayah.juz,
          hizb_number: ayah.hizb,
          page_number: ayah.page,
          sajda_number: ayah.sajda ? 1 : null
        }))
      };
    } catch (error) {
      console.error(`Error fetching surah ${input.id}:`, error);
      throw new Error(`Failed to fetch surah ${input.id} from API`);
    }
  });

export const getAllVersesWithTranslationsProcedure = publicProcedure
  .query(async () => {
    console.log('Fetching sample verses with translations...');
    
    try {
      // Fetch first 5 surahs as sample data to avoid overwhelming the API
      const sampleSurahs = [1, 2, 3, 112, 113, 114]; // Al-Fatihah, Al-Baqarah, Ali Imran, and last 3 surahs
      const allVerses: any[] = [];
      
      for (const surahId of sampleSurahs) {
        try {
          const surahData = await quranApi.getSurah(surahId);
          if (surahData && surahData.ayahs) {
            const verses = surahData.ayahs.map((ayah: any) => ({
              id: ayah.number,
              verse_number: ayah.numberInSurah,
              verse_key: `${surahId}:${ayah.numberInSurah}`,
              text_uthmani: ayah.text,
              translations: ayah.translation ? [{
                id: 131,
                text: ayah.translation
              }] : []
            }));
            allVerses.push(...verses);
          }
        } catch (error) {
          console.error(`Error fetching surah ${surahId}:`, error);
          continue;
        }
      }
      
      console.log(`Successfully fetched ${allVerses.length} sample verses`);
      return allVerses;
    } catch (error) {
      console.error('Error fetching verses:', error);
      console.log('Returning empty array for local search fallback');
      return [];
    }
  });

// New procedure to get a specific ayah
export const getAyahProcedure = publicProcedure
  .input(z.object({ 
    surahNumber: z.number(), 
    ayahNumber: z.number() 
  }))
  .query(async ({ input }) => {
    console.log(`Fetching ayah ${input.surahNumber}:${input.ayahNumber}...`);
    
    try {
      const ayahData = await quranApi.getAyah(input.surahNumber, input.ayahNumber);
      
      if (!ayahData) {
        throw new Error(`No data found for ayah ${input.surahNumber}:${input.ayahNumber}`);
      }
      
      return {
        id: ayahData.number,
        verse_number: ayahData.numberInSurah,
        verse_key: `${input.surahNumber}:${input.ayahNumber}`,
        text_uthmani: ayahData.text,
        translations: ayahData.translation ? [{
          id: 131,
          text: ayahData.translation
        }] : [],
        juz_number: ayahData.juz,
        hizb_number: ayahData.hizb,
        page_number: ayahData.page,
        sajda_number: ayahData.sajda ? 1 : null
      };
    } catch (error) {
      console.error(`Error fetching ayah ${input.surahNumber}:${input.ayahNumber}:`, error);
      throw new Error(`Failed to fetch ayah ${input.surahNumber}:${input.ayahNumber} from API`);
    }
  });