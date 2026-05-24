const fs = require("fs");
const path = require("path");
const { verifiedSeeds } = require("./verified-seeds.cjs");

const DATA_DIR = path.resolve(__dirname, "../artifacts/adhkar/public/data");

function isCorruptedText(text) {
  if (!text) return true;
  if (/[\u00C0-\u024F]/.test(text)) return true;
  if (/[\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) return true;
  if (/جميع الحقوق|موقع الشيخ|www\.|http|\.net/i.test(text)) return true;
  if (/\t/.test(text)) return true;
  if (/\s[\u0600-\u06FF]\s[\u0600-\u06FF]\s/.test(text)) return true;
  if (/--\s*\d+\s*of/i.test(text)) return true;

  const cleanStr = text.replace(/\s+/g, "");
  if (cleanStr.length < 15) return true;

  const letterMatches = text.match(/[a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g);
  const letterCount = letterMatches ? letterMatches.length : 0;
  if (letterCount / cleanStr.length < 0.45) return true;

  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
  const arabicMatches = text.match(arabicRegex);
  const arabicCount = arabicMatches ? arabicMatches.length : 0;
  if (arabicCount === 0) return true;

  const alphaRegex = /[a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
  const alphaMatches = text.match(alphaRegex);
  const alphaCount = alphaMatches ? alphaMatches.length : 0;
  if (alphaCount > 0 && (arabicCount / alphaCount) < 0.85) return true;
  return false;
}

function cleanText(text) {
  if (!text) return "";
  let cleaned = text.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "");
  cleaned = cleaned.replace(/\[\d+\]/g, "");
  cleaned = cleaned.replace(/L\s*\d+\s*J/gi, "");
  cleaned = cleaned.replace(/L\s*[a-zA-Z0-9]+\s*J/gi, "");
  cleaned = cleaned.replace(/األ/g, "الأ");
  cleaned = cleaned.replace(/اإل/g, "الإ");
  cleaned = cleaned.replace(/اآل/g, "الآ");
  cleaned = cleaned.replace(/اال/g, "الا");
  cleaned = cleaned.replace(/\.{2,}/g, "");
  cleaned = cleaned.replace(/…{2,}/g, "");
  cleaned = cleaned.replace(/\s+/g, " ");
  return cleaned.trim();
}

function isIndexOrTOC(text) {
  if (!text) return false;
  if (/فهرس|الفهارس|المحتويات|الموضوعات|جدول المحتويات|صفحة المحتويات|ذخائر في سطور/u.test(text)) {
    return true;
  }
  if (/\.{3,}/u.test(text) || /…{2,}/u.test(text) || /[-_]{5,}/u.test(text) || /\.{2,}\s*\d+/u.test(text)) {
    return true;
  }
  const lines = text.split("\n");
  let indexLineCount = 0;
  for (const line of lines) {
    if (/\.{2,}/u.test(line) || /…{2,}/u.test(line) || /\s+\d+\s*$/u.test(line)) {
      indexLineCount++;
    }
  }
  if (lines.length > 2 && indexLineCount / lines.length > 0.5) {
    return true;
  }
  return false;
}

function chunkText(text) {
  if (isIndexOrTOC(text)) return [];
  if (isCorruptedText(text)) return [];
  const normalized = text.replace(/\r\n/g, "\n");
  const paragraphs = normalized.split(/\n\s*\n/);
  const chunks = [];
  
  for (const p of paragraphs) {
    if (isIndexOrTOC(p)) continue;
    if (isCorruptedText(p)) continue;
    const cleaned = cleanText(p);
    if (!cleaned || cleaned.length < 60) continue;
    
    if (cleaned.length > 1500) {
      const sentences = cleaned.split(/(?<=[.!؟؛])\s+/u);
      let current = "";
      for (const s of sentences) {
        if ((current + s).length > 1200) {
          if (current.trim().length >= 60) chunks.push(current.trim());
          current = s;
        } else {
          current += (current ? " " : "") + s;
        }
      }
      if (current.trim().length >= 60) chunks.push(current.trim());
    } else {
      chunks.push(cleaned);
    }
  }
  return chunks;
}

const seedItems = verifiedSeeds;

function processData() {
  const libraryContentPath = path.join(DATA_DIR, "library_content.json");
  if (!fs.existsSync(libraryContentPath)) {
    console.error("library_content.json not found!");
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(libraryContentPath, "utf8"));
  console.log(`Loaded ${rawData.length} items from library_content.json`);

  const processedItems = [];
  const chunkCounters = {};

  for (const item of rawData) {
    if (item.id.startsWith("seed-")) {
      continue;
    }
    if (item.id.startsWith("pdf-")) {
      processedItems.push(item);
      continue;
    }
    if (item.id.includes("-item-")) {
      if (isIndexOrTOC(item.text)) continue;
      if (isCorruptedText(item.text)) continue;
      const cleanedSnippet = cleanText(item.text);
      if (cleanedSnippet.length < 60) continue;
      processedItems.push({
        ...item,
        text: cleanedSnippet
      });
      continue;
    }

    if (isIndexOrTOC(item.text)) continue;
    if (isCorruptedText(item.text)) continue;

    const baseSourceId = item.id.split("-chunk-")[0];
    if (!chunkCounters[baseSourceId]) {
      chunkCounters[baseSourceId] = 0;
    }

    const chunks = chunkText(item.text);
    if (chunks.length === 0) continue;

    chunks.forEach((chunk) => {
      chunkCounters[baseSourceId]++;
      processedItems.push({
        ...item,
        id: `${baseSourceId}-chunk-${String(chunkCounters[baseSourceId]).padStart(3, "0")}`,
        text: chunk
      });
    });
  }

  seedItems.forEach((seed) => {
    processedItems.push(seed);
  });

  console.log(`Processed total library items: ${processedItems.length}`);

  fs.writeFileSync(libraryContentPath, JSON.stringify(processedItems, null, 2), "utf8");
  console.log(`Saved library_content.json`);

  const wikiBundlePath = path.join(DATA_DIR, "wiki-bundle.json");
  if (fs.existsSync(wikiBundlePath)) {
    const wikiBundle = JSON.parse(fs.readFileSync(wikiBundlePath, "utf8"));
    wikiBundle.metadata.totalLibraryItems = processedItems.length;
    fs.writeFileSync(wikiBundlePath, JSON.stringify(wikiBundle, null, 2), "utf8");
    console.log(`Saved wiki-bundle.json`);
  }

  const libraryPath = path.join(DATA_DIR, "library.json");
  if (fs.existsSync(libraryPath)) {
    const library = JSON.parse(fs.readFileSync(libraryPath, "utf8"));
    library.metadata.totalLibraryItems = processedItems.length;
    fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2), "utf8");
    console.log(`Saved library.json`);
  }

  const contentPath = path.join(DATA_DIR, "content.json");
  if (fs.existsSync(contentPath)) {
    const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
    content.metadata.totalLibraryItems = processedItems.length;
    content.categories = [...new Set(processedItems.map((item) => item.category))];
    content.items = processedItems.slice(0, 2500);
    fs.writeFileSync(contentPath, JSON.stringify(content, null, 2), "utf8");
    console.log(`Saved content.json`);
  }
}

processData();
