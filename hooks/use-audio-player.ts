import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export interface AudioPlayerState {
  isPlaying: boolean;
  currentAyah: number | null;
  currentSurah: number | null;
  isLoading: boolean;
  error: string | null;
  playbackMode: 'single' | 'continuous' | 'range';
  repeatCount: number;
  pauseBetweenAyahs: number;
  autoScroll: boolean;
  rangeStart: number;
  rangeEnd: number;
  currentRepeat: number;
}

export interface AudioPlayerActions {
  playAyah: (surahNumber: number, ayahNumber: number) => Promise<void>;
  playWholeSurah: (surahNumber: number, totalAyahs: number) => Promise<void>;
  playRange: (surahNumber: number, start: number, end: number) => Promise<void>;
  stopPlayback: () => Promise<void>;
  pausePlayback: () => Promise<void>;
  resumePlayback: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  setPlaybackMode: (mode: 'single' | 'continuous' | 'range') => void;
  setRepeatCount: (count: number) => void;
  setPauseBetweenAyahs: (seconds: number) => void;
  setAutoScroll: (enabled: boolean) => void;
  setRange: (start: number, end: number) => void;
  setReciter: (reciterId: string) => void;
}

const RECITERS = {
  'almatroud': 'almatroud',
  'mishary-alafasy': 'alafasy',
  'abdur-rahman-sudais': 'sudais',
  'maher-al-muaiqly': 'muaiqly',
  'abdullah-basfar': 'basfar',
  'saad-al-ghamdi': 'ghamdi',
  'ali-al-hudhaify': 'hudhaify',
  'abu-bakr-al-shatri': 'shatri',
  'ahmad-al-ajmi': 'ajmi',
  'mohamed-siddiq-al-minshawi': 'minshawi',
  'mohamed-al-tablawi': 'tablawi',
  'aliyu-jabir': 'jabir',
  'bandar-baleela': 'baleela',
  'yasser-al-dosari': 'dosari',
  'khalid-al-jalil': 'jalil',
  'nasser-al-qatami': 'qatami',
  'fares-abbad': 'abbad',
  'salah-al-budair': 'budair',
  'omar-al-kazabri': 'kazabri',
  'idris-abkar': 'abkar',
};

