import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Compass, MapPin, Navigation, RefreshCw, Smartphone, Vibrate } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { getLocation } from '@/services/location-service';
import { trpc } from '@/lib/trpc';
import { Magnetometer } from 'expo-sensors';
import type { Subscription } from 'expo-sensors/build/Pedometer';

const { width } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface QiblaData {
  direction: number;
  distance: number;
}



export default function QiblaScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [qiblaData, setQiblaData] = useState<QiblaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [compassEnabled, setCompassEnabled] = useState<boolean>(true); // Live mode enabled by default
  
  const magnetometerSubscription = useRef<Subscription | null>(null);
  const calibrationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Getting location for Qibla direction...');
      const locationData = await getLocation();
      
      if (!locationData) {
        throw new Error('Unable to get location');
      }

      console.log('Location obtained:', locationData);
      setLocation(locationData);
    } catch (err) {
      console.error('Error getting location:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      
      Alert.alert(
        'Location Error',
        'Unable to get your location. Please check your location permissions and try again.',
        [
          { text: 'OK' },
          { text: 'Retry', onPress: loadLocation }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const qiblaQuery = trpc.islamic.getQibla.useQuery(
    {
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
    },
    {
      enabled: !!location && location.latitude !== 0 && location.longitude !== 0,
      retry: 3,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (renamed from cacheTime in newer versions)
    }
  );

  useEffect(() => {
    if (qiblaQuery.data) {
      setQiblaData({
        direction: qiblaQuery.data.direction,
        distance: qiblaQuery.data.distance
      });
    }
  }, [qiblaQuery.data]);

  useEffect(() => {
    if (qiblaQuery.error) {
      console.error('Error loading qibla direction:', qiblaQuery.error);
      setError('Failed to calculate Qibla direction');
    }
  }, [qiblaQuery.error]);

  useEffect(() => {
    const initializeQibla = async () => {
      try {
        await loadLocation();
        // Ensure live mode is active by starting magnetometer immediately
        if (compassEnabled && Platform.OS !== 'web') {
          await startMagnetometer();
        }
      } catch (error) {
        console.error('Error initializing Qibla:', error);
        setError('Failed to initialize Qibla compass');
      }
    };
    
    initializeQibla();
    
    return () => {
      stopMagnetometer();
      if (calibrationTimeout.current) {
        clearTimeout(calibrationTimeout.current);
      }
    };
  }, []);

  // Restart magnetometer when compass mode changes
  useEffect(() => {
    if (compassEnabled) {
      startMagnetometer();
    } else {
      stopMagnetometer();
    }
  }, [compassEnabled]);

  const startMagnetometer = async () => {
    if (Platform.OS === 'web') {
      console.log('Magnetometer not available on web');
      return;
    }

    try {
      const isAvailable = await Magnetometer.isAvailableAsync();
      if (!isAvailable) {
        console.log('Magnetometer not available on this device');
        setCompassEnabled(false);
        return;
      }

      // Improved update interval for better performance
      Magnetometer.setUpdateInterval(200); // Update every 200ms for better battery life
      
      magnetometerSubscription.current = Magnetometer.addListener((data) => {
        try {
          // Enhanced heading calculation with smoothing
          const heading = Math.atan2(data.y, data.x) * (180 / Math.PI);
          const normalizedHeading = (heading + 360) % 360;
          
          // Apply simple smoothing to reduce jitter
          setDeviceHeading(prevHeading => {
            const diff = Math.abs(normalizedHeading - prevHeading);
            if (diff > 180) {
              // Handle wrap-around case
              const adjustedDiff = 360 - diff;
              return adjustedDiff < 5 ? prevHeading * 0.8 + normalizedHeading * 0.2 : normalizedHeading;
            }
            return diff < 5 ? prevHeading * 0.8 + normalizedHeading * 0.2 : normalizedHeading;
          });
          
          // Enhanced auto-calibration detection
          const magnitude = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
          const isGoodMagnitude = magnitude > 20 && magnitude < 80; // Wider range for better detection
          
          if (isGoodMagnitude && !isCalibrated) {
            setIsCalibrated(true);
            if (calibrationTimeout.current) {
              clearTimeout(calibrationTimeout.current);
            }
            calibrationTimeout.current = setTimeout(() => {
              setIsCalibrated(false);
            }, 15000); // Longer calibration validity period
          }
        } catch (error) {
          console.error('Error processing magnetometer data:', error);
        }
      });
    } catch (error) {
      console.error('Error starting magnetometer:', error);
      setCompassEnabled(false);
    }
  };

  const stopMagnetometer = () => {
    if (magnetometerSubscription.current) {
      magnetometerSubscription.current.remove();
      magnetometerSubscription.current = null;
    }
  };

  const calibrateCompass = () => {
    Alert.alert(
      'Compass Calibration',
      'To calibrate your compass:\n\n1. Hold your device flat\n2. Rotate it in a figure-8 pattern\n3. Move it away from metal objects\n4. The compass will auto-calibrate',
      [{ text: 'OK' }]
    );
  };

  const formatDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const formatDistance = (km: number): string => {
    if (km < 1000) {
      return `${Math.round(km)} km`;
    }
    return `${(km / 1000).toFixed(1)}k km`;
  };

  const renderCompass = () => {
    if (!qiblaData) return null;

    // Calculate the qibla direction relative to device heading
    // In live mode, the arrow should point to qibla relative to device orientation
    // Fix: Ensure proper direction calculation
    const qiblaDirection = compassEnabled ? 
      (qiblaData.direction - deviceHeading + 360) % 360 : // In live mode, adjust for device rotation with proper wrapping
      qiblaData.direction;  // In static mode, show absolute direction
    
    return (
      <View style={styles.compassContainer}>
        <View style={styles.compassOuter}>
          <LinearGradient
            colors={Colors.gradients.islamic as [string, string]}
            style={styles.compassGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Compass ring with markings */}
            <Animated.View 
              style={[
                styles.compassRing,
                compassEnabled && {
                  transform: [{ rotate: `${-deviceHeading}deg` }]
                }
              ]}
            >
              {/* Compass markings */}
              {Array.from({ length: 36 }, (_, i) => i * 10).map((angle, index) => (
                <View
                  key={angle}
                  style={[
                    styles.compassMark,
                    {
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                >
                  <View style={[
                    styles.mark, 
                    angle % 90 === 0 && styles.majorMark,
                    angle % 30 === 0 && angle % 90 !== 0 && styles.mediumMark
                  ]} />
                </View>
              ))}
              
              {/* Direction labels */}
              <Text style={[styles.directionLabel, styles.northLabel]}>N</Text>
              <Text style={[styles.directionLabel, styles.eastLabel]}>E</Text>
              <Text style={[styles.directionLabel, styles.southLabel]}>S</Text>
              <Text style={[styles.directionLabel, styles.westLabel]}>W</Text>
              
              {/* Degree markings */}
              <Text style={[styles.degreeLabel, { top: 25, left: '50%', marginLeft: -8 }]}>0°</Text>
              <Text style={[styles.degreeLabel, { right: 25, top: '50%', marginTop: -8 }]}>90°</Text>
              <Text style={[styles.degreeLabel, { bottom: 25, left: '50%', marginLeft: -12 }]}>180°</Text>
              <Text style={[styles.degreeLabel, { left: 25, top: '50%', marginTop: -8 }]}>270°</Text>
            </Animated.View>
            
            {/* Qibla arrow - always points to qibla */}
            <Animated.View
              style={[
                styles.qiblaArrow,
                {
                  transform: [{ rotate: `${qiblaDirection}deg` }],
                },
              ]}
            >
              <LinearGradient
                colors={['#D4AF37', '#FFD700']}
                style={styles.arrowGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <Navigation size={28} color={Colors.textOnPrimary} />
              </LinearGradient>
            </Animated.View>
            
            {/* Device direction indicator */}
            <View style={styles.deviceIndicator}>
              <View style={styles.deviceArrow} />
            </View>
            
            {/* Center dot */}
            <View style={styles.centerDot} />
            
            {/* Calibration status */}
            {compassEnabled && (
              <View style={[
                styles.calibrationStatus,
                { backgroundColor: isCalibrated ? Colors.success : Colors.warning }
              ]}>
                <View style={styles.calibrationDot} />
              </View>
            )}
          </LinearGradient>
        </View>
        
        {/* Compass controls */}
        <View style={styles.compassControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={calibrateCompass}
          >
            <Vibrate size={20} color={Colors.primary} />
            <Text style={styles.controlText}>Calibrate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setCompassEnabled(!compassEnabled)}
          >
            <Smartphone size={20} color={compassEnabled ? Colors.success : Colors.textSecondary} />
            <Text style={[styles.controlText, { color: compassEnabled ? Colors.success : Colors.textSecondary }]}>
              {compassEnabled ? 'Live' : 'Static'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradients.islamic as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Compass size={24} color={Colors.textOnPrimary} />
          <Text style={styles.title}>Qibla Direction</Text>
          <Text style={styles.subtitle}>Direction to Kaaba, Mecca</Text>
        </View>
      </LinearGradient>

      {loading && (
        <View style={styles.loadingContainer}>
          <RefreshCw size={48} color={Colors.primary} />
          <Text style={styles.loadingText}>Finding your location...</Text>
          <Text style={styles.loadingSubtext}>Please wait while we calculate the Qibla direction</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <MapPin size={48} color={Colors.error} />
          </View>
          <Text style={styles.errorTitle}>Location Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLocation}>
            <LinearGradient
              colors={Colors.gradients.primary as [string, string]}
              style={styles.retryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <RefreshCw size={20} color={Colors.textOnPrimary} />
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {qiblaData && location && !loading && (
        <View style={styles.content}>
          {/* Compass */}
          {renderCompass()}

          {/* Direction Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <LinearGradient
                colors={Colors.gradients.secondary as [string, string]}
                style={styles.infoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.infoTitle}>Qibla Direction</Text>
                <Text style={styles.infoValue}>
                  {Math.round(qiblaData.direction)}° {formatDirection(qiblaData.direction)}
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.infoCard}>
              <LinearGradient
                colors={Colors.gradients.accent as [string, string]}
                style={styles.infoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.infoTitle}>Distance to Kaaba</Text>
                <Text style={styles.infoValue}>{formatDistance(qiblaData.distance)}</Text>
              </LinearGradient>
            </View>
            
            {compassEnabled && (
              <>
                <View style={styles.infoCard}>
                  <LinearGradient
                    colors={['#4A90E2', '#357ABD']}
                    style={styles.infoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.infoTitle}>Device Heading</Text>
                    <Text style={styles.infoValue}>
                      {Math.round(deviceHeading)}° {formatDirection(deviceHeading)}
                    </Text>
                  </LinearGradient>
                </View>
                
                <View style={styles.infoCard}>
                  <LinearGradient
                    colors={isCalibrated ? ['#4CAF50', '#45A049'] : ['#FF9800', '#F57C00']}
                    style={styles.infoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.infoTitle}>Compass Status</Text>
                    <Text style={styles.infoValue}>
                      {isCalibrated ? 'Calibrated' : 'Needs Calibration'}
                    </Text>
                  </LinearGradient>
                </View>
              </>
            )}
          </View>

          {/* Location Info */}
          <View style={styles.locationContainer}>
            <View style={styles.locationHeader}>
              <MapPin size={16} color={Colors.primary} />
              <Text style={styles.locationTitle}>Your Location</Text>
            </View>
            <Text style={styles.locationText}>
              {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
            </Text>
            <Text style={styles.coordinatesText}>
              Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      )}
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
  compassContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  compassOuter: {
    width: width * 0.65,
    height: width * 0.65,
    maxWidth: 260,
    maxHeight: 260,
    borderRadius: (width * 0.65) / 2,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  compassGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  compassRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassMark: {
    position: 'absolute',
    width: 2,
    height: '50%',
    top: 0,
    left: '50%',
    marginLeft: -1,
  },
  mark: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  mediumMark: {
    width: 2,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  majorMark: {
    width: 3,
    height: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  directionLabel: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  degreeLabel: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  northLabel: {
    top: 20,
  },
  eastLabel: {
    right: 20,
  },
  southLabel: {
    bottom: 20,
  },
  westLabel: {
    left: 20,
  },
  qiblaArrow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  arrowGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  deviceIndicator: {
    position: 'absolute',
    top: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF4444',
  },
  centerDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textOnPrimary,
  },
  calibrationStatus: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calibrationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textOnPrimary,
  },
  compassControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  controlButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    minWidth: 80,
  },
  controlText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoGradient: {
    padding: 12,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
  },
  locationContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  coordinatesText: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: 'monospace',
  },
});