import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, MapPin, Settings, Bell, Sunrise, Sun, Sunset, Moon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import LocationService from '@/services/location-service';
import { getPrayerTimes, getIslamicDate } from '@/services/islamic-apis';

interface PrayerTime {
  name: string;
  time: string;
  arabicName: string;
  icon: any;
  isNext: boolean;
  isPassed: boolean;
}

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export default function PrayerTimesScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hijriDate, setHijriDate] = useState<string>('');

  useEffect(() => {
    loadLocation();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (location) {
      loadPrayerTimes();
      loadHijriDate();
    }
  }, [location]);

  const loadLocation = async () => {
    try {
      const locationService = LocationService.getInstance();
      const locationData = await locationService.getCurrentLocation();
      if (locationData) {
        // Address is already included in locationData from the service
        setLocation(locationData);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your location. Please enable location services.');
    } finally {
      setLoading(false);
    }
  };

  const loadPrayerTimes = async () => {
    if (!location) return;
    
    try {
      const times = await getPrayerTimes(location.latitude, location.longitude);
      setPrayerTimes(times);
    } catch (error) {
      console.error('Error loading prayer times:', error);
      Alert.alert('Error', 'Unable to load prayer times. Please try again.');
    }
  };

  const loadHijriDate = async () => {
    try {
      const dateData = await getIslamicDate();
      setHijriDate(dateData.hijri);

    } catch (error) {
      console.error('Error loading Hijri date:', error);
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isTimePassed = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const prayerTime = new Date();
    prayerTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return currentTime > prayerTime;
  };

  const getNextPrayer = (times: PrayerTimes) => {
    const prayers = [
      { name: 'Fajr', time: times.Fajr },
      { name: 'Dhuhr', time: times.Dhuhr },
      { name: 'Asr', time: times.Asr },
      { name: 'Maghrib', time: times.Maghrib },
      { name: 'Isha', time: times.Isha },
    ];

    for (const prayer of prayers) {
      if (!isTimePassed(prayer.time)) {
        return prayer.name;
      }
    }
    return 'Fajr'; // Next day's Fajr
  };

  const getPrayersList = (): PrayerTime[] => {
    if (!prayerTimes) return [];

    const nextPrayer = getNextPrayer(prayerTimes);

    return [
      {
        name: 'Fajr',
        time: formatTime(prayerTimes.Fajr),
        arabicName: 'الفجر',
        icon: Sunrise,
        isNext: nextPrayer === 'Fajr',
        isPassed: isTimePassed(prayerTimes.Fajr)
      },
      {
        name: 'Sunrise',
        time: formatTime(prayerTimes.Sunrise),
        arabicName: 'الشروق',
        icon: Sun,
        isNext: false,
        isPassed: isTimePassed(prayerTimes.Sunrise)
      },
      {
        name: 'Dhuhr',
        time: formatTime(prayerTimes.Dhuhr),
        arabicName: 'الظهر',
        icon: Sun,
        isNext: nextPrayer === 'Dhuhr',
        isPassed: isTimePassed(prayerTimes.Dhuhr)
      },
      {
        name: 'Asr',
        time: formatTime(prayerTimes.Asr),
        arabicName: 'العصر',
        icon: Sun,
        isNext: nextPrayer === 'Asr',
        isPassed: isTimePassed(prayerTimes.Asr)
      },
      {
        name: 'Maghrib',
        time: formatTime(prayerTimes.Maghrib),
        arabicName: 'المغرب',
        icon: Sunset,
        isNext: nextPrayer === 'Maghrib',
        isPassed: isTimePassed(prayerTimes.Maghrib)
      },
      {
        name: 'Isha',
        time: formatTime(prayerTimes.Isha),
        arabicName: 'العشاء',
        icon: Moon,
        isNext: nextPrayer === 'Isha',
        isPassed: isTimePassed(prayerTimes.Isha)
      },
    ];
  };

  const getCurrentTimeString = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCurrentDateString = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={Colors.gradients.ocean as [string, string]} style={styles.header}>
          <Text style={styles.title}>Prayer Times</Text>
          <Text style={styles.subtitle}>Loading your location...</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const prayers = getPrayersList();
  const nextPrayer = prayers.find(p => p.isNext);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Colors.gradients.ocean as [string, string]} style={styles.header}>
        <Text style={styles.title}>Prayer Times</Text>
        <Text style={styles.subtitle}>Stay connected with your prayers</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Time & Location */}
        <View style={styles.currentTimeCard}>
          <View style={styles.timeSection}>
            <Text style={styles.currentTime}>{getCurrentTimeString()}</Text>
            <Text style={styles.currentDate}>{getCurrentDateString()}</Text>
            {hijriDate && <Text style={styles.hijriDate}>{hijriDate}</Text>}
          </View>
          
          <View style={styles.locationSection}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.locationText}>
              {location?.address || `${location?.latitude.toFixed(2)}, ${location?.longitude.toFixed(2)}`}
            </Text>
          </View>
        </View>

        {/* Next Prayer */}
        {nextPrayer && (
          <View style={styles.nextPrayerCard}>
            <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
            <View style={styles.nextPrayerContent}>
              <View style={styles.nextPrayerIcon}>
                <nextPrayer.icon size={24} color={Colors.textOnPrimary} />
              </View>
              <View style={styles.nextPrayerInfo}>
                <Text style={styles.nextPrayerName}>{nextPrayer.name}</Text>
                <Text style={styles.nextPrayerArabic}>{nextPrayer.arabicName}</Text>
              </View>
              <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text>
            </View>
          </View>
        )}

        {/* Prayer Times List */}
        <View style={styles.prayersList}>
          <Text style={styles.sectionTitle}>Today&apos;s Prayer Times</Text>
          {prayers.map((prayer, index) => {
            const IconComponent = prayer.icon;
            return (
              <View 
                key={index} 
                style={[
                  styles.prayerCard,
                  prayer.isNext && styles.nextPrayerHighlight,
                  prayer.isPassed && styles.passedPrayer
                ]}
              >
                <View style={styles.prayerIcon}>
                  <IconComponent 
                    size={20} 
                    color={prayer.isNext ? Colors.textOnPrimary : Colors.primary} 
                  />
                </View>
                
                <View style={styles.prayerInfo}>
                  <Text style={[
                    styles.prayerName,
                    prayer.isNext && styles.nextPrayerText,
                    prayer.isPassed && styles.passedPrayerText
                  ]}>
                    {prayer.name}
                  </Text>
                  <Text style={[
                    styles.prayerArabic,
                    prayer.isNext && styles.nextPrayerText,
                    prayer.isPassed && styles.passedPrayerText
                  ]}>
                    {prayer.arabicName}
                  </Text>
                </View>
                
                <View style={styles.prayerTimeContainer}>
                  <Text style={[
                    styles.prayerTime,
                    prayer.isNext && styles.nextPrayerText,
                    prayer.isPassed && styles.passedPrayerText
                  ]}>
                    {prayer.time}
                  </Text>
                  {prayer.isPassed && (
                    <Text style={styles.passedLabel}>Passed</Text>
                  )}
                  {prayer.isNext && (
                    <Text style={styles.nextLabel}>Next</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Bell size={20} color={Colors.primary} />
            <Text style={styles.actionText}>Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Settings size={20} color={Colors.primary} />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>&quot;And establish prayer and give zakah and bow with those who bow&quot;</Text>
          <Text style={styles.footerSubtext}>- Quran 2:43</Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currentTimeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timeSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  currentTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  currentDate: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  hijriDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 8,
    textAlign: 'center',
  },
  nextPrayerCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nextPrayerLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    textAlign: 'center',
  },
  nextPrayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextPrayerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nextPrayerInfo: {
    flex: 1,
  },
  nextPrayerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    marginBottom: 4,
  },
  nextPrayerArabic: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  nextPrayerTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
  },
  prayersList: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  prayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  nextPrayerHighlight: {
    backgroundColor: Colors.primary,
    elevation: 3,
    shadowOpacity: 0.2,
  },
  passedPrayer: {
    opacity: 0.6,
  },
  prayerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  prayerArabic: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  prayerTimeContainer: {
    alignItems: 'flex-end',
  },
  prayerTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  nextPrayerText: {
    color: Colors.textOnPrimary,
  },
  passedPrayerText: {
    color: Colors.textLight,
  },
  nextLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  passedLabel: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 2,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  actionText: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 8,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: Colors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
});