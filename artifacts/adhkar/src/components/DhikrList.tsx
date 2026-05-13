import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Dhikr } from "@/data/adhkar";
import { getDailyProgress, setDhikrCount, getSettings } from "@/lib/store";
import { Check, Repeat } from "lucide-react";

interface DhikrListProps {
  adhkar: Dhikr[];
  titleKey: string;
  isEvening?: boolean;
  compact?: boolean;
}

export function DhikrList({ adhkar, titleKey, isEvening = false, compact = false }: DhikrListProps) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const settings = getSettings();
  
  // Use a ref to track if we've played the vibration to avoid spamming
  const vibrateRef = useRef<number>(0);

  useEffect(() => {
    setProgress(getDailyProgress());
  }, []);

  const handleTap = (dhikr: Dhikr) => {
    const current = progress[dhikr.id] || 0;
    if (current >= dhikr.count) return;

    const next = current + 1;
    const newProgress = { ...progress, [dhikr.id]: next };
    setProgress(newProgress);
    setDhikrCount(dhikr.id, next);

    if (settings.vibrate && navigator.vibrate) {
      const now = Date.now();
      if (now - vibrateRef.current > 100) {
        if (next === dhikr.count) {
          navigator.vibrate([50, 100, 50]); // Success pattern
        } else {
          navigator.vibrate(20); // Tap pattern
        }
        vibrateRef.current = now;
      }
    }
  };

  const handleReset = (id: string) => {
    const newProgress = { ...progress };
    delete newProgress[id];
    setProgress(newProgress);
    setDhikrCount(id, 0);
  };

  const totalRequired = adhkar.reduce((sum, d) => sum + d.count, 0);
  const totalCompleted = adhkar.reduce((sum, d) => {
    const p = progress[d.id] || 0;
    return sum + (p > d.count ? d.count : p);
  }, 0);
  const percentComplete = totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0;

  return (
    <div className="space-y-6">
      {!compact && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-border/50">
          <h2 className="text-2xl font-heading font-bold text-primary mb-3">{t(titleKey)}</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{Math.round(percentComplete)}%</span>
              <span>{totalCompleted} / {totalRequired}</span>
            </div>
            <Progress value={percentComplete} className="h-2 bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${percentComplete}%` }} />
            </Progress>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {adhkar.map((dhikr, index) => {
            const count = progress[dhikr.id] || 0;
            const isCompleted = count >= dhikr.count;
            const text = isEvening && dhikr.eveningVariant ? dhikr.eveningVariant : dhikr.arabic;

            return (
              <motion.div
                key={dhikr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={cn(
                    "overflow-hidden transition-all duration-300 select-none cursor-pointer",
                    isCompleted 
                      ? "bg-primary/5 border-primary/20 shadow-sm" 
                      : "bg-card hover:bg-muted/30 hover:border-primary/30"
                  )}
                  onClick={() => handleTap(dhikr)}
                >
                  <CardContent className="p-6 space-y-6">
                    <div 
                      className="dhikr-text text-right"
                      dir="rtl"
                    >
                      {text}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-sm text-muted-foreground">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium text-foreground">{dhikr.source}</p>
                        {dhikr.note && <p className="text-xs">{dhikr.note}</p>}
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-4 sm:pt-0">
                        {isCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReset(dhikr.id);
                            }}
                            className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors"
                            aria-label={t("dhikr.reset")}
                          >
                            <Repeat className="w-4 h-4" />
                          </button>
                        )}
                        
                        <div className={cn(
                          "flex items-center justify-center gap-2 rounded-full px-4 py-2 font-medium transition-colors",
                          isCompleted 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {isCompleted ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>{t("common.done")}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-lg tabular-nums leading-none">{count}</span>
                              <span className="text-xs opacity-70">/</span>
                              <span className="text-sm opacity-80">{dhikr.count}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  {!isCompleted && (
                    <div className="h-1 bg-muted w-full">
                      <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / dhikr.count) * 100}%` }}
                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                      />
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}