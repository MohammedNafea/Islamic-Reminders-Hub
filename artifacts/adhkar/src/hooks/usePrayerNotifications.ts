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

        // Pre-Fajr Fasting Reminder (based on hours before Fajr settings)
        const hoursBeforeFajr = settings.notificationsFastingHoursBeforeFajr ?? 0;
        if (hoursBeforeFajr > 0) {
          // Check today's fasting early reminder (if today is a fasting day and we are before its early reminder time)
          const todayHijri = toHijri(new Date());
          const todayFastingType = isFastingDay(todayHijri, new Date());
          if (todayFastingType) {
            const todayEarlyMs = times.fajr.getTime() - hoursBeforeFajr * 60 * 60 * 1000;
            if (todayEarlyMs > now) {
              const id = setTimeout(() => {
                const title = t("fasting.early_reminder_title", { defaultValue: "اقترب موعد السحور والصيام" });
                const fastingName = t(`fasting.${todayFastingType}`, { defaultValue: todayFastingType });
                const body = t("fasting.early_reminder_body", {
                  defaultValue: `تذكير: تقترب بداية صيام يوم ({{name}}). يتبقى {{hours}} ساعات على أذان الفجر.`,
                  name: fastingName,
                  hours: String(hoursBeforeFajr),
                }).replace("{{name}}", fastingName).replace("{{hours}}", String(hoursBeforeFajr));

                NotificationManager.showNotification(title, {
                  body,
                  icon: "/icon-192.png",
                  badge: "/favicon.png",
                  tag: "fasting-early-today",
                });
              }, todayEarlyMs - now);
              timeoutsRef.current.push(id);
            }
          }

          // Check tomorrow's fasting early reminder
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowHijri = toHijri(tomorrow);
          const tomorrowFastingType = isFastingDay(tomorrowHijri, tomorrow);
          if (tomorrowFastingType) {
            const tomorrowFajrMs = times.fajr.getTime() + 24 * 60 * 60 * 1000;
            const tomorrowEarlyMs = tomorrowFajrMs - hoursBeforeFajr * 60 * 60 * 1000;
            if (tomorrowEarlyMs > now) {
              const id = setTimeout(() => {
                const title = t("fasting.early_reminder_title", { defaultValue: "اقترب موعد السحور والصيام" });
                const fastingName = t(`fasting.${tomorrowFastingType}`, { defaultValue: tomorrowFastingType });
                const body = t("fasting.early_reminder_body", {
                  defaultValue: `تذكير: تقترب بداية صيام يوم ({{name}}). يتبقى {{hours}} ساعات على أذان الفجر.`,
                  name: fastingName,
                  hours: String(hoursBeforeFajr),
                }).replace("{{name}}", fastingName).replace("{{hours}}", String(hoursBeforeFajr));

                NotificationManager.showNotification(title, {
                  body,
                  icon: "/icon-192.png",
                  badge: "/favicon.png",
                  tag: "fasting-early-tomorrow",
                });
              }, tomorrowEarlyMs - now);
              timeoutsRef.current.push(id);
            }
          }
        }
      }

      // Suhoor reminder (today)
      if (settings.notificationsSuhoor) {
        const suhoorOffsetMins = settings.notificationsSuhoorMinutesBeforeFajr ?? 20;
        const suhoorMs = times.fajr.getTime() - suhoorOffsetMins * 60 * 1000;
        if (suhoorMs > now) {
          const id = setTimeout(() => {
            const bodyText = t("prayer.suhoor_body", {
              defaultValue: `حان الآن موعد السحور ({{minutes}} دقيقة قبل صلاة الفجر). تسحروا فإن في السحور بركة.`,
              minutes: suhoorOffsetMins,
            }).replace("{{minutes}}", String(suhoorOffsetMins));

            NotificationManager.showNotification(
              t("prayer.suhoor_soon", { defaultValue: "وقت السحور" }),
              {
                body: bodyText,
                icon: "/icon-192.png",
                badge: "/favicon.png",
                tag: "suhoor-reminder-today",
              }
            );
          }, suhoorMs - now);
          timeoutsRef.current.push(id);
        }

        // Suhoor reminder (tomorrow)
        const tomorrowSuhoorMs = times.fajr.getTime() + 24 * 60 * 60 * 1000 - suhoorOffsetMins * 60 * 1000;
        if (tomorrowSuhoorMs > now) {
          const id = setTimeout(() => {
            const bodyText = t("prayer.suhoor_body", {
              defaultValue: `حان الآن موعد السحور ({{minutes}} دقيقة قبل صلاة الفجر). تسحروا فإن في السحور بركة.`,
              minutes: suhoorOffsetMins,
            }).replace("{{minutes}}", String(suhoorOffsetMins));

            NotificationManager.showNotification(
              t("prayer.suhoor_soon", { defaultValue: "وقت السحور" }),
              {
                body: bodyText,
                icon: "/icon-192.png",
                badge: "/favicon.png",
                tag: "suhoor-reminder-tomorrow",
              }
            );
          }, tomorrowSuhoorMs - now);
          timeoutsRef.current.push(id);
        }
      }

      // Sunan Rawatib reminders
      if (settings.notificationsSunanRawatib) {
        // 1. Fajr Sunnah (2 Rakahs before Fajr) - scheduled at Fajr time - 15 mins
        const fajrSunnahMs = times.fajr.getTime() - 15 * 60 * 1000;
        if (fajrSunnahMs > now) {
          const id = setTimeout(() => {
            NotificationManager.showNotification(
              t("prayer.sunan_fajr_title", { defaultValue: "سنة الفجر القبلية" }),
              {
                body: t("prayer.sunan_fajr_body", { defaultValue: "ركعتا الفجر خير من الدنيا وما فيها. حافظ عليها قبل الصلاة." }),
                icon: "/icon-192.png",
                badge: "/favicon.png",
                tag: "sunan-rawatib-fajr",
              }
            );
          }, fajrSunnahMs - now);
          timeoutsRef.current.push(id);
        }

        // 2. Dhuhr Sunnah Qabliyah (4 Rakahs before Dhuhr) - scheduled at Dhuhr time - 10 mins
        const dhuhrQabliyahMs = times.dhuhr.getTime() - 10 * 60 * 1000;
        if (dhuhrQabliyahMs > now) {
          const id = setTimeout(() => {
            NotificationManager.showNotification(
              t("prayer.sunan_dhuhr_qab_title", { defaultValue: "سنة الظهر القبلية" }),
              {
                body: t("prayer.sunan_dhuhr_qab_body", { defaultValue: "أربع ركعات قبل صلاة الظهر تسلّم من كل ركعتين." }),
                icon: "/icon-192.png",
                badge: "/favicon.png",
                tag: "sunan-rawatib-dhuhr-qab",
              }
            );
          }, dhuhrQabliyahMs - now);
          timeoutsRef.current.push(id);
        }

        // 3. Dhuhr Sunnah Ba'diyah (2 Rakahs after Dhuhr) - scheduled at Dhuhr time + 20 mins
        const dhuhrBadiyahMs = times.dhuhr.getTime() + 20 * 60 * 1000;
        if (dhuhrBadiyahMs > now) {
          const id = setTimeout(() => {
            NotificationManager.showNotification(
              t("prayer.sunan_dhuhr_bad_title", { defaultValue: "سنة الظهر البعدية" }),
              {
                body: t("prayer.sunan_dhuhr_bad_body", { defaultValue: "ركعتان بعد صلاة الظهر من السنن الرواتب المؤكدة." }),
                icon: "/icon-192.png",
                badge: "/favicon.png",
                tag: "sunan-rawatib-dhuhr-bad",
              }
            );
          }, dhuhrBadiyahMs - now);
          timeoutsRef.current.push(id);
        }

        // 4. Maghrib Sunnah Ba'diyah (2 Rakahs after Maghrib) - scheduled at Maghrib time + 10 mins
        const maghribBadiyahMs = times.maghrib.getTime() + 10 * 60 * 1000;
        if (maghribBadiyahMs > now) {
          const id = setTimeout(() => {
            NotificationManager.showNotification(
              t("prayer.sunan_maghrib_title", { defaultValue: "سنة المغرب البعدية" }),
              {
                body: t("prayer.sunan_maghrib_body", { defaultValue: "ركعتان بعد صلاة المغرب من السنن الرواتب المؤكدة." }),
                icon: "/icon-192.png",
                badge: "/favicon.png",
                tag: "sunan-rawatib-maghrib",
              }
            );
          }, maghribBadiyahMs - now);
          timeoutsRef.current.push(id);
        }

        // 5. Isha Sunnah Ba'diyah (2 Rakahs after Isha) - scheduled at Isha time + 15 mins
        const ishaBadiyahMs = times.isha.getTime() + 15 * 60 * 1000;
        if (ishaBadiyahMs > now) {
          const id = setTimeout(() => {
            NotificationManager.showNotification(
              t("prayer.sunan_isha_title", { defaultValue: "سنة العشاء البعدية" }),
              {
                body: t("prayer.sunan_isha_body", { defaultValue: "ركعتان بعد صلاة العشاء من السنن الرواتب المؤكدة." }),
                icon: "/icon-192.png",
                badge: "/favicon.png",
                tag: "sunan-rawatib-isha",
              }
            );
          }, ishaBadiyahMs - now);
          timeoutsRef.current.push(id);
        }
      }

      // Hijamah reminder (20 minutes after Maghrib)
      if (settings.notificationsHijama) {
        const maghribMs = times.maghrib.getTime();
        const hijamaCheckMs = maghribMs + 20 * 60 * 1000;
        if (hijamaCheckMs > now) {
          const id = setTimeout(() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowHijri = toHijri(tomorrow);
            
            // Check if tomorrow's Hijri day is 17, 19, or 21
            if (tomorrowHijri.day === 17 || tomorrowHijri.day === 19 || tomorrowHijri.day === 21) {
              const dayStr = String(tomorrowHijri.day);
              const title = t("hijama.reminder_title", { defaultValue: "تذكير بأيام الحجامة" });
              const body = t("hijama.reminder_body", {
                defaultValue: `غداً هو يوم {{day}} من الشهر الهجري، وهو من الأيام المستحبة للحجامة النبوية.`,
                day: dayStr
              }).replace("{{day}}", dayStr);

              NotificationManager.showNotification(title, {
                body,
                icon: "/icon-192.png",
                badge: "/favicon.png",
                tag: "hijama-tomorrow",
              });
            }
          }, hijamaCheckMs - now);
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
