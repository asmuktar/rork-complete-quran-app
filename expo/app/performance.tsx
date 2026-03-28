import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import PerformanceMonitor from '@/components/PerformanceMonitor';

export default function PerformancePage() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <PerformanceMonitor visible={true} />
    </SafeAreaView>
  );
}