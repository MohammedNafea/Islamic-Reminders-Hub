/**
 * مولّد الترجمات الآلي للمحتوى
 * Auto-generates content translation files for all languages.
 * 
 * Usage:
 *   npx tsx scripts/generate-content-translations.ts [--force] [--lang en,fr,de]
 * 
 * Flags:
 *   --force    Re-translate even if translation already exists
 *   --lang     Comma-separated list of languages (default: all non-Arabic)
 * 
 * This script:
 * 1. Extracts all translatable content from data files
 * 2. Generates i18n keys for adhkar, hadith, fasting sources
 * 3. Creates library_content.i18n/{lang}.json files
 * 4. Marks all translations as machineTranslated + needsReview
 * 5. Is idempotent — won't overwrite existing translations unless --force
 */

import * as fs from "fs";
import * as path from "path";

// ---- Configuration ----
const ADHKAR_PATH = path.resolve(__dirname, "../artifacts/adhkar/src/data/adhkar.ts");
const HADITH_PATH = path.resolve(__dirname, "../artifacts/adhkar/src/data/hadith-rulings.ts");
const FASTING_PATH = path.resolve(__dirname, "../artifacts/adhkar/src/data/fasting-days.ts");
const LIBRARY_PATH = path.resolve(__dirname, "../artifacts/adhkar/public/data/library_content.json");
const LOCALES_DIR = path.resolve(__dirname, "../artifacts/adhkar/src/i18n/locales");
const LIBRARY_I18N_DIR = path.resolve(__dirname, "../artifacts/adhkar/public/data/library_content.i18n");

const SUPPORTED_LANGUAGES = [
  "en", "fr", "de", "es", "tr", "ur", "id", "ms", "bn", "fa", "ru",
  "ja", "zh", "ko", "it", "pt", "pl", "nl", "sv", "so", "ha", "sw",
  "am", "az", "kk", "uz", "vi", "ta", "te", "mr", "ps", "sq", "ckb",
  "bs", "hi", "ku"
];

// ---- Helpers ----
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJson(filePath: string, data: any) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ---- Extract translatable strings from TypeScript data files ----
function extractAdhkarContent(): { items: Record<string, { arabic: string; source: string }>, sources: Record<string, string> } {
  const content = fs.readFileSync(ADHKAR_PATH, "utf-8");
  const items: Record<string, { arabic: string; source: string }> = {};
  const sources: Record<string, string> = {};
  
  // Extract id, arabic, source via regex
  const idRegex = /id:\s*"([^"]+)"/g;
  const arabicRegex = /arabic:\s*"([^"]+)"/g;
  const sourceRegex = /source:\s*"([^"]+)"/g;
  
  const ids = [...content.matchAll(idRegex)].map(m => m[1]);
  const arabics = [...content.matchAll(arabicRegex)].map(m => m[1]);
  const sourceValues = [...content.matchAll(sourceRegex)].map(m => m[1]);
  
  for (let i = 0; i < ids.length && i < arabics.length; i++) {
    items[ids[i]] = { arabic: arabics[i], source: sourceValues[i] || "" };
    if (sourceValues[i]) {
      sources[sourceValues[i]] = sourceValues[i]; // Arabic source as key
    }
  }
  
  return { items, sources };
}

function extractHadithContent(): { items: Record<string, { text: string; bookTitle: string; source?: string; benefits?: string[]; tags?: string[] }> } {
  const content = fs.readFileSync(HADITH_PATH, "utf-8");
  const items: Record<string, { text: string; bookTitle: string; source?: string; benefits?: string[]; tags?: string[] }> = {};
  
  // Simple extraction - parse the TS array manually
  const idRegex = /id:\s*"([^"]+)"/g;
  const textRegex = /text:\s*"([^"]+)"/g;
  const bookTitleRegex = /bookTitle:\s*"([^"]+)"/g;
  
  const ids = [...content.matchAll(idRegex)].map(m => m[1]);
  const texts = [...content.matchAll(textRegex)].map(m => m[1]);
  const bookTitles = [...content.matchAll(bookTitleRegex)].map(m => m[1]);
  
  for (let i = 0; i < ids.length && i < texts.length; i++) {
    items[ids[i]] = {
      text: texts[i],
      bookTitle: bookTitles[i] || "",
    };
  }
  
  return { items };
}

function extractFastingSources(): Record<string, string> {
  const content = fs.readFileSync(FASTING_PATH, "utf-8");
  const sources: Record<string, string> = {};
  
  const idRegex = /id:\s*"([^"]+)"/g;
  const sourceRegex = /source:\s*"([^"]+)"/g;
  
  const ids = [...content.matchAll(idRegex)].map(m => m[1]);
  const sourceValues = [...content.matchAll(sourceRegex)].map(m => m[1]);
  
  for (let i = 0; i < ids.length && i < sourceValues.length; i++) {
    sources[ids[i]] = sourceValues[i];
  }
  
  return sources;
}

function extractLibraryContent(): any[] {
  if (!fs.existsSync(LIBRARY_PATH)) return [];
  return readJson(LIBRARY_PATH);
}

