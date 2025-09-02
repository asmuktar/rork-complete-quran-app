import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { HafizProvider } from '@/contexts/hafiz-context';
import HafizDashboard from '@/components/HafizDashboard';
import MemoryTestModal from '@/components/MemoryTestModal';
import { router } from 'expo-router';

export default function HafizTab() {
  const [showTestModal, setShowTestModal] = useState(false);

  const handleStartTest = (mode: 'recitation' | 'meaning' | 'sequence') => {
    setShowTestModal(true);
  };

  const handleStartSession = (type: 'memorization' | 'review' | 'test') => {
    console.log('Starting session:', type);
    // This would navigate to a session screen or start the session
    // For now, we'll just navigate to a surah for memorization
    if (type === 'memorization') {
      router.push('/surahs');
    }
  };

  const handleViewProgress = () => {
    console.log('View progress');
    // Navigate to progress screen - could be implemented later
  };

  const handleViewGoals = () => {
    console.log('View goals');
    // Navigate to goals screen - could be implemented later
  };

  return (
    <HafizProvider>
      <SafeAreaView style={styles.container}>
        <HafizDashboard
          onStartTest={handleStartTest}
          onStartSession={handleStartSession}
          onViewProgress={handleViewProgress}
          onViewGoals={handleViewGoals}
        />

        <MemoryTestModal
          visible={showTestModal}
          onClose={() => setShowTestModal(false)}
        />
      </SafeAreaView>
    </HafizProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});