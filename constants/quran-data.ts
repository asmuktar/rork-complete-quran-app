export interface Ayah {
  number: number;
  text: string;
  translation: string;
  transliteration?: string;
  juz: number;
  hizb: number;
  rub: number;
  sajda?: boolean;
}

export interface Surah {
  id: number;
  name: string;
  arabicName: string;
  englishName: string;
  ayahs: number;
  revelationType: 'Meccan' | 'Medinan';
  order: number;
  meaning?: string;
  verses: Ayah[];
}

// Sample ayahs for demonstration - in a real app, this would come from an API
const createSampleAyahs = (surahId: number, totalAyahs: number): Ayah[] => {
  const ayahs: Ayah[] = [];
  
  // Add Basmallah for all surahs except At-Tawbah (Surah 9)
  if (surahId !== 9 && surahId !== 1) {
    ayahs.push({
      number: 0, // Basmallah is not counted as a verse
      text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
      transliteration: 'Bismillahir-Rahmanir-Raheem',
      juz: Math.ceil((surahId * 10) / 20),
      hizb: Math.ceil((surahId * 10) / 10),
      rub: Math.ceil((surahId * 10) / 5),
      sajda: false
    });
  }
  
  for (let i = 1; i <= totalAyahs; i++) {
    ayahs.push({
      number: i,
      text: getSampleArabicText(surahId, i),
      translation: getSampleTranslation(surahId, i),
      transliteration: getSampleTransliteration(surahId, i),
      juz: Math.ceil((surahId * 10 + i) / 20), // Simplified juz calculation
      hizb: Math.ceil((surahId * 10 + i) / 10),
      rub: Math.ceil((surahId * 10 + i) / 5),
      sajda: false // Would be set based on actual data
    });
  }
  
  return ayahs;
};

const getSampleArabicText = (surahId: number, ayahNumber: number): string => {
  // Sample Arabic text - in real app, this would come from Quran API
  const sampleTexts = [
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    'الرَّحْمَٰنِ الرَّحِيمِ',
    'مَالِكِ يَوْمِ الدِّينِ',
    'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
    'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ'
  ];
  
  if (surahId === 1 && ayahNumber <= 7) {
    return sampleTexts[ayahNumber - 1];
  }
  
  // For Surah At-Tawbah (9), don't start with Basmallah
  if (surahId === 9 && ayahNumber === 1) {
    return 'بَرَاءَةٌ مِّنَ اللَّهِ وَرَسُولِهِ إِلَى الَّذِينَ عَاهَدتُّم مِّنَ الْمُشْرِكِينَ';
  }
  
  return `آية رقم ${ayahNumber} من سورة رقم ${surahId}`;
};

const getSampleTranslation = (surahId: number, ayahNumber: number): string => {
  // Sample translations - in real app, this would come from Quran API
  const sampleTranslations = [
    'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
    'Praise to Allah, Lord of the worlds -',
    'The Entirely Merciful, the Especially Merciful,',
    'Sovereign of the Day of Recompense.',
    'It is You we worship and You we ask for help.',
    'Guide us to the straight path -',
    'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.'
  ];
  
  if (surahId === 1 && ayahNumber <= 7) {
    return sampleTranslations[ayahNumber - 1];
  }
  
  // For Surah At-Tawbah (9), first verse translation
  if (surahId === 9 && ayahNumber === 1) {
    return '[This is a declaration of] disassociation, from Allah and His Messenger, to those with whom you had made a treaty among the polytheists.';
  }
  
  return `Translation of verse ${ayahNumber} from chapter ${surahId}`;
};

const getSampleTransliteration = (surahId: number, ayahNumber: number): string => {
  // Sample transliterations - in real app, this would come from Quran API
  const sampleTransliterations = [
    'Bismillahir-Rahmanir-Raheem',
    'Alhamdu lillahi rabbil-alameen',
    'Ar-Rahmanir-Raheem',
    'Maliki yawmid-deen',
    'Iyyaka na\'budu wa iyyaka nasta\'een',
    'Ihdinassiratal-mustaqeem',
    'Siratal-lazeena an\'amta alayhim ghayril-maghdoobi alayhim wa lad-dalleen'
  ];
  
  if (surahId === 1 && ayahNumber <= 7) {
    return sampleTransliterations[ayahNumber - 1];
  }
  
  // For Surah At-Tawbah (9), first verse transliteration
  if (surahId === 9 && ayahNumber === 1) {
    return 'Bara\'atun mina Allahi wa rasulihi ila alladhina ahadtum mina almushrikeen';
  }
  
  return `Transliteration of verse ${ayahNumber} from chapter ${surahId}`;
};