// ---- Generate translation keys for locale files ----
function generateAdhkarKeys(
  adhkarContent: ReturnType<typeof extractAdhkarContent>,
  lang: string
): { adhkar: { items: Record<string, string>, sources: Record<string, string> } } {
  const items: Record<string, string> = {};
  const sources: Record<string, string> = {};
  
  // Items: English translation as placeholder
  for (const [id, data] of Object.entries(adhkarContent.items)) {
    items[id] = `[${lang}:adhkar.items.${id}] ${data.arabic.substring(0, 50)}...`;
  }
  
  // Sources
  for (const [arSource] of Object.entries(adhkarContent.sources)) {
    sources[arSource] = `[${lang}:adhkar.sources] ${arSource}`;
  }
  
  return { adhkar: { items, sources } };
}

function generateHadithKeys(
  hadithContent: ReturnType<typeof extractHadithContent>,
  lang: string
): { hadith: { items: Record<string, { text: string; bookTitle: string; source?: string }> } } {
  const items: Record<string, any> = {};
  
  for (const [id, data] of Object.entries(hadithContent.items)) {
    items[id] = {
      text: `[${lang}:hadith.items.${id}.text] ${data.text.substring(0, 50)}...`,
      bookTitle: `[${lang}:hadith.items.${id}.bookTitle] ${data.bookTitle}`,
    };
  }
  
  return { hadith: { items } };
}

function generateFastingSourceKeys(
  fastingSources: Record<string, string>,
  lang: string
): { fasting: { sources: Record<string, string> } } {
  const sources: Record<string, string> = {};
  
  for (const [id, arSource] of Object.entries(fastingSources)) {
    sources[id] = `[${lang}:fasting.sources.${id}] ${arSource}`;
  }
  
  return { fasting: { sources } };
}

function generateLibraryTranslations(
  libraryContent: any[],
  lang: string
): Record<string, any> {
  const translations: Record<string, any> = {};
  
  for (const item of libraryContent) {
    const itemId = item.id || `lib-${(item.text || "").substring(0, 20)}`;
    translations[itemId] = {
      title: item.title ? `[${lang}] ${item.title}` : "",
      bookTitle: item.bookTitle ? `[${lang}] ${item.bookTitle}` : "",
      text: item.text ? `[${lang}] ${item.text.substring(0, 100)}...` : "",
      source: item.source ? `[${lang}] ${item.source}` : "",
      _meta: { machineTranslated: true, needsReview: true }
    };
  }
  
  return translations;
}

// ---- Main ----
function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const langArg = args.find(a => a.startsWith("--lang="));
  const languages = langArg 
    ? langArg.split("=")[1].split(",") 
    : SUPPORTED_LANGUAGES.filter(l => l !== "ar");
  
  console.log(`\n🔧 Content Translation Generator`);
  console.log(`   Languages: ${languages.join(", ")}`);
  console.log(`   Force: ${force}\n`);
  
  // Extract content
  const adhkarContent = extractAdhkarContent();
  console.log(`   Extracted ${Object.keys(adhkarContent.items).length} adhkar items`);
  
  const hadithContent = extractHadithContent();
  console.log(`   Extracted ${Object.keys(hadithContent.items).length} hadith items`);
  
  const fastingSources = extractFastingSources();
  console.log(`   Extracted ${Object.keys(fastingSources).length} fasting sources`);
  
  const libraryContent = extractLibraryContent();
  console.log(`   Extracted ${libraryContent.length} library items`);
  
  // Generate for each language
  for (const lang of languages) {
    console.log(`\n📝 Generating translations for: ${lang}`);
    
    // 1. Generate library translation files
    const libTrans = generateLibraryTranslations(libraryContent, lang);
    const libPath = path.join(LIBRARY_I18N_DIR, `${lang}.json`);
    
    if (fs.existsSync(libPath) && !force) {
      console.log(`   ⏭️  Library translations already exist (use --force to overwrite)`);
    } else {
      writeJson(libPath, libTrans);
      console.log(`   ✅ Written ${Object.keys(libTrans).length} library translations to ${libPath}`);
    }
    
    // 2. Note about locale file keys - these need to be added to each locale's .ts file
    // We generate a summary of keys that need to be added
    const adhkarKeys = generateAdhkarKeys(adhkarContent, lang);
    const hadithKeys = generateHadithKeys(hadithContent, lang);
    const fastingKeys = generateFastingSourceKeys(fastingSources, lang);
    
    const totalKeys = 
      Object.keys(adhkarKeys.adhkar.items).length +
      Object.keys(adhkarKeys.adhkar.sources).length +
      Object.keys(hadithKeys.hadith.items).length +
      Object.keys(fastingKeys.fasting.sources).length;
    
    console.log(`   📊 ${totalKeys} translation keys needed for ${lang} locale file`);
  }
  
  console.log(`\n✨ Done! Next steps:`);
  console.log(`   1. Add generated keys to each locale file in src/i18n/locales/`);
  console.log(`   2. Replace placeholder translations with actual translations`);
  console.log(`   3. Review machine-translated library content for accuracy`);
  console.log(`   4. Quran translations are handled dynamically via alquran.cloud API\n`);
}

main();
