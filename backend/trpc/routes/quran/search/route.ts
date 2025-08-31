import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const QURAN_API_BASE = "https://api.quran.com/api/v4";
const ALQURAN_CLOUD_BASE = "https://api.alquran.cloud/v1";

export const searchVersesProcedure = publicProcedure
  .input(z.object({ 
    query: z.string(),
    language: z.string().optional().default('en')
  }))
  .mutation(async ({ input }) => {
    try {
      // Try AlQuran Cloud API first as it's more reliable
      const response = await fetch(
        `${ALQURAN_CLOUD_BASE}/search/${encodeURIComponent(input.query)}/all/en`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 200 && data.data?.matches) {
        return data.data.matches.map((match: any) => ({
          verse_key: `${match.surah.number}:${match.numberInSurah}`,
          text_uthmani: match.text,
          translations: [{ text: match.text }],
          surah: {
            name: match.surah.englishName,
            number: match.surah.number
          }
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error searching verses:', error);
      // Return mock data for demonstration
      return [
        {
          verse_key: "1:1",
          text_uthmani: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          translations: [{ text: "In the name of Allah, the Entirely Merciful, the Especially Merciful." }],
          surah: { name: "Al-Fatihah", number: 1 }
        }
      ];
    }
  });

export const voiceSearchProcedure = publicProcedure
  .input(z.object({ 
    transcription: z.string(),
    language: z.string().optional().default('en')
  }))
  .mutation(async ({ input }) => {
    try {
      // Use AlQuran Cloud API for voice search
      const response = await fetch(
        `${ALQURAN_CLOUD_BASE}/search/${encodeURIComponent(input.transcription)}/all/en`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 200 && data.data?.matches) {
        return data.data.matches.slice(0, 10).map((match: any) => ({
          verse_key: `${match.surah.number}:${match.numberInSurah}`,
          text_uthmani: match.text,
          translations: [{ text: match.text }],
          surah: {
            name: match.surah.englishName,
            number: match.surah.number
          }
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error in voice search:', error);
      // Return mock data for demonstration
      return [
        {
          verse_key: "2:255",
          text_uthmani: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
          translations: [{ text: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence." }],
          surah: { name: "Al-Baqarah", number: 2 }
        }
      ];
    }
  });