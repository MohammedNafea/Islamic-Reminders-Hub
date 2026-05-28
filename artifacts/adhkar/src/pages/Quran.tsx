import React from "react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Play, Pause, ChevronRight, Clock, BookOpen, Bookmark, BookmarkCheck, Copy, SkipForward, SkipBack, Volume2, Image, Share2 } from "lucide-react";
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
import { exportToImage, shareText, copyDhikrText } from "@/lib/image-share";
import { translateText } from "@/lib/google-translate";
import { SectionBooklet } from "@/components/SectionBooklet";



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
  juz: number;
  page: number;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
  };
  tafsirText?: string;
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

const SURAH_START_PAGES = [
  0,
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208, // 1-10
  221, 235, 249, 255, 262, 267, 282, 293, 305, 312, // 11-20
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404, // 21-30
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467, // 31-40
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518, // 41-50
  520, 523, 526, 528, 531, 534, 537, 542, 545, 549, // 51-60
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568, // 61-70
  570, 572, 574, 575, 577, 578, 580, 582, 583, 585, // 71-80
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594, // 81-90
  595, 595, 596, 596, 597, 597, 598, 598, 599, 599, // 91-100
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603, // 101-110
  603, 604, 604, 604 // 111-114
];


export default function Quran() {
  const { t, i18n } = useTranslation();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSurah, setActiveSurah] = useState<number | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [tafsirJalalayn, setTafsirJalalayn] = useState<Tafsir[]>([]);
  const [tafsirMuyassar, setTafsirMuyassar] = useState<Tafsir[]>([]);
  const [tafsirIbnKathir, setTafsirIbnKathir] = useState<Tafsir[]>([]);
  const [tafsirTabari, setTafsirTabari] = useState<Tafsir[]>([]);
  const [tafsirSaadi, setTafsirSaadi] = useState<Tafsir[]>([]);
  const [pageAyahTafsirs, setPageAyahTafsirs] = useState<{
    muyassar: string;
    jalalayn: string;
    ibnKathir: string;
    tabari: string;
    saadi: string;
  } | null>(null);
  const [pageAyahTafsirLoading, setPageAyahTafsirLoading] = useState(false);
  const [selectedTafsir, setSelectedTafsir] = useState<"muyassar" | "jalalayn" | "ibnkathir" | "tabari" | "saadi" | "none">("muyassar");

  // View modes
  const [viewMode, setViewMode] = useState<"list" | "pages">(() => {
    return (localStorage.getItem("quran_view_mode") as "list" | "pages") || "list";
  });
  const [currentPage, setCurrentPage] = useState<number>(() => {
    return parseInt(localStorage.getItem("quran_current_page") || "1", 10);
  });
  const [pageAyahs, setPageAyahs] = useState<Ayah[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const playNextPageFirstAyahRef = useRef(false);
  const playLastPageFirstAyahRef = useRef(false);

  // Selected ayah in page view
  const [selectedPageAyah, setSelectedPageAyah] = useState<Ayah | null>(null);
  const [selectedPageAyahIndex, setSelectedPageAyahIndex] = useState<number | null>(null);

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

  // Save viewMode & page preferences
  useEffect(() => {
    localStorage.setItem("quran_view_mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("quran_current_page", String(currentPage));
  }, [currentPage]);

  // Sync playback speed
  useEffect(() => {
    audio.playbackRate = playbackSpeed;
  }, [playbackSpeed, audio]);

  // Fallback if current qari does not support the active surah
  useEffect(() => {
    if (activeSurah && selectedQari.surahList && !selectedQari.surahList.includes(activeSurah)) {
      setSelectedQariId("husary");
      localStorage.setItem("quran_selected_qari", "husary");
    }
  }, [activeSurah, selectedQari, setSelectedQariId]);

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

  // Audio ended listener with seamless page-turning
  useEffect(() => {
    const handleEnded = () => {
      if (selectedQari.type === "ayah" && activeAyahIndex !== null) {
        if (autoplay && activeAyahIndex < ayahs.length - 1) {
          const nextIndex = activeAyahIndex + 1;
          setActiveAyahIndex(nextIndex);
          audio.src = ayahs[nextIndex].audio;
          audio.play().catch(err => console.log("Autoplay blocked", err));
        } else if (autoplay && viewMode === "pages" && currentPage < 604) {
          playNextPageFirstAyahRef.current = true;
          setCurrentPage(prev => prev + 1);
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
  }, [audio, selectedQari, activeAyahIndex, autoplay, ayahs, viewMode, currentPage]);

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
      } else if (viewMode === "pages" && currentPage < 604) {
        playNextPageFirstAyahRef.current = true;
        setCurrentPage(prev => prev + 1);
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
      } else if (viewMode === "pages" && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
        playLastPageFirstAyahRef.current = true;
      }
    } else {
      audio.currentTime = Math.max(audio.currentTime - 10, 0);
    }
  };

  // Auto scroll to active ayah card
  useEffect(() => {
    if (selectedQari.type === "ayah" && activeAyahIndex !== null && autoScroll && viewMode === "list") {
      const activeAyah = ayahs[activeAyahIndex];
      if (activeAyah) {
        const el = ayahRefs.current[activeAyah.numberInSurah];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }, [activeAyahIndex, autoScroll, selectedQari, ayahs, viewMode]);

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
    setTafsirIbnKathir([]);
    setTafsirTabari([]);
    setTafsirSaadi([]);
    
    localDB.saveLastRead(number);
    setLastRead(number);
    
    const translationEdition = getQuranEditionForLanguage(i18n.language) || "en.sahih";
    const audioEdition = selectedQari.type === "ayah" && selectedQari.audioEditionId 
      ? selectedQari.audioEditionId 
      : "ar.husary";
    
    const fetches = [
      fetch(`https://api.alquran.cloud/v1/surah/${number}/${audioEdition}`).then(res => res.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${number}/ar.jalalayn`).then(res => res.json()).catch(() => null),
      fetch(`https://api.alquran.cloud/v1/surah/${number}/ar.muyassar`).then(res => res.json()).catch(() => null),
      fetch(`https://api.alquran.cloud/v1/surah/${number}/${translationEdition}`).then(res => res.json()),
      fetch(`https://api.quran.com/api/v4/tafsirs/14/by_chapter/${number}`).then(res => res.json()).catch(() => null),
      fetch(`https://api.quran.com/api/v4/tafsirs/15/by_chapter/${number}`).then(res => res.json()).catch(() => null),
      fetch(`https://api.quran.com/api/v4/tafsirs/91/by_chapter/${number}`).then(res => res.json()).catch(() => null)
    ];
    
    Promise.all(fetches).then(([audioData, jalalaynData, muyassarData, transData, ibnKathirData, tabariData, saadiData]) => {
      if (audioData?.data && transData?.data) {
        const totalAyahs = audioData.data.ayahs.length;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const enrichedAyahs = audioData.data.ayahs.map((a: any, i: number) => ({
          ...a,
          translatedText: transData.data.ayahs[i]?.text || "",
          translationEdition
        }));
        setAyahs(enrichedAyahs);
        setTafsirJalalayn(jalalaynData?.data?.ayahs || []);
        setTafsirMuyassar(muyassarData?.data?.ayahs || []);
        
        // Map Ibn Kathir Tafsir
        const ibnKathirAyahs = new Array(totalAyahs).fill(null).map(() => ({ text: "" }));
        if (ibnKathirData?.tafsirs) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ibnKathirData.tafsirs.forEach((t: any) => {
            const parts = t.verse_key.split(":");
            const idx = parseInt(parts[1], 10) - 1;
            if (idx >= 0 && idx < totalAyahs) {
              ibnKathirAyahs[idx] = { text: t.text || "" };
            }
          });
        }
        setTafsirIbnKathir(ibnKathirAyahs);

        // Map Al-Tabari Tafsir
        const tabariAyahs = new Array(totalAyahs).fill(null).map(() => ({ text: "" }));
        if (tabariData?.tafsirs) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tabariData.tafsirs.forEach((t: any) => {
            const parts = t.verse_key.split(":");
            const idx = parseInt(parts[1], 10) - 1;
            if (idx >= 0 && idx < totalAyahs) {
              tabariAyahs[idx] = { text: t.text || "" };
            }
          });
        }
        setTafsirTabari(tabariAyahs);

        // Map Al-Sa'di Tafsir
        const saadiAyahs = new Array(totalAyahs).fill(null).map(() => ({ text: "" }));
        if (saadiData?.tafsirs) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          saadiData.tafsirs.forEach((t: any) => {
            const parts = t.verse_key.split(":");
            const idx = parseInt(parts[1], 10) - 1;
            if (idx >= 0 && idx < totalAyahs) {
              saadiAyahs[idx] = { text: t.text || "" };
            }
          });
        }
        setTafsirSaadi(saadiAyahs);
        
        setActiveSurah(number);
        
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

  // Fetch page data for page-by-page view
  const fetchPageData = (pageNumber: number) => {
    setPageLoading(true);
    const translationEdition = getQuranEditionForLanguage(i18n.language) || "en.sahih";
    
    const fetches = [
      fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`).then(res => res.json()),
      fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/${translationEdition}`).then(res => res.json()),
      fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/ar.muyassar`).then(res => res.json())
    ];

    Promise.all(fetches)
      .then(([uthmaniData, transData, tafsirData]) => {
        if (uthmaniData?.data?.ayahs) {
          const rawAyahs = uthmaniData.data.ayahs;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const transTexts = transData?.data?.ayahs?.map((a: any) => a.text) || [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tafsirTexts = tafsirData?.data?.ayahs?.map((a: any) => a.text) || [];
          
          const audioEdition = selectedQari.type === "ayah" && selectedQari.audioEditionId 
            ? selectedQari.audioEditionId 
            : "ar.husary";
            
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const enriched = rawAyahs.map((ayah: any, i: number) => ({
            ...ayah,
            audio: `https://cdn.alquran.cloud/media/audio/ayah/${audioEdition}/${ayah.number}`,
            translatedText: transTexts[i] || "",
            tafsirText: tafsirTexts[i] || "",
            translationEdition
          }));
          
          setPageAyahs(enriched);
          setAyahs(enriched);
          
          if (rawAyahs.length > 0) {
            setActiveSurah(rawAyahs[0].surah.number);
          }

          if (playNextPageFirstAyahRef.current) {
            playNextPageFirstAyahRef.current = false;
            setActiveAyahIndex(0);
            audio.src = enriched[0].audio;
            audio.play().catch(err => console.log("Play failed", err));
            setIsPlaying(true);
          } else if (playLastPageFirstAyahRef.current) {
            playLastPageFirstAyahRef.current = false;
            const lastIdx = enriched.length - 1;
            setActiveAyahIndex(lastIdx);
            audio.src = enriched[lastIdx].audio;
            audio.play().catch(err => console.log("Play failed", err));
            setIsPlaying(true);
          }
        }
        setPageLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch page data:", err);
        setPageLoading(false);
      });
  };

  // Fetch page data if viewMode is page
  useEffect(() => {
    if (viewMode === "pages") {
      fetchPageData(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, viewMode, i18n.language, selectedQariId]);

  // Fetch Tafsir on-demand for Page View ayah click
  useEffect(() => {
    if (!selectedPageAyah) {
      setPageAyahTafsirs(null);
      return;
    }
    
    setPageAyahTafsirLoading(true);
    const surahNum = selectedPageAyah.surah.number;
    const ayahNum = selectedPageAyah.numberInSurah;
    const globalAyahNum = selectedPageAyah.number;
    
    const fetches = [
      // Muyassar from Alquran.cloud
      fetch(`https://api.alquran.cloud/v1/ayah/${globalAyahNum}/ar.muyassar`).then(res => res.json()).catch(() => null),
      // Jalalayn from Alquran.cloud
      fetch(`https://api.alquran.cloud/v1/ayah/${globalAyahNum}/ar.jalalayn`).then(res => res.json()).catch(() => null),
      // Ibn Kathir from Quran.com
      fetch(`https://api.quran.com/api/v4/tafsirs/14/by_ayah/${surahNum}:${ayahNum}`).then(res => res.json()).catch(() => null),
      // Tabari from Quran.com
      fetch(`https://api.quran.com/api/v4/tafsirs/15/by_ayah/${surahNum}:${ayahNum}`).then(res => res.json()).catch(() => null),
      // Saadi from Quran.com
      fetch(`https://api.quran.com/api/v4/tafsirs/91/by_ayah/${surahNum}:${ayahNum}`).then(res => res.json()).catch(() => null),
    ];
    
    Promise.all(fetches)
      .then(([muyassarRes, jalalaynRes, ibnKathirRes, tabariRes, saadiRes]) => {
        setPageAyahTafsirs({
          muyassar: muyassarRes?.data?.text || "",
          jalalayn: jalalaynRes?.data?.text || "",
          ibnKathir: ibnKathirRes?.tafsir?.text || "",
          tabari: tabariRes?.tafsir?.text || "",
          saadi: saadiRes?.tafsir?.text || "",
        });
        setPageAyahTafsirLoading(false);
      })
      .catch(() => {
        setPageAyahTafsirLoading(false);
      });
  }, [selectedPageAyah]);

  // Refetch if the reciter is changed while reading a Surah
  useEffect(() => {
    if (activeSurah !== null && viewMode === "list") {
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
        if (viewMode === "pages") {
          setCurrentPage(SURAH_START_PAGES[surahNum]);
        } else {
          fetchSurahAyahs(surahNum);
        }
      }
    } else {
      if (activeSurah !== null && viewMode === "list") {
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
    if (!loading && ayahs.length > 0 && scrollToAyahNum !== null && viewMode === "list") {
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
  }, [loading, ayahs, scrollToAyahNum, viewMode]);

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
        audio.src = ayah.audio;
        audio.play().catch(err => console.log("Play failed", err));
        setPlayingSingleAyahId(ayah.number);
        setIsPlaying(true);
      }
    }
  };

  const handlePageAyahClick = (ayah: Ayah, index: number) => {
    setSelectedPageAyah(ayah);
    setSelectedPageAyahIndex(index);
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

  const handleSurahClick = (number: number) => {
    if (viewMode === "pages") {
      setCurrentPage(SURAH_START_PAGES[number]);
    } else {
      fetchSurahAyahs(number);
    }
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

  const renderViewSwitcher = () => (
    <div className="flex justify-center gap-1 p-1 bg-muted/40 rounded-2xl w-full max-w-[220px] sm:max-w-[280px] mx-auto border border-primary/5">
      <Button
        variant={viewMode === "list" ? "secondary" : "ghost"}
        size="sm"
        className={cn(
          "rounded-xl flex-1 text-[10px] sm:text-xs h-8 sm:h-9 px-2 transition-all duration-300",
          viewMode === "list" && "bg-white shadow-sm font-bold text-primary"
        )}
        onClick={() => setViewMode("list")}
      >
        {t("quran.list_view", { defaultValue: "عرض الآيات" })}
      </Button>
      <Button
        variant={viewMode === "pages" ? "secondary" : "ghost"}
        size="sm"
        className={cn(
          "rounded-xl flex-1 text-[10px] sm:text-xs h-8 sm:h-9 px-2 transition-all duration-300",
          viewMode === "pages" && "bg-white shadow-sm font-bold text-primary"
        )}
        onClick={() => {
          setViewMode("pages");
          if (activeSurah !== null) {
            setCurrentPage(SURAH_START_PAGES[activeSurah]);
          }
        }}
      >
        {t("quran.page_view", { defaultValue: "صفحات المصحف" })}
      </Button>
    </div>
  );

  const renderPageContent = () => {
    const elements: React.ReactNode[] = [];
    let currentSurahNumber: number | null = null;
    let currentGroup: Ayah[] = [];

    const renderSurahBlock = (surahNum: number, ayahsInSurah: Ayah[]) => {
      const firstAyah = ayahsInSurah[0];
      const surahInfo = firstAyah.surah;
      const isNewSurah = firstAyah.numberInSurah === 1;

      return (
        <div key={`surah-block-${surahNum}`} className="space-y-4 mb-6">
          {isNewSurah && (
            <div className="my-6 text-center select-none">
              {/* Surah Header Frame */}
              <div className="relative inline-flex items-center justify-center px-6 sm:px-12 py-2 sm:py-3 border-2 border-double border-amber-600/30 rounded-xl bg-amber-50/50 shadow-sm min-w-[200px] sm:min-w-[280px]">
                <div className="absolute left-3 right-3 top-1 bottom-1 border border-dashed border-amber-600/20 rounded-lg pointer-events-none" />
                <span className="text-xl font-bold font-heading text-amber-900 dark:text-amber-500">
                  {i18n.language === 'ar' ? surahInfo.name : surahInfo.englishName}
                </span>
              </div>
              {/* Bismillah */}
              {surahNum !== 1 && surahNum !== 9 && (
                <div className="mt-4 text-center">
                  <p className="dhikr-text text-xl sm:text-2xl text-primary opacity-80">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                </div>
              )}
            </div>
          )}
          
          {/* Ayahs text container */}
          <p className="quran-page-text text-lg sm:text-2xl md:text-3xl leading-[2] sm:leading-[2.2] md:leading-[2.5] text-amber-955 dark:text-amber-100 font-serif text-justify animate-fade-in" dir="rtl" style={{ textJustify: 'inter-word' }}>
            {ayahsInSurah.map((ayah) => {
              const index = pageAyahs.findIndex(a => a.number === ayah.number);
              const isAyahPlaying = 
                (selectedQari.type === "ayah" && activeAyahIndex === index && isPlaying) ||
                (selectedQari.type === "surah" && playingSingleAyahId === ayah.number && isPlaying);
              const isSelected = selectedPageAyah?.number === ayah.number;
              
              return (
                <span
                  key={ayah.number}
                  className={cn(
                    "cursor-pointer hover:bg-amber-500/10 rounded px-1.5 py-0.5 transition-all duration-200 inline",
                    isAyahPlaying && "bg-amber-500/20 ring-1 ring-amber-500/40 font-bold",
                    isSelected && "bg-amber-500/10 border-b-2 border-amber-500/40",
                  )}
                  onClick={() => handlePageAyahClick(ayah, index)}
                >
                  {cleanBismillah(ayah.text)}
                  {/* Gold Ayah number end circle */}
                  <span className="inline-flex items-center justify-center mx-2 w-7 h-7 rounded-full border border-amber-600/30 text-[11px] font-bold text-amber-800 dark:text-amber-400 font-mono select-none bg-amber-50/50 dark:bg-amber-950/50 align-middle">
                    {ayah.numberInSurah}
                  </span>
                </span>
              );
            })}
          </p>
        </div>
      );
    };

    // Group pageAyahs by surah
    pageAyahs.forEach((ayah) => {
      if (currentSurahNumber === null) {
        currentSurahNumber = ayah.surah.number;
        currentGroup.push(ayah);
      } else if (ayah.surah.number === currentSurahNumber) {
        if (ayah.numberInSurah === 1) {
          elements.push(renderSurahBlock(currentSurahNumber, currentGroup));
          currentSurahNumber = ayah.surah.number;
          currentGroup = [ayah];
        } else {
          currentGroup.push(ayah);
        }
      } else {
        elements.push(renderSurahBlock(currentSurahNumber, currentGroup));
        currentSurahNumber = ayah.surah.number;
        currentGroup = [ayah];
      }
    });

    if (currentGroup.length > 0 && currentSurahNumber !== null) {
      elements.push(renderSurahBlock(currentSurahNumber, currentGroup));
    }

    return elements;
  };

  if (activeSurah && ayahs.length > 0) {
    const currentSurah = surahs.find(s => s.number === activeSurah);
    if (!currentSurah) return null;

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-56 md:pb-44">
        {/* Header */}
        {viewMode === "list" ? (
          <div className="bg-card/90 backdrop-blur-md border border-primary/5 rounded-[2rem] shadow-sm sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] md:top-4 z-20 p-3 md:p-4">
            {/* Row 1: Back button + Title */}
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" onClick={() => { audio.pause(); setActiveSurah(null); }} className="rounded-full h-10 w-10 p-0 bg-white shadow-sm hover:bg-primary/5 text-primary shrink-0">
                <ChevronRight className={cn("w-5 h-5", i18n.language !== 'ar' && "rotate-180")} />
              </Button>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-2xl font-bold font-heading text-primary truncate">{i18n.language === 'ar' ? currentSurah?.name : currentSurah?.englishName}</h2>
                <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <span>{currentSurah?.numberOfAyahs} {t("common.ayahs")}</span>
                  <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                  <span>{currentSurah?.revelationType === "Meccan" ? t("quran.meccan") : t("quran.medinan")}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 justify-between md:justify-end w-full md:w-auto">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-9 h-9 border-primary/10 hover:bg-primary/5 text-primary bg-white shadow-sm shrink-0"
                onClick={() => setIsSearchOpen(true)}
                title={t("quran.search_in_surah", { defaultValue: "البحث في السورة" })}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            {/* Row 2: Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={selectedTafsir} onValueChange={(val: "muyassar" | "jalalayn" | "ibnkathir" | "tabari" | "saadi" | "none") => setSelectedTafsir(val)}>
                <SelectTrigger className="w-[110px] sm:w-[130px] h-8 rounded-xl border-primary/10 bg-white/50 text-[10px] shrink-0">
                  <SelectValue placeholder={t("quran.tafsir_muyassar")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-72">
                  <SelectItem value="muyassar" className="text-[11px]">{t("quran.tafsir_muyassar")}</SelectItem>
                  <SelectItem value="jalalayn" className="text-[11px]">{t("quran.tafsir_jalalayn")}</SelectItem>
                  <SelectItem value="saadi" className="text-[11px]">{t("quran.tafsir_saadi", { defaultValue: "تفسير السعدي" })}</SelectItem>
                  <SelectItem value="ibnkathir" className="text-[11px]">{t("quran.tafsir_ibn_kathir")}</SelectItem>
                  <SelectItem value="tabari" className="text-[11px]">{t("quran.tafsir_tabari", { defaultValue: "تفسير الطبري" })}</SelectItem>
                  <SelectItem value="none" className="text-[11px]">{t("quran.hide_tafsir", { defaultValue: "إخفاء التفسير" })}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1">{renderViewSwitcher()}</div>
            </div>
          </div>
        ) : (
          <div className="bg-card/90 backdrop-blur-md border border-primary/5 rounded-[2rem] shadow-sm sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] md:top-4 z-20 p-3 md:p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => { audio.pause(); setViewMode("list"); setActiveSurah(null); }} className="rounded-full h-10 w-10 p-0 bg-white shadow-sm hover:bg-primary/5 text-primary shrink-0">
                <ChevronRight className={cn("w-5 h-5", i18n.language !== 'ar' && "rotate-180")} />
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-heading text-primary">
                    {t("quran.page", { defaultValue: "صفحة" })} {currentPage}
                  </h2>
                  {pageAyahs.length > 0 && (
                    <span className="text-[10px] text-muted-foreground bg-primary/5 px-2 py-0.5 rounded-full font-medium">
                      {t("quran.juz", { defaultValue: "الجزء" })} {pageAyahs[0].juz}
                    </span>
                  )}
                </div>
                <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest truncate">
                  {Array.from(new Set(pageAyahs.map(a => i18n.language === 'ar' ? a.surah.name : a.surah.englishName))).join(" / ")}
                </div>
              </div>
              <div className="shrink-0">{renderViewSwitcher()}</div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 justify-between md:justify-end w-full md:w-auto">
              {renderViewSwitcher()}
            </div>
          </div>
        )}

        {/* Content */}
        {viewMode === "list" ? (
          <>
            {/* Bismillah for non-Fatiha/Tawbah */}
            {activeSurah !== 1 && activeSurah !== 9 && (
              <div className="text-center py-8">
                <p className="dhikr-text text-3xl text-primary opacity-80">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
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
                          <Button 
                            size="icon" 
                            variant="secondary"
                            className="rounded-full w-12 h-12 bg-white shadow-sm hover:bg-primary/5 text-primary"
                            onClick={async () => {
                              const cleanText = cleanBismillah(ayah.text);
                              const surahTitle = i18n.language === "ar" ? currentSurah.name : currentSurah.englishName;
                              const source = `${surahTitle} - ${t("quran.ayah", { defaultValue: "آية" })} ${ayah.numberInSurah}`;
                              await copyDhikrText(
                                source,
                                cleanText,
                                source,
                                i18n.language
                              );
                            }}
                            title={t("common.copy", { defaultValue: "نسخ" })}
                          >
                            <Copy className="w-5 h-5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="secondary"
                            className="rounded-full w-12 h-12 bg-white shadow-sm hover:bg-primary/5 text-primary"
                            onClick={() => {
                              const cleanText = cleanBismillah(ayah.text);
                              const surahTitle = i18n.language === "ar" ? currentSurah.name : currentSurah.englishName;
                              exportToImage(
                                `${surahTitle} - ${t("quran.ayah", { defaultValue: "آية" })} ${ayah.numberInSurah}`,
                                cleanText,
                                `${surahTitle} (${ayah.numberInSurah})`,
                                i18n.language
                              );
                            }}
                            title={t("common.export_image", { defaultValue: "تصدير كصورة" })}
                          >
                            <Image className="w-5 h-5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="secondary"
                            className="rounded-full w-12 h-12 bg-white shadow-sm hover:bg-primary/5 text-primary"
                            onClick={async () => {
                              const cleanText = cleanBismillah(ayah.text);
                              const surahTitle = i18n.language === "ar" ? currentSurah.name : currentSurah.englishName;
                              const source = `${surahTitle} - ${t("quran.ayah", { defaultValue: "آية" })} ${ayah.numberInSurah}`;
                              await shareText(
                                source,
                                cleanText,
                                source,
                                i18n.language
                              );
                            }}
                            title={i18n.language === "ar" ? "مشاركة الآية" : "Share Ayah"}
                          >
                            <Share2 className="w-5 h-5" />
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
                          {selectedTafsir === "muyassar" && tafsirMuyassar[ayah.numberInSurah - 1] && (
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
                          {selectedTafsir === "jalalayn" && tafsirJalalayn[ayah.numberInSurah - 1] && (
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
                          {selectedTafsir === "saadi" && tafsirSaadi[ayah.numberInSurah - 1] && (
                            <div className="bg-orange-500/5 p-4 rounded-2xl text-right border border-orange-500/10" dir="rtl">
                              <h4 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1.5">
                                {t("quran.tafsir_saadi", { defaultValue: "تفسير السعدي" })}
                              </h4>
                              <div
                                dangerouslySetInnerHTML={{ __html: tafsirSaadi[ayah.numberInSurah - 1].text }}
                                className="text-muted-foreground text-sm leading-relaxed quran-tafsir-html"
                              />
                            </div>
                          )}
                          {selectedTafsir === "ibnkathir" && tafsirIbnKathir[ayah.numberInSurah - 1] && (
                            <div className="bg-emerald-500/5 p-4 rounded-2xl text-right border border-emerald-500/10" dir="rtl">
                              <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">
                                {t("quran.tafsir_ibn_kathir")}
                              </h4>
                              <div
                                dangerouslySetInnerHTML={{ __html: tafsirIbnKathir[ayah.numberInSurah - 1].text }}
                                className="text-muted-foreground text-sm leading-relaxed quran-tafsir-html"
                              />
                            </div>
                          )}
                          {selectedTafsir === "tabari" && tafsirTabari[ayah.numberInSurah - 1] && (
                            <div className="bg-blue-500/5 p-4 rounded-2xl text-right border border-blue-500/10" dir="rtl">
                              <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">
                                {t("quran.tafsir_tabari", { defaultValue: "تفسير الطبري" })}
                              </h4>
                              <div
                                dangerouslySetInnerHTML={{ __html: tafsirTabari[ayah.numberInSurah - 1].text }}
                                className="text-muted-foreground text-sm leading-relaxed quran-tafsir-html"
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
          </>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Page Navigation Controls - Top */}
            <div className="flex items-center justify-between gap-4 bg-card/50 p-3 rounded-2xl border border-primary/5 backdrop-blur-sm">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="gap-1 text-xs rounded-xl"
              >
                <ChevronRight className={cn("w-4 h-4", i18n.language === 'ar' ? "rotate-180" : "")} />
                <span>{t("common.prev", { defaultValue: "السابق" })}</span>
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">{t("quran.page", { defaultValue: "الصفحة" })}</span>
                <input 
                  type="number" 
                  min={1} 
                  max={604} 
                  value={currentPage} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val >= 1 && val <= 604) setCurrentPage(val);
                  }}
                  className="w-16 h-8 text-center text-xs border border-primary/10 rounded-xl bg-white dark:bg-card focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                />
                <span className="text-xs text-muted-foreground font-medium">/ 604</span>
              </div>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => currentPage < 604 && setCurrentPage(currentPage + 1)}
                disabled={currentPage === 604}
                className="gap-1 text-xs rounded-xl"
              >
                <span>{t("common.next", { defaultValue: "التالي" })}</span>
                <ChevronRight className={cn("w-4 h-4", i18n.language === 'ar' ? "" : "rotate-180")} />
              </Button>
            </div>

            {/* Actual Quran Page paper */}
            <Card className="border-none shadow-lg bg-[#fbf9f4] dark:bg-[#111413] rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden relative border-4 sm:border-8 border-double border-amber-900/10 dark:border-amber-500/10">
              <CardContent className="p-3 sm:p-6 md:p-10 space-y-4 sm:space-y-6 min-h-[400px] sm:min-h-[500px]">
                {pageLoading ? (
                  <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] space-y-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-amber-900/60 dark:text-amber-500/60 font-medium">
                      {t("common.loading", { defaultValue: "جاري تحميل الصفحة..." })}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Quran page inner decorative border representing Medina Mushaf frames */}
                    <div className="border-2 border-double border-amber-600/20 dark:border-amber-500/10 p-3 sm:p-5 md:p-8 rounded-[1rem] sm:rounded-[2rem] bg-[#fdfbf7] dark:bg-[#121614] shadow-inner relative overflow-hidden">
                      {/* Decorative corner patterns */}
                      <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-600/20 dark:border-amber-500/10 rounded-tl-sm pointer-events-none" />
                      <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-600/20 dark:border-amber-500/10 rounded-tr-sm pointer-events-none" />
                      <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-600/20 dark:border-amber-500/10 rounded-bl-sm pointer-events-none" />
                      <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-600/20 dark:border-amber-500/10 rounded-br-sm pointer-events-none" />
                      
                      {renderPageContent()}
                    </div>
                    
                    {/* Bottom page number indicator (Quran style) */}
                    <div className="pt-4 flex justify-center">
                      <div className="relative inline-flex items-center justify-center w-12 h-12 border border-amber-600/20 rounded-full bg-amber-50/30 select-none">
                        <span className="text-xs font-bold text-amber-900/70 dark:text-amber-400/70 font-mono">{currentPage}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Page Slider control */}
            <div className="bg-card/50 p-4 rounded-3xl border border-primary/5 backdrop-blur-sm space-y-2">
              <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                <span>{t("quran.page", { defaultValue: "صفحة" })} 1</span>
                <span>{t("quran.page", { defaultValue: "صفحة" })} 604</span>
              </div>
              <input 
                type="range" 
                min={1} 
                max={604} 
                value={currentPage} 
                onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Dialogs and shared layouts */}
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

                  {tafsirSaadi[selectedTafsirAyah.numberInSurah - 1]?.text && (
                    <div className="border border-orange-500/10 bg-orange-500/5 p-4 rounded-2xl text-right" dir="rtl">
                      <h4 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1.5">{t("quran.tafsir_saadi", { defaultValue: "تفسير السعدي" })}</h4>
                      <div 
                        dangerouslySetInnerHTML={{ __html: tafsirSaadi[selectedTafsirAyah.numberInSurah - 1].text }}
                        className="text-sm text-foreground leading-relaxed quran-tafsir-html"
                      />
                    </div>
                  )}

                  {tafsirIbnKathir[selectedTafsirAyah.numberInSurah - 1]?.text && (
                    <div className="border border-emerald-500/10 bg-emerald-500/5 p-4 rounded-2xl text-right" dir="rtl">
                      <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">{t("quran.tafsir_ibn_kathir")}</h4>
                      <div 
                        dangerouslySetInnerHTML={{ __html: tafsirIbnKathir[selectedTafsirAyah.numberInSurah - 1].text }}
                        className="text-sm text-foreground leading-relaxed quran-tafsir-html"
                      />
                    </div>
                  )}

                  {tafsirTabari[selectedTafsirAyah.numberInSurah - 1]?.text && (
                    <div className="border border-blue-500/10 bg-blue-500/5 p-4 rounded-2xl text-right" dir="rtl">
                      <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">{t("quran.tafsir_tabari", { defaultValue: "تفسير الطبري" })}</h4>
                      <div 
                        dangerouslySetInnerHTML={{ __html: tafsirTabari[selectedTafsirAyah.numberInSurah - 1].text }}
                        className="text-sm text-foreground leading-relaxed quran-tafsir-html"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const textToCopy = `الآية: ${selectedTafsirAyah.text}\n\nتفسير الميسر:\n${tafsirMuyassar[selectedTafsirAyah.numberInSurah - 1]?.text || ""}\n\nتفسير الجلالين:\n${tafsirJalalayn[selectedTafsirAyah.numberInSurah - 1]?.text || ""}\n\nتفسير السعدي:\n${tafsirSaadi[selectedTafsirAyah.numberInSurah - 1]?.text || ""}\n\nتفسير ابن كثير:\n${tafsirIbnKathir[selectedTafsirAyah.numberInSurah - 1]?.text || ""}\n\nتفسير الطبري:\n${tafsirTabari[selectedTafsirAyah.numberInSurah - 1]?.text || ""}`;
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

        {/* Dialog for Selected Page Ayah (in Page View) */}
        {selectedPageAyah && (
          <Dialog open={true} onOpenChange={() => setSelectedPageAyah(null)}>
            <DialogContent className="max-w-xl rounded-[2rem] p-6 gap-4 bg-card/95 backdrop-blur-md border-primary/10 max-h-[85vh] overflow-y-auto">
              <DialogHeader className="text-start border-b border-primary/5 pb-3">
                <DialogTitle className="text-xl font-bold font-heading text-primary flex items-center justify-between">
                  <span>
                    {i18n.language === 'ar' ? selectedPageAyah.surah.name : selectedPageAyah.surah.englishName} — {t("quran.ayah", { defaultValue: "آية" })} {selectedPageAyah.numberInSurah}
                  </span>
                  <span className="text-xs text-muted-foreground bg-primary/5 px-2.5 py-1 rounded-full font-medium">
                    {t("quran.page", { defaultValue: "صفحة" })} {selectedPageAyah.page}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Arabic text */}
                <div className="bg-amber-500/5 p-5 rounded-2xl text-center border border-amber-500/10" dir="rtl">
                  <p className="dhikr-text text-3xl leading-[1.8] text-amber-955 dark:text-amber-100 font-medium select-all">
                    {cleanBismillah(selectedPageAyah.text)}
                  </p>
                </div>

                {/* Play control for this specific ayah */}
                <div className="flex justify-center py-2">
                  <Button
                    onClick={() => {
                      if (selectedPageAyahIndex !== null) {
                        playAyah(selectedPageAyah, selectedPageAyahIndex);
                      }
                    }}
                    className="rounded-full px-6 py-5 gap-2 bg-primary text-white hover:bg-primary/95 shadow-md text-sm font-medium"
                  >
                    {((selectedQari.type === "ayah" && activeAyahIndex === selectedPageAyahIndex && isPlaying) ||
                      (selectedQari.type === "surah" && playingSingleAyahId === selectedPageAyah.number && isPlaying)) ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>{t("common.pause", { defaultValue: "إيقاف مؤقت" })}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 ml-0.5" />
                        <span>{t("common.play", { defaultValue: "سماع الآية" })}</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Translation */}
                {selectedPageAyah.translatedText && !isArabic(i18n.language) && (
                  <div 
                    className={cn("bg-muted/30 p-4 rounded-2xl", isRTL(i18n.language) ? "text-right" : "text-left")} 
                    dir={getTextDirection(i18n.language)}
                  >
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                      {t("quran.translation", { defaultValue: "الترجمة" })}
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed">
                      {selectedPageAyah.translatedText}
                    </p>
                  </div>
                )}

                {/* Tafsirs section */}
                {pageAyahTafsirLoading ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] text-muted-foreground font-medium">جاري تحميل التفاسير...</p>
                  </div>
                ) : pageAyahTafsirs ? (
                  <div className="space-y-3 pt-2">
                    {pageAyahTafsirs.muyassar && (
                      <div className="border border-amber-500/10 bg-amber-500/5 p-4 rounded-2xl text-right" dir="rtl">
                        <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5">{t("quran.tafsir_muyassar")}</h4>
                        <p className="text-sm text-amber-955/80 dark:text-amber-100 leading-relaxed font-sans">{pageAyahTafsirs.muyassar}</p>
                      </div>
                    )}

                    {pageAyahTafsirs.jalalayn && (
                      <div className="border border-primary/10 bg-primary/5 p-4 rounded-2xl text-right" dir="rtl">
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">{t("quran.tafsir_jalalayn")}</h4>
                        <p className="text-sm text-foreground leading-relaxed font-sans">{pageAyahTafsirs.jalalayn}</p>
                      </div>
                    )}

                    {pageAyahTafsirs.saadi && (
                      <div className="border border-orange-500/10 bg-orange-500/5 p-4 rounded-2xl text-right" dir="rtl">
                        <h4 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1.5">{t("quran.tafsir_saadi", { defaultValue: "تفسير السعدي" })}</h4>
                        <p className="text-sm text-foreground leading-relaxed font-sans">{pageAyahTafsirs.saadi}</p>
                      </div>
                    )}

                    {pageAyahTafsirs.ibnKathir && (
                      <div className="border border-emerald-500/10 bg-emerald-500/5 p-4 rounded-2xl text-right" dir="rtl">
                        <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">{t("quran.tafsir_ibn_kathir")}</h4>
                        <div 
                          dangerouslySetInnerHTML={{ __html: pageAyahTafsirs.ibnKathir }}
                          className="text-sm text-foreground leading-relaxed quran-tafsir-html"
                        />
                      </div>
                    )}

                    {pageAyahTafsirs.tabari && (
                      <div className="border border-blue-500/10 bg-blue-500/5 p-4 rounded-2xl text-right" dir="rtl">
                        <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">{t("quran.tafsir_tabari", { defaultValue: "تفسير الطبري" })}</h4>
                        <div 
                          dangerouslySetInnerHTML={{ __html: pageAyahTafsirs.tabari }}
                          className="text-sm text-foreground leading-relaxed quran-tafsir-html"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  selectedPageAyah.tafsirText && (
                    <div className="border border-amber-500/10 bg-amber-500/5 p-4 rounded-2xl text-right" dir="rtl">
                      <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5">{t("quran.tafsir_muyassar")}</h4>
                      <p className="text-sm text-amber-955/80 dark:text-amber-100 leading-relaxed font-sans">{selectedPageAyah.tafsirText}</p>
                    </div>
                  )
                )}

                {/* Bottom actions */}
                <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-primary/5">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const currentSurahObj = surahs.find(s => s.number === selectedPageAyah.surah.number) || {
                        number: selectedPageAyah.surah.number,
                        name: selectedPageAyah.surah.name
                      };
                      toggleBookmark(selectedPageAyah, currentSurahObj as Surah);
                    }}
                    className="rounded-xl gap-2 text-xs"
                  >
                    {bookmarks.some(b => b.surahNumber === selectedPageAyah.surah.number && b.ayahNumber === selectedPageAyah.numberInSurah) ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                        <span>{t("quran.bookmarked", { defaultValue: "محفوظة" })}</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" />
                        <span>{t("quran.bookmark", { defaultValue: "حفظ علامة" })}</span>
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const cleanText = cleanBismillah(selectedPageAyah.text);
                      const surahTitle = i18n.language === "ar" ? selectedPageAyah.surah.name : selectedPageAyah.surah.englishName;
                      const source = `${surahTitle} - ${t("quran.ayah", { defaultValue: "آية" })} ${selectedPageAyah.numberInSurah}`;
                      await copyDhikrText(
                        source,
                        cleanText,
                        source,
                        i18n.language
                      );
                    }}
                    className="rounded-xl gap-2 text-xs"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{t("common.copy", { defaultValue: "نسخ الآية" })}</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={async () => {
                      const cleanText = cleanBismillah(selectedPageAyah.text);
                      const surahTitle = i18n.language === "ar" ? selectedPageAyah.surah.name : selectedPageAyah.surah.englishName;
                      const source = `${surahTitle} - ${t("quran.ayah", { defaultValue: "آية" })} ${selectedPageAyah.numberInSurah}`;
                      const rawTafsir = `الآية: ${selectedPageAyah.text}\n\nتفسير الميسر:\n${pageAyahTafsirs?.muyassar || selectedPageAyah.tafsirText || ""}\n\nتفسير الجلالين:\n${pageAyahTafsirs?.jalalayn || ""}\n\nتفسير السعدي:\n${pageAyahTafsirs?.saadi || ""}\n\nتفسير ابن كثير:\n${pageAyahTafsirs?.ibnKathir || ""}\n\nتفسير الطبري:\n${pageAyahTafsirs?.tabari || ""}`;
                      let finalTafsirText = rawTafsir;
                      if (i18n.language !== "ar") {
                        const translatedTafsir = await translateText(pageAyahTafsirs?.muyassar || selectedPageAyah.tafsirText || "", i18n.language);
                        const translatedAyah = await translateText(cleanText, i18n.language);
                        finalTafsirText = `${surahTitle} (${selectedPageAyah.numberInSurah})\n\nAyah (Arabic): ${selectedPageAyah.text}\n\nAyah (Translation): ${translatedAyah}\n\nTafsir / Meaning:\n${translatedTafsir}`;
                      }
                      await copyDhikrText(
                        source,
                        finalTafsirText,
                        source,
                        i18n.language
                      );
                    }}
                    className="rounded-xl gap-2 text-xs"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{t("quran.copy_tafsir", { defaultValue: "نسخ بالترجمة والتفسير" })}</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const cleanText = cleanBismillah(selectedPageAyah.text);
                      const surahTitle = i18n.language === "ar" ? selectedPageAyah.surah.name : selectedPageAyah.surah.englishName;
                      exportToImage(
                        `${surahTitle} - ${t("quran.ayah", { defaultValue: "آية" })} ${selectedPageAyah.numberInSurah}`,
                        cleanText,
                        `${surahTitle} (${selectedPageAyah.numberInSurah})`,
                        i18n.language
                      );
                    }}
                    className="rounded-xl gap-2 text-xs"
                  >
                    <Image className="w-4 h-4" />
                    <span>{t("common.export_image", { defaultValue: "تصدير كصورة" })}</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={async () => {
                      const cleanText = cleanBismillah(selectedPageAyah.text);
                      const surahTitle = i18n.language === "ar" ? selectedPageAyah.surah.name : selectedPageAyah.surah.englishName;
                      const source = `${surahTitle} - ${t("quran.ayah", { defaultValue: "آية" })} ${selectedPageAyah.numberInSurah}`;
                      await shareText(
                        source,
                        cleanText,
                        source,
                        i18n.language
                      );
                    }}
                    className="rounded-xl gap-2 text-xs"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{i18n.language === "ar" ? "مشاركة" : "Share"}</span>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Floating bottom audio player */}
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-2 right-2 md:left-auto md:right-auto md:w-[min(calc(100vw-4rem),720px)] md:mx-auto md:inset-x-0 z-40 bg-card/95 backdrop-blur-md border border-primary/10 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl p-3 md:p-5 flex flex-col gap-2 md:gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* Left: Info */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
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
                <div className="min-w-0">
                  <h4 className="text-[11px] md:text-xs font-bold text-foreground truncate max-w-[100px] md:max-w-none">
                    {selectedQari.type === "ayah" && activeAyahIndex !== null 
                      ? `${t("quran.ayah", { defaultValue: "آية" })} ${ayahs[activeAyahIndex].numberInSurah}`
                      : t("quran_audio.playing_surah", { defaultValue: "تشغيل السورة" })}
                  </h4>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground truncate max-w-[100px] md:max-w-none">
                    {i18n.language === "ar" ? selectedQari.name : selectedQari.englishName}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Play controls */}
            <div className="flex items-center justify-center gap-2 md:gap-3 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 md:w-8 md:h-8 rounded-full text-primary hover:bg-primary/5"
                onClick={skipPrev}
                title={t("quran_audio.prev_ayah")}
              >
                <SkipBack className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
              <Button
                size="icon"
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary hover:bg-primary/90 text-white shadow-md"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5" /> : <Play className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 md:w-8 md:h-8 rounded-full text-primary hover:bg-primary/5"
                onClick={skipNext}
                title={t("quran_audio.next_ayah")}
              >
                <SkipForward className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
            </div>

            {/* Right: Selectors (Reciter & Speed) - Desktop only */}
            <div className="hidden md:flex items-center justify-end gap-3">
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
                  <SelectContent className="rounded-xl max-h-72">
                    {RECITERS.filter(q => !q.surahList || (activeSurah && q.surahList.includes(activeSurah))).map((q) => (
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
                <Select value={String(playbackSpeed)} onValueChange={(val) => setPlaybackSpeed(parseFloat(val))}>
                  <SelectTrigger className="w-[75px] h-8 rounded-xl border-primary/10 bg-white/50 text-[10px]">
                    <SelectValue placeholder="1x" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["0.5", "0.75", "1", "1.25", "1.5", "2"].map((speed) => (
                      <SelectItem key={speed} value={speed} className="text-[10px]">{speed}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Mobile: Reciter + Speed row */}
          <div className="flex md:hidden items-center gap-2 pt-1 border-t border-primary/5">
            <Select value={selectedQariId} onValueChange={(val) => {
              setSelectedQariId(val);
              localStorage.setItem("quran_selected_qari", val);
            }}>
              <SelectTrigger className="flex-1 h-8 rounded-xl border-primary/10 bg-white/50 text-[10px]">
                <SelectValue placeholder={t("quran.select_reciter", { defaultValue: "اختر القارئ" })} />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-64">
                {RECITERS.filter(q => !q.surahList || (activeSurah && q.surahList.includes(activeSurah))).map((q) => (
                  <SelectItem key={q.id} value={q.id} className="text-[11px]">
                    {i18n.language === "ar" ? q.name : q.englishName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(playbackSpeed)} onValueChange={(val) => setPlaybackSpeed(parseFloat(val))}>
              <SelectTrigger className="w-[65px] h-8 rounded-xl border-primary/10 bg-white/50 text-[10px]">
                <SelectValue placeholder="1x" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {["0.5", "0.75", "1", "1.25", "1.5", "2"].map((speed) => (
                  <SelectItem key={speed} value={speed} className="text-[10px]">{speed}x</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Configuration Switches Row */}
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
      <div className="text-center space-y-3 pt-6 flex flex-col items-center">
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-4xl font-heading font-bold text-primary">{t("nav.quran")}</h2>
          <SectionBooklet sectionId="quran" />
        </div>
        <p className="text-muted-foreground text-lg">{t("quran.subtitle")}</p>
        <div className="pt-2">{renderViewSwitcher()}</div>
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
            onClick={() => handleSurahClick(lastRead)}
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
              onClick={() => handleSurahClick(surah.number)}
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
