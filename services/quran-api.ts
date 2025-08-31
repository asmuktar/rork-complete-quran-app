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

class QuranApiService {
  private baseUrl = 'https://api.alquran.cloud/v1';
  private quranComUrl = 'https://api.quran.com/api/v4';
  
  async getSurah(surahNumber: number, edition: string = 'ar.alafasy'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/surah/${surahNumber}/${edition}`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching surah:', error);
      throw error;
    }
  }

  async getAyah(surahNumber: number, ayahNumber: number, edition: string = 'ar.alafasy'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/ayah/${surahNumber}:${ayahNumber}/${edition}`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching ayah:', error);
      throw error;
    }
  }

  async searchQuran(query: string, edition: string = 'en.sahih'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/search/${encodeURIComponent(query)}/all/${edition}`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error searching Quran:', error);
      throw error;
    }
  }

  async getTranslation(surahNumber: number, ayahNumber: number, translationId: number = 131): Promise<any> {
    try {
      const response = await fetch(`${this.quranComUrl}/verses/by_key/${surahNumber}:${ayahNumber}?translations=${translationId}`);
      const data = await response.json();
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
    try {
      const response = await fetch(`${this.baseUrl}/surah`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching all surahs:', error);
      throw error;
    }
  }

  async getJuz(juzNumber: number, edition: string = 'ar.alafasy'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/juz/${juzNumber}/${edition}`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching juz:', error);
      throw error;
    }
  }
}

export const quranApi = new QuranApiService();
export default quranApi;