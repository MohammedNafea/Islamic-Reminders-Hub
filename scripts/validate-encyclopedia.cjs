#!/usr/bin/env node
/**
 * validate-encyclopedia.js
 * التحقق من صحة بنية ملفات الموسوعة الإسلامية
 * يتحقق من: library_content.json, wiki-bundle.json, content.json
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.resolve(__dirname, "../artifacts/adhkar/public/data");
const VALID_CATEGORIES = ["tafsir", "creed", "fiqh", "hadith", "ethics", "general", "sira", "library"];
const VALID_REVIEW_STATUS = ["auto_extracted", "needs_review"];

let errors = 0;
let warnings = 0;

function error(msg) {
  console.error(`[ERROR] ${msg}`);
  errors++;
}
function warn(msg) {
  console.warn(`[WARN] ${msg}`);
  warnings++;
}
function info(msg) {
  console.log(`[INFO] ${msg}`);
}

// التحقق من عنصر واحد في الموسوعة
function validateItem(item, index, source = "") {
  const prefix = `${source}[${index}]`;
  if (!item.id) error(`${prefix}: id مفقود`);
  if (!item.text || item.text.trim().length < 5) warn(`${prefix}: نص قصير جداً أو مفقود`);
  if (!item.category) warn(`${prefix}: category مفقود`);
  else if (!VALID_CATEGORIES.includes(item.category)) warn(`${prefix}: category غير معروف: "${item.category}"`);
  if (!item.title && !item.bookTitle) warn(`${prefix}: title و bookTitle مفقودان`);
  if (item.confidence !== undefined && (item.confidence < 0 || item.confidence > 1)) {
    warn(`${prefix}: confidence خارج النطاق [0,1]: ${item.confidence}`);
  }
  if (item.reviewStatus && !VALID_REVIEW_STATUS.includes(item.reviewStatus)) {
    // تقبل قيم مخصصة
  }
}

// التحقق من library_content.json
function validateLibraryContent() {
  const fp = path.join(DATA_DIR, "library_content.json");
  if (!fs.existsSync(fp)) { error("library_content.json غير موجود"); return; }
  const data = JSON.parse(fs.readFileSync(fp, "utf8"));
  if (!Array.isArray(data)) { error("library_content.json يجب أن يكون مصفوفة"); return; }
  info(`library_content.json: ${data.length} عنصر`);
  const ids = new Set();
  data.forEach((item, i) => {
    validateItem(item, i, "library_content");
    if (item.id && ids.has(item.id)) warn(`library_content[${i}]: id مكرر: ${item.id}`);
    if (item.id) ids.add(item.id);
  });
  // إحصائيات التصنيف
  const cats = {};
  data.forEach(item => { cats[item.category] = (cats[item.category] || 0) + 1; });
  info("توزيع التصنيفات:");
  Object.entries(cats).sort((a,b) => b[1]-a[1]).forEach(([cat, count]) => {
    info(`  ${cat}: ${count} عنصر`);
  });
  // نسبة needs_review
  const needsReview = data.filter(i => i.reviewStatus === "needs_review").length;
  info(`نسبة needs_review: ${((needsReview/data.length)*100).toFixed(1)}% (${needsReview}/${data.length})`);
}

// التحقق من wiki-bundle.json
function validateWikiBundle() {
  const fp = path.join(DATA_DIR, "wiki-bundle.json");
  if (!fs.existsSync(fp)) { error("wiki-bundle.json غير موجود"); return; }
  const data = JSON.parse(fs.readFileSync(fp, "utf8"));
  if (!data.metadata) error("wiki-bundle.json: metadata مفقود");
  if (!data.library) error("wiki-bundle.json: library مفقود");
  else info(`wiki-bundle.json library: ${data.library.length} مصدر`);
  if (!data.daily?.verse) warn("wiki-bundle.json: daily.verse مفقود");
  if (!data.daily?.inspiration) warn("wiki-bundle.json: daily.inspiration مفقود");
  if (data.metadata) {
    const { lastUpdated, totalSources, totalLibraryItems } = data.metadata;
    info(`wiki-bundle.json metadata: lastUpdated=${lastUpdated}, sources=${totalSources}, items=${totalLibraryItems}`);
  }
}

// التحقق من content.json
function validateContent() {
  const fp = path.join(DATA_DIR, "content.json");
  if (!fs.existsSync(fp)) { error("content.json غير موجود"); return; }
  const data = JSON.parse(fs.readFileSync(fp, "utf8"));
  if (!data.items) error("content.json: items مفقود");
  else info(`content.json: ${data.items.length} عنصر`);
  if (!data.categories) warn("content.json: categories مفقود");
  else info(`content.json categories: ${data.categories.join(", ")}`);
  if (data.items) data.items.forEach((item, i) => validateItem(item, i, "content"));
}

// التشغيل الرئيسي
info("=== بدء التحقق من صحة الموسوعة الإسلامية ===\n");
validateLibraryContent();
console.log("");
validateWikiBundle();
console.log("");
validateContent();
console.log("");
info(`=== انتهى التحقق | الأخطاء: ${errors} | التحذيرات: ${warnings} ===`);

if (errors > 0) {
  process.exit(1);
}
