import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getPrayerTimesFromAPI, PrayerTimesResult } from "@/lib/prayer-times";
import { getSettings } from "@/lib/store";
import { NotificationManager } from "@/lib/notifications";
import { toHijri, isFastingDay } from "@/lib/hijri";

const ATHAN_SOUNDS: Record<string, string> = {
  makkah: "https://www.islamcan.com/audio/athan/azan2.mp3",
  madinah: "https://www.islamcan.com/audio/athan/azan3.mp3",
  daghiri: "https://www.islamcan.com/audio/athan/azan12.mp3",
  azan1: "https://www.islamcan.com/audio/athan/azan6.mp3",
  azan2: "https://www.islamcan.com/audio/athan/azan4.mp3",
};

/**
 * Hook that:
 * 1. Fetches today's prayer times once
 * 2. Schedules a setTimeout for each prayer (10 min early + at prayer time)
 * 3. Fires browser notifications if the user has granted permission
 */
export function usePrayerNotifications() {
  const { t } = useTranslation();
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const athanAudioRef = useRef<HTMLAudioElement | null>(null);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (athanAudioRef.current) {
      athanAudioRef.current.pause();
      athanAudioRef.current = null;
    }
  }, []);

  const schedulePrayerNotifications = useCallback(
    async (times: PrayerTimesResult) => {
      const settings = getSettings();
      if (!settings.notifications || !settings.notificationsPrayers || Notification.permission !== "granted") return;

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

        // Early reminder based on settings
        if (settings.notificationsEarlyMinutes && settings.notificationsEarlyMinutes > 0) {
          const earlyMs = prayerMs - settings.notificationsEarlyMinutes * 60 * 1000;
          if (earlyMs > now) {
            const id = setTimeout(() => {
              NotificationManager.showNotification(
                t("prayer.notification_soon", { defaultValue: "اقترب وقت الصلاة" }),
                {
                  body: t("prayer.notification_body_soon", {
                    defaultValue: `صلاة {{name}} بعد {{minutes}} دقائق`,
                    name: label,
                    minutes: settings.notificationsEarlyMinutes,
                  }).replace("{{name}}", label).replace("{{minutes}}", String(settings.notificationsEarlyMinutes)),
                  icon: "/icon-192.png",
                  badge: "/favicon.png",
                  tag: `prayer-soon-${nameKey}`,
                }
              );
            }, earlyMs - now);
            timeoutsRef.current.push(id);
          }
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

            // Play Athan if configured
            const s = getSettings();
            if (s.notificationsAthan && s.notificationsAthan !== "off") {
              const url = ATHAN_SOUNDS[s.notificationsAthan] || ATHAN_SOUNDS.makkah;
              try {
                if (athanAudioRef.current) {
                  athanAudioRef.current.pause();
                }
                const audio = new Audio(url);
                athanAudioRef.current = audio;

                if (s.notificationsAthanType === "takbeer") {
                  const checkTakbeer = () => {
                    if (audio.currentTime >= 8) {
                      audio.pause();
                      audio.removeEventListener("timeupdate", checkTakbeer);
                    }
                  };
                  audio.addEventListener("timeupdate", checkTakbeer);
                }

                audio.play().catch(e => console.log("Athan autoplay blocked or failed:", e));
              } catch (err) {
                console.error("Athan playback error:", err);
              }
            }
          }, prayerMs - now);
          timeoutsRef.current.push(id);
        }
      });

      // Fasting reminder (15 minutes after Maghrib)
      if (settings.notificationsFasting) {
        const maghribMs = times.maghrib.getTime();
        const fastingCheckMs = maghribMs + 15 * 60 * 1000;
        if (fastingCheckMs > now) {
          const id = setTimeout(() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowHijri = toHijri(tomorrow);
            const fastingType = isFastingDay(tomorrowHijri, tomorrow);
            
            if (fastingType) {
              const title = t("fasting.reminder_title", { defaultValue: "تذكير بصيام الغد" });
              const fastingName = t(`fasting.${fastingType}`, { defaultValue: fastingType });
              const body = t("fasting.reminder_body", { 
                defaultValue: `تذكير: غداً هو يوم صيام ({{name}}). تقبل الله طاعتكم.`,
                name: fastingName 
              }).replace("{{name}}", fastingName);
              
              NotificationManager.showNotification(title, {
                body,
                icon: "/icon-192.png",
                badge: "/favicon.png",
                tag: "fasting-tomorrow",
              });
            }
          }, fastingCheckMs - now);
          timeoutsRef.current.push(id);
        }
      }

      // Suhoor reminder
      if (settings.notificationsSuhoor && times.suhoor) {
        const suhoorMs = times.suhoor.getTime();
        if (suhoorMs > now) {
          const id = setTimeout(() => {
            NotificationManager.showNotification(
              t("prayer.suhoor_soon", { defaultValue: "وقت السحور" }),
              {
                body: t("prayer.suhoor_body", {
                  defaultValue: "حان الآن موعد السحور (20 دقيقة قبل صلاة الفجر). تسحروا فإن في السحور بركة.",
                }),
                icon: "/icon-192.png",
                badge: "/favicon.png",
                tag: "suhoor-reminder",
              }
            );
          }, suhoorMs - now);
          timeoutsRef.current.push(id);
        }
      }
    },
    [t, clearAll]
  );

  useEffect(() => {
    const settings = getSettings();
    if (!settings.notifications || !settings.notificationsPrayers) return;
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
