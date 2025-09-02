import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const PRAYER_API_BASE = "https://api.aladhan.com/v1";
const BACKUP_API_BASE = "https://api.pray.zone/v2";
const THIRD_API_BASE = "https://api.islamicfinder.us/v1";

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
      
      // Try third API - Islamic Finder
      try {
        const thirdResponse = await fetch(
          `${THIRD_API_BASE}/prayer_times?latitude=${input.latitude}&longitude=${input.longitude}&method=${input.method}&date=${date}`,
          { 
            headers: { 'Accept': 'application/json' }
          }
        );
        
        if (thirdResponse.ok) {
          const thirdData = await thirdResponse.json();
          if (thirdData.prayer_times) {
            const times = thirdData.prayer_times;
            return {
              timings: {
                Fajr: times.fajr || times.Fajr,
                Sunrise: times.sunrise || times.Sunrise,
                Dhuhr: times.dhuhr || times.Dhuhr,
                Asr: times.asr || times.Asr,
                Maghrib: times.maghrib || times.Maghrib,
                Isha: times.isha || times.Isha
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
                  name: 'Islamic Finder API'
                }
              }
            };
          }
        }
      } catch (thirdError) {
        console.log('Third API also failed:', thirdError);
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

// Enhanced helper function to calculate more accurate prayer times
function calculateApproximatePrayerTimes(latitude: number, longitude: number) {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  
  // More accurate solar calculations
  const P = Math.asin(0.39795 * Math.cos(0.98563 * (dayOfYear - 173) * Math.PI / 180));
  const argument = -Math.tan(latitude * Math.PI / 180) * Math.tan(P);
  
  // Check for polar regions
  if (Math.abs(argument) > 1) {
    // Use default times for polar regions
    return {
      Fajr: "05:00",
      Sunrise: "06:30",
      Dhuhr: "12:30",
      Asr: "15:30",
      Maghrib: "18:30",
      Isha: "20:00"
    };
  }
  
  const A = Math.acos(argument) * 180 / Math.PI / 15;
  
  // Calculate solar noon (accounting for longitude)
  const solarNoon = 12 - longitude / 15;
  
  // Calculate sunrise and sunset
  const sunrise = solarNoon - A;
  const sunset = solarNoon + A;
  
  // Calculate prayer times with more accurate angles
  const fajrAngle = 18; // Standard Fajr angle
  const ishaAngle = 17; // Standard Isha angle
  
  const fajrArgument = -Math.tan(latitude * Math.PI / 180) * Math.tan(P) - Math.sin(fajrAngle * Math.PI / 180) / (Math.cos(latitude * Math.PI / 180) * Math.cos(P));
  const ishaArgument = -Math.tan(latitude * Math.PI / 180) * Math.tan(P) - Math.sin(ishaAngle * Math.PI / 180) / (Math.cos(latitude * Math.PI / 180) * Math.cos(P));
  
  let fajr, isha;
  
  if (Math.abs(fajrArgument) <= 1) {
    const fajrA = Math.acos(fajrArgument) * 180 / Math.PI / 15;
    fajr = solarNoon - fajrA;
  } else {
    fajr = sunrise - 1.5; // Fallback
  }
  
  if (Math.abs(ishaArgument) <= 1) {
    const ishaA = Math.acos(ishaArgument) * 180 / Math.PI / 15;
    isha = solarNoon + ishaA;
  } else {
    isha = sunset + 1.5; // Fallback
  }
  
  // Calculate Asr time (when shadow length = object length + shadow at noon)
  const asrArgument = Math.sin(Math.atan(1 + Math.tan(Math.abs(latitude * Math.PI / 180 - P)))) / (Math.cos(latitude * Math.PI / 180) * Math.cos(P)) - Math.tan(latitude * Math.PI / 180) * Math.tan(P);
  let asr;
  
  if (Math.abs(asrArgument) <= 1) {
    const asrA = Math.acos(asrArgument) * 180 / Math.PI / 15;
    asr = solarNoon + asrA;
  } else {
    asr = solarNoon + 3.5; // Fallback
  }
  
  const formatTime = (time: number) => {
    // Ensure time is within 24-hour format
    time = ((time % 24) + 24) % 24;
    const hours = Math.floor(time);
    const minutes = Math.floor((time - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  return {
    Fajr: formatTime(fajr),
    Sunrise: formatTime(sunrise),
    Dhuhr: formatTime(solarNoon),
    Asr: formatTime(asr),
    Maghrib: formatTime(sunset),
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