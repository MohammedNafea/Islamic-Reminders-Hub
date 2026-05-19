import { getSettings } from "./store";

// Store timeout IDs for cancellation
const scheduledTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export class NotificationManager {
  static async requestPermission() {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported in this browser");
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  static async scheduleReminders() {
    const settings = getSettings();
    if (settings.notifications && Notification.permission === "granted") {
      this.showNotification("مركز الأذكار", {
        body: "تم تفعيل التنبيهات الذكية بنجاح. سنذكرك بالأذكار والأدعية اليومية.",
        icon: "/icon-192.png",
      });
      
      // Clear existing timeouts before scheduling new ones
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
    // Morning Adhkar (7:00 AM)
    this.scheduleAtHour(7, 0, "أذكار الصباح", "حان وقت أذكار الصباح لتبدأ يومك بذكر الله.");
    // Evening Adhkar (6:00 PM)
    this.scheduleAtHour(18, 0, "أذكار المساء", "حان وقت أذكار المساء، اجعل خاتمة يومك ذكرًا.");
  }

  private static scheduleAtHour(hour: number, minute: number, title: string, body: string) {
    const key = `adhkar_${hour}_${minute}`;
    // Clear existing timeout for this slot if any
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
      this.scheduleAtHour(hour, minute, title, body); // Reschedule
    }, delay);
    scheduledTimeouts.set(key, id);
  }

  static showNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === "granted") {
      try {
        // Try service worker notification first (better for PWA)
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
              icon: "/icon-192.png",
              badge: "/favicon.png",
              ...options
            });
          });
        } else {
          new Notification(title, {
            icon: "/icon-192.png",
            ...options
          });
        }
      } catch {
        new Notification(title, options);
      }
    }
  }

  // Logic for scheduling specific prayer reminders
  static checkAndNotify(nextPrayerName: string, timeToNext: number) {
    const settings = getSettings();
    if (!settings.notifications) return;

    // Notify 10 minutes before
    if (timeToNext > 590 && timeToNext < 610) {
      this.showNotification("اقترب موعد الصلاة", {
        body: `صلاة ${nextPrayerName} بعد 10 دقائق تقريبًا.`,
        icon: "/favicon.svg",
      });
    }
  }
}
