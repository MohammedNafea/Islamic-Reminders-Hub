import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/lib/store";
import { RotateCcw, Maximize2, Minimize2, Plus, BarChart2 } from "lucide-react";
import { logTasbihIncrement } from "@/lib/tracker";
import { TranslatedText } from "@/components/TranslatedText";
import { getTranslation } from "@/lib/content-i18n";
import { localDB } from "@/lib/db";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const TARGETS = [33, 99, 100, 500, 1000];

interface Dhikr {
  id: string;
  nameAr: string;
  nameEn: string;
  isCustom?: boolean;
}

const DEFAULT_DHIKRS: Dhikr[] = [
  { id: "subhanallah", nameAr: "سبحان الله", nameEn: "Subhan Allah" },
  { id: "alhamdulillah", nameAr: "الحمد لله", nameEn: "Alhamdulillah" },
  { id: "allahuakbar", nameAr: "الله أكبر", nameEn: "Allahu Akbar" },
  { id: "astaghfirullah", nameAr: "أستغفر الله", nameEn: "Astaghfirullah" },
  { id: "lailahaillallah", nameAr: "لا إله إلا الله", nameEn: "La ilaha illallah" },
  { id: "allahummasalli", nameAr: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ", nameEn: "Allahumma salli wa sallim 'ala nabiyyina Muhammad" },
];

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function Tasbih() {
  const { t, i18n } = useTranslation();
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [selectedDhikrId, setSelectedDhikrId] = useState("subhanallah");
  const [customDhikrs, setCustomDhikrs] = useState<Dhikr[]>([]);
  const [stats, setStats] = useState<Record<string, { today: number, lifetime: number, lastUpdated?: string }>>({});
  
  const [newDhikrAr, setNewDhikrAr] = useState("");
  const [newDhikrEn, setNewDhikrEn] = useState("");

  const settings = getSettings();
  const vibrateRef = useRef<number>(0);
  const getTodayStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayStr();

  useEffect(() => {
    const loadedCustom = localDB.getGeneralProgress<Dhikr[]>("custom_dhikrs", []);
    setCustomDhikrs(loadedCustom);
    const loadedStats = localDB.getGeneralProgress<Record<string, { today: number, lifetime: number, lastUpdated?: string }>>("tasbih_stats_v3", {});
    setStats(loadedStats);
  }, []);

  useEffect(() => {
    const activeCount = localDB.getGeneralProgress<number>("active_count_" + selectedDhikrId, 0);
    setCount(activeCount);
  }, [selectedDhikrId]);

  const allDhikrs = [...DEFAULT_DHIKRS, ...customDhikrs];
  const activeDhikr = allDhikrs.find(d => d.id === selectedDhikrId) || DEFAULT_DHIKRS[0];

  const handleTap = (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    const next = count >= target ? 1 : count + 1;
    setCount(next);
    localDB.saveGeneralProgress("active_count_" + selectedDhikrId, next);

    // Update stats
    const currentTodayStr = getTodayStr();
    const currentStats = { ...stats };
    const dhikrStat = currentStats[selectedDhikrId] || { today: 0, lifetime: 0, lastUpdated: currentTodayStr };
    if (dhikrStat.lastUpdated !== currentTodayStr) {
      dhikrStat.today = 0;
      dhikrStat.lastUpdated = currentTodayStr;
    }
    dhikrStat.today += 1;
    dhikrStat.lifetime += 1;
    currentStats[selectedDhikrId] = dhikrStat;
    setStats(currentStats);
    localDB.saveGeneralProgress("tasbih_stats_v3", currentStats);

    logTasbihIncrement(1);

    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
    };
    setRipples(prev => [...prev, newRipple]);

    // Haptic feedback logic
    if (settings.vibrate && navigator.vibrate) {
      const now = Date.now();
      if (now - vibrateRef.current > 80) {
        if (next === target) {
          navigator.vibrate([50, 100, 50, 100, 80]); // long celebration vibrate
        } else if (next % 33 === 0) {
          navigator.vibrate([30, 50, 30]); // special 33 mark vibrate
        } else {
          navigator.vibrate(15); // standard tap vibrate
        }
        vibrateRef.current = now;
      }
    }
  };

  const handleReset = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCount(0);
    localDB.saveGeneralProgress("active_count_" + selectedDhikrId, 0);
  };

  const handleAddCustomDhikr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDhikrAr.trim() || !newDhikrEn.trim()) return;

    const id = "custom_" + Date.now();
    const newDhikr: Dhikr = {
      id,
      nameAr: newDhikrAr.trim(),
      nameEn: newDhikrEn.trim(),
      isCustom: true
    };

    const updatedCustom = [...customDhikrs, newDhikr];
    setCustomDhikrs(updatedCustom);
    localDB.saveGeneralProgress("custom_dhikrs", updatedCustom);

    setNewDhikrAr("");
    setNewDhikrEn("");
    setSelectedDhikrId(id);
  };

  // Remove ripple after animation ends
  const removeRipple = (id: number) => {
    setRipples(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-md mx-auto relative min-h-[70vh] flex flex-col justify-between">
      <AnimatePresence>
        {isFullScreen ? (
          /* Full Screen mode view */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-background flex flex-col justify-between p-6 select-none overflow-hidden"
            onClick={handleTap}
          >
            {/* Ripples layer */}
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                className="absolute bg-primary/10 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-ping"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  width: "150px",
                  height: "150px",
                  animationDuration: "0.8s",
                }}
                onAnimationEnd={() => removeRipple(ripple.id)}
              />
            ))}

            <div className="flex justify-between items-center w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullScreen(false);
                }}
                className="rounded-full gap-1.5 shadow-sm border-border/60 hover:bg-muted"
              >
                <Minimize2 className="w-4 h-4" />
                <span>
                  <TranslatedText
                    text="رجوع"
                    staticTranslation={getTranslation(t, "common.back", i18n.language) || undefined}
                    keepArabic={false}
                    inline
                  />
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                <span>
                  <TranslatedText
                    text="إعادة تعيين"
                    staticTranslation={getTranslation(t, "tasbih.reset", i18n.language) || undefined}
                    keepArabic={false}
                    inline
                  />
                </span>
              </Button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <h3 className="text-3xl font-bold text-center mb-6 text-foreground font-heading">
                {activeDhikr.nameAr}
              </h3>
              <span className="text-[10rem] font-bold tracking-tight text-primary leading-none select-none tabular-nums animate-pulse">
                {count}
              </span>
              <span className="text-muted-foreground text-sm font-medium mt-6">
                <TranslatedText
                  text="الهدف"
                  staticTranslation={getTranslation(t, "tasbih.target", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
                : {target}
              </span>
            </div>

            <div className="w-full text-center text-xs text-muted-foreground/60 animate-bounce pb-4">
              <TranslatedText
                text="انقر في أي مكان على الشاشة للتسبيح"
                staticTranslation={getTranslation(t, "tasbih.tap_anywhere", i18n.language) || undefined}
                keepArabic={false}
                inline
              />
            </div>
          </motion.div>
        ) : (
          /* Normal mode view */
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center pt-4">
                <h2 className="text-2xl font-heading font-bold text-primary">
                  <TranslatedText
                    text="السبحة الإلكترونية"
                    staticTranslation={getTranslation(t, "tasbih.title", i18n.language) || undefined}
                    keepArabic={false}
                    inline
                  />
                </h2>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullScreen(true)}
                  className="rounded-full gap-1.5 border-border/60"
                  title={getTranslation(t, "tasbih.fullscreen", i18n.language) || "ملء الشاشة"}
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>
                    <TranslatedText
                      text="ملء الشاشة"
                      staticTranslation={getTranslation(t, "tasbih.fullscreen", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </span>
                </Button>
              </div>

              {/* Dhikr Selector dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="dhikr-select" className="text-xs font-semibold text-muted-foreground">
                  <TranslatedText
                    text="اختر الذكر"
                    staticTranslation={getTranslation(t, "tasbih.select_dhikr", i18n.language) || undefined}
                    keepArabic={false}
                    inline
                  />
                </Label>
                <Select
                  value={selectedDhikrId}
                  onValueChange={(val) => setSelectedDhikrId(val)}
                >
                  <SelectTrigger id="dhikr-select" className="w-full border-border/60">
                    <SelectValue placeholder={getTranslation(t, "tasbih.select_dhikr", i18n.language) || "اختر الذكر"} />
                  </SelectTrigger>
                  <SelectContent>
                    {allDhikrs.map(dhikr => (
                      <SelectItem key={dhikr.id} value={dhikr.id}>
                        {dhikr.nameAr} - {dhikr.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {TARGETS.map(t_val => (
                  <Button 
                    key={t_val}
                    variant={target === t_val ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setTarget(t_val);
                      if (count > t_val) {
                        setCount(0);
                        localDB.saveGeneralProgress("active_count_" + selectedDhikrId, 0);
                      }
                    }}
                    className="rounded-full px-4 h-8 text-xs font-semibold border-border/60"
                  >
                    {t_val}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <h3 className="text-2xl font-bold text-center mb-1 text-primary font-heading">
                {activeDhikr.nameAr}
              </h3>
              <p className="text-xs text-muted-foreground text-center italic mb-4">
                {activeDhikr.nameEn}
              </p>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleTap}
                className="relative w-60 h-60 rounded-full bg-card border-4 border-primary/20 shadow-xl flex flex-col items-center justify-center cursor-pointer group hover:border-primary/40 transition-colors focus:outline-none overflow-hidden"
              >
                {/* Ripples layer */}
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="absolute bg-primary/10 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-ping"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      width: "120px",
                      height: "120px",
                      animationDuration: "0.6s",
                    }}
                    onAnimationEnd={() => removeRipple(ripple.id)}
                  />
                ))}

                {/* Progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                  <circle
                    cx="120"
                    cy="120"
                    r="116"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/20"
                  />
                  <motion.circle
                    cx="120"
                    cy="120"
                    r="116"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="text-primary"
                    strokeDasharray={2 * Math.PI * 116}
                    initial={{ strokeDashoffset: 2 * Math.PI * 116 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 116 * (1 - Math.min(count / target, 1)) }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  />
                </svg>
                
                <AnimatePresence mode="wait">
                  <motion.span
                    key={count}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 1.2 }}
                    className="text-6xl font-bold tracking-tight tabular-nums text-foreground"
                  >
                    {count}
                  </motion.span>
                </AnimatePresence>
                <span className="text-muted-foreground mt-2 font-medium text-xs tracking-wider">
                  <TranslatedText
                    text="الهدف"
                    staticTranslation={getTranslation(t, "tasbih.target", i18n.language) || undefined}
                    keepArabic={false}
                    inline
                  />
                  : {target}
                </span>
              </motion.button>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={handleReset} className="gap-2 border-border/60 hover:bg-muted">
                <RotateCcw className="w-4 h-4" />
                <TranslatedText
                  text="إعادة تعيين"
                  staticTranslation={getTranslation(t, "tasbih.reset", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </Button>
            </div>

            {/* Custom Dhikr Creator Form */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Plus className="w-4 h-4" />
                  <TranslatedText
                    text="ذكر مخصص"
                    staticTranslation={getTranslation(t, "tasbih.custom_dhikr", i18n.language) || undefined}
                    keepArabic={false}
                    inline
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCustomDhikr} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="dhikr-ar" className="text-xs font-semibold text-muted-foreground">الذكر بالعربية</Label>
                      <Input
                        id="dhikr-ar"
                        placeholder="مثال: لا حول ولا قوة إلا بالله"
                        value={newDhikrAr}
                        onChange={(e) => setNewDhikrAr(e.target.value)}
                        className="text-right text-sm border-border/60"
                        dir="rtl"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dhikr-en" className="text-xs font-semibold text-muted-foreground">Dhikr in English</Label>
                      <Input
                        id="dhikr-en"
                        placeholder="e.g. La hawla wa la quwwata..."
                        value={newDhikrEn}
                        onChange={(e) => setNewDhikrEn(e.target.value)}
                        className="text-left text-sm border-border/60"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="w-full gap-1.5 font-bold">
                    <Plus className="w-4 h-4" />
                    <TranslatedText
                      text="إضافة ذكر"
                      staticTranslation={getTranslation(t, "tasbih.add_dhikr", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Statistics Table */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                  <BarChart2 className="w-4 h-4" />
                  <TranslatedText
                    text="إحصائيات التسبيح"
                    staticTranslation={i18n.language === "ar" ? "إحصائيات التسبيح" : "Tasbih Statistics"}
                    keepArabic={false}
                    inline
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/30 text-xs font-bold text-muted-foreground">
                        <th className="py-2.5 px-4 font-semibold text-start">
                          <TranslatedText
                            text="الذكر"
                            staticTranslation={getTranslation(t, "tasbih.dhikr_name", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </th>
                        <th className="py-2.5 px-4 font-semibold text-center w-28">
                          <TranslatedText
                            text="إحصائيات اليوم"
                            staticTranslation={getTranslation(t, "tasbih.daily_stats", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </th>
                        <th className="py-2.5 px-4 font-semibold text-center w-28">
                          <TranslatedText
                            text="الإحصائيات الكلية"
                            staticTranslation={getTranslation(t, "tasbih.lifetime_stats", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {allDhikrs.map((dhikr) => {
                        const dStat = stats[dhikr.id] || { today: 0, lifetime: 0, lastUpdated: todayStr };
                        const todayCount = dStat.lastUpdated === todayStr ? dStat.today : 0;
                        return (
                          <tr key={dhikr.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-start">
                              <div className="font-semibold text-foreground text-sm">{dhikr.nameAr}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{dhikr.nameEn}</div>
                            </td>
                            <td className="py-2.5 px-4 text-center font-semibold text-primary tabular-nums">
                              {todayCount}
                            </td>
                            <td className="py-2.5 px-4 text-center font-semibold text-muted-foreground tabular-nums">
                              {dStat.lifetime}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
