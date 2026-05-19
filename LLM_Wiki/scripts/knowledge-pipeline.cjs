#!/usr/bin/env node
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const {
  GENERIC_AUTHOR,
  GENERIC_SOURCE,
  buildFilenameTerms,
  containsPrivateTerms,
  redactObject,
  redactText,
} = require("./private-redactions.cjs");
const { verifiedSeeds } = require("../../scripts/verified-seeds.cjs");

const WIKI_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(WIKI_ROOT, "..");
const DEFAULT_SOURCE = path.join(process.env.USERPROFILE || process.env.HOME || "", "Downloads", "مدمج");
const DEFAULT_REPORT = path.join(WIKI_ROOT, "knowledge-pipeline-report.json");

function parseArgs(argv) {
  const args = {
    source: process.env.MERGED_DIR || DEFAULT_SOURCE,
    out: WIKI_ROOT,
    dryRun: false,
    force: false,
    report: DEFAULT_REPORT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--source") args.source = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--report") args.report = argv[++index];
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--force") args.force = true;
  }

  return args;
}

function assertInside(child, parent) {
  const relative = path.relative(parent, child);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside ${parent}: ${child}`);
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function resetDir(dir, root) {
  assertInside(dir, root);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function readTextIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

async function extractPdfText(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  const polyfills = await import(pathToFileURL(path.join(WIKI_ROOT, "scripts", "pdf-polyfills.mjs")).href).catch(() => null);
  if (polyfills?.installPdfPolyfills) polyfills.installPdfPolyfills();

  try {
    const pdfParseModule = require("pdf-parse");
    const PDFParse = pdfParseModule.PDFParse || pdfParseModule.default || pdfParseModule;
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    const result = await parser.getText();
    return {
      text: result.text || "",
      pages: Number(result.total || result.numpages || 0),
      method: "pdf-parse",
      status: (result.text || "").trim().length > 50 ? "success" : "needs_review",
    };
  } catch (error) {
    return {
      text: "",
      pages: 0,
      method: "pdf-parse",
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function classifySource(filename, text) {
  const value = `${filename}\n${text.slice(0, 6000)}`.toLowerCase();
  const hasHadith = /حديث|رواه|أخرجه|صحيح|سنن|خرّج|خرّجه|مسند|بخاري|مسلم|ترمذي|أبو داود|hadith|sunan/iu.test(value);
  const hasCreed = /عقيدة|توحيد|إيمان|أسماء وصفات|نواقض|شرك|تكفير|creed|aqeed/iu.test(value);
  const hasFiqh = /فقه|أحكام|طهارة|صلاة|حج|زكاة|نكاح|طلاق|بيع|ربا|خمر|معاملات|جنازة|فريضة|fiqh/iu.test(value);
  const hasTafsir = /تفسير|آية|سورة|قرآن|تأويل|بيان القرآن|tafsir|quran/iu.test(value);
  const hasSira = /سيرة|غزوة|صحابة|تابعي|مغازي|هجرة|مكة|المدينة|sira|sirah/iu.test(value);
  const hasEthics = /أخلاق|زهد|ورع|توبة|تزكية|أخلاق المسلم|ethics|akhlaq/iu.test(value);
  const hasAdhkar = /أذكار|تسبيح|رقية|وظيفة|صباح|مساء|نوم|dhikr|adhkar/iu.test(value);
  if (hasTafsir) return "tafsir";
  if (hasHadith) return "hadith";
  if (hasCreed) return "creed";
  if (hasFiqh) return "fiqh";
  if (hasSira) return "sira";
  if (hasEthics) return "ethics";
  if (hasAdhkar) return "library";
  return "general";
}

function genericTitle(category, ordinal) {
  const labels = {
    tafsir: "مصدر تفسيري محقق",
    hadith: "مصدر حديثي محقق",
    creed: "مصدر عقدي معاصر",
    fiqh: "مصدر فقهي معاصر",
    sira: "مصدر سيرة نبوية",
    ethics: "مصدر أخلاقي شرعي",
    library: "مصدر مكتبي شرعي",
    general: "مصدر علمي شرعي",
  };
  return `${labels[category] || labels.general} ${String(ordinal).padStart(3, "0")}`;
}

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

function extractSnippets(text, source, maxItems = 10) {
  const sentences = (text || "")
    .replace(/\s+/gu, " ")
    .split(/(?<=[.!؟؛])\s+/u)
    .filter((line) => line.length >= 80 && line.length <= 1000 && !isIndexOrTOC(line) && !isCorruptedText(line))
    .map((line) => cleanText(line))
    .filter((line) => line.length >= 60);

  const ranked = sentences.filter((line) => /قال|رواه|أخرجه|حكم|يجوز|لا يجوز|واجب|سنة|الأصل|القاعدة|حديث|آية/u.test(line));
  const selected = (ranked.length ? ranked : sentences).slice(0, maxItems);

  return selected.map((line, index) => ({
    id: `${source.id}-item-${String(index + 1).padStart(2, "0")}`,
    title: source.title,
    bookTitle: source.title,
    category: source.category,
    text: line,
    source: source.sourceLabel,
    sourceFile: source.id,
    pageRefs: [],
    tags: source.tags,
    benefits: [],
    confidence: source.status === "success" ? 0.72 : 0.35,
    reviewStatus: source.status === "success" ? "auto_extracted" : "needs_review",
  }));
}

function chunkText(text) {
  const normalized = (text || "").replace(/\r\n/g, "\n");
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

function frontmatter(fields) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(fields)) {
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

function writeJson(filePath, value, dryRun) {
  if (dryRun) return;
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value, dryRun) {
  if (dryRun) return;
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceDir = path.resolve(args.source);
  const outputRoot = path.resolve(args.out);
  assertInside(outputRoot, REPO_ROOT);

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory was not found: ${sourceDir}`);
  }

  const pdfFiles = fs.readdirSync(sourceDir)
    .filter((file) => file.toLowerCase().endsWith(".pdf"))
    .sort((a, b) => a.localeCompare(b, "ar"));

  const rawMergedDir = path.join(outputRoot, "raw", "books", "merged");
  const wikiDir = path.join(outputRoot, "wiki");
  const sourcesDir = path.join(wikiDir, "sources");
  const conceptsDir = path.join(wikiDir, "concepts");
  const entitiesDir = path.join(wikiDir, "entities");
  const appDataDir = path.join(REPO_ROOT, "artifacts", "adhkar", "public", "data");
  const legacyTextByPdf = new Map();
  if (fs.existsSync(rawMergedDir)) {
    for (let index = 0; index < pdfFiles.length; index++) {
      const filename = pdfFiles[index];
      const id = `source-${String(index + 1).padStart(3, "0")}`;
      const txtPath = path.join(rawMergedDir, `${id}.txt`);
      if (fs.existsSync(txtPath)) {
        legacyTextByPdf.set(filename, readTextIfExists(txtPath));
      }
    }
  }

  if (!args.dryRun) {
    resetDir(rawMergedDir, outputRoot);
    resetDir(sourcesDir, outputRoot);
    resetDir(conceptsDir, outputRoot);
    resetDir(entitiesDir, outputRoot);
    ensureDir(appDataDir);
  }

  const manifest = [];
  const libraryItems = [];
  const sourceIndex = [];
  const errors = [];

  for (let index = 0; index < pdfFiles.length; index += 1) {
    const filename = pdfFiles[index];
    const ordinal = index + 1;
    const pdfPath = path.join(sourceDir, filename);
    const id = `source-${String(ordinal).padStart(3, "0")}`;
    const fileStats = fs.statSync(pdfPath);
    const checksum = sha256(pdfPath);
    const textTarget = path.join(rawMergedDir, `${id}.txt`);
    const legacyText = legacyTextByPdf.get(filename) || "";
    const extraction = legacyText
      ? { text: legacyText, pages: 0, method: "existing-text", status: "success" }
      : await extractPdfText(pdfPath);

    const extraTerms = buildFilenameTerms(filename);
    const redactedText = redactText(extraction.text || "", { extraTerms, replacement: GENERIC_SOURCE });
    const category = classifySource(filename, redactedText);
    const title = genericTitle(category, ordinal);
    const sourceLabel = `${GENERIC_SOURCE} ${String(ordinal).padStart(3, "0")}`;
    const status = redactedText.length > 50 && !containsPrivateTerms(redactedText) ? extraction.status : "needs_review";
    const tags = [
      category,
      "موسوعة",
      "مصدر-محايد",
      ...(category === "hadith" ? ["حديث", "سنة"] : []),
      ...(category === "fiqh" ? ["فقه", "أحكام"] : []),
      ...(category === "creed" ? ["عقيدة", "توحيد"] : []),
      ...(category === "tafsir" ? ["تفسير", "قرآن"] : []),
      ...(category === "sira" ? ["سيرة", "صحابة"] : []),
      ...(category === "ethics" ? ["أخلاق", "زهد"] : []),
    ];
    const sourceRecord = {
      id,
      title,
      category,
      sourceLabel,
      status,
      tags,
    };

    const snippets = extractSnippets(redactedText, sourceRecord, 12);
    const chunks = chunkText(redactedText);

    const sourcePage = [
      frontmatter({
        id,
        title,
        category,
        source: sourceLabel,
        checksum,
        reviewStatus: status === "success" ? "auto_extracted" : "needs_review",
        updated: new Date().toISOString().slice(0, 10),
      }),
      `# ${title}`,
      "",
      `المصدر محفوظ بعنوان محايد: ${sourceLabel}.`,
      "",
      "## ملخص تقني",
      `- عدد الأحرف المستخرجة: ${redactedText.length}`,
      `- طريقة الاستخراج: ${extraction.method}`,
      `- حالة المراجعة: ${status === "success" ? "مستخرج آليًا" : "يحتاج مراجعة"}`,
      "",
      "## مقتطفات مفهرسة",
      ...snippets.slice(0, 8).map((item, itemIndex) => `${itemIndex + 1}. ${item.text}`),
      "",
    ].join("\n");

    const conceptPage = [
      frontmatter({
        id: `${id}-concept`,
        title: `${title} - مفاهيم مستخرجة`,
        category,
        sources: [`[[${id}]]`],
        reviewStatus: status === "success" ? "auto_extracted" : "needs_review",
        updated: new Date().toISOString().slice(0, 10),
      }),
      `# ${title} - مفاهيم مستخرجة`,
      "",
      "تجمع هذه الصفحة أهم المقاطع القابلة للفهرسة من المصدر المحايد.",
      "",
      "## العناصر",
      ...snippets.map((item) => `- ${item.text}`),
      "",
    ].join("\n");

    const entityPage = [
      frontmatter({
        id: `${id}-entity`,
        title: GENERIC_AUTHOR,
        aliases: [sourceLabel],
        tags: ["كيان/تحقيق"],
        updated: new Date().toISOString().slice(0, 10),
      }),
      `# ${GENERIC_AUTHOR}`,
      "",
      "كيان محايد يمثل جهة التحقيق أو التحرير العلمي للمصادر المستوعبة.",
      "",
    ].join("\n");

    writeText(textTarget, redactedText, args.dryRun);
    writeText(path.join(sourcesDir, `${id}.md`), sourcePage, args.dryRun);
    writeText(path.join(conceptsDir, `${id}-concept.md`), conceptPage, args.dryRun);
    writeText(path.join(entitiesDir, `${id}-entity.md`), entityPage, args.dryRun);

    const contentItems = chunks.map((chunk, chunkIndex) => ({
      id: `${id}-chunk-${String(chunkIndex + 1).padStart(3, "0")}`,
      title,
      bookTitle: title,
      author: GENERIC_AUTHOR,
      text: chunk,
      category,
      source: sourceLabel,
      sourceFile: id,
      pageRefs: [],
      tags,
      benefits: [],
      confidence: status === "success" ? 0.7 : 0.3,
      reviewStatus: status === "success" ? "auto_extracted" : "needs_review",
    }));

    libraryItems.push(...contentItems, ...snippets);
    sourceIndex.push({
      id,
      title,
      bookTitle: title,
      author: GENERIC_AUTHOR,
      text: `${title} - ${sourceLabel}`,
      category,
      source: sourceLabel,
      sourceFile: id,
      reviewStatus: status === "success" ? "auto_extracted" : "needs_review",
    });

    manifest.push({
      id,
      checksum,
      bytes: fileStats.size,
      pages: extraction.pages,
      extractionMethod: extraction.method,
      status,
      textLength: redactedText.length,
      itemCount: contentItems.length + snippets.length,
      hasPrivateLeak: containsPrivateTerms(JSON.stringify({ redactedText, title, sourceLabel })),
      error: extraction.error || null,
    });

    if (extraction.error) errors.push({ id, error: extraction.error });
  }

  const seedItems = verifiedSeeds;

  libraryItems.push(...seedItems);

  const now = new Date().toISOString();
  const metadata = {
    lastUpdated: now,
    totalSources: pdfFiles.length,
    totalConcepts: sourceIndex.length,
    totalLibraryItems: libraryItems.length,
    storage: "static-json",
    redaction: "enabled",
  };

  const wikiBundle = {
    metadata,
    library: sourceIndex,
    adhkar: {},
    daily: {
      verse: "فاذكروني أذكركم واشكروا لي ولا تكفرون",
      inspiration: "العلم النافع ما قاد إلى العمل والخشية وحسن الاتباع.",
    },
  };

  const libraryJson = {
    metadata,
    sources: sourceIndex,
  };

  const contentJson = {
    metadata,
    categories: [...new Set(libraryItems.map((item) => item.category))],
    items: libraryItems.slice(0, 2500),
  };

  const report = redactObject({
    metadata,
    manifest,
    errors,
  });

  writeJson(path.join(appDataDir, "library_content.json"), libraryItems, args.dryRun);
  writeJson(path.join(appDataDir, "wiki-bundle.json"), wikiBundle, args.dryRun);
  writeJson(path.join(appDataDir, "library.json"), libraryJson, args.dryRun);
  writeJson(path.join(appDataDir, "content.json"), contentJson, args.dryRun);
  writeJson(args.report, report, args.dryRun);
  writeJson(path.join(outputRoot, "manifest.private.json"), report, args.dryRun);

  const indexText = [
    "# فهرس الويكي",
    "",
    `آخر تحديث: ${now}`,
    "",
    "## المصادر",
    ...sourceIndex.map((item) => `- [[sources/${item.id}|${item.title}]] - ${item.source}`),
    "",
  ].join("\n");
  writeText(path.join(outputRoot, "index.md"), indexText, args.dryRun);

  const logEntry = `\n## [${now.slice(0, 10)}] ingest | مصادر محايدة | تم استيعاب ${pdfFiles.length} ملفًا وتوليد ${libraryItems.length} عنصرًا مع تفعيل الإخفاء\n`;
  if (!args.dryRun) fs.appendFileSync(path.join(outputRoot, "log.md"), logEntry, "utf8");

  const leakText = JSON.stringify({ libraryItems, wikiBundle, libraryJson, contentJson, report, indexText });
  if (containsPrivateTerms(leakText)) {
    throw new Error("Private term leak detected in generated outputs.");
  }

  console.log(JSON.stringify({
    totalSources: pdfFiles.length,
    totalLibraryItems: libraryItems.length,
    report: args.report,
    dryRun: args.dryRun,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
