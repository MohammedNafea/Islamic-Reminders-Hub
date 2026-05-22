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

      {/* Post-Prayer Adhkar */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm font-semibold text-muted-foreground shrink-0">{t("adhkar_hub.post_prayer")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <DhikrList adhkar={adhkarPrayer} titleKey="nav.prayer" isEvening={false} compact />
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
