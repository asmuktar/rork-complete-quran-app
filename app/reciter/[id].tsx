import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Volume2, Play, Pause, Heart, Share2, Download } from 'lucide-react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { TOP_RECITERS } from '@/constants/reciters';
import { useAudioPlayer } from '@/hooks/use-audio-player';

export default function ReciterDetailScreen() {
  const { id } = useLocalSearchParams();
  const reciterId = id as string;
  const reciter = TOP_RECITERS.find(r => r.id === reciterId);
  const audioPlayer = useAudioPlayer();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!reciter) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Reciter Not Found' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Reciter not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handlePlaySample = async () => {
    try {
      if (isPlaying) {
        await audioPlayer.stopPlayback();
        setIsPlaying(false);
      } else {
        // Play Al-Fatihah verse 1 as sample
        await audioPlayer.playAyah(1, 1);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing sample:', error);
      Alert.alert('Error', 'Failed to play sample audio');
    }
  };

  const handleShare = () => {
    Alert.alert('Share', `Share ${reciter.name} with others`);
  };

  const handleDownload = () => {
    Alert.alert('Download', `Download recitations by ${reciter.name}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: reciter.name,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textOnPrimary,
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      
      {/* Header */}
      <LinearGradient
        colors={Colors.gradients.islamic as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.reciterRank}>
            <Star size={24} color={Colors.textOnPrimary} fill={Colors.textOnPrimary} />
          </View>
          <Text style={styles.reciterName}>{reciter.name}</Text>
          <Text style={styles.reciterArabicName}>{reciter.arabicName}</Text>
          <Text style={styles.reciterCountry}>{reciter.country}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reciter.popularity}%</Text>
              <Text style={styles.statLabel}>Popularity</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reciter.audioQuality}</Text>
              <Text style={styles.statLabel}>Quality</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={handlePlaySample}>
          <LinearGradient
            colors={Colors.gradients.primary as [string, string]}
            style={styles.buttonGradient}
          >
            {isPlaying ? (
              <Pause size={20} color={Colors.textOnPrimary} />
            ) : (
              <Play size={20} color={Colors.textOnPrimary} />
            )}
            <Text style={styles.primaryButtonText}>
              {isPlaying ? 'Stop Sample' : 'Play Sample'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.secondaryButton, isLiked && styles.likedButton]} 
          onPress={() => setIsLiked(!isLiked)}
        >
          <Heart 
            size={20} 
            color={isLiked ? Colors.error : Colors.primary} 
            fill={isLiked ? Colors.error : 'transparent'}
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
          <Share2 size={20} color={Colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleDownload}>
          <Download size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{reciter.description}</Text>
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtiesContainer}>
            {reciter.specialties.map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Popular Recitations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Recitations</Text>
          {[
            { name: 'Al-Fatihah', arabic: 'الفاتحة', duration: '1:23' },
            { name: 'Al-Baqarah', arabic: 'البقرة', duration: '2:45:12' },
            { name: 'Ali Imran', arabic: 'آل عمران', duration: '1:52:34' },
            { name: 'An-Nisa', arabic: 'النساء', duration: '1:38:45' },
            { name: 'Al-Maidah', arabic: 'المائدة', duration: '1:24:56' },
          ].map((surah, index) => (
            <TouchableOpacity key={index} style={styles.recitationItem}>
              <View style={styles.recitationInfo}>
                <Text style={styles.recitationName}>{surah.name}</Text>
                <Text style={styles.recitationArabic}>{surah.arabic}</Text>
              </View>
              <View style={styles.recitationMeta}>
                <Text style={styles.recitationDuration}>{surah.duration}</Text>
                <TouchableOpacity style={styles.playButton}>
                  <Volume2 size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Biography */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biography</Text>
          <Text style={styles.biography}>
            {reciter.name} is one of the most renowned Quranic reciters in the world. 
            Born in {reciter.country}, he has dedicated his life to the beautiful recitation 
            of the Holy Quran. His melodious voice and precise pronunciation have touched 
            the hearts of millions of Muslims worldwide.
            {"\n\n"}
            He is known for his {reciter.specialties.join(', ')} and has been recognized 
            for his exceptional {reciter.audioQuality.toLowerCase()} audio quality recordings. 
            His recitations are widely used in mosques, Islamic centers, and by individual 
            Muslims for their daily prayers and spiritual reflection.
          </Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: 'center',
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  reciterRank: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  reciterName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  reciterArabicName: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  reciterCountry: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likedButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
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
  specialtyText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  recitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  recitationInfo: {
    flex: 1,
  },
  recitationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  recitationArabic: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  recitationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recitationDuration: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biography: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
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