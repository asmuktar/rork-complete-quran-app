import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Play, TrendingUp } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useHafiz } from '@/contexts/hafiz-context';
import HafizDashboard from '@/components/HafizDashboard';
import MemoryTestModal from '@/components/MemoryTestModal';
import { router } from 'expo-router';

export default function HafizTab() {
  const [showTestModal, setShowTestModal] = useState(false);
  const [testMode, setTestMode] = useState<'recitation' | 'meaning' | 'sequence'>('recitation');
  
  const {
    startSession,
    endSession,
    isSessionActive,
    startTest,
    currentTest,
    submitTestAnswer,
    endTest,
    progress,
    dueForReview,
    getStudyStreak,
    getTodayStats
  } = useHafiz();

  const handleStartTest = (mode: 'recitation' | 'meaning' | 'sequence') => {
    setTestMode(mode);
    setShowTestModal(true);
    startTest(mode);
  };

  const handleStartSession = (type: 'memorization' | 'review' | 'test') => {
    if (isSessionActive) {
      Alert.alert(
        'Session Active',
        'You already have an active session. End it first?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'End Session', 
            style: 'destructive',
            onPress: () => {
              endSession();
              startSession(type);
            }
          }
        ]
      );
    } else {
      startSession(type);
      Alert.alert(
        'Session Started',
        `Your ${type} session has begun. Good luck with your studies!`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleViewProgress = () => {
    Alert.alert(
      'Progress Overview',
      `Total Ayahs Tracked: ${progress.length}\nDue for Review: ${dueForReview.length}\nStudy Streak: ${getStudyStreak()} days`,
      [{ text: 'OK' }]
    );
  };

  const handleViewGoals = () => {
    Alert.alert(
      'Goals Management',
      'Goals management feature coming soon!',
      [{ text: 'OK' }]
    );
  };

  const handleCloseTest = () => {
    setShowTestModal(false);
    endTest();
  };

  const handleSubmitAnswer = async (answer: string) => {
    await submitTestAnswer(answer);
    setTimeout(() => {
      setShowTestModal(false);
      endTest();
    }, 2000);
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
          <Brain size={32} color={Colors.textOnPrimary} />
          <Text style={styles.title}>Hafiz Dashboard</Text>
          <Text style={styles.subtitle}>Memory & Progress Tracking</Text>
        </View>
      </LinearGradient>

      {/* Dashboard Content */}
      <HafizDashboard
        onStartTest={handleStartTest}
        onStartSession={handleStartSession}
        onViewProgress={handleViewProgress}
        onViewGoals={handleViewGoals}
      />

      {/* Memory Test Modal */}
      <MemoryTestModal
        visible={showTestModal}
        onClose={handleCloseTest}
      />

      {/* Quick Access Buttons */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => router.push('/hafiz-dashboard')}
        >
          <TrendingUp size={20} color={Colors.primary} />
          <Text style={styles.quickActionText}>Full Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => handleStartTest('recitation')}
        >
          <Play size={20} color={Colors.success} />
          <Text style={styles.quickActionText}>Quick Test</Text>
        </TouchableOpacity>
      </View>
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
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
});