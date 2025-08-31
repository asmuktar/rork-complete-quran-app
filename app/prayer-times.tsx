import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { MapPin, Clock, RefreshCw, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LocationService, { LocationData } from '@/services/location-service';
import { getPrayerTimes, getIslamicDate } from '@/services/islamic-apis';

interface PrayerTime {
  name: string;
  time: string;
  arabic: string;
}

interface PrayerTimesData {
  date: string;
  hijriDate: string;
  location: string;
  times: PrayerTime[];
}

export default function PrayerTimesScreen() {
  const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationService = LocationService.getInstance();

  const loadPrayerTimes = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Get current location
      const currentLocation = await locationService.getCurrentLocation();
      setLocation(currentLocation);

      // Get prayer times
      const prayerTimes = await getPrayerTimes(
        currentLocation.latitude,
        currentLocation.longitude
      );

      // Get Islamic date
      const islamicDate = await getIslamicDate();

      // Format location string
      const locationString = currentLocation.city && currentLocation.country
        ? `${currentLocation.city}, ${currentLocation.country}`
        : LocationService.formatCoordinates(currentLocation.latitude, currentLocation.longitude);

      // Format prayer times
      const formattedTimes: PrayerTime[] = [
        { name: 'Fajr', time: prayerTimes.Fajr, arabic: 'الفجر' },
        { name: 'Sunrise', time: prayerTimes.Sunrise, arabic: 'الشروق' },
        { name: 'Dhuhr', time: prayerTimes.Dhuhr, arabic: 'الظهر' },
        { name: 'Asr', time: prayerTimes.Asr, arabic: 'العصر' },
        { name: 'Maghrib', time: prayerTimes.Maghrib, arabic: 'المغرب' },
        { name: 'Isha', time: prayerTimes.Isha, arabic: 'العشاء' },
      ];

      setPrayerData({
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        hijriDate: islamicDate.hijri,
        location: locationString,
        times: formattedTimes,
      });
    } catch (err) {
      console.error('Error loading prayer times:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prayer times');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationService]);

  const handleRetry = useCallback(() => {
    loadPrayerTimes();
  }, [loadPrayerTimes]);

  const handleRefresh = useCallback(() => {
    loadPrayerTimes(true);
  }, [loadPrayerTimes]);

  useEffect(() => {
    loadPrayerTimes();
  }, [loadPrayerTimes]);

  const getCurrentPrayer = useCallback((): { current: string; next: string } => {
    if (!prayerData) return { current: '', next: '' };

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayerMinutes = prayerData.times.map(prayer => {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      return { name: prayer.name, minutes: hours * 60 + minutes };
    });

    let current = 'Isha';
    let next = 'Fajr';

    for (let i = 0; i < prayerMinutes.length; i++) {
      if (currentTime >= prayerMinutes[i].minutes) {
        current = prayerMinutes[i].name;
        next = i < prayerMinutes.length - 1 ? prayerMinutes[i + 1].name : 'Fajr';
      } else {
        next = prayerMinutes[i].name;
        break;
      }
    }

    return { current, next };
  }, [prayerData]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Prayer Times' }} />
        <LinearGradient
          colors={['#1e3c72', '#2a5298']}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading prayer times...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Prayer Times' }} />
        <LinearGradient
          colors={['#1e3c72', '#2a5298']}
          style={styles.errorContainer}
        >
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <RefreshCw size={20} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const { current, next } = getCurrentPrayer();

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Prayer Times',
          headerStyle: { backgroundColor: '#1e3c72' },
          headerTintColor: '#fff',
        }} 
      />
      
      <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#fff"
              colors={['#fff']}
            />
          }
        >
          {/* Header Info */}
          <View style={styles.header}>
            <Text style={styles.dateText}>{prayerData?.date}</Text>
            <Text style={styles.hijriText}>{prayerData?.hijriDate}</Text>
            
            <View style={styles.locationContainer}>
              <MapPin size={16} color="#fff" />
              <Text style={styles.locationText}>{prayerData?.location}</Text>
            </View>
          </View>

          {/* Current Prayer Status */}
          <View style={styles.currentPrayerCard}>
            <Text style={styles.currentPrayerLabel}>Current Prayer</Text>
            <Text style={styles.currentPrayerName}>{current}</Text>
            <Text style={styles.nextPrayerText}>Next: {next}</Text>
          </View>

          {/* Prayer Times List */}
          <View style={styles.prayerTimesContainer}>
            {prayerData?.times.map((prayer, index) => (
              <View
                key={prayer.name}
                style={[
                  styles.prayerTimeCard,
                  prayer.name === current && styles.activePrayerCard,
                ]}
              >
                <View style={styles.prayerInfo}>
                  <Text style={[
                    styles.prayerName,
                    prayer.name === current && styles.activePrayerText
                  ]}>
                    {prayer.name}
                  </Text>
                  <Text style={[
                    styles.prayerArabic,
                    prayer.name === current && styles.activePrayerText
                  ]}>
                    {prayer.arabic}
                  </Text>
                </View>
                <View style={styles.timeContainer}>
                  <Clock size={16} color={prayer.name === current ? '#fff' : '#666'} />
                  <Text style={[
                    styles.prayerTime,
                    prayer.name === current && styles.activePrayerText
                  ]}>
                    {prayer.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Settings Note */}
          <View style={styles.settingsNote}>
            <Settings size={16} color="#ccc" />
            <Text style={styles.settingsText}>
              Prayer times calculated using standard methods. Adjust in settings if needed.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  dateText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  hijriText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  locationText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 6,
  },
  currentPrayerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  currentPrayerLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  currentPrayerName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  nextPrayerText: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
  },
  prayerTimesContainer: {
    paddingHorizontal: 20,
  },
  prayerTimeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  activePrayerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  prayerArabic: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 2,
  },
  activePrayerText: {
    color: '#fff',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerTime: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  settingsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  settingsText: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});