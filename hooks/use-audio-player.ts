import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import audioDownloadService from '@/services/audio-download-service';

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
  const currentReciterRef = useRef<string>('mishary-alafasy');
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

  const getAudioUrl = useCallback(async (surahNumber: number, ayahNumber: number): Promise<string> => {
    console.log(`Getting audio URL for Surah ${surahNumber}, Ayah ${ayahNumber}, Reciter: ${currentReciterRef.current}`);
    
    try {
      // Use the download service to get the best available audio URI (local or online)
      const audioUri = await audioDownloadService.getAudioUri(
        currentReciterRef.current,
        surahNumber,
        ayahNumber
      );
      
      console.log('Audio URI:', audioUri);
      return audioUri;
    } catch (error) {
      console.error('Error getting audio URI:', error);
      // Fallback to online URL if service fails
      const paddedSurah = surahNumber.toString().padStart(3, '0');
      const paddedAyah = ayahNumber.toString().padStart(3, '0');
      const fallbackUrl = `https://everyayah.com/data/Alafasy_128kbps/${paddedSurah}${paddedAyah}.mp3`;
      console.log('Using fallback URL:', fallbackUrl);
      return fallbackUrl;
    }
  }, []);

  // Forward declaration for playAudio function
  let playAudioFunction: (url: string, shouldTriggerNext?: boolean) => Promise<void>;

  const handleAudioEnd = useCallback(() => {
    setState(currentState => {
      const { currentSurah, currentAyah, playbackMode, rangeEnd, currentRepeat, repeatCount } = currentState;
      
      if (!currentSurah || !currentAyah) return { ...currentState, isPlaying: false };

      // Handle repeat logic
      if (currentRepeat < repeatCount - 1) {
        // Increment repeat counter and replay same ayah
        setTimeout(async () => {
          // Add pause between repeats if configured
          if (currentState.pauseBetweenAyahs > 0) {
            await new Promise(resolve => {
              timeoutRef.current = setTimeout(resolve, currentState.pauseBetweenAyahs * 1000);
            });
          }
          
          // Replay the same ayah
          const url = await getAudioUrl(currentSurah, currentAyah);
          playAudioFunction(url, true);
        }, 100);
        
        return { ...currentState, currentRepeat: currentState.currentRepeat + 1 };
      }

      // Reset repeat counter and move to next ayah
      const nextAyah = currentAyah + 1;
      
      // Check boundaries based on playback mode
      if (playbackMode === 'range' && nextAyah > rangeEnd) {
        // Range playback finished
        return { ...currentState, isPlaying: false, currentAyah: null, currentRepeat: 0 };
      }
      
      if (playbackMode === 'continuous' && nextAyah > totalAyahsRef.current) {
        // Whole surah finished
        return { ...currentState, isPlaying: false, currentAyah: null, currentRepeat: 0 };
      }

      if (playbackMode === 'single') {
        // Single ayah finished
        return { ...currentState, isPlaying: false, currentAyah: null, currentRepeat: 0 };
      }

      // Play next ayah
      setTimeout(async () => {
        // Add pause between ayahs if configured
        if (currentState.pauseBetweenAyahs > 0) {
          await new Promise(resolve => {
            timeoutRef.current = setTimeout(resolve, currentState.pauseBetweenAyahs * 1000);
          });
        }

        try {
          const url = await getAudioUrl(currentSurah, nextAyah);
          playAudioFunction(url, true);
        } catch (error) {
          console.error('Error playing next ayah:', error);
          setState(prev => ({ ...prev, isPlaying: false, error: 'Failed to play next ayah' }));
        }
      }, 100);

      return { ...currentState, currentAyah: nextAyah, currentRepeat: 0 };
    });
  }, [getAudioUrl]);

  const playAudio = useCallback(async (url: string, shouldTriggerNext: boolean = true): Promise<void> => {
    // Always cleanup before playing new audio
    await cleanup();

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    console.log('Playing audio from URL:', url);

    try {
      if (Platform.OS === 'web') {
        return new Promise((resolve, reject) => {
          const audio = new (window as any).Audio(url) as HTMLAudioElement;
          webAudioRef.current = audio;

          audio.onloadstart = () => {
            console.log('Audio loading started');
          };

          audio.onloadeddata = () => {
            console.log('Audio data loaded');
            setState(prev => ({ ...prev, isLoading: false }));
          };

          audio.oncanplay = () => {
            console.log('Audio can start playing');
          };

          audio.onplay = () => {
            console.log('Audio started playing');
            setState(prev => ({ ...prev, isPlaying: true }));
          };

          audio.onpause = () => {
            console.log('Audio paused');
            setState(prev => ({ ...prev, isPlaying: false }));
          };

          audio.onended = () => {
            console.log('Audio ended');
            setState(prev => ({ ...prev, isPlaying: false }));
            if (shouldTriggerNext) {
              setTimeout(() => {
                handleAudioEnd();
              }, 100);
            }
            resolve();
          };

          audio.onerror = (error: any) => {
            console.error('Audio error:', error, 'URL:', url);
            setState(prev => ({ 
              ...prev, 
              isLoading: false, 
              isPlaying: false,
              error: 'Failed to load audio' 
            }));
            reject(error);
          };

          // Set properties and play
          audio.volume = 1.0;
          audio.preload = 'auto';
          audio.crossOrigin = 'anonymous';
          
          audio.play().catch((playError: any) => {
            console.error('Play error:', playError);
            setState(prev => ({ 
              ...prev, 
              isLoading: false, 
              isPlaying: false,
              error: 'Failed to play audio' 
            }));
            reject(playError);
          });
        });
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, isLooping: false, volume: 1.0 }
        );
        
        soundRef.current = sound;
        console.log('Mobile audio created and playing');

        // Wait for the sound to finish playing
        return new Promise((resolve) => {
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded) {
              setState(prev => ({ 
                ...prev, 
                isLoading: false,
                isPlaying: status.isPlaying || false 
              }));

              if (status.didJustFinish) {
                console.log('Mobile audio finished');
                setState(prev => ({ ...prev, isPlaying: false }));
                if (shouldTriggerNext) {
                  setTimeout(() => {
                    handleAudioEnd();
                  }, 100);
                }
                resolve();
              }
            } else if (status.error) {
              console.error('Mobile audio error:', status.error);
              setState(prev => ({ 
                ...prev, 
                isLoading: false, 
                isPlaying: false,
                error: `Audio error: ${status.error}` 
              }));
              resolve();
            }
          });
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
  }, [cleanup, handleAudioEnd]);

  // Assign the function to the forward declaration
  playAudioFunction = playAudio;

  const playAyah = useCallback(async (surahNumber: number, ayahNumber: number) => {
    try {
      // Stop any current playback first
      await cleanup();
      
      setState(prev => ({ 
        ...prev, 
        currentSurah: surahNumber, 
        currentAyah: ayahNumber,
        playbackMode: 'single',
        currentRepeat: 0,
        isPlaying: false
      }));

      const url = await getAudioUrl(surahNumber, ayahNumber);
      await playAudio(url, false);
    } catch (error) {
      console.error('Error playing ayah:', error);
    }
  }, [getAudioUrl, playAudio, cleanup]);

  const playWholeSurah = useCallback(async (surahNumber: number, totalAyahs: number) => {
    try {
      // Stop any current playback first
      await cleanup();
      
      totalAyahsRef.current = totalAyahs;
      setState(prev => ({ 
        ...prev, 
        currentSurah: surahNumber, 
        currentAyah: 1,
        playbackMode: 'continuous',
        currentRepeat: 0,
        isPlaying: false
      }));

      // Start playing the first ayah and let the playback system handle the rest
      const url = await getAudioUrl(surahNumber, 1);
      await playAudio(url, true);
      
    } catch (error) {
      console.error('Error playing whole surah:', error);
      setState(prev => ({ ...prev, isPlaying: false, currentAyah: null }));
    }
  }, [getAudioUrl, playAudio, cleanup]);

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

      const url = await getAudioUrl(surahNumber, start);
      await playAudio(url, true);
    } catch (error) {
      console.error('Error playing range:', error);
    }
  }, [getAudioUrl, playAudio]);

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
    console.log('Setting reciter to:', reciterId);
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