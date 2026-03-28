import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const ALQURAN_CLOUD_BASE = "https://api.alquran.cloud/v1";

export const searchVersesProcedure = publicProcedure
  .input(z.object({ 
    query: z.string().min(1, 'Query cannot be empty'),
    language: z.string().optional().default('en')
  }))
  .mutation(async ({ input }) => {
    try {
      // Validate and sanitize input
      const sanitizedQuery = input.query.trim();
      if (!sanitizedQuery) {
        console.warn('Empty query provided to search');
        return [];
      }

      console.log('Searching for:', sanitizedQuery);
      
      // Try AlQuran Cloud API first as it's more reliable
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(
        `${ALQURAN_CLOUD_BASE}/search/${encodeURIComponent(sanitizedQuery)}/all/en`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Islamic-App/1.0'
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`API responded with status ${response.status}: ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response structure:', { 
        code: data.code, 
        hasData: !!data.data, 
        hasMatches: !!data.data?.matches,
        matchCount: data.data?.matches?.length || 0
      });
      
      if (data.code === 200 && data.data?.matches && Array.isArray(data.data.matches)) {
        const processedMatches = data.data.matches
          .filter((match: any) => {
            // Validate match structure
            return match && 
                   match.surah && 
                   typeof match.surah.number === 'number' && 
                   typeof match.numberInSurah === 'number' &&
                   typeof match.text === 'string' &&
                   match.text.trim().length > 0;
          })
          .map((match: any) => {
            try {
              return {
                verse_key: `${match.surah.number}:${match.numberInSurah}`,
                text_uthmani: match.text || '',
                translations: [{ text: match.text || '' }],
                surah: {
                  name: match.surah.englishName || match.surah.name || `Surah ${match.surah.number}`,
                  number: match.surah.number
                }
              };
            } catch (matchError) {
              console.error('Error processing match:', matchError, match);
              return null;
            }
          })
          .filter((match: any) => match !== null);

        console.log(`Processed ${processedMatches.length} valid matches`);
        return processedMatches;
      }
      
      console.log('No valid matches found in API response');
      return [];
    } catch (error) {
      console.error('Error searching verses:', error);
      
      // Production-ready: Return empty array when API fails
      console.error('Search API failed, returning empty results for production');
      return [];
    }
  });

export const voiceSearchProcedure = publicProcedure
  .input(z.object({ 
    transcription: z.string().min(1, 'Transcription cannot be empty'),
    language: z.string().optional().default('en')
  }))
  .mutation(async ({ input }) => {
    try {
      // Validate and sanitize input
      const sanitizedTranscription = input.transcription.trim();
      if (!sanitizedTranscription) {
        console.warn('Empty transcription provided to voice search');
        return [];
      }

      console.log('Voice searching for:', sanitizedTranscription);
      
      // Use AlQuran Cloud API for voice search with enhanced error handling
      const response = await fetch(
        `${ALQURAN_CLOUD_BASE}/search/${encodeURIComponent(sanitizedTranscription)}/all/en`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Islamic-App/1.0'
          }
        }
      );
      
      if (!response.ok) {
        console.error(`Voice search API responded with status ${response.status}: ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Voice search API response:', { 
        code: data.code, 
        hasData: !!data.data, 
        hasMatches: !!data.data?.matches,
        matchCount: data.data?.matches?.length || 0
      });
      
      if (data.code === 200 && data.data?.matches && Array.isArray(data.data.matches)) {
        const processedMatches = data.data.matches
          .slice(0, 10) // Limit voice search results to top 10
          .filter((match: any) => {
            // Validate match structure
            return match && 
                   match.surah && 
                   typeof match.surah.number === 'number' && 
                   typeof match.numberInSurah === 'number' &&
                   typeof match.text === 'string' &&
                   match.text.trim().length > 0;
          })
          .map((match: any) => {
            try {
              return {
                verse_key: `${match.surah.number}:${match.numberInSurah}`,
                text_uthmani: match.text || '',
                translations: [{ text: match.text || '' }],
                surah: {
                  name: match.surah.englishName || match.surah.name || `Surah ${match.surah.number}`,
                  number: match.surah.number
                }
              };
            } catch (matchError) {
              console.error('Error processing voice search match:', matchError, match);
              return null;
            }
          })
          .filter((match: any) => match !== null);

        console.log(`Voice search processed ${processedMatches.length} valid matches`);
        return processedMatches;
      }
      
      console.log('No valid matches found in voice search API response');
      return [];
    } catch (error) {
      console.error('Error in voice search:', error);
      
      // Production-ready: Return empty array when voice search API fails
      console.error('Voice search API failed, returning empty results for production');
      return [];
    }
  });