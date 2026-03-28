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
        hadiths: result.hadiths.map(hadith => ({
          id: hadith.id,
          number: hadith.number,
          arab: hadith.arab,
          translation: hadith.translation,
          transliteration: hadith.transliteration,
          narrator: hadith.narrator,
          collection: hadith.collection,
          grade: hadith.grade,
          book: hadith.book,
          chapter: hadith.chapter
        })),
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
        transliteration: hadith.transliteration,
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
      // Search for the hadith in our database
      const foundHadith = searchHadiths(input.text);
      
      if (foundHadith.length > 0) {
        const hadith = foundHadith[0];
        return {
          isAuthentic: hadith.grade === 'Sahih' || hadith.grade === 'Hasan',
          grade: hadith.grade,
          narrator: hadith.narrator,
          source: hadith.collection,
          reference: `${hadith.book}, Hadith ${hadith.number}`,
          explanation: `This hadith is found in ${hadith.collection} and is graded as ${hadith.grade}. It was narrated by ${hadith.narrator}.`
        };
      }
      
      // If not found in database, provide general guidance
      return {
        isAuthentic: false,
        grade: 'Unknown',
        narrator: 'Not found in database',
        source: 'Unknown',
        reference: 'Not available',
        explanation: 'This hadith was not found in our database. Please verify with authentic hadith collections like Sahih Bukhari, Sahih Muslim, or consult with Islamic scholars.'
      };
    } catch (error) {
      console.error('Error verifying hadith:', error);
      throw new Error('Failed to verify hadith');
    }
  });