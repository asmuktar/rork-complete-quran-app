import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { HADITH_COLLECTIONS, getHadithsByCollection, searchHadiths } from "../../../../../constants/hadith-data";

export const getHadithCollectionsProcedure = publicProcedure
  .query(async () => {
    console.log('Fetching hadith collections...');
    return HADITH_COLLECTIONS.map(collection => ({
      id: collection.id,
      name: collection.name,
      arabicName: collection.arabicName,
      total: collection.totalHadiths,
      description: collection.description,
      compiler: collection.compiler,
      authenticity: collection.authenticity,
      available: collection.available
    }));
  });

export const getHadithsProcedure = publicProcedure
  .input(z.object({ 
    collection: z.string(),
    page: z.number().optional().default(1),
    limit: z.number().optional().default(20)
  }))
  .query(async ({ input }) => {
    console.log(`Fetching hadiths for collection: ${input.collection}, page: ${input.page}`);
    
    try {
      const result = getHadithsByCollection(input.collection, input.page, input.limit);
      
      return {
        hadiths: result.hadiths,
        total: result.total,
        page: input.page,
        hasMore: result.hasMore
      };
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
    console.log(`Searching hadiths with query: "${input.query}", collection: ${input.collection || 'all'}`);
    
    try {
      const results = searchHadiths(input.query, input.collection);
      
      return results.map(hadith => ({
        id: hadith.id,
        number: hadith.number,
        arab: hadith.arab,
        translation: hadith.translation,
        narrator: hadith.narrator,
        collection: hadith.collection,
        grade: hadith.grade,
        book: hadith.book,
        chapter: hadith.chapter
      }));
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