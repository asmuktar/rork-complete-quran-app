import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, httpLink } from "@trpc/client";
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

// Enhanced fetch with concurrent request handling
const enhancedFetch = async (url: string | URL | Request, options?: RequestInit) => {
  // If no backend URL is configured, return empty responses
  if (!baseUrl) {
    console.log('🔄 Backend not configured, using local data only');
    throw new Error('Backend not available - using local data');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Default export uses batched client for better performance
export const trpcClient = trpc.createClient({
  links: [
    // Use batch link for better concurrent request handling
    httpBatchLink({
      url: baseUrl ? `${baseUrl}/api/trpc` : 'http://localhost:3000/api/trpc',
      transformer: superjson,
      fetch: enhancedFetch,
      // Batch multiple requests together
      maxURLLength: 2083,
      // Headers for better concurrent handling
      headers: () => ({
        'X-Client-Type': 'mobile-app',
        'X-Concurrent-Requests': 'enabled',
      }),
    }),
  ],
});

// Alternative client without batching for specific use cases
export const trpcClientNoBatch = trpc.createClient({
  links: [
    httpLink({
      url: baseUrl ? `${baseUrl}/api/trpc` : 'http://localhost:3000/api/trpc',
      transformer: superjson,
      fetch: enhancedFetch,
      headers: () => ({
        'X-Client-Type': 'mobile-app',
        'X-Concurrent-Requests': 'enabled',
      }),
    }),
  ],
});