import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { getSurahById } from '@/constants/quran-data';

export interface MemorizationProgress {
  surahId: number;
  ayahNumber: number;
  confidence: 'weak' | 'medium' | 'strong' | 'mastered';
  lastReviewed: string;
  reviewCount: number;
  correctAttempts: number;
  totalAttempts: number;
  nextReviewDate: string;
  difficulty: number;
  tags: string[];
}

export interface StudySession {
  id: string;
  date: string;
  duration: number;
  ayahsStudied: number;
  ayahsReviewed: number;
  accuracy: number;
  surahsStudied: number[];
  sessionType: 'memorization' | 'review' | 'test';
}

export interface HafizGoal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  surahIds: number[];
  ayahRange?: { start: number; end: number };
  completed: boolean;
  progress: number;
  createdAt: string;
}

export interface TestResult {
  id: string;
  date: string;
  surahId: number;
  ayahNumber: number;
  testType: 'recitation' | 'meaning' | 'sequence';
  score: number;
  timeSpent: number;
  mistakes: string[];
  hints: number;
}

const STORAGE_KEYS = {
  PROGRESS: 'hafiz_progress',
  SESSIONS: 'hafiz_sessions',
  GOALS: 'hafiz_goals',
  TEST_RESULTS: 'hafiz_test_results',
  SETTINGS: 'hafiz_settings',
};

const DEFAULT_SETTINGS = {
  dailyGoal: 30,
  reviewReminders: true,
  difficultyAdjustment: true,
  showTransliteration: false,
  autoAdvance: true,
  spacedRepetitionInterval: 1,
};

