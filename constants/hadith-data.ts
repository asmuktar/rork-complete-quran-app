export interface HadithCollection {
  id: string;
  name: string;
  arabicName: string;
  compiler: string;
  totalHadiths: number;
  description: string;
  authenticity: 'Sahih' | 'Hasan' | 'Mixed';
  available: boolean;
}

export interface Hadith {
  id: number;
  number: number;
  arab: string;
  translation: string;
  narrator: string;
  grade: string;
  book: string;
  chapter: string;
  collection: string;
  keywords: string[];
}

export const HADITH_COLLECTIONS: HadithCollection[] = [
  {
    id: 'bukhari',
    name: 'Sahih al-Bukhari',
    arabicName: 'صحيح البخاري',
    compiler: 'Imam al-Bukhari',
    totalHadiths: 7563,
    description: 'The most authentic collection of Hadith after the Quran',
    authenticity: 'Sahih',
    available: true
  },
  {
    id: 'muslim',
    name: 'Sahih Muslim',
    arabicName: 'صحيح مسلم',
    compiler: 'Imam Muslim',
    totalHadiths: 7190,
    description: 'Second most authentic collection after Bukhari',
    authenticity: 'Sahih',
    available: true
  },
  {
    id: 'abudawud',
    name: 'Sunan Abu Dawud',
    arabicName: 'سنن أبي داود',
    compiler: 'Abu Dawud',
    totalHadiths: 5274,
    description: 'Focus on legal and practical matters of Islam',
    authenticity: 'Mixed',
    available: true
  },
  {
    id: 'tirmidhi',
    name: 'Jami at-Tirmidhi',
    arabicName: 'جامع الترمذي',
    compiler: 'At-Tirmidhi',
    totalHadiths: 3956,
    description: 'Known for grading authenticity of hadiths',
    authenticity: 'Mixed',
    available: true
  },
  {
    id: 'nasai',
    name: 'Sunan an-Nasa\'i',
    arabicName: 'سنن النسائي',
    compiler: 'An-Nasa\'i',
    totalHadiths: 5761,
    description: 'Strict criteria for hadith acceptance',
    authenticity: 'Mixed',
    available: true
  },
  {
    id: 'ibnmajah',
    name: 'Sunan Ibn Majah',
    arabicName: 'سنن ابن ماجه',
    compiler: 'Ibn Majah',
    totalHadiths: 4341,
    description: 'Completes the six major collections (Kutub as-Sittah)',
    authenticity: 'Mixed',
    available: true
  },
  {
    id: 'malik',
    name: 'Muwatta Malik',
    arabicName: 'موطأ مالك',
    compiler: 'Imam Malik',
    totalHadiths: 1594,
    description: 'Earliest surviving collection of hadith',
    authenticity: 'Sahih',
    available: true
  },
  {
    id: 'ahmad',
    name: 'Musnad Ahmad',
    arabicName: 'مسند أحمد',
    compiler: 'Ahmad ibn Hanbal',
    totalHadiths: 26363,
    description: 'Largest collection of hadiths by narrator',
    authenticity: 'Mixed',
    available: true
  },
  {
    id: 'arbauna',
    name: 'An-Nawawi\'s Forty Hadith',
    arabicName: 'الأربعون النووية',
    compiler: 'Imam An-Nawawi',
    totalHadiths: 42,
    description: 'Forty essential hadiths covering fundamental Islamic principles',
    authenticity: 'Sahih',
    available: true
  }
];

