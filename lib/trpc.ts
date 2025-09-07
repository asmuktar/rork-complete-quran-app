import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Return null when no backend URL is configured
  // This will cause network requests to fail gracefully
  return null;
};

const baseUrl = getBaseUrl();

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: baseUrl ? `${baseUrl}/api/trpc` : 'http://localhost:3000/api/trpc',
      transformer: superjson,
      fetch: async (url, options) => {
        // If no backend URL is configured, return empty responses
        if (!baseUrl) {
          console.log('🔄 Backend not configured, using local data only');
          throw new Error('Backend not available - using local data');
        }
        return fetch(url, options);
      },
    }),
  ],
});