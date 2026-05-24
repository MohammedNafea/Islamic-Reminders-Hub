import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Dhikr } from "@/data/adhkar";
import { getDailyProgress, setDhikrCount, getSettings } from "@/lib/store";
import { Check, Repeat, Volume2, Square, Heart, Play, SkipForward } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { isArabic, getTranslation } from "@/lib/content-i18n";
import { logCategoryCompletion } from "@/lib/tracker";
import { TranslatedText } from "@/components/TranslatedText";
import { adhkarAudioMap } from "@/data/adhkarAudioMap";


interface DhikrListProps {
  adhkar: Dhikr[];
  titleKey: string;
  isEvening?: boolean;
  compact?: boolean;
}

export function DhikrList({ adhkar, titleKey, isEvening = false, compact = false }: DhikrListProps) {
  const { t, i18n } = useTranslation();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const { toggleFavorite, isFavorite } = useFavorites();
  const settings = getSettings();
  
  const vibrateRef = useRef<number>(0);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Audio elements and references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCleanupRef = useRef<(() => void) | null>(null);

  const cleanupAudio = () => {
    if (audioCleanupRef.current) {
      audioCleanupRef.current();
      audioCleanupRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  // Audio playlist state
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [activePlayIndex, setActivePlayIndex] = useState<number | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const stopPlaylist = useCallback(() => {
    window.speechSynthesis.cancel();
    cleanupAudio();
    setIsPlayingAll(false);
    setActivePlayIndex(null);
    setSpeakingId(null);
  }, []);

  // Sync state to ref to avoid stale closures in audio event listeners
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    setProgress(getDailyProgress());

    const handleStopAllAudio = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.sender !== "dhikr-list") {
        stopPlaylist();
      }
    };

    window.addEventListener("stop-all-audio", handleStopAllAudio);

    return () => {
      window.removeEventListener("stop-all-audio", handleStopAllAudio);
      window.speechSynthesis.cancel();
      cleanupAudio();
    };
  }, [stopPlaylist]);

  const totalRequired = adhkar.reduce((sum, d) => sum + d.count, 0);
  const totalCompleted = adhkar.reduce((sum, d) => {
    const p = progress[d.id] || 0;
    return sum + (p > d.count ? d.count : p);
  }, 0);
  const percentComplete = totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0;

  // Log completion when completed
  useEffect(() => {
    if (percentComplete === 100 && totalRequired > 0) {
      let category = "other";
      if (titleKey.toLowerCase().includes("morning")) category = "morning";
      else if (titleKey.toLowerCase().includes("evening")) category = "evening";
      else if (titleKey.toLowerCase().includes("sleep")) category = "sleep";
      else if (titleKey.toLowerCase().includes("prayer")) category = "prayer";
      else if (titleKey.toLowerCase().includes("ruqyah")) category = "ruqyah";
      else if (titleKey.toLowerCase().includes("house")) category = "house";
      else if (titleKey.toLowerCase().includes("masjid")) category = "masjid";
      logCategoryCompletion(category);
    }
  }, [percentComplete, titleKey, totalRequired]);

  // Audio helper utilities
  const getQariFolder = (id: string): string => {
    switch (id) {
      case "ghamdi":
        return "Ghamadi_40kbps";
      case "fares":
        return "Fares_Abbad_64kbps";
      case "husary":
      default:
        return "Husary_128kbps";
    }
  };

  const playAudioFile = (url: string, onEnd: () => void, onError: (err: unknown) => void) => {
    cleanupAudio();
    window.dispatchEvent(new CustomEvent("stop-all-audio", { detail: { sender: "dhikr-list" } }));

    const audio = new Audio(url);
    audioRef.current = audio;

    const handleEnded = () => {
      cleanupAudio();
      onEnd();
    };

    const handleError = (err: unknown) => {
      cleanupAudio();
      onError(err);
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    audioCleanupRef.current = () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };

    audio.load();
    audio.play().catch(err => {
      if (audioRef.current === audio) {
        cleanupAudio();
        onError(err);
      }
    });
  };

  const playTTS = (text: string, onEnd: () => void, onError: () => void) => {
    window.speechSynthesis.cancel();
    window.dispatchEvent(new CustomEvent("stop-all-audio", { detail: { sender: "dhikr-list" } }));

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = 0.9;
    
    utterance.onend = () => {
      onEnd();
    };
    
    utterance.onerror = () => {
      onError();
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const handleTap = (dhikr: Dhikr) => {
    // If autoplay is running, stop it first to prevent confusion
    if (isPlayingAll) {
      stopPlaylist();
    }

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
          navigator.vibrate([50, 100, 50]); 
        } else {
          navigator.vibrate(20); 
        }
        vibrateRef.current = now;
      }
    }
  };

  const handleReset = (id: string) => {
    if (isPlayingAll) {
      stopPlaylist();
    }
    const newProgress = { ...progress };
    delete newProgress[id];
    setProgress(newProgress);
    setDhikrCount(id, 0);
  };

  const playDhikrAtIndex = (index: number, ayahIndex = 0) => {
    if (index < 0 || index >= adhkar.length) {
      stopPlaylist();
      return;
    }

    const dhikr = adhkar[index];
    const currentCount = progressRef.current[dhikr.id] || 0;

    // If already fully completed, skip to the next
    if (currentCount >= dhikr.count) {
      let nextIdx = index + 1;
      while (nextIdx < adhkar.length && (progressRef.current[adhkar[nextIdx].id] || 0) >= adhkar[nextIdx].count) {
        nextIdx++;
      }
      playDhikrAtIndex(nextIdx, 0);
      return;
    }

    setActivePlayIndex(index);
    setSpeakingId(dhikr.id);
    setIsPlayingAll(true);

    // Scroll active card into view smoothly
    setTimeout(() => {
      const element = cardRefs.current[dhikr.id];
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);

    const arabicText = isEvening && dhikr.eveningVariant ? dhikr.eveningVariant : dhikr.arabic;
    const audioConfig = adhkarAudioMap[dhikr.id];

    // Helper for incrementing progress and transitioning
    const handleProgressIncrement = () => {
      const nextCount = (progressRef.current[dhikr.id] || 0) + 1;
      const newProgress = { ...progressRef.current, [dhikr.id]: nextCount };
      setProgress(newProgress);
      setDhikrCount(dhikr.id, nextCount);

      if (settings.vibrate && navigator.vibrate) {
        if (nextCount === dhikr.count) {
          navigator.vibrate([50, 100, 50]);
        } else {
          navigator.vibrate(20);
        }
      }

      if (nextCount >= dhikr.count) {
        let nextIdx = index + 1;
        while (nextIdx < adhkar.length && (newProgress[adhkar[nextIdx].id] || 0) >= adhkar[nextIdx].count) {
          nextIdx++;
        }
        playDhikrAtIndex(nextIdx, 0);
      } else {
        // Repeat this one
        playDhikrAtIndex(index, 0);
      }
    };

    // Helper for playing TTS fallback
    const playTTSFallback = () => {
      playTTS(arabicText, handleProgressIncrement, () => {
        handleProgressIncrement();
      });
    };

    if (audioConfig) {
      if (audioConfig.type === "quran" && audioConfig.surah && audioConfig.ayahs && audioConfig.ayahs.length > 0) {
        if (ayahIndex < audioConfig.ayahs.length) {
          const qariId = localStorage.getItem("quran_selected_qari") || "husary";
          const qariFolder = getQariFolder(qariId);
          const pad = (num: number, size: number) => {
            let s = num.toString();
            while (s.length < size) s = "0" + s;
            return s;
          };
          const url = `https://everyayah.com/data/${qariFolder}/${pad(audioConfig.surah, 3)}${pad(audioConfig.ayahs[ayahIndex], 3)}.mp3`;
          
          playAudioFile(url, () => {
            if (ayahIndex + 1 < audioConfig.ayahs!.length) {
              playDhikrAtIndex(index, ayahIndex + 1);
            } else {
              handleProgressIncrement();
            }
          }, (err) => {
            console.error("Audio playback error, falling back to TTS", err);
            playTTSFallback();
          });
        } else {
          handleProgressIncrement();
        }
      } else if (audioConfig.type === "dureihim" && audioConfig.filename) {
        const url = `https://raw.githubusercontent.com/rn0x/Adhkar-json/main/audio/${audioConfig.filename}.mp3`;
        playAudioFile(url, () => {
          handleProgressIncrement();
        }, (err) => {
          console.error("Audio playback error, falling back to TTS", err);
          playTTSFallback();
        });
      } else {
        playTTSFallback();
      }
    } else {
      playTTSFallback();
    }
  };

  const startPlaylist = () => {
    // Find first incomplete dhikr, or start from index 0
    let firstIncompleteIndex = adhkar.findIndex(d => (progress[d.id] || 0) < d.count);
    if (firstIncompleteIndex === -1) {
      // All completed, reset all progress in this view and start from 0
      const resetProgress = { ...progress };
      adhkar.forEach(d => {
        resetProgress[d.id] = 0;
        setDhikrCount(d.id, 0);
      });
      setProgress(resetProgress);
      firstIncompleteIndex = 0;
    }
    playDhikrAtIndex(firstIncompleteIndex, 0);
  };

  const speak = (id: string, text: string) => {
    if (isPlayingAll) {
      stopPlaylist();
    }

    if (speakingId === id && !isPlayingAll) {
      window.speechSynthesis.cancel();
      cleanupAudio();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    cleanupAudio();

    setSpeakingId(id);

    const dhikr = adhkar.find(d => d.id === id);
    if (!dhikr) {
      playTTS(text, () => setSpeakingId(null), () => setSpeakingId(null));
      return;
    }

    const audioConfig = adhkarAudioMap[id];
    
    const playTTSPreviewFallback = () => {
      playTTS(text, () => setSpeakingId(null), () => setSpeakingId(null));
    };

    if (audioConfig) {
      if (audioConfig.type === "quran" && audioConfig.surah && audioConfig.ayahs && audioConfig.ayahs.length > 0) {
        const playAyahSequence = (ayahIndex: number) => {
          if (ayahIndex >= audioConfig.ayahs!.length) {
            setSpeakingId(null);
            return;
          }
          const qariId = localStorage.getItem("quran_selected_qari") || "husary";
          const qariFolder = getQariFolder(qariId);
          const pad = (num: number, size: number) => {
            let s = num.toString();
            while (s.length < size) s = "0" + s;
            return s;
          };
          const url = `https://everyayah.com/data/${qariFolder}/${pad(audioConfig.surah!, 3)}${pad(audioConfig.ayahs![ayahIndex], 3)}.mp3`;
          
          playAudioFile(url, () => {
            playAyahSequence(ayahIndex + 1);
          }, (err) => {
            console.error("Single play audio error, falling back to TTS", err);
            playTTSPreviewFallback();
          });
        };
        playAyahSequence(0);
      } else if (audioConfig.type === "dureihim" && audioConfig.filename) {
        const url = `https://raw.githubusercontent.com/rn0x/Adhkar-json/main/audio/${audioConfig.filename}.mp3`;
        playAudioFile(url, () => {
          setSpeakingId(null);
        }, (err) => {
          console.error("Single play audio error, falling back to TTS", err);
          playTTSPreviewFallback();
        });
      } else {
        playTTSPreviewFallback();
      }
    } else {
      playTTSPreviewFallback();
    }
  };

  return (
    <div className="space-y-6">
      {!compact && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
            {titleKey && (
              <h2 className="text-2xl font-heading font-bold text-primary">
                <TranslatedText
                  text={t(titleKey, { lng: "ar" })}
                  staticTranslation={getTranslation(t, titleKey, i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </h2>
            )}
            
            {/* Audio Autoplay controller */}
            <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-lg border border-border/50 self-start sm:self-auto">
              {isPlayingAll ? (
                <>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded text-xs text-primary font-medium">
                    <span className="flex items-center gap-0.5 h-3">
                      <motion.span animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-0.5 bg-primary rounded-full" />
                      <motion.span animate={{ height: [12, 4, 12] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-primary rounded-full" />
                      <motion.span animate={{ height: [6, 12, 6] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-0.5 bg-primary rounded-full" />
                    </span>
                    <span>
                      <TranslatedText
                        text="تلاوة متتالية..."
                        staticTranslation={getTranslation(t, "audio.playing", i18n.language) || undefined}
                        keepArabic={false}
                        inline
                      />
                    </span>
                  </div>
                  <button
                    onClick={() => playDhikrAtIndex(activePlayIndex !== null ? activePlayIndex + 1 : 0)}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                    title={t("audio.skip", { defaultValue: "تخطي الذكر" })}
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <button
                    onClick={stopPlaylist}
                    className="p-1 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded"
                    title={t("audio.stop", { defaultValue: "إيقاف التلاوة" })}
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                </>
              ) : (
                <button
                  onClick={startPlaylist}
                  className="flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-md shadow-sm transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    <TranslatedText
                      text="تلاوة متتالية للأذكار"
                      staticTranslation={getTranslation(t, "audio.play_all", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </span>
                </button>
              )}
            </div>
          </div>
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
            const isCurrentlyPlaying = activePlayIndex === index;
            
            // Arabic original is ALWAYS shown; translation appears below for non-Arabic languages
            const arabicText = isEvening && dhikr.eveningVariant ? dhikr.eveningVariant : dhikr.arabic;
            const translationKey = `adhkar.items.${dhikr.id}`;
            const translatedText = isArabic(i18n.language) ? null : getTranslation(t, translationKey, i18n.language);
            
            const sourceKey = `adhkar.sources.${dhikr.source}`;
            const translatedSource = isArabic(i18n.language) ? null : getTranslation(t, sourceKey, i18n.language);

            return (
              <motion.div
                key={dhikr.id}
                ref={(el) => { cardRefs.current[dhikr.id] = el; }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={cn(
                    "overflow-hidden transition-all duration-300 select-none cursor-pointer border relative",
                    isCurrentlyPlaying
                      ? "ring-2 ring-primary border-primary bg-primary/5 shadow-md scale-[1.01]"
                      : isCompleted 
                        ? "bg-primary/5 border-primary/20 shadow-sm" 
                        : "bg-card hover:bg-muted/30 hover:border-primary/30"
                  )}
                  onClick={() => handleTap(dhikr)}
                >
                  <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <TranslatedText
                      text={arabicText}
                      staticTranslation={translatedText || undefined}
                      keepArabic={true}
                      arabicClassName="text-right"
                      translationClassName="dhikr-translation pt-4"
                    />
                    
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-sm text-muted-foreground">
                      <div className="space-y-1.5 flex-1">
                        <TranslatedText
                          text={dhikr.source}
                          staticTranslation={translatedSource || undefined}
                          keepArabic={true}
                          isDhikr={false}
                          className="font-medium text-foreground"
                          arabicClassName="text-sm text-right block"
                          translationClassName="text-xs text-muted-foreground block border-t-0 pt-0 mt-0"
                        />
                        {dhikr.note && (
                          <TranslatedText
                            text={dhikr.note}
                            staticTranslation={getTranslation(t, `adhkar.notes.${dhikr.note}`, i18n.language) || undefined}
                            keepArabic={false}
                            className="text-xs text-muted-foreground"
                          />
                        )}
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

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(dhikr.id);
                          }}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            isFavorite(dhikr.id)
                              ? "text-red-500 bg-red-50"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <Heart className={cn("w-4 h-4", isFavorite(dhikr.id) && "fill-current")} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(dhikr.id, arabicText);
                          }}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            speakingId === dhikr.id 
                              ? "bg-primary/20 text-primary animate-pulse" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          {speakingId === dhikr.id ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        
                        <div className={cn(
                          "flex items-center justify-center gap-2 rounded-full px-4 py-2 font-medium transition-colors",
                          isCompleted 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {isCompleted ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>
                                <TranslatedText
                                  text="تم"
                                  staticTranslation={getTranslation(t, "common.done", i18n.language) || undefined}
                                  keepArabic={false}
                                  inline
                                />
                              </span>
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