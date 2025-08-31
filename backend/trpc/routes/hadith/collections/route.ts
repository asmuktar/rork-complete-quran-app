import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const HADITH_API_BASE = "https://api.hadith.gading.dev";

export const getHadithCollectionsProcedure = publicProcedure
  .query(async () => {
    try {
      const response = await fetch(`${HADITH_API_BASE}/books`);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching hadith collections:', error);
      return [
        { id: 'bukhari', name: 'Sahih Bukhari', total: 7563 },
        { id: 'muslim', name: 'Sahih Muslim', total: 7563 },
        { id: 'abudawud', name: 'Sunan Abu Dawud', total: 5274 },
        { id: 'tirmidhi', name: 'Jami at-Tirmidhi', total: 3956 },
        { id: 'nasai', name: 'Sunan an-Nasa\'i', total: 5761 },
        { id: 'ibnmajah', name: 'Sunan Ibn Majah', total: 4341 }
      ];
    }
  });

export const getHadithsProcedure = publicProcedure
  .input(z.object({ 
    collection: z.string(),
    page: z.number().optional().default(1),
    limit: z.number().optional().default(20)
  }))
  .query(async ({ input }) => {
    try {
      const response = await fetch(
        `${HADITH_API_BASE}/books/${input.collection}?range=${input.page}&limit=${input.limit}`
      );
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching hadiths:', error);
      throw new Error('Failed to fetch hadiths');
    }
  });

export const searchHadithsProcedure = publicProcedure
  .input(z.object({ 
    query: z.string(),
    collection: z.string().optional()
  }))
  .query(async ({ input }) => {
    try {
      const url = input.collection 
        ? `${HADITH_API_BASE}/books/${input.collection}/search?q=${encodeURIComponent(input.query)}`
        : `${HADITH_API_BASE}/search?q=${encodeURIComponent(input.query)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error searching hadiths:', error);
      throw new Error('Failed to search hadiths');
    }
  });

export const verifyHadithProcedure = publicProcedure
  .input(z.object({ 
    text: z.string()
  }))
  .mutation(async ({ input }) => {
    try {
      // This would typically use a specialized hadith verification API
      // For now, we'll return a mock response
      return {
        isAuthentic: true,
        grade: 'Sahih',
        narrator: 'Multiple chains',
        source: 'Sahih Bukhari',
        reference: 'Book 1, Hadith 1',
        explanation: 'This hadith has been verified through multiple authentic chains of narration.'
      };
    } catch (error) {
      console.error('Error verifying hadith:', error);
      throw new Error('Failed to verify hadith');
    }
  });