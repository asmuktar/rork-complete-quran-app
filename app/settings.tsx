import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Volume2, Type, Moon, Sun, Globe, Download, Bell, Shield } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { TOP_RECITERS } from '@/constants/reciters';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  type: 'toggle' | 'select' | 'slider' | 'action';
  icon: any;
  value?: any;
  options?: { label: string; value: any }[];
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    selectedReciter: 'almatroud',
    arabicFontSize: 22,
    translationFontSize: 16,
    showTransliteration: false,
    autoScroll: true,
    nightMode: false,
    selectedTranslation: 'sahih-international',
    downloadQuality: '128kbps',
    notifications: true,
    vibration: true,
    keepScreenOn: false,
    showTafsir: true,
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const settingSections = [
    {
      title: 'Audio Settings',
      items: [
        {
          id: 'selectedReciter',
          title: 'Default Reciter',
          description: 'Choose your preferred Quran reciter',
          type: 'select' as const,
          icon: Volume2,
          value: settings.selectedReciter,
          options: TOP_RECITERS.slice(0, 10).map(reciter => ({
            label: reciter.name,
            value: reciter.id
          }))
        },
        {
          id: 'downloadQuality',
          title: 'Audio Quality',
          description: 'Select audio download quality',
          type: 'select' as const,
          icon: Download,
          value: settings.downloadQuality,
          options: [
            { label: '128kbps (Recommended)', value: '128kbps' },
            { label: '192kbps (High Quality)', value: '192kbps' },
            { label: '64kbps (Data Saver)', value: '64kbps' }
          ]
        },
        {
          id: 'autoScroll',
          title: 'Auto-scroll',
          description: 'Automatically scroll to current ayah during playback',
          type: 'toggle' as const,
          icon: Type,
          value: settings.autoScroll
        }
      ]
    },
    {
      title: 'Reading Settings',
      items: [
        {
          id: 'arabicFontSize',
          title: 'Arabic Font Size',
          description: `Current size: ${settings.arabicFontSize}px`,
          type: 'select' as const,
          icon: Type,
          value: settings.arabicFontSize,
          options: [
            { label: 'Small (18px)', value: 18 },
            { label: 'Medium (22px)', value: 22 },
            { label: 'Large (26px)', value: 26 },
            { label: 'Extra Large (30px)', value: 30 }
          ]
        },
        {
          id: 'translationFontSize',
          title: 'Translation Font Size',
          description: `Current size: ${settings.translationFontSize}px`,
          type: 'select' as const,
          icon: Type,
          value: settings.translationFontSize,
          options: [
            { label: 'Small (14px)', value: 14 },
            { label: 'Medium (16px)', value: 16 },
            { label: 'Large (18px)', value: 18 },
            { label: 'Extra Large (20px)', value: 20 }
          ]
        },
        {
          id: 'selectedTranslation',
          title: 'Translation',
          description: 'Choose your preferred translation',
          type: 'select' as const,
          icon: Globe,
          value: settings.selectedTranslation,
          options: [
            { label: 'Sahih International', value: 'sahih-international' },
            { label: 'Pickthall', value: 'pickthall' },
            { label: 'Yusuf Ali', value: 'yusuf-ali' },
            { label: 'Dr. Mustafa Khattab', value: 'clear-quran' },
            { label: 'Abdul Haleem', value: 'abdul-haleem' }
          ]
        },
        {
          id: 'showTransliteration',
          title: 'Show Transliteration',
          description: 'Display phonetic pronunciation of Arabic text',
          type: 'toggle' as const,
          icon: Type,
          value: settings.showTransliteration
        },
        {
          id: 'showTafsir',
          title: 'Show Tafsir',
          description: 'Display commentary and explanation',
          type: 'toggle' as const,
          icon: Type,
          value: settings.showTafsir
        }
      ]
    },
    {
      title: 'App Settings',
      items: [
        {
          id: 'nightMode',
          title: 'Night Mode',
          description: 'Dark theme for comfortable reading',
          type: 'toggle' as const,
          icon: Moon,
          value: settings.nightMode
        },
        {
          id: 'notifications',
          title: 'Notifications',
          description: 'Receive prayer time and daily verse notifications',
          type: 'toggle' as const,
          icon: Bell,
          value: settings.notifications
        },
        {
          id: 'vibration',
          title: 'Vibration',
          description: 'Haptic feedback for interactions',
          type: 'toggle' as const,
          icon: Shield,
          value: settings.vibration
        },
        {
          id: 'keepScreenOn',
          title: 'Keep Screen On',
          description: 'Prevent screen from turning off while reading',
          type: 'toggle' as const,
          icon: Sun,
          value: settings.keepScreenOn
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
        <TouchableOpacity style={styles.resetButton}>
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
});