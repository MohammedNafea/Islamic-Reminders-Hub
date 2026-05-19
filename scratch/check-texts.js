const fs = require('fs');
const path = require('path');

const dir = 'LLM_Wiki/raw/books/merged';
if (!fs.existsSync(dir)) {
  console.log('Dir does not exist');
  process.exit(1);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt')).sort();
console.log(`Checking ${files.length} files...`);

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const totalLen = content.length;
  if (totalLen === 0) {
    console.log(`${file}: Empty`);
    continue;
  }
  const arabicMatches = content.match(/[\u0600-\u06FF]/g);
  const arabicCount = arabicMatches ? arabicMatches.length : 0;
  const arabicRatio = arabicCount / totalLen;
  const sample = content.replace(/\s+/g, ' ').slice(0, 120);
  console.log(`${file}: len=${totalLen}, arabicCount=${arabicCount} (${(arabicRatio*100).toFixed(1)}%) - sample: "${sample}"`);
}
