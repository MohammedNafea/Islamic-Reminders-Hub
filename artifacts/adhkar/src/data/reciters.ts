export interface Reciter {
  id: string;
  name: string;
  englishName: string;
  type: "ayah" | "surah";
  audioEditionId?: string; // For Alquran.cloud API
  surahBaseUrl: string; // For MP3Quran direct downloads (used in Surah mode or fallback)
}

export const RECITERS: Reciter[] = [
  {
    id: "husary",
    name: "محمود خليل الحصري",
    englishName: "Mahmoud Khalil Al-Husary",
    type: "ayah",
    audioEditionId: "ar.husary",
    surahBaseUrl: "https://server13.mp3quran.net/husr/",
  },
  {
    id: "ghamdi",
    name: "سعد الغامدي",
    englishName: "Saad Al-Ghamdi",
    type: "ayah",
    audioEditionId: "ar.saadalgamdi",
    surahBaseUrl: "https://server7.mp3quran.net/s_gmd/",
  },
  {
    id: "fares",
    name: "فارس عباد",
    englishName: "Fares Abbad",
    type: "ayah",
    audioEditionId: "ar.faresabbad",
    surahBaseUrl: "https://server8.mp3quran.net/frs_a/",
  },
  {
    id: "shuraim",
    name: "سعود الشريم",
    englishName: "Saud Al-Shuraim",
    type: "ayah",
    audioEditionId: "ar.saoodshuraym",
    surahBaseUrl: "https://server7.mp3quran.net/shur/",
  },
  {
    id: "lhdan",
    name: "محمد اللحيدان",
    englishName: "Muhammad Al-Luhaidan",
    type: "surah",
    surahBaseUrl: "https://server8.mp3quran.net/lhdan/",
  },
  {
    id: "okasha",
    name: "عكاشه كميني",
    englishName: "Okasha Kameny",
    type: "surah",
    surahBaseUrl: "https://server12.mp3quran.net/okasha/",
  },
  {
    id: "hsn",
    name: "حسن صالح",
    englishName: "Hasan Saleh",
    type: "surah",
    surahBaseUrl: "https://server8.mp3quran.net/hsn/",
  },
  {
    id: "ahmad",
    name: "عبدالعزيز الاحمد",
    englishName: "Abdulaziz Al-Ahmad",
    type: "surah",
    surahBaseUrl: "https://server11.mp3quran.net/ahmad/",
  },
  {
    id: "muhaisni",
    name: "محمد المحيسني",
    englishName: "Muhammad Al-Muhaisni",
    type: "surah",
    surahBaseUrl: "https://server11.mp3quran.net/mhsny/",
  },
  {
    id: "dukhain",
    name: "هيثم الدخين",
    englishName: "Haitham Al-Dukhin",
    type: "surah",
    surahBaseUrl: "https://server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem/",
  },
];
