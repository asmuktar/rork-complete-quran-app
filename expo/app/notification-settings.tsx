import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Clock, Volume2, Vibrate, Settings, Moon, Sun, BookOpen, Heart, AlertTriangle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import notificationService, { NotificationSettings } from '@/services/notification-service';
import { useHafiz } from '@/contexts/hafiz-context';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const [isLoading, setIsLoading] = useState(false);
  const { dueForReview } = useHafiz();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const currentSettings = notificationService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await notificationService.saveSettings(newSettings);
      
      // Show confirmation
      if (key === 'prayerReminders' && value) {
        Alert.alert(
          'Prayer Reminders Enabled',
          'You will receive notifications before each prayer time. Make sure to enable location services for accurate prayer times.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error updating notification setting:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const updatePrayerTimeSetting = async (prayer: keyof NotificationSettings['prayerTimes'], enabled: boolean) => {
    const newPrayerTimes = { ...settings.prayerTimes, [prayer]: enabled };
    await updateSetting('prayerTimes', newPrayerTimes);
  };

  const testNotification = async () => {
    try {
      await notificationService.sendImmediateNotification(
        'Test Notification',
        'This is a test notification to check if notifications are working properly.',
        { type: 'test' }
      );
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const scheduleHafizReminder = async () => {
    if (dueForReview.length > 0) {
      await notificationService.scheduleHafizReviewReminder(dueForReview.length);
      Alert.alert(
        'Reminder Scheduled',
        `You'll be reminded to review ${dueForReview.length} ayahs in 2 hours.`
      );
    } else {
      Alert.alert('No Reviews Due', 'You have no ayahs due for review at the moment.');
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getPrayerDisplayName = (prayer: string) => {
    const names: { [key: string]: string } = {
      fajr: 'Fajr',
      dhuhr: 'Dhuhr',
      asr: 'Asr',
      maghrib: 'Maghrib',
      isha: 'Isha',
    };
    return names[prayer] || prayer;
  };

  const getPrayerIcon = (prayer: string) => {
    switch (prayer) {
      case 'fajr': return Moon;
      case 'dhuhr': return Sun;
      case 'asr': return Sun;
      case 'maghrib': return Moon;
      case 'isha': return Moon;
      default: return Clock;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Colors.gradients.primary as [string, string]} style={styles.header}>
        <View style={styles.headerContent}>
          <Bell size={28} color={Colors.textOnPrimary} />
          <Text style={styles.title}>Notification Settings</Text>
          <Text style={styles.subtitle}>
            Customize your prayer and study reminders
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Expo Go Warning */}
        {(Platform.OS !== 'web' && isExpoGo) && (
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <AlertTriangle size={20} color={Colors.warning} />
              <Text style={styles.warningTitle}>Limited Functionality in Expo Go</Text>
            </View>
            <Text style={styles.warningText}>
              Notifications are limited in Expo Go SDK 53+. For full notification functionality including scheduled reminders and push notifications, please use a development build.
            </Text>
            <Text style={styles.warningSubtext}>
              Settings will be saved but notifications may not work as expected.
            </Text>
          </View>
        )}

        {/* Prayer Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prayer Reminders</Text>
          <Text style={styles.sectionDescription}>
            Get notified before each prayer time
          </Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Bell size={20} color={Colors.primary} />
                <Text style={styles.settingLabel}>Enable Prayer Reminders</Text>
              </View>
              <Switch
                value={settings.prayerReminders}
                onValueChange={(value) => updateSetting('prayerReminders', value)}
                trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryOverlay }}
                thumbColor={settings.prayerReminders ? Colors.primary : Colors.textLight}
              />
            </View>
          </View>

          {settings.prayerReminders && (
            <>
              <View style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Clock size={20} color={Colors.primary} />
                    <Text style={styles.settingLabel}>Advance Notice</Text>
                    <Text style={styles.settingSubLabel}>{settings.advanceNotice} minutes before</Text>
                  </View>
                </View>
              </View>

              <View style={styles.prayerTimesCard}>
                <Text style={styles.cardTitle}>Prayer Times</Text>
                {Object.entries(settings.prayerTimes).map(([prayer, enabled]) => {
                  const Icon = getPrayerIcon(prayer);
                  return (
                    <View key={prayer} style={styles.prayerRow}>
                      <View style={styles.prayerInfo}>
                        <Icon size={18} color={Colors.primary} />
                        <Text style={styles.prayerName}>{getPrayerDisplayName(prayer)}</Text>
                      </View>
                      <Switch
                        value={enabled}
                        onValueChange={(value) => updatePrayerTimeSetting(prayer as keyof NotificationSettings['prayerTimes'], value)}
                        trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryOverlay }}
                        thumbColor={enabled ? Colors.primary : Colors.textLight}
                        style={styles.prayerSwitch}
                      />
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Study Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Reminders</Text>
          <Text style={styles.sectionDescription}>
            Daily reminders for Quran study and memorization
          </Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <BookOpen size={20} color={Colors.primary} />
                <Text style={styles.settingLabel}>Daily Study Reminder</Text>
                <Text style={styles.settingSubLabel}>at {formatTime(settings.studyReminderTime)}</Text>
              </View>
              <Switch
                value={settings.studyReminders}
                onValueChange={(value) => updateSetting('studyReminders', value)}
                trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryOverlay }}
                thumbColor={settings.studyReminders ? Colors.primary : Colors.textLight}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Heart size={20} color={Colors.primary} />
                <Text style={styles.settingLabel}>Daily Verse Reminder</Text>
                <Text style={styles.settingSubLabel}>at {formatTime(settings.dailyVerseTime)}</Text>
              </View>
              <Switch
                value={settings.dailyVerseReminder}
                onValueChange={(value) => updateSetting('dailyVerseReminder', value)}
                trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryOverlay }}
                thumbColor={settings.dailyVerseReminder ? Colors.primary : Colors.textLight}
              />
            </View>
          </View>
        </View>

        {/* Hafiz Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hafiz Reminders</Text>
          <Text style={styles.sectionDescription}>
            Spaced repetition reminders for memorization
          </Text>

          <View style={styles.hafizCard}>
            <View style={styles.hafizInfo}>
              <Text style={styles.hafizTitle}>Review Due</Text>
              <Text style={styles.hafizCount}>{dueForReview.length} ayahs</Text>
              <Text style={styles.hafizDescription}>
                {dueForReview.length > 0 
                  ? 'You have ayahs ready for review to strengthen your memorization'
                  : 'No ayahs due for review at the moment'
                }
              </Text>
            </View>
            {dueForReview.length > 0 && (
              <TouchableOpacity style={styles.hafizButton} onPress={scheduleHafizReminder}>
                <Text style={styles.hafizButtonText}>Schedule Reminder</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notification Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Volume2 size={20} color={Colors.primary} />
                <Text style={styles.settingLabel}>Sound</Text>
              </View>
              <Switch
                value={settings.reminderSound}
                onValueChange={(value) => updateSetting('reminderSound', value)}
                trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryOverlay }}
                thumbColor={settings.reminderSound ? Colors.primary : Colors.textLight}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Vibrate size={20} color={Colors.primary} />
                <Text style={styles.settingLabel}>Vibration</Text>
              </View>
              <Switch
                value={settings.vibration}
                onValueChange={(value) => updateSetting('vibration', value)}
                trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryOverlay }}
                thumbColor={settings.vibration ? Colors.primary : Colors.textLight}
              />
            </View>
          </View>
        </View>

        {/* Test Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test & Troubleshoot</Text>
          
          <TouchableOpacity style={styles.testButton} onPress={testNotification}>
            <LinearGradient
              colors={Colors.gradients.accent as [string, string]}
              style={styles.testGradient}
            >
              <Settings size={20} color={Colors.textOnPrimary} />
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          <Text style={styles.tipsText}>
            • Enable location services for accurate prayer times{'\n'}
            • Notifications work best when the app is allowed to run in background{'\n'}
            • Adjust advance notice time based on your preparation needs{'\n'}
            • Use study reminders to build consistent learning habits{'\n'}
            • Hafiz reminders use spaced repetition for optimal memorization
            {isExpoGo && '\n• For full notification support, use a development build instead of Expo Go'}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            &quot;And establish prayer and give zakah and bow with those who bow&quot;
          </Text>
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
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  settingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  settingSubLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  prayerTimesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  prayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prayerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  prayerSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  hafizCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.islamicGold,
  },
  hafizInfo: {
    marginBottom: 16,
  },
  hafizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  hafizCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  hafizDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  hafizButton: {
    backgroundColor: Colors.primaryOverlay,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  hafizButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  testButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
  tipsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
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
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  warningCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warning,
  },
  warningText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  warningSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});