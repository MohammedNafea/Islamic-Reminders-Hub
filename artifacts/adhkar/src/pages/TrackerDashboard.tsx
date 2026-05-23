import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorshipStreak, getLast7DaysStats, getTrackerData } from "@/lib/tracker";
import { Flame, Calendar, Award, CheckCircle, Timer, Sparkles, BookOpen, RotateCcw, Plus, Minus, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TranslatedText } from "@/components/TranslatedText";
import { getTranslation } from "@/lib/content-i18n";
import { localDB } from "@/lib/db";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getTasbihCount, getDailyProgress } from "@/lib/store";

interface KhatmahPlan {
  targetDays: number;
  startDate: string;
  currentPage: number;
}

interface TrackerStat {
  date: string;
  dayLabel: string;
  completions: number;
  tasbih: number;
}

export default function TrackerDashboard() {
  const { t, i18n } = useTranslation();
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState<TrackerStat[]>([]);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [totalTasbih, setTotalTasbih] = useState(0);
  const [salawatCount, setSalawatCount] = useState(0);

  // Khatmah state
  const [khatmahPlan, setKhatmahPlan] = useState<KhatmahPlan | null>(null);
  const [targetDays, setTargetDays] = useState(30);
  const [startPage, setStartPage] = useState(0);
  const [inputPage, setInputPage] = useState(0);

  useEffect(() => {
    setStreak(getWorshipStreak());
    const weekStats = getLast7DaysStats(i18n.language);
    setStats(weekStats);

    // Compute grand totals from all records
    const allData = getTrackerData();
    let compCount = 0;
    let tasbihCount = 0;
    Object.values(allData).forEach((record) => {
      compCount += record.categories.length;
      tasbihCount += record.tasbihCount;
    });
    setTotalCompletions(compCount);
    setTotalTasbih(tasbihCount);

    // Load salawat count
    const homeSalawat = getTasbihCount("home_salawat", true);
    const tasbihStats = localDB.getGeneralProgress<Record<string, { today: number, lifetime: number, lastUpdated?: string }>>("tasbih_stats_v3", {});
    const tasbihSalawat = tasbihStats["allahummasalli"]?.today || 0;
    
    // Also include salawat_100_prayer and salawat_100 from daily progress
    const dailyProgress = getDailyProgress();
    const prayerSalawat = dailyProgress["salawat_100_prayer"] || 0;
    const generalSalawat = dailyProgress["salawat_100"] || 0;
    
    setSalawatCount(homeSalawat + tasbihSalawat + prayerSalawat + generalSalawat);

    // Load Khatmah plan
    const plan = localDB.getGeneralProgress<KhatmahPlan | null>("khatmah_plan", null);
    if (plan) {
      setKhatmahPlan(plan);
      setInputPage(plan.currentPage);
    }
  }, [i18n.language]);

  const handleSavePlan = () => {
    const plan = {
      targetDays,
      startDate: new Date().toISOString(),
      currentPage: startPage,
    };
    localDB.saveGeneralProgress("khatmah_plan", plan);
    setKhatmahPlan(plan);
    setInputPage(startPage);
  };

  const handleUpdatePage = (page: number) => {
    if (page < 0 || page > 604 || !khatmahPlan) return;
    const updated = { ...khatmahPlan, currentPage: page };
    localDB.saveGeneralProgress("khatmah_plan", updated);
    setKhatmahPlan(updated);
    setInputPage(page);
  };

  const handleResetPlan = () => {
    localDB.saveGeneralProgress("khatmah_plan", null);
    setKhatmahPlan(null);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-xl mx-auto pb-12">
      <div className="text-center space-y-2 pt-4">
        <h2 className="text-3xl font-heading font-bold text-primary flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500 fill-amber-500" />
          <TranslatedText
            text="مسار الالتزام والعبادات"
            staticTranslation={getTranslation(t, "tracker.title", i18n.language) || undefined}
            keepArabic={false}
            inline
          />
        </h2>
        <p className="text-muted-foreground text-sm">
          <TranslatedText
            text="تابع التزامك اليومي بالأذكار وبناء عاداتك الروحية"
            staticTranslation={getTranslation(t, "tracker.subtitle", i18n.language) || undefined}
            keepArabic={false}
          />
        </p>
      </div>

      {/* Streak & Core stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Streak Card */}
        <Card className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20 overflow-hidden relative group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground font-medium block">
                <TranslatedText
                  text="أيام الالتزام المتتالي"
                  staticTranslation={getTranslation(t, "tracker.streak_label", i18n.language) || undefined}
                  keepArabic={false}
                />
              </span>
              <span className="text-4xl font-bold tracking-tight text-amber-600 dark:text-amber-500 tabular-nums flex items-baseline gap-1.5 justify-start">
                <span>{streak}</span>
                <TranslatedText
                  text="أيام"
                  staticTranslation={getTranslation(t, "tracker.days", i18n.language) || undefined}
                  keepArabic={false}
                  className="text-lg font-medium text-muted-foreground"
                  inline
                />
              </span>
              <span className="text-xs text-muted-foreground/80 block mt-1">
                <TranslatedText
                  text={streak > 0 ? "حافظ على وردك اليومي للاستمرار!" : "ابدأ التلاوة أو التسبيح اليوم لبدء الالتزام!"}
                  staticTranslation={getTranslation(t, streak > 0 ? "tracker.streak_active" : "tracker.streak_start", i18n.language) || undefined}
                  keepArabic={false}
                />
              </span>
            </div>
            
            {/* Animated Flame */}
            <motion.div
              animate={streak > 0 ? {
                scale: [1, 1.1, 1],
                filter: ["drop-shadow(0 0 4px rgba(245,158,11,0.2))", "drop-shadow(0 0 12px rgba(245,158,11,0.5))", "drop-shadow(0 0 4px rgba(245,158,11,0.2))"]
              } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={cn(
                "p-4 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20",
                streak === 0 && "opacity-50 grayscale"
              )}
            >
              <Flame className="w-10 h-10 fill-current" />
            </motion.div>
          </CardContent>
        </Card>

        {/* Worship Summary Card */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-6 grid grid-cols-2 gap-4 h-full align-middle">
            <div className="flex flex-col justify-center border-e border-border/40 pe-2">
              <span className="text-xs text-muted-foreground font-medium block mb-1">
                <TranslatedText
                  text="مجموع الأذكار المقروءة"
                  staticTranslation={getTranslation(t, "tracker.total_adhkar", i18n.language) || undefined}
                  keepArabic={false}
                />
              </span>
              <div className="flex items-center gap-1.5 text-primary">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="text-2xl font-bold tabular-nums">{totalCompletions}</span>
              </div>
            </div>
            <div className="flex flex-col justify-center ps-2">
              <span className="text-xs text-muted-foreground font-medium block mb-1">
                <TranslatedText
                  text="مجموع التسبيحات"
                  staticTranslation={getTranslation(t, "tracker.total_tasbih", i18n.language) || undefined}
                  keepArabic={false}
                />
              </span>
              <div className="flex items-center gap-1.5 text-secondary">
                <Timer className="w-4 h-4 shrink-0" />
                <span className="text-2xl font-bold tabular-nums">{totalTasbih}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Khatmah Planner Card */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-heading font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>{t("khatmah.title", { defaultValue: "مخطط الختمة" })}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {!khatmahPlan ? (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {t("khatmah.subtitle", { defaultValue: "خطط لختم القرآن الكريم في المدة التي تختارها" })}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {t("khatmah.target_days", { defaultValue: "المدة المستهدفة (بالأيام)" })}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={targetDays}
                    onChange={(e) => setTargetDays(parseInt(e.target.value) || 30)}
                    className="rounded-xl border-primary/10 bg-white/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {t("khatmah.current_page", { defaultValue: "الصفحة الحالية التي تقف عندها" })}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={604}
                    value={startPage}
                    onChange={(e) => setStartPage(parseInt(e.target.value) || 0)}
                    className="rounded-xl border-primary/10 bg-white/50"
                  />
                </div>
              </div>
              <Button onClick={handleSavePlan} className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md">
                {t("khatmah.save_plan", { defaultValue: "حفظ الخطة" })}
              </Button>
            </div>
          ) : khatmahPlan.currentPage >= 604 ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-primary">{t("khatmah.complete_title", { defaultValue: "خاتمة مباركة!" })}</h3>
                <p className="text-xs text-muted-foreground px-4">
                  {t("khatmah.complete_desc", { defaultValue: "الحمد لله الذي بنعمته تتم الصالحات. لقد أتممت ختم القرآن الكريم 🎉" })}
                </p>
              </div>
              <Button variant="outline" onClick={handleResetPlan} className="rounded-xl border-primary/10 hover:bg-primary/5 text-primary">
                {t("khatmah.new_plan", { defaultValue: "إنشاء خطة ختمة جديدة" })}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Progress and status */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{t("khatmah.progress", { defaultValue: "تقدم الختمة الحالية" })}</span>
                  <span className="font-bold text-primary tabular-nums">
                    {Math.round((khatmahPlan.currentPage / 604) * 100)}%
                  </span>
                </div>
                <Progress value={Math.round((khatmahPlan.currentPage / 604) * 100)} className="h-2 rounded-full" />
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium">
                  <span>
                    {t("khatmah.pages_read", { defaultValue: "الصفحات المقروءة" })}:{" "}
                    <span className="font-bold text-primary tabular-nums">{khatmahPlan.currentPage}</span> / 604
                  </span>
                  <span>
                    {t("khatmah.days_left", { 
                      days: Math.max(0, khatmahPlan.targetDays - Math.max(0, Math.floor((Date.now() - new Date(khatmahPlan.startDate).getTime()) / (1000 * 60 * 60 * 24)))), 
                      defaultValue: `متبقي ${Math.max(0, khatmahPlan.targetDays - Math.max(0, Math.floor((Date.now() - new Date(khatmahPlan.startDate).getTime()) / (1000 * 60 * 60 * 24))))} يوم` 
                    })}
                  </span>
                </div>
              </div>

              {/* Status Alert */}
              {(() => {
                const daysElapsed = Math.max(0, Math.floor((Date.now() - new Date(khatmahPlan.startDate).getTime()) / (1000 * 60 * 60 * 24)));
                const expectedPage = Math.min(604, Math.floor(daysElapsed * (604 / khatmahPlan.targetDays)));
                const isOnTrack = khatmahPlan.currentPage >= expectedPage;
                const behindDays = Math.ceil((expectedPage - khatmahPlan.currentPage) / (604 / khatmahPlan.targetDays));
                return (
                  <div className={cn(
                    "p-3 rounded-xl border flex items-center gap-2.5 text-xs",
                    isOnTrack 
                      ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-500" 
                      : "bg-amber-500/5 border-amber-500/10 text-amber-600 dark:text-amber-500"
                  )}>
                    {isOnTrack ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>
                      {isOnTrack 
                        ? t("khatmah.on_track", { defaultValue: "أنت تسير بشكل ممتاز!" }) 
                        : t("khatmah.behind", { days: behindDays, defaultValue: `متأخر بـ ${behindDays} يوم عن الجدول` })
                      }
                    </span>
                  </div>
                );
              })()}

              <div className="p-3 bg-muted/40 rounded-xl border border-transparent space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t("khatmah.daily_target", { defaultValue: "الورد اليومي المطلوب" })}:</span>
                  <span className="font-bold text-foreground">
                    {t("khatmah.pages_per_day", { 
                      pages: Math.ceil(604 / khatmahPlan.targetDays), 
                      defaultValue: `${Math.ceil(604 / khatmahPlan.targetDays)} صفحة يومياً` 
                    })}
                  </span>
                </div>
              </div>

              {/* Update progress form */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  {t("khatmah.current_page", { defaultValue: "الصفحة الحالية التي تقف عندها" })}
                </label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-xl border-primary/10 h-10 w-10 shrink-0"
                    onClick={() => handleUpdatePage(Math.max(0, khatmahPlan.currentPage - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min={0}
                    max={604}
                    value={inputPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 0 && val <= 604) {
                        setInputPage(val);
                      }
                    }}
                    onBlur={() => handleUpdatePage(inputPage)}
                    className="rounded-xl border-primary/10 bg-white/50 text-center font-bold tabular-nums"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-xl border-primary/10 h-10 w-10 shrink-0"
                    onClick={() => handleUpdatePage(Math.min(604, khatmahPlan.currentPage + 1))}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-xl h-10 px-4 text-xs shrink-0"
                    onClick={() => handleUpdatePage(inputPage)}
                  >
                    {t("common.done", { defaultValue: "تحديث" })}
                  </Button>
                </div>
              </div>

              {/* Reset button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs text-muted-foreground hover:text-destructive flex items-center justify-center gap-1.5"
                onClick={handleResetPlan}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t("khatmah.reset", { defaultValue: "إعادة تعيين الخطة" })}</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart: Last 7 Days Activity */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-heading font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>
              <TranslatedText
                text="نشاط العبادات في الـ 7 أيام الأخيرة"
                staticTranslation={getTranslation(t, "tracker.last_7_days", i18n.language) || undefined}
                keepArabic={false}
                inline
              />
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Custom SVG/CSS Bar Chart (Highly responsive, zero dependency, 100% build guarantee) */}
          <div className="h-48 flex items-end justify-between gap-2 pt-6">
            {stats.map((day) => {
              const maxCompletions = Math.max(...stats.map((s) => s.completions), 1);
              const heightPercent = (day.completions / maxCompletions) * 100;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip value */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground text-xs rounded px-2 py-1 absolute -translate-y-12 pointer-events-none shadow-sm font-semibold z-10 flex items-center gap-1">
                    <span>{day.completions}</span>
                    <TranslatedText
                      text="أذكار"
                      staticTranslation={getTranslation(t, "tracker.lists", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                    <span>/</span>
                    <span>{day.tasbih}</span>
                    <TranslatedText
                      text="تسبيحة"
                      staticTranslation={getTranslation(t, "tracker.tasbiha", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </div>

                  {/* Dual Bars */}
                  <div className="w-full flex items-end justify-center gap-1 h-32 relative">
                    {/* Adhkar Completed Bar */}
                    <div 
                      className="w-3 sm:w-4 bg-primary/80 rounded-t hover:bg-primary transition-all duration-500 cursor-pointer"
                      style={{ height: `${day.completions > 0 ? Math.max(heightPercent, 10) : 0}%` }}
                    />
                    {/* Tasbih Bar (Secondary color, scaled separately) */}
                    <div 
                      className="w-1.5 sm:w-2 bg-amber-500/80 rounded-t hover:bg-amber-500 transition-all duration-500 cursor-pointer"
                      style={{ height: `${day.tasbih > 0 ? Math.min((day.tasbih / 100) * 100, 100) : 0}%` }}
                    />
                  </div>

                  {/* Label */}
                  <span className="text-xs text-muted-foreground font-medium select-none">
                    {day.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-6 mt-6 border-t border-border/40 pt-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-primary rounded-sm" />
              <span className="text-muted-foreground">
                <TranslatedText
                  text="الأذكار المقروءة"
                  staticTranslation={getTranslation(t, "tracker.legend_adhkar", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-500 rounded-sm" />
              <span className="text-muted-foreground">
                <TranslatedText
                  text="التسبيح"
                  staticTranslation={getTranslation(t, "tracker.legend_tasbih", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Worship Badges / Goals */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-heading font-bold text-foreground flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span>
              <TranslatedText
                text="إنجازات وورد اليوم"
                staticTranslation={getTranslation(t, "tracker.badges", i18n.language) || undefined}
                keepArabic={false}
                inline
              />
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Badge items */}
          {[
            { key: "morning", label: "أذكار الصباح", labelKey: "tracker.morning_badge", desc: "حصن يومك بالذكر", descKey: "tracker.morning_desc" },
            { key: "evening", label: "أذكار المساء", labelKey: "tracker.evening_badge", desc: "احفظ ليلتك بذكر الله", descKey: "tracker.evening_desc" },
            { key: "sleep", label: "أذكار النوم", labelKey: "tracker.sleep_badge", desc: "اختم يومك بالآيات والأذكار", descKey: "tracker.sleep_desc" },
            { 
              key: "salawat", 
              label: "الصلاة على النبي ﷺ", 
              labelKey: "tracker.salawat_badge", 
              desc: `اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ (${salawatCount} مرة)`, 
              descKey: "tracker.salawat_desc", 
              isSalawat: true 
            },
          ].map((item) => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const todayKey = `${year}-${month}-${day}`;
            const allData = getTrackerData();
            
            const completedToday = item.isSalawat 
              ? salawatCount >= 100 
              : (allData[todayKey]?.categories.includes(item.key) || false);

            const rawTranslation = getTranslation(t, item.descKey, i18n.language);
            const staticTranslation = (item.isSalawat && rawTranslation)
              ? rawTranslation.replace("{{count}}", String(salawatCount))
              : (rawTranslation || undefined);

            return (
              <div 
                key={item.key} 
                className={cn(
                  "flex flex-col gap-2.5 p-3.5 rounded-xl border transition-all duration-300",
                  completedToday 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-muted/30 border-transparent hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-sm block text-foreground">
                      <TranslatedText
                        text={item.label}
                        staticTranslation={getTranslation(t, item.labelKey, i18n.language) || undefined}
                        keepArabic={false}
                      />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <TranslatedText
                        text={item.desc}
                        staticTranslation={staticTranslation}
                        keepArabic={false}
                      />
                    </span>
                  </div>
                  
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold select-none shrink-0",
                    completedToday 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {completedToday ? (
                      <TranslatedText
                        text="مكتمل"
                        staticTranslation={getTranslation(t, "common.completed", i18n.language) || undefined}
                        keepArabic={false}
                        inline
                      />
                    ) : (
                      <TranslatedText
                        text="غير مكتمل"
                        staticTranslation={getTranslation(t, "common.pending", i18n.language) || undefined}
                        keepArabic={false}
                        inline
                      />
                    )}
                  </span>
                </div>

                {item.isSalawat && (
                  <div className="w-full space-y-1 mt-1 border-t border-primary/10 pt-2">
                    <Progress value={Math.min((salawatCount / 100) * 100, 100)} className="h-1.5 rounded-full" />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                      <span>{t("tracker.salawat_progress_label", { defaultValue: "التقدم اليومي" })}</span>
                      <span className="tabular-nums font-bold text-primary">{salawatCount} / 100</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
