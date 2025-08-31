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
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      throw new Error('Failed to fetch prayer times');
    }
  });

export const getQiblaProcedure = publicProcedure
  .input(z.object({ 
    latitude: z.number(),
    longitude: z.number()
  }))
  .query(async ({ input }) => {
    try {
      const response = await fetch(
        `${PRAYER_API_BASE}/qibla/${input.latitude}/${input.longitude}`
      );
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching qibla direction:', error);
      throw new Error('Failed to fetch qibla direction');
    }
  });