export const SURAHS: Surah[] = [
  { id: 1, name: 'Al-Fatihah', arabicName: 'الفاتحة', englishName: 'The Opening', ayahs: 7, revelationType: 'Meccan', order: 5, meaning: 'The Opening', verses: createSampleAyahs(1, 7) },
  { id: 2, name: 'Al-Baqarah', arabicName: 'البقرة', englishName: 'The Cow', ayahs: 286, revelationType: 'Medinan', order: 87, verses: createSampleAyahs(2, 286) },
  { id: 3, name: 'Ali Imran', arabicName: 'آل عمران', englishName: 'The Family of Imran', ayahs: 200, revelationType: 'Medinan', order: 89, verses: createSampleAyahs(3, 200) },
  { id: 4, name: 'An-Nisa', arabicName: 'النساء', englishName: 'The Women', ayahs: 176, revelationType: 'Medinan', order: 92, verses: createSampleAyahs(4, 176) },
  { id: 5, name: 'Al-Maidah', arabicName: 'المائدة', englishName: 'The Table', ayahs: 120, revelationType: 'Medinan', order: 112, verses: createSampleAyahs(5, 120) },
  { id: 6, name: 'Al-Anam', arabicName: 'الأنعام', englishName: 'The Cattle', ayahs: 165, revelationType: 'Meccan', order: 55, verses: createSampleAyahs(6, 165) },
  { id: 7, name: 'Al-Araf', arabicName: 'الأعراف', englishName: 'The Heights', ayahs: 206, revelationType: 'Meccan', order: 39, verses: createSampleAyahs(7, 206) },
  { id: 8, name: 'Al-Anfal', arabicName: 'الأنفال', englishName: 'The Spoils of War', ayahs: 75, revelationType: 'Medinan', order: 88, verses: createSampleAyahs(8, 75) },
  { id: 9, name: 'At-Tawbah', arabicName: 'التوبة', englishName: 'The Repentance', ayahs: 129, revelationType: 'Medinan', order: 113, verses: createSampleAyahs(9, 129) },
  { id: 10, name: 'Yunus', arabicName: 'يونس', englishName: 'Jonah', ayahs: 109, revelationType: 'Meccan', order: 51, verses: createSampleAyahs(10, 109) },
  { id: 11, name: 'Hud', arabicName: 'هود', englishName: 'Hud', ayahs: 123, revelationType: 'Meccan', order: 52, verses: createSampleAyahs(11, 123) },
  { id: 12, name: 'Yusuf', arabicName: 'يوسف', englishName: 'Joseph', ayahs: 111, revelationType: 'Meccan', order: 53, verses: createSampleAyahs(12, 111) },
  { id: 13, name: 'Ar-Rad', arabicName: 'الرعد', englishName: 'The Thunder', ayahs: 43, revelationType: 'Medinan', order: 96, verses: createSampleAyahs(13, 43) },
  { id: 14, name: 'Ibrahim', arabicName: 'إبراهيم', englishName: 'Abraham', ayahs: 52, revelationType: 'Meccan', order: 72, verses: createSampleAyahs(14, 52) },
  { id: 15, name: 'Al-Hijr', arabicName: 'الحجر', englishName: 'The Rocky Tract', ayahs: 99, revelationType: 'Meccan', order: 54, verses: createSampleAyahs(15, 99) },
  { id: 16, name: 'An-Nahl', arabicName: 'النحل', englishName: 'The Bees', ayahs: 128, revelationType: 'Meccan', order: 70, verses: createSampleAyahs(16, 128) },
  { id: 17, name: 'Al-Isra', arabicName: 'الإسراء', englishName: 'The Night Journey', ayahs: 111, revelationType: 'Meccan', order: 50, verses: createSampleAyahs(17, 111) },
  { id: 18, name: 'Al-Kahf', arabicName: 'الكهف', englishName: 'The Cave', ayahs: 110, revelationType: 'Meccan', order: 69, verses: createSampleAyahs(18, 110) },
  { id: 19, name: 'Maryam', arabicName: 'مريم', englishName: 'Mary', ayahs: 98, revelationType: 'Meccan', order: 44, verses: createSampleAyahs(19, 98) },
  { id: 20, name: 'Ta-Ha', arabicName: 'طه', englishName: 'Ta-Ha', ayahs: 135, revelationType: 'Meccan', order: 45, verses: createSampleAyahs(20, 135) },
  { id: 21, name: 'Al-Anbiya', arabicName: 'الأنبياء', englishName: 'The Prophets', ayahs: 112, revelationType: 'Meccan', order: 73, verses: createSampleAyahs(21, 112) },
  { id: 22, name: 'Al-Hajj', arabicName: 'الحج', englishName: 'The Pilgrimage', ayahs: 78, revelationType: 'Medinan', order: 103, verses: createSampleAyahs(22, 78) },
  { id: 23, name: 'Al-Muminun', arabicName: 'المؤمنون', englishName: 'The Believers', ayahs: 118, revelationType: 'Meccan', order: 74, verses: createSampleAyahs(23, 118) },
  { id: 24, name: 'An-Nur', arabicName: 'النور', englishName: 'The Light', ayahs: 64, revelationType: 'Medinan', order: 102, verses: createSampleAyahs(24, 64) },
  { id: 25, name: 'Al-Furqan', arabicName: 'الفرقان', englishName: 'The Criterion', ayahs: 77, revelationType: 'Meccan', order: 42, verses: createSampleAyahs(25, 77) },
  { id: 26, name: 'Ash-Shuara', arabicName: 'الشعراء', englishName: 'The Poets', ayahs: 227, revelationType: 'Meccan', order: 47, verses: createSampleAyahs(26, 227) },
  { id: 27, name: 'An-Naml', arabicName: 'النمل', englishName: 'The Ants', ayahs: 93, revelationType: 'Meccan', order: 48, verses: createSampleAyahs(27, 93) },
  { id: 28, name: 'Al-Qasas', arabicName: 'القصص', englishName: 'The Stories', ayahs: 88, revelationType: 'Meccan', order: 49, verses: createSampleAyahs(28, 88) },
  { id: 29, name: 'Al-Ankabut', arabicName: 'العنكبوت', englishName: 'The Spider', ayahs: 69, revelationType: 'Meccan', order: 85, verses: createSampleAyahs(29, 69) },
  { id: 30, name: 'Ar-Rum', arabicName: 'الروم', englishName: 'The Romans', ayahs: 60, revelationType: 'Meccan', order: 84, verses: createSampleAyahs(30, 60) },
  { id: 31, name: 'Luqman', arabicName: 'لقمان', englishName: 'Luqman', ayahs: 34, revelationType: 'Meccan', order: 57, verses: createSampleAyahs(31, 34) },
  { id: 32, name: 'As-Sajdah', arabicName: 'السجدة', englishName: 'The Prostration', ayahs: 30, revelationType: 'Meccan', order: 75, verses: createSampleAyahs(32, 30) },
  { id: 33, name: 'Al-Ahzab', arabicName: 'الأحزاب', englishName: 'The Combined Forces', ayahs: 73, revelationType: 'Medinan', order: 90, verses: createSampleAyahs(33, 73) },
  { id: 34, name: 'Saba', arabicName: 'سبأ', englishName: 'Sheba', ayahs: 54, revelationType: 'Meccan', order: 58, verses: createSampleAyahs(34, 54) },
  { id: 35, name: 'Fatir', arabicName: 'فاطر', englishName: 'The Originator', ayahs: 45, revelationType: 'Meccan', order: 43, verses: createSampleAyahs(35, 45) },
  { id: 36, name: 'Ya-Sin', arabicName: 'يس', englishName: 'Ya-Sin', ayahs: 83, revelationType: 'Meccan', order: 41, verses: createSampleAyahs(36, 83) },
  { id: 37, name: 'As-Saffat', arabicName: 'الصافات', englishName: 'Those Ranged in Ranks', ayahs: 182, revelationType: 'Meccan', order: 56, verses: createSampleAyahs(37, 182) },
  { id: 38, name: 'Sad', arabicName: 'ص', englishName: 'Sad', ayahs: 88, revelationType: 'Meccan', order: 38, verses: createSampleAyahs(38, 88) },
  { id: 39, name: 'Az-Zumar', arabicName: 'الزمر', englishName: 'The Groups', ayahs: 75, revelationType: 'Meccan', order: 59, verses: createSampleAyahs(39, 75) },
  { id: 40, name: 'Ghafir', arabicName: 'غافر', englishName: 'The Forgiver', ayahs: 85, revelationType: 'Meccan', order: 60, verses: createSampleAyahs(40, 85) },
  { id: 41, name: 'Fussilat', arabicName: 'فصلت', englishName: 'Distinguished', ayahs: 54, revelationType: 'Meccan', order: 61, verses: createSampleAyahs(41, 54) },
  { id: 42, name: 'Ash-Shura', arabicName: 'الشورى', englishName: 'The Consultation', ayahs: 53, revelationType: 'Meccan', order: 62, verses: createSampleAyahs(42, 53) },
  { id: 43, name: 'Az-Zukhruf', arabicName: 'الزخرف', englishName: 'The Gold', ayahs: 89, revelationType: 'Meccan', order: 63, verses: createSampleAyahs(43, 89) },
  { id: 44, name: 'Ad-Dukhan', arabicName: 'الدخان', englishName: 'The Smoke', ayahs: 59, revelationType: 'Meccan', order: 64, verses: createSampleAyahs(44, 59) },
  { id: 45, name: 'Al-Jathiyah', arabicName: 'الجاثية', englishName: 'The Kneeling', ayahs: 37, revelationType: 'Meccan', order: 65, verses: createSampleAyahs(45, 37) },
  { id: 46, name: 'Al-Ahqaf', arabicName: 'الأحقاف', englishName: 'The Valley', ayahs: 35, revelationType: 'Meccan', order: 66, verses: createSampleAyahs(46, 35) },
  { id: 47, name: 'Muhammad', arabicName: 'محمد', englishName: 'Muhammad', ayahs: 38, revelationType: 'Medinan', order: 95, verses: createSampleAyahs(47, 38) },
  { id: 48, name: 'Al-Fath', arabicName: 'الفتح', englishName: 'The Victory', ayahs: 29, revelationType: 'Medinan', order: 111, verses: createSampleAyahs(48, 29) },
  { id: 49, name: 'Al-Hujurat', arabicName: 'الحجرات', englishName: 'The Dwellings', ayahs: 18, revelationType: 'Medinan', order: 106, verses: createSampleAyahs(49, 18) },
  { id: 50, name: 'Qaf', arabicName: 'ق', englishName: 'Qaf', ayahs: 45, revelationType: 'Meccan', order: 34, verses: createSampleAyahs(50, 45) },
  { id: 51, name: 'Adh-Dhariyat', arabicName: 'الذاريات', englishName: 'The Scatterers', ayahs: 60, revelationType: 'Meccan', order: 67, verses: createSampleAyahs(51, 60) },
  { id: 52, name: 'At-Tur', arabicName: 'الطور', englishName: 'The Mount', ayahs: 49, revelationType: 'Meccan', order: 76, verses: createSampleAyahs(52, 49) },
  { id: 53, name: 'An-Najm', arabicName: 'النجم', englishName: 'The Star', ayahs: 62, revelationType: 'Meccan', order: 23, verses: createSampleAyahs(53, 62) },
  { id: 54, name: 'Al-Qamar', arabicName: 'القمر', englishName: 'The Moon', ayahs: 55, revelationType: 'Meccan', order: 37, verses: createSampleAyahs(54, 55) },
  { id: 55, name: 'Ar-Rahman', arabicName: 'الرحمن', englishName: 'The Most Gracious', ayahs: 78, revelationType: 'Medinan', order: 97, verses: createSampleAyahs(55, 78) },
  { id: 56, name: 'Al-Waqiah', arabicName: 'الواقعة', englishName: 'The Event', ayahs: 96, revelationType: 'Meccan', order: 46, verses: createSampleAyahs(56, 96) },
  { id: 57, name: 'Al-Hadid', arabicName: 'الحديد', englishName: 'The Iron', ayahs: 29, revelationType: 'Medinan', order: 94, verses: createSampleAyahs(57, 29) },
  { id: 58, name: 'Al-Mujadilah', arabicName: 'المجادلة', englishName: 'The Reasoning', ayahs: 22, revelationType: 'Medinan', order: 105, verses: createSampleAyahs(58, 22) },
  { id: 59, name: 'Al-Hashr', arabicName: 'الحشر', englishName: 'The Gathering', ayahs: 24, revelationType: 'Medinan', order: 101, verses: createSampleAyahs(59, 24) },
  { id: 60, name: 'Al-Mumtahanah', arabicName: 'الممتحنة', englishName: 'The Tested', ayahs: 13, revelationType: 'Medinan', order: 91, verses: createSampleAyahs(60, 13) },
  { id: 61, name: 'As-Saff', arabicName: 'الصف', englishName: 'The Row', ayahs: 14, revelationType: 'Medinan', order: 109, verses: createSampleAyahs(61, 14) },
  { id: 62, name: 'Al-Jumuah', arabicName: 'الجمعة', englishName: 'Friday', ayahs: 11, revelationType: 'Medinan', order: 110, verses: createSampleAyahs(62, 11) },
  { id: 63, name: 'Al-Munafiqun', arabicName: 'المنافقون', englishName: 'The Hypocrites', ayahs: 11, revelationType: 'Medinan', order: 104, verses: createSampleAyahs(63, 11) },
  { id: 64, name: 'At-Taghabun', arabicName: 'التغابن', englishName: 'The Loss & Gain', ayahs: 18, revelationType: 'Medinan', order: 108, verses: createSampleAyahs(64, 18) },
  { id: 65, name: 'At-Talaq', arabicName: 'الطلاق', englishName: 'The Divorce', ayahs: 12, revelationType: 'Medinan', order: 99, verses: createSampleAyahs(65, 12) },
  { id: 66, name: 'At-Tahrim', arabicName: 'التحريم', englishName: 'The Prohibition', ayahs: 12, revelationType: 'Medinan', order: 107, verses: createSampleAyahs(66, 12) },
  { id: 67, name: 'Al-Mulk', arabicName: 'الملك', englishName: 'The Kingdom', ayahs: 30, revelationType: 'Meccan', order: 77, verses: createSampleAyahs(67, 30) },
  { id: 68, name: 'Al-Qalam', arabicName: 'القلم', englishName: 'The Pen', ayahs: 52, revelationType: 'Meccan', order: 2, verses: createSampleAyahs(68, 52) },
  { id: 69, name: 'Al-Haqqah', arabicName: 'الحاقة', englishName: 'The Inevitable', ayahs: 52, revelationType: 'Meccan', order: 78, verses: createSampleAyahs(69, 52) },
  { id: 70, name: 'Al-Maarij', arabicName: 'المعارج', englishName: 'The Ascending Stairways', ayahs: 44, revelationType: 'Meccan', order: 79, verses: createSampleAyahs(70, 44) },
  { id: 71, name: 'Nuh', arabicName: 'نوح', englishName: 'Noah', ayahs: 28, revelationType: 'Meccan', order: 71, verses: createSampleAyahs(71, 28) },
  { id: 72, name: 'Al-Jinn', arabicName: 'الجن', englishName: 'The Jinn', ayahs: 28, revelationType: 'Meccan', order: 40, verses: createSampleAyahs(72, 28) },
  { id: 73, name: 'Al-Muzzammil', arabicName: 'المزمل', englishName: 'The Wrapped', ayahs: 20, revelationType: 'Meccan', order: 3, verses: createSampleAyahs(73, 20) },
  { id: 74, name: 'Al-Muddaththir', arabicName: 'المدثر', englishName: 'The Cloaked', ayahs: 56, revelationType: 'Meccan', order: 4, verses: createSampleAyahs(74, 56) },
  { id: 75, name: 'Al-Qiyamah', arabicName: 'القيامة', englishName: 'The Resurrection', ayahs: 40, revelationType: 'Meccan', order: 31, verses: createSampleAyahs(75, 40) },
  { id: 76, name: 'Al-Insan', arabicName: 'الإنسان', englishName: 'The Human', ayahs: 31, revelationType: 'Medinan', order: 98, verses: createSampleAyahs(76, 31) },
  { id: 77, name: 'Al-Mursalat', arabicName: 'المرسلات', englishName: 'Those Sent', ayahs: 50, revelationType: 'Meccan', order: 33, verses: createSampleAyahs(77, 50) },
  { id: 78, name: 'An-Naba', arabicName: 'النبأ', englishName: 'The Great News', ayahs: 40, revelationType: 'Meccan', order: 80, verses: createSampleAyahs(78, 40) },
  { id: 79, name: 'An-Naziat', arabicName: 'النازعات', englishName: 'Those Who Pull Out', ayahs: 46, revelationType: 'Meccan', order: 81, verses: createSampleAyahs(79, 46) },
  { id: 80, name: 'Abasa', arabicName: 'عبس', englishName: 'He Frowned', ayahs: 42, revelationType: 'Meccan', order: 24, verses: createSampleAyahs(80, 42) },
  { id: 81, name: 'At-Takwir', arabicName: 'التكوير', englishName: 'The Overthrowing', ayahs: 29, revelationType: 'Meccan', order: 7, verses: createSampleAyahs(81, 29) },
  { id: 82, name: 'Al-Infitar', arabicName: 'الانفطار', englishName: 'The Cleaving', ayahs: 19, revelationType: 'Meccan', order: 82, verses: createSampleAyahs(82, 19) },
  { id: 83, name: 'Al-Mutaffifin', arabicName: 'المطففين', englishName: 'Those Who Give Short Measure', ayahs: 36, revelationType: 'Meccan', order: 86, verses: createSampleAyahs(83, 36) },
  { id: 84, name: 'Al-Inshiqaq', arabicName: 'الانشقاق', englishName: 'The Splitting Asunder', ayahs: 25, revelationType: 'Meccan', order: 83, verses: createSampleAyahs(84, 25) },
  { id: 85, name: 'Al-Buruj', arabicName: 'البروج', englishName: 'The Stars', ayahs: 22, revelationType: 'Meccan', order: 27, verses: createSampleAyahs(85, 22) },
  { id: 86, name: 'At-Tariq', arabicName: 'الطارق', englishName: 'The Night-Comer', ayahs: 17, revelationType: 'Meccan', order: 36, verses: createSampleAyahs(86, 17) },
  { id: 87, name: 'Al-Ala', arabicName: 'الأعلى', englishName: 'The Most High', ayahs: 19, revelationType: 'Meccan', order: 8, verses: createSampleAyahs(87, 19) },
  { id: 88, name: 'Al-Ghashiyah', arabicName: 'الغاشية', englishName: 'The Overwhelming', ayahs: 26, revelationType: 'Meccan', order: 68, verses: createSampleAyahs(88, 26) },
  { id: 89, name: 'Al-Fajr', arabicName: 'الفجر', englishName: 'The Dawn', ayahs: 30, revelationType: 'Meccan', order: 10, verses: createSampleAyahs(89, 30) },
  { id: 90, name: 'Al-Balad', arabicName: 'البلد', englishName: 'The City', ayahs: 20, revelationType: 'Meccan', order: 35, verses: createSampleAyahs(90, 20) },
  { id: 91, name: 'Ash-Shams', arabicName: 'الشمس', englishName: 'The Sun', ayahs: 15, revelationType: 'Meccan', order: 26, verses: createSampleAyahs(91, 15) },
  { id: 92, name: 'Al-Layl', arabicName: 'الليل', englishName: 'The Night', ayahs: 21, revelationType: 'Meccan', order: 9, verses: createSampleAyahs(92, 21) },
  { id: 93, name: 'Ad-Duha', arabicName: 'الضحى', englishName: 'The Forenoon', ayahs: 11, revelationType: 'Meccan', order: 11, verses: createSampleAyahs(93, 11) },
  { id: 94, name: 'Al-Inshirah', arabicName: 'الانشراح', englishName: 'The Opening Forth', ayahs: 8, revelationType: 'Meccan', order: 12, verses: createSampleAyahs(94, 8) },
  { id: 95, name: 'At-Tin', arabicName: 'التين', englishName: 'The Fig', ayahs: 8, revelationType: 'Meccan', order: 28, verses: createSampleAyahs(95, 8) },
  { id: 96, name: 'Al-Alaq', arabicName: 'العلق', englishName: 'The Clot', ayahs: 19, revelationType: 'Meccan', order: 1, verses: createSampleAyahs(96, 19) },
  { id: 97, name: 'Al-Qadr', arabicName: 'القدر', englishName: 'The Night of Decree', ayahs: 5, revelationType: 'Meccan', order: 25, verses: createSampleAyahs(97, 5) },
  { id: 98, name: 'Al-Bayyinah', arabicName: 'البينة', englishName: 'The Clear Evidence', ayahs: 8, revelationType: 'Medinan', order: 100, verses: createSampleAyahs(98, 8) },
  { id: 99, name: 'Az-Zalzalah', arabicName: 'الزلزلة', englishName: 'The Earthquake', ayahs: 8, revelationType: 'Medinan', order: 93, verses: createSampleAyahs(99, 8) },
  { id: 100, name: 'Al-Adiyat', arabicName: 'العاديات', englishName: 'The Runners', ayahs: 11, revelationType: 'Meccan', order: 14, verses: createSampleAyahs(100, 11) },
  { id: 101, name: 'Al-Qariah', arabicName: 'القارعة', englishName: 'The Striking Hour', ayahs: 11, revelationType: 'Meccan', order: 30, verses: createSampleAyahs(101, 11) },
  { id: 102, name: 'At-Takathur', arabicName: 'التكاثر', englishName: 'The Piling Up', ayahs: 8, revelationType: 'Meccan', order: 16, verses: createSampleAyahs(102, 8) },
  { id: 103, name: 'Al-Asr', arabicName: 'العصر', englishName: 'The Time', ayahs: 3, revelationType: 'Meccan', order: 13, verses: createSampleAyahs(103, 3) },
  { id: 104, name: 'Al-Humazah', arabicName: 'الهمزة', englishName: 'The Slanderer', ayahs: 9, revelationType: 'Meccan', order: 32, verses: createSampleAyahs(104, 9) },
  { id: 105, name: 'Al-Fil', arabicName: 'الفيل', englishName: 'The Elephant', ayahs: 5, revelationType: 'Meccan', order: 19, verses: createSampleAyahs(105, 5) },
  { id: 106, name: 'Quraysh', arabicName: 'قريش', englishName: 'Quraish', ayahs: 4, revelationType: 'Meccan', order: 29, verses: createSampleAyahs(106, 4) },
  { id: 107, name: 'Al-Maun', arabicName: 'الماعون', englishName: 'The Small Kindnesses', ayahs: 7, revelationType: 'Meccan', order: 17, verses: createSampleAyahs(107, 7) },
  { id: 108, name: 'Al-Kawthar', arabicName: 'الكوثر', englishName: 'The River of Abundance', ayahs: 3, revelationType: 'Meccan', order: 15, verses: createSampleAyahs(108, 3) },
  { id: 109, name: 'Al-Kafirun', arabicName: 'الكافرون', englishName: 'The Disbelievers', ayahs: 6, revelationType: 'Meccan', order: 18, verses: createSampleAyahs(109, 6) },
  { id: 110, name: 'An-Nasr', arabicName: 'النصر', englishName: 'The Help', ayahs: 3, revelationType: 'Medinan', order: 114, verses: createSampleAyahs(110, 3) },
  { id: 111, name: 'Al-Masad', arabicName: 'المسد', englishName: 'The Palm Fiber', ayahs: 5, revelationType: 'Meccan', order: 6, verses: createSampleAyahs(111, 5) },
  { id: 112, name: 'Al-Ikhlas', arabicName: 'الإخلاص', englishName: 'The Sincerity', ayahs: 4, revelationType: 'Meccan', order: 22, verses: createSampleAyahs(112, 4) },
  { id: 113, name: 'Al-Falaq', arabicName: 'الفلق', englishName: 'The Daybreak', ayahs: 5, revelationType: 'Meccan', order: 20, verses: createSampleAyahs(113, 5) },
  { id: 114, name: 'An-Nas', arabicName: 'الناس', englishName: 'The People', ayahs: 6, revelationType: 'Meccan', order: 21, verses: createSampleAyahs(114, 6) },
];

export const getSurahById = (id: number): Surah | undefined => {
  return SURAHS.find(surah => surah.id === id);
};

export const searchSurahs = (query: string): Surah[] => {
  const lowercaseQuery = query.toLowerCase();
  return SURAHS.filter(surah => 
    surah.name.toLowerCase().includes(lowercaseQuery) ||
    surah.englishName.toLowerCase().includes(lowercaseQuery) ||
    surah.arabicName.includes(query)
  );
};

export const getTotalAyahs = (): number => {
  return SURAHS.reduce((total, surah) => total + surah.ayahs, 0);
};