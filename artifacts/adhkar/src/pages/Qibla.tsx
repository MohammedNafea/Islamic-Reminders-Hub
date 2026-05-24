import { useTranslation } from "react-i18next";
import { QiblaCompass } from "@/components/QiblaCompass";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Compass } from "lucide-react";
import { TranslatedText } from "@/components/TranslatedText";
import { getTranslation } from "@/lib/content-i18n";

export default function QiblaPage() {
  const { t, i18n } = useTranslation();
  const [coords, setCoords] = useState({ lat: 21.4225, lng: 39.8262 });
  const [city, setCity] = useState("مكة المكرمة");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setCity("موقعك الحالي");
        },
        () => setCity("مكة المكرمة (الافتراضي)")
      );
    }
  }, []);

  return (
    <div className="animate-in fade-in duration-500 max-w-lg mx-auto space-y-8 pt-6 pb-20">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 text-primary">
          <Compass className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-heading font-bold text-primary">
          <TranslatedText
            text="تحديد القبلة"
            staticTranslation={getTranslation(t, "prayer.qibla.direction", i18n.language) || undefined}
            keepArabic={false}
            inline
          />
        </h2>
        <p className="text-muted-foreground">
          <TranslatedText
            text="بوصلة دقيقة مدعومة بالواقع المعزز (AR)"
            staticTranslation={getTranslation(t, "prayer.qibla.subtitle", i18n.language) || undefined}
            keepArabic={false}
          />
        </p>
      </div>

      <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-4 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary" />
          <div className="text-sm">
            <p className="font-bold">
              <TranslatedText
                text={city}
                staticTranslation={
                  city === "موقعك الحالي"
                    ? (getTranslation(t, "prayer.qibla.current_location", i18n.language) || undefined)
                    : (getTranslation(t, "prayer.qibla.makkah", i18n.language) || undefined)
                }
                keepArabic={false}
                inline
              />
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tabular-nums">
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </p>
          </div>
        </CardContent>
      </Card>

      <QiblaCompass lat={coords.lat} lng={coords.lng} />

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground/80 px-2">
          <TranslatedText
            text="إرشادات الاستخدام"
            staticTranslation={getTranslation(t, "prayer.qibla.guide", i18n.language) || undefined}
            keepArabic={false}
            inline
          />
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <GuideStep 
            number="1"
            text={
              <TranslatedText
                text="ضع الهاتف بشكل مسطح على راحة يدك"
                staticTranslation={getTranslation(t, "prayer.qibla.guide_1", i18n.language) || undefined}
                keepArabic={false}
                inline
              />
            }
          />
          <GuideStep 
            number="2"
            text={
              <TranslatedText
                text="تأكد من تفعيل مستشعرات الموقع والبوصلة"
                staticTranslation={getTranslation(t, "prayer.qibla.guide_2", i18n.language) || undefined}
                keepArabic={false}
                inline
              />
            }
          />
          <GuideStep 
            number="3"
            text={
              <TranslatedText
                text="قم بتحريك الهاتف بشكل (8) لمعايرة الحساسات"
                staticTranslation={getTranslation(t, "prayer.qibla.guide_3", i18n.language) || undefined}
                keepArabic={false}
                inline
              />
            }
          />
          <GuideStep 
            number="4"
            text={
              <TranslatedText
                text="استخدم زر الكاميرا لرؤية القبلة في محيطك"
                staticTranslation={getTranslation(t, "prayer.qibla.guide_4", i18n.language) || undefined}
                keepArabic={false}
                inline
              />
            }
          />
        </div>
      </div>
    </div>
  );
}

function GuideStep({ number, text }: { number: string; text: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="text-sm font-medium">{text}</div>
    </div>
  );
}
