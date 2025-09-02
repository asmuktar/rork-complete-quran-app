import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Brain,
  ArrowRight,
  RotateCcw
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useHafiz } from '@/contexts/hafiz-context';
import { getSurahById } from '@/constants/quran-data';

interface MemoryTestModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function MemoryTestModal({ visible, onClose }: MemoryTestModalProps) {
  const { 
    testMode, 
    currentTest, 
    startTest, 
    submitTestAnswer, 
    endTest,
    progress 
  } = useHafiz();
  
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (currentTest && !showResult) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - currentTest.startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentTest, showResult]);

  useEffect(() => {
    if (currentTest?.userAnswer !== undefined) {
      setShowResult(true);
    }
  }, [currentTest?.userAnswer]);

  const handleStartTest = (mode: 'recitation' | 'meaning' | 'sequence') => {
    if (progress.length === 0) {
      Alert.alert(
        'No Progress Data',
        'You need to study some ayahs first before taking tests. Start by reading and marking ayahs in the Quran section.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setUserAnswer('');
    setSelectedOption(null);
    setShowResult(false);
    setTimeElapsed(0);
    startTest(mode);
  };

  const handleSubmitAnswer = async () => {
    if (!currentTest) return;
    
    const answer = currentTest.options ? selectedOption || '' : userAnswer;
    if (!answer.trim()) {
      Alert.alert('Please provide an answer');
      return;
    }
    
    await submitTestAnswer(answer);
  };

  const handleNextTest = () => {
    setShowResult(false);
    setUserAnswer('');
    setSelectedOption(null);
    setTimeElapsed(0);
    startTest(testMode as 'recitation' | 'meaning' | 'sequence');
  };

  const handleClose = () => {
    endTest();
    setShowResult(false);
    setUserAnswer('');
    setSelectedOption(null);
    setTimeElapsed(0);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSurahName = (surahId: number) => {
    const surah = getSurahById(surahId);
    return surah ? surah.name : `Surah ${surahId}`;
  };

  const isCorrect = currentTest?.userAnswer === currentTest?.correctAnswer;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={Colors.gradients.islamic as [string, string]} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.textOnPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Memory Test</Text>
            <View style={styles.headerRight}>
              {currentTest && (
                <View style={styles.timerContainer}>
                  <Clock size={16} color={Colors.textOnPrimary} />
                  <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {!currentTest ? (
            /* Test Selection */
            <View style={styles.testSelection}>
              <View style={styles.welcomeSection}>
                <Brain size={48} color={Colors.primary} />
                <Text style={styles.welcomeTitle}>Memory Testing</Text>
                <Text style={styles.welcomeSubtitle}>
                  Test your Quran memorization with different modes
                </Text>
              </View>

              <View style={styles.testModes}>
                <TouchableOpacity 
                  style={styles.testModeCard}
                  onPress={() => handleStartTest('recitation')}
                >
                  <LinearGradient 
                    colors={[Colors.primary, Colors.primaryLight]} 
                    style={styles.testModeGradient}
                  >
                    <Brain size={32} color={Colors.textOnPrimary} />
                    <Text style={styles.testModeTitle}>Recitation Test</Text>
                    <Text style={styles.testModeDescription}>
                      Complete the ayah from a given beginning
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.testModeCard}
                  onPress={() => handleStartTest('meaning')}
                >
                  <LinearGradient 
                    colors={[Colors.success, '#4CAF50']} 
                    style={styles.testModeGradient}
                  >
                    <CheckCircle size={32} color={Colors.textOnPrimary} />
                    <Text style={styles.testModeTitle}>Meaning Test</Text>
                    <Text style={styles.testModeDescription}>
                      Choose the correct translation of an ayah
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.testModeCard}
                  onPress={() => handleStartTest('sequence')}
                >
                  <LinearGradient 
                    colors={[Colors.islamicGold, '#F4E4BC']} 
                    style={styles.testModeGradient}
                  >
                    <ArrowRight size={32} color={Colors.textOnPrimary} />
                    <Text style={styles.testModeTitle}>Sequence Test</Text>
                    <Text style={styles.testModeDescription}>
                      Identify what comes after an ayah
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {progress.length === 0 && (
                <View style={styles.noDataCard}>
                  <Text style={styles.noDataTitle}>No Study Data</Text>
                  <Text style={styles.noDataText}>
                    Start studying ayahs in the Quran section to enable memory testing.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            /* Active Test */
            <View style={styles.activeTest}>
              {/* Test Info */}
              <View style={styles.testInfo}>
                <Text style={styles.testType}>
                  {testMode?.toUpperCase()} TEST
                </Text>
                <Text style={styles.testLocation}>
                  {getSurahName(currentTest.surahId)} - Ayah {currentTest.ayahNumber}
                </Text>
              </View>

              {/* Question */}
              <View style={styles.questionCard}>
                <Text style={styles.questionText}>{currentTest.question}</Text>
              </View>

              {showResult ? (
                /* Result Display */
                <View style={styles.resultSection}>
                  <View style={[
                    styles.resultCard,
                    { backgroundColor: isCorrect ? Colors.primaryOverlay : Colors.errorOverlay }
                  ]}>
                    <View style={styles.resultHeader}>
                      {isCorrect ? (
                        <CheckCircle size={32} color={Colors.success} />
                      ) : (
                        <XCircle size={32} color={Colors.error} />
                      )}
                      <Text style={[
                        styles.resultTitle,
                        { color: isCorrect ? Colors.success : Colors.error }
                      ]}>
                        {isCorrect ? 'Correct!' : 'Incorrect'}
                      </Text>
                    </View>

                    <View style={styles.resultDetails}>
                      <Text style={styles.resultLabel}>Your Answer:</Text>
                      <Text style={[
                        styles.resultAnswer,
                        { color: isCorrect ? Colors.success : Colors.error }
                      ]}>
                        {currentTest.userAnswer}
                      </Text>

                      {!isCorrect && (
                        <>
                          <Text style={styles.resultLabel}>Correct Answer:</Text>
                          <Text style={[styles.resultAnswer, { color: Colors.success }]}>
                            {currentTest.correctAnswer}
                          </Text>
                        </>
                      )}

                      <Text style={styles.resultTime}>
                        Time taken: {formatTime(timeElapsed)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.resultActions}>
                    <TouchableOpacity 
                      style={styles.nextTestButton}
                      onPress={handleNextTest}
                    >
                      <RotateCcw size={20} color={Colors.textOnPrimary} />
                      <Text style={styles.nextTestButtonText}>Next Test</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.finishButton}
                      onPress={handleClose}
                    >
                      <Text style={styles.finishButtonText}>Finish</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Answer Input */
                <View style={styles.answerSection}>
                  {currentTest.options ? (
                    /* Multiple Choice */
                    <View style={styles.optionsContainer}>
                      {currentTest.options.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.optionCard,
                            selectedOption === option && styles.optionCardSelected
                          ]}
                          onPress={() => setSelectedOption(option)}
                        >
                          <Text style={[
                            styles.optionText,
                            selectedOption === option && styles.optionTextSelected
                          ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    /* Text Input */
                    <View style={styles.textInputContainer}>
                      <TextInput
                        style={styles.textInput}
                        value={userAnswer}
                        onChangeText={setUserAnswer}
                        placeholder="Type your answer here..."
                        placeholderTextColor={Colors.textLight}
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  )}

                  <TouchableOpacity 
                    style={[
                      styles.submitButton,
                      (!userAnswer.trim() && !selectedOption) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmitAnswer}
                    disabled={!userAnswer.trim() && !selectedOption}
                  >
                    <Text style={styles.submitButtonText}>Submit Answer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
  },
  headerRight: {
    width: 40,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 12,
    color: Colors.textOnPrimary,
    marginLeft: 4,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  testSelection: {
    flex: 1,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  testModes: {
    gap: 16,
  },
  testModeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  testModeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  testModeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  testModeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  noDataCard: {
    backgroundColor: Colors.errorOverlay,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.error,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  activeTest: {
    flex: 1,
  },
  testInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  testType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 1,
  },
  testLocation: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  questionText: {
    fontSize: 18,
    color: Colors.text,
    lineHeight: 28,
    textAlign: 'center',
  },
  answerSection: {
    flex: 1,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.surfaceVariant,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryOverlay,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  textInputContainer: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
  },
  resultSection: {
    flex: 1,
  },
  resultCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  resultDetails: {
    gap: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  resultAnswer: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  resultTime: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  nextTestButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextTestButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    marginLeft: 8,
  },
  finishButton: {
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
});