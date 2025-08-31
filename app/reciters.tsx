import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, User, MapPin, Star, Volume2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { TOP_RECITERS, getTopReciters } from '@/constants/reciters';

export default function RecitersScreen() {
  const reciters = getTopReciters();

  const handleReciterPress = (reciterId: string) => {
    router.push(`/reciter/${reciterId}` as any);
  };

  const renderReciter = (reciter: typeof TOP_RECITERS[0], index: number) => {
    const isTopThree = index < 3;
    
    return (
      <TouchableOpacity
        key={reciter.id}
        style={[styles.reciterCard, isTopThree && styles.topReciterCard]}
        onPress={() => handleReciterPress(reciter.id)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isTopThree ? Colors.gradients.islamic as [string, string] : [Colors.surface, Colors.surface]}
          style={styles.reciterGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.reciterHeader}>
            <View style={[styles.reciterRank, isTopThree && styles.topReciterRank]}>
              {isTopThree ? (
                <Star size={20} color={Colors.textOnPrimary} fill={Colors.textOnPrimary} />
              ) : (
                <Text style={styles.reciterRankText}>#{index + 1}</Text>
              )}
            </View>
            
            <View style={styles.reciterInfo}>
              <View style={styles.reciterTitleRow}>
                <Text style={[styles.reciterName, isTopThree && styles.topReciterName]}>
                  {reciter.name}
                </Text>
                <View style={styles.popularityBadge}>
                  <Text style={styles.popularityText}>{reciter.popularity}%</Text>
                </View>
              </View>
              <Text style={[styles.reciterArabicName, isTopThree && styles.topReciterArabicName]}>
                {reciter.arabicName}
              </Text>
              
              <View style={styles.reciterMeta}>
                <View style={styles.metaItem}>
                  <MapPin size={14} color={isTopThree ? 'rgba(255, 255, 255, 0.8)' : Colors.textLight} />
                  <Text style={[styles.metaText, isTopThree && styles.topMetaText]}>
                    {reciter.country}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <User size={14} color={isTopThree ? 'rgba(255, 255, 255, 0.8)' : Colors.textLight} />
                  <Text style={[styles.metaText, isTopThree && styles.topMetaText]}>
                    {reciter.audioQuality}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.reciterDescription, isTopThree && styles.topReciterDescription]}>
                {reciter.description}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.playButton, isTopThree && styles.topPlayButton]}
              onPress={(e) => {
                e.stopPropagation();
                console.log('Play sample from', reciter.name);
              }}
            >
              <Volume2 size={20} color={isTopThree ? Colors.textOnPrimary : Colors.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Specialties */}
          <View style={styles.specialtiesContainer}>
            {reciter.specialties.slice(0, 3).map((specialty, idx) => (
              <View key={idx} style={[styles.specialtyTag, isTopThree && styles.topSpecialtyTag]}>
                <Text style={[styles.specialtyText, isTopThree && styles.topSpecialtyText]}>
                  {specialty}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradients.islamic as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Users size={28} color={Colors.textOnPrimary} />
          <Text style={styles.title}>Top Reciters</Text>
          <Text style={styles.subtitle}>World&apos;s Most Beloved Quranic Voices</Text>
        </View>
      </LinearGradient>

      {/* Reciters List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.recitersList}>
          <Text style={styles.sectionTitle}>Most Popular Reciters</Text>
          {reciters.map(renderReciter)}
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            &quot;And recite the Quran with measured recitation&quot;
          </Text>
          <Text style={styles.footerSubtext}>- Quran 73:4</Text>
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
  },
  recitersList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  reciterCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topReciterCard: {
    elevation: 8,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  reciterGradient: {
    padding: 20,
  },
  reciterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  reciterRank: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  topReciterRank: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  reciterRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  reciterInfo: {
    flex: 1,
  },
  reciterTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reciterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  topReciterName: {
    color: Colors.textOnPrimary,
  },
  popularityBadge: {
    backgroundColor: Colors.secondaryOverlay,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  popularityText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
  },
  reciterArabicName: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  topReciterArabicName: {
    color: 'rgba(255, 255, 255, 0.95)',
  },
  reciterMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  topMetaText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  reciterDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  topReciterDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  topPlayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: Colors.primaryOverlay,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  topSpecialtyTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  specialtyText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  topSpecialtyText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
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