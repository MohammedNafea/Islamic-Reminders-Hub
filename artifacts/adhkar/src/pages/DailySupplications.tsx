import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  adhkarHouse,
  adhkarMasjid,
  adhkarClothes,
  adhkarRestroom,
  adhkarWudu,
  adhkarAthan,
  adhkarFood,
  adhkarTravel,
  adhkarSleep,
  adhkarPrayerActions,
  adhkarDailyLifeEvents,
  adhkarNature,
  adhkarOccasions,
  adhkarImmunization,
  adhkarGreatDays,
  adhkarDistressAndIllness,
  adhkarQuran
} from "@/data/adhkar";
import { DhikrList } from "@/components/DhikrList";
import { Home, Compass, Coffee, Shield, Moon, Clock, BookOpen, Sun, Star, HeartPulse, Landmark } from "lucide-react";
import { getTranslation } from "@/lib/content-i18n";
import { TranslatedText } from "@/components/TranslatedText";

type TabId = "house_masjid" | "clothes_wudu" | "food_athan" | "travel" | "sleep_events" | "prayer_actions" | "occasions_nature" | "great_days" | "distress_illness" | "quran_duas";

interface TabItem {
  id: TabId;
  labelAr: string;
  labelEn: string;
  Icon: React.ComponentType<{ className?: string }>;
}

export default function DailySupplications() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab") as TabId;
    const validTabs: TabId[] = ["house_masjid", "clothes_wudu", "food_athan", "travel", "sleep_events", "prayer_actions", "occasions_nature", "great_days", "distress_illness", "quran_duas"];
    if (tabParam && validTabs.includes(tabParam)) {
      return tabParam;
    }
    return "house_masjid";
  });

  // Watch for tab parameter changes in URL (e.g. back/forward navigation)
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as TabId;
      const validTabs: TabId[] = ["house_masjid", "clothes_wudu", "food_athan", "travel", "sleep_events", "prayer_actions", "occasions_nature", "great_days", "distress_illness", "quran_duas"];
      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    };
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  // Update tab parameter in URL when activeTab changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") !== activeTab) {
      params.set("tab", activeTab);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [activeTab]);

  // Scroll to top when active tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
  }, [activeTab]);

  const tabs: TabItem[] = [
    { id: "house_masjid", labelAr: "البيت والمسجد", labelEn: "Home & Mosque", Icon: Home },
    { id: "clothes_wudu", labelAr: "اللباس، الخلاء والوضوء", labelEn: "Clothing, Restroom & Wudu", Icon: Shield },
    { id: "food_athan", labelAr: "الأكل والأذان", labelEn: "Food & Athan", Icon: Coffee },
    { id: "travel", labelAr: "السفر والتنقل", labelEn: "Travel & Commute", Icon: Compass },
    { id: "sleep_events", labelAr: "النوم واليقظة", labelEn: "Sleep & Waking", Icon: Moon },
    { id: "prayer_actions", labelAr: "أفعال الصلاة", labelEn: "Prayer Actions", Icon: BookOpen },
    { id: "occasions_nature", labelAr: "المناسبات والظواهر", labelEn: "Occasions & Nature", Icon: Sun },
    { id: "distress_illness", labelAr: "الكرب والمرض والاستجابة", labelEn: "Distress, Illness & Answered", Icon: HeartPulse },
    { id: "great_days", labelAr: "الأيام والليالي العظيمة", labelEn: "Virtuous Days & Nights", Icon: Star },
    { id: "quran_duas", labelAr: "الأدعية من القرآن الكريم", labelEn: "Quranic Duas", Icon: Landmark }
  ];

  // Get sleep-related waking/night events
  const sleepEvents = useMemo(() => {
    return adhkarSleep.filter(d =>
      d.id.startsWith("sleep_waking") ||
      d.id.startsWith("sleep_faza") ||
      d.id === "sleep_taqallub" ||
      d.id === "sleep_bad_dream"
    );
  }, []);

  const currentAdhkar = useMemo(() => {
    switch (activeTab) {
      case "house_masjid":
        return [...adhkarHouse, ...adhkarMasjid];
      case "clothes_wudu":
        return [...adhkarClothes, ...adhkarRestroom, ...adhkarWudu];
      case "food_athan":
        return [...adhkarFood, ...adhkarAthan];
      case "travel":
        return adhkarTravel;
      case "sleep_events":
        return sleepEvents;
      case "prayer_actions":
        return adhkarPrayerActions;
      case "occasions_nature":
        return [...adhkarDailyLifeEvents, ...adhkarNature, ...adhkarOccasions, ...adhkarImmunization];
      case "distress_illness":
        return adhkarDistressAndIllness;
      case "great_days":
        return adhkarGreatDays;
      case "quran_duas":
        return adhkarQuran;
      default:
        return [];
    }
  }, [activeTab, sleepEvents]);

  const currentTitleKey = useMemo(() => {
    switch (activeTab) {
      case "house_masjid":
        return "nav.house";
      case "clothes_wudu":
        return "nav.daily_supplications";
      case "food_athan":
        return "nav.daily_supplications";
      case "travel":
        return "nav.daily_supplications";
      case "sleep_events":
        return "nav.sleep";
      case "prayer_actions":
        return "nav.daily_supplications";
      case "occasions_nature":
        return "nav.daily_supplications";
      case "great_days":
        return "nav.daily_supplications";
      case "quran_duas":
        return "nav.quran_duas";
      default:
        return "nav.daily_supplications";
    }
  }, [activeTab]);

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        <h2 className="text-3xl font-heading font-bold text-primary flex items-center justify-center gap-2">
          <Clock className="w-6 h-6 text-amber-500 fill-amber-500/10" />
          <TranslatedText
            text="أذكار اليوم والليلة"
            staticTranslation={getTranslation(t, "nav.daily_supplications", i18n.language) || undefined}
            keepArabic={false}
            inline
          />
        </h2>
        <p className="text-muted-foreground text-sm">
          <TranslatedText
            text="أدعية المسلم وأذكاره اليومية في مختلف أحواله ومواقفه"
            staticTranslation={i18n.language === "ar" ? "أدعية المسلم وأذكاره اليومية في مختلف أحواله ومواقفه" : "A Muslim's daily supplications for all events and occasions"}
            keepArabic={false}
          />
        </p>
      </div>

      {/* Tabs list (Horizontal scroll on mobile) */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        <div className="flex gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/40 min-w-max mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold select-none transition-all duration-300 ${isActive
                    ? "text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-primary rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <tab.Icon className="w-4 h-4 shrink-0" />
                  <span>
                    <TranslatedText
                      text={tab.labelAr}
                      staticTranslation={i18n.language === "ar" ? tab.labelAr : tab.labelEn}
                      keepArabic={false}
                      inline
                    />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Supplication lists container */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            <DhikrList
              adhkar={currentAdhkar}
              titleKey={currentTitleKey}
              isEvening={false}
              compact
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
