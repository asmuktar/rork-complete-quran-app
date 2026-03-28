import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Volume2, Type, Moon, Sun, Globe, Download, Bell, Shield, Wifi, WifiOff, Palette, Eye, Smartphone } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { TOP_RECITERS } from '@/constants/reciters';
import { usePersonalization } from '@/contexts/personalization-context';
import offlineService from '@/services/offline-service';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  type: 'toggle' | 'select' | 'slider' | 'action' | 'info';
  icon: any;
  value?: any;
  options?: { label: string; value: any }[];
  action?: () => void;
  loading?: boolean;
}

export default function SettingsScreen() {
  const { settings: personalizationSettings, updateSettings, resetSettings } = usePersonalization();
  const [isOnline, setIsOnline] = useState(true);
  const [cacheSize, setCacheSize] = useState(0);
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    checkNetworkStatus();
    getCacheSize();
  }, []);

  const checkNetworkStatus = () => {
    setIsOnline(offlineService.getNetworkStatus());
  };

  const getCacheSize = async () => {
    const size = await offlineService.getCacheSize();
    setCacheSize(size);
  };

  const handlePreloadData = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Please connect to the internet to preload data.');
      return;
    }

    setIsPreloading(true);
    try {
      await offlineService.preloadEssentialData();
      await getCacheSize();
      Alert.alert('Success', 'Essential Quran data has been preloaded for offline use.');
    } catch (error) {
      Alert.alert('Error', 'Failed to preload data. Please try again.');
    } finally {
      setIsPreloading(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached data and you\'ll need to download content again. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await offlineService.clearAllData();
            await getCacheSize();
            Alert.alert('Success', 'Cache cleared successfully.');
          }
        }
      ]
    );
  };

  const handleResetSettings = async () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to their default values. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetSettings();
            Alert.alert('Success', 'Settings have been reset to defaults.');
          }
        }
      ]
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const updateSetting = async (key: string, value: any) => {
    await updateSettings({ [key]: value } as any);
  };

  const settingSections = [
    {
      title: 'Offline & Sync',
      items: [
        {
          id: 'networkStatus',
          title: 'Network Status',
          description: isOnline ? 'Connected to internet' : 'Offline mode active',
          type: 'info' as const,
          icon: isOnline ? Wifi : WifiOff,
          value: isOnline
        },
        {
          id: 'cacheSize',
          title: 'Cached Data',
          description: `${formatBytes(cacheSize)} stored locally`,
          type: 'info' as const,
          icon: Download,
          value: cacheSize
        },
        {
          id: 'preloadData',
          title: 'Preload Essential Data',
          description: 'Download common surahs for offline reading',
          type: 'action' as const,
          icon: Download,
          action: handlePreloadData,
          loading: isPreloading
        },
        {
          id: 'clearCache',
          title: 'Clear Cache',
          description: 'Remove all downloaded content',
          type: 'action' as const,
          icon: Shield,
          action: handleClearCache
        }
      ]
    },
    {
      title: 'Appearance & Theme',
      items: [
        {
          id: 'themeMode',
          title: 'Theme Mode',
          description: 'Choose your preferred theme',
          type: 'select' as const,
          icon: Palette,
          value: personalizationSettings.themeMode,
          options: [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
            { label: 'Auto (System)', value: 'auto' }
          ]
        },
        {
          id: 'fontSize',
          title: 'Font Size',
          description: `Current: ${personalizationSettings.fontSize}`,
          type: 'select' as const,
          icon: Type,
          value: personalizationSettings.fontSize,
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
            { label: 'Extra Large', value: 'extra-large' }
          ]
        },
        {
          id: 'arabicFont',
          title: 'Arabic Font',
          description: 'Choose Arabic text font style',
          type: 'select' as const,
          icon: Type,
          value: personalizationSettings.arabicFont,
          options: [
            { label: 'Uthmanic Hafs', value: 'uthmanic' },
            { label: 'Naskh', value: 'naskh' },
            { label: 'Kufi', value: 'kufi' },
            { label: 'Thuluth', value: 'thuluth' }
          ]
        },
        {
          id: 'layoutMode',
          title: 'Layout Mode',
          description: 'Adjust spacing and layout density',
          type: 'select' as const,
          icon: Smartphone,
          value: personalizationSettings.layoutMode,
          options: [
            { label: 'Compact', value: 'compact' },
            { label: 'Comfortable', value: 'comfortable' },
            { label: 'Spacious', value: 'spacious' }
          ]
        }
      ]
    },
    {
      title: 'Reading Experience',
      items: [
        {
          id: 'readingMode',
          title: 'Reading Mode',
          description: 'How to display Arabic and translation',
          type: 'select' as const,
          icon: Type,
          value: personalizationSettings.readingMode,
          options: [
            { label: 'Arabic Only', value: 'arabic-only' },
            { label: 'Translation Only', value: 'translation-only' },
            { label: 'Both (Stacked)', value: 'both' },
            { label: 'Side by Side', value: 'side-by-side' }
          ]
        },
        {
          id: 'showTransliteration',
          title: 'Show Transliteration',
          description: 'Display phonetic pronunciation',
          type: 'toggle' as const,
          icon: Type,
          value: personalizationSettings.showTransliteration
        },
        {
          id: 'showVerseNumbers',
          title: 'Show Verse Numbers',
          description: 'Display ayah numbers',
          type: 'toggle' as const,
          icon: Type,
          value: personalizationSettings.showVerseNumbers
        },
        {
          id: 'showJuzMarkers',
          title: 'Show Juz Markers',
          description: 'Display para/juz indicators',
          type: 'toggle' as const,
          icon: Type,
          value: personalizationSettings.showJuzMarkers
        }
      ]
    },
    {
      title: 'Audio Settings',
      items: [
        {
          id: 'defaultReciter',
          title: 'Default Reciter',
          description: 'Choose your preferred Quran reciter',
          type: 'select' as const,
          icon: Volume2,
          value: personalizationSettings.defaultReciter,
          options: TOP_RECITERS.slice(0, 10).map(reciter => ({
            label: reciter.name,
            value: reciter.id
          }))
        },
        {
          id: 'playbackSpeed',
          title: 'Playback Speed',
          description: `Current: ${personalizationSettings.playbackSpeed}x`,
          type: 'select' as const,
          icon: Volume2,
          value: personalizationSettings.playbackSpeed,
          options: [
            { label: '0.5x (Slow)', value: 0.5 },
            { label: '0.75x', value: 0.75 },
            { label: '1.0x (Normal)', value: 1.0 },
            { label: '1.25x', value: 1.25 },
            { label: '1.5x (Fast)', value: 1.5 }
          ]
        },
        {
          id: 'autoPlay',
          title: 'Auto Play',
          description: 'Automatically play next ayah',
          type: 'toggle' as const,
          icon: Volume2,
          value: personalizationSettings.autoPlay
        },
        {
          id: 'repeatMode',
          title: 'Repeat Mode',
          description: 'Audio repeat behavior',
          type: 'select' as const,
          icon: Volume2,
          value: personalizationSettings.repeatMode,
          options: [
            { label: 'None', value: 'none' },
            { label: 'Repeat Verse', value: 'verse' },
            { label: 'Repeat Surah', value: 'surah' }
          ]
        }
      ]
    },
    {
      title: 'Accessibility',
      items: [
        {
          id: 'highContrast',
          title: 'High Contrast',
          description: 'Increase text contrast for better readability',
          type: 'toggle' as const,
          icon: Eye,
          value: personalizationSettings.highContrast
        },
        {
          id: 'reducedMotion',
          title: 'Reduced Motion',
          description: 'Minimize animations and transitions',
          type: 'toggle' as const,
          icon: Eye,
          value: personalizationSettings.reducedMotion
        },
        {
          id: 'screenReader',
          title: 'Screen Reader Support',
          description: 'Optimize for accessibility tools',
          type: 'toggle' as const,
          icon: Eye,
          value: personalizationSettings.screenReader
        }
      ]
    },
    {
      title: 'Privacy & Data',
      items: [
        {
          id: 'bookmarkSync',
          title: 'Bookmark Sync',
          description: 'Sync bookmarks across devices',
          type: 'toggle' as const,
          icon: Shield,
          value: personalizationSettings.bookmarkSync
        },
        {
          id: 'analytics',
          title: 'Usage Analytics',
          description: 'Help improve the app with usage data',
          type: 'toggle' as const,
          icon: Shield,
          value: personalizationSettings.analytics
        },
        {
          id: 'crashReporting',
          title: 'Crash Reporting',
          description: 'Send crash reports to help fix issues',
          type: 'toggle' as const,
          icon: Shield,
          value: personalizationSettings.crashReporting
        }
      ]
    }
  ];

  const renderSettingItem = (item: SettingItem) => {
    const IconComponent = item.icon;

    return (
      <View key={item.id} style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <View style={styles.settingIcon}>
            <IconComponent size={20} color={Colors.primary} />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Text style={styles.settingDescription}>{item.description}</Text>
          </View>
        </View>

        <View style={styles.settingControl}>
          {item.type === 'toggle' && (
            <Switch
              value={item.value}
              onValueChange={(value) => updateSetting(item.id, value)}
              trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryOverlay }}
              thumbColor={item.value ? Colors.primary : Colors.textLight}
            />
          )}
          
          {item.type === 'select' && (
            <View style={styles.selectContainer}>
              {item.options?.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOption,
                    item.value === option.value && styles.selectOptionActive
                  ]}
                  onPress={() => updateSetting(item.id, option.value)}
                >
                  <Text style={[
                    styles.selectOptionText,
                    item.value === option.value && styles.selectOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {item.type === 'action' && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                (item as any).loading && styles.actionButtonDisabled
              ]}
              onPress={(item as any).action}
              disabled={(item as any).loading}
            >
              <Text style={[
                styles.actionButtonText,
                (item as any).loading && styles.actionButtonTextDisabled
              ]}>
                {(item as any).loading ? 'Loading...' : 'Execute'}
              </Text>
            </TouchableOpacity>
          )}
          
          {item.type === 'info' && (
            <View style={[
              styles.infoIndicator,
              item.value && styles.infoIndicatorActive
            ]}>
              <View style={[
                styles.infoIndicatorDot,
                item.value && styles.infoIndicatorDotActive
              ]} />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Colors.gradients.islamic as [string, string]} style={styles.header}>
        <View style={styles.headerContent}>
          <Settings size={28} color={Colors.textOnPrimary} />
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your Quran experience</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfoCard}>
          <LinearGradient
            colors={Colors.gradients.warm as [string, string]}
            style={styles.appInfoGradient}
          >
            <Text style={styles.appInfoTitle}>Holy Qur&apos;an & Tafseer</Text>
            <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
            <Text style={styles.appInfoDescription}>
              A comprehensive Islamic app for Quran reading, audio playback, 
              and spiritual guidance. Built with love for the Muslim community.
            </Text>
          </LinearGradient>
        </View>

        {/* Reset Settings */}
        <TouchableOpacity style={styles.resetButton} onPress={handleResetSettings}>
          <Text style={styles.resetButtonText}>Reset to Default Settings</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
&quot;And whoever relies upon Allah - then He is sufficient for him&quot;
          </Text>
          <Text style={styles.footerSubtext}>- Quran 65:3</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  settingControl: {
    marginLeft: 12,
  },
  selectContainer: {
    gap: 4,
    maxWidth: 200,
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
    marginBottom: 4,
  },
  selectOptionActive: {
    backgroundColor: Colors.primary,
  },
  selectOptionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectOptionTextActive: {
    color: Colors.textOnPrimary,
  },
  appInfoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 32,
    marginBottom: 24,
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appInfoGradient: {
    padding: 24,
    alignItems: 'center',
  },
  appInfoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 12,
  },
  appInfoDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  resetButtonText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: Colors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButtonDisabled: {
    backgroundColor: Colors.textLight,
    opacity: 0.6,
  },
  actionButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  infoIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
  },
  infoIndicatorActive: {
    backgroundColor: Colors.success,
  },
  infoIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
    margin: 2,
  },
  infoIndicatorDotActive: {
    backgroundColor: Colors.textOnPrimary,
  },
});