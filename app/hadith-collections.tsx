import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Search, Shield, ExternalLink } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { router } from 'expo-router';

interface HadithCollection {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  totalHadiths: number;
  compiler: string;
  status: 'authentic' | 'good' | 'weak';
}

const HADITH_COLLECTIONS: HadithCollection[] = [
  {
    id: 'bukhari',
    name: 'Sahih al-Bukhari',
    arabicName: 'صحيح البخاري',
    description: 'The most authentic collection of hadith',
    totalHadiths: 7563,
    compiler: 'Imam al-Bukhari',
    status: 'authentic'
  },
  {
    id: 'muslim',
    name: 'Sahih Muslim',
    arabicName: 'صحيح مسلم',
    description: 'Second most authentic hadith collection',
    totalHadiths: 7190,
    compiler: 'Imam Muslim',
    status: 'authentic'
  },
  {
    id: 'abu-dawud',
    name: 'Sunan Abu Dawud',
    arabicName: 'سنن أبي داود',
    description: 'Collection focusing on legal matters',
    totalHadiths: 5274,
    compiler: 'Abu Dawud',
    status: 'good'
  },
  {
    id: 'tirmidhi',
    name: 'Jami at-Tirmidhi',
    arabicName: 'جامع الترمذي',
    description: 'Collection with detailed commentary',
    totalHadiths: 3956,
    compiler: 'At-Tirmidhi',
    status: 'good'
  },
  {
    id: 'nasai',
    name: 'Sunan an-Nasa\'i',
    arabicName: 'سنن النسائي',
    description: 'Collection known for strict criteria',
    totalHadiths: 5761,
    compiler: 'An-Nasa\'i',
    status: 'good'
  },
  {
    id: 'ibn-majah',
    name: 'Sunan Ibn Majah',
    arabicName: 'سنن ابن ماجه',
    description: 'Collection completing the six major books',
    totalHadiths: 4341,
    compiler: 'Ibn Majah',
    status: 'good'
  }
];

const SAMPLE_HADITHS = [
  {
    id: '1',
    collection: 'bukhari',
    book: 'Book of Revelation',
    number: 1,
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    translation: 'Actions are but by intention and every man shall have only that which he intended.',
    narrator: 'Umar ibn al-Khattab',
    grade: 'Sahih'
  },
  {
    id: '2',
    collection: 'muslim',
    book: 'Book of Faith',
    number: 1,
    arabic: 'الإِسْلاَمُ أَنْ تَشْهَدَ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ',
    translation: 'Islam is to testify that there is no god but Allah and Muhammad is the Messenger of Allah.',
    narrator: 'Abdullah ibn Umar',
    grade: 'Sahih'
  }
];

export default function HadithCollectionsScreen() {
  const handleCollectionPress = (collectionId: string) => {
    router.push(`/hadith-collection/${collectionId}`);
  };

  const handleVerifyHadith = () => {
    router.push('/verify-hadith');
  };

  const handleAdvancedSearch = () => {
    router.push('/advanced-hadith-search');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authentic': return Colors.success;
      case 'good': return Colors.primary;
      case 'weak': return Colors.warning;
      default: return Colors.textLight;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradients.islamic as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <BookOpen size={28} color={Colors.textOnPrimary} />
          <Text style={styles.title}>Hadith Collections</Text>
          <Text style={styles.subtitle}>Authentic Prophetic Traditions</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={handleVerifyHadith}>
            <LinearGradient
              colors={Colors.gradients.primary as [string, string]}
              style={styles.actionGradient}
            >
              <Shield size={24} color={Colors.textOnPrimary} />
              <Text style={styles.actionTitle}>Verify Hadith</Text>
              <Text style={styles.actionSubtitle}>Check authenticity</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleAdvancedSearch}>
            <LinearGradient
              colors={Colors.gradients.accent as [string, string]}
              style={styles.actionGradient}
            >
              <Search size={24} color={Colors.textOnPrimary} />
              <Text style={styles.actionTitle}>Advanced Search</Text>
              <Text style={styles.actionSubtitle}>Search by topic</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Collections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Major Collections (Kutub as-Sittah)</Text>
          {HADITH_COLLECTIONS.map((collection) => (
            <TouchableOpacity
              key={collection.id}
              style={styles.collectionCard}
              onPress={() => handleCollectionPress(collection.id)}
            >
              <View style={styles.collectionHeader}>
                <View style={styles.collectionInfo}>
                  <Text style={styles.collectionName}>{collection.name}</Text>
                  <Text style={styles.collectionArabicName}>{collection.arabicName}</Text>
                  <Text style={styles.collectionCompiler}>by {collection.compiler}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(collection.status) }]}>
                  <Text style={styles.statusText}>{collection.status.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.collectionDescription}>{collection.description}</Text>
              
              <View style={styles.collectionMeta}>
                <Text style={styles.hadithCount}>
                  {collection.totalHadiths.toLocaleString()} hadiths
                </Text>
                <ExternalLink size={16} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sample Hadiths */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Hadiths</Text>
          {SAMPLE_HADITHS.map((hadith) => (
            <View key={hadith.id} style={styles.hadithCard}>
              <View style={styles.hadithHeader}>
                <Text style={styles.hadithSource}>
                  {HADITH_COLLECTIONS.find(c => c.id === hadith.collection)?.name} #{hadith.number}
                </Text>
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeText}>{hadith.grade}</Text>
                </View>
              </View>
              
              <Text style={styles.hadithArabic}>{hadith.arabic}</Text>
              <Text style={styles.hadithTranslation}>{hadith.translation}</Text>
              
              <View style={styles.hadithMeta}>
                <Text style={styles.narratorText}>Narrated by: {hadith.narrator}</Text>
                <Text style={styles.bookText}>{hadith.book}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Hadith Collections</Text>
          <Text style={styles.infoText}>
            The six major hadith collections (Kutub as-Sittah) are the most important sources of 
            Islamic jurisprudence after the Quran. They contain authentic sayings, actions, and 
            approvals of Prophet Muhammad (peace be upon him).
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            "Whoever lies about me intentionally, let him take his place in Hell"
          </Text>
          <Text style={styles.footerSubtext}>- Prophet Muhammad (PBUH)</Text>
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
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  collectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.islamicGold,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  collectionArabicName: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  collectionCompiler: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: Colors.textOnPrimary,
    fontWeight: 'bold',
  },
  collectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  collectionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
  },
  hadithCount: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  hadithCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  hadithHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hadithSource: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  gradeBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  gradeText: {
    fontSize: 10,
    color: Colors.textOnPrimary,
    fontWeight: 'bold',
  },
  hadithArabic: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'right',
    lineHeight: 28,
    marginBottom: 8,
    fontWeight: '500',
  },
  hadithTranslation: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
  },
  hadithMeta: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
  },
  narratorText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
    marginBottom: 2,
  },
  bookText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
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