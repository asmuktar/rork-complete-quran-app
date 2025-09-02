import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Moon, Star, RefreshCw } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';

interface IslamicEvent {
  name: string;
  arabicName: string;
  date: string;
  description: string;
  type: 'major' | 'minor';
}

const ISLAMIC_EVENTS: IslamicEvent[] = [
  {
    name: 'Ramadan',
    arabicName: 'رمضان',
    date: '1 Ramadan 1446',
    description: 'The holy month of fasting',
    type: 'major'
  },
  {
    name: 'Eid al-Fitr',
    arabicName: 'عيد الفطر',
    date: '1 Shawwal 1446',
    description: 'Festival of breaking the fast',
    type: 'major'
  },
  {
    name: 'Eid al-Adha',
    arabicName: 'عيد الأضحى',
    date: '10 Dhul Hijjah 1446',
    description: 'Festival of sacrifice',
    type: 'major'
  },
  {
    name: 'Hajj',
    arabicName: 'الحج',
    date: '8-13 Dhul Hijjah 1446',
    description: 'Annual pilgrimage to Mecca',
    type: 'major'
  },
  {
    name: 'Muharram',
    arabicName: 'محرم',
    date: '1 Muharram 1446',
    description: 'Islamic New Year',
    type: 'minor'
  },
  {
    name: 'Ashura',
    arabicName: 'عاشوراء',
    date: '10 Muharram 1446',
    description: 'Day of Ashura',
    type: 'minor'
  }
];

export default function IslamicCalendarScreen() {
  const [currentHijriDate, setCurrentHijriDate] = useState<string>('');
  const [currentGregorianDate, setCurrentGregorianDate] = useState<string>('');

  const calendarQuery = trpc.islamic.getCalendar.useQuery(
    { date: new Date().toISOString().split('T')[0] },
    {
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );

  const eventsQuery = trpc.islamic.getEvents.useQuery(
    { year: new Date().getFullYear() },
    {
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (calendarQuery.data?.hijri) {
      setCurrentHijriDate(`${calendarQuery.data.hijri.day} ${calendarQuery.data.hijri.month.en} ${calendarQuery.data.hijri.year} AH`);
      setCurrentGregorianDate(calendarQuery.data.gregorian.date);
    }
  }, [calendarQuery.data]);

  useEffect(() => {
    if (calendarQuery.error) {
      console.error('Error loading Islamic date:', calendarQuery.error);
    }
  }, [calendarQuery.error]);

  const loadCurrentDate = () => {
    calendarQuery.refetch();
    eventsQuery.refetch();
  };

  const formatGregorianDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
          <Calendar size={28} color={Colors.textOnPrimary} />
          <Text style={styles.title}>Islamic Calendar</Text>
          <Text style={styles.subtitle}>Hijri Dates & Events</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Date */}
        <View style={styles.currentDateCard}>
          {calendarQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <RefreshCw size={24} color={Colors.primary} />
              <Text style={styles.loadingText}>Loading date...</Text>
            </View>
          ) : (
            <>
              <View style={styles.dateSection}>
                <Text style={styles.hijriDate}>{currentHijriDate}</Text>
                <Text style={styles.gregorianDate}>
                  {currentGregorianDate ? formatGregorianDate(currentGregorianDate) : new Date().toLocaleDateString()}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.refreshButton} 
                onPress={loadCurrentDate}
                disabled={calendarQuery.isLoading}
              >
                <RefreshCw size={16} color={Colors.primary} />
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Islamic Months */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Islamic Months</Text>
          <View style={styles.monthsGrid}>
            {[
              { name: 'Muharram', arabic: 'محرم' },
              { name: 'Safar', arabic: 'صفر' },
              { name: 'Rabi al-Awwal', arabic: 'ربيع الأول' },
              { name: 'Rabi al-Thani', arabic: 'ربيع الثاني' },
              { name: 'Jumada al-Awwal', arabic: 'جمادى الأول' },
              { name: 'Jumada al-Thani', arabic: 'جمادى الثاني' },
              { name: 'Rajab', arabic: 'رجب' },
              { name: 'Shaban', arabic: 'شعبان' },
              { name: 'Ramadan', arabic: 'رمضان' },
              { name: 'Shawwal', arabic: 'شوال' },
              { name: 'Dhul Qadah', arabic: 'ذو القعدة' },
              { name: 'Dhul Hijjah', arabic: 'ذو الحجة' }
            ].map((month, index) => (
              <View key={index} style={styles.monthCard}>
                <Text style={styles.monthNumber}>{index + 1}</Text>
                <Text style={styles.monthName}>{month.name}</Text>
                <Text style={styles.monthArabic}>{month.arabic}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Important Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Important Islamic Events</Text>
            {eventsQuery.isLoading && (
              <Text style={styles.loadingText}>Loading...</Text>
            )}
            {eventsQuery.error && (
              <Text style={styles.errorText}>Failed to load events</Text>
            )}
          </View>
          
          {eventsQuery.data ? (
            eventsQuery.data.map((event, index) => (
              <View key={index} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventIcon}>
                    {event.type === 'celebration' ? (
                      <Star size={20} color={Colors.islamicGold} />
                    ) : (
                      <Moon size={20} color={Colors.primary} />
                    )}
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventName}>{event.name}</Text>
                    <Text style={styles.eventDate}>{new Date(event.date).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.eventType}>{event.type}</Text>
                </View>
              </View>
            ))
          ) : (
            ISLAMIC_EVENTS.map((event, index) => (
              <View key={index} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventIcon}>
                    {event.type === 'major' ? (
                      <Star size={20} color={Colors.islamicGold} />
                    ) : (
                      <Moon size={20} color={Colors.primary} />
                    )}
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventName}>{event.name}</Text>
                    <Text style={styles.eventArabicName}>{event.arabicName}</Text>
                  </View>
                  <Text style={styles.eventDate}>{event.date}</Text>
                </View>
                <Text style={styles.eventDescription}>{event.description}</Text>
              </View>
            ))
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About the Islamic Calendar</Text>
          <Text style={styles.infoText}>
            The Islamic calendar is a lunar calendar consisting of 12 months in a year of 354 or 355 days. 
            It is used to determine the proper days of Islamic holidays and rituals, such as the annual 
            period of fasting and the proper time for the Hajj.
          </Text>
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
  },
  currentDateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dateSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  hijriDate: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  gregorianDate: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  refreshText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  monthCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '30%',
    minWidth: 100,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  monthNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  monthName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  monthArabic: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.islamicGold,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  eventArabicName: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  eventDate: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  eventType: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error || '#ff4444',
  },
  eventDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});