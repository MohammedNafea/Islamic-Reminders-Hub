/**
 * Adds missing content translation sections to all locale files.
 * Sections added: adhkar (items, sources, notes), quran.daily, fasting.sources,
 * salawat, adhkar_hub, dhikr (if missing).
 * 
 * Uses English translations as base — actual translations need human review.
 * Run: npx tsx scripts/add-missing-translations.ts
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.resolve(__dirname, "../artifacts/adhkar/src/i18n/locales");

// English reference for content sections
const ADHKAR_SOURCES: Record<string, string> = {
  "حديث صحيح": "Authentic Hadith",
  "أثر صحيح": "Authentic Narration",
  "متفق عليه": "Agreed Upon (Bukhari & Muslim)",
  "رواه البخاري": "Narrated by Al-Bukhari",
  "رواه مسلم": "Narrated by Muslim",
  "رواه أحمد": "Narrated by Ahmad",
  "رواه الترمذي": "Narrated by At-Tirmidhi",
  "رواه أبو داود": "Narrated by Abu Dawood",
  "رواه النسائي": "Narrated by An-Nasa'i",
  "رواه البخاري ومسلم": "Narrated by Al-Bukhari & Muslim",
  "رواه أحمد وأبو داود": "Narrated by Ahmad & Abu Dawood",
  "رواه أحمد والترمذي": "Narrated by Ahmad & At-Tirmidhi",
  "رواه أحمد والترمذي عن عثمان بن عفان": "Narrated by Ahmad & At-Tirmidhi from Uthman bin Affan",
  "رواه أحمد وأبو داود والترمذي عن أبي هريرة": "Narrated by Ahmad, Abu Dawood & At-Tirmidhi from Abu Hurairah",
  "رواه مسلم عن أبي هريرة": "Narrated by Muslim from Abu Hurairah",
  "رواه مسلم عن ابن عباس": "Narrated by Muslim from Ibn Abbas",
  "رواه مسلم عن أبي قتادة": "Narrated by Muslim from Abu Qatadah",
  "رواه مسلم عن جويرية": "Narrated by Muslim from Juwayriyyah",
  "رواه الترمذي وأبو داود": "Narrated by At-Tirmidhi & Abu Dawood",
  "رواه الترمذي وصحّحه": "Narrated by At-Tirmidhi, authenticated",
  "رواه أبو داود وصحّحه الألباني": "Narrated by Abu Dawood, authenticated by Al-Albani",
  "رواه أبو داود عن أبي الدرداء (موقوف)": "Narrated by Abu Dawood from Abu Darda (stopped)",
  "رواه أحمد والدارمي عن عبد الرحمن بن أبزى": "Narrated by Ahmad & Ad-Darimi from Abdurrahman bin Abza",
  "رواه أحمد عن أبي هريرة وعبدالله بن عمرو": "Narrated by Ahmad from Abu Hurairah & Abdullah bin Amr",
  "رواه النسائي عن أنس": "Narrated by An-Nasa'i from Anas",
  "رواه أبو داود عن أبي الدرداء": "Narrated by Abu Dawood from Abu Darda",
  "من قرأها بعد كل صلاة مكتوبة لم يمنعه من دخول الجنة إلا أن يموت": "Whoever reads it after every obligatory prayer, nothing will prevent him from entering Paradise except death",
  "سورة الفاتحة": "Surah Al-Fatihah",
  "آية الكرسي - البقرة: ٢٥٥": "Ayat Al-Kursi - Al-Baqarah: 255",
  "آخر آيتين من سورة البقرة": "Last two verses of Surah Al-Baqarah",
  "سورة الكافرون": "Surah Al-Kafirun",
  "سورة الإخلاص": "Surah Al-Ikhlas",
  "سورة الفلق": "Surah Al-Falaq",
  "سورة الناس": "Surah An-Nas",
  "الأحزاب: ٥٦": "Al-Ahzab: 56",
};

const ADHKAR_ITEMS: Record<string, string> = {
  sayyid_istighfar: "O Allah, You are my Lord, there is no god but You. You created me and I am Your servant, and I am faithful to Your covenant and Your promise as much as I am able. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me, and I acknowledge my sin, so forgive me, for indeed none forgives sins but You.",
  la_ilaha_10: "There is no god but Allah alone, having no partner with Him, His is the kingdom and His is the praise, and He is over all things capable.",
  subhan_allah_100: "Glory be to Allah and His is the praise.",
  bismillah_protection: "In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.",
  afia_dua: "O Allah, I ask You for well-being in this world and the Hereafter. O Allah, I ask You for forgiveness and well-being in my religion, my worldly life, my family, and my wealth. O Allah, conceal my faults. O Allah, protect me from before me, behind me, on my right, on my left, and from above. I seek refuge in Your greatness from being destroyed from beneath me.",
  qul_muawwidhat: "Say: He is Allah, the One. Allah the Self-Sufficient. He begets not, nor was He begotten. And there is none comparable to Him. | Say: I seek refuge in the Lord of the daybreak. | Say: I seek refuge in the Lord of mankind.",
  raditu: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace be upon him) as my Prophet.",
  fatirul_samawat: "O Allah, Creator of the heavens and the earth, Knower of the unseen and the seen, Lord of all things and their Sovereign, I seek refuge in You from the evil of my soul and the evil of Satan and his shirk.",
  ya_hayyu: "O Ever-Living, O Sustainer, by Your mercy I seek help, rectify for me all my affairs, and do not leave me to myself even for the blink of an eye.",
  hasbiyallah_7: "Allah is sufficient for me. There is no god but Him. In Him I have placed my trust, and He is the Lord of the Mighty Throne.",
  asbahna_morning: "We have reached the morning and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. There is no god but Allah alone, without partner...",
  allahumma_bika_morning: "O Allah, by Your grace we have reached the morning, by Your grace we have reached the evening, by You we live and die, and to You is the resurrection.",
  subhan_adad_morning: "Glory be to Allah and His is the praise, as many as His creations, as much as pleases Him, as much as the weight of His Throne, and as much as the ink of His words.",
  asbahna_fitra: "We have awakened upon the natural disposition of Islam, upon the word of sincerity, upon the religion of our Prophet Muhammad, and upon the way of our father Ibrahim, who was a true monotheist and was not of the polytheists.",
  la_ilaha_100_day: "There is no god but Allah alone, having no partner with Him, His is the kingdom, and His is the praise, and He is over all things capable.",
  awudhu_kalimat: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
  ayatan_baqarah: "The last two verses of Surah Al-Baqarah: The Messenger believes in what has been sent down to him from his Lord, and the believers...",
  ayat_kursi_sleep: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep...",
  akhir_baqarah_sleep: "The Messenger believes in what has been sent down to him from his Lord, and the believers... Our Lord, do not burden us beyond our capacity...",
  muawwidhat_sleep: "Say: He is Allah, the One | Say: I seek refuge in the Lord of daybreak | Say: I seek refuge in the Lord of mankind — then wipe over what you can of your body.",
  subhan_allah_sleep_33: "Glory be to Allah",
  alhamdulillah_sleep_33: "All praise is for Allah",
  allahu_akbar_sleep_34: "Allah is the Greatest",
  bismika_rabbi: "In Your name, my Lord, I have laid my side, and by You I raise it. If You take my soul, then have mercy on it, and if You release it, then protect it as You protect Your righteous servants.",
  allahumma_bismika: "O Allah, in Your name I die and I live.",
  allahumma_khalaqta: "O Allah, You have created my soul and You take it. Its death and its life are Yours. If You give it life, then protect it, and if You cause it to die, then forgive it. O Allah, I ask You for well-being.",
  allahumma_rabb_samawat: "O Allah, Lord of the heavens and Lord of the earth, and Lord of the Mighty Throne, our Lord and Lord of all things, Splitter of the seed and the date stone...",
  alhamdu_atamana: "All praise is for Allah who has fed us, given us drink, sufficed us, and given us shelter. For how many are there who have none to suffice them and none to give them shelter.",
  allahumma_qini: "O Allah, protect me from Your punishment on the Day You resurrect Your servants.",
  bismillah_wadatu: "In the name of Allah I have laid my side. O Allah, forgive me my sin, drive away my Satan, free me from my pledge, and make me among the highest assembly.",
  allahumma_aslamtu: "O Allah, I have submitted my face to You, entrusted my affair to You, and turned my back to You, out of desire and fear of You. There is no refuge and no escape from You except to You...",
  istighfar_3_prayer: "I seek the forgiveness of Allah, I seek the forgiveness of Allah, I seek the forgiveness of Allah. O Allah, You are the Peace and from You comes the Peace, blessed are You, O Lord of Majesty and Honor.",
  la_ilaha_prayer: "There is no god but Allah alone, having no partner with Him, His is the kingdom and His is the praise, and He is over all things capable. O Allah, none can withhold what You have given, and none can give what You have withheld...",
  tahlil_prayer: "There is no god but Allah alone, having no partner with Him, His is the kingdom and His is the praise, and He is over all things capable. There is no power and no strength except with Allah...",
  ayat_kursi_prayer: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of all existence...",
  subhan_allah_prayer_33: "Glory be to Allah",
  alhamdulillah_prayer_33: "All praise is for Allah",
  allahu_akbar_prayer_33: "Allah is the Greatest",
  salawat_100_prayer: "O Allah, send blessings and peace upon our Prophet Muhammad",
  salawat_ibrahimiya_prayer: "O Allah, send blessings upon Muhammad and upon the family of Muhammad, as You sent blessings upon Ibrahim and upon the family of Ibrahim. You are indeed Praiseworthy, Glorious. O Allah, bless Muhammad and the family of Muhammad, as You blessed Ibrahim and the family of Ibrahim...",
  salawat_100: "O Allah, send blessings and peace upon our Prophet Muhammad",
  salawat_ibrahimiya: "O Allah, send blessings upon Muhammad and upon the family of Muhammad, as You sent blessings upon Ibrahim and upon the family of Ibrahim...",
  fatiha_ruqyah: "In the name of Allah, the Most Gracious, the Most Merciful. All praise is for Allah, Lord of the worlds...",
  ayat_kursi_ruqyah: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of all existence...",
  aman_rasul_ruqyah: "The Messenger believes in what has been sent down to him from his Lord, and the believers...",
  kafirun_ruqyah: "Say: O disbelievers, I do not worship what you worship...",
  ikhlas_ruqyah: "Say: He is Allah, the One. Allah the Self-Sufficient. He begets not, nor was He begotten...",
  falaq_ruqyah: "Say: I seek refuge in the Lord of the daybreak, from the evil of what He has created...",
  nas_ruqyah: "Say: I seek refuge in the Lord of mankind, the King of mankind, the God of mankind...",
  awudhu_qudra: "I seek refuge in Allah and His power from the evil of what I find and fear.",
  rabb_nas: "O Allah, Lord of mankind, remove the harm, and cure. You are the Cure, there is no cure but Your cure, a cure that leaves no trace of illness.",
  awudhu_kalimat_ruqyah: "I seek refuge in the perfect words of Allah from every devil and harmful creature, and from every evil eye.",
};

const ADHKAR_NOTES: Record<string, string> = {
  sayyid_istighfar: "Chief of Seeking Forgiveness",
  muawwidhat_thrice: "Read 3 times (Ikhlas, Falaq, Nas)",
};

const QURAN_DAILY: Record<string, { text: string; sura: string; verse_number: string }> = {
  "1": { text: "Then when you have taken a decision, put your trust in Allah. Certainly, Allah loves those who put their trust (in Him).", sura: "Al-Imran", verse_number: "159" },
  "2": { text: "And say: 'My Lord! Increase me in knowledge.'", sura: "Ta-Ha", verse_number: "114" },
  "3": { text: "Verily, along with every hardship is relief.", sura: "Al-Sharh", verse_number: "6" },
  "4": { text: "So be patient. Verily, the Promise of Allah is true.", sura: "Al-Rum", verse_number: "60" },
  "5": { text: "Allah does not charge a soul except [with that within] its capacity.", sura: "Al-Baqarah", verse_number: "286" },
  "6": { text: "And those who strive for Us - We will surely guide them to Our ways.", sura: "Al-Ankabut", verse_number: "69" },
  "7": { text: "And whoever relies upon Allah - then He is sufficient for him.", sura: "Al-Talaq", verse_number: "3" },
  "8": { text: "If you are grateful, I will surely increase you [in favor].", sura: "Ibrahim", verse_number: "7" },
};

const FASTING_SOURCES: Record<string, string> = {
  white_days: "Narrated by Abu Dawood, An-Nasa'i, and At-Tirmidhi",
  arafah: "Narrated by Muslim",
  dhul_hijjah_10: "Narrated by Ibn Majah and At-Tirmidhi",
  ashura: "Narrated by Muslim from Abu Qatadah",
  tasu_a: "Narrated by Muslim from Ibn Abbas",
  monday: "Narrated by Muslim from Abu Qatadah",
  thursday: "Narrated by At-Tirmidhi and Abu Dawood",
  shawwal_6: "Narrated by Muslim from Abu Ayyub",
  shaban: "Narrated by Al-Bukhari and Muslim",
};

const SALAWAT_SECTION = {
  title: "Salawat on Prophet",
  virtue: "Virtues of Salawat",
};

const ADHKAR_HUB_SECTION = {
  title: "Adhkar Hub",
  subtitle: "Daily Remembrance & Protection",
  morning_desc: "Morning protection and blessings",
  evening_desc: "Evening peace and protection",
  sleep_desc: "Prophetic Sunnah before sleep",
  prayer_desc: "Remembrances after the prayer",
  ruqyah_desc: "Healing and Protection from Quran",
  post_prayer: "Post-Prayer Adhkar",
};

const DHIKR_SECTION = {
  count: "Count",
  times: "times",
  source: "Source",
  tap_to_count: "Tap to count",
  completed_msg: "Well done! Adhkar completed",
  reset: "Reset",
  reset_all: "Reset All",
  morning_form: "Morning Form",
  evening_form: "Evening Form",
  note: "Note",
  benefit: "Benefit",
};

function buildTsSection(obj: Record<string, any>, indent: string = "    "): string {
  const lines: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      lines.push(`${indent}${key}: {`);
      lines.push(buildTsSection(val as Record<string, any>, indent + "  "));
      lines.push(`${indent}},`);
    } else if (typeof val === "string") {
      const escapedVal = val.replace(/"/g, '\\"');
      lines.push(`${indent}${key}: "${escapedVal}",`);
    }
  }
  return lines.join("\n");
}

function processFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lang = path.basename(filePath, ".ts");
  
  if (lang === "ar") return; // Arabic doesn't need English content sections
  if (lang === "template") return;
  
  let modified = content;
  
  // Collect all sections to add
  const sectionsToAdd: string[] = [];
  
  // Check and add adhkar section
  if (!modified.includes("adhkar: {")) {
    sectionsToAdd.push(`  adhkar: {
    sources: {
${buildTsSection(ADHKAR_SOURCES, "      ")}
    },
    notes: {
${buildTsSection(ADHKAR_NOTES, "      ")}
    },
    items: {
${buildTsSection(ADHKAR_ITEMS, "      ")}
    }
  },`);
  }
  
  // Check and add quran.daily
  if (!modified.includes("quran: {")) {
    sectionsToAdd.push(`  quran: {
    title: "Holy Quran",
    subtitle: "Blessed verses from the book of Allah",
    verse_of_hour: "Verse of the Hour",
    meccan: "Meccan",
    medinan: "Medinan",
    last_read: "Last Read",
    daily: {
${Object.entries(QURAN_DAILY).map(([k, v]) => `      ${k}: { text: "${v.text.replace(/"/g, '\\"')}", sura: "${v.sura}", verse_number: "${v.verse_number}" },`).join("\n")}
    },
  },`);
  }
  
  // Check and add fasting.sources
  if (!modified.includes("fasting: {") || (modified.includes("fasting: {") && !modified.includes("sources:"))) {
    if (!modified.includes("fasting: {")) {
      sectionsToAdd.push(`  fasting: {
    sources: {
${buildTsSection(FASTING_SOURCES, "      ")}
    },
  },`);
    } else {
      // Add sources inside existing fasting section
      const fastingSources = `    sources: {
${buildTsSection(FASTING_SOURCES, "      ")}
    },`;
      modified = modified.replace(/(fasting:\s*\{)/, `$1\n${fastingSources}`);
    }
  }
  
  // Check and add salawat section
  if (!modified.includes("salawat: {")) {
    sectionsToAdd.push(`  salawat: {
${Object.entries(SALAWAT_SECTION).map(([k, v]) => `    ${k}: "${v}",`).join("\n")}
  },`);
  }
  
  // Check and add adhkar_hub section
  if (!modified.includes("adhkar_hub: {")) {
    sectionsToAdd.push(`  adhkar_hub: {
${Object.entries(ADHKAR_HUB_SECTION).map(([k, v]) => `    ${k}: "${v}",`).join("\n")}
  },`);
  }
  
  // Check and add dhikr section (most have it already but check)
  if (!modified.includes("dhikr: {")) {
    sectionsToAdd.push(`  dhikr: {
${Object.entries(DHIKR_SECTION).map(([k, v]) => `    ${k}: "${v}",`).join("\n")}
  },`);
  }
  
  if (sectionsToAdd.length > 0) {
    // Insert all sections before the closing };
    const insertion = sectionsToAdd.join("\n");
    modified = modified.replace(/\n\};\s*$/, `\n${insertion}\n};\n`);
  }
  
  fs.writeFileSync(filePath, modified, "utf-8");
  console.log(`  ✅ Updated: ${lang}.ts (${sectionsToAdd.length} sections added)`);
}

// Main
const files = fs.readdirSync(LOCALES_DIR)
  .filter(f => f.endsWith(".ts") && f !== "ar.ts" && f !== "template.ts")
  .map(f => path.join(LOCALES_DIR, f));

console.log(`\n🔧 Adding missing translation sections to ${files.length} locale files...\n`);
files.forEach(processFile);
console.log(`\n✨ Done! All locale files now have adhkar, quran.daily, fasting.sources, salawat, adhkar_hub sections.\n`);