export const HADITH_DATABASE: Hadith[] = [
  // Sahih al-Bukhari
  {
    id: 1,
    number: 1,
    arab: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوِ امْرَأَةٍ يَنْكِحُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ',
    translation: 'Actions are but by intention and every man shall have only that which he intended. Therefore, he whose migration (Hijrah) was for Allah and His Messenger, his migration was for Allah and His Messenger, and he whose migration was to achieve some worldly benefit or to take some woman in marriage, his migration was for that for which he migrated.',
    narrator: 'Umar ibn al-Khattab (RA)',
    grade: 'Sahih',
    book: 'Book of Revelation',
    chapter: 'How the Divine Inspiration started',
    collection: 'bukhari',
    keywords: ['intention', 'niyyah', 'actions', 'migration', 'hijrah', 'purpose', 'deed']
  },
  {
    id: 2,
    number: 13,
    arab: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    translation: 'None of you truly believes until he loves for his brother what he loves for himself.',
    narrator: 'Anas ibn Malik (RA)',
    grade: 'Sahih',
    book: 'Book of Faith',
    chapter: 'The sign of faith',
    collection: 'bukhari',
    keywords: ['love', 'brother', 'believe', 'faith', 'selfless', 'care', 'iman']
  },
  {
    id: 3,
    number: 15,
    arab: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ، وَالْمُهَاجِرُ مَنْ هَجَرَ مَا نَهَى اللَّهُ عَنْهُ',
    translation: 'A Muslim is one from whose tongue and hand the Muslims are safe, and a Muhajir (emigrant) is one who gives up (abandons) all what Allah has forbidden.',
    narrator: 'Abdullah ibn Amr (RA)',
    grade: 'Sahih',
    book: 'Book of Faith',
    chapter: 'The Muslim is one from whom Muslims are safe',
    collection: 'bukhari',
    keywords: ['muslim', 'safe', 'tongue', 'hand', 'harm', 'peace', 'muhajir']
  },
  {
    id: 4,
    number: 6136,
    arab: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ جَارَهُ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ ضَيْفَهُ',
    translation: 'Whoever believes in Allah and the Last Day should speak good or remain silent. And whoever believes in Allah and the Last Day should honor his neighbor. And whoever believes in Allah and the Last Day should honor his guest.',
    narrator: 'Abu Hurairah (RA)',
    grade: 'Sahih',
    book: 'Book of Good Manners',
    chapter: 'Good speech or silence',
    collection: 'bukhari',
    keywords: ['speak', 'good', 'silent', 'allah', 'last day', 'words', 'neighbor', 'guest', 'hospitality']
  },
  {
    id: 5,
    number: 2442,
    arab: 'مَا مِنْ مُسْلِمٍ يَغْرِسُ غَرْسًا أَوْ يَزْرَعُ زَرْعًا فَيَأْكُلُ مِنْهُ طَيْرٌ أَوْ إِنْسَانٌ أَوْ بَهِيمَةٌ إِلاَّ كَانَ لَهُ بِهِ صَدَقَةٌ',
    translation: 'No Muslim plants a tree or sows a crop from which birds, humans, or animals eat, except that it counts as charity (Sadaqah) for him.',
    narrator: 'Anas ibn Malik (RA)',
    grade: 'Sahih',
    book: 'Book of Agriculture',
    chapter: 'The virtue of planting and farming',
    collection: 'bukhari',
    keywords: ['plant', 'tree', 'charity', 'sadaqah', 'environment', 'animals', 'reward', 'agriculture']
  },
  
  // Sahih Muslim
  {
    id: 6,
    number: 1,
    arab: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّةِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    translation: 'Verily actions are by intention, and for every person is what he intended.',
    narrator: 'Umar ibn al-Khattab (RA)',
    grade: 'Sahih',
    book: 'Book of Faith',
    chapter: 'The obligation of having good intention',
    collection: 'muslim',
    keywords: ['intention', 'niyyah', 'actions', 'purpose', 'deed']
  },
  {
    id: 7,
    number: 223,
    arab: 'الطَّهُورُ شَطْرُ الإِيمَانِ وَالْحَمْدُ لِلَّهِ تَمْلأُ الْمِيزَانَ وَسُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ تَمْلآنِ أَوْ تَمْلأُ مَا بَيْنَ السَّمَاوَاتِ وَالأَرْضِ',
    translation: 'Purification is half of faith. Praise be to Allah fills the scale. Glory be to Allah and praise be to Allah fill what is between the heavens and the earth.',
    narrator: 'Abu Malik al-Ash\'ari (RA)',
    grade: 'Sahih',
    book: 'Book of Purification',
    chapter: 'The virtue of purification and dhikr',
    collection: 'muslim',
    keywords: ['purification', 'faith', 'praise', 'allah', 'dhikr', 'tasbih', 'tahmid']
  },
  {
    id: 8,
    number: 635,
    arab: 'مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ',
    translation: 'Whoever prays the two cool prayers (Fajr and Asr) will enter Paradise.',
    narrator: 'Abu Musa al-Ashari (RA)',
    grade: 'Sahih',
    book: 'Book of Prayer',
    chapter: 'The virtue of Fajr and Asr prayers',
    collection: 'muslim',
    keywords: ['prayer', 'fajr', 'asr', 'paradise', 'jannah', 'salah']
  },
  {
    id: 9,
    number: 2564,
    arab: 'لَيْسَ الْمُؤْمِنُ الَّذِي يَشْبَعُ وَجَارُهُ جَائِعٌ إِلَى جَنْبِهِ',
    translation: 'The believer is not one who eats his fill while his neighbor goes hungry beside him.',
    narrator: 'Anas ibn Malik (RA)',
    grade: 'Sahih',
    book: 'Book of Righteousness',
    chapter: 'The rights of neighbors',
    collection: 'muslim',
    keywords: ['neighbor', 'hungry', 'believer', 'food', 'sharing', 'kindness', 'rights']
  },
  {
    id: 10,
    number: 2699,
    arab: 'مَنْ نَفَّسَ عَنْ مُؤْمِنٍ كُرْبَةً مِنْ كُرَبِ الدُّنْيَا نَفَّسَ اللَّهُ عَنْهُ كُرْبَةً مِنْ كُرَبِ يَوْمِ الْقِيَامَةِ',
    translation: 'Whoever relieves a believer of distress in this world, Allah will relieve him of distress on the Day of Resurrection.',
    narrator: 'Abu Hurairah (RA)',
    grade: 'Sahih',
    book: 'Book of Remembrance of Allah',
    chapter: 'The virtue of helping others',
    collection: 'muslim',
    keywords: ['relieve', 'distress', 'help', 'believer', 'resurrection', 'reward', 'kindness']
  },
  
  // Sunan Abu Dawud
  {
    id: 11,
    number: 4682,
    arab: 'مَنْ رَأَى مِنْكُمْ مُنْكَرًا فَلْيُغَيِّرْهُ بِيَدِهِ فَإِنْ لَمْ يَسْتَطِعْ فَبِلِسَانِهِ فَإِنْ لَمْ يَسْتَطِعْ فَبِقَلْبِهِ وَذَلِكَ أَضْعَفُ الإِيمَانِ',
    translation: 'Whoever among you sees a wrong action, let him change it with his hand; if he cannot, then with his tongue; if he cannot, then with his heart - and that is the weakest of faith.',
    narrator: 'Abu Sa\'id al-Khudri (RA)',
    grade: 'Sahih',
    book: 'Book of Battles',
    chapter: 'Commanding good and forbidding evil',
    collection: 'abudawud',
    keywords: ['wrong', 'change', 'hand', 'tongue', 'heart', 'faith', 'enjoin', 'forbid']
  },
  {
    id: 12,
    number: 4297,
    arab: 'إِذَا تَوَضَّأَ الْعَبْدُ الْمُسْلِمُ أَوِ الْمُؤْمِنُ فَغَسَلَ وَجْهَهُ خَرَجَ مِنْ وَجْهِهِ كُلُّ خَطِيئَةٍ نَظَرَ إِلَيْهَا بِعَيْنَيْهِ مَعَ الْمَاءِ',
    translation: 'When a Muslim or believer performs ablution and washes his face, every sin that he looked at with his eyes comes out from his face with the water.',
    narrator: 'Abu Hurairah (RA)',
    grade: 'Sahih',
    book: 'Book of Purification',
    chapter: 'The virtue of ablution',
    collection: 'abudawud',
    keywords: ['ablution', 'wudu', 'purification', 'sin', 'forgiveness', 'water', 'cleanse']
  },
  
  // Jami at-Tirmidhi
  {
    id: 13,
    number: 2682,
    arab: 'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ',
    translation: 'Fear Allah wherever you are, and follow a bad deed with a good one to erase it, and treat people with good character.',
    narrator: 'Abu Dharr (RA)',
    grade: 'Hasan',
    book: 'Book of Righteousness and Maintaining Good Relations',
    chapter: 'On fearing Allah and good character',
    collection: 'tirmidhi',
    keywords: ['fear', 'allah', 'taqwa', 'good deed', 'bad deed', 'erase', 'character', 'akhlaq']
  },
  {
    id: 14,
    number: 1987,
    arab: 'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ',
    translation: 'The best of people are those who benefit others.',
    narrator: 'Jabir ibn Abdullah (RA)',
    grade: 'Hasan',
    book: 'Book of Good Manners',
    chapter: 'The virtue of benefiting others',
    collection: 'tirmidhi',
    keywords: ['best', 'people', 'benefit', 'help', 'service', 'good', 'useful']
  },
  
  // Sunan an-Nasa'i
  {
    id: 15,
    number: 3104,
    arab: 'بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ وَإِقَامِ الصَّلاَةِ وَإِيتَاءِ الزَّكَاةِ وَالْحَجِّ وَصَوْمِ رَمَضَانَ',
    translation: 'Islam is built upon five: the testimony that there is no god but Allah and that Muhammad is the Messenger of Allah, establishing prayer, giving Zakat, Hajj, and fasting Ramadan.',
    narrator: 'Abdullah ibn Umar (RA)',
    grade: 'Sahih',
    book: 'Book of Faith',
    chapter: 'The pillars of Islam',
    collection: 'nasai',
    keywords: ['islam', 'pillars', 'shahada', 'prayer', 'zakat', 'hajj', 'fasting', 'ramadan']
  },
  {
    id: 16,
    number: 460,
    arab: 'الصَّلاَةُ عِمَادُ الدِّينِ فَمَنْ أَقَامَهَا أَقَامَ الدِّينَ وَمَنْ هَدَمَهَا هَدَمَ الدِّينَ',
    translation: 'Prayer is the pillar of religion. Whoever establishes it, establishes religion, and whoever destroys it, destroys religion.',
    narrator: 'Umar ibn al-Khattab (RA)',
    grade: 'Hasan',
    book: 'Book of Prayer',
    chapter: 'The importance of prayer',
    collection: 'nasai',
    keywords: ['prayer', 'salah', 'pillar', 'religion', 'establish', 'importance']
  },
  
  // Sunan Ibn Majah
  {
    id: 17,
    number: 224,
    arab: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ وَمُسْلِمَةٍ',
    translation: 'Seeking knowledge is an obligation upon every Muslim man and woman.',
    narrator: 'Anas ibn Malik (RA)',
    grade: 'Hasan',
    book: 'Book of Knowledge',
    chapter: 'The virtue of seeking knowledge',
    collection: 'ibnmajah',
    keywords: ['knowledge', 'seek', 'obligation', 'learn', 'education', 'study', 'ilm']
  },
  {
    id: 18,
    number: 223,
    arab: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ',
    translation: 'Whoever takes a path seeking knowledge, Allah will make easy for him a path to Paradise.',
    narrator: 'Abu Hurairah (RA)',
    grade: 'Sahih',
    book: 'Book of Knowledge',
    chapter: 'The reward of seeking knowledge',
    collection: 'ibnmajah',
    keywords: ['path', 'knowledge', 'paradise', 'jannah', 'reward', 'learn', 'study']
  },
  
  // Muwatta Malik
  {
    id: 19,
    number: 1728,
    arab: 'بَلِّغُوا عَنِّي وَلَوْ آيَةً',
    translation: 'Convey from me, even if it is one verse.',
    narrator: 'Abdullah ibn Amr (RA)',
    grade: 'Sahih',
    book: 'Book of Knowledge',
    chapter: 'The obligation to convey knowledge',
    collection: 'malik',
    keywords: ['convey', 'verse', 'knowledge', 'teach', 'share', 'dawah']
  },
  {
    id: 20,
    number: 1594,
    arab: 'الدِّينُ يُسْرٌ وَلَنْ يُشَادَّ الدِّينَ أَحَدٌ إِلاَّ غَلَبَهُ',
    translation: 'Religion is ease, and no one will make religion difficult except that it will overcome him.',
    narrator: 'Abu Hurairah (RA)',
    grade: 'Sahih',
    book: 'Book of Faith',
    chapter: 'Religion is ease',
    collection: 'malik',
    keywords: ['religion', 'ease', 'yusr', 'difficult', 'balance', 'moderation']
  },
  
  // Musnad Ahmad
  {
    id: 21,
    number: 6756,
    arab: 'إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلاً أَنْ يُتْقِنَهُ',
    translation: 'Indeed, Allah loves when one of you does a job, that he does it with excellence (Ihsan).',
    narrator: 'Aisha (RA)',
    grade: 'Hasan',
    book: 'Musnad of the Mothers of the Believers',
    chapter: 'Excellence in work',
    collection: 'ahmad',
    keywords: ['allah', 'love', 'work', 'excellence', 'ihsan', 'perfection', 'quality']
  },
  {
    id: 22,
    number: 7423,
    arab: 'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ ارْحَمُوا مَنْ فِي الأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ',
    translation: 'Those who are merciful will be shown mercy by the Merciful One. Be merciful to others and you will receive mercy from the One in the heavens.',
    narrator: 'Abdullah ibn Amr (RA)',
    grade: 'Sahih',
    book: 'Musnad of Abdullah ibn Amr',
    chapter: 'The virtue of mercy',
    collection: 'ahmad',
    keywords: ['mercy', 'merciful', 'rahman', 'compassion', 'kindness', 'heaven']
  },
  
  // Additional Bukhari hadiths to fill gaps
  {
    id: 23,
    number: 2,
    arab: 'بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ وَإِقَامِ الصَّلاَةِ وَإِيتَاءِ الزَّكَاةِ وَالْحَجِّ وَصَوْمِ رَمَضَانَ',
    translation: 'Islam is built upon five: the testimony that there is no god but Allah and that Muhammad is the Messenger of Allah, establishing prayer, giving Zakat, Hajj, and fasting Ramadan.',
    narrator: 'Abdullah ibn Umar (RA)',
    grade: 'Sahih',
    book: 'Book of Faith',
    chapter: 'The pillars of Islam',
    collection: 'bukhari',
    keywords: ['islam', 'pillars', 'shahada', 'prayer', 'zakat', 'hajj', 'fasting', 'ramadan']
  },
  {
    id: 24,
    number: 3,
    arab: 'الإِيمَانُ بِضْعٌ وَسَبْعُونَ شُعْبَةً فَأَفْضَلُهَا قَوْلُ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَدْنَاهَا إِمَاطَةُ الأَذَى عَنِ الطَّرِيقِ وَالْحَيَاءُ شُعْبَةٌ مِنَ الإِيمَانِ',
    translation: 'Faith has seventy-odd branches, the best of which is saying La ilaha illa Allah (there is no god but Allah), and the least of which is removing harmful things from the road. And modesty is a branch of faith.',
    narrator: 'Abu Hurairah (RA)',
    grade: 'Sahih',
    book: 'Book of Faith',
    chapter: 'The branches of faith',
    collection: 'bukhari',
    keywords: ['faith', 'branches', 'la ilaha illa allah', 'modesty', 'road', 'harm']
  },
  {
    id: 25,
    number: 4,
    arab: 'مَنْ كَذَبَ عَلَيَّ مُتَعَمِّدًا فَلْيَتَبَوَّأْ مَقْعَدَهُ مِنَ النَّارِ',
    translation: 'Whoever lies about me deliberately, let him take his place in the Fire.',
    narrator: 'Ali ibn Abi Talib (RA)',
    grade: 'Sahih',
    book: 'Book of Knowledge',
    chapter: 'The sin of lying about the Prophet',
    collection: 'bukhari',
    keywords: ['lie', 'deliberately', 'fire', 'hell', 'prophet', 'false']
  },
  {
    id: 26,
    number: 5,
    arab: 'مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ فِيهِ فَهُوَ رَدٌّ',
    translation: 'Whoever introduces something into this matter of ours (Islam) that is not part of it, it will be rejected.',
    narrator: 'Aisha (RA)',
    grade: 'Sahih',
    book: 'Book of Judgments',
    chapter: 'Innovation in religion',
    collection: 'bukhari',
    keywords: ['innovation', 'bidah', 'rejected', 'islam', 'introduce', 'matter']
  },
  {
    id: 27,
    number: 6,
    arab: 'الدِّينُ النَّصِيحَةُ قُلْنَا لِمَنْ قَالَ لِلَّهِ وَلِكِتَابِهِ وَلِرَسُولِهِ وَلأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ',
    translation: 'Religion is sincere advice. We asked: To whom? He said: To Allah, His Book, His Messenger, the leaders of the Muslims and their common people.',
    narrator: 'Tamim ad-Dari (RA)',
    grade: 'Sahih',
    book: 'Book of Faith',
    chapter: 'Religion is sincere advice',
    collection: 'bukhari',
    keywords: ['religion', 'advice', 'sincere', 'allah', 'book', 'messenger', 'leaders']
  },
  {
    id: 28,
    number: 7,
    arab: 'مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ وَمَا أَمَرْتُكُمْ بِهِ فَافْعَلُوا مِنْهُ مَا اسْتَطَعْتُمْ',
    translation: 'What I have forbidden you, avoid it. And what I have commanded you, do as much of it as you can.',
    narrator: 'Abu Hurairah (RA)',
    grade: 'Sahih',
    book: 'Book of Holding Fast to the Quran and Sunnah',
    chapter: 'Following the Prophet\'s commands',
    collection: 'bukhari',
    keywords: ['forbidden', 'avoid', 'command', 'ability', 'capacity', 'obedience']
  },
  {
    id: 29,
    number: 8,
    arab: 'أُمِرْتُ أَنْ أُقَاتِلَ النَّاسَ حَتَّى يَشْهَدُوا أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ',
    translation: 'I have been commanded to fight people until they testify that there is no god but Allah and that Muhammad is the Messenger of Allah.',
    narrator: 'Abdullah ibn Umar (RA)',
    grade: 'Sahih',
    book: 'Book of Faith',
    chapter: 'The testimony of faith',
    collection: 'bukhari',
    keywords: ['fight', 'testify', 'shahada', 'muhammad', 'messenger', 'commanded']
  },
  {
    id: 30,
    number: 9,
    arab: 'مَنْ قَالَ لاَ إِلَهَ إِلاَّ اللَّهُ وَكَفَرَ بِمَا يُعْبَدُ مِنْ دُونِ اللَّهِ حَرُمَ مَالُهُ وَدَمُهُ',
    translation: 'Whoever says La ilaha illa Allah (there is no god but Allah) and disbelieves in what is worshipped besides Allah, his wealth and blood become sacred.',
    narrator: 'Abu Malik (RA)',
    grade: 'Sahih',
    book: 'Book of Faith',
    chapter: 'The protection of saying La ilaha illa Allah',
    collection: 'bukhari',
    keywords: ['la ilaha illa allah', 'disbelieve', 'worship', 'sacred', 'wealth', 'blood']
  },
  {
    id: 31,
    number: 10,
    arab: 'خَيْرُ النَّاسِ قَرْنِي ثُمَّ الَّذِينَ يَلُونَهُمْ ثُمَّ الَّذِينَ يَلُونَهُمْ',
    translation: 'The best of people are my generation, then those who come after them, then those who come after them.',
    narrator: 'Abdullah ibn Masud (RA)',
    grade: 'Sahih',
    book: 'Book of Witnesses',
    chapter: 'The best generations',
    collection: 'bukhari',
    keywords: ['best', 'people', 'generation', 'companions', 'followers', 'time']
  },
  {
    id: 32,
    number: 11,
    arab: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى أَكُونَ أَحَبَّ إِلَيْهِ مِنْ وَالِدِهِ وَوَلَدِهِ وَالنَّاسِ أَجْمَعِينَ',
    translation: 'None of you believes until I am more beloved to him than his father, his child, and all people.',
    narrator: 'Anas ibn Malik (RA)',
    grade: 'Sahih',
    book: 'Book of Faith',
    chapter: 'Love for the Prophet',
    collection: 'bukhari',
    keywords: ['believe', 'beloved', 'father', 'child', 'people', 'love', 'prophet']
  },
  {
    id: 33,
    number: 12,
    arab: 'مِنْ حُسْنِ إِسْلاَمِ الْمَرْءِ تَرْكُهُ مَا لاَ يَعْنِيهِ',
    translation: 'Part of the excellence of a person\'s Islam is leaving what does not concern him.',
    narrator: 'Abu Hurairah (RA)',
    grade: 'Hasan',
    book: 'Book of Good Manners',
    chapter: 'Minding one\'s own business',
    collection: 'bukhari',
    keywords: ['excellence', 'islam', 'leave', 'concern', 'business', 'mind']
  },
  
  // An-Nawawi's Forty Hadith (Arbauna)
  {
    id: 34,
    number: 1,
    arab: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوِ امْرَأَةٍ يَنْكِحُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ',
    translation: 'Actions are but by intention and every man shall have only that which he intended. Therefore, he whose migration (Hijrah) was for Allah and His Messenger, his migration was for Allah and His Messenger, and he whose migration was to achieve some worldly benefit or to take some woman in marriage, his migration was for that for which he migrated.',
    narrator: 'Umar ibn al-Khattab (RA)',
    grade: 'Sahih',
    book: 'An-Nawawi\'s Forty Hadith',
    chapter: 'The Foundation of Actions',
    collection: 'arbauna',
    keywords: ['intention', 'niyyah', 'actions', 'migration', 'hijrah', 'purpose', 'deed']
  },
  {
    id: 35,
    number: 2,
    arab: 'بَيْنَمَا نَحْنُ عِنْدَ رَسُولِ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ ذَاتَ يَوْمٍ إِذْ طَلَعَ عَلَيْنَا رَجُلٌ شَدِيدُ بَيَاضِ الثِّيَابِ شَدِيدُ سَوَادِ الشَّعَرِ لَا يُرَى عَلَيْهِ أَثَرُ السَّفَرِ وَلَا يَعْرِفُهُ مِنَّا أَحَدٌ',
    translation: 'One day while we were sitting with the Messenger of Allah (peace be upon him), there appeared before us a man whose clothes were exceedingly white and whose hair was exceedingly black; no signs of journeying were to be seen on him and none of us knew him.',
    narrator: 'Umar ibn al-Khattab (RA)',
    grade: 'Sahih',
    book: 'An-Nawawi\'s Forty Hadith',
    chapter: 'Islam, Iman, and Ihsan',
    collection: 'arbauna',
    keywords: ['islam', 'iman', 'ihsan', 'gabriel', 'jibril', 'faith', 'worship']
  },
  {
    id: 36,
    number: 3,
    arab: 'بُنِيَ الْإِسْلَامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلَاةِ، وَإِيتَاءِ الزَّكَاةِ، وَالْحَجِّ، وَصَوْمِ رَمَضَانَ',
    translation: 'Islam has been built on five [pillars]: testifying that there is no deity worthy of worship except Allah and that Muhammad is the Messenger of Allah, establishing the salah (prayer), paying the zakat (obligatory charity), making the hajj (pilgrimage) to the House, and fasting in Ramadan.',
    narrator: 'Abdullah ibn Umar (RA)',
    grade: 'Sahih',
    book: 'An-Nawawi\'s Forty Hadith',
    chapter: 'The Five Pillars of Islam',
    collection: 'arbauna',
    keywords: ['islam', 'pillars', 'shahada', 'prayer', 'zakat', 'hajj', 'fasting', 'ramadan']
  },
  {
    id: 37,
    number: 4,
    arab: 'إِنَّ أَحَدَكُمْ يُجْمَعُ خَلْقُهُ فِي بَطْنِ أُمِّهِ أَرْبَعِينَ يَوْمًا، ثُمَّ يَكُونُ عَلَقَةً مِثْلَ ذَلِكَ، ثُمَّ يَكُونُ مُضْغَةً مِثْلَ ذَلِكَ، ثُمَّ يَبْعَثُ اللَّهُ مَلَكًا فَيُؤْمَرُ بِأَرْبَعِ كَلِمَاتٍ',
    translation: 'Verily the creation of each one of you is brought together in his mother\'s belly for forty days in the form of seed, then he is a clot of blood for a like period, then a morsel of flesh for a like period, then there is sent to him the angel who blows the breath of life into him.',
    narrator: 'Abdullah ibn Masud (RA)',
    grade: 'Sahih',
    book: 'An-Nawawi\'s Forty Hadith',
    chapter: 'The Stages of Creation',
    collection: 'arbauna',
    keywords: ['creation', 'destiny', 'qadar', 'angel', 'soul', 'life', 'predestination']
  },
  {
    id: 38,
    number: 5,
    arab: 'مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ فِيهِ فَهُوَ رَدٌّ',
    translation: 'Whosoever does an act which our matter [religion] is not upon, that act is rejected.',
    narrator: 'Aisha (RA)',
    grade: 'Sahih',
    book: 'An-Nawawi\'s Forty Hadith',
    chapter: 'Rejection of Innovation',
    collection: 'arbauna',
    keywords: ['innovation', 'bidah', 'rejected', 'religion', 'sunnah', 'authentic']
  },
  {
    id: 39,
    number: 6,
    arab: 'إِنَّ الْحَلَالَ بَيِّنٌ وَإِنَّ الْحَرَامَ بَيِّنٌ وَبَيْنَهُمَا مُشْتَبِهَاتٌ لَا يَعْلَمُهُنَّ كَثِيرٌ مِنَ النَّاسِ',
    translation: 'That which is lawful is plain and that which is unlawful is plain and between the two of them are doubtful matters about which not many people know.',
    narrator: 'An-Nu\'man ibn Bashir (RA)',
    grade: 'Sahih',
    book: 'An-Nawawi\'s Forty Hadith',
    chapter: 'The Lawful and Unlawful',
    collection: 'arbauna',
    keywords: ['halal', 'haram', 'lawful', 'unlawful', 'doubtful', 'clear', 'guidance']
  },
  {
    id: 40,
    number: 7,
    arab: 'الدِّينُ النَّصِيحَةُ قُلْنَا لِمَنْ قَالَ لِلَّهِ وَلِكِتَابِهِ وَلِرَسُولِهِ وَلِأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ',
    translation: 'Religion is naseehah (advice, sincerity). We said: To whom? He said: To Allah, His Book, His Messenger, and to the leaders of the Muslims and their common folk.',
    narrator: 'Tamim Ad-Dari (RA)',
    grade: 'Sahih',
    book: 'An-Nawawi\'s Forty Hadith',
    chapter: 'Religion is Sincere Advice',
    collection: 'arbauna',
    keywords: ['religion', 'advice', 'sincerity', 'naseehah', 'allah', 'quran', 'prophet', 'leaders']
  },
  {
    id: 41,
    number: 8,
    arab: 'أُمِرْتُ أَنْ أُقَاتِلَ النَّاسَ حَتَّى يَشْهَدُوا أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ',
    translation: 'I have been ordered to fight against people until they testify that there is no deity worthy of worship except Allah and that Muhammad is the Messenger of Allah.',
    narrator: 'Abdullah ibn Umar (RA)',
    grade: 'Sahih',
    book: 'An-Nawawi\'s Forty Hadith',
    chapter: 'The Testimony of Faith',
    collection: 'arbauna',
    keywords: ['fight', 'shahada', 'testimony', 'allah', 'muhammad', 'messenger', 'faith']
  },
  {
    id: 42,
    number: 9,
    arab: 'مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ وَمَا أَمَرْتُكُمْ بِهِ فَافْعَلُوا مِنْهُ مَا اسْتَطَعْتُمْ',
    translation: 'What I have forbidden to you, avoid; and what I have commanded you [to do], do of it what you are able.',
    narrator: 'Abu Hurairah (RA)',
    grade: 'Sahih',
    book: 'An-Nawawi\'s Forty Hadith',
    chapter: 'Following Commands and Avoiding Prohibitions',
    collection: 'arbauna',
    keywords: ['forbidden', 'avoid', 'command', 'ability', 'obedience', 'capacity']
  },
  {
    id: 43,
    number: 10,
    arab: 'إِنَّ اللَّهَ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا وَإِنَّ اللَّهَ أَمَرَ الْمُؤْمِنِينَ بِمَا أَمَرَ بِهِ الْمُرْسَلِينَ',
    translation: 'Verily Allah is good and pure and He accepts only that which is good and pure. And verily Allah has commanded the believers to do that which he commanded the Messengers.',
    narrator: 'Abu Hurairah (RA)',
    grade: 'Sahih',
    book: 'An-Nawawi\'s Forty Hadith',
    chapter: 'Allah Accepts Only Pure Things',
    collection: 'arbauna',
    keywords: ['allah', 'pure', 'good', 'tayyib', 'accepts', 'believers', 'messengers']
  }
];

