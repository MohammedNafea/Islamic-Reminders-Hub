export interface HijriDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
  monthNameEn: string;
}

export const hijriMonthsAr = [
  "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
  "جمادى الأولى", "جمادى الثانية", "رجب", "شعبان",
  "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
];

export const hijriMonthsEn = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhul Qa'dah", "Dhul Hijjah"
];

function parseArabicNum(s: string): number {
  // Normalize Eastern Arabic-Indic and Extended Arabic-Indic digits to ASCII
  const normalized = s
    .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[^\d]/g, "");
  return parseInt(normalized, 10);
}

export function toHijri(date: Date): HijriDate {
  try {
    const formatter = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      numberingSystem: "latn",
    } as Intl.DateTimeFormatOptions);
    const parts = formatter.formatToParts(date);
    const year = parseArabicNum(parts.find(p => p.type === "year")?.value ?? "0");
    const month = parseArabicNum(parts.find(p => p.type === "month")?.value ?? "0");
    const day = parseArabicNum(parts.find(p => p.type === "day")?.value ?? "0");
    if (!year || !month || !day) return fallbackHijri(date);
    return {
      year,
      month,
      day,
      monthName: hijriMonthsAr[month - 1] ?? "",
      monthNameEn: hijriMonthsEn[month - 1] ?? "",
    };
  } catch {
    return fallbackHijri(date);
  }
}

function fallbackHijri(date: Date): HijriDate {
  const jd = gregorianToJD(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const { year, month, day } = jdToHijri(jd);
  return {
    year,
    month,
    day,
    monthName: hijriMonthsAr[month - 1] ?? "",
    monthNameEn: hijriMonthsEn[month - 1] ?? "",
  };
}

function gregorianToJD(y: number, m: number, d: number): number {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function jdToHijri(jd: number): { year: number; month: number; day: number } {
  jd = Math.floor(jd) + 0.5;
  const z = jd - 1948438.5;
  const cyc = Math.floor(z / 10631);
  const rem = z - 10631 * cyc;
  const j = Math.floor((rem - 0.1) / 354.36707);
  const year = 30 * cyc + j + 1;
  const month = Math.min(12, Math.ceil((rem - 29.5001 * (j - Math.floor(j / 2))) / 29.5));
  const mStart = jd - Math.floor(29.5001 * (month - 1)) - Math.floor((11 * year + 3) / 30) + 1948440 - 385;
  const day = jd - mStart + 1;
  return { year, month: Math.ceil(month), day: Math.ceil(day) };
}

export function formatHijriDate(h: HijriDate, lang = "ar"): string {
  if (lang === "ar") {
    return `${h.day} ${h.monthName} ${h.year}هـ`;
  }
  return `${h.day} ${h.monthNameEn} ${h.year} AH`;
}

export function getGregorianDaysInHijriMonth(hijriYear: number, hijriMonth: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  const startSearch = new Date(today.getFullYear() - 1, 0, 1);
  for (let i = 0; i < 400; i++) {
    const d = new Date(startSearch);
    d.setDate(d.getDate() + i);
    const h = toHijri(d);
    if (h.year === hijriYear && h.month === hijriMonth) {
      dates.push(d);
    } else if (dates.length > 0) {
      break;
    }
  }
  return dates;
}

export function hijriToGregorian(hYear: number, hMonth: number, hDay: number): Date {
  const jd = Math.floor((11 * hYear + 3) / 30) + Math.floor(354 * hYear) +
    Math.floor(30 * hMonth) - Math.floor((hMonth - 1) / 2) + hDay + 1948440 - 385;
  const l = jd + 68569;
  const n = Math.floor((4 * l) / 146097);
  const ll = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (ll + 1)) / 1461001);
  const lll = ll - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * lll) / 2447);
  const day = lll - Math.floor((2447 * j) / 80);
  const llll = Math.floor(j / 11);
  const month = j + 2 - 12 * llll;
  const year = 100 * (n - 49) + i + llll;
  return new Date(year, month - 1, day);
}

export function isFastingDay(h: HijriDate, g: Date): string | null {
  // Arafah: 9 Dhul Hijjah
  if (h.month === 12 && h.day === 9) return "arafah";
  // Ashura: 10 Muharram
  if (h.month === 1 && h.day === 10) return "ashura";
  // Tasua: 9 Muharram
  if (h.month === 1 && h.day === 9) return "tasua";
  // White Days: 13, 14, 15 of every Hijri month
  if (h.day >= 13 && h.day <= 15) return "white_days";
  // Dhul Hijjah first 9 days
  if (h.month === 12 && h.day >= 1 && h.day <= 9) return "dhul_hijjah";
  // Shawwal 6 days (approximate for display)
  if (h.month === 10 && h.day >= 2 && h.day <= 7) return "shawwal";
  
  // Monday/Thursday
  const day = g.getDay();
  if (day === 1) return "monday";
  if (day === 4) return "thursday";
  
  return null;
}
