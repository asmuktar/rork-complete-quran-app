import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { BarChart3, Zap, Database, Wifi, RefreshCw, Trash2 } from 'lucide-react-native';
import resourceManager, { ResourceStats, PerformanceMetrics } from '@/services/resource-manager';
import cacheService from '@/services/cache-service';

interface PerformanceMonitorProps {
  visible?: boolean;
}

export default function PerformanceMonitor({ visible = true }: PerformanceMonitorProps) {
  const [stats, setStats] = useState<ResourceStats | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (visible) {
      loadPerformanceData();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(loadPerformanceData, 30000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  const loadPerformanceData = async () => {
    try {
      const [resourceStats, performanceMetrics, performanceRecommendations] = await Promise.all([
        resourceManager.getResourceStats(),
        Promise.resolve(resourceManager.getPerformanceMetrics()),
        Promise.resolve(resourceManager.getPerformanceRecommendations())
      ]);

      setStats(resourceStats);
      setMetrics(performanceMetrics);
      setRecommendations(performanceRecommendations);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      await resourceManager.forceOptimization();
      await loadPerformanceData();
      Alert.alert('Success', 'Performance optimization completed successfully!');
    } catch (error) {
      console.error('Error during optimization:', error);
      Alert.alert('Error', 'Failed to optimize performance. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data and may slow down the app temporarily. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await cacheService.clearAll();
              await resourceManager.clearMetrics();
              await loadPerformanceData();
              Alert.alert('Success', 'Cache cleared successfully!');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
            }
          }
        }
      ]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (!visible || !stats || !metrics) {
    return null;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BarChart3 size={24} color="#007AFF" />
          <Text style={styles.title}>Performance Monitor</Text>
        </View>
        <Text style={styles.lastUpdate}>
          Updated: {lastUpdate.toLocaleTimeString()}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.optimizeButton]}
          onPress={handleOptimize}
          disabled={isOptimizing}
        >
          <RefreshCw size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>
            {isOptimizing ? 'Optimizing...' : 'Optimize'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={handleClearCache}
        >
          <Trash2 size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Clear Cache</Text>
        </TouchableOpacity>
      </View>

      {/* Memory Usage */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Zap size={20} color="#FF9500" />
          <Text style={styles.sectionTitle}>Memory Usage</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Cache</Text>
            <Text style={styles.statValue}>{stats.memoryUsage.cache} items</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Audio</Text>
            <Text style={styles.statValue}>{formatBytes(stats.memoryUsage.audio)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Images</Text>
            <Text style={styles.statValue}>{formatBytes(stats.memoryUsage.images)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{formatBytes(stats.memoryUsage.total)}</Text>
          </View>
        </View>
      </View>

      {/* Storage Usage */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Database size={20} color="#34C759" />
          <Text style={styles.sectionTitle}>Storage Usage</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Cache</Text>
            <Text style={styles.statValue}>{stats.storageUsage.cache} keys</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Audio</Text>
            <Text style={styles.statValue}>{stats.storageUsage.audio} files</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Bookmarks</Text>
            <Text style={styles.statValue}>{stats.storageUsage.bookmarks} items</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Settings</Text>
            <Text style={styles.statValue}>{stats.storageUsage.settings} items</Text>
          </View>
        </View>
      </View>

      {/* Network Performance */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Wifi size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Network Performance</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Requests</Text>
            <Text style={styles.statValue}>{stats.networkUsage.requests}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Cache Hits</Text>
            <Text style={styles.statValue}>{stats.networkUsage.cacheHits}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Cache Misses</Text>
            <Text style={styles.statValue}>{stats.networkUsage.cacheMisses}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Hit Rate</Text>
            <Text style={[styles.statValue, { color: stats.networkUsage.hitRate > 0.7 ? '#34C759' : '#FF3B30' }]}>
              {formatPercentage(stats.networkUsage.hitRate)}
            </Text>
          </View>
        </View>
      </View>

      {/* API Response Times */}
      {Object.keys(metrics.apiResponseTimes).length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>API Response Times</Text>
          </View>
          {Object.entries(metrics.apiResponseTimes).map(([endpoint, times]) => {
            const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
            const isSlowEndpoint = avgTime > 3000;
            
            return (
              <View key={endpoint} style={styles.apiItem}>
                <Text style={styles.apiEndpoint} numberOfLines={1}>
                  {endpoint}
                </Text>
                <Text style={[
                  styles.apiTime,
                  { color: isSlowEndpoint ? '#FF3B30' : '#34C759' }
                ]}>
                  {avgTime.toFixed(0)}ms
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Performance Recommendations */}
      {recommendations.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
          </View>
          {recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Memory Pressure Warning */}
      {metrics.memoryPressure && (
        <View style={styles.warningSection}>
          <Text style={styles.warningTitle}>⚠️ Memory Pressure Detected</Text>
          <Text style={styles.warningText}>
            The app is using high amounts of memory. Consider clearing cache or closing other apps.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 8,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  optimizeButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  apiItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  apiEndpoint: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    marginRight: 8,
  },
  apiTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationItem: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  warningSection: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});