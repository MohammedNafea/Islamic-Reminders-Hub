import { getSettings } from "./store";

// Store timeout IDs for cancellation
const scheduledTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Check if push/notification is supported in the current environment.
 * Supports: standard Notification API, Service Worker notification, Android PWA.
 */
export function isNotificationSupported(): boolean {
  if (typeof window === "undefined") return false;
  // Standard Notification API
  if ("Notification" in window) return true;
  // Service Worker can show notifications even without window.Notification
  if ("serviceWorker" in navigator) return true;
  return false;
}

/**
 * Check if we are running as an installed PWA (standalone/fullscreen).
 */
export function isInstalledPWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // iOS Safari
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Get the current notification permission state.
 * Works across browsers including Android Chrome.
 */
export function getNotificationPermission(): NotificationPermission {
  if ("Notification" in window) return Notification.permission;
  return "denied";
}

export class NotificationManager {
  /**
   * Request notification permission. Returns true if granted.
   * Works for both standard browsers and Android PWA.
   */
  static async requestPermission(): Promise<boolean> {
    // If Notification API available
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      } catch {
        return false;
      }
    }
    // Fallback: if service worker with push manager is available
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const perm = await reg.pushManager.permissionState({ userVisibleOnly: true });
        return perm === "granted";
      } catch {
        return false;
      }
    }
    return false;
  }

  static async scheduleReminders() {
    const settings = getSettings();
    const hasPermission =
      ("Notification" in window && Notification.permission === "granted") ||
      isInstalledPWA();

    if (settings.notifications && hasPermission) {
      this.showNotification("مركز الأذكار", {
        body: "تم تفعيل التنبيهات الذكية بنجاح. سنذكرك بالأذكار والأدعية اليومية.",
        icon: "/icon-192.png",
      });

      this.cancelAll();
      this.scheduleAdhkarReminders();
    }
  }

  static cancelAll() {
    for (const [key, id] of scheduledTimeouts) {
      clearTimeout(id);
      scheduledTimeouts.delete(key);
    }
  }

  static scheduleAdhkarReminders() {
    const settings = getSettings();

    if (settings.notificationsNight) {
      // Sleep Adhkar (10:00 PM)
      this.scheduleAtHour(22, 0, "أذكار النوم", "حان وقت أذكار النوم، حافظ على أوراد النوم الحافظة.");
      // Sahar / Istighfar (3:00 AM)
      this.scheduleAtHour(3, 0, "الاستغفار بالأسحار", "والمستغفرين بالأسحار.. حان وقت الاستغفار والدعاء.");
    }
  }

  private static scheduleAtHour(hour: number, minute: number, title: string, body: string) {
    const key = `adhkar_${hour}_${minute}`;
    const existing = scheduledTimeouts.get(key);
    if (existing) clearTimeout(existing);

    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hour, minute, 0, 0);

    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    const delay = scheduled.getTime() - now.getTime();
    const id = setTimeout(() => {
      scheduledTimeouts.delete(key);
      this.showNotification(title, { body, icon: "/icon-192.png" });
      this.scheduleAtHour(hour, minute, title, body);
    }, delay);
    scheduledTimeouts.set(key, id);
  }

  /**
   * Show a notification. Prefers Service Worker notifications (Android-compatible).
   */
  static async showNotification(title: string, options?: NotificationOptions) {
    const notifOptions: NotificationOptions = {
      icon: "/icon-192.png",
      badge: "/favicon.png",
      dir: "rtl",
      lang: "ar",
      ...options,
    };

    // Prefer Service Worker for better Android/PWA support
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, notifOptions);
        return;
      } catch {
        // Fall through to window.Notification
      }
    }

    // Fallback to window.Notification
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, notifOptions);
      } catch (e) {
        console.warn("Notification display failed:", e);
      }
    }
  }

  static checkAndNotify(nextPrayerName: string, timeToNext: number) {
    const settings = getSettings();
    if (!settings.notifications) return;

    if (timeToNext > 590 && timeToNext < 610) {
      this.showNotification("اقترب موعد الصلاة", {
        body: `صلاة ${nextPrayerName} بعد 10 دقائق تقريبًا.`,
        icon: "/icon-192.png",
      });
    }
  }
}
