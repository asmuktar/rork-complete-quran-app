import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Brain, 
  Target, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  Award,
  Calendar,
  Zap
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useHafiz } from '@/contexts/hafiz-context';

interface HafizDashboardProps {
  onStartTest: (mode: 'recitation' | 'meaning' | 'sequence') => void;
  onStartSession: (type: 'memorization' | 'review' | 'test') => void;
  onViewProgress: () => void;
  onViewGoals: () => void;
}

export default function HafizDashboard({ 
  onStartTest, 
  onStartSession, 
  onViewProgress, 
  onViewGoals 
}: HafizDashboardProps) {
  const { 
    progress, 
    dueForReview, 
    getStudyStreak, 
    getTodayStats, 
    getWeakAyahs,
    getDetailedStats,
    isSessionActive,
    currentSession,
    goals,
    testResults
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Stats */}
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
      
      {/* Weekly Progress Summary */}
      {detailedStats.weeklyStudyTime > 0 && (
        <View style={styles.weeklyProgressCard}>
          <Text style={styles.weeklyProgressTitle}>This Week&apos;s Progress</Text>
          <View style={styles.weeklyProgressStats}>
            <View style={styles.weeklyProgressItem}>
              <Text style={styles.weeklyProgressValue}>{detailedStats.weeklyStudyTime}m</Text>
              <Text style={styles.weeklyProgressLabel}>Study Time</Text>
            </View>
            <View style={styles.weeklyProgressItem}>
              <Text style={styles.weeklyProgressValue}>{detailedStats.weeklyAyahs}</Text>
              <Text style={styles.weeklyProgressLabel}>Ayahs Studied</Text>
            </View>
            <View style={styles.weeklyProgressItem}>
              <Text style={styles.weeklyProgressValue}>{detailedStats.averageAccuracy}%</Text>
              <Text style={styles.weeklyProgressLabel}>Accuracy</Text>
            </View>
          </View>
        </View>
      )}

      {/* Current Session */}
      {isSessionActive && currentSession && (
        <View style={styles.currentSessionCard}>
          <LinearGradient colors={Colors.gradients.islamic as [string, string]} style={styles.sessionGradient}>
            <View style={styles.sessionHeader}>
              <Brain size={24} color={Colors.textOnPrimary} />
              <Text style={styles.sessionTitle}>Active Session</Text>
            </View>
            <Text style={styles.sessionType}>{currentSession.sessionType.toUpperCase()}</Text>
            <Text style={styles.sessionTime}>
              Started: {new Date(currentSession.date).toLocaleTimeString()}
            </Text>
          </LinearGradient>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Memory Testing</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => onStartTest('recitation')}
          >
            <Brain size={24} color={Colors.primary} />
            <Text style={styles.actionTitle}>Recitation Test</Text>
            <Text style={styles.actionSubtitle}>Test your memorization</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => onStartTest('meaning')}
          >
            <BookOpen size={24} color={Colors.success} />
            <Text style={styles.actionTitle}>Meaning Test</Text>
            <Text style={styles.actionSubtitle}>Test understanding</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => onStartTest('sequence')}
          >
            <TrendingUp size={24} color={Colors.islamicGold} />
            <Text style={styles.actionTitle}>Sequence Test</Text>
            <Text style={styles.actionSubtitle}>Test ayah order</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Study Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Study Sessions</Text>
        <View style={styles.sessionGrid}>
          <TouchableOpacity 
            style={styles.sessionCard}
            onPress={() => onStartSession('memorization')}
          >
            <BookOpen size={20} color={Colors.primary} />
            <Text style={styles.sessionCardTitle}>New Memorization</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sessionCard}
            onPress={() => onStartSession('review')}
          >
            <Clock size={20} color={Colors.islamicGold} />
            <Text style={styles.sessionCardTitle}>Review Session</Text>
            {dueForReview.length > 0 && (
              <Text style={styles.sessionBadge}>{dueForReview.length} due</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sessionCard}
            onPress={() => onStartSession('test')}
          >
            <Brain size={20} color={Colors.success} />
            <Text style={styles.sessionCardTitle}>Test Session</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Progress Overview</Text>
          <TouchableOpacity onPress={onViewProgress}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressGrid}>
          <View style={[styles.progressCard, { borderLeftColor: Colors.error }]}>
            <Text style={styles.progressValue}>{confidenceStats.weak}</Text>
            <Text style={styles.progressLabel}>Weak</Text>
          </View>
          
          <View style={[styles.progressCard, { borderLeftColor: Colors.warning }]}>
            <Text style={styles.progressValue}>{confidenceStats.medium}</Text>
            <Text style={styles.progressLabel}>Medium</Text>
          </View>
          
          <View style={[styles.progressCard, { borderLeftColor: Colors.success }]}>
            <Text style={styles.progressValue}>{confidenceStats.strong}</Text>
            <Text style={styles.progressLabel}>Strong</Text>
          </View>
          
          <View style={[styles.progressCard, { borderLeftColor: Colors.islamicGold }]}>
            <Text style={styles.progressValue}>{confidenceStats.mastered}</Text>
            <Text style={styles.progressLabel}>Mastered</Text>
          </View>
        </View>
      </View>

      {/* Goals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Goals</Text>
          <TouchableOpacity onPress={onViewGoals}>
            <Text style={styles.viewAllText}>Manage</Text>
          </TouchableOpacity>
        </View>
        
        {activeGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Target size={32} color={Colors.textLight} />
            <Text style={styles.emptyStateText}>No active goals</Text>
            <TouchableOpacity onPress={onViewGoals}>
              <Text style={styles.emptyStateAction}>Create your first goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.goalsList}>
            {activeGoals.slice(0, 3).map((goal) => (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalProgress}>{Math.round(goal.progress)}%</Text>
                </View>
                <View style={styles.goalProgressBar}>
                  <View 
                    style={[
                      styles.goalProgressFill, 
                      { width: `${goal.progress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.goalDate}>
                  Due: {new Date(goal.targetDate).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Recent Test Results */}
      {recentTests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Test Results</Text>
          <View style={styles.testResultsList}>
            {recentTests.map((test) => (
              <View key={test.id} style={styles.testResultCard}>
                <View style={styles.testResultHeader}>
                  <Text style={styles.testResultType}>{test.testType.toUpperCase()}</Text>
                  <View style={[
                    styles.testResultScore,
                    { backgroundColor: test.score === 100 ? Colors.success : Colors.error }
                  ]}>
                    <Text style={styles.testResultScoreText}>{test.score}%</Text>
                  </View>
                </View>
                <Text style={styles.testResultTime}>
                  {Math.floor(test.timeSpent / 60)}:{(test.timeSpent % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Weak Ayahs Alert */}
      {weakAyahs.length > 0 && (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <View style={styles.alertIcon}>
              <Calendar size={20} color={Colors.error} />
            </View>
            <Text style={styles.alertTitle}>Needs Review</Text>
          </View>
          <Text style={styles.alertText}>
            You have {weakAyahs.length} ayahs marked as weak that need extra attention.
          </Text>
          <TouchableOpacity 
            style={styles.alertButton}
            onPress={() => onStartSession('review')}
          >
            <Text style={styles.alertButtonText}>Start Review</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
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
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  sessionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionCard: {
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
  sessionCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  sessionBadge: {
    fontSize: 10,
    color: Colors.error,
    backgroundColor: Colors.errorOverlay,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 2,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  progressLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptyStateAction: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  goalProgressBar: {
    height: 4,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 2,
    marginBottom: 8,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  goalDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  alertCard: {
    backgroundColor: Colors.errorOverlay,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    marginBottom: 20,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.error,
  },
  alertText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  alertButton: {
    backgroundColor: Colors.error,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  alertButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
  weeklyProgressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  weeklyProgressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  weeklyProgressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weeklyProgressItem: {
    alignItems: 'center',
  },
  weeklyProgressValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  weeklyProgressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  testResultsList: {
    gap: 8,
  },
  testResultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testResultType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginRight: 12,
  },
  testResultScore: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  testResultScoreText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
  },
  testResultTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
});