export const FEATURED_HADITHS = [
  {
    id: 1,
    collection: 'Sahih al-Bukhari',
    number: 1,
    text: 'Actions are but by intention and every man shall have only that which he intended.',
    arabicText: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    narrator: 'Umar ibn al-Khattab (RA)'
  },
  {
    id: 2,
    collection: 'Sahih Muslim',
    number: 2564,
    text: 'The believer is not one who eats his fill while his neighbor goes hungry.',
    arabicText: 'لَيْسَ الْمُؤْمِنُ الَّذِي يَشْبَعُ وَجَارُهُ جَائِعٌ إِلَى جَنْبِهِ',
    narrator: 'Anas ibn Malik (RA)'
  },
  {
    id: 3,
    collection: 'Jami at-Tirmidhi',
    number: 1987,
    text: 'The best of people are those who benefit others.',
    arabicText: 'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ',
    narrator: 'Jabir ibn Abdullah (RA)'
  }
];

// Helper functions
export const getCollectionById = (id: string): HadithCollection | undefined => {
  return HADITH_COLLECTIONS.find(collection => collection.id === id);
};

export const getHadithsByCollection = (collectionId: string, page: number = 1, limit: number = 50): { hadiths: Hadith[], hasMore: boolean, total: number } => {
  console.log(`Getting hadiths for collection: ${collectionId}, page: ${page}, limit: ${limit}`);
  
  // Get real hadiths from database for the specified collection
  const realHadiths = HADITH_DATABASE.filter(hadith => hadith.collection === collectionId);
  realHadiths.sort((a, b) => a.number - b.number);
  
  console.log(`Found ${realHadiths.length} authentic hadiths for collection ${collectionId}`);
  
  // Debug: Log available collections and their counts
  const collectionCounts = HADITH_DATABASE.reduce((acc, hadith) => {
    acc[hadith.collection] = (acc[hadith.collection] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('Available collections and counts:', collectionCounts);
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedHadiths = realHadiths.slice(startIndex, endIndex);
  
  console.log(`Returning hadiths ${startIndex + 1}-${Math.min(endIndex, realHadiths.length)} of ${realHadiths.length} total`);
  
  return {
    hadiths: paginatedHadiths,
    hasMore: endIndex < realHadiths.length,
    total: realHadiths.length
  };
};

export const searchHadiths = (query: string, collectionId?: string): Hadith[] => {
  const searchTerm = query.toLowerCase();
  
  return HADITH_DATABASE.filter(hadith => {
    const matchesCollection = !collectionId || hadith.collection === collectionId;
    const matchesQuery = 
      hadith.translation.toLowerCase().includes(searchTerm) ||
      hadith.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm)) ||
      hadith.narrator.toLowerCase().includes(searchTerm) ||
      hadith.arab.includes(query);
    
    return matchesCollection && matchesQuery;
  }).slice(0, 20); // Limit to 20 results
};