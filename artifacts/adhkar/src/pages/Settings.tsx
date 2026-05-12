import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getSettings, saveSettings } from "@/lib/store";
import { supportedLanguages } from "@/i18n";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [settings, setLocalSettings] = useState(getSettings());

  useEffect(() => {
    setLocalSettings(getSettings());
  }, []);

  const updateSetting = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setLocalSettings(newSettings);
    saveSettings(newSettings);

    if (key === "language") {
      i18n.changeLanguage(value);
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
            onValueChange={(val: any) => setTheme(val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("settings.theme")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("settings.light")}</SelectItem>
              <SelectItem value="dark">{t("settings.dark")}</SelectItem>
              <SelectItem value="system">{t("settings.system")}</SelectItem>
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
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
              <SelectItem value="xl">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="vibrate" className="text-base font-medium">{t("tasbih.vibrate")}</Label>
            <Switch 
              id="vibrate" 
              checked={settings.vibrate}
              onCheckedChange={(val) => updateSetting("vibrate", val)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
