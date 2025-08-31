export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  country: string;
  description: string;
  biography: string;
  recitationStyle: string;
  audioQuality: string;
  sampleAyahs: {
    surah: number;
    ayah: number;
    text: string;
    translation: string;
  }[];
  audioUrl: string;
  popularity: number;
  specialties: string[];
}

export const TOP_RECITERS: Reciter[] = [
  {
    id: 'almatroud',
    name: 'Sheikh Almatroud',
    arabicName: 'الشيخ المطرود',
    country: 'Saudi Arabia',
    description: 'Beautiful and clear recitation with perfect Tajweed',
    biography: 'Sheikh Almatroud is a renowned Saudi Qari known for his beautiful and clear recitation. He has a distinctive voice that combines clarity with emotional depth.',
    recitationStyle: 'Clear and beautiful',
    audioQuality: '192kbps',
    sampleAyahs: [
      {
        surah: 1,
        ayah: 1,
        text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.'
      },
      {
        surah: 2,
        ayah: 255,
        text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
        translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence.'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Almatroud_128kbps/',
    popularity: 100,
    specialties: ['Clear recitation', 'Perfect Tajweed', 'Beautiful voice']
  },
  {
    id: 'mishary-alafasy',
    name: 'Mishary Rashid Alafasy',
    arabicName: 'مشاري بن راشد العفاسي',
    country: 'Kuwait',
    description: 'Melodious and clear recitation with beautiful voice',
    biography: 'Sheikh Mishary Rashid Alafasy is a renowned Kuwaiti Qari born in 1976. He is known for his melodious voice and precise recitation. He has memorized the Quran and is also an Islamic preacher and Imam.',
    recitationStyle: 'Melodious with perfect Tajweed',
    audioQuality: '192kbps',
    sampleAyahs: [
      {
        surah: 1,
        ayah: 1,
        text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.'
      },
      {
        surah: 2,
        ayah: 255,
        text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
        translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence.'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/',
    popularity: 99,
    specialties: ['Melodious recitation', 'Perfect Tajweed', 'Emotional delivery']
  },
  {
    id: 'abdur-rahman-sudais',
    name: 'Abdur-Rahman as-Sudais',
    arabicName: 'عبد الرحمن السديس',
    country: 'Saudi Arabia',
    description: 'Emotional and powerful recitation, Imam of Masjid al-Haram',
    biography: 'Sheikh Abdur-Rahman as-Sudais is the chief Imam and Khateeb of Masjid al-Haram in Mecca. Born in 1960, he is known for his emotional and powerful recitation that moves hearts worldwide.',
    recitationStyle: 'Emotional and powerful',
    audioQuality: '192kbps',
    sampleAyahs: [
      {
        surah: 3,
        ayah: 26,
        text: 'قُلِ اللَّهُمَّ مَالِكَ الْمُلْكِ',
        translation: 'Say, "O Allah, Owner of Sovereignty"'
      },
      {
        surah: 55,
        ayah: 13,
        text: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
        translation: 'So which of the favors of your Lord would you deny?'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Abdurrahman_As-Sudais_192kbps/',
    popularity: 98,
    specialties: ['Emotional delivery', 'Masjid al-Haram Imam', 'Powerful voice']
  },
  {
    id: 'maher-al-muaiqly',
    name: 'Maher Al Muaiqly',
    arabicName: 'ماهر المعيقلي',
    country: 'Saudi Arabia',
    description: 'Precise and clear recitation with beautiful tone',
    biography: 'Sheikh Maher Al Muaiqly is a Saudi Qari and Imam of Masjid al-Haram. Born in 1969, he is known for his precise recitation and beautiful voice that captivates listeners worldwide.',
    recitationStyle: 'Precise and clear',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 18,
        ayah: 1,
        text: 'الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ',
        translation: 'Praise to Allah, who has sent down upon His Servant the Book'
      },
      {
        surah: 36,
        ayah: 1,
        text: 'يس',
        translation: 'Ya-Seen.'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Maher_AlMuaiqly_128kbps/',
    popularity: 95,
    specialties: ['Precise recitation', 'Beautiful tone', 'Masjid al-Haram Imam']
  },
  {
    id: 'abdullah-basfar',
    name: 'Abdullah Basfar',
    arabicName: 'عبد الله بصفر',
    country: 'Saudi Arabia',
    description: 'Melodious and distinctive voice with emotional depth',
    biography: 'Sheikh Abdullah Basfar is a renowned Saudi Qari known for his melodious and distinctive recitation. He has a unique style that combines beauty with proper Tajweed rules.',
    recitationStyle: 'Melodious and distinctive',
    audioQuality: '192kbps',
    sampleAyahs: [
      {
        surah: 67,
        ayah: 1,
        text: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ',
        translation: 'Blessed is He in whose hand is dominion'
      },
      {
        surah: 112,
        ayah: 1,
        text: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
        translation: 'Say, "He is Allah, [who is] One"'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Abdullah_Basfar_192kbps/',
    popularity: 92,
    specialties: ['Melodious voice', 'Distinctive style', 'Emotional depth']
  },
  {
    id: 'saad-al-ghamdi',
    name: 'Saad Al-Ghamdi',
    arabicName: 'سعد الغامدي',
    country: 'Saudi Arabia',
    description: 'Emotional and spiritual recitation that touches hearts',
    biography: 'Sheikh Saad Al-Ghamdi is a Saudi Qari known for his emotional and spiritual recitation. His voice has the ability to move listeners to tears and create a deep spiritual connection.',
    recitationStyle: 'Emotional and spiritual',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 21,
        ayah: 87,
        text: 'لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ',
        translation: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.'
      },
      {
        surah: 25,
        ayah: 74,
        text: 'وَالَّذِينَ يَقُولُونَ رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا',
        translation: 'And those who say, "Our Lord, grant us from among our wives"'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Saad_Al-Ghamdi_128kbps/',
    popularity: 90,
    specialties: ['Emotional delivery', 'Spiritual connection', 'Heart-touching voice']
  },
  {
    id: 'ali-al-hudhaify',
    name: 'Ali Al-Hudhaify',
    arabicName: 'علي الحذيفي',
    country: 'Saudi Arabia',
    description: 'Classical and traditional recitation style',
    biography: 'Sheikh Ali Al-Hudhaify is a respected Saudi Qari and former Imam of Masjid an-Nabawi in Medina. He is known for his classical recitation style and adherence to traditional Quranic recitation methods.',
    recitationStyle: 'Classical and traditional',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 4,
        ayah: 1,
        text: 'يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمُ',
        translation: 'O mankind, fear your Lord'
      },
      {
        surah: 24,
        ayah: 35,
        text: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ',
        translation: 'Allah is the light of the heavens and the earth'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Ali_Al-Hudhaify_128kbps/',
    popularity: 88,
    specialties: ['Classical style', 'Traditional methods', 'Masjid an-Nabawi Imam']
  },
  {
    id: 'abu-bakr-al-shatri',
    name: 'Abu Bakr al-Shatri',
    arabicName: 'أبو بكر الشاطري',
    country: 'Saudi Arabia',
    description: 'Unique and captivating recitation style',
    biography: 'Sheikh Abu Bakr al-Shatri is a Saudi Qari known for his unique and captivating recitation style. His voice has a distinctive quality that makes his recitation easily recognizable.',
    recitationStyle: 'Unique and captivating',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 17,
        ayah: 110,
        text: 'قُلِ ادْعُوا اللَّهَ أَوِ ادْعُوا الرَّحْمَٰنَ',
        translation: 'Say, "Call upon Allah or call upon the Most Merciful"'
      },
      {
        surah: 50,
        ayah: 16,
        text: 'وَلَقَدْ خَلَقْنَا الْإِنسَانَ وَنَعْلَمُ مَا تُوَسْوِسُ بِهِ نَفْسُهُ',
        translation: 'And We have already created man and know what his soul whispers to him'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Abu_Bakr_Al-Shatri_128kbps/',
    popularity: 85,
    specialties: ['Unique style', 'Captivating voice', 'Distinctive quality']
  },
  {
    id: 'ahmad-al-ajmi',
    name: 'Ahmad Al-Ajmi',
    arabicName: 'أحمد العجمي',
    country: 'Saudi Arabia',
    description: 'Powerful and resonant voice with emotional impact',
    biography: 'Sheikh Ahmad Al-Ajmi is a Saudi Qari known for his powerful and resonant voice. His recitation has a strong emotional impact and is beloved by millions of Muslims worldwide.',
    recitationStyle: 'Powerful and resonant',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 39,
        ayah: 53,
        text: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ',
        translation: 'Say, "O My servants who have transgressed against themselves"'
      },
      {
        surah: 94,
        ayah: 1,
        text: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ',
        translation: 'Did We not expand for you, [O Muhammad], your breast?'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Ahmad_Al-Ajmi_128kbps/',
    popularity: 83,
    specialties: ['Powerful voice', 'Resonant tone', 'Emotional impact']
  },
  {
    id: 'mohamed-siddiq-al-minshawi',
    name: 'Mohamed Siddiq al-Minshawi',
    arabicName: 'محمد صديق المنشاوي',
    country: 'Egypt',
    description: 'Classical masterpiece with perfect Maqamat',
    biography: 'Sheikh Mohamed Siddiq al-Minshawi (1920-1969) was an Egyptian Qari considered one of the greatest reciters of all time. His recitation with Maqamat (musical modes) is considered a classical masterpiece.',
    recitationStyle: 'Classical with Maqamat',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 12,
        ayah: 4,
        text: 'إِذْ قَالَ يُوسُفُ لِأَبِيهِ يَا أَبَتِ',
        translation: 'When Joseph said to his father, "O my father"'
      },
      {
        surah: 19,
        ayah: 1,
        text: 'كهيعص',
        translation: 'Kaf, Ha, Ya, Ayn, Sad.'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Minshawi_Mujawwad_128kbps/',
    popularity: 95,
    specialties: ['Classical Maqamat', 'Perfect technique', 'Legendary status']
  },
  {
    id: 'mohamed-al-tablawi',
    name: 'Mohamed al-Tablawi',
    arabicName: 'محمد الطبلاوي',
    country: 'Egypt',
    description: 'Melodious and heart-touching Egyptian style',
    biography: 'Sheikh Mohamed al-Tablawi (1934-2010) was a renowned Egyptian Qari known for his melodious and heart-touching recitation. His style represents the best of Egyptian Quranic recitation tradition.',
    recitationStyle: 'Melodious Egyptian style',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 7,
        ayah: 180,
        text: 'وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا',
        translation: 'And to Allah belong the best names, so invoke Him by them'
      },
      {
        surah: 20,
        ayah: 114,
        text: 'فَتَعَالَى اللَّهُ الْمَلِكُ الْحَقُّ',
        translation: 'So high [above all] is Allah, the Sovereign, the Truth'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Tablawi_128kbps/',
    popularity: 88,
    specialties: ['Melodious voice', 'Heart-touching', 'Egyptian tradition']
  },
  {
    id: 'aliyu-jabir',
    name: 'Aliyu Jabir',
    arabicName: 'علي جابر',
    country: 'Nigeria',
    description: 'Beautiful African recitation with emotional depth',
    biography: 'Sheikh Aliyu Jabir is a renowned Nigerian Qari known for his beautiful recitation and deep understanding of the Quran. He represents the rich tradition of Quranic recitation in West Africa.',
    recitationStyle: 'Beautiful and emotional',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 2,
        ayah: 286,
        text: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
        translation: 'Allah does not charge a soul except [with that within] its capacity'
      },
      {
        surah: 33,
        ayah: 56,
        text: 'إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ',
        translation: 'Indeed, Allah confers blessing upon the Prophet, and His angels [ask Him to do so]'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Aliyu_Jabir_128kbps/',
    popularity: 75,
    specialties: ['African tradition', 'Emotional depth', 'Beautiful voice']
  },
  {
    id: 'bandar-baleela',
    name: 'Bandar Baleela',
    arabicName: 'بندر بليلة',
    country: 'Saudi Arabia',
    description: 'Young talented reciter with modern appeal',
    biography: 'Sheikh Bandar Baleela is a young and talented Saudi Qari who has gained popularity for his beautiful recitation and modern appeal. He represents the new generation of Quranic reciters.',
    recitationStyle: 'Modern and appealing',
    audioQuality: '192kbps',
    sampleAyahs: [
      {
        surah: 55,
        ayah: 1,
        text: 'الرَّحْمَٰنُ',
        translation: 'The Most Merciful'
      },
      {
        surah: 78,
        ayah: 1,
        text: 'عَمَّ يَتَسَاءَلُونَ',
        translation: 'About what are they asking one another?'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Bandar_Baleela_192kbps/',
    popularity: 78,
    specialties: ['Young talent', 'Modern appeal', 'Beautiful recitation']
  },
  {
    id: 'yasser-al-dosari',
    name: 'Yasser Al-Dosari',
    arabicName: 'ياسر الدوسري',
    country: 'Saudi Arabia',
    description: 'Emotional and powerful recitation',
    biography: 'Sheikh Yasser Al-Dosari is a Saudi Qari known for his emotional and powerful recitation. He is the Imam of several mosques and has a distinctive voice that moves listeners.',
    recitationStyle: 'Emotional and powerful',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 6,
        ayah: 59,
        text: 'وَعِندَهُ مَفَاتِحُ الْغَيْبِ لَا يَعْلَمُهَا إِلَّا هُوَ',
        translation: 'And with Him are the keys of the unseen; none knows them except Him'
      },
      {
        surah: 23,
        ayah: 1,
        text: 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ',
        translation: 'Certainly will the believers have succeeded'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Yasser_Al-Dosari_128kbps/',
    popularity: 82,
    specialties: ['Emotional delivery', 'Powerful voice', 'Moving recitation']
  },
  {
    id: 'khalid-al-jalil',
    name: 'Khalid Al-Jalil',
    arabicName: 'خالد الجليل',
    country: 'Saudi Arabia',
    description: 'Melodious voice with perfect pronunciation',
    biography: 'Sheikh Khalid Al-Jalil is a Saudi Qari known for his melodious voice and perfect pronunciation. He has served as an Imam in various mosques and is beloved for his beautiful recitation.',
    recitationStyle: 'Melodious with perfect pronunciation',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 13,
        ayah: 28,
        text: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
        translation: 'Unquestionably, by the remembrance of Allah hearts are assured'
      },
      {
        surah: 35,
        ayah: 1,
        text: 'الْحَمْدُ لِلَّهِ فَاطِرِ السَّمَاوَاتِ وَالْأَرْضِ',
        translation: 'Praise to Allah, Creator of the heavens and earth'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Khalid_Al-Jalil_128kbps/',
    popularity: 80,
    specialties: ['Melodious voice', 'Perfect pronunciation', 'Beautiful recitation']
  },
  {
    id: 'nasser-al-qatami',
    name: 'Nasser Al-Qatami',
    arabicName: 'ناصر القطامي',
    country: 'Saudi Arabia',
    description: 'Clear and precise recitation with beautiful tone',
    biography: 'Sheikh Nasser Al-Qatami is a Saudi Qari and Imam known for his clear and precise recitation. He has a beautiful tone that makes his recitation very pleasant to listen to.',
    recitationStyle: 'Clear and precise',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 8,
        ayah: 2,
        text: 'إِنَّمَا الْمُؤْمِنُونَ الَّذِينَ إِذَا ذُكِرَ اللَّهُ وَجِلَتْ قُلُوبُهُمْ',
        translation: 'The believers are only those who, when Allah is mentioned, their hearts become fearful'
      },
      {
        surah: 29,
        ayah: 45,
        text: 'وَلَذِكْرُ اللَّهِ أَكْبَرُ',
        translation: 'And the remembrance of Allah is greater'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Nasser_Al-Qatami_128kbps/',
    popularity: 77,
    specialties: ['Clear recitation', 'Precise pronunciation', 'Beautiful tone']
  },
  {
    id: 'fares-abbad',
    name: 'Fares Abbad',
    arabicName: 'فارس عباد',
    country: 'Kuwait',
    description: 'Young reciter with emotional and beautiful voice',
    biography: 'Sheikh Fares Abbad is a young Kuwaiti Qari who has gained recognition for his emotional and beautiful recitation. He represents the new generation of talented reciters.',
    recitationStyle: 'Emotional and beautiful',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 11,
        ayah: 88,
        text: 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ',
        translation: 'And my success is not but through Allah'
      },
      {
        surah: 42,
        ayah: 36,
        text: 'فَمَا أُوتِيتُم مِّن شَيْءٍ فَمَتَاعُ الْحَيَاةِ الدُّنْيَا',
        translation: 'So whatever thing you have been given - it is but [for] enjoyment of the worldly life'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Fares_Abbad_128kbps/',
    popularity: 73,
    specialties: ['Young talent', 'Emotional voice', 'Beautiful recitation']
  },
  {
    id: 'salah-al-budair',
    name: 'Salah Al-Budair',
    arabicName: 'صلاح البدير',
    country: 'Saudi Arabia',
    description: 'Imam of Masjid an-Nabawi with classical style',
    biography: 'Sheikh Salah Al-Budair is a Saudi Qari and Imam of Masjid an-Nabawi in Medina. He is known for his classical recitation style and serves as one of the leading Imams of the Prophet\'s Mosque.',
    recitationStyle: 'Classical and traditional',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 9,
        ayah: 129,
        text: 'فَإِن تَوَلَّوْا فَقُلْ حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ',
        translation: 'But if they turn away, then say, "Sufficient for me is Allah; there is no deity except Him"'
      },
      {
        surah: 48,
        ayah: 29,
        text: 'مُّحَمَّدٌ رَّسُولُ اللَّهِ',
        translation: 'Muhammad is the Messenger of Allah'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Salah_Al-Budair_128kbps/',
    popularity: 85,
    specialties: ['Masjid an-Nabawi Imam', 'Classical style', 'Traditional recitation']
  },
  {
    id: 'omar-al-kazabri',
    name: 'Omar Al-Kazabri',
    arabicName: 'عمر الكزابري',
    country: 'Morocco',
    description: 'Maghrebi style with beautiful Moroccan recitation',
    biography: 'Sheikh Omar Al-Kazabri is a renowned Moroccan Qari known for his beautiful Maghrebi style of recitation. He represents the rich tradition of Quranic recitation in North Africa.',
    recitationStyle: 'Maghrebi style',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 14,
        ayah: 7,
        text: 'وَإِذْ تَأَذَّنَ رَبُّكُمْ لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
        translation: 'And [remember] when your Lord proclaimed, "If you are grateful, I will certainly give you more"'
      },
      {
        surah: 31,
        ayah: 31,
        text: 'إِنَّ فِي ذَٰلِكَ لَآيَاتٍ لِّكُلِّ صَبَّارٍ شَكُورٍ',
        translation: 'Indeed in that are signs for everyone patient and grateful'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Omar_Al-Kazabri_128kbps/',
    popularity: 70,
    specialties: ['Maghrebi style', 'North African tradition', 'Beautiful recitation']
  },
  {
    id: 'idris-abkar',
    name: 'Idris Abkar',
    arabicName: 'إدريس أبكر',
    country: 'Sudan',
    description: 'Sudanese recitation with unique African style',
    biography: 'Sheikh Idris Abkar is a Sudanese Qari known for his unique African style of recitation. He brings the rich tradition of Sudanese Quranic recitation to the global Muslim community.',
    recitationStyle: 'Unique African style',
    audioQuality: '128kbps',
    sampleAyahs: [
      {
        surah: 16,
        ayah: 97,
        text: 'مَنْ عَمِلَ صَالِحًا مِّن ذَكَرٍ أَوْ أُنثَىٰ وَهُوَ مُؤْمِنٌ',
        translation: 'Whoever does righteousness, whether male or female, while he is a believer'
      },
      {
        surah: 40,
        ayah: 40,
        text: 'مَنْ عَمِلَ سَيِّئَةً فَلَا يُجْزَىٰ إِلَّا مِثْلَهَا',
        translation: 'Whoever does an evil deed will not be recompensed except by the like thereof'
      }
    ],
    audioUrl: 'https://everyayah.com/data/Idris_Abkar_128kbps/',
    popularity: 68,
    specialties: ['Sudanese tradition', 'African style', 'Unique recitation']
  }
];

export const getReciterById = (id: string): Reciter | undefined => {
  return TOP_RECITERS.find(reciter => reciter.id === id);
};

export const getTopReciters = (limit?: number): Reciter[] => {
  const sorted = TOP_RECITERS.sort((a, b) => b.popularity - a.popularity);
  return limit ? sorted.slice(0, limit) : sorted;
};

export const searchReciters = (query: string): Reciter[] => {
  const lowercaseQuery = query.toLowerCase();
  return TOP_RECITERS.filter(reciter => 
    reciter.name.toLowerCase().includes(lowercaseQuery) ||
    reciter.arabicName.includes(query) ||
    reciter.country.toLowerCase().includes(lowercaseQuery)
  );
};