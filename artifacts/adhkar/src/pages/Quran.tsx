import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Play, Pause, ChevronRight, Clock, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getQuranEditionForLanguage, isArabic } from "@/lib/content-i18n";

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

export default function Quran() {
  const { t, i18n } = useTranslation();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSurah, setActiveSurah] = useState<number | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [tafsirJalalayn, setTafsirJalalayn] = useState<Tafsir[]>([]);
  const [tafsirMuyassar, setTafsirMuyassar] = useState<Tafsir[]>([]);
  const [showJalalayn, setShowJalalayn] = useState(true);
  const [showMuyassar, setShowMuyassar] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef(new Audio());
  const audio = audioRef.current;

  const [lastRead, setLastRead] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("last_read_surah");
    if (stored) setLastRead(parseInt(stored));

    fetch("https://api.alquran.cloud/v1/surah")
      .then(res => res.json())
      .then(data => {
        setSurahs(data.data);
        setLoading(false);
      });
  }, []);

  const fetchSurahAyahs = (number: number) => {
    setLoading(true);
    localStorage.setItem("last_read_surah", number.toString());
    setLastRead(number);
    
    // Determine translation edition based on current language
    const translationEdition = getQuranEditionForLanguage(i18n.language) || "en.sahih";
    
    // Fetch audio, Jalalayn, Muyassar, and language-specific Translation
    const fetches = [
      fetch(`https://api.alquran.cloud/v1/surah/${number}/ar.alafasy`).then(res => res.json()),
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
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const playAyah = (url: string) => {
    if (playing === url) {
      audio.pause();
      setPlaying(null);
    } else {
      audio.src = url;
      audio.play();
      setPlaying(url);
      audio.onended = () => setPlaying(null);
    }
  };

  const filteredSurahs = surahs.filter(s => 
    s.name.includes(searchQuery) || 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeSurah && ayahs.length > 0) {
    const currentSurah = surahs.find(s => s.number === activeSurah);
    if (!currentSurah) return null;

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-card/40 p-4 rounded-[2rem] border border-primary/5 backdrop-blur-sm sticky top-4 z-20 shadow-sm">
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
          
          <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
            <Button 
              variant={showJalalayn ? "secondary" : "ghost"} 
              size="sm" 
              className={cn("rounded-lg text-[10px] h-8", showJalalayn && "bg-white shadow-sm")}
              onClick={() => setShowJalalayn(!showJalalayn)}
            >
              {t("quran.tafsir_jalalayn")}
            </Button>
            <Button 
              variant={showMuyassar ? "secondary" : "ghost"} 
              size="sm" 
              className={cn("rounded-lg text-[10px] h-8", showMuyassar && "bg-white shadow-sm")}
              onClick={() => setShowMuyassar(!showMuyassar)}
            >
              {t("quran.tafsir_muyassar")}
            </Button>
          </div>
        </div>

        {/* Bismillah for non-Fatiha/Tawbah */}
        {activeSurah !== 1 && activeSurah !== 9 && (
          <div className="text-center py-8">
            <p className="dhikr-text text-3xl text-primary opacity-80">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          </div>
        )}

        <div className="space-y-4">
          {ayahs.map((ayah) => (
            <Card key={ayah.number} className={cn(
              "border-none shadow-sm transition-all duration-300 rounded-[2rem] overflow-hidden",
              playing === ayah.audio ? "bg-primary/5 ring-1 ring-primary/20" : "bg-card/60 backdrop-blur-sm"
            )}>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button 
                      size="icon" 
                      variant={playing === ayah.audio ? "default" : "secondary"} 
                      className={cn("rounded-full w-12 h-12 shadow-sm transition-all", playing === ayah.audio ? "bg-primary text-white" : "bg-white hover:bg-primary/5 text-primary")}
                      onClick={() => playAyah(ayah.audio)}
                    >
                      {playing === ayah.audio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
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
                  {ayah.text ? ayah.text.replace("بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", "") : ""}
                </p>
                {/* Translation — shown for non-Arabic languages */}
                {!isArabic(i18n.language) && ayah.translatedText && (
                  <p className="text-muted-foreground text-lg leading-relaxed text-left border-t border-border/30 pt-4" dir="ltr">
                    {ayah.translatedText}
                  </p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {showJalalayn && tafsirJalalayn[ayah.numberInSurah - 1] && (
                    <div className="pt-6 border-t border-primary/5 bg-primary/5 -mx-6 px-6 py-4 md:rounded-bl-[2rem] h-full">
                      <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">{t("quran.tafsir_jalalayn")}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed text-right" dir="rtl">
                        {tafsirJalalayn[ayah.numberInSurah - 1].text}
                      </p>
                    </div>
                  )}
                  {showMuyassar && tafsirMuyassar[ayah.numberInSurah - 1] && (
                    <div className="pt-6 border-t border-primary/5 bg-amber-500/5 -mx-6 px-6 py-4 md:rounded-br-[2rem] h-full">
                      <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">{t("quran.tafsir_muyassar")}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed text-right" dir="rtl">
                        {tafsirMuyassar[ayah.numberInSurah - 1].text}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
