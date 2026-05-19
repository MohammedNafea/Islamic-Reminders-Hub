#!/usr/bin/env node
/**
 * أداة الفحص الدوري وصيانة الويكي (LLM Wiki Linter)
 * 
 * تقوم هذه الأداة بفحص كافة صفحات الويكي للتحقق من سلامة الروابط الداخلية (Wikilinks)،
 * كشف الصفحات اليتيمة (Orphans)، ورصد التناقضات المعرفية، ثم تدوين تقرير الفحص في السجل (log.md).
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WIKI_ROOT = path.resolve(__dirname, "..");
const WIKI_PAGES_DIR = path.join(WIKI_ROOT, "wiki");

async function getAllMarkdownFiles(dir: string, fileList: string[] = []): Promise<string[]> {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await getAllMarkdownFiles(filePath, fileList);
    } else if (filePath.endsWith(".md")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function lintWiki() {
  try {
    console.log(`\n[Wiki Linter] بدء الفحص الدوري لمستودع الويكي...`);
    
    const allFiles = await getAllMarkdownFiles(WIKI_PAGES_DIR);
    const pageBaseNames = new Set(allFiles.map(f => path.basename(f, ".md")));
    
    const inboundLinksCount: Record<string, number> = {};
    for (const name of pageBaseNames) {
      inboundLinksCount[name] = 0;
    }
    
    let brokenLinksCount = 0;
    let warningsCount = 0;
    
    for (const filePath of allFiles) {
      const content = await fs.readFile(filePath, "utf-8");
      const relativePath = path.relative(WIKI_ROOT, filePath);
      
      const linkRegex = /\[\[([^\|\]#]+)(?:[\|#][^\]]+)?\]\]/g;
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        const targetPage = match[1].trim();
        if (pageBaseNames.has(targetPage)) {
          inboundLinksCount[targetPage] = (inboundLinksCount[targetPage] || 0) + 1;
        } else {
          console.warn(`[تحذير - رابط مكسور] في "${relativePath}": الرابط [[${targetPage}]] يشير إلى صفحة غير موجودة.`);
          brokenLinksCount++;
        }
      }
      
      if (content.includes("> [!WARNING]")) {
        warningsCount++;
      }
    }
    
    const orphans: string[] = [];
    for (const [name, count] of Object.entries(inboundLinksCount)) {
      if (count === 0 && name !== "000-Overview") {
        orphans.push(name);
      }
    }
    
    console.log(`\n[نتائج الفحص - Lint Summary]`);
    console.log(`- إجمالي الصفحات المفحوصة: ${allFiles.length}`);
    console.log(`- الروابط المكسورة: ${brokenLinksCount}`);
    console.log(`- الصفحات اليتيمة (Orphans): ${orphans.length} (${orphans.join(", ") || "لا يوجد"})`);
    console.log(`- التناقضات/التحذيرات المرصودة: ${warningsCount}`);
    
    const today = new Date().toISOString().split("T")[0];
    const logPath = path.join(WIKI_ROOT, "log.md");
    const logEntry = `## [${today}] lint | الفحص الدوري | فحص ${allFiles.length} صفحة | الروابط المكسورة: ${brokenLinksCount} | الصفحات اليتيمة: ${orphans.length}`;
    await fs.appendFile(logPath, `\n${logEntry}\n`, "utf-8");
    console.log(`\n[Wiki Linter] تم تدوين تقرير الفحص في السجل.`);
    
  } catch (error) {
    console.error(`\n[Wiki Linter] خطأ أثناء الفحص:`, error);
    process.exit(1);
  }
}

lintWiki();
