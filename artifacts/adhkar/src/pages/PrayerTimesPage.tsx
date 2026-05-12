import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { getPrayerTimesFromAPI, getPrayerTimes, getCityFromCoords, formatTime } from "@/lib/prayer-times";
import { getSettings } from "@/lib/store";
import { MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrayerTimesPage() {
  const { t, i18n } = useTranslation();
  const [times, setTimes] = useState<any>(null);
  const [city, setCity] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const settings = getSettings();

  const fetchTimes = async () => {
    setLoading(true);
    const date = new Date();
    let lat = 21.4225;
    let lng = 39.8262;
    
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        
        const cityName = await getCityFromCoords(lat, lng);
        setCity(cityName);
      } catch (e) {
        // Fallback to Mecca
        setCity("Makkah");
      }
    } else {
      setCity("Makkah");
    }

    const method = settings.calculationMethod === "MuslimWorldLeague" ? 3 : 
                  settings.calculationMethod === "Egyptian" ? 5 : 4;

    const apiTimes = await getPrayerTimesFromAPI(lat, lng, date, method);
    setTimes(apiTimes || getPrayerTimes(lat, lng, date));
    setLoading(false);
  };

  useEffect(() => {
    fetchTimes();
  }, [settings.calculationMethod]);

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-2xl font-heading font-bold text-primary">{t("nav.times")}</h2>
        <Button variant="outline" size="icon" onClick={fetchTimes} disabled={loading} className="rounded-full">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Card className="bg-primary text-primary-foreground border-none">
        <CardContent className="p-6 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary-foreground/80" />
          <div>
            <p className="font-medium">{city || t("prayer.location")}</p>
            <p className="text-xs text-primary-foreground/70">{t(`prayer.methods.${settings.calculationMethod}`)}</p>
          </div>
        </CardContent>
      </Card>

      {loading && !times ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : times ? (
        <div className="space-y-3">
          {[
            { id: "fajr", name: t("prayer.fajr"), time: times.fajr },
            { id: "sunrise", name: t("prayer.sunrise"), time: times.sunrise },
            { id: "dhuhr", name: t("prayer.dhuhr"), time: times.dhuhr },
            { id: "asr", name: t("prayer.asr"), time: times.asr },
            { id: "maghrib", name: t("prayer.maghrib"), time: times.maghrib },
            { id: "isha", name: t("prayer.isha"), time: times.isha },
          ].map((prayer) => {
            const isNext = false; // Logic to determine if it's next prayer
            return (
              <Card key={prayer.id} className={`transition-colors ${isNext ? 'border-primary shadow-sm bg-primary/5' : ''}`}>
                <CardContent className="p-4 flex justify-between items-center">
                  <span className="font-medium text-lg">{prayer.name}</span>
                  <span className="font-sans font-bold tabular-nums text-xl text-primary">{formatTime(prayer.time, i18n.language)}</span>
                </CardContent>
              </Card>
            );
          })}
          
          {times.lastThirdOfNight && (
            <Card className="mt-6 border-dashed border-2">
              <CardContent className="p-4 flex justify-between items-center text-muted-foreground">
                <span className="font-medium">{t("prayer.last_third")}</span>
                <span className="font-sans tabular-nums font-bold">{formatTime(times.lastThirdOfNight, i18n.language)}</span>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
