import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Download, ShieldCheck, Zap, CloudLightning, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export default function PWAInstallPrompt() {
  const { t, i18n } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as Navigator & { standalone?: boolean }).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    // Check if dismissed in last 7 days
    const dismissedTime = localStorage.getItem("pwa_install_dismissed_time");
    if (dismissedTime) {
      const parsedTime = parseInt(dismissedTime, 10);
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (now - parsedTime < sevenDays) {
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the install banner after a small delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We no longer need the prompt. Clear it.
    setDeferredPrompt(null);
    setIsVisible(false);
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
      localStorage.setItem("pwa_install_dismissed_time", String(Date.now()));
    }
  };

  const handleCloseClick = () => {
    setIsVisible(false);
    // Dismiss for 7 days
    localStorage.setItem("pwa_install_dismissed_time", String(Date.now()));
  };

  if (!isVisible) return null;

  const isAr = i18n.language === "ar";

  return (
    <div className={cn(
      "fixed bottom-20 md:bottom-6 z-50 p-4 w-full max-w-md animate-in slide-in-from-bottom duration-500",
      isAr ? "left-4 md:left-6" : "right-4 md:right-6"
    )}>
      <Card className="border-none shadow-2xl bg-card/95 backdrop-blur-md border border-primary/10 rounded-[2rem] overflow-hidden relative">
        {/* Decorative background gradients */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-secondary/15 rounded-full blur-xl pointer-events-none" />
        
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Download className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {t("pwa.title", { defaultValue: "تثبيت التطبيق على جهازك" })}
                </h3>
                <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-relaxed">
                  {t("pwa.subtitle", { defaultValue: "تصفح الأذكار والمصحف الشريف بتجربة تطبيق ممتازة وسريعة" })}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full text-muted-foreground hover:bg-muted"
              onClick={handleCloseClick}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="bg-primary/5 p-2.5 rounded-xl flex items-center gap-2 border border-primary/5">
              <CloudLightning className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[10px] font-bold text-primary">
                {t("pwa.benefit_offline", { defaultValue: "يعمل بدون إنترنت" })}
              </span>
            </div>
            <div className="bg-primary/5 p-2.5 rounded-xl flex items-center gap-2 border border-primary/5">
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[10px] font-bold text-primary">
                {t("pwa.benefit_fast", { defaultValue: "سرعة استجابة عالية" })}
              </span>
            </div>
            <div className="bg-primary/5 p-2.5 rounded-xl flex items-center gap-2 border border-primary/5">
              <Monitor className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[10px] font-bold text-primary">
                {t("pwa.benefit_icon", { defaultValue: "أيقونة للشاشة الرئيسية" })}
              </span>
            </div>
            <div className="bg-primary/5 p-2.5 rounded-xl flex items-center gap-2 border border-primary/5">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[10px] font-bold text-primary">
                {t("pwa.benefit_native", { defaultValue: "تجربة تطبيق متكاملة" })}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-1.5">
            <Button
              onClick={handleInstallClick}
              className="flex-1 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold py-5"
            >
              {t("pwa.install_btn", { defaultValue: "تنزيل وتثبيت" })}
            </Button>
            <Button
              variant="outline"
              onClick={handleCloseClick}
              className="rounded-xl border-primary/10 hover:bg-primary/5 text-xs font-bold px-5"
            >
              {t("common.close", { defaultValue: "إغلاق" })}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
