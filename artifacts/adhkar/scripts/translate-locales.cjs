#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper to map language codes for Google Translate
function mapLanguageCode(code) {
  const clean = code.split("-")[0].toLowerCase();
  if (clean === "zh") return "zh-CN";
  if (clean === "ckb") return "ku";
  return clean;
}

// Helper to translate text using Google Translate API
function translateText(text, targetLang) {
  return new Promise((resolve) => {
    const trimmed = text.trim();
    if (!trimmed) return resolve("");
    
    // Don't translate digits or purely non-word strings
    if (/^\d+$/.test(trimmed)) return resolve(trimmed);

    const mappedLang = mapLanguageCode(targetLang);
    if (mappedLang === "ar") return resolve(trimmed);

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${mappedLang}&dt=t&q=${encodeURIComponent(trimmed)}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && Array.isArray(parsed[0])) {
            const translated = parsed[0]
              .map((item) => (Array.isArray(item) && typeof item[0] === 'string' ? item[0] : ""))
              .join("");
            resolve(translated || trimmed);
          } else {
            resolve(trimmed);
          }
        } catch (e) {
          resolve(trimmed);
        }
      });
    }).on('error', (err) => {
      console.error(`Error translating "${trimmed}" to ${targetLang}:`, err.message);
      resolve(trimmed); // fallback
    });
  });
}

// Parse custom TypeScript export default format
function readTsFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf8');
  // Strip export default and trailing semicolon to make it a parseable expression
  const clean = content
    .trim()
    .replace(/^export\s+default\s+/, '')
    .replace(/;$/, '');
  
  try {
    return new Function(`return ${clean}`)();
  } catch (e) {
    console.error(`Failed to parse TS file at ${filePath}:`, e.message);
    return {};
  }
}

// Find missing keys recursively
function findMissing(arObj, targetObj, path = '') {
  const missing = [];
  
  for (const key in arObj) {
    const currentPath = path ? `${path}.${key}` : key;
    const arVal = arObj[key];
    const targetVal = targetObj ? targetObj[key] : undefined;
    
    if (typeof arVal === 'string') {
      // If key is missing, or is empty, or is exactly equal to the Arabic text (not translated yet)
      if (
        targetVal === undefined || 
        targetVal === null || 
        targetVal === '' || 
        (targetVal === arVal && arVal.trim().length > 0 && /[\u0600-\u06FF]/.test(arVal))
      ) {
        missing.push({ path: currentPath, text: arVal });
      }
    } else if (Array.isArray(arVal)) {
      if (!targetVal || !Array.isArray(targetVal) || targetVal.length !== arVal.length) {
        arVal.forEach((item, index) => {
          missing.push({ path: `${currentPath}[${index}]`, text: item });
        });
      } else {
        arVal.forEach((item, index) => {
          if (
            targetVal[index] === undefined || 
            targetVal[index] === null || 
            targetVal[index] === '' || 
            (targetVal[index] === item && item.trim().length > 0 && /[\u0600-\u06FF]/.test(item))
          ) {
            missing.push({ path: `${currentPath}[${index}]`, text: item });
          }
        });
      }
    } else if (typeof arVal === 'object' && arVal !== null) {
      const subMissing = findMissing(arVal, targetVal, currentPath);
      missing.push(...subMissing);
    }
  }
  
  return missing;
}

// Set nested path in object
function setPath(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i];
    
    // Check if it's an array index, e.g. "days_short[0]"
    const arrayMatch = part.match(/(.+)\[(\d+)\]/);
    if (arrayMatch) {
      const arrayKey = arrayMatch[1];
      const index = parseInt(arrayMatch[2], 10);
      if (!current[arrayKey]) current[arrayKey] = [];
      current = current[arrayKey];
      current[index] = value;
      return;
    }
    
    if (i === parts.length - 1) {
      current[part] = value;
    } else {
      if (!current[part]) current[part] = {};
      current = current[part];
    }
  }
}

// Main execution function
async function main() {
  const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
  const arPath = path.join(localesDir, 'ar.ts');
  
  console.log('Reading Arabic source of truth...');
  const arObj = readTsFile(arPath);
  
  const files = fs.readdirSync(localesDir);
  const targetFiles = files.filter(f => f.endsWith('.ts') && f !== 'ar.ts' && f !== 'template.ts');
  
  console.log(`Found ${targetFiles.length} target locale files.`);
  
  for (const file of targetFiles) {
    const filePath = path.join(localesDir, file);
    const langCode = file.replace('.ts', '');
    
    console.log(`\n----------------------------------------`);
    console.log(`Processing locale: ${langCode} (${file})`);
    
    const targetObj = readTsFile(filePath);
    const missing = findMissing(arObj, targetObj);
    
    if (missing.length === 0) {
      console.log(`Locale ${langCode} is 100% complete! No missing keys.`);
      continue;
    }
    
    console.log(`Found ${missing.length} missing/untranslated keys in ${langCode}. Translating...`);
    
    // Translate in small batches to avoid slamming the API
    const batchSize = 5;
    for (let i = 0; i < missing.length; i += batchSize) {
      const batch = missing.slice(i, i + batchSize);
      await Promise.all(batch.map(async (item) => {
        try {
          const translation = await translateText(item.text, langCode);
          setPath(targetObj, item.path, translation);
        } catch (err) {
          console.error(`Failed to translate "${item.text}":`, err.message);
        }
      }));
      // Tiny breather
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Format output code
    const outputCode = `export default ${JSON.stringify(targetObj, null, 2)};\n`;
    fs.writeFileSync(filePath, outputCode, 'utf8');
    console.log(`Successfully updated ${file} with all translations!`);
    
    // Sleep a bit between files
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n========================================');
  console.log('All locales translation sync completed successfully!');
}

main().catch(console.error);
