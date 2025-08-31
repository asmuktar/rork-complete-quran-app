import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Compass, Calendar, Settings, BookOpen, Users, Heart, Star, Info, MoreHorizontal } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

interface MoreItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  route: string;
  gradient: [string, string];
}

const moreItems: MoreItem[] = [
  {
    id: 'qibla',
    title: 'Qibla Direction',
    description: 'Find the direction to Mecca',
    icon: Compass,
    route: '/qibla',
    gradient: Colors.gradients.islamic as [string, string]
  },
  {
    id: 'calendar',
    title: 'Islamic Calendar',
    description: 'Hijri dates and Islamic events',
    icon: Calendar,
    route: '/calendar',
    gradient: Colors.gradients.ocean as [string, string]
  },
  {
    id: 'reciters',
    title: 'Top Reciters',
    description: 'World\'s most beloved Quranic voices',
    icon: Users,
    route: '/reciters',
    gradient: Colors.gradients.accent as [string, string]
  },
  {
    id: 'bookmarks',
    title: 'Bookmarks',
    description: 'Your saved ayahs and favorites',
    icon: Heart,
    route: '/bookmarks',
    gradient: Colors.gradients.sunset as [string, string]
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'App preferences and audio settings',
    icon: Settings,
    route: '/settings',
    gradient: Colors.gradients.warm as [string, string]
  }
];

export default function MoreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Colors.gradients.islamic as [string, string]} style={styles.header}>
        <View style={styles.headerContent}>
          <MoreHorizontal size={28} color={Colors.textOnPrimary} />
          <Text style={styles.title}>More Features</Text>
          <Text style={styles.subtitle}>Islamic Tools & Settings</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={styles.appInfoCard}>
          <LinearGradient
            colors={Colors.gradients.warm as [string, string]}
            style={styles.appInfoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.appName}>Holy Qur&apos;an & Tafseer</Text>
            <Text style={styles.appDescription}>
              Your complete Islamic companion for Quran reading, Hadith study, prayer times, and spiritual guidance.
            </Text>
          </LinearGradient>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Islamic Tools</Text>
          <View style={styles.featuresGrid}>
            {moreItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.featureCard}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={item.gradient}
                    style={styles.featureGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.featureIcon}>
                      <IconComponent size={24} color={Colors.textOnPrimary} />
                    </View>
                    <Text style={styles.featureTitle}>{item.title}</Text>
                    <Text style={styles.featureDescription}>{item.description}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Quran Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={Colors.gradients.primary as [string, string]}
                style={styles.statGradient}
              >
                <Text style={styles.statNumber}>114</Text>
                <Text style={styles.statLabel}>Surahs</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={Colors.gradients.secondary as [string, string]}
                style={styles.statGradient}
              >
                <Text style={styles.statNumber}>6,236</Text>
                <Text style={styles.statLabel}>Ayahs</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={Colors.gradients.accent as [string, string]}
                style={styles.statGradient}
              >
                <Text style={styles.statNumber}>30</Text>
                <Text style={styles.statLabel}>Juz/Para</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={Colors.gradients.sunset as [string, string]}
                style={styles.statGradient}
              >
                <Text style={styles.statNumber}>20</Text>
                <Text style={styles.statLabel}>Reciters</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Islamic Quote */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteArabic}>
            وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا
          </Text>
          <Text style={styles.quoteTranslation}>
            &quot;And whoever fears Allah - He will make for him a way out&quot;
          </Text>
          <Text style={styles.quoteReference}>- Quran 65:2</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            May Allah guide us all on the straight path
          </Text>
          <Text style={styles.footerSubtext}>
            Built with love for the Muslim community
          </Text>
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
  appInfoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 20,
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
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
  },
  featureGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 14,
  },
  statsContainer: {
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
  },
  quoteCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 6,
    borderLeftColor: Colors.islamicGold,
  },
  quoteArabic: {
    fontSize: 20,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
    fontWeight: '600',
  },
  quoteTranslation: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 22,
  },
  quoteReference: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
});