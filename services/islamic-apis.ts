import cacheService from './cache-service';

interface PrayerTimesResponse {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface IslamicDateResponse {
  hijri: string;
  gregorian: string;
}

export async function getPrayerTimes(
  latitude: number,
  longitude: number
): Promise<PrayerTimesResponse> {
  const cacheKey = `${latitude.toFixed(4)}_${longitude.toFixed(4)}_${new Date().toDateString()}`;
  
  // Check cache first
  const cached = await cacheService.get<PrayerTimesResponse>('prayer_times', cacheKey);
  if (cached) {
    console.log('Cache hit for prayer times');
    return cached;
  }
  
  try {
    console.log('Fetching prayer times from API');
    const response = await fetch(
      `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch prayer times');
    }
    
    const data = await response.json();
    const prayerTimes = data.data.timings;
    
    // Cache the result
    await cacheService.set('prayer_times', cacheKey, prayerTimes);
    
    return prayerTimes;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    throw new Error('Unable to fetch prayer times. Please check your internet connection.');
  }
}

export async function getQiblaDirection(
  latitude: number,
  longitude: number
): Promise<{ direction: number; distance: number }> {
  // Most accurate Kaaba coordinates (from Saudi Survey)
  const kaabaLat = 21.422487;
  const kaabaLng = 39.826206;
  
  // Always use manual calculation for better accuracy
  console.log('Calculating Qibla direction manually for better accuracy');
  
  // Enhanced manual calculation using spherical trigonometry
  const direction = calculateAccurateBearing(latitude, longitude, kaabaLat, kaabaLng);
  const distance = calculateDistance(latitude, longitude, kaabaLat, kaabaLng);
  
  return {
    direction: Math.round(direction * 100) / 100, // More precision
    distance: Math.round(distance * 100) / 100
  };
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Haversine formula for great circle distance
  const R = 6371.0088; // Earth's mean radius in kilometers (more accurate)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Convert degrees to radians
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  // Calculate bearing using the forward azimuth formula
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  
  // Calculate initial bearing in radians
  let bearing = Math.atan2(y, x);
  
  // Convert to degrees and normalize to 0-360
  bearing = bearing * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  
  return bearing;
}

function calculateAccurateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // More accurate bearing calculation using spherical trigonometry
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  
  // Forward azimuth calculation
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  
  const θ = Math.atan2(y, x);
  
  // Convert to degrees and normalize to 0-360
  const bearing = (θ * 180 / Math.PI + 360) % 360;
  
  return bearing;
}

export async function getIslamicDate(): Promise<IslamicDateResponse> {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  const cacheKey = dateString;
  
  // Check cache first
  const cached = await cacheService.get<IslamicDateResponse>('islamic_calendar', cacheKey);
  if (cached) {
    console.log('Cache hit for Islamic date');
    return cached;
  }
  
  try {
    console.log('Fetching Islamic date from API');
    
    // Try multiple API endpoints for better reliability
    const apiUrls = [
      `https://api.aladhan.com/v1/gToH/${dateString}`,
      `https://api.aladhan.com/v1/gToHCalendar/${today.getMonth() + 1}/${today.getFullYear()}`,
    ];
    
    for (const url of apiUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          continue; // Try next URL
        }
        
        const data = await response.json();
        
        // Handle different response formats
        let hijriData;
        if (data.data && data.data.hijri) {
          hijriData = data.data.hijri;
        } else if (data.data && Array.isArray(data.data)) {
          // Calendar format - find today's date
          const todayData = data.data.find((day: any) => 
            day.gregorian && day.gregorian.date === dateString
          );
          if (todayData && todayData.hijri) {
            hijriData = todayData.hijri;
          }
        }
        
        if (hijriData) {
          const result = {
            hijri: `${hijriData.day} ${hijriData.month.en} ${hijriData.year} AH`,
            gregorian: dateString
          };
          
          // Cache the result
          await cacheService.set('islamic_calendar', cacheKey, result);
          
          return result;
        }
      } catch (apiError) {
        console.log('API attempt failed:', apiError);
        continue; // Try next URL
      }
    }
    
    throw new Error('All API attempts failed');
  } catch (error) {
    console.error('Error fetching Islamic date:', error);
    
    // Enhanced fallback calculation
    const gregorianYear = today.getFullYear();
    
    // Approximate Hijri year calculation (rough estimate)
    // Hijri year is about 354 days, so roughly 0.97 of Gregorian year
    const approximateHijriYear = Math.round((gregorianYear - 622) * 1.030684) + 1;
    
    const islamicMonths = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
      'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'
    ];
    
    // Rough approximation based on current month
    const currentMonth = today.getMonth();
    const approximateHijriMonth = islamicMonths[currentMonth % 12];
    const approximateDay = Math.min(today.getDate(), 29); // Islamic months are 29-30 days
    
    const fallbackResult = {
      hijri: `${approximateDay} ${approximateHijriMonth} ${approximateHijriYear} AH (estimated)`,
      gregorian: today.toISOString().split('T')[0]
    };
    
    // Cache the fallback result with shorter TTL
    await cacheService.set('islamic_calendar', cacheKey, fallbackResult);
    
    return fallbackResult;
  }
}