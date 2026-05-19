import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getSettings, saveSettings } from "@/lib/store";
import { supportedLanguages } from "@/i18n";
import { useTheme } from "@/components/ThemeProvider";
type Theme = "dark" | "light" | "system" | "fajr" | "duha" | "maghrib" | "sahar" | "dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { NotificationManager } from "@/lib/notifications";
import { Link } from "wouter";
import { ChevronRight, User, Cloud, LogOut, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [settings, setLocalSettings] = useState(getSettings());

  useEffect(() => {
    setLocalSettings(getSettings());
  }, []);

  const updateSetting = async (key: keyof typeof settings, value: typeof settings[typeof key]) => {
    let finalValue: typeof settings[typeof key] = value;
    if (key === "notifications" && value === true) {
      const granted = await NotificationManager.requestPermission();
      if (granted) {
        NotificationManager.scheduleReminders();
      } else {
        finalValue = false as typeof settings[typeof key];
      }
    }

    const newSettings = { ...settings, [key]: finalValue };
    setLocalSettings(newSettings);
    saveSettings(newSettings);

    if (key === "language") {
      i18n.changeLanguage(finalValue as string);
    }
  };

  const [user, setUser] = useState<{ id?: string; email?: string } | null>(null);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleAuth = async () => {
    if (!supabase) return;
    if (user) {
      await supabase.auth.signOut();
    } else {
      // For demo/simplicity, we use email/password or a simple magic link
      // In a real app, you'd show a dialog. Here we just trigger a sign in.
      const email = window.prompt(t("settings.enter_email") || "Enter your email:");
      if (email) {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) alert(error.message);
        else alert(t("settings.check_email") || "Check your email for the login link!");
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-heading font-bold text-primary pt-4">{t("settings.title")}</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("settings.language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={settings.language} 
            onValueChange={(val) => updateSetting("language", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("settings.language")} />
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
          <CardTitle className="text-lg">{t("settings.theme")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={theme} 
            onValueChange={(val) => setTheme(val as Theme)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("settings.theme")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("settings.light")}</SelectItem>
              <SelectItem value="dark">{t("settings.dark")}</SelectItem>
              <SelectItem value="system">{t("settings.system")}</SelectItem>
              <SelectItem value="dynamic">{t("settings.dynamic") || "ديناميكي (حسب الوقت)"}</SelectItem>
              <SelectItem value="fajr">{t("settings.theme_fajr") || "الفجر (بنفسجي)"}</SelectItem>
              <SelectItem value="duha">{t("settings.theme_duha") || "الضحى (سماوي)"}</SelectItem>
              <SelectItem value="maghrib">{t("settings.theme_maghrib") || "المغرب (غروبي)"}</SelectItem>
              <SelectItem value="sahar">{t("settings.theme_sahar") || "السحر (ليلي عميق)"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("settings.calculation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={settings.calculationMethod} 
            onValueChange={(val) => updateSetting("calculationMethod", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("settings.calculation")} />
            </SelectTrigger>
            <SelectContent>
              {["MuslimWorldLeague", "Egyptian", "Karachi", "UmmAlQura", "Dubai", "NorthAmerica", "Kuwait", "Qatar", "Singapore", "Turkey"].map(method => (
                <SelectItem key={method} value={method}>
                  {t(`prayer.methods.${method}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("settings.font_size")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={settings.fontSize} 
            onValueChange={(val) => updateSetting("fontSize", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("settings.font_size")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">{t("settings.font_sm") || "Small"}</SelectItem>
              <SelectItem value="md">{t("settings.font_md") || "Medium"}</SelectItem>
              <SelectItem value="lg">{t("settings.font_lg") || "Large"}</SelectItem>
              <SelectItem value="xl">{t("settings.font_xl") || "Extra Large"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            {t("settings.cloud_sync") || "المزامنة السحابية"}
          </CardTitle>
          <CardDescription>
            {t("settings.cloud_desc") || "قم بتسجيل الدخول لمزامنة أذكارك ومفضلاتك عبر جميع أجهزتك."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-background rounded-2xl border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">{user ? user.email : t("settings.guest") || "زائر"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  {user ? t("settings.sync_active") || "المزامنة نشطة" : t("settings.local_only") || "تخزين محلي فقط"}
                </p>
              </div>
            </div>
            <Button 
              variant={user ? "outline" : "default"} 
              size="sm" 
              className="rounded-xl gap-2"
              onClick={handleAuth}
              disabled={!supabase}
            >
              {user ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {user ? t("settings.logout") || "خروج" : t("settings.login") || "دخول"}
            </Button>
          </div>
          {!supabase && (
            <p className="text-[10px] text-red-500 text-center italic">
              * Supabase is not configured. Check environment variables.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="text-base font-medium">{t("settings.notifications")}</Label>
            <Switch 
              id="notifications" 
              checked={settings.notifications}
              onCheckedChange={(val) => updateSetting("notifications", val)}
            />
          </div>
          <div className="h-px bg-border my-4" />
          <div className="flex items-center justify-between">
            <Label htmlFor="vibrate" className="text-base font-medium">{t("tasbih.vibrate")}</Label>
            <Switch 
              id="vibrate" 
              checked={settings.vibrate}
              onCheckedChange={(val) => updateSetting("vibrate", val)}
            />
          </div>
          <div className="h-px bg-border my-4" />
          <Link href="/admin/library">
            <div className="flex items-center justify-between cursor-pointer group">
              <Label className="text-base font-medium cursor-pointer group-hover:text-primary transition-colors">{t("admin.library_title")}</Label>
              <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                <ChevronRight className="w-4 h-4 text-primary" />
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>

      <Card className="border-amber-500/20 bg-amber-500/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <svg className="w-24 h-24 rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
        </div>
        <CardHeader>
          <CardTitle className="text-amber-600 dark:text-amber-400 font-heading">{t("settings.about_us_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground italic">
            {t("settings.about_us_content")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
