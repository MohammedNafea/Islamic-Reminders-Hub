import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getSettings, saveSettings } from "@/lib/store";
import { supportedLanguages } from "@/i18n";
import { useTheme } from "@/components/ThemeProvider";
type Theme = "dark" | "light" | "system" | "fajr" | "duha" | "maghrib" | "sahar" | "dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { NotificationManager } from "@/lib/notifications";
import { motion, AnimatePresence } from "framer-motion";
import { TranslatedText } from "@/components/TranslatedText";
import { getTranslation } from "@/lib/content-i18n";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [settings, setLocalSettings] = useState(getSettings());
  const [testingSound, setTestingSound] = useState(false);
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    testAudioRef.current = testAudio;
  }, [testAudio]);

  useEffect(() => {
    const handleStopAllAudio = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.sender !== "settings") {
        if (testAudioRef.current) {
          testAudioRef.current.pause();
        }
        setTestingSound(false);
        setTestAudio(null);
      }
    };

    window.addEventListener("stop-all-audio", handleStopAllAudio);
    return () => {
      window.removeEventListener("stop-all-audio", handleStopAllAudio);
      if (testAudioRef.current) {
        testAudioRef.current.pause();
      }
    };
  }, []);

  const playTestSound = () => {
    if (testingSound && testAudio) {
      testAudio.pause();
      setTestingSound(false);
      setTestAudio(null);
      return;
    }

    // Dispatch global stop-all-audio event
    window.dispatchEvent(new CustomEvent("stop-all-audio", { detail: { sender: "settings" } }));

    const soundUrl =
      settings.notificationsAthan === "makkah" ? "https://www.islamcan.com/audio/athan/azan2.mp3" :
      settings.notificationsAthan === "madinah" ? "https://www.islamcan.com/audio/athan/azan3.mp3" :
      settings.notificationsAthan === "daghiri" ? "https://www.islamcan.com/audio/athan/azan12.mp3" :
      settings.notificationsAthan === "azan1" ? "https://www.islamcan.com/audio/athan/azan6.mp3" :
      "https://www.islamcan.com/audio/athan/azan4.mp3";

    const audio = new Audio(soundUrl);
    setTestAudio(audio);
    setTestingSound(true);

    if (settings.notificationsAthanType === "takbeer") {
      const checkTakbeer = () => {
        if (audio.currentTime >= 8) {
          audio.pause();
          audio.removeEventListener("timeupdate", checkTakbeer);
          setTestingSound(false);
          setTestAudio(null);
        }
      };
      audio.addEventListener("timeupdate", checkTakbeer);
    }

    audio.play()
      .then(() => {
        audio.onended = () => {
          setTestingSound(false);
          setTestAudio(null);
        };
      })
      .catch((err) => {
        console.error("Test sound play failed:", err);
        setTestingSound(false);
        setTestAudio(null);
      });
  };

  useEffect(() => {
    setLocalSettings(getSettings());
  }, []);

  const updateSetting = async (key: keyof typeof settings, value: typeof settings[typeof key]) => {
    let finalValue: typeof settings[typeof key] = value;
    if (key === "notifications" && value === true) {
      const granted = await NotificationManager.requestPermission();
      if (!granted) {
        finalValue = false as typeof settings[typeof key];
      }
    }

    const newSettings = { ...settings, [key]: finalValue };
    setLocalSettings(newSettings);
    saveSettings(newSettings);

    if (newSettings.notifications && (key === "notifications" || key === "notificationsPrayers" || key === "notificationsAdhkar" || key === "notificationsNight")) {
      NotificationManager.scheduleReminders();
    } else if (!newSettings.notifications && key === "notifications") {
      NotificationManager.cancelAll();
    }

    if (key === "language") {
      i18n.changeLanguage(finalValue as string);
    }
  };



  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-heading font-bold text-primary pt-4">
        <TranslatedText
          text="الإعدادات"
          staticTranslation={getTranslation(t, "settings.title", i18n.language) || undefined}
          keepArabic={false}
          inline
        />
      </h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <TranslatedText
              text="اللغة"
              staticTranslation={getTranslation(t, "settings.language", i18n.language) || undefined}
              keepArabic={false}
              inline
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={settings.language} 
            onValueChange={(val) => updateSetting("language", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={getTranslation(t, "settings.language", i18n.language) || "اللغة"} />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                    <span className="text-muted-foreground ml-2">({lang.name})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <TranslatedText
              text="المظهر"
              staticTranslation={getTranslation(t, "settings.theme", i18n.language) || undefined}
              keepArabic={false}
              inline
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={theme} 
            onValueChange={(val) => setTheme(val as Theme)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={getTranslation(t, "settings.theme", i18n.language) || "المظهر"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <TranslatedText
                  text="فاتح"
                  staticTranslation={getTranslation(t, "settings.light", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </SelectItem>
              <SelectItem value="dark">
                <TranslatedText
                  text="داكن"
                  staticTranslation={getTranslation(t, "settings.dark", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </SelectItem>
              <SelectItem value="system">
                <TranslatedText
                  text="حسب النظام"
                  staticTranslation={getTranslation(t, "settings.system", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </SelectItem>
              <SelectItem value="dynamic">
                <TranslatedText
                  text="ديناميكي (تلقائي)"
                  staticTranslation={getTranslation(t, "settings.dynamic", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </SelectItem>
              <SelectItem value="fajr">
                <TranslatedText
                  text="سكينة الفجر"
                  staticTranslation={getTranslation(t, "settings.theme_fajr", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </SelectItem>
              <SelectItem value="duha">
                <TranslatedText
                  text="إشراق الضحى"
                  staticTranslation={getTranslation(t, "settings.theme_duha", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </SelectItem>
              <SelectItem value="maghrib">
                <TranslatedText
                  text="هدوء المغرب"
                  staticTranslation={getTranslation(t, "settings.theme_maghrib", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </SelectItem>
              <SelectItem value="sahar">
                <TranslatedText
                  text="روحانية السحر"
                  staticTranslation={getTranslation(t, "settings.theme_sahar", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <TranslatedText
              text="طريقة حساب المواقيت"
              staticTranslation={getTranslation(t, "settings.calculation", i18n.language) || undefined}
              keepArabic={false}
              inline
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={settings.calculationMethod} 
            onValueChange={(val) => updateSetting("calculationMethod", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={getTranslation(t, "settings.calculation", i18n.language) || "طريقة حساب المواقيت"} />
            </SelectTrigger>
            <SelectContent>
              {["MuslimWorldLeague", "Egyptian", "Karachi", "UmmAlQura", "Dubai", "NorthAmerica", "Kuwait", "Qatar", "Singapore", "Turkey"].map(method => (
                <SelectItem key={method} value={method}>
                  <TranslatedText
                    text={getTranslation(t, `prayer.methods.${method}`, "ar") || method}
                    staticTranslation={getTranslation(t, `prayer.methods.${method}`, i18n.language) || undefined}
                    keepArabic={false}
                    inline
                  />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <TranslatedText
              text="حجم الخط"
              staticTranslation={getTranslation(t, "settings.font_size", i18n.language) || undefined}
              keepArabic={false}
              inline
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={settings.fontSize} 
            onValueChange={(val) => updateSetting("fontSize", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={getTranslation(t, "settings.font_size", i18n.language) || "حجم الخط"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">
                <TranslatedText
                  text="صغير"
                  staticTranslation={getTranslation(t, "settings.font_sm", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </SelectItem>
              <SelectItem value="md">
                <TranslatedText
                  text="متوسط"
                  staticTranslation={getTranslation(t, "settings.font_md", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </SelectItem>
              <SelectItem value="lg">
                <TranslatedText
                  text="كبير"
                  staticTranslation={getTranslation(t, "settings.font_lg", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </SelectItem>
              <SelectItem value="xl">
                <TranslatedText
                  text="كبير جداً"
                  staticTranslation={getTranslation(t, "settings.font_xl", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>



      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="text-base font-medium">
              <TranslatedText
                text="تنبيهات الصلوات"
                staticTranslation={getTranslation(t, "settings.notifications", i18n.language) || undefined}
                keepArabic={false}
                inline
              />
            </Label>
            <Switch 
              id="notifications" 
              checked={settings.notifications}
              onCheckedChange={(val) => updateSetting("notifications", val)}
            />
          </div>

          <AnimatePresence>
            {settings.notifications && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden space-y-3 px-4 border-e-2 border-primary/20 me-2"
              >
                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="notificationsPrayers" className="text-sm font-normal text-muted-foreground">
                    <TranslatedText
                      text="تنبيهات مواقيت الصلاة"
                      staticTranslation={getTranslation(t, "settings.notifications_prayers", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </Label>
                  <Switch 
                    id="notificationsPrayers" 
                    checked={settings.notificationsPrayers}
                    onCheckedChange={(val) => updateSetting("notificationsPrayers", val)}
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="notificationsAdhkar" className="text-sm font-normal text-muted-foreground">
                    <TranslatedText
                      text="تنبيهات أذكار الصباح والمساء"
                      staticTranslation={getTranslation(t, "settings.notifications_adhkar_sub", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </Label>
                  <Switch 
                    id="notificationsAdhkar" 
                    checked={settings.notificationsAdhkar}
                    onCheckedChange={(val) => updateSetting("notificationsAdhkar", val)}
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="notificationsNight" className="text-sm font-normal text-muted-foreground">
                    <TranslatedText
                      text="تنبيهات الليل والاستغفار بالأسحار"
                      staticTranslation={getTranslation(t, "settings.notifications_night", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </Label>
                  <Switch 
                    id="notificationsNight" 
                    checked={settings.notificationsNight}
                    onCheckedChange={(val) => updateSetting("notificationsNight", val)}
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5 text-right">
                    <Label htmlFor="notificationsFasting" className="text-sm font-normal text-muted-foreground">
                      <TranslatedText
                        text="تنبيه صيام النوافل"
                        staticTranslation={getTranslation(t, "settings.notifications_fasting", i18n.language) || undefined}
                        keepArabic={false}
                        inline
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground/70 leading-relaxed block">
                      <TranslatedText
                        text="تنبيه بعد صلاة المغرب إذا كان غداً يوم صيام مسنون"
                        staticTranslation={getTranslation(t, "settings.notifications_fasting_desc", i18n.language) || undefined}
                        keepArabic={false}
                        inline
                      />
                    </p>
                  </div>
                  <Switch 
                    id="notificationsFasting" 
                    checked={settings.notificationsFasting}
                    onCheckedChange={(val) => updateSetting("notificationsFasting", val)}
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5 text-right">
                    <Label htmlFor="notificationsSuhoor" className="text-sm font-normal text-muted-foreground">
                      <TranslatedText
                        text="تنبيه السحور"
                        staticTranslation={getTranslation(t, "settings.notifications_suhoor", i18n.language) || undefined}
                        keepArabic={false}
                        inline
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground/70 leading-relaxed block">
                      <TranslatedText
                        text="تنبيه قبل صلاة الفجر بـ 20 دقيقة لتناول السحور"
                        staticTranslation={getTranslation(t, "settings.notifications_suhoor_desc", i18n.language) || undefined}
                        keepArabic={false}
                        inline
                      />
                    </p>
                  </div>
                  <Switch 
                    id="notificationsSuhoor" 
                    checked={settings.notificationsSuhoor}
                    onCheckedChange={(val) => updateSetting("notificationsSuhoor", val)}
                  />
                </div>

                <div className="h-px bg-border/40 my-2" />

                <div className="space-y-2 py-1">
                  <Label htmlFor="notificationsEarlyMinutes" className="text-sm font-medium text-muted-foreground">
                    <TranslatedText
                      text="التنبيه المبكر قبل الأذان"
                      staticTranslation={getTranslation(t, "settings.notifications_early", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </Label>
                  <Select
                    value={String(settings.notificationsEarlyMinutes)}
                    onValueChange={(val) => updateSetting("notificationsEarlyMinutes", Number(val))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={getTranslation(t, "settings.notifications_early", i18n.language) || "التنبيه المبكر"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">
                        <TranslatedText
                          text="تعطيل التنبيه المبكر"
                          staticTranslation={getTranslation(t, "settings.notifications_early_off", i18n.language) || undefined}
                          keepArabic={false}
                          inline
                        />
                      </SelectItem>
                      {[5, 10, 15, 20, 25, 30].map(mins => (
                        <SelectItem key={mins} value={String(mins)}>
                          <TranslatedText
                            text={`${mins} دقائق`}
                            staticTranslation={t("settings.notifications_early_mins", { defaultValue: "{{count}} دقائق", count: mins }).replace("{{count}}", String(mins))}
                            keepArabic={false}
                            inline
                          />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">
                    <TranslatedText
                      text="اختر المدة الزمنية للتنبيه قبل دخول وقت الصلاة"
                      staticTranslation={getTranslation(t, "settings.notifications_early_desc", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </p>
                </div>

                <div className="h-px bg-border/40 my-2" />
                
                <div className="space-y-2 py-1">
                  <Label htmlFor="notificationsAthan" className="text-sm font-medium text-muted-foreground">
                    <TranslatedText
                      text="صوت الأذان عند التنبيه"
                      staticTranslation={getTranslation(t, "settings.notifications_athan", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Select
                      value={settings.notificationsAthan}
                      onValueChange={(val) => updateSetting("notificationsAthan", val as any)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={getTranslation(t, "settings.notifications_athan", i18n.language) || "صوت الأذان"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">
                          <TranslatedText
                            text="بدون صوت (تنبيه فقط)"
                            staticTranslation={getTranslation(t, "settings.athan_none", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </SelectItem>
                        <SelectItem value="makkah">
                          <TranslatedText
                            text="أذان الحرم المكي الشريف"
                            staticTranslation={getTranslation(t, "settings.muezzin_makkah", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </SelectItem>
                        <SelectItem value="madinah">
                          <TranslatedText
                            text="أذان الحرم المدني الشريف"
                            staticTranslation={getTranslation(t, "settings.muezzin_madinah", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </SelectItem>
                        <SelectItem value="daghiri">
                          <TranslatedText
                            text="أذان الشيخ حمد الدغريري"
                            staticTranslation={getTranslation(t, "settings.muezzin_daghiri", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </SelectItem>
                        <SelectItem value="azan1">
                          <TranslatedText
                            text="أذان 1 (عبد الباسط)"
                            staticTranslation={getTranslation(t, "settings.athan_azan1", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </SelectItem>
                        <SelectItem value="azan2">
                          <TranslatedText
                            text="أذان 2 (مكة المكرمة)"
                            staticTranslation={getTranslation(t, "settings.athan_azan2", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {settings.notificationsAthan !== "off" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={playTestSound}
                        className="whitespace-nowrap rounded-md text-xs font-semibold px-3 h-10 border-border/60 hover:bg-muted"
                      >
                        {testingSound ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            <TranslatedText text="إيقاف" staticTranslation={i18n.language === "ar" ? "إيقاف" : "Stop"} keepArabic={false} inline />
                          </span>
                        ) : (
                          <TranslatedText
                            text="تجربة الصوت"
                            staticTranslation={getTranslation(t, "settings.test_sound", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">
                    <TranslatedText
                      text="اختر صوت الأذان أو قم بتعطيله"
                      staticTranslation={getTranslation(t, "settings.notifications_athan_desc", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </p>
                </div>

                {settings.notificationsAthan !== "off" && (
                  <div className="space-y-2 py-1">
                    <Label htmlFor="notificationsAthanType" className="text-sm font-medium text-muted-foreground">
                      <TranslatedText
                        text="نوع التنبيه الصوتي"
                        staticTranslation={getTranslation(t, "settings.notifications_athan_type", i18n.language) || undefined}
                        keepArabic={false}
                        inline
                      />
                    </Label>
                    <Select
                      value={settings.notificationsAthanType}
                      onValueChange={(val) => updateSetting("notificationsAthanType", val as "full" | "takbeer")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={getTranslation(t, "settings.notifications_athan_type", i18n.language) || "نوع الأذان"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">
                          <TranslatedText
                            text="الأذان كاملاً"
                            staticTranslation={getTranslation(t, "settings.notifications_athan_type_full", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </SelectItem>
                        <SelectItem value="takbeer">
                          <TranslatedText
                            text="تكبير فقط"
                            staticTranslation={getTranslation(t, "settings.notifications_athan_type_takbeer", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">
                      <TranslatedText
                        text="تشغيل الأذان كاملاً أو التكبير فقط عند دخول الوقت"
                        staticTranslation={getTranslation(t, "settings.notifications_athan_type_desc", i18n.language) || undefined}
                        keepArabic={false}
                        inline
                      />
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-px bg-border my-2" />
          <div className="flex items-center justify-between">
            <Label htmlFor="vibrate" className="text-base font-medium">
              <TranslatedText
                text="الاهتزاز عند اللمس"
                staticTranslation={getTranslation(t, "tasbih.vibrate", i18n.language) || undefined}
                keepArabic={false}
                inline
              />
            </Label>
            <Switch 
              id="vibrate" 
              checked={settings.vibrate}
              onCheckedChange={(val) => updateSetting("vibrate", val)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/20 bg-amber-500/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <svg className="w-24 h-24 rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
        </div>
        <CardHeader>
          <TranslatedText
            text="عن مركز الأذكار"
            staticTranslation={getTranslation(t, "settings.about_us_title", i18n.language) || undefined}
            keepArabic={false}
            arabicClassName="text-amber-600 dark:text-amber-400 font-heading text-lg font-bold text-right"
            translationClassName="text-amber-700 dark:text-amber-300 font-heading text-sm font-bold border-t-0 pt-0 mt-1"
          />
        </CardHeader>
        <CardContent>
          <TranslatedText
            text="منصة متكاملة للأذكار اليومية والقرآن ومواقيت الصلاة، صُممت لتكون صدقة جارية تخدم المسلم في يومه وليله."
            staticTranslation={getTranslation(t, "settings.about_us_content", i18n.language) || undefined}
            keepArabic={false}
            arabicClassName="text-sm leading-relaxed text-muted-foreground italic text-right block"
            translationClassName="text-xs leading-relaxed text-muted-foreground/80 italic block border-t border-amber-500/10 pt-2 mt-2"
          />
        </CardContent>
      </Card>
    </div>
  );
}
