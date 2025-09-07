import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { trpc, trpcClient } from "@/lib/trpc";
import { audioDownloadService } from "@/services/audio-download-service";
import { HafizProvider } from "@/contexts/hafiz-context";
import { BookmarkProvider } from "@/contexts/bookmark-context";
import { PersonalizationProvider } from "@/contexts/personalization-context";
import { notificationService } from "@/services/notification-service";
import { offlineService } from "@/services/offline-service";
import { cacheService } from "@/services/cache-service";


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry network errors when backend is not available
        if (error instanceof Error && error.message.includes('Backend not available')) {
          return false;
        }
        // Retry other errors up to 2 times
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false, // Don't retry mutations
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="surahs" options={{ title: "Holy Qur'an" }} />
      <Stack.Screen name="surah/[id]" options={{ title: "Surah" }} />

      <Stack.Screen name="calendar" options={{ title: "Islamic Calendar" }} />
      <Stack.Screen name="reciters" options={{ title: "Quran Reciters" }} />
      <Stack.Screen name="reciter/[id]" options={{ title: "Reciter Profile" }} />
      <Stack.Screen name="verify-hadith" options={{ title: "Verify Hadith" }} />
      <Stack.Screen name="advanced-hadith-search" options={{ title: "Advanced Hadith Search" }} />
      <Stack.Screen name="hadith-collections" options={{ title: "Hadith Collections" }} />
      <Stack.Screen name="hadith-collection/[id]" options={{ title: "Hadith Collection" }} />
      <Stack.Screen name="bookmarks" options={{ title: "Bookmarks" }} />

      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="notification-settings" options={{ title: "Notifications" }} />

      <Stack.Screen name="hafiz-dashboard" options={{ title: "Hafiz Dashboard" }} />
      <Stack.Screen name="performance" options={{ title: "Performance Monitor" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        
        // Minimal initialization - just hide splash screen quickly
        setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
            console.log('✅ App loaded successfully');
          } catch (error) {
            console.error('Error hiding splash screen:', error);
          }
        }, 1000);
        
        // Initialize services in background (completely non-blocking)
        setTimeout(() => {
          console.log('🔄 Starting background services...');
          
          // Cache service
          cacheService.preloadEssentialData().catch(error => {
            console.log('⚠️ Cache service skipped:', error.message);
          });
          
          // Notification service
          notificationService.initialize().catch(error => {
            console.log('⚠️ Notifications not available (expected in Expo Go)');
          });
          
          // Audio service
          audioDownloadService.initializeDefaultReciters().catch(error => {
            console.log('⚠️ Audio service skipped:', error.message);
          });
          
          // Offline service
          offlineService.preloadEssentialData().catch(error => {
            console.log('⚠️ Offline service skipped:', error.message);
          });
          
          console.log('✅ Background services started');
        }, 2000);
        
      } catch (error) {
        console.error('❌ App initialization error:', error);
        // Still try to hide splash screen
        try {
          await SplashScreen.hideAsync();
        } catch (splashError) {
          console.error('Error hiding splash screen:', splashError);
        }
      }
    };
    
    initializeApp();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PersonalizationProvider>
            <BookmarkProvider>
              <HafizProvider>
                <RootLayoutNav />
              </HafizProvider>
            </BookmarkProvider>
          </PersonalizationProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
