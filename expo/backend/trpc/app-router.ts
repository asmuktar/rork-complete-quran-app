import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getSurahsProcedure, getSurahProcedure, getAllVersesWithTranslationsProcedure, getAyahProcedure } from "./routes/quran/surahs/route";
import { searchVersesProcedure } from "./routes/quran/search/route";
import { getHadithCollectionsProcedure, getHadithsProcedure, searchHadithsProcedure, verifyHadithProcedure } from "./routes/hadith/collections/route";
import { getPrayerTimesProcedure, getQiblaProcedure } from "./routes/islamic/prayer-times/route";
import { getIslamicCalendarProcedure, getIslamicEventsProcedure } from "./routes/islamic/calendar/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  quran: createTRPCRouter({
    surahs: getSurahsProcedure,
    surah: getSurahProcedure,
    ayah: getAyahProcedure,
    allVerses: getAllVersesWithTranslationsProcedure,
    search: searchVersesProcedure,
  }),
  hadith: createTRPCRouter({
    getCollections: getHadithCollectionsProcedure,
    getHadiths: getHadithsProcedure,
    searchHadiths: searchHadithsProcedure,
    verifyHadith: verifyHadithProcedure,
  }),
  islamic: createTRPCRouter({
    getPrayerTimes: getPrayerTimesProcedure,
    getQibla: getQiblaProcedure,
    getCalendar: getIslamicCalendarProcedure,
    getEvents: getIslamicEventsProcedure,
  }),
});

export type AppRouter = typeof appRouter;