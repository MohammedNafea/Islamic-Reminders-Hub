/**
 * طبقة مساعدة لتوحيد عرض المحتوى المترجم مع إبقاء النص العربي الأصلي
 * Content i18n helper — keeps Arabic original visible alongside translation
 */

/** خريطة إصدارات ترجمة القرآن من alquran.cloud حسب اللغة */
export const QURAN_TRANSLATION_EDITIONS: Record<string, string> = {
  ar: "", // العربية لا تحتاج ترجمة
  en: "en.sahih",
  fr: "fr.hamidullah",
  de: "de.aburida",
  es: "es.montada",
  tr: "tr.diyanet",
  ur: "ur.junagarhi",
  id: "id.indonesian",
  ms: "ms.basmeih",
  bn: "bn.bengali",
  fa: "fa.ansarian",
  ru: "ru.kuliev",
  ja: "ja.japanese",
  zh: "zh.jian",
  ko: "ko.korean",
  it: "it.piccardo",
  pt: "pt.elhayek",
  pl: "pl.jozefowicz",
  nl: "nl.leemhuis",
  sv: "sv.bernstrom",
  so: "so.abduh",
  ha: "ha.gumi",
  sw: "sw.barwani",
  am: "am.sadiq",
  az: "az.musayev",
  kk: "kk.nurzhanov",
  uz: "uz.sodikov",
  vi: "vi.rida",
  ta: "ta.tamil",
  te: "te.telugu",
  mr: "mr.maranatha",
  ps: "ps.zakaria",
  sq: "sq.nahi",
  ckb: "ckb.asan",
  bs: "bs.korkut",
  hi: "hi.hindi",
  ku: "ku.asan",
};

/**
 * الحصول على إصدار ترجمة القرآن المناسب للغة الحالية
 * Returns the alquran.cloud edition identifier for the given language
 */
export function getQuranEditionForLanguage(lang: string): string | null {
  const edition = QURAN_TRANSLATION_EDITIONS[lang];
  if (!edition) return null; // لا توجد ترجمة لهذه اللغة
  if (edition === "") return null; // العربية — لا ترجمة مطلوبة
  return edition;
}

/**
 * هل اللغة الحالية عربية؟
 */
export function isArabic(lang: string): boolean {
  return lang === "ar";
}

/**
 * هل اللغة من لغات RTL؟
 */
export function isRTL(lang: string): boolean {
  return ["ar", "ur", "fa", "ps", "ckb", "ku"].includes(lang);
}

/**
 * الحصول على اتجاه النص
 */
export function getTextDirection(lang: string): "rtl" | "ltr" {
  return isRTL(lang) ? "rtl" : "ltr";
}

/**
 * الحصول على ترجمة محتوى مع fallback
 * Gets a translated text from i18n, returns null if no translation exists
 * (i.e., the key itself is returned — meaning the translation is missing)
 */
export function getTranslation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, options?: any) => string,
  key: string,
  lng?: string
): string | null {
  const result = lng ? t(key, { lng, fallbackLng: [] }) : t(key);
  // If i18next returns the key itself, it means no translation was found
  if (result === key) return null;
  return result;
}

/**
 * بناء رابط جلب ترجمة سورة من alquran.cloud
 */
export function buildQuranTranslationUrl(surahNumber: number, edition: string): string {
  return `https://api.alquran.cloud/v1/surah/${surahNumber}/${edition}`;
}
