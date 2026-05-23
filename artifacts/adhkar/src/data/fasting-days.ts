export interface FastingDay {
  id: string;
  nameKey: string;
  descriptionKey: string;
  source: string;
  hadithKey: string;
  type: "yearly" | "monthly" | "weekly";
  hijriMonth?: number;
  hijriDay?: number | number[];
  weekDay?: number[];
  isRange?: boolean;
  rangeStart?: number;
  rangeEnd?: number;
}

export const fastingDays: FastingDay[] = [
  {
    id: "white_days",
    nameKey: "fasting.white_days",
    descriptionKey: "fasting.white_days_desc",
    source: "رواه أبو داود والنسائي والترمذي عن أبي ذر رضي الله عنه، وهو حديث حسن",
    hadithKey: "fasting.white_days_hadith",
    type: "monthly",
    hijriDay: [13, 14, 15],
  },
  {
    id: "arafah",
    nameKey: "fasting.arafah",
    descriptionKey: "fasting.arafah_desc",
    source: "رواه مسلم عن أبي قتادة رضي الله عنه، وهو حديث صحيح",
    hadithKey: "fasting.arafah_hadith",
    type: "yearly",
    hijriMonth: 12,
    hijriDay: 9,
  },
  {
    id: "dhul_hijjah_10",
    nameKey: "fasting.dhul_hijjah",
    descriptionKey: "fasting.dhul_hijjah_desc",
    source: "رواه الترمذي وابن ماجه عن ابن عباس رضي الله عنهما، وهو حديث صحيح",
    hadithKey: "fasting.dhul_hijjah_hadith",
    type: "yearly",
    hijriMonth: 12,
    isRange: true,
    rangeStart: 1,
    rangeEnd: 9,
  },
  {
    id: "ashura",
    nameKey: "fasting.ashura",
    descriptionKey: "fasting.ashura_desc",
    source: "رواه مسلم عن أبي قتادة رضي الله عنه، وهو حديث صحيح",
    hadithKey: "fasting.ashura_hadith",
    type: "yearly",
    hijriMonth: 1,
    hijriDay: 10,
  },
  {
    id: "tasu_a",
    nameKey: "fasting.tasua",
    descriptionKey: "fasting.tasua_desc",
    source: "رواه مسلم عن ابن عباس رضي الله عنهما، وهو حديث صحيح",
    hadithKey: "fasting.tasua_hadith",
    type: "yearly",
    hijriMonth: 1,
    hijriDay: 9,
  },
  {
    id: "monday",
    nameKey: "fasting.monday",
    descriptionKey: "fasting.monday_desc",
    source: "رواه مسلم عن أبي قتادة رضي الله عنه، وهو حديث صحيح",
    hadithKey: "fasting.monday_hadith",
    type: "weekly",
    weekDay: [1],
  },
  {
    id: "thursday",
    nameKey: "fasting.thursday",
    descriptionKey: "fasting.thursday_desc",
    source: "رواه الترمذي وأبو داود عن أبي هريرة رضي الله عنه، وهو حديث صحيح",
    hadithKey: "fasting.thursday_hadith",
    type: "weekly",
    weekDay: [4],
  },
  {
    id: "shawwal_6",
    nameKey: "fasting.shawwal",
    descriptionKey: "fasting.shawwal_desc",
    source: "رواه مسلم عن أبي أيوب الأنصاري رضي الله عنه، وهو حديث صحيح",
    hadithKey: "fasting.shawwal_hadith",
    type: "yearly",
    hijriMonth: 10,
    isRange: true,
    rangeStart: 2,
    rangeEnd: 30,
  },
  {
    id: "shaban",
    nameKey: "fasting.shaban",
    descriptionKey: "fasting.shaban_desc",
    source: "رواه البخاري ومسلم عن عائشة رضي الله عنها، وهو حديث صحيح",
    hadithKey: "fasting.shaban_hadith",
    type: "yearly",
    hijriMonth: 8,
  },
];
