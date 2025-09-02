import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { HafizProvider } from '@/contexts/hafiz-context';
import HafizDashboard from '@/components/HafizDashboard';
import MemoryTestModal from '@/components/MemoryTestModal';

export default function HafizDashboardScreen() {
  const [showTestModal, setShowTestModal] = useState(false);

  const handleStartTest = (mode: 'recitation' | 'meaning' | 'sequence') => {
    setShowTestModal(true);
  };

  const handleStartSession = (type: 'memorization' | 'review' | 'test') => {
    console.log('Starting session:', type);
    // This would navigate to a session screen or start the session
  };

  const handleViewProgress = () => {
    console.log('View progress');
    // Navigate to progress screen
  };

  const handleViewGoals = () => {
    console.log('View goals');
    // Navigate to goals screen
  };

  return (
    <HafizProvider>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Hafiz Dashboard',
            headerStyle: { backgroundColor: Colors.primary },
            headerTintColor: Colors.textOnPrimary,
            headerTitleStyle: { fontWeight: 'bold' },
          }} 
        />
        
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