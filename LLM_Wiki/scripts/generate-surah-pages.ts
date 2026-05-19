#!/usr/bin/env node
/**
 * генератор صفحات السور القرآنية
 * ينشئ 114 صفحة سورة في الويكي
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WIKI_ROOT = path.resolve(__dirname, "..");
const QURAN_DIR = path.join(WIKI_ROOT, "wiki", "quran");

// معلومات السور (الاختصارات والاعداد)
const SURAH_INFO = [
  { num: 1, name: "الفاتحة", ayahs: 7, type: "مكية" },
  { num: 2, name: "البقرة", ayahs: 286, type: "مدنية" },
  { num: 3, name: "آل عمران", ayahs: 200, type: "مدنية" },
  { num: 4, name: "النساء", ayahs: 176, type: "مدنية" },
  { num: 5, name: "المائدة", ayahs: 120, type: "مدنية" },
  { num: 6, name: "الأنعام", ayahs: 165, type: "مكية" },
  { num: 7, name: "الأعراف", ayahs: 206, type: "مكية" },
  { num: 8, name: "الأنفال", ayahs: 75, type: "مدنية" },
  { num: 9, name: "التوبة", ayahs: 129, type: "مدنية" },
  { num: 10, name: "يونس", ayahs: 109, type: "مكية" },
  { num: 11, name: "هود", ayahs: 123, type: "مكية" },
  { num: 12, name: "يوسف", ayahs: 111, type: "مكية" },
  { num: 13, name: "الرعد", ayahs: 43, type: "مدنية" },
  { num: 14, name: "إبراهيم", ayahs: 52, type: "مكية" },
  { num: 15, name: "الحجر", ayahs: 99, type: "مكية" },
  { num: 16, name: "النحل", ayahs: 128, type: "مكية" },
  { num: 17, name: "الإسراء", ayahs: 111, type: "مكية" },
  { num: 18, name: "الكهف", ayahs: 110, type: "مكية" },
  { num: 19, name: "مريم", ayahs: 98, type: "مكية" },
  { num: 20, name: "طه", ayahs: 135, type: "مكية" },
  { num: 21, name: "الأنبياء", ayahs: 112, type: "مكية" },
  { num: 22, name: "الحج", ayahs: 78, type: "مدنية" },
  { num: 23, name: "المؤمنون", ayahs: 118, type: "مكية" },
  { num: 24, name: "النور", ayahs: 64, type: "مدنية" },
  { num: 25, name: "الفرقان", ayahs: 77, type: "مكية" },
  { num: 26, name: "الشعراء", ayahs: 227, type: "مكية" },
  { num: 27, name: "النمل", ayahs: 93, type: "مكية" },
  { num: 28, name: "القصص", ayahs: 88, type: "مكية" },
  { num: 29, name: "العنكبوت", ayahs: 69, type: "مكية" },
  { num: 30, name: "الروم", ayahs: 60, type: "مكية" },
  { num: 31, name: "لقمان", ayahs: 34, type: "مكية" },
  { num: 32, name: "السجدة", ayahs: 30, type: "مكية" },
  { num: 33, name: "الأحزاب", ayahs: 73, type: "مدنية" },
  { num: 34, name: "سبأ", ayahs: 54, type: "مكية" },
  { num: 35, name: "فاطر", ayahs: 45, type: "مكية" },
  { num: 36, name: "يس", ayahs: 83, type: "مكية" },
  { num: 37, name: "الصافات", ayahs: 182, type: "مكية" },
  { num: 38, name: "ص", ayahs: 88, type: "مكية" },
  { num: 39, name: "الزمر", ayahs: 75, type: "مكية" },
  { num: 40, name: "غافر", ayahs: 85, type: "مكية" },
  { num: 41, name: "فصلت", ayahs: 54, type: "مكية" },
  { num: 42, name: "الشورى", ayahs: 53, type: "مكية" },
  { num: 43, name: "الزخرف", ayahs: 89, type: "مكية" },
  { num: 44, name: "الدخان", ayahs: 59, type: "مكية" },
  { num: 45, name: "الجاثية", ayahs: 37, type: "مكية" },
  { num: 46, name: "الأحقاف", ayahs: 35, type: "مكية" },
  { num: 47, name: "محمد", ayahs: 38, type: "مدنية" },
  { num: 48, name: "الفتح", ayahs: 29, type: "مدنية" },
  { num: 49, name: "الحجرات", ayahs: 18, type: "مدنية" },
  { num: 50, name: "ق", ayahs: 45, type: "مكية" },
  { num: 51, name: "الذاريات", ayahs: 60, type: "مكية" },
  { num: 52, name: "الطور", ayahs: 49, type: "مكية" },
  { num: 53, name: "النجم", ayahs: 62, type: "مكية" },
  { num: 54, name: "القمر", ayahs: 55, type: "مكية" },
  { num: 55, name: "الرحمن", ayahs: 78, type: "مدنية" },
  { num: 56, name: "الواقعة", ayahs: 96, type: "مكية" },
  { num: 57, name: "الحديد", ayahs: 29, type: "مدنية" },
  { num: 58, name: "المجادلة", ayahs: 22, type: "مدنية" },
  { num: 59, name: "الحشر", ayahs: 24, type: "مدنية" },
  { num: 60, name: "الممتحنة", ayahs: 13, type: "مدنية" },
  { num: 61, name: "الصف", ayahs: 14, type: "مدنية" },
  { num: 62, name: "الجمعة", ayahs: 11, type: "مدنية" },
  { num: 63, name: "المنافقون", ayahs: 11, type: "مدنية" },
  { num: 64, name: "التغابن", ayahs: 18, type: "مدنية" },
  { num: 65, name: "الطلاق", ayahs: 12, type: "مدنية" },
  { num: 66, name: "التحريم", ayahs: 12, type: "مدنية" },
  { num: 67, name: "الملك", ayahs: 30, type: "مكية" },
  { num: 68, name: "القلم", ayahs: 52, type: "مكية" },
  { num: 69, name: "الحاقة", ayahs: 52, type: "مكية" },
  { num: 70, name: "المعارج", ayahs: 44, type: "مكية" },
  { num: 71, name: "نوح", ayahs: 28, type: "مكية" },
  { num: 72, name: "الجن", ayahs: 28, type: "مكية" },
  { num: 73, name: "المزمل", ayahs: 20, type: "مكية" },
  { num: 74, name: "المدثر", ayahs: 56, type: "مكية" },
  { num: 75, name: "القيامة", ayahs: 40, type: "مكية" },
  { num: 76, name: "الإنسان", ayahs: 31, type: "مدنية" },
  { num: 77, name: "المرسلات", ayahs: 50, type: "مكية" },
  { num: 78, name: "النبأ", ayahs: 40, type: "مكية" },
  { num: 79, name: "النازعات", ayahs: 46, type: "مكية" },
  { num: 80, name: "عبس", ayahs: 42, type: "مكية" },
  { num: 81, name: "التكوير", ayahs: 29, type: "مكية" },
  { num: 82, name: "الانفطار", ayahs: 19, type: "مكية" },
  { num: 83, name: "المطففين", ayahs: 36, type: "مكية" },
  { num: 84, name: "الانشقاق", ayahs: 25, type: "مكية" },
  { num: 85, name: "البروج", ayahs: 22, type: "مكية" },
  { num: 86, name: "الطارق", ayahs: 17, type: "مكية" },
  { num: 87, name: "الأعلى", ayahs: 19, type: "مكية" },
  { num: 88, name: "الغاشية", ayahs: 26, type: "مكية" },
  { num: 89, name: "الفجر", ayahs: 30, type: "مكية" },
  { num: 90, name: "البلد", ayahs: 20, type: "مكية" },
  { num: 91, name: "الشمس", ayahs: 15, type: "مكية" },
  { num: 92, name: "الليل", ayahs: 21, type: "مكية" },
  { num: 93, name: "الضحى", ayahs: 11, type: "مكية" },
  { num: 94, name: "الشرح", ayahs: 8, type: "مكية" },
  { num: 95, name: "التين", ayahs: 8, type: "مكية" },
  { num: 96, name: "العلق", ayahs: 19, type: "مكية" },
  { num: 97, name: "القدر", ayahs: 5, type: "مكية" },
  { num: 98, name: "البينة", ayahs: 8, type: "مدنية" },
  { num: 99, name: "الزلزلة", ayahs: 8, type: "مدنية" },
  { num: 100, name: "العاديات", ayahs: 11, type: "مكية" },
  { num: 101, name: "القارعة", ayahs: 11, type: "مكية" },
  { num: 102, name: "التكاثر", ayahs: 8, type: "مكية" },
  { num: 103, name: "العصر", ayahs: 3, type: "مكية" },
  { num: 104, name: "الهمزة", ayahs: 9, type: "مكية" },
  { num: 105, name: "الفيل", ayahs: 5, type: "مكية" },
  { num: 106, name: "قريش", ayahs: 4, type: "مكية" },
  { num: 107, name: "الماعون", ayahs: 7, type: "مكية" },
  { num: 108, name: "الكوثر", ayahs: 3, type: "مكية" },
  { num: 109, name: "الكافرون", ayahs: 6, type: "مكية" },
  { num: 110, name: "النصر", ayahs: 3, type: "مدنية" },
  { num: 111, name: "المسد", ayahs: 5, type: "مكية" },
  { num: 112, name: "الإخلاص", ayahs: 4, type: "مكية" },
  { num: 113, name: "الفلق", ayahs: 5, type: "مكية" },
  { num: 114, name: "الناس", ayahs: 6, type: "مكية" }
];

function generateSurahPage(surah: { num: number; name: string; ayahs: number; type: string }): string {
  const paddedNum = surah.num.toString().padStart(3, "0");
  return `---
id: "surah_${paddedNum}"
title: "سورة ${surah.name}"
surah_number: ${surah.num}
ayah_count: ${surah.ayahs}
type: "${surah.type}"
tags: ["قرآن", "سورة", "${surah.name}"]
sources: ["ar.alafasy", "ar.jalalayn", "ar.muyassar"]
links: 
  site: "/quran"
  jalalayn_api: "/v1/surah/${surah.num}/ar.jalalayn"
  muyassar_api: "/v1/surah/${surah.num}/ar.muyassar"
created: 2026-05-16
updated: 2026-05-16
---

# سورة ${surah.name}

## معلومات السورة
- **الرقم:** ${surah.num}
- **عدد الآيات:** ${surah.ayahs}
- **النوع:** ${surah.type}

## المصادر في الموقع
- [[Quran.tsx]] — صفحة المصحف الرئيسية
- تفسير الجلالين: \`ar.jalalayn\` API
- التفسير الميسر: \`ar.muyassar\` API

## الوصف
سورة ${surah.name} هي السورة رقم ${surah.num} في المصحف الشريف، ${surah.type === "مكية" ? "مكية" : "مدنية"} تتكون من ${surah.ayahs} ${surah.ayahs === 1 ? "آية" : "آيات"}.

> [!NOTE]
> للحصول على النص الكامل والتفسير، يرجى زيارة صفحة السورة في التطبيق.
`;
}

async function generateAllSurahPages() {
  console.log("Starting surah page generation...");

  // Ensure directory exists
  await fs.mkdir(QURAN_DIR, { recursive: true });

  for (const surah of SURAH_INFO) {
    const paddedNum = surah.num.toString().padStart(3, "0");
    const filename = `Surah-${paddedNum}.md`;
    const filepath = path.join(QURAN_DIR, filename);
    const content = generateSurahPage(surah);

    await fs.writeFile(filepath, content, "utf-8");
    console.log(`Created: ${filename}`);
  }

  console.log(`\nDone! Created ${SURAH_INFO.length} surah pages.`);
}

generateAllSurahPages().catch(console.error);