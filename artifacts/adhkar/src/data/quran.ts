export interface Verse {
  id: number;
  text: string;
  sura: string;
  verse_number: number;
  translation: string;
}

export const dailyVerses: Verse[] = [
  {
    id: 1,
    text: "فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ",
    sura: "آل عمران",
    verse_number: 159,
    translation: "Then when you have taken a decision, put your trust in Allah. Certainly, Allah loves those who put their trust (in Him)."
  },
  {
    id: 2,
    text: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    sura: "طه",
    verse_number: 114,
    translation: "And say: 'My Lord! Increase me in knowledge.'"
  },
  {
    id: 3,
    text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    sura: "الشرح",
    verse_number: 6,
    translation: "Verily, along with every hardship is relief."
  },
  {
    id: 4,
    text: "فَاصْبِرْ إِنَّ وَعْدَ اللَّهِ حَقٌّ",
    sura: "الروم",
    verse_number: 60,
    translation: "So be patient. Verily, the Promise of Allah is true."
  }
];

export function getVerseOfTheDay(): Verse {
  const now = new Date();
  const hourIndex = (now.getDate() * 24) + now.getHours();
  return dailyVerses[hourIndex % dailyVerses.length];
}
