import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Filter, BookOpen } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

export default function AdvancedHadithSearchScreen() {
  const handleSearch = () => {
    Alert.alert('Coming Soon', 'Advanced hadith search feature will be available soon.');
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
          <Search size={28} color={Colors.textOnPrimary} />
          <Text style={styles.title}>Advanced Search</Text>
          <Text style={styles.subtitle}>Search Hadith by Topic</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.comingSoonCard}>
          <BookOpen size={64} color={Colors.primary} />
          <Text style={styles.comingSoonTitle}>Feature Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            We are developing an advanced search system that will allow you to search 
            hadiths by topic, narrator, collection, and authenticity grade.
          </Text>
          
          <TouchableOpacity style={styles.notifyButton} onPress={handleSearch}>
            <LinearGradient
              colors={Colors.gradients.primary as [string, string]}
              style={styles.notifyGradient}
            >
              <Text style={styles.notifyButtonText}>Get Notified</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  comingSoonCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  comingSoonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  notifyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notifyGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  notifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
});