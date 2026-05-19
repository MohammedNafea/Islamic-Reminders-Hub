import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getTasbihCount, setTasbihCount, getSettings } from "@/lib/store";
import { RotateCcw } from "lucide-react";

const TARGETS = [33, 99, 100, 1000];

export default function Tasbih() {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const settings = getSettings();
  const vibrateRef = useRef<number>(0);

  useEffect(() => {
    setCount(getTasbihCount("main"));
  }, []);

  const handleTap = () => {
    const next = count + 1;
    setCount(next);
    setTasbihCount("main", next);

    if (settings.vibrate && navigator.vibrate) {
      const now = Date.now();
      if (now - vibrateRef.current > 100) {
        if (next === target) {
          navigator.vibrate([50, 100, 50]);
        } else if (next % 33 === 0) {
          navigator.vibrate(40);
        } else {
          navigator.vibrate(10);
        }
        vibrateRef.current = now;
      }
    }
    
    if (next === target) {
      // Optional: slight pause before visual reset? No, let the user decide
    }
  };

  const handleReset = () => {
    setCount(0);
    setTasbihCount("main", 0);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8 max-w-md mx-auto">
      <h2 className="text-2xl font-heading font-bold text-primary text-center pt-4">{t("tasbih.title")}</h2>
      
      <div className="flex flex-wrap justify-center gap-2">
        {TARGETS.map(t => (
          <Button 
            key={t}
            variant={target === t ? "default" : "outline"}
            size="sm"
            onClick={() => setTarget(t)}
            className="rounded-full"
          >
            {t}
          </Button>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center py-12">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleTap}
          className="relative w-64 h-64 rounded-full bg-card border-4 border-primary/20 shadow-lg flex flex-col items-center justify-center cursor-pointer group hover:border-primary/40 transition-colors focus:outline-none"
        >
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <circle
              cx="128"
              cy="128"
              r="124"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            <motion.circle
              cx="128"
              cy="128"
              r="124"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className="text-primary"
              strokeDasharray={2 * Math.PI * 124}
              initial={{ strokeDashoffset: 2 * Math.PI * 124 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 124 * (1 - Math.min(count / target, 1)) }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          </svg>
          
          <AnimatePresence mode="wait">
            <motion.span
              key={count}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 1.2 }}
              className="text-7xl font-bold tabular-nums text-foreground"
            >
              {count}
            </motion.span>
          </AnimatePresence>
          <span className="text-muted-foreground mt-2 font-medium">{t("tasbih.target")}: {target}</span>
        </motion.button>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          {t("tasbih.reset")}
        </Button>
      </div>
    </div>
  );
}
