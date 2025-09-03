import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type ArabicFont = 'uthmanic' | 'naskh' | 'kufi' | 'thuluth';
export type LayoutMode = 'comfortable' | 'compact' | 'spacious';
export type ReadingMode = 'arabic-only' | 'translation-only' | 'both' | 'side-by-side';

export interface PersonalizationSettings {
  // Theme & Appearance
  themeMode: ThemeMode;
  primaryColor: string;
  accentColor: string;
  
  // Typography
  fontSize: FontSize;
  arabicFont: ArabicFont;
  translationFont: string;
  lineHeight: number;
  
  // Layout
  layoutMode: LayoutMode;
  readingMode: ReadingMode;
  showTransliteration: boolean;
  showVerseNumbers: boolean;
  showJuzMarkers: boolean;
  
  // Audio
  defaultReciter: number;
  playbackSpeed: number;
  autoPlay: boolean;
  repeatMode: 'none' | 'verse' | 'surah';
  
  // Prayer Times
  calculationMethod: string;
  madhab: 'shafi' | 'hanafi';
  adjustments: {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
  
  // Language & Localization
  language: string;
  translationLanguage: string;
  dateFormat: 'gregorian' | 'hijri' | 'both';
  
  // Accessibility
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  
  // Study Features
  highlightColor: string;
  bookmarkSync: boolean;
  studyReminders: boolean;
  
  // Privacy
  analytics: boolean;
  crashReporting: boolean;
}

const defaultSettings: PersonalizationSettings = {
  // Theme & Appearance
  themeMode: 'light',
  primaryColor: Colors.primary,
  accentColor: Colors.secondary,
  
  // Typography
  fontSize: 'medium',
  arabicFont: 'uthmanic',
  translationFont: 'system',
  lineHeight: 1.6,
  
  // Layout
  layoutMode: 'comfortable',
  readingMode: 'both',
  showTransliteration: true,
  showVerseNumbers: true,
  showJuzMarkers: true,
  
  // Audio
  defaultReciter: 7, // Abu Bakr al-Shatri
  playbackSpeed: 1.0,
  autoPlay: false,
  repeatMode: 'none',
  
  // Prayer Times
  calculationMethod: 'MuslimWorldLeague',
  madhab: 'shafi',
  adjustments: {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0
  },
  
  // Language & Localization
  language: 'en',
  translationLanguage: 'en.sahih',
  dateFormat: 'both',
  
  // Accessibility
  highContrast: false,
  reducedMotion: false,
  screenReader: false,
  
  // Study Features
  highlightColor: Colors.islamicGold,
  bookmarkSync: true,
  studyReminders: true,
  
  // Privacy
  analytics: true,
  crashReporting: true
};

interface PersonalizationContextType {
  settings: PersonalizationSettings;
  updateSettings: (updates: Partial<PersonalizationSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
  
  // Computed values
  currentTheme: 'light' | 'dark';
  fontSizeValue: number;
  arabicFontFamily: string;
  translationFontFamily: string;
  
  // Quick actions
  toggleTheme: () => Promise<void>;
  increaseFontSize: () => Promise<void>;
  decreaseFontSize: () => Promise<void>;
  setReadingMode: (mode: ReadingMode) => Promise<void>;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

const STORAGE_KEY = '@islamic_app_personalization';

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PersonalizationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        // Merge with defaults to handle new settings
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading personalization settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: PersonalizationSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving personalization settings:', error);
    }
  };

  const updateSettings = async (updates: Partial<PersonalizationSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const resetSettings = async () => {
    setSettings(defaultSettings);
    await saveSettings(defaultSettings);
  };

  // Computed values
  const currentTheme = settings.themeMode === 'auto' 
    ? 'light' // In a real app, you'd check system theme
    : settings.themeMode;

  const fontSizeValue = {
    'small': 14,
    'medium': 16,
    'large': 18,
    'extra-large': 20
  }[settings.fontSize];

  const arabicFontFamily = {
    'uthmanic': 'UthmanicHafs', // Would need to be loaded
    'naskh': 'AmiriQuran',
    'kufi': 'KufiQuran',
    'thuluth': 'ThuluthQuran'
  }[settings.arabicFont];

  const translationFontFamily = settings.translationFont === 'system' 
    ? 'System' 
    : settings.translationFont;

  // Quick actions
  const toggleTheme = async () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    await updateSettings({ themeMode: newTheme });
  };

  const increaseFontSize = async () => {
    const sizes: FontSize[] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    if (currentIndex < sizes.length - 1) {
      await updateSettings({ fontSize: sizes[currentIndex + 1] });
    }
  };

  const decreaseFontSize = async () => {
    const sizes: FontSize[] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    if (currentIndex > 0) {
      await updateSettings({ fontSize: sizes[currentIndex - 1] });
    }
  };

  const setReadingMode = async (mode: ReadingMode) => {
    await updateSettings({ readingMode: mode });
  };

  const value: PersonalizationContextType = {
    settings,
    updateSettings,
    resetSettings,
    isLoading,
    currentTheme,
    fontSizeValue,
    arabicFontFamily,
    translationFontFamily,
    toggleTheme,
    increaseFontSize,
    decreaseFontSize,
    setReadingMode
  };

  return (
    <PersonalizationContext.Provider value={value}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const context = useContext(PersonalizationContext);
  if (context === undefined) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  return context;
}

// Theme colors based on personalization
export function useThemedColors() {
  const { settings, currentTheme } = usePersonalization();
  
  const baseColors = currentTheme === 'dark' ? {
    background: '#1a1a1a',
    surface: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#cccccc',
    textLight: '#999999',
    border: '#404040'
  } : {
    background: Colors.background,
    surface: Colors.surface,
    text: Colors.text,
    textSecondary: Colors.textSecondary,
    textLight: Colors.textLight,
    border: '#e0e0e0'
  };

  return {
    ...baseColors,
    primary: settings.primaryColor,
    accent: settings.accentColor,
    highlight: settings.highlightColor,
    // High contrast mode adjustments
    ...(settings.highContrast && {
      text: currentTheme === 'dark' ? '#ffffff' : '#000000',
      background: currentTheme === 'dark' ? '#000000' : '#ffffff'
    })
  };
}

// Typography styles based on personalization
export function useThemedTypography() {
  const { settings, fontSizeValue, arabicFontFamily, translationFontFamily } = usePersonalization();
  
  return {
    arabic: {
      fontFamily: arabicFontFamily,
      fontSize: fontSizeValue + 4, // Arabic text is typically larger
      lineHeight: fontSizeValue * settings.lineHeight + 4,
      textAlign: 'right' as const
    },
    translation: {
      fontFamily: translationFontFamily,
      fontSize: fontSizeValue,
      lineHeight: fontSizeValue * settings.lineHeight,
      textAlign: 'left' as const
    },
    transliteration: {
      fontFamily: 'monospace',
      fontSize: fontSizeValue - 2,
      lineHeight: fontSizeValue * settings.lineHeight - 2,
      fontStyle: 'italic' as const
    }
  };
}

export default PersonalizationProvider;