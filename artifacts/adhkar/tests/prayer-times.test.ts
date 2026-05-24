import { describe, it, expect, vi } from "vitest";
import { getPrayerTimes, getNextPrayer, formatTime, getCityFromCoords, getPrayerTimesFromAPI } from "../src/lib/prayer-times";

describe("Prayer Times Library", () => {
  const meccaLat = 21.4225;
  const meccaLng = 39.8262;
  // Fixed test date: May 20, 2024 at 12:00 PM
  const testDate = new Date(2024, 4, 20, 12, 0, 0);

  it("calculates prayer times correctly for Mecca", () => {
    const times = getPrayerTimes(meccaLat, meccaLng, testDate, "UmmAlQura");

    expect(times).toBeDefined();
    expect(times.fajr).toBeInstanceOf(Date);
    expect(times.dhuhr).toBeInstanceOf(Date);
    expect(times.asr).toBeInstanceOf(Date);
    expect(times.maghrib).toBeInstanceOf(Date);
    expect(times.isha).toBeInstanceOf(Date);

    // Dhuhr in Mecca around May 20 is around 12:18 PM Local Time (Asia/Riyadh)
    const dhuhrHourInMecca = parseInt(times.dhuhr.toLocaleTimeString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Riyadh" }), 10);
    expect(dhuhrHourInMecca).toBe(12);
  });

  it("calculates night divisions and suhoor time correctly", () => {
    const times = getPrayerTimes(meccaLat, meccaLng, testDate, "UmmAlQura");

    expect(times.middleOfTheNight).toBeInstanceOf(Date);
    expect(times.lastThirdOfNight).toBeInstanceOf(Date);
    expect(times.suhoor).toBeInstanceOf(Date);

    // Suhoor should be exactly 20 minutes before Fajr
    const diffMinutes = (times.fajr.getTime() - times.suhoor!.getTime()) / (1000 * 60);
    expect(diffMinutes).toBe(20);
  });

  it("identifies the next upcoming prayer correctly", () => {
    const times = getPrayerTimes(meccaLat, meccaLng, testDate, "UmmAlQura");

    // Mock system time to 10:00 AM Mecca local time (Asia/Riyadh)
    // Mecca is UTC+3, so 10:00 AM Mecca time corresponds to 7:00 AM UTC.
    const mockNow = new Date(Date.UTC(2024, 4, 20, 7, 0, 0));
    vi.setSystemTime(mockNow);

    const next = getNextPrayer(times);
    expect(next).toBeDefined();
    // Since 10 AM is after Fajr/Sunrise but before Dhuhr (12:18 PM), next is Dhuhr
    expect(next?.name).toBe("dhuhr");

    vi.useRealTimers();
  });

  it("formats time correctly in Arabic and English locales", () => {
    const sampleTime = new Date(2024, 4, 20, 15, 30, 0); // 3:30 PM

    const arFormatted = formatTime(sampleTime, "ar");
    expect(arFormatted).toContain("٣:٣٠");

    const enFormatted = formatTime(sampleTime, "en");
    expect(enFormatted).toMatch(/3:30\s[PM|pm]/i);
  });

  it("fetches city name from coordinates (mocked)", async () => {
    // Test fetch failure / fallback
    const globalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const cityErr = await getCityFromCoords(meccaLat, meccaLng);
    expect(cityErr).toBe("");

    // Test fetch success
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ address: { city: "Makkah" } }),
    });
    const city = await getCityFromCoords(meccaLat, meccaLng);
    expect(city).toBe("Makkah");

    global.fetch = globalFetch;
  });

  it("fetches prayer times from API (mocked)", async () => {
    const globalFetch = global.fetch;
    
    // Test API failure fallback to local calculation
    global.fetch = vi.fn().mockRejectedValue(new Error("API error"));
    const fallbackTimes = await getPrayerTimesFromAPI(meccaLat, meccaLng, testDate, 3);
    expect(fallbackTimes).toBeDefined();
    expect(fallbackTimes!.fajr).toBeInstanceOf(Date);

    // Test API success
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        code: 200,
        data: {
          timings: {
            Fajr: "04:30",
            Sunrise: "05:50",
            Dhuhr: "12:15",
            Asr: "15:45",
            Maghrib: "18:40",
            Isha: "20:10",
          },
        },
      }),
    });
    const apiTimes = await getPrayerTimesFromAPI(meccaLat, meccaLng, testDate, 1);
    expect(apiTimes).toBeDefined();
    expect(apiTimes!.fajr.getHours()).toBe(4);
    expect(apiTimes!.fajr.getMinutes()).toBe(30);

    // Test remaining fallback calculation methods (5: Egyptian, 4: Karachi, 2: NorthAmerica, 999: default)
    global.fetch = vi.fn().mockRejectedValue(new Error("API error"));
    const timesEgyptian = await getPrayerTimesFromAPI(meccaLat, meccaLng, testDate, 5);
    expect(timesEgyptian).toBeDefined();
    const timesKarachi = await getPrayerTimesFromAPI(meccaLat, meccaLng, testDate, 4);
    expect(timesKarachi).toBeDefined();
    const timesNA = await getPrayerTimesFromAPI(meccaLat, meccaLng, testDate, 2);
    expect(timesNA).toBeDefined();
    const timesDefault = await getPrayerTimesFromAPI(meccaLat, meccaLng, testDate, 999);
    expect(timesDefault).toBeDefined();

    global.fetch = globalFetch;
  });
});
