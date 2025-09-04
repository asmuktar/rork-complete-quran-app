import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const QURAN_API_BASE = "https://api.quran.com/api/v4";

export const getSurahsProcedure = publicProcedure
  .query(async () => {
    try {
      const response = await fetch(`${QURAN_API_BASE}/chapters?language=en`);
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
      const [chapterResponse, versesResponse] = await Promise.all([
        fetch(`${QURAN_API_BASE}/chapters/${input.id}?language=en`),
        fetch(`${QURAN_API_BASE}/verses/by_chapter/${input.id}?language=en&words=true&translations=131,20`)
      ]);
      
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
      // Fetch all verses with translations for search functionality
      const response = await fetch(`${QURAN_API_BASE}/verses/by_page/1?language=en&words=true&translations=131,20&per_page=6236`);
      const data = await response.json();
      return data.verses || [];
    } catch (error) {
      console.error('Error fetching all verses:', error);
      throw new Error('Failed to fetch verses');
    }
  });