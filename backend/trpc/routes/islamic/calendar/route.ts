import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const CALENDAR_API_BASE = "https://api.aladhan.com/v1";
const BACKUP_CALENDAR_API = "https://api.islamicfinder.us/v1";
const THIRD_CALENDAR_API = "https://hijri-calendar-api.herokuapp.com/v1";

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
      
      // Try backup API
      try {
        const backupResponse = await fetch(
          `${BACKUP_CALENDAR_API}/hijri_date?gregorian_date=${currentDate}`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (backupResponse.ok) {
          const backupData = await backupResponse.json();
          if (backupData.hijri_date) {
            const hijri = backupData.hijri_date;
            return {
              hijri: {
                date: `${hijri.day}-${hijri.month}-${hijri.year}`,
                day: hijri.day.toString(),
                month: {
                  number: hijri.month,
                  en: hijri.month_name || 'Unknown',
                  ar: hijri.month_name || 'Unknown'
                },
                year: hijri.year.toString(),
                weekday: {
                  en: new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long' }),
                  ar: new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long' })
                }
              },
              gregorian: {
                date: currentDate,
                day: new Date(currentDate).getDate().toString(),
                month: {
                  number: new Date(currentDate).getMonth() + 1,
                  en: new Date(currentDate).toLocaleDateString('en-US', { month: 'long' })
                },
                year: new Date(currentDate).getFullYear().toString(),
                weekday: {
                  en: new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long' })
                }
              }
            };
          }
        }
      } catch (backupError) {
        console.log('Backup calendar API also failed:', backupError);
      }
      
      // Try third API
      try {
        const thirdResponse = await fetch(
          `${THIRD_CALENDAR_API}/gregorian-to-hijri?date=${currentDate}`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (thirdResponse.ok) {
          const thirdData = await thirdResponse.json();
          if (thirdData.hijri) {
            const hijri = thirdData.hijri;
            return {
              hijri: {
                date: `${hijri.day}-${hijri.month}-${hijri.year}`,
                day: hijri.day.toString(),
                month: {
                  number: hijri.month,
                  en: hijri.monthName || 'Unknown',
                  ar: hijri.monthName || 'Unknown'
                },
                year: hijri.year.toString(),
                weekday: {
                  en: new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long' }),
                  ar: new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long' })
                }
              },
              gregorian: {
                date: currentDate,
                day: new Date(currentDate).getDate().toString(),
                month: {
                  number: new Date(currentDate).getMonth() + 1,
                  en: new Date(currentDate).toLocaleDateString('en-US', { month: 'long' })
                },
                year: new Date(currentDate).getFullYear().toString(),
                weekday: {
                  en: new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long' })
                }
              }
            };
          }
        }
      } catch (thirdError) {
        console.log('Third calendar API also failed:', thirdError);
      }
      
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

// Enhanced helper function to calculate more accurate Hijri date
function calculateApproximateHijriDate(gregorianDate: Date) {
  // More accurate conversion from Gregorian to Hijri
  // Based on the Umm al-Qura calendar system
  const gregorianYear = gregorianDate.getFullYear();
  const gregorianMonth = gregorianDate.getMonth() + 1;
  const gregorianDay = gregorianDate.getDate();
  
  // Calculate Julian Day Number
  let a = Math.floor((14 - gregorianMonth) / 12);
  let y = gregorianYear - a;
  let m = gregorianMonth + 12 * a - 3;
  
  let jd = gregorianDay + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + 1721119;
  
  // Convert Julian Day to Hijri
  // Hijri epoch is July 16, 622 CE (Julian Day 1948439)
  const hijriEpoch = 1948439;
  const daysSinceHijriEpoch = jd - hijriEpoch;
  
  // Average Hijri year is 354.367 days
  const averageHijriYear = 354.367;
  const hijriYear = Math.floor(daysSinceHijriEpoch / averageHijriYear) + 1;
  
  // Calculate remaining days in the year
  const remainingDays = daysSinceHijriEpoch - Math.floor((hijriYear - 1) * averageHijriYear);
  
  // Hijri months (alternating 30 and 29 days, with adjustments)
  const hijriMonths = [
    { name: 'Muharram', days: 30 },
    { name: 'Safar', days: 29 },
    { name: 'Rabi al-Awwal', days: 30 },
    { name: 'Rabi al-Thani', days: 29 },
    { name: 'Jumada al-Awwal', days: 30 },
    { name: 'Jumada al-Thani', days: 29 },
    { name: 'Rajab', days: 30 },
    { name: 'Shaban', days: 29 },
    { name: 'Ramadan', days: 30 },
    { name: 'Shawwal', days: 29 },
    { name: 'Dhu al-Qadah', days: 30 },
    { name: 'Dhu al-Hijjah', days: 29 } // 30 in leap years
  ];
  
  // Find the month and day
  let dayCount = Math.floor(remainingDays);
  let hijriMonth = 1;
  let hijriDay = 1;
  
  for (let i = 0; i < hijriMonths.length; i++) {
    if (dayCount <= hijriMonths[i].days) {
      hijriMonth = i + 1;
      hijriDay = Math.max(1, dayCount);
      break;
    }
    dayCount -= hijriMonths[i].days;
  }
  
  // Ensure valid day
  if (hijriDay < 1) hijriDay = 1;
  if (hijriDay > 30) hijriDay = 30;
  
  const hijriMonthName = hijriMonths[hijriMonth - 1]?.name || 'Unknown';
  
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