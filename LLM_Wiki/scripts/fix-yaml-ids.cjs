#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const conceptsDir = path.resolve(__dirname, '..', 'wiki', 'concepts');
const files = fs.readdirSync(conceptsDir).filter(f => f.endsWith('.md'));

let fixed = 0;
for (const file of files) {
  const filePath = path.join(conceptsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  
  // استخراج العنوان من YAML
  const titleMatch = content.match(/title:\s*"([^"]+)"/);
  if (!titleMatch) continue;
  
  const title = titleMatch[1];
  // إنشاء معرف نظيف من العنوان
  const cleanId = 'merged_' + title.replace(/\s+/g, '_').replace(/[^\w\u0600-\u06FF_]/g, '');
  
  // استبدال المعرف القديم
  content = content.replace(/id:\s*"merged_[^"]*"/g, 'id: "' + cleanId + '"');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    fixed++;
    console.log('  ✓ ' + file + ': ' + cleanId);
  }
}
console.log('Total fixed: ' + fixed);
