import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationSettings {
  prayerReminders: boolean;
  studyReminders: boolean;
  bookmarkReminders: boolean;
  dailyVerseReminder: boolean;
  prayerTimes: {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };
  studyReminderTime: string;
  dailyVerseTime: string;
  reminderSound: boolean;
  vibration: boolean;
  advanceNotice: number; // minutes before prayer time
}

export interface ScheduledNotification {
  id: string;
  type: 'prayer' | 'study' | 'bookmark' | 'daily-verse' | 'hafiz-review';
  title: string;
  body: string;
  scheduledTime: Date;
  data?: any;
  recurring?: boolean;
  prayerName?: string;
}

const STORAGE_KEYS = {
  NOTIFICATION_SETTINGS: 'notification_settings',
  SCHEDULED_NOTIFICATIONS: 'scheduled_notifications',
  NOTIFICATION_PERMISSIONS: 'notification_permissions',
};

const DEFAULT_SETTINGS: NotificationSettings = {
  prayerReminders: true,
  studyReminders: true,
  bookmarkReminders: false,
  dailyVerseReminder: true,
  prayerTimes: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  studyReminderTime: '20:00',
  dailyVerseTime: '08:00',
  reminderSound: true,
  vibration: true,
  advanceNotice: 10,
};

class NotificationService {
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private scheduledNotifications: ScheduledNotification[] = [];
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: this.settings.reminderSound,
          shouldSetBadge: true,
        }),
      });

      // Load settings
      await this.loadSettings();
      
      // Request permissions
      await this.requestPermissions();

      this.isInitialized = true;
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        console.log('Notifications not supported on web');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Store permission status
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PERMISSIONS, 'granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async loadSettings() {
    try {
      const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (settingsData) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsData) };
      }

      const notificationsData = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
      if (notificationsData) {
        this.scheduledNotifications = JSON.parse(notificationsData);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  async saveSettings(newSettings: Partial<NotificationSettings>) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(this.settings));
      
      // Reschedule notifications with new settings
      await this.rescheduleAllNotifications();
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  async saveScheduledNotifications() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, 
        JSON.stringify(this.scheduledNotifications)
      );
    } catch (error) {
      console.error('Error saving scheduled notifications:', error);
    }
  }

  async schedulePrayerNotifications(prayerTimes: {
    fajr: Date;
    dhuhr: Date;
    asr: Date;
    maghrib: Date;
    isha: Date;
  }) {
    if (!this.settings.prayerReminders || Platform.OS === 'web') return;

    try {
      // Cancel existing prayer notifications
      await this.cancelNotificationsByType('prayer');

      const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
      
      for (const prayerName of prayerNames) {
        if (!this.settings.prayerTimes[prayerName]) continue;

        const prayerTime = prayerTimes[prayerName];
        const notificationTime = new Date(prayerTime.getTime() - (this.settings.advanceNotice * 60 * 1000));

        // Only schedule if the time is in the future
        if (notificationTime > new Date()) {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `${this.getPrayerDisplayName(prayerName)} Prayer Time`,
              body: `${this.getPrayerDisplayName(prayerName)} prayer is in ${this.settings.advanceNotice} minutes`,
              sound: this.settings.reminderSound ? 'default' : undefined,
              data: {
                type: 'prayer',
                prayerName,
                prayerTime: prayerTime.toISOString(),
              },
            },
            trigger: {
              date: notificationTime,
            },
          });

          const scheduledNotification: ScheduledNotification = {
            id: notificationId,
            type: 'prayer',
            title: `${this.getPrayerDisplayName(prayerName)} Prayer Time`,
            body: `${this.getPrayerDisplayName(prayerName)} prayer is in ${this.settings.advanceNotice} minutes`,
            scheduledTime: notificationTime,
            prayerName,
            data: { prayerName, prayerTime: prayerTime.toISOString() },
          };

          this.scheduledNotifications.push(scheduledNotification);
        }
      }

      await this.saveScheduledNotifications();
      console.log(`Scheduled ${this.scheduledNotifications.filter(n => n.type === 'prayer').length} prayer notifications`);
    } catch (error) {
      console.error('Error scheduling prayer notifications:', error);
    }
  }

  async scheduleStudyReminder() {
    if (!this.settings.studyReminders || Platform.OS === 'web') return;

    try {
      // Cancel existing study reminders
      await this.cancelNotificationsByType('study');

      const [hours, minutes] = this.settings.studyReminderTime.split(':').map(Number);
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);

      // If the time has passed today, schedule for tomorrow
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Study Reminder',
          body: 'Time for your daily Quran study and memorization session',
          sound: this.settings.reminderSound ? 'default' : undefined,
          data: {
            type: 'study',
          },
        },
        trigger: {
          date: reminderTime,
          repeats: true,
        },
      });

      const scheduledNotification: ScheduledNotification = {
        id: notificationId,
        type: 'study',
        title: 'Study Reminder',
        body: 'Time for your daily Quran study and memorization session',
        scheduledTime: reminderTime,
        recurring: true,
      };

      this.scheduledNotifications.push(scheduledNotification);
      await this.saveScheduledNotifications();
      console.log('Scheduled daily study reminder');
    } catch (error) {
      console.error('Error scheduling study reminder:', error);
    }
  }

  async scheduleDailyVerseReminder() {
    if (!this.settings.dailyVerseReminder || Platform.OS === 'web') return;

    try {
      // Cancel existing daily verse reminders
      await this.cancelNotificationsByType('daily-verse');

      const [hours, minutes] = this.settings.dailyVerseTime.split(':').map(Number);
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);

      // If the time has passed today, schedule for tomorrow
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Verse',
          body: 'Discover today\'s verse for reflection and contemplation',
          sound: this.settings.reminderSound ? 'default' : undefined,
          data: {
            type: 'daily-verse',
          },
        },
        trigger: {
          date: reminderTime,
          repeats: true,
        },
      });

      const scheduledNotification: ScheduledNotification = {
        id: notificationId,
        type: 'daily-verse',
        title: 'Daily Verse',
        body: 'Discover today\'s verse for reflection and contemplation',
        scheduledTime: reminderTime,
        recurring: true,
      };

      this.scheduledNotifications.push(scheduledNotification);
      await this.saveScheduledNotifications();
      console.log('Scheduled daily verse reminder');
    } catch (error) {
      console.error('Error scheduling daily verse reminder:', error);
    }
  }

  async scheduleHafizReviewReminder(ayahsCount: number, nextReviewTime?: Date) {
    if (Platform.OS === 'web') return;

    try {
      const reviewTime = nextReviewTime || new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hafiz Review Time',
          body: `You have ${ayahsCount} ayahs ready for review to strengthen your memorization`,
          sound: this.settings.reminderSound ? 'default' : undefined,
          data: {
            type: 'hafiz-review',
            ayahsCount,
          },
        },
        trigger: {
          date: reviewTime,
        },
      });

      const scheduledNotification: ScheduledNotification = {
        id: notificationId,
        type: 'hafiz-review',
        title: 'Hafiz Review Time',
        body: `You have ${ayahsCount} ayahs ready for review to strengthen your memorization`,
        scheduledTime: reviewTime,
        data: { ayahsCount },
      };

      this.scheduledNotifications.push(scheduledNotification);
      await this.saveScheduledNotifications();
      console.log('Scheduled hafiz review reminder');
    } catch (error) {
      console.error('Error scheduling hafiz review reminder:', error);
    }
  }

  async scheduleBookmarkReminder(bookmarkTitle: string, reminderTime: Date) {
    if (!this.settings.bookmarkReminders || Platform.OS === 'web') return;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Bookmark Reminder',
          body: `Time to review: ${bookmarkTitle}`,
          sound: this.settings.reminderSound ? 'default' : undefined,
          data: {
            type: 'bookmark',
            bookmarkTitle,
          },
        },
        trigger: {
          date: reminderTime,
        },
      });

      const scheduledNotification: ScheduledNotification = {
        id: notificationId,
        type: 'bookmark',
        title: 'Bookmark Reminder',
        body: `Time to review: ${bookmarkTitle}`,
        scheduledTime: reminderTime,
        data: { bookmarkTitle },
      };

      this.scheduledNotifications.push(scheduledNotification);
      await this.saveScheduledNotifications();
      console.log('Scheduled bookmark reminder');
    } catch (error) {
      console.error('Error scheduling bookmark reminder:', error);
    }
  }

  async sendImmediateNotification(title: string, body: string, data?: any) {
    if (Platform.OS === 'web') {
      console.log(`Notification: ${title} - ${body}`);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: this.settings.reminderSound ? 'default' : undefined,
          data,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  async cancelNotificationsByType(type: ScheduledNotification['type']) {
    try {
      const notificationsToCancel = this.scheduledNotifications.filter(n => n.type === type);
      
      for (const notification of notificationsToCancel) {
        await Notifications.cancelScheduledNotificationAsync(notification.id);
      }

      this.scheduledNotifications = this.scheduledNotifications.filter(n => n.type !== type);
      await this.saveScheduledNotifications();
      
      console.log(`Cancelled ${notificationsToCancel.length} notifications of type: ${type}`);
    } catch (error) {
      console.error(`Error cancelling notifications of type ${type}:`, error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications = [];
      await this.saveScheduledNotifications();
      console.log('Cancelled all notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  async rescheduleAllNotifications() {
    try {
      // Cancel all existing notifications
      await this.cancelAllNotifications();

      // Reschedule based on current settings
      if (this.settings.studyReminders) {
        await this.scheduleStudyReminder();
      }

      if (this.settings.dailyVerseReminder) {
        await this.scheduleDailyVerseReminder();
      }

      console.log('Rescheduled all notifications');
    } catch (error) {
      console.error('Error rescheduling notifications:', error);
    }
  }

  async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    return this.scheduledNotifications;
  }

  getSettings(): NotificationSettings {
    return this.settings;
  }

  private getPrayerDisplayName(prayerName: string): string {
    const displayNames: { [key: string]: string } = {
      fajr: 'Fajr',
      dhuhr: 'Dhuhr',
      asr: 'Asr',
      maghrib: 'Maghrib',
      isha: 'Isha',
    };
    return displayNames[prayerName] || prayerName;
  }

  // Notification response handlers
  addNotificationResponseListener(handler: (response: Notifications.NotificationResponse) => void) {
    if (Platform.OS === 'web') return;
    
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  addNotificationReceivedListener(handler: (notification: Notifications.Notification) => void) {
    if (Platform.OS === 'web') return;
    
    return Notifications.addNotificationReceivedListener(handler);
  }

  // Utility methods for prayer time integration
  async updatePrayerTimesAndSchedule(prayerTimes: {
    fajr: Date;
    dhuhr: Date;
    asr: Date;
    maghrib: Date;
    isha: Date;
  }) {
    await this.schedulePrayerNotifications(prayerTimes);
  }

  // Badge management
  async setBadgeCount(count: number) {
    if (Platform.OS === 'web') return;
    
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  async clearBadge() {
    await this.setBadgeCount(0);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;