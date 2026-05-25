export interface Reciter {
  id: string;
  name: string;
  englishName: string;
  type: "ayah" | "surah";
  audioEditionId?: string; // For Alquran.cloud API
  surahBaseUrl: string; // For MP3Quran direct downloads (used in Surah mode or fallback)
  surahList?: number[]; // Optional list of supported surah numbers
}

export const RECITERS: Reciter[] = [
  // محمود خليل الحصري
  {
    id: "husary",
    name: "محمود خليل الحصري (مرتل)",
    englishName: "Mahmoud Khalil Al-Husary (Murattal)",
    type: "ayah",
    audioEditionId: "ar.husary",
    surahBaseUrl: "https://server13.mp3quran.net/husr/",
  },
  {
    id: "husary_mujawwad",
    name: "محمود خليل الحصري (مجود)",
    englishName: "Mahmoud Khalil Al-Husary (Mujawwad)",
    type: "ayah",
    audioEditionId: "ar.husarymujawwad",
    surahBaseUrl: "https://server13.mp3quran.net/husr/Almusshaf-Al-Mojawwad/",
  },
  {
    id: "husary_warsh",
    name: "محمود خليل الحصري (ورش عن نافع)",
    englishName: "Mahmoud Khalil Al-Husary (Warsh)",
    type: "surah",
    surahBaseUrl: "https://server13.mp3quran.net/husr/Rewayat-Warsh-A-n-Nafi/",
  },
  {
    id: "husary_qaloon",
    name: "محمود خليل الحصري (قالون عن نافع)",
    englishName: "Mahmoud Khalil Al-Husary (Qaloon)",
    type: "surah",
    surahBaseUrl: "https://server13.mp3quran.net/husr/Rewayat-Qalon-A-n-Nafi/",
  },
  {
    id: "husary_duri",
    name: "محمود خليل الحصري (الدوري عن أبي عمرو)",
    englishName: "Mahmoud Khalil Al-Husary (Al-Duri)",
    type: "surah",
    surahBaseUrl: "https://server13.mp3quran.net/husr/Rewayat-Aldori-A-n-Abi-Amr/",
  },

  // محمد صديق المنشاوي
  {
    id: "minshawi",
    name: "محمد صديق المنشاوي (مرتل)",
    englishName: "Muhammad Siddiq Al-Minshawi (Murattal)",
    type: "ayah",
    audioEditionId: "ar.minshawi",
    surahBaseUrl: "https://server10.mp3quran.net/minsh/",
  },
  {
    id: "minshawi_mujawwad",
    name: "محمد صديق المنشاوي (مجود)",
    englishName: "Muhammad Siddiq Al-Minshawi (Mujawwad)",
    type: "ayah",
    audioEditionId: "ar.minshawimujawwad",
    surahBaseUrl: "https://server10.mp3quran.net/minsh/Almusshaf-Al-Mojawwad/",
  },
  {
    id: "minshawi_muallim",
    name: "محمد صديق المنشاوي (المعلم)",
    englishName: "Muhammad Siddiq Al-Minshawi (Muallim)",
    type: "surah",
    surahBaseUrl: "https://server10.mp3quran.net/minsh/Almusshaf-Al-Mo-lim/",
  },

  // عبد الباسط عبد الصمد
  {
    id: "abdulbasit_murattal",
    name: "عبد الباسط عبد الصمد (مرتل)",
    englishName: "Abdulbasit Abdulsamad (Murattal)",
    type: "ayah",
    audioEditionId: "ar.abdulbasitmurattal",
    surahBaseUrl: "https://server7.mp3quran.net/basit/",
  },
  {
    id: "abdulbasit_mujawwad",
    name: "عبد الباسط عبد الصمد (مجود)",
    englishName: "Abdulbasit Abdulsamad (Mujawwad)",
    type: "ayah",
    audioEditionId: "ar.abdulsamad",
    surahBaseUrl: "https://server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad/",
  },
  {
    id: "abdulbasit_warsh",
    name: "عبد الباسط عبد الصمد (ورش عن نافع)",
    englishName: "Abdulbasit Abdulsamad (Warsh)",
    type: "surah",
    surahBaseUrl: "https://server7.mp3quran.net/basit/Rewayat-Warsh-A-n-Nafi/",
  },

  // أحمد بن علي العجمي
  {
    id: "ajamy",
    name: "أحمد بن علي العجمي",
    englishName: "Ahmed Al-Ajmy",
    type: "surah",
    surahBaseUrl: "https://server10.mp3quran.net/ajm/",
  },

  // إبراهيم الأخضر
  {
    id: "akhdar",
    name: "إبراهيم الأخضر",
    englishName: "Ibrahim Al-Akhdar",
    type: "ayah",
    audioEditionId: "ar.ibrahimakhbar",
    surahBaseUrl: "https://server6.mp3quran.net/akdr/",
  },

  // ياسر الدوسري
  {
    id: "yasser_dosari",
    name: "ياسر الدوسري",
    englishName: "Yasser Al-Dosari",
    type: "surah",
    surahBaseUrl: "https://server11.mp3quran.net/yasser/",
  },

  // إبراهيم الدوسري
  {
    id: "ibrahim_dosari_hafs",
    name: "إبراهيم الدوسري (حفص عن عاصم)",
    englishName: "Ibrahim Al-Dosari (Hafs)",
    type: "surah",
    surahBaseUrl: "https://server10.mp3quran.net/ibrahim_dosri/Rewayat-Hafs-A-n-Assem/",
  },
  {
    id: "ibrahim_dosari_warsh",
    name: "إبراهيم الدوسري (ورش عن نافع)",
    englishName: "Ibrahim Al-Dosari (Warsh)",
    type: "surah",
    surahBaseUrl: "https://server10.mp3quran.net/ibrahim_dosri/Rewayat-Warsh-A-n-Nafi/",
  },

  // صالح آل طالب
  {
    id: "saleh_taleb",
    name: "صالح آل طالب",
    englishName: "Saleh Al Taleb",
    type: "surah",
    surahBaseUrl: "https://server9.mp3quran.net/tlb/",
  },

  // أحمد طالب بن حميد
  {
    id: "ahmed_taleb",
    name: "أحمد طالب بن حميد",
    englishName: "Ahmed Taleb bin Humaid",
    type: "surah",
    surahBaseUrl: "https://server16.mp3quran.net/a_binhameed/Rewayat-Hafs-A-n-Assem/",
  },

  // عكاشة كميني
  {
    id: "okasha",
    name: "عكاشة كميني (البزي عن ابن كثير)",
    englishName: "Okasha Kameny (Al-Bizi)",
    type: "surah",
    surahBaseUrl: "https://server16.mp3quran.net/okasha/Rewayat-Albizi-A-n-Ibn-Katheer/",
  },
  {
    id: "okasha_duri_kisai",
    name: "عكاشة كميني (الدوري عن الكسائي)",
    englishName: "Okasha Kameny (Al-Duri 'an Al-Kisa'i)",
    type: "surah",
    surahBaseUrl: "https://server16.mp3quran.net/okasha/Rewayat-AlDorai-A-n-Al-Kisa-ai/",
    surahList: [17, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114],
  },

  // أحمد ديبان Qira'at (Twelve narrates)
  {
    id: "deban_qaloon",
    name: "أحمد ديبان (قالون عن نافع)",
    englishName: "Ahmed Deban (Qaloon)",
    type: "surah",
    surahBaseUrl: "https://server16.mp3quran.net/deban/Rewayat-Qalon-A-n-Nafi/",
  },
  {
    id: "deban_warsh",
    name: "أحمد ديبان (ورش عن نافع)",
    englishName: "Ahmed Deban (Warsh)",
    type: "surah",
    surahBaseUrl: "https://server16.mp3quran.net/deban/Rewayat-Warsh-A-n-Nafi-Men-Tariq-Alazraq/",
  },
  {
    id: "deban_bizi",
    name: "أحمد ديبان (البزي عن ابن كثير)",
    englishName: "Ahmed Deban (Al-Bizi)",
    type: "surah",
    surahBaseUrl: "https://server16.mp3quran.net/deban/Rewayat-Albizi-A-n-Ibn-Katheer/",
  },
  {
    id: "deban_qanbal",
    name: "أحمد ديبان (قنبل عن ابن كثير)",
    englishName: "Ahmed Deban (Qanbal)",
    type: "surah",
    surahBaseUrl: "https://server16.mp3quran.net/deban/Rewayat-Qunbol-A-n-Ibn-Katheer/",
  },
  {
    id: "deban_shubah",
    name: "أحمد ديبان (شعبة عن عاصم)",
    englishName: "Ahmed Deban (Shu'bah)",
    type: "surah",
    surahBaseUrl: "https://server16.mp3quran.net/deban/Rewayat-Sho-bah-A-n-Asim/",
  },
  {
    id: "deban_duri",
    name: "أحمد ديبان (الدوري عن أبي عمرو)",
    englishName: "Ahmed Deban (Al-Duri)",
    type: "surah",
    surahBaseUrl: "https://server16.mp3quran.net/deban/Rewayat-Aldori-A-n-Abi-Amr/",
  },
  {
    id: "deban_susi",
    name: "أحمد ديبان (السوسي عن أبي عمرو)",
    englishName: "Ahmed Deban (Al-Susi)",
    type: "surah",
    surahBaseUrl: "https://server16.mp3quran.net/deban/Rewayat-Assosi-A-n-Abi-Amr/",
  },
  {
    id: "deban_jamaz",
    name: "أحمد ديبان (ابن جماز عن أبي جعفر)",
    englishName: "Ahmed Deban (Ibn Jammaz)",
    type: "surah",
    surahBaseUrl: "https://server16.mp3quran.net/deban/Rewayat-Ibn-Jammaz-A-n-Abi-Ja-far/",
  },

  // سعد الغامدي
  {
    id: "ghamdi",
    name: "سعد الغامدي",
    englishName: "Saad Al-Ghamdi",
    type: "surah",
    surahBaseUrl: "https://server7.mp3quran.net/s_gmd/",
  },
  // فارس عباد
  {
    id: "fares",
    name: "فارس عباد",
    englishName: "Fares Abbad",
    type: "surah",
    surahBaseUrl: "https://server8.mp3quran.net/frs_a/",
  },
  // سعود الشريم
  {
    id: "shuraim",
    name: "سعود الشريم",
    englishName: "Saud Al-Shuraim",
    type: "ayah",
    audioEditionId: "ar.saoodshuraym",
    surahBaseUrl: "https://server7.mp3quran.net/shur/",
  },
  // محمد اللحيدان
  {
    id: "lhdan",
    name: "محمد اللحيدان",
    englishName: "Muhammad Al-Luhaidan",
    type: "surah",
    surahBaseUrl: "https://server8.mp3quran.net/lhdan/",
  },
  // حسن صالح
  {
    id: "hsn",
    name: "حسن صالح",
    englishName: "Hasan Saleh",
    type: "surah",
    surahBaseUrl: "https://server16.mp3quran.net/h_saleh/Rewayat-Hafs-A-n-Assem/",
  },
  // عبدالعزيز الاحمد
  {
    id: "ahmad",
    name: "عبدالعزيز الاحمد",
    englishName: "Abdulaziz Al-Ahmad",
    type: "surah",
    surahBaseUrl: "https://server11.mp3quran.net/a_ahmed/",
  },
  // محمد المحيسني
  {
    id: "muhaisni",
    name: "محمد المحيسني",
    englishName: "Muhammad Al-Muhaisni",
    type: "surah",
    surahBaseUrl: "https://server11.mp3quran.net/mhsny/",
  },
  // هيثم الدخين
  {
    id: "dukhain",
    name: "هيثم الدخين",
    englishName: "Haitham Al-Dukhin",
    type: "surah",
    surahBaseUrl: "https://server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem/",
  },
];
