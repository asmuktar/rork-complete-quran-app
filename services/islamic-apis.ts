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
  try {
    const response = await fetch(
      `https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch Qibla direction');
    }
    
    const data = await response.json();
    
    if (data.data && data.data.direction !== undefined) {
      // Calculate distance to Mecca (approximate)
      const meccaLat = 21.4225;
      const meccaLng = 39.8262;
      const distance = calculateDistance(latitude, longitude, meccaLat, meccaLng);
      
      return {
        direction: data.data.direction,
        distance: Math.round(distance)
      };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching Qibla direction:', error);
    // Return fallback calculation
    const meccaLat = 21.4225;
    const meccaLng = 39.8262;
    const direction = calculateBearing(latitude, longitude, meccaLat, meccaLng);
    const distance = calculateDistance(latitude, longitude, meccaLat, meccaLng);
    
    return {
      direction: Math.round(direction),
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
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

export async function getIslamicDate(): Promise<IslamicDateResponse> {
  try {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    const response = await fetch(
      `https://api.aladhan.com/v1/gToH/${dateString}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch Islamic date');
    }
    
    const data = await response.json();
    
    if (data.data && data.data.hijri) {
      const hijriDate = data.data.hijri;
      return {
        hijri: `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} AH`,
        gregorian: dateString
      };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching Islamic date:', error);
    // Return fallback date
    const today = new Date();
    return {
      hijri: today.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) + ' AH (approx)',
      gregorian: today.toISOString().split('T')[0]
    };
  }
}