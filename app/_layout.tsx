import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { trpc, trpcClient } from "@/lib/trpc";

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
      <Stack.Screen name="hadith-verify" options={{ title: "Verify Hadith" }} />
      <Stack.Screen name="hadith-search" options={{ title: "Search Hadith" }} />
      <Stack.Screen name="hadith/[id]" options={{ title: "Hadith Collection" }} />
      <Stack.Screen name="bookmarks" options={{ title: "Bookmarks" }} />
      <Stack.Screen name="favorites" options={{ title: "Favorites" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="about" options={{ title: "About" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
