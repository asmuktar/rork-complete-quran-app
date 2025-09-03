import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Wifi, WifiOff, Download } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import offlineService from '@/services/offline-service';

interface NetworkStatusProps {
  showDetails?: boolean;
  style?: any;
}

export function NetworkStatus({ showDetails = false, style }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [cacheSize, setCacheSize] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkStatus = async () => {
      const online = offlineService.getNetworkStatus();
      setIsOnline(online);
      
      if (showDetails) {
        const size = await offlineService.getCacheSize();
        setCacheSize(size);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    return () => clearInterval(interval);
  }, [showDetails, fadeAnim]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Animated.View style={[styles.container, style, { opacity: fadeAnim }]}>
      <View style={[
        styles.statusBar,
        isOnline ? styles.statusBarOnline : styles.statusBarOffline
      ]}>
        <View style={styles.statusContent}>
          {isOnline ? (
            <Wifi size={16} color={Colors.success} />
          ) : (
            <WifiOff size={16} color={Colors.error} />
          )}
          <Text style={[
            styles.statusText,
            { color: isOnline ? Colors.success : Colors.error }
          ]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          
          {showDetails && (
            <>
              <View style={styles.separator} />
              <Download size={14} color={Colors.textLight} />
              <Text style={styles.cacheText}>
                {formatBytes(cacheSize)} cached
              </Text>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  statusBar: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusBarOnline: {
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(39, 174, 96, 0.3)',
  },
  statusBarOffline: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: Colors.textLight,
    opacity: 0.3,
  },
  cacheText: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
  },
});

export default NetworkStatus;