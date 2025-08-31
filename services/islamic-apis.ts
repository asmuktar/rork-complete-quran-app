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
  try {
    const response = await fetch(
      `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch prayer times');
    }
    
    const data = await response.json();
    return data.data.timings;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    throw new Error('Unable to fetch prayer times. Please check your internet connection.');
  }
}

export async function getQiblaDirection(
  latitude: number,
  longitude: number
): Promise<{ direction: number; distance: number }> {
  // Kaaba coordinates (most precise available)
  const meccaLat = 21.4224779;
  const meccaLng = 39.8251832;
  
  try {
    // Try multiple APIs for better reliability
    const apiUrls = [
      `https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`,
      `https://api.pray.zone/v2/times/today.json?latitude=${latitude}&longitude=${longitude}`,
    ];
    
    for (const url of apiUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Handle different API response formats
          let qiblaDirection;
          if (data.data && data.data.direction !== undefined) {
            qiblaDirection = parseFloat(data.data.direction);
          } else if (data.results && data.results.qibla_direction !== undefined) {
            qiblaDirection = parseFloat(data.results.qibla_direction);
          }
          
          if (qiblaDirection !== undefined && !isNaN(qiblaDirection)) {
            const distance = calculateDistance(latitude, longitude, meccaLat, meccaLng);
            
            return {
              direction: Math.round(qiblaDirection * 10) / 10,
              distance: Math.round(distance)
            };
          }
        }
      } catch (apiError) {
        console.log('API attempt failed:', apiError);
        continue; // Try next API
      }
    }
    
    // All APIs failed, use manual calculation
    throw new Error('All API attempts failed');
  } catch (error) {
    console.log('Using manual Qibla calculation:', error);
    
    // Enhanced manual calculation using great circle bearing
    const direction = calculateBearing(latitude, longitude, meccaLat, meccaLng);
    const distance = calculateDistance(latitude, longitude, meccaLat, meccaLng);
    
    return {
      direction: Math.round(direction * 10) / 10,
      distance: Math.round(distance)
    };
  }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

export async function getIslamicDate(): Promise<IslamicDateResponse> {
  try {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
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
          return {
            hijri: `${hijriData.day} ${hijriData.month.en} ${hijriData.year} AH`,
            gregorian: dateString
          };
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
    const today = new Date();
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
    
    return {
      hijri: `${approximateDay} ${approximateHijriMonth} ${approximateHijriYear} AH (estimated)`,
      gregorian: today.toISOString().split('T')[0]
    };
  }
}