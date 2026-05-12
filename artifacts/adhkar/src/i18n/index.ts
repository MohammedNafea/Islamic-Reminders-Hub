import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ar from "./locales/ar";
import en from "./locales/en";
import fr from "./locales/fr";
import de from "./locales/de";
import es from "./locales/es";
import tr from "./locales/tr";
import ur from "./locales/ur";
import fa from "./locales/fa";
import id from "./locales/id";
import ms from "./locales/ms";
import ru from "./locales/ru";
import zh from "./locales/zh";
import bn from "./locales/bn";
import pt from "./locales/pt";
import sw from "./locales/sw";
import it from "./locales/it";
import nl from "./locales/nl";
import pl from "./locales/pl";
import sv from "./locales/sv";
import ko from "./locales/ko";
import hi from "./locales/hi";
import bs from "./locales/bs";

const resources = {
  ar: { translation: ar },
  en: { translation: en },
  fr: { translation: fr },
  de: { translation: de },
  es: { translation: es },
  tr: { translation: tr },
  ur: { translation: ur },
  fa: { translation: fa },
  id: { translation: id },
  ms: { translation: ms },
  ru: { translation: ru },
  zh: { translation: zh },
  bn: { translation: bn },
  pt: { translation: pt },
  sw: { translation: sw },
  it: { translation: it },
  nl: { translation: nl },
  pl: { translation: pl },
  sv: { translation: sv },
  ko: { translation: ko },
  hi: { translation: hi },
  bs: { translation: bs },
};

export const supportedLanguages = [
  { code: "ar", name: "العربية", nativeName: "العربية", dir: "rtl", flag: "🇸🇦" },
  { code: "fa", name: "فارسی", nativeName: "فارسی", dir: "rtl", flag: "🇮🇷" },
  { code: "ur", name: "اردو", nativeName: "اردو", dir: "rtl", flag: "🇵🇰" },
  { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "🇬🇧" },
  { code: "fr", name: "Français", nativeName: "Français", dir: "ltr", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", nativeName: "Deutsch", dir: "ltr", flag: "🇩🇪" },
  { code: "es", name: "Español", nativeName: "Español", dir: "ltr", flag: "🇪🇸" },
  { code: "tr", name: "Türkçe", nativeName: "Türkçe", dir: "ltr", flag: "🇹🇷" },
  { code: "id", name: "Bahasa Indonesia", nativeName: "Bahasa Indonesia", dir: "ltr", flag: "🇮🇩" },
  { code: "ms", name: "Bahasa Melayu", nativeName: "Bahasa Melayu", dir: "ltr", flag: "🇲🇾" },
  { code: "ru", name: "Русский", nativeName: "Русский", dir: "ltr", flag: "🇷🇺" },
  { code: "zh", name: "中文", nativeName: "中文", dir: "ltr", flag: "🇨🇳" },
  { code: "bn", name: "বাংলা", nativeName: "বাংলা", dir: "ltr", flag: "🇧🇩" },
  { code: "pt", name: "Português", nativeName: "Português", dir: "ltr", flag: "🇵🇹" },
  { code: "sw", name: "Kiswahili", nativeName: "Kiswahili", dir: "ltr", flag: "🇰🇪" },
  { code: "it", name: "Italiano", nativeName: "Italiano", dir: "ltr", flag: "🇮🇹" },
  { code: "nl", name: "Nederlands", nativeName: "Nederlands", dir: "ltr", flag: "🇳🇱" },
  { code: "pl", name: "Polski", nativeName: "Polski", dir: "ltr", flag: "🇵🇱" },
  { code: "sv", name: "Svenska", nativeName: "Svenska", dir: "ltr", flag: "🇸🇪" },
  { code: "ko", name: "한국어", nativeName: "한국어", dir: "ltr", flag: "🇰🇷" },
  { code: "hi", name: "हिन्दी", nativeName: "हिन्दी", dir: "ltr", flag: "🇮🇳" },
  { code: "bs", name: "Bosanski", nativeName: "Bosanski", dir: "ltr", flag: "🇧🇦" },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: supportedLanguages.map(l => l.code),
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "adhkar_language",
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

export default i18n;

export function getLanguageDir(code: string): "rtl" | "ltr" {
  return supportedLanguages.find(l => l.code === code)?.dir as "rtl" | "ltr" ?? "ltr";
}

export function isRTL(code: string): boolean {
  return getLanguageDir(code) === "rtl";
}
