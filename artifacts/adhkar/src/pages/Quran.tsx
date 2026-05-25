import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Play, Pause, ChevronRight, Clock, BookOpen, Bookmark, BookmarkCheck, Copy, SkipForward, SkipBack, Volume2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getQuranEditionForLanguage, isArabic, getTextDirection, isRTL } from "@/lib/content-i18n";
import QuranSearch from "@/components/QuranSearch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { localDB } from "@/lib/db";
import { useLocation } from "wouter";
import { TranslatedText } from "@/components/TranslatedText";
import { RECITERS } from "@/data/reciters";


const normalizeArabic = (text: string) => {
  if (!text) return "";
  let normalized = text
    .replace(/[\u064B-\u0652]/g, "") // remove diacritics
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase();
  normalized = normalized.replace(/^(سوره|سورة)\s+/, "");
  return normalized.trim();
};

const cleanBismillah = (text: string) => {
  if (!text) return "";
  
  const bismillahs = [
    "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
    "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ",
    "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ"
  ];
  
  let cleanedText = text;
  for (const bish of bismillahs) {
    if (cleanedText.startsWith(bish)) {
      const remaining = cleanedText.slice(bish.length).trim();
      if (remaining.length > 0) {
        cleanedText = remaining;
        break;
      }
    }
  }
  return cleanedText;
};


interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface Ayah {
  number: number;
  text: string;
  audio: string;
  numberInSurah: number;
  translatedText?: string;
  translationEdition?: string;
}

interface Tafsir {
  text: string;
}

interface QuranBookmark {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
}

