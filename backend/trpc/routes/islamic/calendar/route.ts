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
    try {
      const currentDate = input.date || new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${CALENDAR_API_BASE}/gToH/${currentDate}`
      );
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      
      if (data.data && data.data.hijri) {
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
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching Islamic calendar:', error);
      
      // Return fallback data
      const today = new Date();
      const hijriYear = 1445; // Approximate current Hijri year
      const hijriMonths = [
        'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani',
        'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban',
        'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
      ];
      
      return {
        hijri: {
          date: `${today.getDate()}-${today.getMonth() + 1}-${hijriYear}`,
          day: today.getDate().toString(),
          month: {
            number: today.getMonth() + 1,
            en: hijriMonths[today.getMonth()],
            ar: hijriMonths[today.getMonth()]
          },
          year: hijriYear.toString(),
          weekday: {
            en: today.toLocaleDateString('en-US', { weekday: 'long' }),
            ar: today.toLocaleDateString('ar-SA', { weekday: 'long' })
          }
        },
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