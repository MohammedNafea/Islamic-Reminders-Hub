import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fastingDays, FastingDay } from "@/data/fasting-days";
import { toHijri, formatHijriDate, hijriToGregorian } from "@/lib/hijri";

export default function Fasting() {
  const { t, i18n } = useTranslation();
  const [today] = useState(new Date());
  const [hijriToday] = useState(toHijri(new Date()));
  
  // A simplified upcoming logic
  // In a real robust implementation, we would calculate exactly when the next occurrence is.
  // Here we just list the sunnahs.
  
  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-heading font-bold text-primary pt-4">{t("fasting.title")}</h2>

      <div className="grid grid-cols-1 gap-4">
        {fastingDays.map((day) => (
          <Card key={day.id} className="hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-primary flex justify-between items-center">
                <span>{t(day.nameKey)}</span>
                <span className="text-xs font-normal px-2 py-1 bg-muted text-muted-foreground rounded-full">
                  {t(`fasting.${day.type}`)}
                </span>
              </CardTitle>
              <p className="text-sm text-foreground font-medium">{t(day.descriptionKey)}</p>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground italic border-t pt-3 mt-1">
                "{t(day.hadithKey)}"
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                — {day.source}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
