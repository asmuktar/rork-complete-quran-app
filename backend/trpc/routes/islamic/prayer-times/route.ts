import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const PRAYER_API_BASE = "https://api.aladhan.com/v1";

export const getPrayerTimesProcedure = publicProcedure
  .input(z.object({ 
    latitude: z.number(),
    longitude: z.number(),
    method: z.number().optional().default(2),
    date: z.string().optional()
  }))
  .query(async ({ input }) => {
    try {
      const date = input.date || new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${PRAYER_API_BASE}/timings/${date}?latitude=${input.latitude}&longitude=${input.longitude}&method=${input.method}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.code !== 200) {
        throw new Error(data.status || 'API returned error');
      }
      
      return data.data || null;
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      // Return fallback prayer times if API fails
      return {
        timings: {
          Fajr: '05:30',
          Sunrise: '06:45',
          Dhuhr: '12:30',
          Asr: '15:45',
          Maghrib: '18:15',
          Isha: '19:30'
        },
        date: {
          readable: new Date().toLocaleDateString(),
          timestamp: Date.now().toString()
        },
        meta: {
          latitude: input.latitude,
          longitude: input.longitude,
          timezone: 'Local',
          method: {
            id: input.method,
            name: 'Islamic Society of North America (ISNA)'
          }
        }
      };
    }
  });

export const getQiblaProcedure = publicProcedure
  .input(z.object({ 
    latitude: z.number(),
    longitude: z.number()
  }))
  .query(async ({ input }) => {
    try {
      // Most accurate Kaaba coordinates (from Saudi Survey)
      const kaabaLat = 21.422487;
      const kaabaLng = 39.826206;
      
      // Use enhanced manual calculation for better accuracy
      const φ1 = input.latitude * Math.PI / 180;
      const φ2 = kaabaLat * Math.PI / 180;
      const Δλ = (kaabaLng - input.longitude) * Math.PI / 180;
      
      // Forward azimuth calculation using spherical trigonometry
      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      
      const θ = Math.atan2(y, x);
      const bearing = (θ * 180 / Math.PI + 360) % 360;
      
      // Calculate distance using Haversine formula
      const R = 6371.0088; // Earth's mean radius in km
      const Δφ = (kaabaLat - input.latitude) * Math.PI / 180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return {
        latitude: input.latitude,
        longitude: input.longitude,
        direction: Math.round(bearing * 100) / 100,
        distance: Math.round(distance * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating qibla direction:', error);
      throw new Error('Failed to calculate Qibla direction');
    }
  });