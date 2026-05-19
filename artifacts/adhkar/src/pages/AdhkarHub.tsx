import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Sun, Moon, Star, Clock, Heart, BookOpen, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getDailyProgress } from "@/lib/store";
import { adhkarMorningEvening, adhkarMorningVariant, adhkarMorningOnly, adhkarEveningOnly, adhkarSleep, adhkarPrayer, adhkarSalawat, adhkarRuqyah } from "@/data/adhkar";
import { useEffect, useState } from "react";

const categories = [
  {
    href: "/morning",
    Icon: Sun,
    titleKey: "nav.morning",
    descKey: "adhkar_hub.morning_desc",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800/50",
    activeBg: "bg-amber-100 dark:bg-amber-900/40",
    adhkar: () => [...adhkarMorningEvening, ...adhkarMorningVariant, ...adhkarMorningOnly],
  },
  {
    href: "/evening",
    Icon: Moon,
    titleKey: "nav.evening",
    descKey: "adhkar_hub.evening_desc",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800/50",
    activeBg: "bg-blue-100 dark:bg-blue-900/40",
    adhkar: () => [...adhkarMorningEvening, ...adhkarMorningVariant, ...adhkarEveningOnly],
  },
  {
    href: "/sleep",
    Icon: Star,
    titleKey: "nav.sleep",
    descKey: "adhkar_hub.sleep_desc",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    border: "border-indigo-200 dark:border-indigo-800/50",
    activeBg: "bg-indigo-100 dark:bg-indigo-900/40",
    adhkar: () => adhkarSleep,
  },
  {
    href: "/prayer",
    Icon: Clock,
    titleKey: "nav.prayer",
    descKey: "adhkar_hub.prayer_desc",
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/20",
    activeBg: "bg-primary/10",
    adhkar: () => [...adhkarPrayer, ...adhkarSalawat],
  },
  {
    href: "/ruqyah",
    Icon: Heart,
    titleKey: "nav.ruqyah",
    descKey: "adhkar_hub.ruqyah_desc",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800/50",
    activeBg: "bg-emerald-100 dark:bg-emerald-900/40",
    adhkar: () => adhkarRuqyah,
  },
  {
    href: "/morning-ruqyah",
    Icon: Heart,
    titleKey: "nav.merged_morning",
    descKey: "home.merged_morning_desc",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800/50",
    activeBg: "bg-rose-100 dark:bg-rose-900/40",
    adhkar: () => [...adhkarMorningEvening, ...adhkarMorningVariant, ...adhkarMorningOnly, ...adhkarRuqyah],
  },
  {
    href: "/evening-ruqyah",
    Icon: Heart,
    titleKey: "nav.merged_evening",
    descKey: "home.merged_evening_desc",
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
    border: "border-fuchsia-200 dark:border-fuchsia-800/50",
    activeBg: "bg-fuchsia-100 dark:bg-fuchsia-900/40",
    adhkar: () => [...adhkarMorningEvening, ...adhkarMorningVariant, ...adhkarEveningOnly, ...adhkarRuqyah],
  },
  {
    href: "/zakat",
    Icon: Coins,
    titleKey: "nav.zakat",
    descKey: "zakat.subtitle",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800/50",
    activeBg: "bg-emerald-100 dark:bg-emerald-900/40",
    adhkar: () => [],
  },
];

export default function AdhkarHub() {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    setProgress(getDailyProgress());
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-2xl mx-auto">
      <div className="pt-4 space-y-1">
        <h1 className="text-3xl font-heading font-bold text-primary">{t("adhkar_hub.title")}</h1>
        <p className="text-muted-foreground">{t("adhkar_hub.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {categories.map((cat, i) => {
          const list = cat.adhkar();
          const total = list.reduce((s, d) => s + d.count, 0);
          const done = list.reduce((s, d) => s + Math.min(progress[d.id] || 0, d.count), 0);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const isComplete = pct === 100;

          return (
            <motion.div
              key={cat.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Link href={cat.href}>
                <div className={cn(
                  "group relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200",
                  "hover:shadow-md hover:-translate-y-0.5",
                  isComplete ? cat.activeBg : cat.bg,
                  cat.border
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl shrink-0 transition-transform group-hover:scale-110",
                      isComplete ? "bg-white/60 dark:bg-black/20" : "bg-white/80 dark:bg-black/20"
                    )}>
                      <cat.Icon className={cn("w-6 h-6", cat.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-heading font-bold text-lg text-foreground">{t(cat.titleKey)}</h3>
                        {cat.href !== "/zakat" && (
                          <span className={cn("text-sm font-semibold tabular-nums", cat.color)}>
                            {pct}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{t(cat.descKey)}</p>
                      {cat.href !== "/zakat" && (
                        <div className="mt-3 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className={cn("h-full rounded-full", isComplete ? "bg-primary" : "bg-current opacity-60")}
                            style={{ color: "currentColor" }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.07 + 0.2 }}
                          />
                        </div>
                      )}
                    </div>
                    <BookOpen className={cn("w-4 h-4 opacity-40 shrink-0 group-hover:opacity-70 transition-opacity", cat.color)} />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
