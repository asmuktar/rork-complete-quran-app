import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Book, BookOpen, Search, Clock, Compass, Settings, Star, Users, Sun, Moon, Smartphone } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const totalAyahs = 6236; // Total ayahs in the Quran
  const totalSurahs = 114; // Total surahs in the Quran
  const totalReciters = 20; // Top reciters available
  
  const [keepScreenOn, setKeepScreenOn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const toggleKeepScreenOn = async () => {
    try {
      if (keepScreenOn) {
        deactivateKeepAwake('HomeScreen');
        setKeepScreenOn(false);
        Alert.alert('Screen Timeout', 'Screen will now turn off normally');
      } else {
        await activateKeepAwakeAsync();
        setKeepScreenOn(true);
        Alert.alert('Keep Screen On', 'Screen will stay on while reading');
      }
    } catch (error) {
      console.error('Error toggling keep screen on:', error);
      Alert.alert('Error', 'Failed to toggle screen setting');
    }
  };
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    Alert.alert(
      'Dark Mode',
      isDarkMode ? 'Switched to Light Mode' : 'Switched to Dark Mode'
    );
  };

  const quickStats = [
    {
      title: '114',
      subtitle: 'Surahs',
      description: 'Complete Quran',
      icon: Book,
      route: '/surahs',
      gradient: Colors.gradients.islamic,
      isClickable: true,
    },
    {
      title: '6,236',
      subtitle: 'Ayahs',
      description: 'Total verses',
      icon: BookOpen,
      route: '',
      gradient: Colors.gradients.secondary,
      isClickable: false,
    },
    {
      title: '20',
      subtitle: 'Reciters',
      description: 'Top voices',
      icon: Users,
      route: '/reciters',
      gradient: Colors.gradients.accent,
      isClickable: true,
    },
  ];

  const mainFeatures = [
    {
      title: 'Read Quran',
      description: 'Complete Quran with translations',
      icon: Book,
      route: '/surahs',
      gradient: Colors.gradients.islamic,
      size: 'large' as const,
    },
    {
      title: 'Voice Search',
      description: 'Search by reciting verses',
      icon: Search,
      route: '/search',
      gradient: Colors.gradients.accent,
      size: 'medium' as const,
    },
    {
      title: 'Hadith',
      description: 'Authentic collections',
      icon: BookOpen,
      route: '/hadith',
      gradient: Colors.gradients.sunset,
      size: 'medium' as const,
    },
  ];

  const secondaryFeatures = [
    {
      title: 'Prayer Times',
      description: 'Location-based timings',
      icon: Clock,
      route: '/prayer-times',
      gradient: Colors.gradients.ocean,
    },

  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Islamic Design */}
      <LinearGradient 
        colors={['#D4AF37', '#2E7D32', '#D4AF37']} 
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.appName}>Holy Qur'an</Text>
          <Text style={styles.tagline}>& Tafseer</Text>
        </View>
        <View style={styles.mosquePattern}>
          <View style={styles.minaret} />
          <View style={styles.dome} />
          <View style={styles.minaret} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats - Redesigned */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.statCard, !stat.isClickable && styles.statCardDisabled]}
                  onPress={() => stat.isClickable && router.push(stat.route as any)}
                  activeOpacity={stat.isClickable ? 0.8 : 1}
                  disabled={!stat.isClickable}
                >
                  <LinearGradient
                    colors={stat.gradient as [string, string]}
                    style={styles.statGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.statIconContainer}>
                      <IconComponent size={20} color={Colors.textOnPrimary} />
                    </View>
                    <Text style={styles.statNumber}>{stat.title}</Text>
                    <Text style={styles.statLabel}>{stat.subtitle}</Text>
                    <Text style={styles.statDescription}>{stat.description}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Main Features */}
        <View style={styles.mainFeaturesSection}>
          <Text style={styles.sectionTitle}>Main Features</Text>
          <View style={styles.mainFeaturesGrid}>
            {mainFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.mainFeatureCard,
                    feature.size === 'large' && styles.largeFeatureCard,
                    feature.size === 'medium' && styles.mediumFeatureCard,
                  ]}
                  onPress={() => router.push(feature.route as any)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={feature.gradient as [string, string]}
                    style={styles.mainFeatureGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.mainFeatureIcon}>
                      <IconComponent size={32} color={Colors.textOnPrimary} />
                    </View>
                    <Text style={styles.mainFeatureTitle}>{feature.title}</Text>
                    <Text style={styles.mainFeatureDescription}>{feature.description}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Secondary Features */}
        <View style={styles.secondaryFeaturesSection}>
          <Text style={styles.sectionTitle}>Islamic Tools</Text>
          <View style={styles.secondaryFeaturesGrid}>
            {secondaryFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.secondaryFeatureCard}
                  onPress={() => router.push(feature.route as any)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={feature.gradient as [string, string]}
                    style={styles.secondaryFeatureGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.secondaryFeatureIcon}>
                      <IconComponent size={24} color={Colors.textOnPrimary} />
                    </View>
                    <Text style={styles.secondaryFeatureTitle}>{feature.title}</Text>
                    <Text style={styles.secondaryFeatureDescription}>{feature.description}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        {/* Quick Settings */}
        <View style={styles.quickSettingsSection}>
          <Text style={styles.sectionTitle}>Quick Settings</Text>
          <View style={styles.quickSettingsGrid}>
            <TouchableOpacity
              style={styles.quickSettingCard}
              onPress={toggleKeepScreenOn}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={keepScreenOn ? ['#4CAF50', '#2E7D32'] : ['#757575', '#424242']}
                style={styles.quickSettingGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.quickSettingIcon}>
                  <Smartphone size={20} color={Colors.textOnPrimary} />
                </View>
                <Text style={styles.quickSettingTitle}>Keep Screen On</Text>
                <Text style={styles.quickSettingStatus}>
                  {keepScreenOn ? 'Active' : 'Inactive'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickSettingCard}
              onPress={toggleDarkMode}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isDarkMode ? ['#1A1A1A', '#000000'] : ['#FFC107', '#FF8F00']}
                style={styles.quickSettingGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.quickSettingIcon}>
                  {isDarkMode ? (
                    <Moon size={20} color={Colors.textOnPrimary} />
                  ) : (
                    <Sun size={20} color={Colors.textOnPrimary} />
                  )}
                </View>
                <Text style={styles.quickSettingTitle}>Dark Mode</Text>
                <Text style={styles.quickSettingStatus}>
                  {isDarkMode ? 'On' : 'Off'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Islamic Quote */}
        <View style={styles.footer}>
          <View style={styles.quoteContainer}>
            <Text style={styles.arabicQuote}>"وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ"</Text>
            <Text style={styles.translationQuote}>"And We have made the Quran easy to remember"</Text>
            <Text style={styles.quoteReference}>- Quran 54:17</Text>
          </View>
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
    paddingVertical: 40,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
  },
  mosquePattern: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    opacity: 0.3,
  },
  minaret: {
    width: 8,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dome: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    marginHorizontal: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    marginTop: 8,
    textAlign: 'left',
  },
  // Quick Stats Section
  statsSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  statCardDisabled: {
    opacity: 0.9,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  // Main Features Section
  mainFeaturesSection: {
    marginBottom: 20,
  },
  mainFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mainFeatureCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  largeFeatureCard: {
    width: '100%',
    minHeight: 120,
  },
  mediumFeatureCard: {
    width: (width - 44) / 2,
    minHeight: 140,
  },
  mainFeatureGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  mainFeatureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainFeatureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  mainFeatureDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  // Secondary Features Section
  secondaryFeaturesSection: {
    marginBottom: 20,
  },
  secondaryFeaturesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryFeatureCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondaryFeatureGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  secondaryFeatureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryFeatureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  secondaryFeatureDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  // Quick Settings Section
  quickSettingsSection: {
    marginBottom: 20,
  },
  quickSettingsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickSettingCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickSettingGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  quickSettingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickSettingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  quickSettingStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: 20,
  },
  quoteContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.islamicGold,
  },
  arabicQuote: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  translationQuote: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 6,
  },
  quoteReference: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
});