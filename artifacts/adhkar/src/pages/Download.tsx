import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { getTranslation } from "@/lib/content-i18n";
import { TranslatedText } from "@/components/TranslatedText";
import { 
  Smartphone, Download, Share2, PlusSquare, 
  WifiOff, BellRing, Sparkles, CheckCircle2, Activity
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
            <a href="/downloads/adhkar.apk" download className="block">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 h-auto rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Download className="w-4 h-4 mr-2 ml-2" />
                <span>
                  <TranslatedText
                    text={t("download.android_btn", { lng: "ar" })}
                    staticTranslation={getTranslation(t, "download.android_btn", i18n.language) || undefined}
                    keepArabic={false}
                  />
                </span>
              </Button>
            </a>

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

    </div>
  );
}
