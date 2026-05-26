import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeFormatDate(date: Date | null | undefined, lang: string, options?: Intl.DateTimeFormatOptions): string {
  if (!date || isNaN(date.getTime())) return "";
  try {
    return date.toLocaleDateString(lang, options);
  } catch {
    try {
      const baseLang = lang.split("-")[0];
      return date.toLocaleDateString(baseLang, options);
    } catch {
      try {
        return date.toLocaleDateString("en", options);
      } catch {
        return date.toDateString();
      }
    }
  }
}

export function safeFormatTime(date: Date | null | undefined, lang: string, options?: Intl.DateTimeFormatOptions): string {
  if (!date || isNaN(date.getTime())) return "";
  try {
    return date.toLocaleTimeString(lang, options);
  } catch {
    try {
      const baseLang = lang.split("-")[0];
      return date.toLocaleTimeString(baseLang, options);
    } catch {
      try {
        return date.toLocaleTimeString("en", options);
      } catch {
        return date.toTimeString();
      }
    }
  }
}

export function safeFormatNumber(num: number | null | undefined, lang?: string): string {
  if (num === null || num === undefined || isNaN(num)) return "0";
  try {
    return num.toLocaleString(lang);
  } catch {
    try {
      return num.toLocaleString();
    } catch {
      return String(num);
    }
  }
}

