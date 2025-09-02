import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, BookOpen, ExternalLink, Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { HADITH_COLLECTIONS, FEATURED_HADITHS } from '@/constants/hadith-data';
import type { HadithCollection } from '@/constants/hadith-data';

export default function HadithScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'sahih' | 'mixed'>('all');

  const filteredCollections = HADITH_COLLECTIONS.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         collection.compiler.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         collection.arabicName.includes(searchQuery);
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'sahih' && collection.authenticity === 'Sahih') ||
                         (selectedFilter === 'mixed' && collection.authenticity === 'Mixed');
    
    return matchesSearch && matchesFilter;
  });

  const getAuthenticityColor = (authenticity: string) => {
    switch (authenticity) {
      case 'Sahih': return Colors.success;
      case 'Hasan': return Colors.warning;
      case 'Mixed': return Colors.info;
      default: return Colors.textLight;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Colors.gradients.sunset as [string, string]} style={styles.header}>
        <Text style={styles.title}>Hadith Collections</Text>
        <Text style={styles.subtitle}>Authentic sayings of Prophet Muhammad ﷺ</Text>
      </LinearGradient>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hadith collections..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filterContainer}>
          {(['all', 'sahih', 'mixed'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[styles.filterButton, selectedFilter === filterType && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(filterType)}
            >
              <Text style={[styles.filterText, selectedFilter === filterType && styles.filterTextActive]}>
                {filterType === 'all' ? 'All' : filterType === 'sahih' ? 'Sahih' : 'Mixed'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/verify-hadith')}
          >
            <Shield size={24} color={Colors.primary} />
            <Text style={styles.quickActionTitle}>Verify Hadith</Text>
            <Text style={styles.quickActionSubtitle}>Check authenticity & chain</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/advanced-hadith-search')}
          >
            <Search size={24} color={Colors.secondary} />
            <Text style={styles.quickActionTitle}>Advanced Search</Text>
            <Text style={styles.quickActionSubtitle}>Search by topic or narrator</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Hadiths */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Hadith of the Day</Text>
          {FEATURED_HADITHS.slice(0, 1).map((hadith) => (
            <View key={hadith.id} style={styles.hadithCard}>
              <Text style={styles.hadithArabic}>{hadith.arabicText}</Text>
              <Text style={styles.hadithText}>{hadith.text}</Text>
              <View style={styles.hadithMeta}>
                <Text style={styles.hadithCollection}>{hadith.collection} #{hadith.number}</Text>
                <Text style={styles.hadithNarrator}>Narrated by {hadith.narrator}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Collections */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Browse Collections</Text>
          {filteredCollections.map((collection) => (
            <TouchableOpacity
              key={collection.id}
              style={styles.collectionCard}
              onPress={() => router.push(`/hadith-collection/${collection.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.collectionIcon}>
                <BookOpen size={24} color={Colors.textOnPrimary} />
              </View>
              
              <View style={styles.collectionContent}>
                <View style={styles.collectionHeader}>
                  <Text style={styles.collectionName}>{collection.name}</Text>
                  <View style={[styles.authenticityBadge, { backgroundColor: getAuthenticityColor(collection.authenticity) }]}>
                    <Text style={styles.authenticityText}>{collection.authenticity}</Text>
                  </View>
                </View>
                
                <Text style={styles.collectionArabic}>{collection.arabicName}</Text>
                <Text style={styles.collectionCompiler}>by {collection.compiler}</Text>
                <Text style={styles.collectionDescription}>{collection.description}</Text>
                
                <View style={styles.collectionMeta}>
                  <Text style={styles.collectionCount}>{collection.totalHadiths.toLocaleString()} Hadiths</Text>
                <View style={styles.availabilityIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: collection.available ? Colors.success : Colors.warning }]} />
                  <Text style={styles.statusText}>{collection.available ? 'Available' : 'Coming Soon'}</Text>
                </View>
                </View>
              </View>
              
              <ExternalLink size={20} color={Colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>&quot;The example of guidance and knowledge with which Allah has sent me is like abundant rain falling on the earth.&quot;</Text>
          <Text style={styles.footerSubtext}>- Sahih al-Bukhari 79</Text>
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceVariant,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.textOnPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  hadithCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  hadithArabic: {
    fontSize: 18,
    color: Colors.primary,
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 28,
  },
  hadithText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  hadithMeta: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
    paddingTop: 12,
  },
  hadithCollection: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  hadithNarrator: {
    fontSize: 12,
    color: Colors.textLight,
  },
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  collectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  collectionContent: {
    flex: 1,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  authenticityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  authenticityText: {
    fontSize: 10,
    color: Colors.textOnPrimary,
    fontWeight: 'bold',
  },
  collectionArabic: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 2,
  },
  collectionCompiler: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  collectionDescription: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
  },
  collectionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectionCount: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
    flex: 1,
  },
  availabilityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '500',
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
  },
  footerSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
});