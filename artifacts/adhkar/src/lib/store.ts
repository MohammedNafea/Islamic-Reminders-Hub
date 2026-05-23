import { localDB } from "./db";

export interface DhikrProgress {
  [dhikrId: string]: number;
}

export interface DailyProgress {
  date: string;
  progress: DhikrProgress;
}

export interface AppSettings {
  language: string;
  theme: "light" | "dark" | "system" | "fajr" | "duha" | "maghrib" | "sahar" | "dynamic";
  calculationMethod: string;
  fontSize: "sm" | "md" | "lg" | "xl";
  vibrate: boolean;
  notifications: boolean;
  notificationsPrayers: boolean;
  notificationsAdhkar: boolean;
  notificationsNight: boolean;
  notificationsAthan: "off" | "azan1" | "azan2" | "makkah" | "madinah" | "daghiri";
  notificationsEarlyMinutes: number;
  notificationsAthanType: "full" | "takbeer";
  notificationsFasting: boolean;
  notificationsFastingHoursBeforeFajr: number;
  notificationsSuhoor: boolean;
  notificationsSuhoorMinutesBeforeFajr: number;
  location?: { lat: number; lng: number; city: string };
}

function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyProgress(): DhikrProgress {
  const todayKey = getTodayKey();
  return localDB.getGeneralProgress<DhikrProgress>(todayKey, {});
}

export function setDhikrCount(dhikrId: string, count: number): void {
  const todayKey = getTodayKey();
  const todayProgress = { ...getDailyProgress() };
  todayProgress[dhikrId] = count;
  localDB.saveGeneralProgress(todayKey, todayProgress);
}

export function resetDayProgress(): void {
  const todayKey = getTodayKey();
  localDB.saveGeneralProgress(todayKey, {});
}

export function getSettings(): AppSettings {
  const defaults = defaultSettings();
  const saved = localDB.getSettings<AppSettings>(defaults);
  return { ...defaults, ...saved };
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const current = getSettings();
  localDB.saveSettings({ ...current, ...settings });
}

function defaultSettings(): AppSettings {
  return {
    language: "ar",
    theme: "system",
    calculationMethod: "MuslimWorldLeague",
    fontSize: "md",
    vibrate: true,
    notifications: false,
    notificationsPrayers: true,
    notificationsAdhkar: true,
    notificationsNight: true,
    notificationsAthan: "off",
    notificationsEarlyMinutes: 10,
    notificationsAthanType: "full",
    notificationsFasting: true,
    notificationsFastingHoursBeforeFajr: 0,
    notificationsSuhoor: true,
    notificationsSuhoorMinutesBeforeFajr: 20,
  };
}

export function getTasbihCount(name: string, daily = false): number {
  const key = daily ? `tasbih_${name}_${getTodayKey()}` : `tasbih_${name}`;
  return localDB.getGeneralProgress<number>(key, 0);
}

export function setTasbihCount(name: string, count: number, daily = false): void {
  const key = daily ? `tasbih_${name}_${getTodayKey()}` : `tasbih_${name}`;
  localDB.saveGeneralProgress(key, count);
}

