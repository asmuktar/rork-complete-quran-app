import cacheService from './cache-service';

// Enhanced fetch with retry logic
async function enhancedFetch(
  url: string, 
  options?: RequestInit & { retries?: number; retryDelay?: number }
): Promise<Response> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options || {};
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || attempt === retries) {
        return response;
      }
      
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === retries) {
        break;
      }
      
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retry attempt ${attempt + 1}/${retries} for ${url} after ${delay}ms`);
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

class QuranApiService {
  private alQuranUrl = 'https://api.alquran.cloud/v1';
  private quranComUrl = 'https://api.quran.com/api/v4';
  
  async getSurah(surahNumber: number, edition: string = 'quran-uthmani'): Promise<any> {
    const cacheKey = `${surahNumber}_${edition}`;
    
    // Check cache first
    const cached = await cacheService.get('quran_ayahs', cacheKey);
    if (cached) {
      console.log(`Cache hit for surah ${surahNumber}`);
      return cached;
    }
    
    // Primary API: AlQuran.cloud with specific edition to avoid Bismillah issues
    try {
      console.log(`Fetching surah ${surahNumber} from AlQuran.cloud with quran-uthmani edition`);
      const response = await enhancedFetch(
        `${this.alQuranUrl}/surah/${surahNumber}/quran-uthmani`,
        { retries: 3 }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`AlQuran.cloud uthmani API response for surah ${surahNumber}:`, {
        hasData: !!data.data,
        hasAyahs: !!data.data?.ayahs,
        ayahsCount: data.data?.ayahs?.length || 0,
        firstAyahText: data.data?.ayahs?.[0]?.text?.substring(0, 50),
        firstAyahNumber: data.data?.ayahs?.[0]?.numberInSurah,
        edition: data.data?.edition?.identifier,
        sampleAyahs: data.data?.ayahs?.slice(0, 3).map((a: any) => ({
          numberInSurah: a.numberInSurah,
          text: a.text?.substring(0, 30),
          hasArabic: a.text && /[\u0600-\u06FF]/.test(a.text)
        }))
      });
      
      if (data.data && data.data.ayahs && data.data.ayahs.length > 0) {
        // Get English translation separately
        let englishTranslations: any[] = [];
        try {
          const translationResponse = await enhancedFetch(
            `${this.alQuranUrl}/surah/${surahNumber}/en.sahih`,
            { retries: 2 }
          );
          if (translationResponse.ok) {
            const translationData = await translationResponse.json();
            englishTranslations = translationData.data?.ayahs || [];
          }
        } catch (error) {
          console.warn(`Failed to fetch translations for surah ${surahNumber}:`, error);
        }
        
        // Remove Bismillah from first ayah for all surahs except Al-Fatihah (1) and At-Tawbah (9)
        
        const normalizedData = {
          number: surahNumber,
          name: data.data.name || '',
          englishName: data.data.englishName || `Surah ${surahNumber}`,
          numberOfAyahs: data.data.numberOfAyahs || data.data.ayahs.length,
          ayahs: data.data.ayahs.map((ayah: any, index: number) => {
            const englishAyah = englishTranslations[index];
            let ayahText = ayah.text || '';
            
            // For all surahs except Al-Fatihah (1) and At-Tawbah (9), remove Bismillah from first ayah
            // Al-Fatihah includes Bismillah as its first verse
            // At-Tawbah doesn't have Bismillah at all
            if (surahNumber !== 1 && surahNumber !== 9 && ayah.numberInSurah === 1) {
              // Remove Bismillah if it's at the beginning of the first ayah
              const originalText = ayahText;
              
              // Comprehensive Bismillah removal patterns - covering all possible variations
              const bismillahPatterns = [
                // Standard Uthmani script variations
                'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ',
                'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                // Alternative script variations
                'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ',
                'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
                // Simplified script variations
                'بسم الله الرحمن الرحيم ',
                'بسم الله الرحمن الرحيم',
                // With different diacritics
                'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ ',
                'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ',
                // Without some diacritics
                'بسم اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ',
                'بسم اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                // Alternative alif variations
                'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ ',
                'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ'
              ];
              
              let bismillahRemoved = false;
              for (const pattern of bismillahPatterns) {
                if (ayahText.startsWith(pattern)) {
                  ayahText = ayahText.substring(pattern.length).trim();
                  console.log(`✓ Removed Bismillah pattern from Surah ${surahNumber}, Ayah 1: "${pattern}"`);
                  bismillahRemoved = true;
                  break;
                }
              }
              
              // If no exact pattern match, try regex-based removal as fallback
              if (!bismillahRemoved && /^بِسْمِ\s*اللَّ?هِ\s*الرَّحْمَ?ٰ?نِ\s*الرَّحِيمِ\s*/.test(ayahText)) {
                ayahText = ayahText.replace(/^بِسْمِ\s*اللَّ?هِ\s*الرَّحْمَ?ٰ?نِ\s*الرَّحِيمِ\s*/, '').trim();
                console.log(`✓ Removed Bismillah using regex from Surah ${surahNumber}, Ayah 1`);
                bismillahRemoved = true;
              }
              
              if (bismillahRemoved) {
                console.log(`Surah ${surahNumber} - Original first ayah: "${originalText.substring(0, 80)}..."`);
                console.log(`Surah ${surahNumber} - Cleaned first ayah: "${ayahText.substring(0, 80)}..."`);
              } else if (originalText.length > 50) {
                // Log if we couldn't remove Bismillah from a long first ayah (likely contains it)
                console.warn(`⚠️ Could not remove Bismillah from Surah ${surahNumber}, Ayah 1. Text: "${originalText.substring(0, 100)}..."`);
              }
            }
            
            // Debug logging for first few ayahs
            if (index < 3) {
              console.log(`Surah ${surahNumber}, Ayah ${ayah.numberInSurah}: "${ayahText.substring(0, 50)}..."`);
            }
            
            return {
              number: ayah.number,
              text: ayahText,
              numberInSurah: ayah.numberInSurah,
              translation: englishAyah?.text || '',
              juz: ayah.juz || 1,
              hizb: ayah.hizb || 1,
              page: ayah.page || 1,
              sajda: ayah.sajda || false
            };
          })
        };
        
        // Validate that we have Arabic text
        const hasArabicText = normalizedData.ayahs.some((ayah: any) => 
          ayah.text && ayah.text.trim().length > 0 && /[\u0600-\u06FF]/.test(ayah.text)
        );
        
        if (!hasArabicText) {
          console.warn(`No valid Arabic text found in AlQuran.cloud response for surah ${surahNumber}`);
          throw new Error('No Arabic text in response');
        }
        
        await cacheService.set('quran_ayahs', cacheKey, normalizedData);
        console.log(`Successfully fetched surah ${surahNumber} with ${normalizedData.ayahs.length} ayahs from AlQuran.cloud`);
        return normalizedData;
      }
    } catch (error) {
      console.error(`AlQuran.cloud uthmani API failed for surah ${surahNumber}:`, error);
    }
    
    // Fallback API: Quran.com
    try {
      console.log(`Falling back to Quran.com for surah ${surahNumber}`);
      const response = await enhancedFetch(
        `${this.quranComUrl}/verses/by_chapter/${surahNumber}?language=en&words=true&translations=131&per_page=300`,
        { retries: 2 }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Quran.com API response for surah ${surahNumber}:`, {
        hasVerses: !!data.verses,
        versesCount: data.verses?.length || 0,
        firstVerseText: data.verses?.[0]?.text_uthmani?.substring(0, 50)
      });
      
      if (data.verses && data.verses.length > 0) {
        const normalizedData = {
          number: surahNumber,
          name: data.verses[0]?.chapter?.name_arabic || '',
          englishName: data.verses[0]?.chapter?.name_simple || `Surah ${surahNumber}`,
          numberOfAyahs: data.verses.length,
          ayahs: data.verses.map((verse: any) => ({
            number: verse.id,
            text: verse.text_uthmani || verse.text_indopak || verse.text_imlaei || '',
            numberInSurah: verse.verse_number,
            translation: verse.translations?.[0]?.text || '',
            juz: verse.juz_number || 1,
            hizb: verse.hizb_number || 1,
            page: verse.page_number || 1,
            sajda: verse.sajda_number ? true : false
          }))
        };
        
        // Validate that we have Arabic text
        const hasArabicText = normalizedData.ayahs.some((ayah: any) => 
          ayah.text && ayah.text.trim().length > 0 && /[\u0600-\u06FF]/.test(ayah.text)
        );
        
        if (hasArabicText) {
          await cacheService.set('quran_ayahs', cacheKey, normalizedData);
          console.log(`Successfully fetched surah ${surahNumber} with ${normalizedData.ayahs.length} ayahs from Quran.com`);
          return normalizedData;
        }
      }
    } catch (error) {
      console.error(`Quran.com API failed for surah ${surahNumber}:`, error);
    }
    
    // Last resort: Try AlQuran.cloud with editions
    try {
      console.log(`Using AlQuran.cloud editions fallback for surah ${surahNumber}`);
      const response = await enhancedFetch(
        `${this.alQuranUrl}/surah/${surahNumber}/editions/quran-uthmani,en.sahih`,
        { retries: 2 }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data) && data.data.length >= 1) {
        const arabicData = data.data.find((d: any) => d.edition?.identifier === 'quran-uthmani') || data.data[0];
        const englishData = data.data.find((d: any) => d.edition?.identifier === 'en.sahih');
        
        if (arabicData && arabicData.ayahs && arabicData.ayahs.length > 0) {
          // Remove Bismillah from first ayah for all surahs except Al-Fatihah (1) and At-Tawbah (9)
          
          const normalizedData = {
            number: surahNumber,
            name: arabicData.name || '',
            englishName: arabicData.englishName || `Surah ${surahNumber}`,
            numberOfAyahs: arabicData.numberOfAyahs || arabicData.ayahs.length,
            ayahs: arabicData.ayahs.map((ayah: any, index: number) => {
              const englishAyah = englishData?.ayahs?.[index];
              let ayahText = ayah.text || '';
              
              // For all surahs except Al-Fatihah (1) and At-Tawbah (9), remove Bismillah from first ayah
              if (surahNumber !== 1 && surahNumber !== 9 && ayah.numberInSurah === 1) {
                const originalText = ayahText;
                
                // Comprehensive Bismillah removal patterns - covering all possible variations
                const bismillahPatterns = [
                  // Standard Uthmani script variations
                  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ',
                  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                  // Alternative script variations
                  'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ',
                  'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
                  // Simplified script variations
                  'بسم الله الرحمن الرحيم ',
                  'بسم الله الرحمن الرحيم',
                  // With different diacritics
                  'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ ',
                  'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ',
                  // Without some diacritics
                  'بسم اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ',
                  'بسم اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                  // Alternative alif variations
                  'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ ',
                  'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ'
                ];
                
                let bismillahRemoved = false;
                for (const pattern of bismillahPatterns) {
                  if (ayahText.startsWith(pattern)) {
                    ayahText = ayahText.substring(pattern.length).trim();
                    console.log(`✓ [Fallback] Removed Bismillah pattern from Surah ${surahNumber}, Ayah 1: "${pattern}"`);
                    bismillahRemoved = true;
                    break;
                  }
                }
                
                // If no exact pattern match, try regex-based removal as fallback
                if (!bismillahRemoved && /^بِسْمِ\s*اللَّ?هِ\s*الرَّحْمَ?ٰ?نِ\s*الرَّحِيمِ\s*/.test(ayahText)) {
                  ayahText = ayahText.replace(/^بِسْمِ\s*اللَّ?هِ\s*الرَّحْمَ?ٰ?نِ\s*الرَّحِيمِ\s*/, '').trim();
                  console.log(`✓ [Fallback] Removed Bismillah using regex from Surah ${surahNumber}, Ayah 1`);
                  bismillahRemoved = true;
                }
                
                if (bismillahRemoved) {
                  console.log(`[Fallback] Surah ${surahNumber} - Bismillah removed successfully`);
                } else if (originalText.length > 50) {
                  console.warn(`⚠️ [Fallback] Could not remove Bismillah from Surah ${surahNumber}, Ayah 1. Text: "${originalText.substring(0, 100)}..."`);
                }
              }
              
              return {
                number: ayah.number,
                text: ayahText,
                numberInSurah: ayah.numberInSurah,
                translation: englishAyah?.text || '',
                juz: ayah.juz || 1,
                hizb: ayah.hizb || 1,
                page: ayah.page || 1,
                sajda: ayah.sajda || false
              };
            })
          };
          
          // Validate that we have Arabic text
          const hasArabicText = normalizedData.ayahs.some((ayah: any) => 
            ayah.text && ayah.text.trim().length > 0 && /[\u0600-\u06FF]/.test(ayah.text)
          );
          
          if (hasArabicText) {
            await cacheService.set('quran_ayahs', cacheKey, normalizedData);
            console.log(`Successfully fetched surah ${surahNumber} with ${normalizedData.ayahs.length} ayahs from AlQuran.cloud editions`);
            return normalizedData;
          }
        }
      }
    } catch (error) {
      console.error(`AlQuran.cloud editions API failed for surah ${surahNumber}:`, error);
    }
    
    throw new Error(`Failed to fetch surah ${surahNumber} from all available sources`);
  }

  async getAyah(surahNumber: number, ayahNumber: number, edition: string = 'quran-uthmani'): Promise<any> {
    const cacheKey = `${surahNumber}_${ayahNumber}_${edition}`;
    
    // Check cache first
    const cached = await cacheService.get('quran_ayahs', cacheKey);
    if (cached) {
      console.log(`Cache hit for ayah ${surahNumber}:${ayahNumber}`);
      return cached;
    }
    
    try {
      console.log(`Fetching ayah ${surahNumber}:${ayahNumber} from API`);
      const response = await enhancedFetch(`${this.quranComUrl}/verses/by_key/${surahNumber}:${ayahNumber}?language=en&words=true`, { retries: 2 });
      const data = await response.json();
      
      const normalizedData = {
        number: data.verse?.id,
        text: data.verse?.text_uthmani || data.verse?.text_indopak || '',
        numberInSurah: data.verse?.verse_number,
        translation: data.verse?.translations?.[0]?.text || '',
        juz: data.verse?.juz_number || 1,
        hizb: data.verse?.hizb_number || 1,
        page: data.verse?.page_number || 1,
        sajda: data.verse?.sajda_number ? true : false
      };
      
      // Cache the result
      await cacheService.set('quran_ayahs', cacheKey, normalizedData);
      
      return normalizedData;
    } catch (error) {
      console.error('Error fetching ayah:', error);
      throw error;
    }
  }

  async searchQuran(query: string, edition: string = 'en.sahih'): Promise<any> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    if (query.length > 100) {
      query = query.substring(0, 100);
    }
    
    const sanitizedQuery = query.trim();
    const cacheKey = `${encodeURIComponent(sanitizedQuery)}_${edition}`;
    
    // Check cache first
    const cached = await cacheService.get('quran_search', cacheKey);
    if (cached) {
      console.log(`Cache hit for Quran search: ${sanitizedQuery}`);
      return cached;
    }
    
    try {
      console.log(`Searching Quran for: ${sanitizedQuery}`);
      const response = await enhancedFetch(`${this.quranComUrl}/search?q=${encodeURIComponent(sanitizedQuery)}&size=20&translations=131`, { retries: 2 });
      const data = await response.json();
      
      const normalizedData = data.search?.results?.map((result: any) => ({
        surah: result.verse_key?.split(':')[0],
        ayah: result.verse_key?.split(':')[1],
        text: result.text,
        translation: result.translations?.[0]?.text || '',
        verse_key: result.verse_key
      })) || [];
      
      // Cache the result
      await cacheService.set('quran_search', cacheKey, normalizedData);
      
      return normalizedData;
    } catch (error) {
      console.error('Error searching Quran:', error);
      throw error;
    }
  }

  async getTranslation(surahNumber: number, ayahNumber: number, translationId: number = 131): Promise<any> {
    const cacheKey = `${surahNumber}_${ayahNumber}_${translationId}`;
    
    // Check cache first
    const cached = await cacheService.get('translations', cacheKey);
    if (cached) {
      console.log(`Cache hit for translation ${surahNumber}:${ayahNumber}`);
      return cached;
    }
    
    try {
      console.log(`Fetching translation ${surahNumber}:${ayahNumber}`);
      const response = await fetch(`${this.quranComUrl}/verses/by_key/${surahNumber}:${ayahNumber}?translations=${translationId}`);
      const data = await response.json();
      
      // Cache the result
      await cacheService.set('translations', cacheKey, data.verse);
      
      return data.verse;
    } catch (error) {
      console.error('Error fetching translation:', error);
      throw error;
    }
  }

  getAudioUrl(surahNumber: number, reciterId: number = 7): string {
    // Using Quran.com audio API with different reciters
    const reciters = {
      1: 'ar.alafasy', // Mishary Alafasy
      2: 'ar.abdurrahmaansudais', // Abdur-Rahman as-Sudais
      3: 'ar.mahermuaiqly', // Maher Al Muaiqly
      4: 'ar.abdullahbasfar', // Abdullah Basfar
      5: 'ar.saadalghamdi', // Saad Al-Ghamdi
      6: 'ar.alihudhaify', // Ali Al-Hudhaify
      7: 'ar.shaatree', // Abu Bakr al-Shatri (default)
    };
    
    const reciter = reciters[reciterId as keyof typeof reciters] || 'ar.shaatree';
    return `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${surahNumber}.mp3`;
  }

  getAyahAudioUrl(surahNumber: number, ayahNumber: number, reciterId: number = 7): string {
    // For individual ayah audio
    const paddedSurah = surahNumber.toString().padStart(3, '0');
    const paddedAyah = ayahNumber.toString().padStart(3, '0');
    
    const reciters = {
      1: 'Alafasy_128kbps',
      2: 'Abdurrahman_As-Sudais_192kbps', 
      3: 'Maher_AlMuaiqly_128kbps',
      4: 'Abdullah_Basfar_192kbps',
      5: 'Saad_Al-Ghamdi_128kbps',
      6: 'Ali_Al-Hudhaify_128kbps',
      7: 'Abu_Bakr_al-Shatri_128kbps',
    };
    
    const reciter = reciters[reciterId as keyof typeof reciters] || 'Abu_Bakr_al-Shatri_128kbps';
    return `https://everyayah.com/data/${reciter}/${paddedSurah}${paddedAyah}.mp3`;
  }

  async getAllSurahs(): Promise<any> {
    const cacheKey = 'all';
    
    // Check cache first
    const cached = await cacheService.get('quran_surahs', cacheKey);
    if (cached) {
      console.log('Cache hit for all surahs');
      return cached;
    }
    
    // Try AlQuran.cloud first (most reliable)
    try {
      console.log('Fetching all surahs from AlQuran.cloud');
      const response = await enhancedFetch(`${this.alQuranUrl}/surah`, { retries: 2 });
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const normalizedData = data.data.map((surah: any) => ({
          number: surah.number,
          name: surah.englishName,
          arabicName: surah.name,
          englishName: surah.englishName,
          numberOfAyahs: surah.numberOfAyahs,
          revelationType: surah.revelationType
        }));
        
        // Cache the result
        await cacheService.set('quran_surahs', cacheKey, normalizedData);
        console.log(`Successfully fetched ${normalizedData.length} surahs from AlQuran.cloud`);
        return normalizedData;
      }
    } catch (error) {
      console.error('Error fetching from AlQuran.cloud:', error);
    }
    
    // Fallback to Quran.com
    try {
      console.log('Falling back to Quran.com for surahs');
      const response = await enhancedFetch(`${this.quranComUrl}/chapters?language=en`, { retries: 2 });
      const data = await response.json();
      
      if (data.chapters && Array.isArray(data.chapters) && data.chapters.length > 0) {
        const normalizedData = data.chapters.map((chapter: any) => ({
          number: chapter.id,
          name: chapter.name_simple,
          arabicName: chapter.name_arabic,
          englishName: chapter.translated_name?.name || chapter.name_simple,
          numberOfAyahs: chapter.verses_count,
          revelationType: chapter.revelation_place
        }));
        
        // Cache the result
        await cacheService.set('quran_surahs', cacheKey, normalizedData);
        console.log(`Successfully fetched ${normalizedData.length} surahs from Quran.com`);
        return normalizedData;
      }
    } catch (error) {
      console.error('Error fetching from Quran.com:', error);
    }
    
    throw new Error('Failed to fetch surahs from all sources');
  }

  async getJuz(juzNumber: number, edition: string = 'quran-uthmani'): Promise<any> {
    const cacheKey = `${juzNumber}_${edition}`;
    
    // Check cache first
    const cached = await cacheService.get('quran_ayahs', cacheKey);
    if (cached) {
      console.log(`Cache hit for juz ${juzNumber}`);
      return cached;
    }
    
    try {
      console.log(`Fetching juz ${juzNumber} from API`);
      const response = await enhancedFetch(`${this.quranComUrl}/verses/by_juz/${juzNumber}?language=en&words=true&translations=131&per_page=1000`, { retries: 2 });
      const data = await response.json();
      
      const normalizedData = {
        juz: juzNumber,
        verses: data.verses?.map((verse: any) => ({
          number: verse.id,
          text: verse.text_uthmani || verse.text_indopak || '',
          numberInSurah: verse.verse_number,
          surahNumber: verse.chapter_id,
          translation: verse.translations?.[0]?.text || '',
          juz: verse.juz_number || juzNumber,
          hizb: verse.hizb_number || 1,
          page: verse.page_number || 1,
          sajda: verse.sajda_number ? true : false
        })) || []
      };
      
      // Cache the result
      await cacheService.set('quran_ayahs', cacheKey, normalizedData);
      
      return normalizedData;
    } catch (error) {
      console.error('Error fetching juz:', error);
      throw error;
    }
  }
}

export const quranApi = new QuranApiService();
export default quranApi;