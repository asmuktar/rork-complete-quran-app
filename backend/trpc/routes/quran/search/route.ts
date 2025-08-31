import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const QURAN_API_BASE = "https://api.quran.com/api/v4";

export const searchVersesProcedure = publicProcedure
  .input(z.object({ 
    query: z.string(),
    language: z.string().optional().default('en')
  }))
  .mutation(async ({ input }) => {
    try {
      const response = await fetch(
        `${QURAN_API_BASE}/search?q=${encodeURIComponent(input.query)}&size=20&language=${input.language}`
      );
      const data = await response.json();
      return data.search?.results || [];
    } catch (error) {
      console.error('Error searching verses:', error);
      throw new Error('Failed to search verses');
    }
  });

export const voiceSearchProcedure = publicProcedure
  .input(z.object({ 
    transcription: z.string(),
    language: z.string().optional().default('en')
  }))
  .mutation(async ({ input }) => {
    try {
      // Use fuzzy matching for voice search
      const response = await fetch(
        `${QURAN_API_BASE}/search?q=${encodeURIComponent(input.transcription)}&size=10&language=${input.language}`
      );
      const data = await response.json();
      return data.search?.results || [];
    } catch (error) {
      console.error('Error in voice search:', error);
      throw new Error('Failed to process voice search');
    }
  });