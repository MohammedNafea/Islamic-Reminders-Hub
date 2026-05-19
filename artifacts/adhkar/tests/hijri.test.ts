import { describe, it, expect } from "vitest";
import { toHijri, formatHijriDate, isFastingDay, hijriMonthsAr, hijriMonthsEn, hijriToGregorian, getGregorianDaysInHijriMonth } from "../src/lib/hijri";

describe("Hijri Date Library", () => {
  it("converts Gregorian date to Hijri correctly", () => {
    // Known date test: Ramadan 1, 1445 AH was around March 11, 2024
    const gregorian = new Date(2024, 2, 11); // March 11, 2024
    const hijri = toHijri(gregorian);

    expect(hijri).toBeDefined();
    expect(hijri.year).toBeGreaterThan(1400);
    expect(hijri.month).toBeGreaterThanOrEqual(1);
    expect(hijri.month).toBeLessThanOrEqual(12);
    expect(hijri.monthName).toBe(hijriMonthsAr[hijri.month - 1]);
    expect(hijri.monthNameEn).toBe(hijriMonthsEn[hijri.month - 1]);
  });

  it("formats Hijri date in Arabic and English", () => {
    const sampleHijri = {
      year: 1445,
      month: 9,
      day: 1,
      monthName: "رمضان",
      monthNameEn: "Ramadan",
    };

    const arFormatted = formatHijriDate(sampleHijri, "ar");
    expect(arFormatted).toBe("1 رمضان 1445هـ");

    const enFormatted = formatHijriDate(sampleHijri, "en");
    expect(enFormatted).toBe("1 Ramadan 1445 AH");
  });

  it("identifies specific fasting days correctly", () => {
    const arafahHijri = { year: 1445, month: 12, day: 9, monthName: "ذو الحجة", monthNameEn: "Dhul Hijjah" };
    expect(isFastingDay(arafahHijri, new Date(2024, 5, 15))).toBe("arafah");

    const ashuraHijri = { year: 1445, month: 1, day: 10, monthName: "محرم", monthNameEn: "Muharram" };
    expect(isFastingDay(ashuraHijri, new Date(2023, 6, 28))).toBe("ashura");

    const whiteDayHijri = { year: 1445, month: 7, day: 14, monthName: "رجب", monthNameEn: "Rajab" };
    expect(isFastingDay(whiteDayHijri, new Date(2024, 0, 26))).toBe("white_days");
  });

  it("identifies Sunnah weekly fasting days (Monday/Thursday)", () => {
    const normalHijri = { year: 1445, month: 5, day: 5, monthName: "جمادى الأولى", monthNameEn: "Jumada al-Awwal" };
    
    // 2024-05-20 is a Monday (getDay() === 1)
    const monday = new Date(2024, 4, 20); 
    expect(isFastingDay(normalHijri, monday)).toBe("monday");

    // 2024-05-23 is a Thursday (getDay() === 4)
    const thursday = new Date(2024, 4, 23);
    expect(isFastingDay(normalHijri, thursday)).toBe("thursday");

    // 2024-05-21 is a Tuesday (getDay() === 2)
    const tuesday = new Date(2024, 4, 21);
    expect(isFastingDay(normalHijri, tuesday)).toBeNull();
  });

  it("identifies remaining fasting rules (Tasua, Dhul Hijjah, Shawwal)", () => {
    const tasuaHijri = { year: 1445, month: 1, day: 9, monthName: "محرم", monthNameEn: "Muharram" };
    expect(isFastingDay(tasuaHijri, new Date(2023, 6, 27))).toBe("tasua");

    const dhulHijjahHijri = { year: 1445, month: 12, day: 5, monthName: "ذو الحجة", monthNameEn: "Dhul Hijjah" };
    expect(isFastingDay(dhulHijjahHijri, new Date(2024, 5, 11))).toBe("dhul_hijjah");

    const shawwalHijri = { year: 1445, month: 10, day: 4, monthName: "شوال", monthNameEn: "Shawwal" };
    expect(isFastingDay(shawwalHijri, new Date(2024, 3, 13))).toBe("shawwal");
  });

  it("tests fallback calculation and gregorian conversion utilities", () => {
    const greg = hijriToGregorian(1445, 9, 1); // Ramadan 1, 1445
    expect(greg).toBeInstanceOf(Date);
    expect(greg.getFullYear()).toBe(2024);

    // Use current year derived from today. If today is early in the year, startSearch (Jan 1 last year) easily covers currentHijriYear - 1
    const currentHijriYear = toHijri(new Date()).year;
    let days = getGregorianDaysInHijriMonth(currentHijriYear, 9);
    if (days.length === 0) {
      days = getGregorianDaysInHijriMonth(currentHijriYear - 1, 9);
    }
    expect(days.length).toBeGreaterThan(0);
    expect(days[0]).toBeInstanceOf(Date);

    // Force fallbackHijri execution by mocking Intl.DateTimeFormat to throw
    const originalDateTimeFormat = Intl.DateTimeFormat;
    (Intl as any).DateTimeFormat = function() {
      throw new Error("Intl not supported");
    };
    const fallback = toHijri(new Date(2024, 2, 11));
    expect(fallback.year).toBe(1445);
    expect(fallback.monthName).toBeDefined();
    Intl.DateTimeFormat = originalDateTimeFormat;
  });
});
