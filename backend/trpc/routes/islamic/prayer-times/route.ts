import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const PRAYER_API_BASE = "https://api.aladhan.com/v1";
const BACKUP_API_BASE = "https://api.pray.zone/v2";

export const getPrayerTimesProcedure = publicProcedure
  .input(z.object({ 
    latitude: z.number(),
    longitude: z.number(),
    method: z.number().optional().default(2),
    date: z.string().optional()
  }))
  .query(async ({ input }) => {
    const date = input.date || new Date().toISOString().split('T')[0];
    
    // Try primary API first
    try {
      const response = await fetch(
        `${PRAYER_API_BASE}/timings/${date}?latitude=${input.latitude}&longitude=${input.longitude}&method=${input.method}`,
        { 
          headers: { 'Accept': 'application/json' }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Primary API HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.code === 200 && data.data?.timings) {
        return data.data;
      }
      
      throw new Error('Primary API returned invalid data');
    } catch (primaryError) {
      console.log('Primary API failed, trying backup:', primaryError);
      
      // Try backup API
      try {
        const backupResponse = await fetch(
          `${BACKUP_API_BASE}/times/today.json?latitude=${input.latitude}&longitude=${input.longitude}&calculation=${input.method}`,
          { 
            headers: { 'Accept': 'application/json' }
          }
        );
        
        if (backupResponse.ok) {
          const backupData = await backupResponse.json();
          if (backupData.results?.datetime) {
            const times = backupData.results.datetime[0].times;
            return {
              timings: {
                Fajr: times.Fajr,
                Sunrise: times.Sunrise,
                Dhuhr: times.Dhuhr,
                Asr: times.Asr,
                Maghrib: times.Maghrib,
                Isha: times.Isha
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
                  name: 'Backup API'
                }
              }
            };
          }
        }
      } catch (backupError) {
        console.log('Backup API also failed:', backupError);
      }
      
      // Calculate approximate prayer times based on location
      const approximateTimes = calculateApproximatePrayerTimes(input.latitude, input.longitude);
      
      return {
        timings: approximateTimes,
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
            name: 'Calculated (Offline)'
          }
        }
      };
    }
  });

// Helper function to calculate approximate prayer times
function calculateApproximatePrayerTimes(latitude: number, longitude: number) {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Simplified calculation based on sun position
  // This is a very basic approximation
  
  // Solar declination (simplified)
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180);
  
  // Hour angle calculations (simplified)
  const latRad = latitude * Math.PI / 180;
  const declRad = declination * Math.PI / 180;
  
  const sunrise = 12 - (1/15) * Math.acos(-Math.tan(latRad) * Math.tan(declRad)) * 180 / Math.PI;
  const sunset = 12 + (1/15) * Math.acos(-Math.tan(latRad) * Math.tan(declRad)) * 180 / Math.PI;
  
  // Approximate prayer times
  const fajr = sunrise - 1.5;
  const dhuhr = 12.5;
  const asr = dhuhr + 3.5;
  const maghrib = sunset + 0.2;
  const isha = maghrib + 1.5;
  
  const formatTime = (time: number) => {
    const hours = Math.floor(time);
    const minutes = Math.floor((time - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  return {
    Fajr: formatTime(fajr),
    Sunrise: formatTime(sunrise),
    Dhuhr: formatTime(dhuhr),
    Asr: formatTime(asr),
    Maghrib: formatTime(maghrib),
    Isha: formatTime(isha)
  };
}

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