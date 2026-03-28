import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Brain, 
  Target, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  Award,
  Calendar,
  Zap,
  Pause,
  RotateCcw,
  Settings,
  ChevronRight
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useHafiz } from '@/contexts/hafiz-context';
import HafizDashboard from '@/components/HafizDashboard';
import MemoryTestModal from '@/components/MemoryTestModal';
import { router } from 'expo-router';

export default function HafizDashboardScreen() {
  const [showTestModal, setShowTestModal] = useState(false);
  
  const {
    progress,
    studySessions,
    goals,
    testResults,
    dueForReview,
    isSessionActive,
    currentSession,
    startSession,
    endSession,
    startTest,
    endTest,
    getStudyStreak,
    getTodayStats,
    getWeakAyahs,
    getDetailedStats,
    addGoal
  } = useHafiz();

  const todayStats = getTodayStats();
  const detailedStats = getDetailedStats();
  const studyStreak = getStudyStreak();
  const weakAyahs = getWeakAyahs();
  const activeGoals = goals.filter(g => !g.completed);
  const recentTests = testResults.slice(0, 5);

  const confidenceStats = {
    weak: progress.filter(p => p.confidence === 'weak').length,
    medium: progress.filter(p => p.confidence === 'medium').length,
    strong: progress.filter(p => p.confidence === 'strong').length,
    mastered: progress.filter(p => p.confidence === 'mastered').length,
  };

  const handleStartTest = (mode: 'recitation' | 'meaning' | 'sequence') => {
    if (progress.length === 0) {
      Alert.alert(
        'No Progress Data',
        'You need to study some ayahs first before taking tests. Start by reading and marking ayahs in the Quran section.',
        [{ text: 'OK' }]
      );
      return;
    }
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

  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end your current study session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Session', 
          style: 'destructive',
          onPress: () => {
            endSession();
            Alert.alert('Session Ended', 'Your study session has been saved.');
          }
        }
      ]
    );
  };

  const handleViewProgress = () => {
    Alert.alert(
      'Progress Overview',
      `Total Ayahs Tracked: ${progress.length}\nDue for Review: ${dueForReview.length}\nStudy Streak: ${studyStreak} days\nCompletion Rate: ${detailedStats.completionRate}%`,
      [{ text: 'OK' }]
    );
  };

  const handleViewGoals = () => {
    if (activeGoals.length === 0) {
      Alert.alert(
        'Create New Goal',
        'What would you like to memorize?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Al-Fatihah', 
            onPress: () => {
              addGoal({
                title: 'Memorize Al-Fatihah',
                description: 'Complete memorization of the opening chapter',
                targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                surahIds: [1]
              });
            }
          },
          { 
            text: 'Last 10 Surahs', 
            onPress: () => {
              addGoal({
                title: 'Memorize Last 10 Surahs',
                description: 'Complete memorization of Surahs 105-114',
                targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                surahIds: [105, 106, 107, 108, 109, 110, 111, 112, 113, 114]
              });
            }
          }
        ]
      );
    } else {
      const goalsList = activeGoals.map(g => `• ${g.title}: ${Math.round(g.progress)}%`).join('\n');
      Alert.alert(
        'Active Goals',
        goalsList,
        [{ text: 'OK' }]
      );
    }
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronRight size={24} color={Colors.textOnPrimary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Brain size={32} color={Colors.textOnPrimary} />
            <Text style={styles.title}>Hafiz Dashboard</Text>
            <Text style={styles.subtitle}>Advanced Memory Tracking</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color={Colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Session */}
        {isSessionActive && currentSession && (
          <View style={styles.currentSessionCard}>
            <LinearGradient colors={Colors.gradients.islamic as [string, string]} style={styles.sessionGradient}>
              <View style={styles.sessionHeader}>
                <Brain size={24} color={Colors.textOnPrimary} />
                <Text style={styles.sessionTitle}>Active Session</Text>
                <TouchableOpacity onPress={handleEndSession} style={styles.endSessionButton}>
                  <Pause size={16} color={Colors.textOnPrimary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.sessionType}>{currentSession.sessionType.toUpperCase()}</Text>
              <Text style={styles.sessionTime}>
                Started: {new Date(currentSession.date).toLocaleTimeString()}
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Clock size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{todayStats.studyTime}m</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Zap size={20} color={Colors.islamicGold} />
            </View>
            <Text style={styles.statValue}>{studyStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <BookOpen size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{progress.length}</Text>
            <Text style={styles.statLabel}>Ayahs Tracked</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Award size={20} color={Colors.islamicGold} />
            </View>
            <Text style={styles.statValue}>{detailedStats.completionRate}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>

        {/* Dashboard Component */}
        <HafizDashboard
          onStartTest={handleStartTest}
          onStartSession={handleStartSession}
          onViewProgress={handleViewProgress}
          onViewGoals={handleViewGoals}
        />
      </ScrollView>

      <MemoryTestModal
        visible={showTestModal}
        onClose={() => {
          setShowTestModal(false);
          endTest();
        }}
      />
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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  currentSessionCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  sessionGradient: {
    padding: 20,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    marginLeft: 8,
    flex: 1,
  },
  endSessionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});