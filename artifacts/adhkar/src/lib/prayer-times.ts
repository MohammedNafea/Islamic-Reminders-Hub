import { Coordinates, CalculationMethod, PrayerTimes, Madhab, SunnahTimes } from "adhan";

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  middleOfTheNight?: Date;
  lastThirdOfNight?: Date;
  firstThirdOfNight?: Date;
  suhoor?: Date;
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
  new SunnahTimes(times);
  
  // Custom Suhoor calculation: 20 minutes before Fajr
  const suhoor = new Date(times.fajr.getTime() - 20 * 60 * 1000);
  
  const maghrib = times.maghrib.getTime();
  let fajr = times.fajr.getTime();
  if (fajr < maghrib) fajr += 24 * 60 * 60 * 1000;
  const nightDuration = fajr - maghrib;

  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
    middleOfTheNight: new Date(maghrib + nightDuration / 2),
    lastThirdOfNight: new Date(maghrib + (nightDuration * 2) / 3),
    firstThirdOfNight: new Date(maghrib + nightDuration / 3),
    suhoor,
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
    if (json.code !== 200) {
      return getPrayerTimes(lat, lng, date, methodToName(method));
    }

    const timings = json.data.timings;
    const toDate = (timeStr: string): Date => {
      const [h, m] = timeStr.split(":").map(Number);
      const result = new Date(date);
      result.setHours(h, m, 0, 0);
      return result;
    };

    const fajr = toDate(timings.Fajr);
    const maghrib = toDate(timings.Maghrib);
    let fajrMs = fajr.getTime();
    const maghribMs = maghrib.getTime();
    if (fajrMs < maghribMs) fajrMs += 24 * 60 * 60 * 1000;
    const nightDuration = fajrMs - maghribMs;

    return {
      fajr,
      sunrise: toDate(timings.Sunrise),
      dhuhr: toDate(timings.Dhuhr),
      asr: toDate(timings.Asr),
      maghrib,
      isha: toDate(timings.Isha),
      middleOfTheNight: new Date(maghribMs + nightDuration / 2),
      lastThirdOfNight: new Date(maghribMs + (nightDuration * 2) / 3),
      firstThirdOfNight: new Date(maghribMs + nightDuration / 3),
      suhoor: new Date(fajr.getTime() - 20 * 60 * 1000),
    };
  } catch {
    return getPrayerTimes(lat, lng, date, methodToName(method));
  }
}

function methodToName(method: number): CalculationMethodName {
  switch (method) {
    case 3: return "MuslimWorldLeague";
    case 5: return "Egyptian";
    case 4: return "Karachi";
    case 1: return "UmmAlQura";
    case 2: return "NorthAmerica";
    default: return "MuslimWorldLeague";
  }
}