export const [HafizProvider, useHafiz] = createContextHook(() => {
  const [progress, setProgress] = useState<MemorizationProgress[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [goals, setGoals] = useState<HafizGoal[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [testMode, setTestMode] = useState<'off' | 'recitation' | 'meaning' | 'sequence'>('off');
  const [currentTest, setCurrentTest] = useState<{
    surahId: number;
    ayahNumber: number;
    question: string;
    options?: string[];
    correctAnswer: string;
    userAnswer?: string;
    startTime: number;
  } | null>(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionAyahsStudied, setSessionAyahsStudied] = useState(0);
  const [sessionAyahsReviewed, setSessionAyahsReviewed] = useState(0);
  const [sessionSurahs, setSessionSurahs] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [progressData, sessionsData, goalsData, testResultsData, settingsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROGRESS),
        AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.GOALS),
        AsyncStorage.getItem(STORAGE_KEYS.TEST_RESULTS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      if (progressData) setProgress(JSON.parse(progressData));
      if (sessionsData) setStudySessions(JSON.parse(sessionsData));
      if (goalsData) setGoals(JSON.parse(goalsData));
      if (testResultsData) setTestResults(JSON.parse(testResultsData));
      if (settingsData) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsData) });
    } catch (error) {
      console.error('Error loading hafiz data:', error);
    }
  };

  const saveProgress = async (newProgress: MemorizationProgress[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const saveSessions = async (newSessions: StudySession[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(newSessions));
      setStudySessions(newSessions);
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  };

  const saveGoals = async (newGoals: HafizGoal[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(newGoals));
      setGoals(newGoals);
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  };

  const saveTestResults = async (newResults: TestResult[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TEST_RESULTS, JSON.stringify(newResults));
      setTestResults(newResults);
    } catch (error) {
      console.error('Error saving test results:', error);
    }
  };

  const calculateNextReviewDate = (confidence: MemorizationProgress['confidence'], reviewCount: number): string => {
    const baseInterval = settings.spacedRepetitionInterval;
    let multiplier = 1;
    
    switch (confidence) {
      case 'weak':
        multiplier = 0.5;
        break;
      case 'medium':
        multiplier = 1;
        break;
      case 'strong':
        multiplier = 2;
        break;
      case 'mastered':
        multiplier = 7;
        break;
    }
    
    const interval = Math.max(1, baseInterval * multiplier * Math.pow(1.3, reviewCount));
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    return nextDate.toISOString();
  };

  const updateProgress = async (surahId: number, ayahNumber: number, confidence: MemorizationProgress['confidence']) => {
    const existingIndex = progress.findIndex(p => p.surahId === surahId && p.ayahNumber === ayahNumber);
    const now = new Date().toISOString();
    
    let newProgress: MemorizationProgress;
    
    if (existingIndex >= 0) {
      const existing = progress[existingIndex];
      newProgress = {
        ...existing,
        confidence,
        lastReviewed: now,
        reviewCount: existing.reviewCount + 1,
        nextReviewDate: calculateNextReviewDate(confidence, existing.reviewCount + 1),
      };
    } else {
      newProgress = {
        surahId,
        ayahNumber,
        confidence,
        lastReviewed: now,
        reviewCount: 1,
        correctAttempts: confidence === 'weak' ? 0 : 1,
        totalAttempts: 1,
        nextReviewDate: calculateNextReviewDate(confidence, 1),
        difficulty: confidence === 'weak' ? 4 : confidence === 'medium' ? 3 : confidence === 'strong' ? 2 : 1,
        tags: [],
      };
    }
    
    const updatedProgress = existingIndex >= 0 
      ? progress.map((p, i) => i === existingIndex ? newProgress : p)
      : [...progress, newProgress];
    
    await saveProgress(updatedProgress);
    
    if (isSessionActive) {
      setSessionAyahsStudied(prev => prev + 1);
      setSessionSurahs(prev => new Set([...prev, surahId]));
    }
  };

  const startSession = (type: StudySession['sessionType']) => {
    const session: StudySession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: 0,
      ayahsStudied: 0,
      ayahsReviewed: 0,
      accuracy: 0,
      surahsStudied: [],
      sessionType: type,
    };
    
    setCurrentSession(session);
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    setSessionAyahsStudied(0);
    setSessionAyahsReviewed(0);
    setSessionSurahs(new Set());
  };

  const endSession = async () => {
    if (!currentSession || !isSessionActive) return;
    
    const duration = Math.round((Date.now() - sessionStartTime) / 60000);
    const completedSession: StudySession = {
      ...currentSession,
      duration,
      ayahsStudied: sessionAyahsStudied,
      ayahsReviewed: sessionAyahsReviewed,
      surahsStudied: Array.from(sessionSurahs),
      accuracy: 85,
    };
    
    const updatedSessions = [completedSession, ...studySessions].slice(0, 100);
    await saveSessions(updatedSessions);
    
    setCurrentSession(null);
    setIsSessionActive(false);
    setSessionStartTime(0);
    setSessionAyahsStudied(0);
    setSessionAyahsReviewed(0);
    setSessionSurahs(new Set());
  };

  const addGoal = async (goalData: Omit<HafizGoal, 'id' | 'createdAt' | 'progress' | 'completed'>) => {
    const newGoal: HafizGoal = {
      ...goalData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      progress: 0,
      completed: false,
    };
    
    const updatedGoals = [newGoal, ...goals];
    await saveGoals(updatedGoals);
  };

  const updateGoal = async (goalId: string, updates: Partial<HafizGoal>) => {
    const updatedGoals = goals.map(goal => 
      goal.id === goalId ? { ...goal, ...updates } : goal
    );
    await saveGoals(updatedGoals);
  };

  const deleteGoal = async (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    await saveGoals(updatedGoals);
  };

  const generateTestQuestion = (surahId: number, ayahNumber: number, mode: 'recitation' | 'meaning' | 'sequence') => {
    const surah = getSurahById(surahId);
    if (!surah) return null;
    
    const ayah = surah.verses.find(v => v.number === ayahNumber);
    if (!ayah) return null;
    
    switch (mode) {
      case 'recitation':
        return {
          question: `What comes after: "${ayah.text.substring(0, 20)}..."?`,
          correctAnswer: ayah.text.substring(20),
          options: undefined,
        };
      case 'meaning':
        return {
          question: `What is the meaning of this ayah: "${ayah.text}"?`,
          correctAnswer: ayah.translation,
          options: [ayah.translation, 'Sample wrong answer 1', 'Sample wrong answer 2', 'Sample wrong answer 3'],
        };
      case 'sequence':
        const nextAyah = surah.verses.find(v => v.number === ayahNumber + 1);
        return {
          question: `What comes after ayah ${ayahNumber}?`,
          correctAnswer: nextAyah?.text || 'End of Surah',
          options: nextAyah ? [nextAyah.text, 'Sample wrong answer 1', 'Sample wrong answer 2', 'Sample wrong answer 3'] : undefined,
        };
      default:
        return null;
    }
  };

  const startTest = (mode: 'recitation' | 'meaning' | 'sequence', surahId?: number) => {
    let targetProgress: MemorizationProgress | undefined;
    
    if (surahId) {
      const surahProgress = progress.filter(p => p.surahId === surahId && p.confidence !== 'mastered');
      targetProgress = surahProgress[Math.floor(Math.random() * surahProgress.length)];
    } else {
      const weakProgress = progress.filter(p => p.confidence === 'weak' || p.confidence === 'medium');
      targetProgress = weakProgress[Math.floor(Math.random() * weakProgress.length)];
    }
    
    if (!targetProgress) {
      targetProgress = { surahId: 1, ayahNumber: 1, confidence: 'medium' } as MemorizationProgress;
    }
    
    const testData = generateTestQuestion(targetProgress.surahId, targetProgress.ayahNumber, mode);
    if (!testData) return;
    
    setTestMode(mode);
    setCurrentTest({
      surahId: targetProgress.surahId,
      ayahNumber: targetProgress.ayahNumber,
      question: testData.question,
      options: testData.options,
      correctAnswer: testData.correctAnswer,
      startTime: Date.now(),
    });
  };

  const submitTestAnswer = async (answer: string) => {
    if (!currentTest) return;
    
    const isCorrect = answer.trim().toLowerCase() === currentTest.correctAnswer.trim().toLowerCase();
    const timeSpent = Math.round((Date.now() - currentTest.startTime) / 1000);
    
    const testResult: TestResult = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      surahId: currentTest.surahId,
      ayahNumber: currentTest.ayahNumber,
      testType: testMode as 'recitation' | 'meaning' | 'sequence',
      score: isCorrect ? 100 : 0,
      timeSpent,
      mistakes: isCorrect ? [] : [answer],
      hints: 0,
    };
    
    const updatedResults = [testResult, ...testResults].slice(0, 500);
    await saveTestResults(updatedResults);
    
    const newConfidence: MemorizationProgress['confidence'] = isCorrect 
      ? (timeSpent < 10 ? 'strong' : 'medium')
      : 'weak';
    
    await updateProgress(currentTest.surahId, currentTest.ayahNumber, newConfidence);
    
    setCurrentTest({ ...currentTest, userAnswer: answer });
  };

  const endTest = () => {
    setTestMode('off');
    setCurrentTest(null);
  };

  const getDueForReview = () => {
    const now = new Date();
    return progress.filter(p => new Date(p.nextReviewDate) <= now);
  };

  const getNextReviewAyah = () => {
    const due = getDueForReview();
    if (due.length === 0) return null;
    
    return due.sort((a, b) => {
      const confidenceOrder = { weak: 0, medium: 1, strong: 2, mastered: 3 };
      const confDiff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
      if (confDiff !== 0) return confDiff;
      
      return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
    })[0];
  };

  const markForReview = async (surahId: number, ayahNumber: number) => {
    await updateProgress(surahId, ayahNumber, 'weak');
  };

  const updateSettings = async (newSettings: Partial<typeof DEFAULT_SETTINGS>) => {
    const updatedSettings = { ...settings, ...newSettings };
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const getWeakAyahs = () => {
    return progress.filter(p => p.confidence === 'weak').slice(0, 20);
  };

  const getStudyStreak = () => {
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasSession = studySessions.some(session => 
        session.date.startsWith(dateStr) && session.duration > 0
      );
      
      if (hasSession) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = studySessions.filter(session => session.date.startsWith(today));
    
    return {
      studyTime: todaySessions.reduce((total, session) => total + session.duration, 0),
      ayahsStudied: todaySessions.reduce((total, session) => total + session.ayahsStudied, 0),
      accuracy: todaySessions.length > 0 
        ? todaySessions.reduce((total, session) => total + session.accuracy, 0) / todaySessions.length
        : 0,
    };
  };

  return {
    progress,
    studySessions,
    goals,
    testResults,
    currentSession,
    isSessionActive,
    testMode,
    currentTest,
    dueForReview: getDueForReview(),
    reviewQueue: getDueForReview().slice(0, 10),
    settings,
    updateProgress,
    startSession,
    endSession,
    addGoal,
    updateGoal,
    deleteGoal,
    startTest,
    submitTestAnswer,
    endTest,
    getNextReviewAyah,
    markForReview,
    updateSettings,
    getWeakAyahs,
    getStudyStreak,
    getTodayStats,
  };
});