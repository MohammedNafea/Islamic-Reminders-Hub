const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../ocr_input');
const outputDir = path.join(__dirname, '../ocr_output');

if (!fs.existsSync(inputDir)) fs.mkdirSync(inputDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

async function processImages() {
  const files = fs.readdirSync(inputDir).filter(f => /\.(png|jpg|jpeg|pdf)$/i.test(f));
  
  if (files.length === 0) {
    console.log("No images found in ocr_input/ folder.");
    return;
  }

  console.log(`Found ${files.length} files. Starting AI OCR processing (Arabic)...`);

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    console.log(`Processing: ${file}...`);
    
    try {
      const { data: { text } } = await Tesseract.recognize(
        filePath,
        'ara', // Arabic language
        { logger: m => console.log(m.status, (m.progress * 100).toFixed(2) + "%") }
      );

      const outPath = path.join(outputDir, `${file}.txt`);
      fs.writeFileSync(outPath, text);
      console.log(`Successfully extracted text to: ${outPath}`);
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
  
  console.log("OCR Task Completed.");
}

processImages();
