import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DhikrList } from "@/components/DhikrList";
import { adhkarPrayer, adhkarSalawat, salawatVirtues } from "@/data/adhkar";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { getTranslation } from "@/lib/content-i18n";
import { TranslatedText } from "@/components/TranslatedText";


export default function Prayer() {
  const { t, i18n } = useTranslation();

  const preTasbih = useMemo(() => {
    return adhkarPrayer.filter(item => 
      item.id === "istighfar_3_prayer" ||
      item.id === "la_ilaha_prayer" ||
      item.id === "tahlil_prayer" ||
      item.id === "prayer_qini_v1"
    );
  }, []);

  const tasbih = useMemo(() => {
    return adhkarPrayer.filter(item => 
      item.id === "subhan_allah_prayer_33" ||
      item.id === "alhamdulillah_prayer_33" ||
      item.id === "allahu_akbar_prayer_33" ||
      item.id === "tamam_miah_prayer" ||
      item.id === "prayer_tasbih_10_alternate" ||
      item.id === "prayer_tasbih_34_alternate" ||
      item.id === "prayer_tasbih_25_alternate"
    );
  }, []);

  const postTasbih = useMemo(() => {
    const excludedIds = [
      "istighfar_3_prayer",
      "la_ilaha_prayer",
      "tahlil_prayer",
      "prayer_qini_v1",
      "subhan_allah_prayer_33",
      "alhamdulillah_prayer_33",
      "allahu_akbar_prayer_33",
      "tamam_miah_prayer",
      "prayer_tasbih_10_alternate",
      "prayer_tasbih_34_alternate",
      "prayer_tasbih_25_alternate"
    ];
    return adhkarPrayer.filter(item => !excludedIds.includes(item.id));
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Salawat Virtue Hadiths */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-1.5 shrink-0">
            <Star className="w-4 h-4 text-primary fill-primary/20" />
            <span className="text-sm font-semibold text-primary">{t("salawat.virtue")}</span>
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-3" style={{ width: "max-content" }}>
            {salawatVirtues.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="w-64 sm:w-72 bg-primary/5 border-primary/20 shrink-0">
                  <CardContent className="p-4 space-y-4">
                    <TranslatedText
                      text={v.arabic}
                      staticTranslation={getTranslation(t, `salawat.virtues.${v.id}`, i18n.language) || undefined}
                      keepArabic={true}
                      arabicClassName="text-right text-[0.95rem] leading-relaxed"
                      translationClassName="text-xs text-muted-foreground text-left border-t border-border/20 pt-2 mt-2"
                    />
                    
                    <div className="space-y-1">
                      <TranslatedText
                        text={v.source}
                        staticTranslation={getTranslation(t, `adhkar.sources.${v.source}`, i18n.language) || undefined}
                        keepArabic={true}
                        isDhikr={false}
                        arabicClassName="text-xs text-muted-foreground text-right block"
                        translationClassName="text-[10px] text-muted-foreground/60 text-left block border-t-0 pt-0 mt-0"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Post-Prayer Adhkar (Pre-Tasbih) */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm font-semibold text-muted-foreground shrink-0">{t("adhkar_hub.post_prayer")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <DhikrList adhkar={preTasbih} titleKey="nav.prayer" isEvening={false} compact />
      </div>

      {/* Tasbih Modes Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-1.5 shrink-0">
            <Star className="w-4 h-4 text-primary fill-primary/20" />
            <span className="text-sm font-semibold text-primary">{t("tasbih.modes_title")}</span>
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 sm:p-6 space-y-3 text-right" dir="rtl">
            <h3 className="font-semibold text-primary text-base">{t("tasbih.modes_subtitle")}</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {t("tasbih.modes_intro")}
            </p>
            <ul className="text-sm text-foreground/80 list-disc list-inside space-y-2 pr-2">
              <li>
                <span className="text-foreground/90">{t("tasbih.modes_1")}</span>
              </li>
              <li>
                <span className="text-foreground/90">{t("tasbih.modes_2")}</span>
              </li>
              <li>
                <span className="text-foreground/90">{t("tasbih.modes_3")}</span>
              </li>
              <li>
                <span className="text-foreground/90">{t("tasbih.modes_4")}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <DhikrList adhkar={tasbih} titleKey="tasbih.modes_title" isEvening={false} compact />
      </div>

      {/* Post-Prayer Adhkar (Post-Tasbih) */}
      <div className="space-y-4">
        <DhikrList adhkar={postTasbih} titleKey="nav.prayer" isEvening={false} compact />
      </div>

      {/* Salawat Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-1.5 shrink-0">
            <Star className="w-4 h-4 text-primary fill-primary/20" />
            <span className="text-sm font-semibold text-primary">{t("salawat.title")}</span>
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>
        <DhikrList adhkar={adhkarSalawat} titleKey="salawat.title" isEvening={false} compact />
      </div>
    </div>
  );
}
