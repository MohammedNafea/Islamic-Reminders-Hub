import { localDB } from "./db";
import { safeFormatDate } from "./utils";

export interface CompletionRecord {
  date: string; // YYYY-MM-DD
  categories: string[]; // ['morning', 'evening', 'sleep', etc]
  tasbihCount: number; // total tasbih count for this day
}

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayKey(): string {
  return formatDateLocal(new Date());
}

export function getTrackerData(): Record<string, CompletionRecord> {
  return localDB.getTrackerData() as Record<string, CompletionRecord>;
}

export function saveTrackerData(data: Record<string, CompletionRecord>): void {
  // Save all records to IndexedDB (normally we save single records, but this keeps backwards compatibility)
  for (const [date, record] of Object.entries(data)) {
    localDB.saveTrackerRecord(date, record);
  }
}

export function logCategoryCompletion(category: string): void {
  const data = getTrackerData();
  const today = getTodayKey();
  
  if (!data[today]) {
    data[today] = { date: today, categories: [], tasbihCount: 0 };
  }
  
  if (!data[today].categories.includes(category)) {
    data[today].categories.push(category);
    localDB.saveTrackerRecord(today, data[today]);
  }
}

export function logTasbihIncrement(amount = 1): void {
  const data = getTrackerData();
  const today = getTodayKey();
  
  if (!data[today]) {
    data[today] = { date: today, categories: [], tasbihCount: 0 };
  }
  
  data[today].tasbihCount += amount;
  localDB.saveTrackerRecord(today, data[today]);
}


// Calculate the active consecutive days streak of worship completion
export function getWorshipStreak(): number {
  const data = getTrackerData();
  const dates = Object.keys(data).sort();
  if (dates.length === 0) return 0;

  const today = getTodayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateLocal(yesterday);

  // If there's no completion today AND none yesterday, streak is broken (0)
  if (!data[today] && !data[yesterdayKey]) {
    return 0;
  }

  let streak = 0;
  const checkDate = new Date();
  
  // If we didn't do anything today yet, start checking from yesterday
  if (!data[today]) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const checkKey = formatDateLocal(checkDate);
    if (data[checkKey] && (data[checkKey].categories.length > 0 || data[checkKey].tasbihCount > 0)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Get completion stats for the last 7 days for charts
export function getLast7DaysStats(lang = "ar") {
  const data = getTrackerData();
  const stats = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = formatDateLocal(d);
    const record = data[key];
    
    // Format date label (e.g. Day name in Arabic or other languages)
    const label = safeFormatDate(d, lang === "ar" ? "ar-SA" : lang, { weekday: "short" });
    
    stats.push({
      date: key,
      dayLabel: label,
      completions: record ? record.categories.length : 0,
      tasbih: record ? record.tasbihCount : 0,
    });
  }
  
  return stats;
}
