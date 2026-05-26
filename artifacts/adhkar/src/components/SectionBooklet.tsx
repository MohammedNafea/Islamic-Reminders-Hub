import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TranslatedText } from "@/components/TranslatedText";
import { 
  BookOpen, ChevronLeft, ChevronRight, HelpCircle, Sparkles, BookMarked 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BookletContent {
  title: string;
  about: string;
  howToUse: string;
  features: string;
}

const bookletData: Record<string, BookletContent> = {
  home: {
    title: "الصفحة الرئيسية",
    about: "هذه هي الصفحة الرئيسية لتطبيق وموقع مركز الأذكار. تمنحك نظرة عامة سريعة على عباداتك اليومية وأهم الأذكار والآيات والأحاديث التي تتجدد كل ساعة لتكون رفيقتك طوال اليوم.",
    howToUse: "تصفح بطاقات الأذكار السريعة للدخول لأذكار الصباح والمساء. انقر على زر الصلاة على النبي لتسجيل صلواتك اليومية. تابع مواقيت الصلاة القادمة والنسبة المئوية لتقدمك اليومي في لوحة العبادات.",
    features: "التغيير التلقائي لمظهر الموقع بناءً على وقت الصلاة الحالي (فجر، ضحى، مغرب، سحر). بطاقة 'حديث الساعة' و'آية الساعة' للتذكير المستمر. إحصائيات سريعة للالتزام اليومي."
  },
  adhkar: {
    title: "مركز الأذكار",
    about: "قسم شامل يضم كافة الأذكار والأدعية التي يحتاجها المسلم في يومه وليلته وفي مختلف أحواله ومواقفه، مستوحاة من كتاب حصن المسلم والأدعية القرآنية والنبوية المأثورة.",
    howToUse: "اختر القسم الفرعي الذي تريده (أذكار الصباح، أذكار المساء، أذكار الصلاة، أدعية الكرب، أدعية القرآن الكريم). يمكنك تشغيل الصوت البشري لكل ذكر بنقرة واحدة، واستخدام زر العداد لتكرار الذكر حتى تكتمل السنة.",
    features: "تغطية صوتية كاملة بنسبة 100% بصوت بشري نقي. ميزة التراجم الفورية إلى 70 لغة مختلفة. إمكانية إضافة الأذكار إلى قائمة المفضلة للوصول السريع إليها لاحقاً."
  },
  quran: {
    title: "المصحف الشريف",
    about: "القرآن الكريم كاملاً بالرسم العثماني للقراءة والاستماع والتفسير والترجمة لأكثر من 70 لغة عالمية.",
    howToUse: "اختر السورة من الفهرس. يمكنك قراءة الآيات وتكبير/تصغير الخط. انقر على أي آية لتشغيل صوت القارئ المفضل لديك، أو انقر على زر التشغيل الرئيسي للاستماع للسورة كاملة.",
    features: "مكتبة صوتية لأكثر من 10 قراء مشاهير (الحصري، المنشاوي، عبد الباسط، المعيقلي...). ميزة تكرار الآية لتحفيظ القرآن. عرض التفسير الميسر والترجمات الفورية لكل آية."
  },
  zakat: {
    title: "حاسبة الزكاة",
    about: "أداة فقهية وحسابية متطورة تتيح لك حساب زكاة أموالك ومدخراتك بدقة وسهولة تامة بناءً على الفقه الإسلامي المعتمد.",
    howToUse: "أدخل مبالغ النقود السائلة، والذهب والفضة التي تملكها بالجرامات، وقيمة البضائع التجارية. أدخل الديون التي عليك ليتم خصمها تلقائياً. سيقوم النظام بحساب النصاب وإخبارك بوجوب الزكاة ومقدارها.",
    features: "التحديث التلقائي اليومي لأسعار الذهب والفضة بالاعتماد على الأسواق العالمية. الحساب التلقائي للنصاب الفقهي (ما يعادل 85 جرام من الذهب عيار 24). تقرير مفصل باللغة والعملة المحلية."
  },
  prayer: {
    title: "مواقيت الصلاة والقبلة",
    about: "مواقيت الصلاة الدقيقة لكل دول العالم مع بوصلة ذكية لتحديد اتجاه القبلة من أي مكان.",
    howToUse: "اسمح للموقع بالوصول لموقعك الجغرافي لحساب المواقيت بدقة متناهية، أو اختر مدينتك يدوياً. لاستخدام القبلة، ضع هاتفك بشكل مسطح وقم بتدويره حتى يتطابق سهم الكعبة مع المؤشر.",
    features: "حساب المواقيت بالكامل محلياً وبدون الحاجة لإنترنت. دعم طرق الحساب العالمية المختلفة (أم القرى، رابطة العالم الإسلامي، الهيئة المصرية...). بوصلة قبلة ثلاثية الأبعاد متفاعلة."
  },
  tasbih: {
    title: "المسبحة الإلكترونية",
    about: "مسبحة تفاعلية متطورة تعينك على ذكر الله والاستغفار والتسبيح في أي وقت وبكل سهولة.",
    howToUse: "انقر على الدائرة الكبيرة في المركز لزيادة عدد التسبيحات. يمكنك إعادة العداد إلى الصفر، وتحديد هدف معين (مثل 33 أو 99 تسبيحة).",
    features: "الاهتزاز والتنبيه الصوتي عند الوصول للهدف المحدد. دعم التسبيح المخصص بكتابة الذكر الذي تريده. حفظ تلقائي للتقدم حتى لو قمت بإغلاق المتصفح."
  },
  tracker: {
    title: "مسار الالتزام",
    about: "أداة تفاعلية سرية لمتابعة وتقييم التزامك اليومي بالصلوات الخمس في وقتها، والنوافل، وقراءة القرآن، والأذكار اليومية.",
    howToUse: "في نهاية كل يوم، قم بتسجيل الصلوات التي أديتها (جماعة، في وقتها، نافلة) وحدد إذا كنت قد قرأت وردك القرآني وأذكارك اليومية.",
    features: "عرض إحصائي ورسوم بيانية أسبوعية وشهرية لمدى التزامك. حساب معدل Streaks (الأيام المتتالية من الالتزام) لتحفيزك. حماية تامة للخصوصية حيث تحفظ البيانات محلياً فقط."
  },
  hadith: {
    title: "الأحاديث والأحكام",
    about: "موسوعة إسلامية علمية تضم مئات الأحاديث النبوية الصحيحة، والفتاوى الفقهية المعتمدة، ومقتطفات من أمهات الكتب العلمية.",
    howToUse: "تصفح الفئات المختلفة (عقيدة، تفسير، فقه، أخلاق، سيرة نبوية). استخدم شريط البحث الذكي في الأعلى للبحث عن المسائل الفقهية أو الأحاديث.",
    features: "محرك بحث ذكي يعتمد على الذكاء الاصطناعي لفهم معنى السؤال وسياقه بدلاً من الكلمات الحرفية فقط. إمكانية نسخ ومشاركة الأحاديث وحفظها في المفضلة."
  }
};

interface SectionBookletProps {
  sectionId: keyof typeof bookletData;
}

export function SectionBooklet({ sectionId }: SectionBookletProps) {
  const { i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const data = bookletData[sectionId];
  const isRtl = i18n.language === "ar" || i18n.language === "fa" || i18n.language === "ur" || i18n.language === "ckb" || i18n.language === "ps" || i18n.language === "he";

  if (!data) return null;

  const totalPages = 3;

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const getPageTitle = (page: number) => {
    switch (page) {
      case 1: return "عن القسم";
      case 2: return "كيفية الاستخدام";
      case 3: return "أهم المميزات";
      default: return "";
    }
  };

  const getPageContent = (page: number) => {
    switch (page) {
      case 1: return data.about;
      case 2: return data.howToUse;
      case 3: return data.features;
      default: return "";
    }
  };

  return (
    <Dialog onOpenChange={(open) => { if (open) setCurrentPage(1); }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative gap-1.5 px-3 py-1.5 h-8 text-xs font-bold border-primary/20 bg-background/50 hover:bg-primary/10 hover:text-primary transition-all rounded-xl shadow-sm hover:shadow group overflow-hidden"
        >
          <BookOpen className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform duration-300" />
          <span className="hidden sm:inline">
            <TranslatedText 
              text="دليل الاستخدام" 
              staticTranslation={i18n.language === "ar" ? "دليل الاستخدام" : "User Guide"}
              keepArabic={false} 
            />
          </span>
          <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-[92vw] sm:max-w-[480px] p-0 border-none bg-transparent shadow-2xl overflow-hidden rounded-[2.5rem]">
        <div className="relative bg-[#faf7f0] dark:bg-[#1a1917] text-amber-950 dark:text-amber-50 p-6 sm:p-8 min-h-[460px] flex flex-col justify-between border-8 border-[#eadaa6] dark:border-[#2d2a23] rounded-[2.5rem] shadow-2xl">
          
          {/* Booklet binding visual effect */}
          <div className="absolute top-0 bottom-0 left-4 w-1 flex flex-col justify-around py-8 pointer-events-none opacity-40 dark:opacity-20 z-20">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full border-2 border-amber-950 dark:border-amber-50 -ml-1.5 bg-gradient-to-r from-zinc-400 to-zinc-200" />
            ))}
          </div>

          <div className="absolute top-4 right-4 z-30">
            <DialogClose asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8 rounded-full hover:bg-amber-900/10 dark:hover:bg-amber-50/10 text-amber-900 dark:text-amber-50"
              >
                ✕
              </Button>
            </DialogClose>
          </div>

          {/* Booklet Header */}
          <DialogHeader className="pt-2 pb-4 border-b border-amber-900/10 dark:border-amber-50/10">
            <DialogTitle className="flex items-center gap-2 text-xl font-heading font-bold text-amber-900 dark:text-amber-50">
              <BookMarked className="w-5 h-5" />
              <span>
                <TranslatedText 
                  text={data.title} 
                  staticTranslation={i18n.language === "ar" ? data.title : undefined}
                  keepArabic={false} 
                />
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Booklet Page Content */}
          <div className="flex-1 py-6 flex flex-col justify-center pl-4 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-900/10 dark:bg-amber-50/10 text-amber-800 dark:text-amber-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    <TranslatedText 
                      text={getPageTitle(currentPage)} 
                      staticTranslation={i18n.language === "ar" ? getPageTitle(currentPage) : undefined}
                      keepArabic={false} 
                    />
                  </span>
                </div>
                
                <h4 className="text-base sm:text-lg font-bold leading-relaxed font-sans pr-2">
                  <TranslatedText 
                    text={getPageContent(currentPage)} 
                    staticTranslation={i18n.language === "ar" ? getPageContent(currentPage) : undefined}
                    keepArabic={false} 
                  />
                </h4>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Booklet Footer Navigation */}
          <div className="pt-4 border-t border-amber-900/10 dark:border-amber-50/10 flex items-center justify-between z-10 pl-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              onClick={handlePrev}
              className="gap-1 rounded-xl text-amber-900 dark:text-amber-50 hover:bg-amber-900/10 dark:hover:bg-amber-50/10 disabled:opacity-30"
            >
              {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>
                <TranslatedText 
                  text="السابق" 
                  staticTranslation={i18n.language === "ar" ? "السابق" : "Prev"}
                  keepArabic={false} 
                />
              </span>
            </Button>

            <span className="text-xs font-bold opacity-60">
              <TranslatedText 
                text={`الصفحة ${currentPage} من ${totalPages}`} 
                staticTranslation={i18n.language === "ar" ? `الصفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                keepArabic={false} 
              />
            </span>

            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={handleNext}
              className="gap-1 rounded-xl text-amber-900 dark:text-amber-50 hover:bg-amber-900/10 dark:hover:bg-amber-50/10 disabled:opacity-30"
            >
              <span>
                <TranslatedText 
                  text="التالي" 
                  staticTranslation={i18n.language === "ar" ? "التالي" : "Next"}
                  keepArabic={false} 
                />
              </span>
              {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
