import cacheService from './cache-service';

interface QuranApiResponse {
  data: {
    surahs: Array<{
      number: number;
      name: string;
      englishName: string;
      englishNameTranslation: string;
      numberOfAyahs: number;
      revelationType: string;
      ayahs: Array<{
        number: number;
        text: string;
        numberInSurah: number;
        juz: number;
        manzil: number;
        page: number;
        ruku: number;
        hizbQuarter: number;
        sajda: boolean;
      }>;
    }>;
  };
}

interface TranslationResponse {
  data: {
    text: string;
    surah: {
      number: number;
      name: string;
    };
    numberInSurah: number;
  };
}

interface AudioResponse {
  data: {
    audioFiles: Array<{
      id: number;
      verse_key: string;
      url: string;
    }>;
  };
}

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
  private quranComUrl = 'https://api.quran.com/api/v4';
  private quranApiUrl = 'https://quranapi.pages.dev/api';
  private alQuranUrl = 'https://api.alquran.cloud/v1';
  
  // Multiple API endpoints for better reliability
  private apiEndpoints = {
    verses: (surahId: number) => [
      `${this.quranComUrl}/verses/by_chapter/${surahId}?language=en&words=true&translations=131&per_page=300`,
      `${this.alQuranUrl}/surah/${surahId}/editions/quran-uthmani,en.sahih`,
      `${this.quranApiUrl}/surah/${surahId}/ayahs.json`
    ],
    chapters: () => [
      `${this.quranComUrl}/chapters?language=en`,
      `${this.alQuranUrl}/surah`,
      `${this.quranApiUrl}/surahs.json`
    ]
  };
  
  async getSurah(surahNumber: number, edition: string = 'quran-uthmani'): Promise<any> {
    const cacheKey = `${surahNumber}_${edition}`;
    
    // Check cache first
    const cached = await cacheService.get('quran_ayahs', cacheKey);
    if (cached) {
      console.log(`Cache hit for surah ${surahNumber}`);
      return cached;
    }
    
    // Try multiple APIs for better reliability
    const endpoints = this.apiEndpoints.verses(surahNumber);
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Fetching surah ${surahNumber} from ${endpoint}`);
        const response = await enhancedFetch(endpoint, { retries: 2 });
        const data = await response.json();
        
        let normalizedData;
        
        if (endpoint.includes('quran.com')) {
          // Quran.com API format
          normalizedData = {
            number: surahNumber,
            ayahs: data.verses?.map((verse: any) => ({
              number: verse.id,
              text: verse.text_uthmani || verse.text_indopak || '',
              numberInSurah: verse.verse_number,
              translation: verse.translations?.[0]?.text || '',
              juz: verse.juz_number || 1,
              hizb: verse.hizb_number || 1,
              page: verse.page_number || 1,
              sajda: verse.sajda_number ? true : false
            })) || []
          };
        } else if (endpoint.includes('alquran.cloud')) {
          // AlQuran.cloud API format
          const arabicData = data.data?.find((d: any) => d.edition?.identifier?.includes('uthmani'));
          const englishData = data.data?.find((d: any) => d.edition?.identifier?.includes('en.'));
          
          normalizedData = {
            number: surahNumber,
            name: arabicData?.name || '',
            englishName: arabicData?.englishName || '',
            numberOfAyahs: arabicData?.numberOfAyahs || 0,
            ayahs: arabicData?.ayahs?.map((ayah: any, index: number) => {
              const englishAyah = englishData?.ayahs?.[index];
              return {
                number: ayah.number,
                text: ayah.text,
                numberInSurah: ayah.numberInSurah,
                translation: englishAyah?.text || '',
                juz: ayah.juz || 1,
                hizb: ayah.hizb || 1,
                page: ayah.page || 1,
                sajda: ayah.sajda || false
              };
            }) || []
          };
        } else {
          // QuranAPI format
          normalizedData = {
            number: surahNumber,
            ayahs: data.map((ayah: any) => ({
              number: ayah.id,
              text: ayah.arabic,
              numberInSurah: ayah.verse,
              translation: ayah.translation || '',
              juz: ayah.juz || 1,
              hizb: ayah.hizb || 1,
              page: ayah.page || 1,
              sajda: false
            })) || []
          };
        }
        
        if (normalizedData.ayahs && normalizedData.ayahs.length > 0) {
          // Cache the result
          await cacheService.set('quran_ayahs', cacheKey, normalizedData);
          console.log(`Successfully fetched surah ${surahNumber} with ${normalizedData.ayahs.length} ayahs`);
          return normalizedData;
        }
      } catch (error) {
        console.error(`Error fetching from ${endpoint}:`, error);
        continue;
      }
    }
    
    throw new Error(`Failed to fetch surah ${surahNumber} from all sources`);
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
    const cacheKey = `${encodeURIComponent(query)}_${edition}`;
    
    // Check cache first
    const cached = await cacheService.get('quran_search', cacheKey);
    if (cached) {
      console.log(`Cache hit for Quran search: ${query}`);
      return cached;
    }
    
    try {
      console.log(`Searching Quran for: ${query}`);
      const response = await enhancedFetch(`${this.quranComUrl}/search?q=${encodeURIComponent(query)}&size=20&translations=131`, { retries: 2 });
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
    
    // Try multiple APIs for better reliability
    const endpoints = this.apiEndpoints.chapters();
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Fetching all surahs from ${endpoint}`);
        const response = await enhancedFetch(endpoint, { retries: 2 });
        const data = await response.json();
        
        let normalizedData;
        
        if (endpoint.includes('quran.com')) {
          normalizedData = data.chapters?.map((chapter: any) => ({
            number: chapter.id,
            name: chapter.name_simple,
            arabicName: chapter.name_arabic,
            englishName: chapter.translated_name?.name || chapter.name_simple,
            numberOfAyahs: chapter.verses_count,
            revelationType: chapter.revelation_place
          })) || [];
        } else if (endpoint.includes('alquran.cloud')) {
          normalizedData = data.data?.map((surah: any) => ({
            number: surah.number,
            name: surah.englishName,
            arabicName: surah.name,
            englishName: surah.englishName,
            numberOfAyahs: surah.numberOfAyahs,
            revelationType: surah.revelationType
          })) || [];
        } else {
          normalizedData = data?.map((surah: any) => ({
            number: surah.id,
            name: surah.name,
            arabicName: surah.arabic,
            englishName: surah.name,
            numberOfAyahs: surah.ayahs,
            revelationType: surah.type
          })) || [];
        }
        
        if (normalizedData && normalizedData.length > 0) {
          // Cache the result
          await cacheService.set('quran_surahs', cacheKey, normalizedData);
          console.log(`Successfully fetched ${normalizedData.length} surahs`);
          return normalizedData;
        }
      } catch (error) {
        console.error(`Error fetching from ${endpoint}:`, error);
        continue;
      }
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