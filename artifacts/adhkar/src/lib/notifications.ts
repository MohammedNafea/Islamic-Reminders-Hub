/**
 * notifications.ts — Robust notification system for Android PWA, iOS, desktop
 * Supports: Service Worker showNotification (best for Android PWA),
 *           window.Notification (desktop + Firefox), and graceful fallbacks.
 */

const scheduledTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// ── Capability detection ────────────────────────────────────────────────────

export function isNotificationSupported(): boolean {
  if (typeof window === "undefined") return false;
  // Standard Notification API (desktop + Firefox Android)
  if ("Notification" in window) return true;
  // Service Worker can showNotification even without window.Notification
  if ("serviceWorker" in navigator) return true;
  return false;
}

export function isInstalledPWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isHuaweiBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /HuaweiBrowser|HUAWEI|Honor/i.test(ua);
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window !== "undefined" && "Notification" in window) {
    return Notification.permission;
  }
  return "default";
}

// ── Core API ────────────────────────────────────────────────────────────────

export class NotificationManager {
  
  /** Request permission. Works on Android Chrome PWA, iOS 16.4+, desktop. */
  static async requestPermission(): Promise<boolean> {
    // 1. Standard Notification API
    if ("Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        return perm === "granted";
      } catch { /* fall through */ }
    }
    // 2. Service Worker PushManager (Android PWA fallback)
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const state = await reg.pushManager.permissionState({ userVisibleOnly: true });
        return state === "granted";
      } catch { /* fall through */ }
    }
    // 3. Huawei / HarmonyOS: permissions might need manual grant
    return false;
  }

  /** Show a notification. Prefers SW (works on Android PWA background). */
  static async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    const opts: NotificationOptions = {
      icon: "/icon-192.png",
      badge: "/favicon.png",
      dir: "rtl",
      lang: "ar",
      requireInteraction: false,
      silent: false,
      ...options,
    };

    // ── Method 1: Service Worker showNotification (Android PWA, best) ──────
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, opts);
        return;
      } catch { /* fall through */ }
    }

    // ── Method 2: window.Notification (desktop, Firefox) ──────────────────
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, opts);
        return;
      } catch { /* fall through */ }
    }

    // ── Method 3: Send message to SW to show notification ──────────────────
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title,
        options: opts,
      });
    }
  }

  /** Schedule all reminders based on current settings. */
  static async scheduleReminders(settings: { notifications: boolean; notificationsNight: boolean }): Promise<void> {
    this.cancelAll();
    if (!settings.notifications) return;

    const hasPermission =
      ("Notification" in window && Notification.permission === "granted") ||
      isInstalledPWA();

    if (!hasPermission) return;

    // Confirm activation
    await this.showNotification("مركز الأذكار ✅", {
      body: "تم تفعيل التنبيهات. ستصلك تذكيرات الأذكار اليومية.",
      tag: "activation",
    });

    // Schedule daily adhkar
    this._scheduleAtTime(6, 0, "أذكار الصباح 🌅",
      "أصبحنا وأصبح الملك لله... حان وقت أذكار الصباح");
    this._scheduleAtTime(17, 30, "أذكار المساء 🌆",
      "أمسينا وأمسى الملك لله... حان وقت أذكار المساء");
    this._scheduleAtTime(13, 0, "تذكير الجمعة 🕌",
      "لا تنسَ الإكثار من الصلاة على النبي يوم الجمعة");

    if (settings.notificationsNight) {
      this._scheduleAtTime(22, 0, "أذكار النوم 🌙",
        "«بسمك اللهم أحيا وأموت» — حان وقت أذكار النوم");
      this._scheduleAtTime(3, 30, "وقت الاستغفار 🤲",
        "والمستغفرين بالأسحار — حان وقت الدعاء والاستغفار");
    }
  }

  private static _scheduleAtTime(h: number, m: number, title: string, body: string): void {
    const key = `adhkar_${h}_${m}`;
    if (scheduledTimeouts.has(key)) clearTimeout(scheduledTimeouts.get(key)!);

    const now = new Date();
    const next = new Date();
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);

    const delay = next.getTime() - now.getTime();
    const id = setTimeout(async () => {
      scheduledTimeouts.delete(key);
      await NotificationManager.showNotification(title, { body, tag: key });
      NotificationManager._scheduleAtTime(h, m, title, body); // reschedule next day
    }, delay);
    scheduledTimeouts.set(key, id);
  }

  static cancelAll(): void {
    for (const [key, id] of scheduledTimeouts) {
      clearTimeout(id);
      scheduledTimeouts.delete(key);
    }
  }

  static checkAndNotifyPrayer(nextPrayerName: string, minutesRemaining: number): void {
    if (minutesRemaining === 10) {
      this.showNotification(`⏰ ${nextPrayerName} بعد 10 دقائق`, {
        body: `استعد لصلاة ${nextPrayerName}`,
        tag: `prayer_${nextPrayerName}`,
      });
    }
  }
}
