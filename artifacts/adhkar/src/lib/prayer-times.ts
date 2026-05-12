import { Coordinates, CalculationMethod, PrayerTimes, Prayer, Madhab, SunnahTimes } from "adhan";

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  lastThirdOfNight?: Date;
}

export type CalculationMethodName =
  | "MuslimWorldLeague"
  | "Egyptian"
  | "Karachi"
  | "UmmAlQura"
  | "Dubai"
  | "MoonsightingCommittee"
  | "NorthAmerica"
  | "Kuwait"
  | "Qatar"
  | "Singapore"
  | "Tehran"
  | "Turkey";

export function getPrayerTimes(
  lat: number,
  lng: number,
  date: Date,
  method: CalculationMethodName = "MuslimWorldLeague"
): PrayerTimesResult {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod[method]();
  params.madhab = Madhab.Shafi;
  const times = new PrayerTimes(coords, date, params);
  const sunnah = new SunnahTimes(times);
  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
    lastThirdOfNight: sunnah.lastThirdOfTheNight,
  };
}

export function getNextPrayer(times: PrayerTimesResult): { name: string; time: Date } | null {
  const now = new Date();
  const prayers = [
    { name: "fajr", time: times.fajr },
    { name: "sunrise", time: times.sunrise },
    { name: "dhuhr", time: times.dhuhr },
    { name: "asr", time: times.asr },
    { name: "maghrib", time: times.maghrib },
    { name: "isha", time: times.isha },
  ];
  return prayers.find(p => p.time > now) ?? null;
}

export function formatTime(date: Date, locale = "ar"): string {
  return date.toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export async function getCityFromCoords(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "ar" } }
    );
    const data = await res.json();
    return data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
  } catch {
    return "";
  }
}

export async function getPrayerTimesFromAPI(
  lat: number,
  lng: number,
  date: Date,
  method = 3
): Promise<PrayerTimesResult | null> {
  try {
    const d = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const res = await fetch(
      `https://api.aladhan.com/v1/timings/${d}?latitude=${lat}&longitude=${lng}&method=${method}`
    );
    const json = await res.json();
    if (json.code !== 200) return null;
    const t = json.data.timings;
    const parseTime = (s: string) => {
      const [h, m] = s.split(":").map(Number);
      const dt = new Date(date);
      dt.setHours(h, m, 0, 0);
      return dt;
    };
    return {
      fajr: parseTime(t.Fajr),
      sunrise: parseTime(t.Sunrise),
      dhuhr: parseTime(t.Dhuhr),
      asr: parseTime(t.Asr),
      maghrib: parseTime(t.Maghrib),
      isha: parseTime(t.Isha),
    };
  } catch {
    return null;
  }
}
