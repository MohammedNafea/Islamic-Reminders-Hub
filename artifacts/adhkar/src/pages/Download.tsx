import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { getTranslation } from "@/lib/content-i18n";
import { TranslatedText } from "@/components/TranslatedText";
import { 
  Smartphone, Download, Share2, PlusSquare, 
  WifiOff, BellRing, Sparkles, CheckCircle2, Activity,
  BookOpen, Compass, BookMarked, Home
} from "lucide-react";

export default function DownloadPage() {
  const { t, i18n } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if app is already running in standalone mode (installed PWA)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handlePwaInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  const features = [
    {
      icon: WifiOff,
      titleKey: "download.feature_offline",
      descKey: "download.feature_offline_desc",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: Activity,
      titleKey: "download.feature_haptic",
      descKey: "download.feature_haptic_desc",
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: BellRing,
      titleKey: "download.feature_notifications",
      descKey: "download.feature_notifications_desc",
      color: "from-rose-500 to-red-600"
    },
    {
      icon: Sparkles,
      titleKey: "download.feature_design",
      descKey: "download.feature_design_desc",
      color: "from-purple-500 to-indigo-600"
    }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12 max-w-3xl mx-auto pb-16">
      
      {/* Header Section */}
      <div className="text-center space-y-4 pt-8">
        <div className="mx-auto w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <Smartphone className="w-8 h-8" />
        </div>
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary tracking-tight">
          <TranslatedText
            text={t("download.title", { lng: "ar" })}
            staticTranslation={getTranslation(t, "download.title", i18n.language) || undefined}
            keepArabic={false}
          />
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          <TranslatedText
            text={t("download.subtitle", { lng: "ar" })}
            staticTranslation={getTranslation(t, "download.subtitle", i18n.language) || undefined}
            keepArabic={false}
          />
        </p>
      </div>

      {/* PWA Direct Installation Card */}
      <AnimatePresence>
        {(deferredPrompt || isInstalled) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-teal-500/10 via-primary/5 to-background shadow-xl rounded-[2.5rem] group p-1">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-teal-500/5 opacity-50" />
              <CardContent className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 text-center md:text-start flex-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    <TranslatedText
                      text="تطبيق الويب المباشر (PWA)"
                      staticTranslation={getTranslation(t, "download.pwa_title", i18n.language) || undefined}
                      keepArabic={false}
                    />
                  </span>
                  <h3 className="text-xl font-bold text-foreground">
                    <TranslatedText
                      text="ثبّت التطبيق مباشرة بضغطة زر"
                      staticTranslation={i18n.language === "ar" ? "ثبّت التطبيق مباشرة بضغطة زر" : "Install directly with one tap"}
                      keepArabic={false}
                    />
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                    <TranslatedText
                      text={t("download.pwa_desc", { lng: "ar" })}
                      staticTranslation={getTranslation(t, "download.pwa_desc", i18n.language) || undefined}
                      keepArabic={false}
                    />
                  </p>
                </div>

                <div className="shrink-0">
                  {isInstalled ? (
                    <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 px-5 py-3 rounded-2xl font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>
                        <TranslatedText
                          text={t("download.pwa_installed", { lng: "ar" })}
                          staticTranslation={getTranslation(t, "download.pwa_installed", i18n.language) || undefined}
                          keepArabic={false}
                        />
                      </span>
                    </div>
                  ) : (
                    <Button 
                      onClick={handlePwaInstall}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-5 h-auto text-sm font-bold shadow-lg shadow-primary/20 rounded-2xl transition-all hover:scale-105 active:scale-95"
                    >
                      <Download className="w-4 h-4 mr-2 ml-2" />
                      <span>
                        <TranslatedText
                          text={t("download.pwa_btn", { lng: "ar" })}
                          staticTranslation={getTranslation(t, "download.pwa_btn", i18n.language) || undefined}
                          keepArabic={false}
                        />
                      </span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OS Platforms Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Android Card */}
        <Card className="border border-border bg-card/60 backdrop-blur-sm shadow-md rounded-[2rem] overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <CardHeader className="p-8 pb-4">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M17.523 15.3l1.816 3.146a.5.5 0 0 1-.183.682.502.502 0 0 1-.682-.183L16.64 15.76a10.024 10.024 0 0 1-9.28 0l-1.833 3.185a.5.5 0 0 1-.683.183.5.5 0 0 1-.183-.683l1.816-3.146A9.973 9.973 0 0 1 2 7.643a.5.5 0 0 1 .5-.5h19a.5.5 0 0 1 .5.5 9.973 9.973 0 0 1-4.477 7.657zM7 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                </svg>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold font-heading text-foreground">
                  <TranslatedText
                    text={t("download.android_title", { lng: "ar" })}
                    staticTranslation={getTranslation(t, "download.android_title", i18n.language) || undefined}
                    keepArabic={false}
                  />
                </CardTitle>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  <TranslatedText
                    text={t("download.android_desc", { lng: "ar" })}
                    staticTranslation={getTranslation(t, "download.android_desc", i18n.language) || undefined}
                    keepArabic={false}
                  />
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 pt-0 space-y-6">
            <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 h-auto rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]">
              <a 
                href="https://github.com/MohammedNafea/Islamic-Reminders-Hub/releases/latest/download/adhkar.apk"
                download="adhkar.apk"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="w-4 h-4 mr-2 ml-2" />
                <span>
                  <TranslatedText
                    text={t("download.android_btn", { lng: "ar" })}
                    staticTranslation={getTranslation(t, "download.android_btn", i18n.language) || undefined}
                    keepArabic={false}
                  />
                </span>
              </a>
            </Button>

            <div className="border-t border-border/60 pt-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                <TranslatedText
                  text={t("download.android_steps", { lng: "ar" })}
                  staticTranslation={getTranslation(t, "download.android_steps", i18n.language) || undefined}
                  keepArabic={false}
                />
              </h4>
              <ul className="text-xs text-muted-foreground space-y-2.5">
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-[10px]">١</span>
                  <span className="leading-normal">
                    <TranslatedText
                      text={t("download.android_step_1", { lng: "ar" })}
                      staticTranslation={getTranslation(t, "download.android_step_1", i18n.language) || undefined}
                      keepArabic={false}
                    />
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-[10px]">٢</span>
                  <span className="leading-normal">
                    <TranslatedText
                      text={t("download.android_step_2", { lng: "ar" })}
                      staticTranslation={getTranslation(t, "download.android_step_2", i18n.language) || undefined}
                      keepArabic={false}
                    />
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-[10px]">٣</span>
                  <span className="leading-normal">
                    <TranslatedText
                      text={t("download.android_step_3", { lng: "ar" })}
                      staticTranslation={getTranslation(t, "download.android_step_3", i18n.language) || undefined}
                      keepArabic={false}
                    />
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* iOS Card */}
        <Card className="border border-border bg-card/60 backdrop-blur-sm shadow-md rounded-[2rem] overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <CardHeader className="p-8 pb-4">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-sky-500/10 text-sky-600 rounded-2xl flex items-center justify-center font-bold">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.97.08 2.06-.52 2.82-1.33z"/>
                </svg>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold font-heading text-foreground">
                  <TranslatedText
                    text={t("download.ios_title", { lng: "ar" })}
                    staticTranslation={getTranslation(t, "download.ios_title", i18n.language) || undefined}
                    keepArabic={false}
                  />
                </CardTitle>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  <TranslatedText
                    text={t("download.ios_desc", { lng: "ar" })}
                    staticTranslation={getTranslation(t, "download.ios_desc", i18n.language) || undefined}
                    keepArabic={false}
                  />
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 pt-0 space-y-6 flex-1 flex flex-col justify-end">
            <div className="border-t border-border/60 pt-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                <TranslatedText
                  text={t("download.ios_steps", { lng: "ar" })}
                  staticTranslation={getTranslation(t, "download.ios_steps", i18n.language) || undefined}
                  keepArabic={false}
                />
              </h4>
              <ul className="text-xs text-muted-foreground space-y-2.5">
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-[10px]">١</span>
                  <span className="leading-normal flex items-center gap-1">
                    <TranslatedText
                      text={t("download.ios_step_1", { lng: "ar" })}
                      staticTranslation={getTranslation(t, "download.ios_step_1", i18n.language) || undefined}
                      keepArabic={false}
                    />
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-[10px]">٢</span>
                  <span className="leading-normal flex items-center gap-1.5 flex-wrap">
                    <TranslatedText
                      text={t("download.ios_step_2", { lng: "ar" })}
                      staticTranslation={getTranslation(t, "download.ios_step_2", i18n.language) || undefined}
                      keepArabic={false}
                    />
                    <Share2 className="w-3.5 h-3.5 text-sky-600 inline" />
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-[10px]">٣</span>
                  <span className="leading-normal flex items-center gap-1.5 flex-wrap">
                    <TranslatedText
                      text={t("download.ios_step_3", { lng: "ar" })}
                      staticTranslation={getTranslation(t, "download.ios_step_3", i18n.language) || undefined}
                      keepArabic={false}
                    />
                    <PlusSquare className="w-3.5 h-3.5 text-sky-600 inline" />
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-[10px]">٤</span>
                  <span className="leading-normal">
                    <TranslatedText
                      text={t("download.ios_step_4", { lng: "ar" })}
                      staticTranslation={getTranslation(t, "download.ios_step_4", i18n.language) || undefined}
                      keepArabic={false}
                    />
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Android PWA Notification Optimization Card */}
      <Card className="border border-border bg-card/60 backdrop-blur-sm shadow-md rounded-[2rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold font-heading text-foreground">
                <TranslatedText
                  text="تفعيل وتحسين تنبيهات التطبيق 24 ساعة (بدون انقطاع)"
                  staticTranslation={i18n.language === "ar" ? "تفعيل وتحسين تنبيهات التطبيق 24 ساعة (بدون انقطاع)" : "Enable and Optimize 24-Hour Offline App Notifications"}
                  keepArabic={false}
                />
              </CardTitle>
              <p className="text-muted-foreground text-xs leading-relaxed mt-1">
                <TranslatedText
                  text="إليك الخطوات اللازمة لضمان عمل تنبيهات مواقيت الصلاة والأذكار وصيام النوافل في الخلفية وبدون اتصال بالإنترنت."
                  staticTranslation={i18n.language === "ar" ? "إليك الخطوات اللازمة لضمان عمل تنبيهات مواقيت الصلاة والأذكار وصيام النوافل في الخلفية وبدون اتصال بالإنترنت." : "Steps to ensure prayer times, adhkar, and fasting reminders work offline and in the background."}
                  keepArabic={false}
                />
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/40 p-5 rounded-2xl border border-border/50 space-y-3">
              <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <TranslatedText
                  text="1. تثبيت التطبيق كـ PWA أولاً"
                  staticTranslation={i18n.language === "ar" ? "1. تثبيت التطبيق كـ PWA أولاً" : "1. Install the App as PWA"}
                  keepArabic={false}
                />
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <TranslatedText
                  text="تأكد من تثبيت الموقع كـ PWA عبر متصفح Google Chrome أو Samsung Internet من خلال الضغط على زر التثبيت بالأعلى ليعمل كـ تطبيق مستقل."
                  staticTranslation={i18n.language === "ar" ? "تأكد من تثبيت الموقع كـ PWA عبر متصفح Google Chrome أو Samsung Internet من خلال الضغط على زر التثبيت بالأعلى ليعمل كـ تطبيق مستقل." : "Ensure the website is installed as a PWA using Chrome or Samsung Internet for standalone background services."}
                  keepArabic={false}
                />
              </p>
            </div>
            
            <div className="bg-muted/40 p-5 rounded-2xl border border-border/50 space-y-3">
              <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <TranslatedText
                  text="2. تعديل إعدادات البطارية (غير مقيد)"
                  staticTranslation={i18n.language === "ar" ? "2. تعديل إعدادات البطارية (غير مقيد)" : "2. Battery Optimization (Unrestricted)"}
                  keepArabic={false}
                />
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <TranslatedText
                  text="افتح إعدادات الهاتف > التطبيقات > اختر تطبيق 'Islamic Hub' > البطارية > اختر 'غير مقيد' (Unrestricted). هذا يسمح للنظام بإطلاق التنبيهات في وقتها حتى لو كان التطبيق مغلقاً تماماً."
                  staticTranslation={i18n.language === "ar" ? "افتح إعدادات الهاتف > التطبيقات > اختر تطبيق 'Islamic Hub' > البطارية > اختر 'غير مقيد' (Unrestricted). هذا يسمح للنظام بإطلاق التنبيهات في وقتها حتى لو كان التطبيق مغلقاً تماماً." : "Go to Settings > Apps > Islamic Hub > Battery > set to 'Unrestricted' so Android doesn't kill the background notification services."}
                  keepArabic={false}
                />
              </p>
            </div>

            <div className="bg-muted/40 p-5 rounded-2xl border border-border/50 space-y-3">
              <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <TranslatedText
                  text="3. تفعيل أذونات الإشعارات"
                  staticTranslation={i18n.language === "ar" ? "3. تفعيل أذونات الإشعارات" : "3. Notification Permissions"}
                  keepArabic={false}
                />
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <TranslatedText
                  text="تأكد من منح التطبيق إذن إرسال الإشعارات عند فتحه لأول مرة، وتفعيل خيار التنبيهات من داخل إعدادات التطبيق لضمان جدولة مواعيد الأذان والأذكار محلياً."
                  staticTranslation={i18n.language === "ar" ? "تأكد من منح التطبيق إذن إرسال الإشعارات عند فتحه لأول مرة، وتفعيل خيار التنبيهات من داخل إعدادات التطبيق لضمان جدولة مواعيد الأذان والأذكار محلياً." : "Enable notification permissions when prompted and activate notification settings inside the app to schedule reminders locally."}
                  keepArabic={false}
                />
              </p>
            </div>

            <div className="bg-muted/40 p-5 rounded-2xl border border-border/50 space-y-3">
              <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <TranslatedText
                  text="4. العمل بالكامل بدون إنترنت (Offline)"
                  staticTranslation={i18n.language === "ar" ? "4. العمل بالكامل بدون إنترنت (Offline)" : "4. Complete Offline Functionality"}
                  keepArabic={false}
                />
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <TranslatedText
                  text="يتم حساب جميع مواقيت الصلاة وأوقات الصيام وتنبيهات الأذكار محلياً على جهازك بالاعتماد على إحداثيات موقعك الجغرافي المسجلة، وبالتالي ستعمل الإشعارات بدقة كاملة على مدار 24 ساعة حتى مع انقطاع الإنترنت التام."
                  staticTranslation={i18n.language === "ar" ? "يتم حساب جميع مواقيت الصلاة وأوقات الصيام وتنبيهات الأذكار محلياً على جهازك بالاعتماد على إحداثيات موقعك الجغرافي المسجلة، وبالتالي ستعمل الإشعارات بدقة كاملة على مدار 24 ساعة حتى مع انقطاع الإنترنت التام." : "All prayer times, fasting schedules, and reminders are calculated locally on your device based on geographic coordinates. Notifications will work without internet."}
                  keepArabic={false}
                />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Features Section */}
      <div className="space-y-6 pt-6">
        <h3 className="text-xl font-bold text-foreground mb-4 px-1">
          <TranslatedText
            text={t("download.features_title", { lng: "ar" })}
            staticTranslation={getTranslation(t, "download.features_title", i18n.language) || undefined}
            keepArabic={false}
          />
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ y: -3 }}
                className="bg-card/40 backdrop-blur-sm border border-border/40 rounded-2xl p-5 flex gap-4"
              >
                <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.color} text-white flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-foreground leading-tight">
                    <TranslatedText
                      text={t(feat.titleKey, { lng: "ar" })}
                      staticTranslation={getTranslation(t, feat.titleKey, i18n.language) || undefined}
                      keepArabic={false}
                    />
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <TranslatedText
                      text={t(feat.descKey, { lng: "ar" })}
                      staticTranslation={getTranslation(t, feat.descKey, i18n.language) || undefined}
                      keepArabic={false}
                    />
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Comprehensive Manual Section */}
      <div className="space-y-8 pt-8 border-t border-border/60">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
            <BookMarked className="w-3.5 h-3.5" />
            <TranslatedText
              text="دليل الاستخدام المفصل"
              staticTranslation={i18n.language === "ar" ? "دليل الاستخدام المفصل" : "Comprehensive User Manual"}
              keepArabic={false}
            />
          </div>
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            <TranslatedText
              text="كيفية استخدام موقع وتطبيق مركز الأذكار"
              staticTranslation={i18n.language === "ar" ? "كيفية استخدام موقع وتطبيق مركز الأذكار" : "How to Use the Islamic Reminders Hub App & Site"}
              keepArabic={false}
            />
          </h3>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto leading-relaxed">
            <TranslatedText
              text="شرح تفصيلي لكافة مميزات التطبيق والأقسام المختلفة لمساعدتك في تحقيق أقصى استفادة روحية."
              staticTranslation={i18n.language === "ar" ? "شرح تفصيلي لكافة مميزات التطبيق والأقسام المختلفة لمساعدتك في تحقيق أقصى استفادة روحية." : "Detailed explanation of all app features and sections to help you maximize your spiritual routine."}
              keepArabic={false}
            />
          </p>
        </div>

        {/* Manual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Home Page */}
          <Card className="border border-border/60 bg-card/40 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary font-heading">
                <Home className="w-5 h-5 text-emerald-600" />
                <TranslatedText text="الصفحة الرئيسية" keepArabic={false} />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                <TranslatedText
                  text="تعد الصفحة الرئيسية لوحة التحكم الروحية الخاصة بك، حيث تعرض:"
                  keepArabic={false}
                />
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><TranslatedText text="مواقيت الصلاة الحالية والقادمة ونسبة التقدم في صلواتك اليومية." keepArabic={false} /></li>
                <li><TranslatedText text="حديث الساعة وآية الساعة المتجددة تلقائياً كل ساعة لتدبر كلام الله وسنة نبيه." keepArabic={false} /></li>
                <li><TranslatedText text="الصلوات على النبي صلى الله عليه وسلم، حيث يمكنك الصلاة عليه وتسجيل أعداد صلواتك اليومية." keepArabic={false} /></li>
              </ul>
            </CardContent>
          </Card>

          {/* Card 2: Adhkar Hub */}
          <Card className="border border-border/60 bg-card/40 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary font-heading">
                <BookOpen className="w-5 h-5 text-teal-600" />
                <TranslatedText text="مركز الأذكار والأدعية" keepArabic={false} />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                <TranslatedText
                  text="يضم هذا القسم أذكار حصن المسلم والأدعية القرآنية والنبوية مرتبة وموثقة:"
                  keepArabic={false}
                />
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><TranslatedText text="أذكار الصباح والمساء، أذكار النوم، الصلوات، أذكار المسجد والمنزل، وأدعية الكرب." keepArabic={false} /></li>
                <li><TranslatedText text="تشغيل تلاوات صوتية بشرية واضحة ونقية لكل ذكر لمساعدتك على الحفظ والتدبر." keepArabic={false} /></li>
                <li><TranslatedText text="ترجمة فورية للأذكار والأدعية إلى 70 لغة مع إمكانية إضافة أي ذكر للمفضلة." keepArabic={false} /></li>
              </ul>
            </CardContent>
          </Card>

          {/* Card 3: Holy Quran */}
          <Card className="border border-border/60 bg-card/40 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary font-heading">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <TranslatedText text="المصحف الشريف" keepArabic={false} />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                <TranslatedText
                  text="مصحف كامل بالرسم العثماني للقراءة والاستماع التفاعلي:"
                  keepArabic={false}
                />
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><TranslatedText text="القراءة وتكبير الخط وتغيير التفسير (الجلالين، الميسر، السعدي، ابن كثير)." keepArabic={false} /></li>
                <li><TranslatedText text="الاستماع بصوت أكثر من 10 قراء مشاهير مع إمكانية تكرار الآية لتحفيظ القرآن." keepArabic={false} /></li>
                <li><TranslatedText text="البحث الذكي بالمعنى أو البحث الحرفي في الآيات وتراجم المعاني لـ 70 لغة." keepArabic={false} /></li>
              </ul>
            </CardContent>
          </Card>

          {/* Card 4: Compass & Prayer Times */}
          <Card className="border border-border/60 bg-card/40 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary font-heading">
                <Compass className="w-5 h-5 text-sky-600" />
                <TranslatedText text="مواقيت الصلاة والقبلة" keepArabic={false} />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                <TranslatedText
                  text="حساب المواقيت الدقيقة وتحديد اتجاه الكعبة من أي مكان في العالم:"
                  keepArabic={false}
                />
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><TranslatedText text="حساب أوقات الصلاة والثلث الأخير من الليل والسحر محلياً بالكامل وبدون إنترنت." keepArabic={false} /></li>
                <li><TranslatedText text="بوصلة تفاعلية ثلاثية الأبعاد (3D) مدعومة بكاميرا الواقع المعزز (AR) لرؤية القبلة في محيطك." keepArabic={false} /></li>
                <li><TranslatedText text="دعم طرق الحساب المختلفة مثل أم القرى، رابطة العالم الإسلامي، وغيرها." keepArabic={false} /></li>
              </ul>
            </CardContent>
          </Card>

          {/* Card 5: Electronic Tasbih */}
          <Card className="border border-border/60 bg-card/40 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary font-heading">
                <Activity className="w-5 h-5 text-rose-600" />
                <TranslatedText text="المسبحة الإلكترونية" keepArabic={false} />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                <TranslatedText
                  text="أداة تفاعلية متطورة للتسبيح والاستغفار:"
                  keepArabic={false}
                />
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><TranslatedText text="النقر في أي مكان على الشاشة لزيادة العداد لتسهيل الاستخدام أثناء الحركة." keepArabic={false} /></li>
                <li><TranslatedText text="تغيير الذكر الحالي، وإمكانية إضافة أذكار مخصصة وتحديد هدف التكرار (33، 99، 100)." keepArabic={false} /></li>
                <li><TranslatedText text="حفظ إحصائيات يومية وتراكمية لكل ذكر مع دعم الاهتزاز والتنبيه عند اكتمال الهدف." keepArabic={false} /></li>
              </ul>
            </CardContent>
          </Card>

          {/* Card 6: Worship Tracker */}
          <Card className="border border-border/60 bg-card/40 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary font-heading">
                <Activity className="w-5 h-5 text-indigo-600" />
                <TranslatedText text="مسار الالتزام والعبادات" keepArabic={false} />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                <TranslatedText
                  text="لوحة متابعة سرية وخاصة جداً لتقييم وردك اليومي:"
                  keepArabic={false}
                />
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><TranslatedText text="تسجيل أداء الصلوات الخمس في وقتها، جماعة، والسنن الرواتب، وقيام الليل." keepArabic={false} /></li>
                <li><TranslatedText text="تتبع ورد القرآن اليومي، وأذكار الصباح والمساء، وصوم النوافل." keepArabic={false} /></li>
                <li><TranslatedText text="إحصائيات أسبوعية ورسومات بيانية لمدى التزامك لبناء عادات روحية راسخة." keepArabic={false} /></li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