export default function Quran() {
  const { t, i18n } = useTranslation();
  const rtl = isRTL(i18n.language);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSurah, setActiveSurah] = useState<number | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [tafsirJalalayn, setTafsirJalalayn] = useState<Tafsir[]>([]);
  const [tafsirMuyassar, setTafsirMuyassar] = useState<Tafsir[]>([]);
  const [selectedTafsir, setSelectedTafsir] = useState<"muyassar" | "jalalayn" | "both" | "none">("muyassar");

  // Audio state
  const [selectedQariId, setSelectedQariId] = useState<string>(() => {
    return localStorage.getItem("quran_selected_qari") || "husary";
  });
  const selectedQari = RECITERS.find(q => q.id === selectedQariId) || RECITERS[0];
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeAyahIndex, setActiveAyahIndex] = useState<number | null>(null);
  const [playingSingleAyahId, setPlayingSingleAyahId] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const audioRef = useRef(new Audio());
  const audio = audioRef.current;

  const [lastRead, setLastRead] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTafsirAyah, setSelectedTafsirAyah] = useState<Ayah | null>(null);
  const ayahRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const [, setLocation] = useLocation();
  const queryParams = new URLSearchParams(window.location.search);
  const surahParam = queryParams.get("surah") || queryParams.get("sura");
  const ayahParam = queryParams.get("ayah") || queryParams.get("verse");
  const [scrollToAyahNum, setScrollToAyahNum] = useState<number | null>(null);

  // Sync playback speed
  useEffect(() => {
    audio.playbackRate = playbackSpeed;
  }, [playbackSpeed, audio]);

  // Audio event listeners
  useEffect(() => {
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    const handlePause = () => {
      setIsPlaying(false);
    };
    const handlePlay = () => {
      setIsPlaying(true);
      window.dispatchEvent(new CustomEvent("stop-all-audio", { detail: { sender: "quran" } }));
    };
    const handleStopAllAudio = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.sender !== "quran") {
        audio.pause();
        setIsPlaying(false);
        setPlayingSingleAyahId(null);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    window.addEventListener("stop-all-audio", handleStopAllAudio);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      window.removeEventListener("stop-all-audio", handleStopAllAudio);
    };
  }, [audio]);

  // Audio ended listener
  useEffect(() => {
    const handleEnded = () => {
      if (selectedQari.type === "ayah" && activeAyahIndex !== null) {
        if (autoplay && activeAyahIndex < ayahs.length - 1) {
          const nextIndex = activeAyahIndex + 1;
          setActiveAyahIndex(nextIndex);
          audio.src = ayahs[nextIndex].audio;
          audio.play().catch(err => console.log("Autoplay blocked", err));
        } else {
          setIsPlaying(false);
          setActiveAyahIndex(null);
        }
      } else {
        setIsPlaying(false);
        setPlayingSingleAyahId(null);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audio, selectedQari, activeAyahIndex, autoplay, ayahs]);

  const getSurahAudioUrl = (reciter: typeof selectedQari, surahNumber: number) => {
    const padded = String(surahNumber).padStart(3, "0");
    return `${reciter.surahBaseUrl}${padded}.mp3`;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (selectedQari.type === "ayah") {
        let indexToPlay = activeAyahIndex;
        if (indexToPlay === null) {
          indexToPlay = 0;
          setActiveAyahIndex(0);
        }
        if (ayahs[indexToPlay]) {
          audio.src = ayahs[indexToPlay].audio;
          audio.play().catch(err => console.log("Play failed", err));
          setIsPlaying(true);
        }
      } else {
        const surahUrl = getSurahAudioUrl(selectedQari, activeSurah || 1);
        if (audio.src !== surahUrl) {
          audio.src = surahUrl;
        }
        audio.play().catch(err => console.log("Play failed", err));
        setIsPlaying(true);
      }
    }
  };

  const skipNext = () => {
    if (selectedQari.type === "ayah" && activeAyahIndex !== null) {
      if (activeAyahIndex < ayahs.length - 1) {
        const nextIndex = activeAyahIndex + 1;
        setActiveAyahIndex(nextIndex);
        audio.src = ayahs[nextIndex].audio;
        audio.play().catch(err => console.log("Play failed", err));
        setIsPlaying(true);
      }
    } else {
      audio.currentTime = Math.min(audio.currentTime + 10, duration);
    }
  };

  const skipPrev = () => {
    if (selectedQari.type === "ayah" && activeAyahIndex !== null) {
      if (activeAyahIndex > 0) {
        const prevIndex = activeAyahIndex - 1;
        setActiveAyahIndex(prevIndex);
        audio.src = ayahs[prevIndex].audio;
        audio.play().catch(err => console.log("Play failed", err));
        setIsPlaying(true);
      }
    } else {
      audio.currentTime = Math.max(audio.currentTime - 10, 0);
    }
  };

  // Auto scroll to active ayah card
  useEffect(() => {
    if (selectedQari.type === "ayah" && activeAyahIndex !== null && autoScroll) {
      const activeAyah = ayahs[activeAyahIndex];
      if (activeAyah) {
        const el = ayahRefs.current[activeAyah.numberInSurah];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }, [activeAyahIndex, autoScroll, selectedQari, ayahs]);

  useEffect(() => {
    const stored = localDB.getLastRead(null);
    if (stored) setLastRead(stored);

    const storedBookmarks = localDB.getBookmarks<QuranBookmark[]>([]);
    setBookmarks(storedBookmarks);

    fetch("https://api.alquran.cloud/v1/surah")
      .then(res => res.json())
      .then(data => {
        setSurahs(data.data);
        setLoading(false);
      });

    const currentAudio = audioRef.current;
    return () => {
      currentAudio.pause();
    };
  }, []);

  const fetchSurahAyahs = (number: number) => {
    setLoading(true);
    setAyahs([]);
    setTafsirJalalayn([]);
    setTafsirMuyassar([]);
    
    localDB.saveLastRead(number);
    setLastRead(number);
    
    // Determine translation edition based on current language
    const translationEdition = getQuranEditionForLanguage(i18n.language) || "en.sahih";
    
    // Fallback to husary if selected reciter is Surah-based, so we get valid ayah audio and text
    const audioEdition = selectedQari.type === "ayah" && selectedQari.audioEditionId 
      ? selectedQari.audioEditionId 
      : "ar.husary";
    
    // Fetch audio, Jalalayn, Muyassar, and language-specific Translation
    const fetches = [
      fetch(`https://api.alquran.cloud/v1/surah/${number}/${audioEdition}`).then(res => res.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${number}/ar.jalalayn`).then(res => res.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${number}/ar.muyassar`).then(res => res.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${number}/${translationEdition}`).then(res => res.json())
    ];
    
    Promise.all(fetches).then(([audioData, jalalaynData, muyassarData, transData]) => {
      if (audioData?.data && jalalaynData?.data && muyassarData?.data && transData?.data) {
        const enrichedAyahs = audioData.data.ayahs.map((a: Ayah, i: number) => ({
          ...a,
          translatedText: transData.data.ayahs[i].text,
          translationEdition
        }));
        setAyahs(enrichedAyahs);
        setTafsirJalalayn(jalalaynData.data.ayahs || []);
        setTafsirMuyassar(muyassarData.data.ayahs || []);
        setActiveSurah(number);
        
        // Reset player states
        audio.pause();
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setActiveAyahIndex(null);
        setPlayingSingleAyahId(null);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  // Refetch if the reciter is changed while reading a Surah
  useEffect(() => {
    if (activeSurah !== null) {
      fetchSurahAyahs(activeSurah);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQariId]);

  useEffect(() => {
    if (surahParam) {
      let surahNum = parseInt(surahParam, 10);
      if (isNaN(surahNum) && surahs.length > 0) {
        const clean = (str: string) => normalizeArabic(str).replace(/[^a-zA-Z0-9\u0621-\u064A]/g, "").toLowerCase();
        const normSearch = clean(decodeURIComponent(surahParam));
        const found = surahs.find(s => 
          clean(s.name) === normSearch || 
          clean(s.englishName) === normSearch
        );
        if (found) {
          surahNum = found.number;
        }
      }
      if (surahNum && surahNum >= 1 && surahNum <= 114) {
        fetchSurahAyahs(surahNum);
      }
    } else {
      if (activeSurah !== null) {
        audio.pause();
        setActiveSurah(null);
        setAyahs([]);
        setTafsirJalalayn([]);
        setTafsirMuyassar([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahParam, surahs, i18n.language]);

  useEffect(() => {
    if (ayahParam) {
      const ayahNum = parseInt(ayahParam, 10);
      if (!isNaN(ayahNum)) {
        setScrollToAyahNum(ayahNum);
      }
    } else {
      setScrollToAyahNum(null);
    }
  }, [ayahParam]);

  useEffect(() => {
    if (!loading && ayahs.length > 0 && scrollToAyahNum !== null) {
      const el = ayahRefs.current[scrollToAyahNum];
      if (el) {
        const timer = setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-4", "ring-primary/40", "transition-all", "duration-500");
          const removeTimer = setTimeout(() => {
            el.classList.remove("ring-4", "ring-primary/40");
          }, 2000);
          setScrollToAyahNum(null);
          return () => clearTimeout(removeTimer);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, ayahs, scrollToAyahNum]);

  const playAyah = (ayah: Ayah, index: number) => {
    if (selectedQari.type === "ayah") {
      if (activeAyahIndex === index && isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        if (playingSingleAyahId !== null) {
          setPlayingSingleAyahId(null);
        }
        setActiveAyahIndex(index);
        audio.src = ayah.audio;
        audio.play().catch(err => console.log("Play failed", err));
        setIsPlaying(true);
      }
    } else {
      if (playingSingleAyahId === ayah.number && isPlaying) {
        audio.pause();
        setIsPlaying(false);
        setPlayingSingleAyahId(null);
      } else {
        audio.pause();
        audio.src = ayah.audio; // Mahmoud Khalil Al-Husary
        audio.play().catch(err => console.log("Play failed", err));
        setPlayingSingleAyahId(ayah.number);
        setIsPlaying(true);
      }
    }
  };


  const toggleBookmark = (ayah: Ayah, surah: Surah) => {
    const isBookmarked = bookmarks.some(b => b.surahNumber === surah.number && b.ayahNumber === ayah.numberInSurah);
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = bookmarks.filter(b => !(b.surahNumber === surah.number && b.ayahNumber === ayah.numberInSurah));
      toast({
        description: t("quran.bookmark_removed", { defaultValue: "تم إزالة الآية من المحفوظات" }),
      });
    } else {
      newBookmarks = [...bookmarks, {
        surahNumber: surah.number,
        surahName: surah.name,
        ayahNumber: ayah.numberInSurah,
        text: ayah.text
      }];
      toast({
        description: t("quran.bookmark_added", { defaultValue: "تم حفظ الآية بنجاح" }),
      });
    }
    setBookmarks(newBookmarks);
    localDB.saveBookmarks(newBookmarks);
  };

  const normalizedQuery = normalizeArabic(searchQuery);
  const filteredSurahs = surahs.filter(s => {
    if (!searchQuery.trim()) return true;
    const normalizedName = normalizeArabic(s.name);
    const queryLower = searchQuery.toLowerCase();
    return normalizedName.includes(normalizedQuery) || 
           s.englishName.toLowerCase().includes(queryLower) ||
           s.englishNameTranslation.toLowerCase().includes(queryLower);
  });

  if (activeSurah && ayahs.length > 0) {
    const currentSurah = surahs.find(s => s.number === activeSurah);
    if (!currentSurah) return null;

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-80 md:pb-48">
        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-card/90 p-4 rounded-[2rem] border border-primary/5 backdrop-blur-md sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] md:top-4 z-20 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" onClick={() => { audio.pause(); setActiveSurah(null); }} className="rounded-full h-12 w-12 p-0 bg-white shadow-sm hover:bg-primary/5 text-primary">
              <ChevronRight className={cn("w-6 h-6", i18n.language !== 'ar' && "rotate-180")} />
            </Button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold font-heading text-primary">{i18n.language === 'ar' ? currentSurah?.name : currentSurah?.englishName}</h2>
              <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                <span>{currentSurah?.numberOfAyahs} {t("common.ayahs")}</span>
                <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                <span>{currentSurah?.revelationType === "Meccan" ? t("quran.meccan") : t("quran.medinan")}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 border-primary/10 hover:bg-primary/5 text-primary bg-white shadow-sm"
              onClick={() => setIsSearchOpen(true)}
              title={t("quran.search_in_surah", { defaultValue: "البحث في السورة" })}
            >
              <Search className="w-4 h-4" />
            </Button>
            
            <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl">
              <Button 
                variant={selectedTafsir === "muyassar" ? "secondary" : "ghost"} 
                size="sm" 
                className={cn("rounded-lg text-[10px] h-8 px-2.5", selectedTafsir === "muyassar" && "bg-white shadow-sm font-bold text-primary")}
                onClick={() => setSelectedTafsir("muyassar")}
              >
                {t("quran.tafsir_muyassar")}
              </Button>
              <Button 
                variant={selectedTafsir === "jalalayn" ? "secondary" : "ghost"} 
                size="sm" 
                className={cn("rounded-lg text-[10px] h-8 px-2.5", selectedTafsir === "jalalayn" && "bg-white shadow-sm font-bold text-primary")}
                onClick={() => setSelectedTafsir("jalalayn")}
              >
                {t("quran.tafsir_jalalayn")}
              </Button>
              <Button 
                variant={selectedTafsir === "both" ? "secondary" : "ghost"} 
                size="sm" 
                className={cn("rounded-lg text-[10px] h-8 px-2.5", selectedTafsir === "both" && "bg-white shadow-sm font-bold text-primary")}
                onClick={() => setSelectedTafsir("both")}
              >
                {t("quran.tafsir_both", { defaultValue: "مقارنة" })}
              </Button>
              <Button 
                variant={selectedTafsir === "none" ? "secondary" : "ghost"} 
                size="sm" 
                className={cn("rounded-lg text-[10px] h-8 px-2.5", selectedTafsir === "none" && "bg-white shadow-sm font-bold text-primary")}
                onClick={() => setSelectedTafsir("none")}
              >
                {t("quran.hide_tafsir", { defaultValue: "إخفاء" })}
              </Button>
            </div>
          </div>
        </div>

        {/* Bismillah for non-Fatiha/Tawbah */}
        {activeSurah !== 1 && activeSurah !== 9 && (
          <div className="text-center py-8">
            <p className="dhikr-text text-3xl text-primary opacity-80">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          </div>
        )}

        <div className="space-y-4">
          {ayahs.map((ayah, index) => {
            const isAyahPlaying = 
              (selectedQari.type === "ayah" && activeAyahIndex === index && isPlaying) ||
              (selectedQari.type === "surah" && playingSingleAyahId === ayah.number && isPlaying);
            return (
              <Card 
                key={ayah.number} 
                ref={el => { ayahRefs.current[ayah.numberInSurah] = el; }}
                className={cn(
                  "border-none shadow-sm transition-all duration-300 rounded-[2rem] overflow-hidden",
                  isAyahPlaying ? "bg-primary/5 ring-1 ring-primary/20 shadow-md scale-[1.01]" : "bg-card/60 backdrop-blur-sm"
                )}
              >
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant={isAyahPlaying ? "default" : "secondary"} 
                        className={cn("rounded-full w-12 h-12 shadow-sm transition-all", isAyahPlaying ? "bg-primary text-white" : "bg-white hover:bg-primary/5 text-primary")}
                        onClick={() => playAyah(ayah, index)}
                      >
                        {isAyahPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </Button>
                      <Button 
                        size="icon" 
                        variant="secondary"
                        className="rounded-full w-12 h-12 bg-white shadow-sm hover:bg-primary/5 text-primary"
                        onClick={() => toggleBookmark(ayah, currentSurah)}
                        title={t("quran.bookmark", { defaultValue: "حفظ علامة" })}
                      >
                      {bookmarks.some(b => b.surahNumber === currentSurah.number && b.ayahNumber === ayah.numberInSurah) ? (
                        <BookmarkCheck className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="secondary"
                      className="rounded-full w-12 h-12 bg-white shadow-sm hover:bg-primary/5 text-primary"
                      onClick={() => setSelectedTafsirAyah(ayah)}
                      title={t("quran.view_tafsir", { defaultValue: "عرض التفسير والتدبر" })}
                    >
                      <BookOpen className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-[1px] w-8 bg-primary/20" />
                    <span className="text-primary font-black text-xs tabular-nums bg-primary/10 px-3 py-1 rounded-full">
                      {ayah.numberInSurah}
                    </span>
                  </div>
                </div>
                {/* Arabic original — always shown */}
                <p className="dhikr-text text-4xl leading-[1.8] md:leading-[2] text-foreground font-medium text-right" dir="rtl">
                  {ayah.text ? cleanBismillah(ayah.text) : ""}
                </p>
                {/* Translation — shown for non-Arabic languages */}
                 {!isArabic(i18n.language) && ayah.translatedText && (
                   <p 
                     className={cn("text-muted-foreground text-lg leading-relaxed border-t border-border/30 pt-4", isRTL(i18n.language) ? "text-right" : "text-left")} 
                     dir={getTextDirection(i18n.language)}
                   >
                     {ayah.translatedText}
                   </p>
                 )}
                
                {selectedTafsir !== "none" && (
                  <div className="pt-6 mt-6 border-t border-primary/5 -mx-6 px-6 space-y-4">
                    {(selectedTafsir === "muyassar" || selectedTafsir === "both") && tafsirMuyassar[ayah.numberInSurah - 1] && (
                      <div className="bg-amber-500/5 p-4 rounded-2xl text-right border border-amber-500/10" dir="rtl">
                        <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5">
                          {t("quran.tafsir_muyassar")}
                        </h4>
                        <TranslatedText
                          text={tafsirMuyassar[ayah.numberInSurah - 1].text}
                          keepArabic={false}
                          className="text-muted-foreground text-sm leading-relaxed"
                        />
                      </div>
                    )}
                    {(selectedTafsir === "jalalayn" || selectedTafsir === "both") && tafsirJalalayn[ayah.numberInSurah - 1] && (
                      <div className="bg-primary/5 p-4 rounded-2xl text-right border border-primary/10" dir="rtl">
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">
                          {t("quran.tafsir_jalalayn")}
                        </h4>
                        <TranslatedText
                          text={tafsirJalalayn[ayah.numberInSurah - 1].text}
                          keepArabic={false}
                          className="text-muted-foreground text-sm leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

        <QuranSearch
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          ayahs={ayahs}
          onAyahClick={(num) => setLocation(`/quran?surah=${activeSurah}&ayah=${num}`)}
          surahName={i18n.language === 'ar' ? currentSurah.name : currentSurah.englishName}
        />

        {selectedTafsirAyah && (
          <Dialog open={true} onOpenChange={() => setSelectedTafsirAyah(null)}>
            <DialogContent className="max-w-xl rounded-[2rem] p-6 gap-4 bg-card/95 backdrop-blur-md border-primary/10 max-h-[85vh] overflow-y-auto">
              <DialogHeader className="text-start border-b border-primary/5 pb-3">
                <DialogTitle className="text-xl font-bold font-heading text-primary">
                  {t("quran.tafsir_title", { defaultValue: "تفسير وتدبر الآية" })} {selectedTafsirAyah.numberInSurah}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="bg-primary/5 p-4 rounded-2xl text-right" dir="rtl">
                  <p className="dhikr-text text-2xl leading-relaxed text-foreground">
                    {cleanBismillah(selectedTafsirAyah.text)}
                  </p>
                </div>

                {selectedTafsirAyah.translatedText && !isArabic(i18n.language) && (
                  <div 
                    className={cn("bg-muted/30 p-4 rounded-2xl", isRTL(i18n.language) ? "text-right" : "text-left")} 
                    dir={getTextDirection(i18n.language)}
                  >
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedTafsirAyah.translatedText}
                    </p>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  {tafsirMuyassar[selectedTafsirAyah.numberInSurah - 1] && (
                    <div className="border border-amber-500/10 bg-amber-500/5 p-4 rounded-2xl text-right" dir="rtl">
                      <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5">{t("quran.tafsir_muyassar")}</h4>
                      <TranslatedText
                        text={tafsirMuyassar[selectedTafsirAyah.numberInSurah - 1].text}
                        keepArabic={false}
                        className="text-sm text-foreground leading-relaxed"
                      />
                    </div>
                  )}

                  {tafsirJalalayn[selectedTafsirAyah.numberInSurah - 1] && (
                    <div className="border border-primary/10 bg-primary/5 p-4 rounded-2xl text-right" dir="rtl">
                      <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">{t("quran.tafsir_jalalayn")}</h4>
                      <TranslatedText
                        text={tafsirJalalayn[selectedTafsirAyah.numberInSurah - 1].text}
                        keepArabic={false}
                        className="text-sm text-foreground leading-relaxed"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const textToCopy = `الآية: ${selectedTafsirAyah.text}\n\nتفسير الميسر:\n${tafsirMuyassar[selectedTafsirAyah.numberInSurah - 1]?.text || ""}\n\nتفسير الجلالين:\n${tafsirJalalayn[selectedTafsirAyah.numberInSurah - 1]?.text || ""}`;
                      navigator.clipboard.writeText(textToCopy);
                      toast({
                        description: t("quran.tafsir_copied", { defaultValue: "تم نسخ النص والتفسير" }),
                      });
                    }}
                    className="rounded-xl gap-2 text-xs"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{t("common.copy", { defaultValue: "نسخ التفسير" })}</span>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Floating bottom audio player */}
        <div className={cn(
          "fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-4 right-4 z-40 bg-card/90 backdrop-blur-md border border-primary/10 rounded-[2.5rem] shadow-xl p-4 md:p-5 flex flex-col gap-3 animate-in slide-in-from-bottom duration-300",
          // On desktop, center relative to the main content area (accounting for the 64-width sidebar)
          rtl 
            ? "md:left-[calc(50%-8rem)] md:right-auto md:-translate-x-1/2 md:w-[calc(100vw-16rem-2rem)] md:max-w-3xl"
            : "md:left-[calc(50%+8rem)] md:right-auto md:-translate-x-1/2 md:w-[calc(100vw-16rem-2rem)] md:max-w-3xl"
        )}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Info */}
            <div className="flex items-center gap-2 justify-between md:justify-start">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {isPlaying ? (
                    <span className="flex gap-0.5 items-end h-4">
                      <span className="w-0.5 bg-primary rounded-full animate-bounce h-3" style={{ animationDelay: '0.1s' }} />
                      <span className="w-0.5 bg-primary rounded-full animate-bounce h-4" style={{ animationDelay: '0.3s' }} />
                      <span className="w-0.5 bg-primary rounded-full animate-bounce h-2" style={{ animationDelay: '0.5s' }} />
                    </span>
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground whitespace-nowrap">
                    {selectedQari.type === "ayah" && activeAyahIndex !== null 
                      ? `${t("quran.ayah", { defaultValue: "آية" })} ${ayahs[activeAyahIndex].numberInSurah}`
                      : t("quran_audio.playing_surah", { defaultValue: "تشغيل السورة" })}
                  </h4>
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {i18n.language === "ar" ? selectedQari.name : selectedQari.englishName}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Play controls */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full text-primary hover:bg-primary/5"
                onClick={skipPrev}
                title={t("quran_audio.prev_ayah")}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-white shadow-md"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full text-primary hover:bg-primary/5"
                onClick={skipNext}
                title={t("quran_audio.next_ayah")}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Right: Selectors (Reciter & Speed) */}
            <div className="flex items-center justify-between md:justify-end gap-3">
              {/* Reciter selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground hidden sm:inline whitespace-nowrap">{t("quran_audio.reciter")}:</span>
                <Select value={selectedQariId} onValueChange={(val) => {
                  setSelectedQariId(val);
                  localStorage.setItem("quran_selected_qari", val);
                }}>
                  <SelectTrigger className="w-[130px] sm:w-[150px] h-8 rounded-xl border-primary/10 bg-white/50 text-[11px]">
                    <SelectValue placeholder={t("quran.select_reciter", { defaultValue: "اختر القارئ" })} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {RECITERS.map((q) => (
                      <SelectItem key={q.id} value={q.id} className="text-[11px]">
                        {i18n.language === "ar" ? q.name : q.englishName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Playback speed */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground hidden sm:inline whitespace-nowrap">{t("quran_audio.playback_speed")}:</span>
                <Select 
                  value={String(playbackSpeed)} 
                  onValueChange={(val) => setPlaybackSpeed(parseFloat(val))}
                >
                  <SelectTrigger className="w-[75px] h-8 rounded-xl border-primary/10 bg-white/50 text-[10px]">
                    <SelectValue placeholder="1x" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["0.5", "0.75", "1", "1.25", "1.5", "2"].map((speed) => (
                      <SelectItem key={speed} value={speed} className="text-[10px]">
                        {speed}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Configuration Switches Row (only for ayah-by-ayah mode) */}
          {selectedQari.type === "ayah" && (
            <div className="flex items-center justify-center md:justify-end gap-6 pt-2 border-t border-primary/5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">{t("quran_audio.autoplay")}</span>
                <Switch
                  checked={autoplay}
                  onCheckedChange={setAutoplay}
                  className="scale-75"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">{t("quran_audio.autoscroll")}</span>
                <Switch
                  checked={autoScroll}
                  onCheckedChange={setAutoScroll}
                  className="scale-75"
                />
              </div>
            </div>
          )}

          {/* Time slider / seekbar */}
          <div className="flex items-center gap-3 px-1">
            <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  audio.currentTime = val;
                  setCurrentTime(val);
                }}
                className="w-full h-1 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <div className="text-center space-y-3 pt-6">
        <h2 className="text-4xl font-heading font-bold text-primary">{t("nav.quran")}</h2>
        <p className="text-muted-foreground text-lg">{t("quran.subtitle")}</p>
      </div>

      <div className="relative group max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          className="pl-12 h-14 rounded-2xl border-primary/10 bg-card/50 backdrop-blur-sm"
          placeholder={t("nav.quran") + "..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {lastRead && !searchQuery && surahs.find(s => s.number === lastRead) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl mx-auto"
        >
          <Card 
            onClick={() => fetchSurahAyahs(lastRead)}
            className="cursor-pointer border-none shadow-md bg-primary text-primary-foreground overflow-hidden relative group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
              <BookOpen className="w-24 h-24 rotate-12" />
            </div>
            <CardContent className="p-6 flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">{t("quran.last_read") || "آخر قراءة"}</p>
                <h3 className="text-2xl font-bold font-heading">
                  {i18n.language === 'ar' ? surahs.find(s => s.number === lastRead)?.name : surahs.find(s => s.number === lastRead)?.englishName}
                </h3>
                <p className="text-white/80 text-sm mt-1">
                  {surahs.find(s => s.number === lastRead)?.englishNameTranslation}
                </p>
              </div>
              <ChevronRight className={cn("w-6 h-6", i18n.language !== 'ar' && "rotate-180")} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Bookmarks Section */}
      {bookmarks.length > 0 && !searchQuery && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl mx-auto space-y-3"
        >
          <h3 className="text-base font-bold font-heading text-primary px-1 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-primary" />
            <span>{t("quran.bookmarks_title", { defaultValue: "الفواصل المحفوظة" })}</span>
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {bookmarks.map((b) => (
              <Card 
                key={`${b.surahNumber}-${b.ayahNumber}`}
                onClick={() => {
                  setLocation(`/quran?surah=${b.surahNumber}&ayah=${b.ayahNumber}`);
                }}
                className="cursor-pointer border-none shadow-sm bg-card/60 backdrop-blur-sm hover:bg-primary/5 transition-all group overflow-hidden"
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                      <Bookmark className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {b.surahName} — {t("common.ayah", { defaultValue: "آية" })} {b.ayahNumber}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1 text-right mt-1" dir="rtl">
                        {cleanBismillah(b.text)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={cn("w-4 h-4 text-muted-foreground", i18n.language !== 'ar' && "rotate-180")} />
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-24 bg-card/40 animate-pulse rounded-[2rem] border border-primary/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSurahs.map((surah) => (
            <motion.div
              key={surah.number}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fetchSurahAyahs(surah.number)}
              className="cursor-pointer"
            >
              <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm hover:bg-primary/5 transition-all group overflow-hidden h-full">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-white transition-all">
                    {surah.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{i18n.language === 'ar' ? surah.name : surah.englishName}</h3>
                    <p className="text-xs text-muted-foreground">{surah.englishNameTranslation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-primary/40 uppercase tracking-tighter">
                      {surah.numberOfAyahs} {t("common.ayahs")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
