import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getPrayerTimesFromAPI, PrayerTimesResult } from "@/lib/prayer-times";
import { getSettings } from "@/lib/store";
import { NotificationManager } from "@/lib/notifications";

/**
 * Hook that:
 * 1. Fetches today's prayer times once
 * 2. Schedules a setTimeout for each prayer (10 min early + at prayer time)
 * 3. Fires browser notifications if the user has granted permission
 */
export function usePrayerNotifications() {
  const { t } = useTranslation();
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const schedulePrayerNotifications = useCallback(
    async (times: PrayerTimesResult) => {
      const settings = getSettings();
      if (!settings.notifications || Notification.permission !== "granted") return;

      clearAll();
      const now = Date.now();

      const prayers: { key: string; nameKey: string; time: Date }[] = [
        { key: "fajr", nameKey: "prayer.fajr", time: times.fajr },
        { key: "dhuhr", nameKey: "prayer.dhuhr", time: times.dhuhr },
        { key: "asr", nameKey: "prayer.asr", time: times.asr },
        { key: "maghrib", nameKey: "prayer.maghrib", time: times.maghrib },
        { key: "isha", nameKey: "prayer.isha", time: times.isha },
      ];

      prayers.forEach(({ nameKey, time }) => {
        const prayerMs = time.getTime();
        const label = t(nameKey);

        // 10-minute early reminder
        const earlyMs = prayerMs - 10 * 60 * 1000;
        if (earlyMs > now) {
          const id = setTimeout(() => {
            NotificationManager.showNotification(
              t("prayer.notification_soon", { defaultValue: "اقترب وقت الصلاة" }),
              {
                body: t("prayer.notification_body_soon", {
                  defaultValue: `صلاة {{name}} بعد 10 دقائق`,
                  name: label,
                }).replace("{{name}}", label),
                icon: "/icon-192.png",
                badge: "/favicon.png",
                tag: `prayer-soon-${nameKey}`,
              }
            );
          }, earlyMs - now);
          timeoutsRef.current.push(id);
        }

        // At prayer time
        if (prayerMs > now) {
          const id = setTimeout(() => {
            NotificationManager.showNotification(
              t("prayer.notification_now", { defaultValue: "حان وقت الصلاة" }),
              {
                body: t("prayer.notification_body_now", {
                  defaultValue: `حان الآن وقت صلاة {{name}}`,
                  name: label,
                }).replace("{{name}}", label),
                icon: "/icon-192.png",
                badge: "/favicon.png",
                tag: `prayer-now-${nameKey}`,
              }
            );
          }, prayerMs - now);
          timeoutsRef.current.push(id);
        }
      });
    },
    [t, clearAll]
  );

  useEffect(() => {
    const settings = getSettings();
    if (!settings.notifications) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    let cancelled = false;

    (async () => {
      try {
        let lat = 21.4225,
          lng = 39.8262;
        if (navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((res, rej) =>
              navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
            );
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          } catch {
            /* use defaults */
          }
        }

        const method =
          settings.calculationMethod === "MuslimWorldLeague"
            ? 3
            : settings.calculationMethod === "Egyptian"
            ? 5
            : 4;

        const times = await getPrayerTimesFromAPI(lat, lng, new Date(), method);
        if (times && !cancelled) {
          schedulePrayerNotifications(times);
        }
      } catch {
        /* ignore fetch errors */
      }
    })();

    return () => {
      cancelled = true;
      clearAll();
    };
  }, [schedulePrayerNotifications, clearAll]);
}
