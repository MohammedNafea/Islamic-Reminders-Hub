import { useTranslation } from "react-i18next";
import { DhikrList } from "@/components/DhikrList";
import { adhkarMasjid } from "@/data/adhkar";
import { MapPin } from "lucide-react";
import { TranslatedText } from "@/components/TranslatedText";
import { getTranslation } from "@/lib/content-i18n";

export default function MasjidAdhkar() {
  const { t, i18n } = useTranslation();

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-violet-600 to-purple-600 text-white p-6 shadow-xl">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <MapPin className="w-40 h-40 translate-x-8 -translate-y-8" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 shrink-0 border border-white/20">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">
              <TranslatedText
                text={t("nav.masjid", { lng: "ar" })}
                staticTranslation={getTranslation(t, "nav.masjid", i18n.language) || undefined}
                keepArabic={false}
                inline
              />
            </h1>
            <p className="text-white/80 text-sm mt-0.5">
              <TranslatedText
                text={t("adhkar_hub.masjid_desc", { lng: "ar" })}
                staticTranslation={getTranslation(t, "adhkar_hub.masjid_desc", i18n.language) || undefined}
                keepArabic={false}
                inline
              />
            </p>
          </div>
        </div>
      </div>

      <DhikrList adhkar={adhkarMasjid} titleKey="nav.masjid" compact />
    </div>
  );
}
