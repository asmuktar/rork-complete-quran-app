import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Check if we're in Expo Go - notifications are limited in Expo Go SDK 53+
const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

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
      // Load settings first
      await this.loadSettings();
      
      if (Platform.OS !== 'web' && !isExpoGo) {
        // Configure notification behavior (only in development builds)
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: this.settings.reminderSound,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        
        // Request permissions
        await this.requestPermissions();
        // Notification service initialized with full functionality
      } else if (isExpoGo) {
        // Notifications are limited in Expo Go SDK 53+ - use development build for full functionality
      } else {
        // Notifications disabled on web platform
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      // Don't throw error, just log it to prevent app crashes
      this.isInitialized = true;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        console.log('Notifications not supported on web platform');
        return false;
      }
      
      if (isExpoGo) {
        // Push notifications require a development build - Expo Go SDK 53+ has limited notification support
        // Still try to get permissions for basic functionality
        try {
          const { status } = await Notifications.getPermissionsAsync();
          return status === 'granted';
        } catch {
          return false;
        }
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        // Notification permissions not granted
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
    if (!this.settings.prayerReminders || Platform.OS === 'web' || isExpoGo) {
      // Prayer notifications require development build - not available in Expo Go
      return;
    }

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
            trigger: notificationTime as any,
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
      // Scheduled prayer notifications
    } catch (error) {
      console.error('Error scheduling prayer notifications:', error);
    }
  }

  async scheduleStudyReminder() {
    if (!this.settings.studyReminders || Platform.OS === 'web' || isExpoGo) {
      // Study reminders require development build - not available in Expo Go
      return;
    }

    try {
      // Cancel existing study reminders
      await this.cancelNotificationsByType('study');

      const [hours, minutes] = this.settings.studyReminderTime.split(':').map(Number);

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
          hour: hours,
          minute: minutes,
          repeats: true,
        } as any,
      });

      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);

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
      // Scheduled daily study reminder
    } catch (error) {
      console.error('Error scheduling study reminder:', error);
    }
  }

  async scheduleDailyVerseReminder() {
    if (!this.settings.dailyVerseReminder || Platform.OS === 'web' || isExpoGo) {
      // Daily verse reminders require development build - not available in Expo Go
      return;
    }

    try {
      // Cancel existing daily verse reminders
      await this.cancelNotificationsByType('daily-verse');

      const [hours, minutes] = this.settings.dailyVerseTime.split(':').map(Number);

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
          hour: hours,
          minute: minutes,
          repeats: true,
        } as any,
      });

      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);

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
      // Scheduled daily verse reminder
    } catch (error) {
      console.error('Error scheduling daily verse reminder:', error);
    }
  }

  async scheduleHafizReviewReminder(ayahsCount: number, nextReviewTime?: Date) {
    if (Platform.OS === 'web' || isExpoGo) {
      // Hafiz review reminders require development build - not available in Expo Go
      return;
    }

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
        trigger: reviewTime as any,
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
      // Scheduled hafiz review reminder
    } catch (error) {
      console.error('Error scheduling hafiz review reminder:', error);
    }
  }

  async scheduleBookmarkReminder(bookmarkTitle: string, reminderTime: Date) {
    if (!this.settings.bookmarkReminders || Platform.OS === 'web' || isExpoGo) {
      // Bookmark reminders require development build - not available in Expo Go
      return;
    }

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
        trigger: reminderTime as any,
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
      // Scheduled bookmark reminder
    } catch (error) {
      console.error('Error scheduling bookmark reminder:', error);
    }
  }

  async sendImmediateNotification(title: string, body: string, data?: any) {
    if (Platform.OS === 'web') {
      // Web notification: ${title} - ${body}
      return;
    }
    
    if (isExpoGo) {
      // Expo Go notification: ${title} - ${body} (install development build for actual notifications)
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
    if (Platform.OS === 'web' || isExpoGo) return;
    
    try {
      const notificationsToCancel = this.scheduledNotifications.filter(n => n.type === type);
      
      for (const notification of notificationsToCancel) {
        await Notifications.cancelScheduledNotificationAsync(notification.id);
      }

      this.scheduledNotifications = this.scheduledNotifications.filter(n => n.type !== type);
      await this.saveScheduledNotifications();
      
      // Cancelled notifications of type: ${type}
    } catch (error) {
      console.error(`Error cancelling notifications of type ${type}:`, error);
    }
  }

  async cancelAllNotifications() {
    if (Platform.OS === 'web' || isExpoGo) return;
    
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications = [];
      await this.saveScheduledNotifications();
      // Cancelled all notifications
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

      // Rescheduled all notifications
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
    if (Platform.OS === 'web' || isExpoGo) return;
    
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  addNotificationReceivedListener(handler: (notification: Notifications.Notification) => void) {
    if (Platform.OS === 'web' || isExpoGo) return;
    
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
    if (Platform.OS === 'web' || isExpoGo) return;
    
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