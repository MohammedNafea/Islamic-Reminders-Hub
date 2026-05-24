import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Polyfill for pdf-parse in Node.js
global.DOMMatrix = class DOMMatrix {
  constructor() {
    this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
  }
};

const pdf = require('pdf-parse');
const PDFParse = pdf.PDFParse;

const os = require('os');
const inputDir = process.env.MERGED_DIR || path.join(os.homedir(), 'Downloads', 'مدمج');
const outputDir = 'd:\\Islamic-Reminders-Hub\\artifacts\\adhkar\\extracted_content';
const outputFile = path.join(outputDir, 'content.json');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function extractText() {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.pdf'));
  const results = [];

  console.log(`Found ${files.length} PDF files. Starting extraction...`);

  for (const file of files) {
    console.log(`Processing: ${file}`);
    try {
      const dataBuffer = fs.readFileSync(path.join(inputDir, file));
      const parser = new PDFParse({ data: dataBuffer });
      const data = await parser.getText();
      
      results.push({
        sourceFile: file,
        text: data.text
      });
      
      console.log(`- Extracted ${data.text.length} characters`);
      
      // Cleanup to prevent memory leaks with many large PDFs
      if (parser.destroy) await parser.destroy();
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`Saved ${results.length} books to ${outputFile}`);
}

extractText();
