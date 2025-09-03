import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { trpc, trpcClient } from "@/lib/trpc";
import audioDownloadService from "@/services/audio-download-service";
import { HafizProvider } from "@/contexts/hafiz-context";
import { BookmarkProvider } from "@/contexts/bookmark-context";
import { PersonalizationProvider } from "@/contexts/personalization-context";
import notificationService from "@/services/notification-service";
import offlineService from "@/services/offline-service";
import cacheService from "@/services/cache-service";


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="surahs" options={{ title: "Holy Qur'an" }} />
      <Stack.Screen name="surah/[id]" options={{ title: "Surah" }} />
      <Stack.Screen name="qibla" options={{ title: "Qibla Direction" }} />
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
        // Initialize performance optimization services
        console.log('Initializing performance optimization services...');
        
        // Preload essential cached data
        cacheService.preloadEssentialData().catch(error => {
          console.error('Failed to preload essential cache data:', error);
        });
        
        // Initialize default reciters in the background
        audioDownloadService.initializeDefaultReciters().catch(error => {
          console.error('Failed to initialize default reciters:', error);
        });
        
        // Initialize notification service
        notificationService.initialize().catch(error => {
          console.error('Failed to initialize notification service:', error);
        });
        
        // Initialize offline service
        offlineService.preloadEssentialData().catch(error => {
          console.error('Failed to preload essential data:', error);
        });
        
        // Start resource monitoring
        console.log('Performance optimization services initialized');
        
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Error initializing app:', error);
        await SplashScreen.hideAsync();
      }
    };
    
    initializeApp();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <PersonalizationProvider>
          <BookmarkProvider>
            <HafizProvider>
              <GestureHandlerRootView>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </HafizProvider>
          </BookmarkProvider>
        </PersonalizationProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
