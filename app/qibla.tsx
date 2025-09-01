import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Compass, MapPin, Navigation, RefreshCw } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { getLocation } from '@/services/location-service';
import { trpc } from '@/lib/trpc';

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
      enabled: !!location,
      retry: 2,
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
    loadLocation();
  }, []);

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

    const rotation = qiblaData.direction;
    
    return (
      <View style={styles.compassContainer}>
        <View style={styles.compassOuter}>
          <LinearGradient
            colors={Colors.gradients.islamic as [string, string]}
            style={styles.compassGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Compass markings */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
              <View
                key={angle}
                style={[
                  styles.compassMark,
                  {
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              >
                <View style={[styles.mark, index % 2 === 0 && styles.majorMark]} />
              </View>
            ))}
            
            {/* Direction labels */}
            <Text style={[styles.directionLabel, styles.northLabel]}>N</Text>
            <Text style={[styles.directionLabel, styles.eastLabel]}>E</Text>
            <Text style={[styles.directionLabel, styles.southLabel]}>S</Text>
            <Text style={[styles.directionLabel, styles.westLabel]}>W</Text>
            
            {/* Qibla arrow */}
            <View
              style={[
                styles.qiblaArrow,
                {
                  transform: [{ rotate: `${rotation}deg` }],
                },
              ]}
            >
              <LinearGradient
                colors={['#D4AF37', '#FFD700']}
                style={styles.arrowGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <Navigation size={32} color={Colors.textOnPrimary} />
              </LinearGradient>
            </View>
            
            {/* Center dot */}
            <View style={styles.centerDot} />
          </LinearGradient>
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
          <Compass size={32} color={Colors.textOnPrimary} />
          <Text style={styles.title}>Qibla Direction</Text>
          <Text style={styles.subtitle}>Direction to Kaaba, Mecca</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
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
          <>
            {/* Compass */}
            {renderCompass()}

            {/* Direction Info */}
            <View style={styles.infoContainer}>
              <View style={styles.infoCard}>
                <LinearGradient
                  colors={Colors.gradients.secondary as [string, string]}
                  style={styles.infoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.infoTitle}>Direction</Text>
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
                  <Text style={styles.infoTitle}>Distance</Text>
                  <Text style={styles.infoValue}>{formatDistance(qiblaData.distance)}</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Location Info */}
            <View style={styles.locationContainer}>
              <View style={styles.locationHeader}>
                <MapPin size={20} color={Colors.primary} />
                <Text style={styles.locationTitle}>Your Location</Text>
              </View>
              <Text style={styles.locationText}>
                {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
              </Text>
              <Text style={styles.coordinatesText}>
                Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
              </Text>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>How to Use</Text>
              <Text style={styles.instructionsText}>
                • Hold your device flat and point it in the direction shown by the golden arrow
              </Text>
              <Text style={styles.instructionsText}>
                • The arrow points toward the Kaaba in Mecca, Saudi Arabia
              </Text>
              <Text style={styles.instructionsText}>
                • For best accuracy, calibrate your device&apos;s compass if needed
              </Text>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    marginVertical: 30,
  },
  compassOuter: {
    width: width * 0.7,
    height: width * 0.7,
    maxWidth: 280,
    maxHeight: 280,
    borderRadius: (width * 0.7) / 2,
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
  compassMark: {
    position: 'absolute',
    width: 2,
    height: '50%',
    top: 0,
    left: '50%',
    marginLeft: -1,
  },
  mark: {
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  majorMark: {
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  directionLabel: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
  },
  northLabel: {
    top: 15,
  },
  eastLabel: {
    right: 15,
  },
  southLabel: {
    bottom: 15,
  },
  westLabel: {
    left: 15,
  },
  qiblaArrow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  arrowGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textOnPrimary,
  },
  infoContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoGradient: {
    padding: 20,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
  },
  locationContainer: {
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
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  locationText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: 'monospace',
  },
  instructionsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.islamicGold,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
});