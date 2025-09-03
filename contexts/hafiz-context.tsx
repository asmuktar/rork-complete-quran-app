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

  const calculateNextReviewDate = (confidence: MemorizationProgress['confidence'], reviewCount: number, difficulty: number = 2.5): string => {
    // Enhanced spaced repetition using SM-2 algorithm principles
    const baseInterval = settings.spacedRepetitionInterval;
    let interval = 1;
    
    if (reviewCount === 1) {
      interval = 1;
    } else if (reviewCount === 2) {
      interval = 6;
    } else {
      // Calculate interval based on previous interval and difficulty
      const previousInterval = Math.max(1, baseInterval * Math.pow(difficulty, reviewCount - 2));
      
      switch (confidence) {
        case 'weak':
          interval = Math.max(1, Math.round(previousInterval * 0.6));
          break;
        case 'medium':
          interval = Math.max(1, Math.round(previousInterval * 1.0));
          break;
        case 'strong':
          interval = Math.max(1, Math.round(previousInterval * 1.3));
          break;
        case 'mastered':
          interval = Math.max(1, Math.round(previousInterval * 2.5));
          break;
      }
    }
    
    // Add some randomization to prevent review clustering
    const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    interval = Math.round(interval * randomFactor);
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    return nextDate.toISOString();
  };

  const updateProgress = async (surahId: number, ayahNumber: number, confidence: MemorizationProgress['confidence'], responseTime?: number) => {
    const existingIndex = progress.findIndex(p => p.surahId === surahId && p.ayahNumber === ayahNumber);
    const now = new Date().toISOString();
    
    let newProgress: MemorizationProgress;
    
    if (existingIndex >= 0) {
      const existing = progress[existingIndex];
      const isCorrect = confidence !== 'weak';
      
      // Update difficulty based on performance (SM-2 algorithm)
      let newDifficulty = existing.difficulty;
      if (isCorrect) {
        newDifficulty = Math.max(1.3, existing.difficulty + (0.1 - (5 - (confidence === 'mastered' ? 5 : confidence === 'strong' ? 4 : 3)) * (0.08 + (5 - (confidence === 'mastered' ? 5 : confidence === 'strong' ? 4 : 3)) * 0.02)));
      } else {
        newDifficulty = Math.max(1.3, existing.difficulty - 0.8);
      }
      
      newProgress = {
        ...existing,
        confidence,
        lastReviewed: now,
        reviewCount: existing.reviewCount + 1,
        correctAttempts: existing.correctAttempts + (isCorrect ? 1 : 0),
        totalAttempts: existing.totalAttempts + 1,
        difficulty: newDifficulty,
        nextReviewDate: calculateNextReviewDate(confidence, existing.reviewCount + 1, newDifficulty),
      };
    } else {
      const isCorrect = confidence !== 'weak';
      const initialDifficulty = confidence === 'weak' ? 1.8 : confidence === 'medium' ? 2.2 : confidence === 'strong' ? 2.5 : 2.8;
      
      newProgress = {
        surahId,
        ayahNumber,
        confidence,
        lastReviewed: now,
        reviewCount: 1,
        correctAttempts: isCorrect ? 1 : 0,
        totalAttempts: 1,
        nextReviewDate: calculateNextReviewDate(confidence, 1, initialDifficulty),
        difficulty: initialDifficulty,
        tags: [],
      };
    }
    
    const updatedProgress = existingIndex >= 0 
      ? progress.map((p, i) => i === existingIndex ? newProgress : p)
      : [...progress, newProgress];
    
    await saveProgress(updatedProgress);
    
    // Update goals progress
    await updateGoalsProgress(surahId, ayahNumber, confidence);
    
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
    
    // Calculate accuracy from recent test results during this session
    const sessionStart = new Date(currentSession.date);
    const sessionTests = testResults.filter(result => 
      new Date(result.date) >= sessionStart
    );
    
    const accuracy = sessionTests.length > 0 
      ? Math.round(sessionTests.reduce((sum, test) => sum + test.score, 0) / sessionTests.length)
      : 0;
    
    const completedSession: StudySession = {
      ...currentSession,
      duration: Math.max(1, duration), // Minimum 1 minute
      ayahsStudied: sessionAyahsStudied,
      ayahsReviewed: sessionAyahsReviewed,
      surahsStudied: Array.from(sessionSurahs),
      accuracy,
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
    if (!surah) {
      console.warn(`Surah ${surahId} not found`);
      return null;
    }
    
    const ayah = surah.verses.find(v => v.number === ayahNumber);
    if (!ayah) {
      console.warn(`Ayah ${ayahNumber} not found in Surah ${surahId}`);
      return null;
    }
    
    switch (mode) {
      case 'recitation': {
        // More sophisticated recitation testing with better word handling
        const words = ayah.text.trim().split(/\s+/).filter(word => word.length > 0);
        if (words.length < 3) {
          // For very short ayahs, test the whole ayah
          return {
            question: `Recite the complete ayah from Surah ${surah.name}:`,
            correctAnswer: ayah.text,
            options: undefined,
          };
        }
        
        const splitPoint = Math.max(1, Math.floor(words.length * (0.3 + Math.random() * 0.4))); // 30-70% of the ayah
        const questionPart = words.slice(0, splitPoint).join(' ');
        const answerPart = words.slice(splitPoint).join(' ');
        
        return {
          question: `Complete this ayah: "${questionPart}..."`,
          correctAnswer: answerPart,
          options: undefined,
        };
      }
      case 'meaning': {
        // Generate better distractors for meaning tests
        if (!ayah.translation) {
          console.warn(`No translation available for ayah ${ayahNumber} in surah ${surahId}`);
          return null;
        }
        
        const otherAyahs = surah.verses.filter(v => v.number !== ayahNumber && v.translation && v.translation.length > 10);
        
        if (otherAyahs.length < 3) {
          // Not enough distractors in same surah, use simple question
          return {
            question: `What is the meaning of this ayah from Surah ${surah.name}?\n\n"${ayah.text}"`,
            correctAnswer: ayah.translation,
            options: undefined,
          };
        }
        
        const distractors = otherAyahs
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(v => v.translation);
        
        const options = [ayah.translation, ...distractors].sort(() => Math.random() - 0.5);
        
        return {
          question: `What is the meaning of this ayah?\n\n"${ayah.text}"`,
          correctAnswer: ayah.translation,
          options,
        };
      }
      case 'sequence': {
        const nextAyah = surah.verses.find(v => v.number === ayahNumber + 1);
        if (!nextAyah) {
          // Test knowledge of surah ending
          return {
            question: `What comes after ayah ${ayahNumber} in ${surah.name}?`,
            correctAnswer: 'End of Surah',
            options: ['End of Surah', 'Continue to next Surah', 'Repeat from beginning', 'Go to verse 1'],
          };
        }
        
        // Generate distractors from other ayahs in the same surah
        const otherAyahs = surah.verses
          .filter(v => v.number !== nextAyah.number && Math.abs(v.number - ayahNumber) > 2)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        
        const options = [nextAyah.text, ...otherAyahs.map(v => v.text)].sort(() => Math.random() - 0.5);
        
        return {
          question: `What comes after ayah ${ayahNumber} in ${surah.name}?`,
          correctAnswer: nextAyah.text,
          options,
        };
      }
      default:
        return null;
    }
  };

  const startTest = (mode: 'recitation' | 'meaning' | 'sequence', surahId?: number) => {
    let targetProgress: MemorizationProgress | undefined;
    
    if (surahId) {
      // Focus on specific surah, prioritize weaker ayahs
      const surahProgress = progress
        .filter(p => p.surahId === surahId)
        .sort((a, b) => {
          const confidenceOrder = { weak: 0, medium: 1, strong: 2, mastered: 3 };
          const confDiff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
          if (confDiff !== 0) return confDiff;
          return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
        });
      
      targetProgress = surahProgress[0];
    } else {
      // Intelligent selection based on spaced repetition and difficulty
      const dueForReview = getDueForReview();
      const weakAyahs = progress.filter(p => p.confidence === 'weak');
      const mediumAyahs = progress.filter(p => p.confidence === 'medium');
      
      // Prioritize: due for review > weak > medium > random
      if (dueForReview.length > 0) {
        targetProgress = dueForReview[Math.floor(Math.random() * Math.min(5, dueForReview.length))];
      } else if (weakAyahs.length > 0) {
        targetProgress = weakAyahs[Math.floor(Math.random() * weakAyahs.length)];
      } else if (mediumAyahs.length > 0) {
        targetProgress = mediumAyahs[Math.floor(Math.random() * mediumAyahs.length)];
      } else if (progress.length > 0) {
        targetProgress = progress[Math.floor(Math.random() * progress.length)];
      }
    }
    
    // Fallback to Al-Fatiha if no progress data
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
    if (!currentTest) {
      console.warn('No current test to submit answer for');
      return;
    }
    
    // Enhanced answer comparison with fuzzy matching
    const normalizeText = (text: string) => {
      return text.trim().toLowerCase()
        .replace(/[\u064B-\u0652]/g, '') // Remove Arabic diacritics
        .replace(/[^\u0600-\u06FF\u0750-\u077F\w\s]/g, '') // Keep only Arabic, alphanumeric, and spaces
        .replace(/\s+/g, ' ');
    };
    
    const userAnswer = normalizeText(answer);
    const correctAnswer = normalizeText(currentTest.correctAnswer);
    
    // Check for exact match first
    let isCorrect = userAnswer === correctAnswer;
    
    // If not exact match, check for partial match (80% similarity for Arabic text)
    if (!isCorrect && currentTest.correctAnswer.length > 10) {
      const similarity = calculateSimilarity(userAnswer, correctAnswer);
      isCorrect = similarity > 0.8;
    }
    
    const timeSpent = Math.round((Date.now() - currentTest.startTime) / 1000);
    
    // Calculate confidence based on correctness, time, and test type
    let newConfidence: MemorizationProgress['confidence'];
    if (isCorrect) {
      if (timeSpent < 5) {
        newConfidence = 'mastered';
      } else if (timeSpent < 15) {
        newConfidence = 'strong';
      } else {
        newConfidence = 'medium';
      }
    } else {
      newConfidence = 'weak';
    }
    
    // Adjust confidence based on test type difficulty
    if (testMode === 'recitation' && newConfidence === 'medium') {
      newConfidence = 'strong'; // Recitation is harder, so medium performance = strong
    }
    
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
    
    await updateProgress(currentTest.surahId, currentTest.ayahNumber, newConfidence, timeSpent);
    
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

  // Helper function to update goal progress
  const updateGoalsProgress = async (surahId: number, ayahNumber: number, confidence: MemorizationProgress['confidence']) => {
    const updatedGoals = goals.map(goal => {
      if (goal.completed) return goal;
      
      const isRelevantToGoal = goal.surahIds.includes(surahId) && 
        (!goal.ayahRange || (ayahNumber >= goal.ayahRange.start && ayahNumber <= goal.ayahRange.end));
      
      if (!isRelevantToGoal) return goal;
      
      // Calculate progress based on mastered ayahs in goal scope
      const relevantProgress = progress.filter(p => 
        goal.surahIds.includes(p.surahId) &&
        (!goal.ayahRange || (p.ayahNumber >= goal.ayahRange.start && p.ayahNumber <= goal.ayahRange.end)) &&
        (p.confidence === 'strong' || p.confidence === 'mastered')
      );
      
      // Add current ayah if it's strong or mastered
      if ((confidence === 'strong' || confidence === 'mastered') && isRelevantToGoal) {
        const existingProgress = relevantProgress.find(p => p.surahId === surahId && p.ayahNumber === ayahNumber);
        if (!existingProgress) {
          relevantProgress.push({ surahId, ayahNumber, confidence } as MemorizationProgress);
        }
      }
      
      // Calculate total ayahs in goal scope
      let totalAyahs = 0;
      for (const goalSurahId of goal.surahIds) {
        const surah = getSurahById(goalSurahId);
        if (surah) {
          if (goal.ayahRange) {
            totalAyahs += Math.min(goal.ayahRange.end, surah.verses.length) - goal.ayahRange.start + 1;
          } else {
            totalAyahs += surah.verses.length;
          }
        }
      }
      
      const newProgress = totalAyahs > 0 ? Math.round((relevantProgress.length / totalAyahs) * 100) : 0;
      const isCompleted = newProgress >= 100;
      
      return {
        ...goal,
        progress: newProgress,
        completed: isCompleted,
      };
    });
    
    await saveGoals(updatedGoals);
  };
  
  const getDetailedStats = () => {
    const totalAyahs = progress.length;
    const masteredAyahs = progress.filter(p => p.confidence === 'mastered').length;
    const strongAyahs = progress.filter(p => p.confidence === 'strong').length;
    const averageAccuracy = progress.length > 0 
      ? Math.round(progress.reduce((sum, p) => sum + (p.correctAttempts / p.totalAttempts * 100), 0) / progress.length)
      : 0;
    
    const last7Days = studySessions.filter(session => {
      const sessionDate = new Date(session.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    });
    
    const weeklyStudyTime = last7Days.reduce((total, session) => total + session.duration, 0);
    const weeklyAyahs = last7Days.reduce((total, session) => total + session.ayahsStudied, 0);
    
    return {
      totalAyahs,
      masteredAyahs,
      strongAyahs,
      averageAccuracy,
      weeklyStudyTime,
      weeklyAyahs,
      completionRate: totalAyahs > 0 ? Math.round(((masteredAyahs + strongAyahs) / totalAyahs) * 100) : 0,
    };
  };
  
  // Helper function for text similarity calculation
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };
  
  // Levenshtein distance calculation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
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
    getDetailedStats,
    updateGoalsProgress,
  };
});