export function useAudioPlayer(): AudioPlayerState & AudioPlayerActions {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentAyah: null,
    currentSurah: null,
    isLoading: false,
    error: null,
    playbackMode: 'single',
    repeatCount: 1,
    pauseBetweenAyahs: 0,
    autoScroll: true,
    rangeStart: 1,
    rangeEnd: 1,
    currentRepeat: 0,
  });

  const soundRef = useRef<Audio.Sound | null>(null);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentReciterRef = useRef<string>('almatroud');
  const totalAyahsRef = useRef<number>(0);

  // Initialize audio mode for mobile
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    }
  }, []);

  const cleanup = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (Platform.OS === 'web') {
      if (webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current.src = '';
        webAudioRef.current = null;
      }
    } else {
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (error) {
          console.log('Error unloading sound:', error);
        }
        soundRef.current = null;
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const getAudioUrl = useCallback((surahNumber: number, ayahNumber: number): string => {
    // Use working audio URLs from EveryAyah.com
    const reciterFolder = RECITERS[currentReciterRef.current as keyof typeof RECITERS] || 'alafasy';
    const paddedSurah = surahNumber.toString().padStart(3, '0');
    const paddedAyah = ayahNumber.toString().padStart(3, '0');
    
    // Use multiple fallback sources
    const sources = [
      `https://everyayah.com/data/Alafasy_128kbps/${paddedSurah}${paddedAyah}.mp3`,
      `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${paddedSurah}${paddedAyah}.mp3`,
      `https://audio.qurancdn.com/${paddedSurah}${paddedAyah}.mp3`
    ];
    
    return sources[0]; // Start with the most reliable source
  }, []);
  


  const playAudio = useCallback(async (url: string): Promise<void> => {
    await cleanup();

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (Platform.OS === 'web') {
        return new Promise((resolve, reject) => {
          const audio = new (window as any).Audio(url) as HTMLAudioElement;
          webAudioRef.current = audio;

          audio.onloadeddata = () => {
            setState(prev => ({ ...prev, isLoading: false }));
          };

          audio.onplay = () => {
            setState(prev => ({ ...prev, isPlaying: true }));
          };

          audio.onpause = () => {
            setState(prev => ({ ...prev, isPlaying: false }));
          };

          audio.onended = () => {
            setState(prev => ({ ...prev, isPlaying: false }));
            resolve();
          };

          audio.onerror = (error: any) => {
            console.error('Audio error:', error);
            setState(prev => ({ 
              ...prev, 
              isLoading: false, 
              isPlaying: false,
              error: 'Failed to load audio' 
            }));
            reject(error);
          };

          // Set volume and play
          audio.volume = 1.0;
          audio.play().catch((playError: any) => {
            console.error('Play error:', playError);
            reject(playError);
          });
        });
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, isLooping: false }
        );
        
        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded) {
            setState(prev => ({ 
              ...prev, 
              isLoading: false,
              isPlaying: status.isPlaying || false 
            }));

            if (status.didJustFinish) {
              setState(prev => ({ ...prev, isPlaying: false }));
            }
          } else if (status.error) {
            setState(prev => ({ 
              ...prev, 
              isLoading: false, 
              isPlaying: false,
              error: `Audio error: ${status.error}` 
            }));
          }
        });

        // Wait for audio to finish
        return new Promise((resolve) => {
          const checkStatus = async () => {
            try {
              const status = await sound.getStatusAsync();
              if (status.isLoaded && status.didJustFinish) {
                resolve();
              } else if (status.isLoaded && status.isPlaying) {
                setTimeout(checkStatus, 100);
              } else {
                resolve();
              }
            } catch (error) {
              console.log('Error checking audio status:', error);
              resolve();
            }
          };
          setTimeout(checkStatus, 100);
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isPlaying: false,
        error: 'Failed to play audio' 
      }));
      throw error;
    }
  }, [cleanup]);

  const playNextAyah = useCallback(async () => {
    const { currentSurah, currentAyah, playbackMode, rangeEnd, currentRepeat, repeatCount } = state;
    
    if (!currentSurah || !currentAyah) return;

    // Handle repeat logic
    if (currentRepeat < repeatCount - 1) {
      setState(prev => ({ ...prev, currentRepeat: prev.currentRepeat + 1 }));
      
      // Add pause between repeats if configured
      if (state.pauseBetweenAyahs > 0) {
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(resolve, state.pauseBetweenAyahs * 1000);
        });
      }
      
      // Replay the same ayah
      const url = getAudioUrl(currentSurah, currentAyah);
      await playAudio(url);
      await playNextAyah(); // Recursive call for repeat
      return;
    }

    // Reset repeat counter and move to next ayah
    setState(prev => ({ ...prev, currentRepeat: 0 }));

    let nextAyah = currentAyah + 1;
    
    // Check boundaries based on playback mode
    if (playbackMode === 'range' && nextAyah > rangeEnd) {
      // Range playback finished
      setState(prev => ({ ...prev, isPlaying: false, currentAyah: null }));
      return;
    }
    
    if (playbackMode === 'continuous' && nextAyah > totalAyahsRef.current) {
      // Whole surah finished
      setState(prev => ({ ...prev, isPlaying: false, currentAyah: null }));
      return;
    }

    if (playbackMode === 'single') {
      // Single ayah finished
      setState(prev => ({ ...prev, isPlaying: false, currentAyah: null }));
      return;
    }

    // Play next ayah
    setState(prev => ({ ...prev, currentAyah: nextAyah }));
    
    // Add pause between ayahs if configured
    if (state.pauseBetweenAyahs > 0) {
      await new Promise(resolve => {
        timeoutRef.current = setTimeout(resolve, state.pauseBetweenAyahs * 1000);
      });
    }

    try {
      const url = getAudioUrl(currentSurah, nextAyah);
      await playAudio(url);
      await playNextAyah(); // Continue to next ayah
    } catch (error) {
      console.error('Error playing next ayah:', error);
      setState(prev => ({ ...prev, isPlaying: false, error: 'Failed to play next ayah' }));
    }
  }, [state, getAudioUrl, playAudio]);

  const playAyah = useCallback(async (surahNumber: number, ayahNumber: number) => {
    try {
      setState(prev => ({ 
        ...prev, 
        currentSurah: surahNumber, 
        currentAyah: ayahNumber,
        playbackMode: 'single',
        currentRepeat: 0
      }));

      const url = getAudioUrl(surahNumber, ayahNumber);
      await playAudio(url);
      await playNextAyah();
    } catch (error) {
      console.error('Error playing ayah:', error);
    }
  }, [getAudioUrl, playAudio, playNextAyah]);

  const playWholeSurah = useCallback(async (surahNumber: number, totalAyahs: number) => {
    try {
      totalAyahsRef.current = totalAyahs;
      setState(prev => ({ 
        ...prev, 
        currentSurah: surahNumber, 
        currentAyah: 1,
        playbackMode: 'continuous',
        currentRepeat: 0
      }));

      const url = getAudioUrl(surahNumber, 1);
      await playAudio(url);
      await playNextAyah();
    } catch (error) {
      console.error('Error playing whole surah:', error);
    }
  }, [getAudioUrl, playAudio, playNextAyah]);

  const playRange = useCallback(async (surahNumber: number, start: number, end: number) => {
    try {
      setState(prev => ({ 
        ...prev, 
        currentSurah: surahNumber, 
        currentAyah: start,
        playbackMode: 'range',
        rangeStart: start,
        rangeEnd: end,
        currentRepeat: 0
      }));

      const url = getAudioUrl(surahNumber, start);
      await playAudio(url);
      await playNextAyah();
    } catch (error) {
      console.error('Error playing range:', error);
    }
  }, [getAudioUrl, playAudio, playNextAyah]);

  const stopPlayback = useCallback(async () => {
    await cleanup();
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentAyah: null,
      currentRepeat: 0
    }));
  }, [cleanup]);

  const pausePlayback = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        webAudioRef.current?.pause();
      } else {
        await soundRef.current?.pauseAsync();
      }
      setState(prev => ({ ...prev, isPlaying: false }));
    } catch (error) {
      console.error('Error pausing playback:', error);
    }
  }, []);

  const resumePlayback = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        await webAudioRef.current?.play();
      } else {
        await soundRef.current?.playAsync();
      }
      setState(prev => ({ ...prev, isPlaying: true }));
    } catch (error) {
      console.error('Error resuming playback:', error);
    }
  }, []);

  const playNext = useCallback(async () => {
    const { currentSurah, currentAyah, playbackMode, rangeEnd } = state;
    if (!currentSurah || !currentAyah) return;

    let nextAyah = currentAyah + 1;
    
    if (playbackMode === 'range' && nextAyah > rangeEnd) return;
    if (playbackMode === 'continuous' && nextAyah > totalAyahsRef.current) return;

    await stopPlayback();
    await playAyah(currentSurah, nextAyah);
  }, [state, stopPlayback, playAyah]);

  const playPrevious = useCallback(async () => {
    const { currentSurah, currentAyah, playbackMode, rangeStart } = state;
    if (!currentSurah || !currentAyah) return;

    let prevAyah = currentAyah - 1;
    
    if (playbackMode === 'range' && prevAyah < rangeStart) return;
    if (prevAyah < 1) return;

    await stopPlayback();
    await playAyah(currentSurah, prevAyah);
  }, [state, stopPlayback, playAyah]);

  const setPlaybackMode = useCallback((mode: 'single' | 'continuous' | 'range') => {
    setState(prev => ({ ...prev, playbackMode: mode }));
  }, []);

  const setRepeatCount = useCallback((count: number) => {
    setState(prev => ({ ...prev, repeatCount: Math.max(1, Math.min(10, count)) }));
  }, []);

  const setPauseBetweenAyahs = useCallback((seconds: number) => {
    setState(prev => ({ ...prev, pauseBetweenAyahs: Math.max(0, Math.min(10, seconds)) }));
  }, []);

  const setAutoScroll = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, autoScroll: enabled }));
  }, []);

  const setRange = useCallback((start: number, end: number) => {
    setState(prev => ({ ...prev, rangeStart: start, rangeEnd: end }));
  }, []);

  const setReciter = useCallback((reciterId: string) => {
    currentReciterRef.current = reciterId;
  }, []);

  return {
    ...state,
    playAyah,
    playWholeSurah,
    playRange,
    stopPlayback,
    pausePlayback,
    resumePlayback,
    playNext,
    playPrevious,
    setPlaybackMode,
    setRepeatCount,
    setPauseBetweenAyahs,
    setAutoScroll,
    setRange,
    setReciter,
  };
}