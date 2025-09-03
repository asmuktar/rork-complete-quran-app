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
      
      // Return comprehensive fallback data with popular verses
      const fallbackData = [
        {
          verse_key: "1:1",
          text_uthmani: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          translations: [{ text: "In the name of Allah, the Entirely Merciful, the Especially Merciful." }],
          surah: { name: "Al-Fatihah", number: 1 }
        },
        {
          verse_key: "2:255",
          text_uthmani: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
          translations: [{ text: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep." }],
          surah: { name: "Al-Baqarah", number: 2 }
        },
        {
          verse_key: "112:1",
          text_uthmani: "قُلْ هُوَ اللَّهُ أَحَدٌ",
          translations: [{ text: "Say, He is Allah, [who is] One" }],
          surah: { name: "Al-Ikhlas", number: 112 }
        },
        {
          verse_key: "2:286",
          text_uthmani: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
          translations: [{ text: "Allah does not charge a soul except [with that within] its capacity." }],
          surah: { name: "Al-Baqarah", number: 2 }
        },
        {
          verse_key: "3:26",
          text_uthmani: "قُلِ اللَّهُمَّ مَالِكَ الْمُلْكِ تُؤْتِي الْمُلْكَ مَن تَشَاءُ",
          translations: [{ text: "Say, O Allah, Owner of Sovereignty, You give sovereignty to whom You will" }],
          surah: { name: "Ali 'Imran", number: 3 }
        },
        {
          verse_key: "18:10",
          text_uthmani: "إِذْ أَوَى الْفِتْيَةُ إِلَى الْكَهْفِ فَقَالُوا رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً",
          translations: [{ text: "[Mention] when the youths retreated to the cave and said, Our Lord, grant us from Yourself mercy" }],
          surah: { name: "Al-Kahf", number: 18 }
        },
        {
          verse_key: "36:1",
          text_uthmani: "يس",
          translations: [{ text: "Ya-Sin." }],
          surah: { name: "Ya-Sin", number: 36 }
        },
        {
          verse_key: "55:13",
          text_uthmani: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",
          translations: [{ text: "So which of the favors of your Lord would you deny?" }],
          surah: { name: "Ar-Rahman", number: 55 }
        },
        {
          verse_key: "67:1",
          text_uthmani: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
          translations: [{ text: "Blessed is He in whose hand is dominion, and He is over all things competent" }],
          surah: { name: "Al-Mulk", number: 67 }
        },
        {
          verse_key: "113:1",
          text_uthmani: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
          translations: [{ text: "Say, I seek refuge in the Lord of daybreak" }],
          surah: { name: "Al-Falaq", number: 113 }
        },
        {
          verse_key: "114:1",
          text_uthmani: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
          translations: [{ text: "Say, I seek refuge in the Lord of mankind" }],
          surah: { name: "An-Nas", number: 114 }
        }
      ];
      
      // Filter fallback data based on query if possible
      const queryLower = input.query.toLowerCase();
      const filteredFallback = fallbackData.filter(verse => 
        verse.translations[0].text.toLowerCase().includes(queryLower) ||
        verse.surah.name.toLowerCase().includes(queryLower)
      );
      
      return filteredFallback.length > 0 ? filteredFallback : fallbackData;
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
      
      // Return enhanced fallback data for voice search
      const fallbackData = [
        {
          verse_key: "2:255",
          text_uthmani: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
          translations: [{ text: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence." }],
          surah: { name: "Al-Baqarah", number: 2 }
        },
        {
          verse_key: "1:1",
          text_uthmani: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          translations: [{ text: "In the name of Allah, the Entirely Merciful, the Especially Merciful." }],
          surah: { name: "Al-Fatihah", number: 1 }
        },
        {
          verse_key: "112:1",
          text_uthmani: "قُلْ هُوَ اللَّهُ أَحَدٌ",
          translations: [{ text: "Say, He is Allah, [who is] One" }],
          surah: { name: "Al-Ikhlas", number: 112 }
        }
      ];
      
      // Filter fallback data based on transcription if possible
      const transcriptionLower = input.transcription.toLowerCase();
      const filteredFallback = fallbackData.filter(verse => 
        verse.translations[0].text.toLowerCase().includes(transcriptionLower) ||
        verse.surah.name.toLowerCase().includes(transcriptionLower)
      );
      
      return filteredFallback.length > 0 ? filteredFallback : fallbackData.slice(0, 3);
    }
  });