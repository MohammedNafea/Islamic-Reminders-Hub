#!/usr/bin/env node
/**
 * محرك استخراج النصوص من ملفات PDF
 * 
 * الأولوية: المحلي (pdfplumber) أولاً، ثم السحابي (Vision AI) كـ fallback
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import util from "util";

const execAsync = util?.promisify ? util.promisify(exec) : (cmd: string) => new Promise((resolve, reject) => exec(cmd, (err, stdout, stderr) => err ? reject(err) : resolve({ stdout, stderr })));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WIKI_ROOT = path.resolve(__dirname, "..");

export interface ExtractedContent {
  filename: string;
  title: string;
  text: string;
  pageCount: number;
  extractionMethod: "local" | "cloud";
}

export interface ExtractedHadith {
  id: string;
  text: string;
  source: string;
  bookTitle: string;
  benefits: string[];
  tags: string[];
}

/**
 * محاولة استخراج النص باستخدام pdfplumber (محلياً)
 */
async function extractWithPdfPlumber(pdfPath: string): Promise<{ text: string; pageCount: number } | null> {
  try {
    // @ts-ignore — pdfplumber is an optional runtime dependency
    const { PDFextract } = await import("pdfplumber");
    const pdfExtract = new PDFextract();
    const result = await pdfExtract.extract(pdfPath);
    return {
      text: result.text || "",
      pageCount: result.pages?.length || 0
    };
  } catch (e) {
    // pdfplumber not available or failed
    return null;
  }
}

/**
 * استخراج النص باستخدام أداة agent-tools (Vision AI - سحابي)
 */
async function extractWithCloudVision(pdfPath: string): Promise<{ text: string; pageCount: number } | null> {
  try {
    // تحويل PDF إلى صور ثم إرسالها للـ Vision AI
    const command = `inference.sh agent "تحليل الملف: ${path.basename(pdfPath)}" --model vision --file "${pdfPath}"`;
    const result = await execAsync(command, { timeout: 120000 }) as { stdout: string; stderr: string };
    const { stdout } = result;
    
    // استخراج النص من response
    const textMatch = stdout.match(/"text"\s*:\s*"([^"]+)"/);
    const pageMatch = stdout.match(/"pages"\s*:\s*(\d+)/);
    
    return {
      text: textMatch ? textMatch[1] : stdout,
      pageCount: pageMatch ? parseInt(pageMatch[1]) : 1
    };
  } catch (e) {
    return null;
  }
}

/**
 * استخراج النص من ملف PDF (محلي أولاً ثم سحابي)
 */
export async function extractTextFromPDF(pdfPath: string): Promise<ExtractedContent> {
  const filename = path.basename(pdfPath);
  
  // محاولة الاستخراج المحلي
  const localResult = await extractWithPdfPlumber(pdfPath);
  if (localResult && localResult.text.trim().length > 100) {
    return {
      filename,
      title: filename.replace(/\.pdf$/i, ""),
      text: localResult.text,
      pageCount: localResult.pageCount,
      extractionMethod: "local"
    };
  }
  
  // محاولة الاستخراج السحابي
  const cloudResult = await extractWithCloudVision(pdfPath);
  if (cloudResult && cloudResult.text.trim().length > 100) {
    return {
      filename,
      title: filename.replace(/\.pdf$/i, ""),
      text: cloudResult.text,
      pageCount: cloudResult.pageCount,
      extractionMethod: "cloud"
    };
  }
  
  // فشل الاستخراج
  return {
    filename,
    title: filename.replace(/\.pdf$/i, ""),
    text: `[تعذر استخراج النص من: ${filename}]`,
    pageCount: 0,
    extractionMethod: "local"
  };
}

/**
 * استخراج الأحاديث والآيات من النص
 */
export function extractHadiths(text: string): ExtractedHadith[] {
  const hadiths: ExtractedHadith[] = [];
  
  // نماذج استخراج الأحاديث
  const hadithPatterns = [
    /(?:عن|قال|r ?)\s+([^\n]+?)(?:\s+قال|s?)\s*(?:رسول الله|النبي|صلى الله عليه وسلم)[^\n]*/gi,
    /([^\n]+?)(?:\s*[\(])?(?:متفق عليه|أخرجه|رواه)[^\n]*/gi,
  ];
  
  for (const pattern of hadithPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const textContent = match[1]?.trim();
      if (textContent && textContent.length > 10 && textContent.length < 500) {
        hadiths.push({
          id: `hadith_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: textContent,
          source: "أقوال المحققين المعاصرين",
          bookTitle: "مكتبة التحقيق المعاصر",
          benefits: [],
          tags: ["حديث", "تحقيق"]
        });
      }
    }
  }
  
  return hadiths.slice(0, 50); // Limit to 50 hadiths per file
}

/**
 * استخراج الآيات القرآنية من النص
 */
export function extractQuranVerses(text: string): string[] {
  const verses: string[] = [];
  
  // نماذج الآيات: سورة:آية أو الآية في سياق
  const versePatterns = [
    /(?:سورة|surah)\s+([^\n\d]+)\s*[\(:](?:آية\s*)?(\d+)/gi,
    /([^\n]+?)(?:\s*[\(:])?(?:البقرة|Al-Baqarah|Ali Imran|An-Nisa)[^\n]*(?:\s*:?\s*)(\d+)/gi,
  ];
  
  for (const pattern of versePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const surah = match[1]?.trim();
      const verse = match[2]?.trim();
      if (surah && verse) {
        verses.push(`${surah}:${verse}`);
      }
    }
  }
  
  return [...new Set(verses)].slice(0, 100);
}

/**
 * معالجة جميع ملفات PDF في مجلد
 */
export async function processAllPDFs(dirPath: string): Promise<ExtractedContent[]> {
  const results: ExtractedContent[] = [];
  
  try {
    const files = await fs.readdir(dirPath);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith(".pdf"));
    
    console.log(`Found ${pdfFiles.length} PDF files in ${dirPath}`);
    
    for (const file of pdfFiles) {
      const pdfPath = path.join(dirPath, file);
      console.log(`Processing: ${file}`);
      
      try {
        const result = await extractTextFromPDF(pdfPath);
        results.push(result);
        console.log(`  → Extracted ${result.text.length} chars (${result.extractionMethod})`);
      } catch (e) {
        console.error(`  → Error: ${e}`);
      }
    }
  } catch (e) {
    console.error(`Error reading directory: ${e}`);
  }
  
  return results;
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const dirPath = process.argv[2] || process.env.MERGED_DIR || "Downloads/مدمج";
  
  console.log(`\n[PDF Extractor] Starting extraction from: ${dirPath}\n`);
  
  processAllPDFs(dirPath).then(results => {
    console.log(`\n[PDF Extractor] Completed!`);
    console.log(`Total files processed: ${results.length}`);
    console.log(`Total text extracted: ${results.reduce((sum, r) => sum + r.text.length, 0)} chars`);
    
    // Save results
    const outputPath = path.join(WIKI_ROOT, "extracted-pdf-content.json");
    fs.writeFile(outputPath, JSON.stringify(results, null, 2), "utf-8")
      .then(() => console.log(`Results saved to: ${outputPath}`))
      .catch(console.error);
  }).catch(console.error);
}