import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toHijri, formatHijriDate } from "@/lib/hijri";
import { BookOpen, Calendar, CheckCircle2, RotateCcw, Heart, Star, Sparkles } from "lucide-react";
import { TranslatedText } from "@/components/TranslatedText";
import { getTranslation } from "@/lib/content-i18n";
import { adhkarSunanMahjora } from "@/data/adhkar";

interface SunanTracker {
  fajr_pre: boolean;
  dhuhr_pre1: boolean;
  dhuhr_pre2: boolean;
  dhuhr_post: boolean;
  maghrib_post: boolean;
  isha_post: boolean;
  lastUpdated: string;
}

const DEFAULT_TRACKER: SunanTracker = {
  fajr_pre: false,
  dhuhr_pre1: false,
  dhuhr_pre2: false,
  dhuhr_post: false,
  maghrib_post: false,
  isha_post: false,
  lastUpdated: "",
};

export default function Sunan() {
  const { t, i18n } = useTranslation();
  const [tracker, setTracker] = useState<SunanTracker>(DEFAULT_TRACKER);
  const [hijri, setHijri] = useState(toHijri(new Date()));

  useEffect(() => {
    // Sync Hijri Date
    setHijri(toHijri(new Date()));

    // Load Tracker
    const todayKey = new Date().toDateString();
    const saved = localStorage.getItem("sunan_rawatib_tracker_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SunanTracker;
        if (parsed.lastUpdated === todayKey) {
          setTracker(parsed);
        } else {
          // Reset for a new day
          const resetTracker = { ...DEFAULT_TRACKER, lastUpdated: todayKey };
          setTracker(resetTracker);
          localStorage.setItem("sunan_rawatib_tracker_v1", JSON.stringify(resetTracker));
        }
      } catch {
        setTracker({ ...DEFAULT_TRACKER, lastUpdated: todayKey });
      }
    } else {
      setTracker({ ...DEFAULT_TRACKER, lastUpdated: todayKey });
    }
  }, []);

  const handleToggle = (key: keyof Omit<SunanTracker, "lastUpdated">) => {
    const todayKey = new Date().toDateString();
    const updated = {
      ...tracker,
      [key]: !tracker[key],
      lastUpdated: todayKey,
    };
    setTracker(updated);
    localStorage.setItem("sunan_rawatib_tracker_v1", JSON.stringify(updated));
  };

  const handleReset = () => {
    const todayKey = new Date().toDateString();
    const resetTracker = { ...DEFAULT_TRACKER, lastUpdated: todayKey };
    setTracker(resetTracker);
    localStorage.setItem("sunan_rawatib_tracker_v1", JSON.stringify(resetTracker));
  };

  // Calculate total completed rak'ahs
  const completedRakhas = 
    (tracker.fajr_pre ? 2 : 0) +
    (tracker.dhuhr_pre1 ? 2 : 0) +
    (tracker.dhuhr_pre2 ? 2 : 0) +
    (tracker.dhuhr_post ? 2 : 0) +
    (tracker.maghrib_post ? 2 : 0) +
    (tracker.isha_post ? 2 : 0);

  const percentComplete = (completedRakhas / 12) * 100;

  // Hijamah cupping days logic
  const isCuppingDay = hijri.day === 17 || hijri.day === 19 || hijri.day === 21;
  
  // Calculate days to next cupping day
  const getNextCuppingMessage = () => {
    const day = hijri.day;
    if (isCuppingDay) {
      return i18n.language === "ar" 
        ? `اليوم هو يوم ${day} من الشهر الهجري، وهو من الأيام المستحبة للحجامة!`
        : `Today is the ${day}th of the Hijri month, which is a recommended day for Hijamah!`;
    }

    let nextDay = 17;
    let inNextMonth = false;

    if (day < 17) {
      nextDay = 17;
    } else if (day < 19) {
      nextDay = 19;
    } else if (day < 21) {
      nextDay = 21;
    } else {
      nextDay = 17;
      inNextMonth = true;
    }

    const diff = inNextMonth ? (30 - day + nextDay) : (nextDay - day);

    if (i18n.language === "ar") {
      return `متبقي ${diff} ${diff === 1 ? "يوم" : diff === 2 ? "يومان" : "أيام"} على يوم الحجامة المستحب القادم (${nextDay} ${inNextMonth ? "من الشهر القادم" : "من الشهر الحالي"}).`;
    } else {
      return `${diff} ${diff === 1 ? "day" : "days"} left until the next recommended Hijamah day (${nextDay} ${inNextMonth ? "of next month" : "of this month"}).`;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8 max-w-2xl mx-auto pb-16">
      {/* Hero section */}
      <div className="text-center space-y-2 pt-4">
        <h2 className="text-3xl font-heading font-bold text-primary flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500 fill-amber-500" />
          <TranslatedText
            text="السنن النبوية"
            staticTranslation={getTranslation(t, "nav.sunan", i18n.language) || undefined}
            keepArabic={false}
            inline
          />
        </h2>
        <p className="text-muted-foreground text-sm">
          <TranslatedText
            text="إحياء سنن النبي ﷺ والمحافظة على النوافل والرواتب"
            staticTranslation={i18n.language === "ar" ? "إحياء سنن النبي ﷺ والمحافظة على النوافل والرواتب" : "Reviving the Sunnahs of the Prophet ﷺ and maintaining daily voluntary acts"}
            keepArabic={false}
          />
        </p>
      </div>

      {/* Sunan al-Rawatib Tracker */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <BookOpen className="w-32 h-32 rotate-12" />
        </div>
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
              <Star className="w-5 h-5 text-primary fill-primary/10" />
              <span>
                {i18n.language === "ar" ? "مُتتبع السنن الرواتب اليومية" : "Daily Sunan Rawatib Tracker"}
              </span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border/20 bg-background/40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t("dhikr.reset", { defaultValue: "إعادة تعيين" })}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                {i18n.language === "ar" ? "ركعات السنن الرواتب المنجزة" : "Completed Sunan Rak'ahs"}
              </span>
              <span className="font-bold text-primary tabular-nums">
                {completedRakhas} / 12
              </span>
            </div>
            <Progress value={percentComplete} className="h-2.5 rounded-full" />
          </div>

          {/* Checklist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { key: "fajr_pre", label: "سنة الفجر", labelSub: "ركعتان قبل الفريضة", count: 2 },
              { key: "dhuhr_pre1", label: "سنة الظهر القبلية (الأولى)", labelSub: "ركعتان قبل الفريضة", count: 2 },
              { key: "dhuhr_pre2", label: "سنة الظهر القبلية (الثانية)", labelSub: "ركعتان قبل الفريضة", count: 2 },
              { key: "dhuhr_post", label: "سنة الظهر البعدية", labelSub: "ركعتان بعد الفريضة", count: 2 },
              { key: "maghrib_post", label: "سنة المغرب البعدية", labelSub: "ركعتان بعد الفريضة", count: 2 },
              { key: "isha_post", label: "سنة العشاء البعدية", labelSub: "ركعتان بعد الفريضة", count: 2 },
            ].map((item) => {
              const active = tracker[item.key as keyof Omit<SunanTracker, "lastUpdated">];
              return (
                <div
                  key={item.key}
                  onClick={() => handleToggle(item.key as any)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
                    active
                      ? "bg-primary/5 border-primary/30 shadow-sm"
                      : "bg-background/40 border-border/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-sm block text-foreground">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      {item.labelSub}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {item.count} ركعات
                    </span>
                    <Checkbox
                      id={item.key}
                      checked={active}
                      onCheckedChange={() => {}} // handled by div click
                      className="rounded-md h-5 w-5 border-border/80 text-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground pointer-events-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Virtues of Sunan Rawatib */}
          <div className="p-4 bg-muted/30 border border-border/30 rounded-2xl space-y-2 mt-4">
            <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-primary/10" />
              <span>
                {i18n.language === "ar" ? "فضل المحافظة على السنن الرواتب" : "Virtue of Sunan al-Rawatib"}
              </span>
            </h4>
            <p className="text-xs text-foreground/90 leading-relaxed font-serif text-right" dir="rtl">
              "مَنْ صَلَّى فِي يَوْمٍ وَلَيْلَةٍ ثِنْتَيْ عَشْرَةَ رَكْعَةً بُنِيَ لَهُ بَيْتٌ فِي الْجَنَّةِ: أَرْبَعًا قَبْلَ الظُّهْرِ، وَرَكْعَتَيْنِ بَعْدَهَا، وَرَكْعَتَيْنِ بَعْدَ الْمَغْرِبِ، وَرَكْعَتَيْنِ بَعْدَ الْعِشَاءِ، وَرَكْعَتَيْنِ قَبْلَ صَلَاةِ الْغَدَاةِ."
            </p>
            <p className="text-[10px] text-muted-foreground text-right" dir="rtl">
              رواه مسلم والترمذي والنسائي عن أم حبيبة رضي الله عنها، وهو حديث صحيح
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hijamah Section */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Heart className="w-32 h-32 rotate-12" />
        </div>
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary fill-primary/10" />
            <span>
              {i18n.language === "ar" ? "فضل وأيام الحجامة المستحبة" : "Virtues & Days of Hijamah"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Hijri Calendar Status Check Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all duration-500 relative overflow-hidden ${
            isCuppingDay 
              ? "bg-gradient-to-br from-amber-500/15 to-amber-600/5 border-amber-500/30 text-amber-900 dark:text-amber-200" 
              : "bg-primary/5 border-primary/10 text-foreground"
          }`}>
            {isCuppingDay && (
              <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 rotate-45 pointer-events-none">
                <Sparkles className="w-6 h-6 text-amber-500 fill-amber-500/20" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isCuppingDay 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                  : "bg-primary/10 border-primary/20 text-primary"
              }`}>
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground block">
                  {i18n.language === "ar" ? "التاريخ الهجري اليوم" : "Today's Hijri Date"}
                </span>
                <span className="font-bold text-sm tracking-wide">
                  {formatHijriDate(hijri, i18n.language)}
                </span>
              </div>
            </div>
            <p className="text-xs font-semibold leading-relaxed border-t border-border/40 pt-3">
              {getNextCuppingMessage()}
            </p>
          </div>

          {/* Hijamah Ahadith List */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 px-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>
                {i18n.language === "ar" ? "الأحاديث الواردة في فضل الحجامة" : "Hadiths on the Virtues of Hijamah"}
              </span>
            </h4>

            <div className="space-y-3.5">
              {[
                {
                  text: "«خَيْرُ مَا تَدَاوَيْتُمْ بِهِ الْحِجَامَةُ»",
                  source: "رواه البخاري ومسلم عن أنس بن مالك رضي الله عنه، وهو حديث صحيح",
                },
                {
                  text: "«إِنَّ فِي الْحَجْمِ شِفَاءً»",
                  source: "رواه مسلم عن جابر بن عبد الله رضي الله عنهما، وهو حديث صحيح",
                },
                {
                  text: "«إِنْ كَانَ فِي شَيْءٍ مِنْ أَدْوِيَتِكُمْ خَيْرٌ، فَفِي شَرْطَةِ مِحْجَمٍ، أَوْ شَرْبَةِ عَسَلٍ، أَوْ كَيَّةٍ بِنَارٍ، وَمَا أُحِبُّ أَنْ أَكْتَوِيَ»",
                  source: "رواه البخاري ومسلم عن ابن عباس رضي الله عنهما، وهو حديث صحيح",
                },
              ].map((hadith, index) => (
                <div key={index} className="p-4 bg-muted/20 border border-border/20 rounded-2xl space-y-2">
                  <p className="text-sm font-medium leading-relaxed font-serif text-right text-foreground/90" dir="rtl">
                    {hadith.text}
                  </p>
                  <p className="text-[10px] text-muted-foreground text-right" dir="rtl">
                    {hadith.source}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Guidelines on cupping days */}
          <div className="p-4 bg-muted/30 border border-border/30 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {i18n.language === "ar" ? "أوقات الحجامة المستحبة" : "Recommended Hijamah Timing"}
              </span>
            </h4>
            <p className="text-xs text-foreground/80 leading-relaxed text-right" dir="rtl">
              المستحب في الحجامة العلاجية والوقائية أن تكون في الأيام الفردية من النصف الثاني من الشهر الهجري، وأفضلها هي الأيام: **17، 19، 21** من الشهر الهجري، لما ورد عن النبي ﷺ أن الحجامة فيها تكون أبلغ في النفع والشفاء بإذن الله تعالى.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* السنن النبوية المهجورة Section */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <BookOpen className="w-32 h-32 rotate-12" />
        </div>
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary fill-primary/10" />
            <span>
              {i18n.language === "ar" ? "السنن النبوية المهجورة" : "Forgotten Prophetic Sunnahs"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {i18n.language === "ar"
              ? "سنن وثوابت ثبتت عن النبي ﷺ هجرها كثير من الناس في حياتهم اليومية، وفي إحيائها أجر عظيم ونيل لمحبة الله ورسوله."
              : "Prophetic Sunnahs established from the Prophet ﷺ that many have neglected in daily life. Reviving them brings great reward."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {adhkarSunanMahjora.map((sunnah) => (
              <div
                key={sunnah.id}
                className="flex flex-col justify-between p-4 bg-muted/20 hover:bg-muted/30 border border-border/30 rounded-2xl transition-all duration-300 space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/15 text-primary">
                      {i18n.language === "ar" ? "سنة نبوية" : "Sunnah"}
                    </span>
                    {sunnah.count > 1 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        {sunnah.count} {i18n.language === "ar" ? "مرات" : "times"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold leading-relaxed font-serif text-right text-foreground/95" dir="rtl">
                    {sunnah.arabic}
                  </p>
                </div>
                
                <div className="space-y-2 border-t border-border/20 pt-2.5">
                  {sunnah.note && (
                    <div className="text-xs text-foreground/80 leading-relaxed bg-background/50 p-2.5 rounded-xl text-right" dir="rtl">
                      <span className="font-semibold text-primary block text-[10px] mb-0.5">
                        {i18n.language === "ar" ? "متى وكيف تقال/تفعل:" : "When & How to say/do:"}
                      </span>
                      {sunnah.note}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground text-right" dir="rtl">
                    {sunnah.source}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
