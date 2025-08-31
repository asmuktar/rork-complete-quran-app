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
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching Islamic calendar:', error);
      throw new Error('Failed to fetch Islamic calendar');
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