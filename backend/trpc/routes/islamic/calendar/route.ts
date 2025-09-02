import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const CALENDAR_API_BASE = "https://api.aladhan.com/v1";

export const getIslamicCalendarProcedure = publicProcedure
  .input(z.object({ 
    date: z.string().optional(),
    month: z.number().optional(),
    year: z.number().optional()
  }))
  .query(async ({ input }) => {
    const currentDate = input.date || new Date().toISOString().split('T')[0];
    
    // Try primary API first
    try {
      const response = await fetch(
        `${CALENDAR_API_BASE}/gToH/${currentDate}`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (!response.ok) {
        throw new Error(`Primary calendar API HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 200 && data.data?.hijri) {
        return {
          hijri: {
            date: data.data.hijri.date,
            day: data.data.hijri.day,
            month: {
              number: data.data.hijri.month.number,
              en: data.data.hijri.month.en,
              ar: data.data.hijri.month.ar
            },
            year: data.data.hijri.year,
            weekday: {
              en: data.data.hijri.weekday.en,
              ar: data.data.hijri.weekday.ar
            }
          },
          gregorian: {
            date: data.data.gregorian.date,
            day: data.data.gregorian.day,
            month: {
              number: data.data.gregorian.month.number,
              en: data.data.gregorian.month.en
            },
            year: data.data.gregorian.year,
            weekday: {
              en: data.data.gregorian.weekday.en
            }
          }
        };
      }
      
      throw new Error('Primary API returned invalid data');
    } catch (primaryError) {
      console.log('Primary calendar API failed:', primaryError);
      
      // Calculate approximate Hijri date
      const today = new Date(currentDate);
      const approximateHijri = calculateApproximateHijriDate(today);
      
      return {
        hijri: approximateHijri,
        gregorian: {
          date: today.toISOString().split('T')[0],
          day: today.getDate().toString(),
          month: {
            number: today.getMonth() + 1,
            en: today.toLocaleDateString('en-US', { month: 'long' })
          },
          year: today.getFullYear().toString(),
          weekday: {
            en: today.toLocaleDateString('en-US', { weekday: 'long' })
          }
        }
      };
    }
  });

// Helper function to calculate approximate Hijri date
function calculateApproximateHijriDate(gregorianDate: Date) {
  // Approximate conversion from Gregorian to Hijri
  // This is a simplified calculation and may not be 100% accurate
  const gregorianYear = gregorianDate.getFullYear();
  const gregorianMonth = gregorianDate.getMonth() + 1;
  const gregorianDay = gregorianDate.getDate();
  
  // Approximate Hijri year calculation
  const hijriYear = Math.floor((gregorianYear - 622) * 1.030684) + 1;
  
  // Hijri months
  const hijriMonths = [
    'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani',
    'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
  ];
  
  // Approximate month mapping (simplified)
  const hijriMonth = ((gregorianMonth + 10) % 12) + 1;
  const hijriMonthName = hijriMonths[hijriMonth - 1];
  
  // Approximate day (with some offset)
  const hijriDay = Math.max(1, Math.min(29, gregorianDay - 10));
  
  return {
    date: `${hijriDay}-${hijriMonth}-${hijriYear}`,
    day: hijriDay.toString(),
    month: {
      number: hijriMonth,
      en: hijriMonthName,
      ar: hijriMonthName
    },
    year: hijriYear.toString(),
    weekday: {
      en: gregorianDate.toLocaleDateString('en-US', { weekday: 'long' }),
      ar: gregorianDate.toLocaleDateString('en-US', { weekday: 'long' })
    }
  };
}

export const getIslamicEventsProcedure = publicProcedure
  .input(z.object({ 
    year: z.number().optional()
  }))
  .query(async ({ input }) => {
    try {
      const year = input.year || new Date().getFullYear();
      // Mock Islamic events data
      return [
        { name: 'Ramadan Begins', date: `${year}-03-23`, type: 'religious' },
        { name: 'Eid al-Fitr', date: `${year}-04-21`, type: 'celebration' },
        { name: 'Hajj Season', date: `${year}-06-15`, type: 'pilgrimage' },
        { name: 'Eid al-Adha', date: `${year}-06-28`, type: 'celebration' },
        { name: 'Islamic New Year', date: `${year}-07-19`, type: 'religious' },
        { name: 'Day of Ashura', date: `${year}-07-28`, type: 'religious' },
        { name: 'Mawlid an-Nabi', date: `${year}-09-27`, type: 'religious' }
      ];
    } catch (error) {
      console.error('Error fetching Islamic events:', error);
      throw new Error('Failed to fetch Islamic events');
    }
  });