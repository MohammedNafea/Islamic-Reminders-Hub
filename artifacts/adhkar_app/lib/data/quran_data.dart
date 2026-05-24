import '../models/verse.dart';

const List<Verse> dailyVerses = [
  Verse(
    id: 1,
    text: "فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ",
    sura: "آل عمران",
    verseNumber: 159,
    translation: "Then when you have taken a decision, put your trust in Allah. Certainly, Allah loves those who put their trust (in Him).",
  ),
  Verse(
    id: 2,
    text: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    sura: "طه",
    verseNumber: 114,
    translation: "And say: 'My Lord! Increase me in knowledge.'",
  ),
  Verse(
    id: 3,
    text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    sura: "الشرح",
    verseNumber: 6,
    translation: "Verily, along with every hardship is relief.",
  ),
  Verse(
    id: 4,
    text: "فَاصْبِرْ إِنَّ وَعْدَ اللَّهِ حَقٌّ",
    sura: "الروم",
    verseNumber: 60,
    translation: "So be patient. Verily, the Promise of Allah is true.",
  ),
];

Verse getVerseOfTheDay() {
  final now = DateTime.now();
  final hourIndex = (now.day * 24) + now.hour;
  return dailyVerses[hourIndex % dailyVerses.length];
}
