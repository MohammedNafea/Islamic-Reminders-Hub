export interface DhikrProgress {
  [dhikrId: string]: number;
}

export interface DailyProgress {
  date: string;
  progress: DhikrProgress;
}

const STORAGE_KEY = "adhkar_progress";
const SETTINGS_KEY = "adhkar_settings";

export interface AppSettings {
  language: string;
  theme: "light" | "dark" | "system";
  calculationMethod: string;
  fontSize: "sm" | "md" | "lg" | "xl";
  vibrate: boolean;
  notifications: boolean;
  location?: { lat: number; lng: number; city: string };
}

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function getDailyProgress(): DhikrProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const all: Record<string, DhikrProgress> = JSON.parse(stored);
    const todayKey = getTodayKey();
    return all[todayKey] ?? {};
  } catch {
    return {};
  }
}

export function setDhikrCount(dhikrId: string, count: number): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, DhikrProgress> = stored ? JSON.parse(stored) : {};
    const todayKey = getTodayKey();
    if (!all[todayKey]) all[todayKey] = {};
    all[todayKey][dhikrId] = count;
    // Keep only last 30 days
    const keys = Object.keys(all).sort();
    while (keys.length > 30) {
      delete all[keys.shift()!];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function resetDayProgress(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, DhikrProgress> = stored ? JSON.parse(stored) : {};
    const todayKey = getTodayKey();
    delete all[todayKey];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return defaultSettings();
    return { ...defaultSettings(), ...JSON.parse(stored) };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  try {
    const current = getSettings();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
  } catch {
    // ignore
  }
}

function defaultSettings(): AppSettings {
  return {
    language: "ar",
    theme: "system",
    calculationMethod: "MuslimWorldLeague",
    fontSize: "md",
    vibrate: true,
    notifications: false,
  };
}

export function getTasbihCount(name: string, daily = false): number {
  try {
    const key = daily ? `tasbih_${name}_${getTodayKey()}` : `tasbih_${name}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored) : 0;
  } catch {
    return 0;
  }
}

export function setTasbihCount(name: string, count: number, daily = false): void {
  try {
    const key = daily ? `tasbih_${name}_${getTodayKey()}` : `tasbih_${name}`;
    localStorage.setItem(key, String(count));
  } catch {
    // ignore
  }
}
