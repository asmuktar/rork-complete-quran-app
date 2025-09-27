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
  // Primary API - AlQuran.cloud (reliable and clean)
  private alQuranUrl = 'https://api.alquran.cloud/v1';
  // Fallback API - QuranAPI.pages.dev
  private quranApiUrl = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1';
  // Legacy fallback API
  private quranComUrl = 'https://api.quran.com/api/v4';
  
  async getSurah(surahNumber: number, edition: string = 'quran-uthmani'): Promise<any> {
    const cacheKey = `${surahNumber}_${edition}_v6_ultimate_bismillah_fix`;
    
    // Check cache first
    const cached = await cacheService.get('quran_ayahs', cacheKey);
    if (cached) {
      console.log(`Cache hit for surah ${surahNumber}`);
      return cached;
    }
    
    // Primary API: AlQuran.cloud with editions (most reliable)
    try {
      console.log(`Fetching surah ${surahNumber} from AlQuran.cloud editions`);
      const response = await enhancedFetch(
        `${this.alQuranUrl}/surah/${surahNumber}/editions/quran-uthmani,en.sahih`,
        { retries: 3 }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data) && data.data.length >= 1) {
        const arabicData = data.data.find((d: any) => d.edition?.identifier === 'quran-uthmani') || data.data[0];
        const englishData = data.data.find((d: any) => d.edition?.identifier === 'en.sahih');
        
        if (arabicData && arabicData.ayahs && arabicData.ayahs.length > 0) {
          const normalizedData = {
            number: surahNumber,
            name: arabicData.name || '',
            englishName: arabicData.englishName || `Surah ${surahNumber}`,
            numberOfAyahs: arabicData.numberOfAyahs || arabicData.ayahs.length,
            ayahs: arabicData.ayahs.map((ayah: any, index: number) => {
              const englishAyah = englishData?.ayahs?.[index];
              let ayahText = ayah.text || '';
              
              // CRITICAL: Remove Bismillah from first ayah of all surahs except Al-Fatihah (1) and At-Tawbah (9)
              if (surahNumber !== 1 && surahNumber !== 9 && ayah.numberInSurah === 1) {
                const originalText = ayahText;
                console.log(`🔍 [AlQuran.cloud] Processing Surah ${surahNumber}, Ayah 1. Original text: "${originalText.substring(0, 100)}..."`);
                
                // ULTRA-AGGRESSIVE BISMILLAH REMOVAL
                // This approach uses multiple methods to ensure complete removal
                
                // Method 1: Comprehensive exact string patterns (all known variations)
                const bismillahPatterns = [
                  // Standard Uthmani variations
                  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ',
                  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                  // With alif wasla
                  'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ',
                  'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
                  // With different diacritics
                  'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ ',
                  'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ',
                  // Simplified versions
                  'بسم الله الرحمن الرحيم ',
                  'بسم الله الرحمن الرحيم',
                  // Alternative forms
                  'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ ',
                  'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ',
                  'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ ',
                  'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ',
                  // With different spacing
                  'بِسْمِ  اللَّهِ  الرَّحْمَٰنِ  الرَّحِيمِ ',
                  'بِسْمِ  اللَّهِ  الرَّحْمَٰنِ  الرَّحِيمِ'
                ];
                
                let bismillahRemoved = false;
                
                // Try exact pattern matching first
                for (const pattern of bismillahPatterns) {
                  if (ayahText.startsWith(pattern)) {
                    ayahText = ayahText.substring(pattern.length).trim();
                    console.log(`✅ [AlQuran.cloud] Removed Bismillah exact pattern from Surah ${surahNumber}, Ayah 1`);
                    bismillahRemoved = true;
                    break;
                  }
                }
                
                // Method 2: Advanced regex patterns for variations
                if (!bismillahRemoved) {
                  const regexPatterns = [
                    // Ultra-comprehensive regex for all Bismillah variations
                    /^\s*بِسۡ?ْمِ\s+[اٱ]للَّ?ّٰ?هِ\s+[اٱ]لرَّحۡ?ْمَ?ٰ?نِ\s+[اٱ]لرَّحِيۡ?مِ\s*/u,
                    // Simplified version
                    /^\s*بسم\s+الله\s+الرحمن\s+الرحيم\s*/u,
                    // With optional diacritics
                    /^\s*بِسْمِ\s*اللَّ?هِ\s*الرَّحْمَ?ٰ?نِ\s*الرَّحِيمِ\s*/u,
                    // Catch-all for any Arabic text starting with بسم
                    /^\s*بسم[\u0600-\u06FF\s]{15,35}\s*/u
                  ];
                  
                  for (const regex of regexPatterns) {
                    const match = ayahText.match(regex);
                    if (match && match[0].length > 10) {
                      ayahText = ayahText.replace(regex, '').trim();
                      console.log(`✅ [AlQuran.cloud] Removed Bismillah using regex from Surah ${surahNumber}, Ayah 1`);
                      bismillahRemoved = true;
                      break;
                    }
                  }
                }
                
                // Method 3: Word-based removal (if text contains Bismillah keywords)
                if (!bismillahRemoved && originalText.length > 50) {
                  const containsBismillahKeywords = (
                    (originalText.includes('بسم') || originalText.includes('بِسْمِ')) &&
                    (originalText.includes('الله') || originalText.includes('اللَّهِ')) &&
                    (originalText.includes('الرحمن') || originalText.includes('الرَّحْمَٰنِ')) &&
                    (originalText.includes('الرحيم') || originalText.includes('الرَّحِيمِ'))
                  );
                  
                  if (containsBismillahKeywords) {
                    const words = originalText.split(/\s+/);
                    if (words.length > 6) {
                      // Remove first 4 words (standard Bismillah length)
                      ayahText = words.slice(4).join(' ').trim();
                      console.log(`🔧 [AlQuran.cloud] Word-based removal from Surah ${surahNumber}, Ayah 1`);
                      bismillahRemoved = true;
                    }
                  }
                }
                
                // Method 4: Character-based removal (last resort)
                if (!bismillahRemoved && originalText.length > 80) {
                  // If text is very long and likely contains Bismillah, remove first ~19 characters
                  const potentialBismillah = originalText.substring(0, 25);
                  if (potentialBismillah.includes('بسم') || potentialBismillah.includes('بِسْمِ')) {
                    ayahText = originalText.substring(19).trim();
                    console.log(`🚨 [AlQuran.cloud] Character-based removal from Surah ${surahNumber}, Ayah 1`);
                    bismillahRemoved = true;
                  }
                }
                
                // Final validation and logging
                if (bismillahRemoved && ayahText.length > 0 && ayahText !== originalText) {
                  console.log(`✅ [AlQuran.cloud] Successfully cleaned Surah ${surahNumber}, Ayah 1. Original: ${originalText.length} chars, New: ${ayahText.length} chars`);
                  console.log(`   Original start: "${originalText.substring(0, 50)}..."`);
                  console.log(`   Cleaned start: "${ayahText.substring(0, 50)}..."`);
                } else if (originalText.length > 30) {
                  console.warn(`⚠️ [AlQuran.cloud] Could not remove Bismillah from Surah ${surahNumber}, Ayah 1. Text: "${originalText.substring(0, 100)}..."`);
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
            console.log(`✅ Successfully fetched surah ${surahNumber} with ${normalizedData.ayahs.length} ayahs from AlQuran.cloud`);
            return normalizedData;
          }
        }
      }
    } catch (error) {
      console.error(`❌ AlQuran.cloud API failed for surah ${surahNumber}:`, error);
    }
    
    // Fallback API: QuranAPI.pages.dev
    try {
      console.log(`Falling back to QuranAPI.pages.dev for surah ${surahNumber}`);
      const response = await enhancedFetch(
        `${this.quranApiUrl}/editions/ara-quranacademy/${surahNumber}.json`,
        { retries: 2 }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`QuranAPI.pages.dev API response for surah ${surahNumber}:`, {
        hasChapter: !!data.chapter,
        versesCount: data.chapter?.length || 0,
        firstVerseText: data.chapter?.[0]?.substring(0, 50)
      });
      
      if (data.chapter && Array.isArray(data.chapter) && data.chapter.length > 0) {
        const normalizedData = {
          number: surahNumber,
          name: `Surah ${surahNumber}`,
          englishName: `Surah ${surahNumber}`,
          numberOfAyahs: data.chapter.length,
          ayahs: data.chapter.map((ayahText: string, index: number) => {
            let processedText = ayahText || '';
            
            // For all surahs except Al-Fatihah (1) and At-Tawbah (9), remove Bismillah from first ayah
            if (surahNumber !== 1 && surahNumber !== 9 && index === 0) {
              const originalText = processedText;
              
              // Enhanced Bismillah removal - same as primary API
              const bismillahPatterns = [
                'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ',
                'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ',
                'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
                'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ ',
                'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ',
                'بسم الله الرحمن الرحيم ',
                'بسم الله الرحمن الرحيم',
                'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ ',
                'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ',
                'بسم اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ',
                'بسم اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ ',
                'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ'
              ];
              
              let bismillahRemoved = false;
              
              // Try exact pattern matching first
              for (const pattern of bismillahPatterns) {
                if (processedText.startsWith(pattern)) {
                  processedText = processedText.substring(pattern.length).trim();
                  console.log(`✅ [QuranAPI.pages.dev] Removed Bismillah exact pattern from Surah ${surahNumber}, Ayah 1`);
                  bismillahRemoved = true;
                  break;
                }
              }
              
              // Enhanced regex fallback
              if (!bismillahRemoved) {
                const regexPatterns = [
                  /^\s*بِسۡ?ْمِ\s+[اٱ]للَّ?ّٰ?هِ\s+[اٱ]لرَّحۡ?ْمَ?ٰ?نِ\s+[اٱ]لرَّحِيۡ?مِ\s*/,
                  /^\s*بسم\s+الله\s+الرحمن\s+الرحيم\s*/,
                  /^\s*بِسْمِ\s+اللَّهِ\s+الرَّحْمَٰنِ\s+الرَّحِيمِ\s*/,
                  /^\s*بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s*/,
                  /^[\u0600-\u06FF\s]{20,40}(?=\s*[اأإ])/
                ];
                
                for (const regex of regexPatterns) {
                  const match = processedText.match(regex);
                  if (match && match[0].length > 15) {
                    const matchedText = match[0];
                    if (matchedText.includes('بسم') || matchedText.includes('بِسْمِ')) {
                      processedText = processedText.substring(matchedText.length).trim();
                      console.log(`✅ [QuranAPI.pages.dev] Removed Bismillah using regex from Surah ${surahNumber}, Ayah 1`);
                      bismillahRemoved = true;
                      break;
                    }
                  }
                }
              }
              
              if (bismillahRemoved && processedText.length > 0 && processedText !== originalText) {
                console.log(`✅ [QuranAPI.pages.dev] Successfully cleaned Surah ${surahNumber}, Ayah 1. Original length: ${originalText.length}, New length: ${processedText.length}`);
              } else if (originalText.length > 50) {
                console.warn(`⚠️ [QuranAPI.pages.dev] Could not remove Bismillah from Surah ${surahNumber}, Ayah 1. Text: "${originalText.substring(0, 100)}..."`);
                // Force removal if text is suspiciously long
                if (originalText.length > 100) {
                  const words = originalText.split(' ');
                  if (words.length > 10) {
                    processedText = words.slice(6).join(' ').trim();
                    console.log(`🔧 [QuranAPI.pages.dev] Force-removed suspected Bismillah from Surah ${surahNumber}, Ayah 1`);
                  }
                }
              }
            }
            
            return {
              number: index + 1,
              text: processedText,
              numberInSurah: index + 1,
              translation: '',
              juz: 1,
              hizb: 1,
              page: 1,
              sajda: false
            };
          })
        };
        
        // Validate that we have Arabic text
        const hasArabicText = normalizedData.ayahs.some((ayah: any) => 
          ayah.text && ayah.text.trim().length > 0 && /[\u0600-\u06FF]/.test(ayah.text)
        );
        
        if (hasArabicText) {
          await cacheService.set('quran_ayahs', cacheKey, normalizedData);
          console.log(`✅ Successfully fetched surah ${surahNumber} with ${normalizedData.ayahs.length} ayahs from QuranAPI.pages.dev`);
          return normalizedData;
        }
      }
    } catch (error) {
      console.error(`❌ QuranAPI.pages.dev API failed for surah ${surahNumber}:`, error);
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
    
    // Try AlQuran.cloud first
    try {
      console.log(`Fetching ayah ${surahNumber}:${ayahNumber} from AlQuran.cloud`);
      const response = await enhancedFetch(`${this.alQuranUrl}/ayah/${surahNumber}:${ayahNumber}/editions/quran-uthmani`, { retries: 2 });
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const ayah = data.data[0];
        const normalizedData = {
          number: ayah.number,
          text: ayah.text || '',
          numberInSurah: ayah.numberInSurah,
          translation: '',
          juz: ayah.juz || 1,
          hizb: ayah.hizb || 1,
          page: ayah.page || 1,
          sajda: ayah.sajda || false
        };
        
        // Cache the result
        await cacheService.set('quran_ayahs', cacheKey, normalizedData);
        
        return normalizedData;
      }
    } catch (error) {
      console.error('AlQuran.cloud ayah fetch failed:', error);
    }
    
    // Fallback to QuranAPI.pages.dev
    try {
      console.log(`Falling back to QuranAPI.pages.dev for ayah ${surahNumber}:${ayahNumber}`);
      const response = await enhancedFetch(`${this.quranApiUrl}/editions/ara-quranacademy/${surahNumber}/${ayahNumber}.json`, { retries: 2 });
      const data = await response.json();
      
      const normalizedData = {
        number: ayahNumber,
        text: data.verse || '',
        numberInSurah: ayahNumber,
        translation: '',
        juz: 1,
        hizb: 1,
        page: 1,
        sajda: false
      };
      
      // Cache the result
      await cacheService.set('quran_ayahs', cacheKey, normalizedData);
      
      return normalizedData;
    } catch (error) {
      console.error('Error fetching ayah from all sources:', error);
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
    
    // For now, return empty array as QuranAPI.pages.dev doesn't have search functionality
    // This would need to be implemented by fetching all surahs and searching locally
    console.log(`Search not implemented for QuranAPI.pages.dev yet: ${sanitizedQuery}`);
    return [];
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
      console.log(`Fetching translation ${surahNumber}:${ayahNumber} from QuranAPI.pages.dev`);
      const response = await enhancedFetch(`${this.quranApiUrl}/editions/eng-sahih/${surahNumber}/${ayahNumber}.json`, { retries: 2 });
      const data = await response.json();
      
      const translationData = {
        text: data.verse || '',
        verse_number: ayahNumber,
        chapter_id: surahNumber
      };
      
      // Cache the result
      await cacheService.set('translations', cacheKey, translationData);
      
      return translationData;
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
    
    // Fallback to QuranAPI.pages.dev
    try {
      console.log('Falling back to QuranAPI.pages.dev for surahs');
      const response = await enhancedFetch(`${this.quranApiUrl}/info.json`, { retries: 2 });
      const data = await response.json();
      
      if (data.chapters && Array.isArray(data.chapters) && data.chapters.length > 0) {
        const normalizedData = data.chapters.map((chapter: any, index: number) => ({
          number: index + 1,
          name: chapter.name || `Surah ${index + 1}`,
          arabicName: chapter.arabic || '',
          englishName: chapter.english || chapter.name || `Surah ${index + 1}`,
          numberOfAyahs: chapter.verses || 0,
          revelationType: chapter.type || 'meccan'
        }));
        
        // Cache the result
        await cacheService.set('quran_surahs', cacheKey, normalizedData);
        console.log(`Successfully fetched ${normalizedData.length} surahs from QuranAPI.pages.dev`);
        return normalizedData;
      }
    } catch (error) {
      console.error('Error fetching from QuranAPI.pages.dev:', error);
    }
    
    throw new Error('Failed to fetch surahs from all sources');
  }

  // Juz fetching is not implemented for QuranAPI.pages.dev
  async getJuz(juzNumber: number, edition: string = 'quran-uthmani'): Promise<any> {
    const cacheKey = `${juzNumber}_${edition}`;
    // Check cache first
    const cached = await cacheService.get('quran_ayahs', cacheKey);
    if (cached) {
      console.log(`Cache hit for juz ${juzNumber}`);
      return cached;
    }
    // Not implemented
    console.log('Juz fetching not implemented for QuranAPI.pages.dev');
    return null;
  }
}

export const quranApi = new QuranApiService();
export default quranApi;