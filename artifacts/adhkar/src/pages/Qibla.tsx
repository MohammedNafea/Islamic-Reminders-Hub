import { useTranslation } from "react-i18next";
import { QiblaCompass } from "@/components/QiblaCompass";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Compass } from "lucide-react";

export default function QiblaPage() {
  const { t } = useTranslation();
  const [coords, setCoords] = useState({ lat: 21.4225, lng: 39.8262 });
  const [city, setCity] = useState("Makkah");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          // Simple city fallback
          setCity(t("prayer.qibla.current_location") || "موقعك الحالي");
        },
        () => setCity("Makkah (Default)")
      );
    }
  }, [t]);

  return (
    <div className="animate-in fade-in duration-500 max-w-lg mx-auto space-y-8 pt-6 pb-20">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 text-primary">
          <Compass className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-heading font-bold text-primary">{t("prayer.qibla.direction") || "تحديد القبلة"}</h2>
        <p className="text-muted-foreground">{t("prayer.qibla.subtitle") || "بوصلة دقيقة مدعومة بالواقع المعزز (AR)"}</p>
      </div>

      <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-4 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary" />
          <div className="text-sm">
            <p className="font-bold">{city}</p>
            <p className="text-[10px] text-muted-foreground uppercase tabular-nums">
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </p>
          </div>
        </CardContent>
      </Card>

      <QiblaCompass lat={coords.lat} lng={coords.lng} />

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground/80 px-2">{t("prayer.qibla_guide") || "إرشادات الاستخدام"}</h3>
        <div className="grid grid-cols-1 gap-3">
          <GuideStep 
            number="1"
            text={t("prayer.qibla.guide_1") || "ضع الهاتف بشكل مسطح على راحة يدك"}
          />
          <GuideStep 
            number="2"
            text={t("prayer.qibla.guide_2") || "تأكد من تفعيل مستشعرات الموقع والبوصلة"}
          />
          <GuideStep 
            number="3"
            text={t("prayer.qibla.guide_3") || "قم بتحريك الهاتف بشكل (8) لمعايرة الحساسات"}
          />
          <GuideStep 
            number="4"
            text={t("prayer.qibla.guide_4") || "استخدم زر الكاميرا لرؤية القبلة في محيطك"}
          />
        </div>
      </div>
    </div>
  );
}

function GuideStep({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
