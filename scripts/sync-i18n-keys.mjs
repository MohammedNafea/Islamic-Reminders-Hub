/**
 * Sync missing i18n keys from en.ts to all other locale files.
 * Adds missing top-level sections with English fallback values.
 * Usage: node scripts/sync-i18n-keys.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, basename } from "path";

const LOCALES_DIR = join(import.meta.dirname, "..", "artifacts", "adhkar", "src", "i18n", "locales");

// Read en.ts and extract the exported object keys
const enContent = readFileSync(join(LOCALES_DIR, "en.ts"), "utf-8");

// Parse top-level keys from en.ts export default { ... }
const enMatch = enContent.match(/export default\s*\{([\s\S]*)\}\s*;?\s*$/);
if (!enMatch) { console.error("Cannot parse en.ts"); process.exit(1); }

// Extract top-level key names
const topLevelKeys = [];
const body = enMatch[1];
let depth = 0;
let currentKey = "";
let inKey = true;
for (let i = 0; i < body.length; i++) {
  const ch = body[i];
  if (ch === '{' || ch === '[') { depth++; inKey = false; }
  else if (ch === '}' || ch === ']') { depth--; }
  else if (depth === 0 && ch === ':' && inKey) {
    topLevelKeys.push(currentKey.trim());
    inKey = false;
  }
  else if (depth === 0 && ch === ',' && !inKey) {
    inKey = true;
    currentKey = "";
  }
  else if (inKey && depth === 0) {
    currentKey += ch;
  }
}

console.log("English top-level keys:", topLevelKeys.join(", "));

// Extract each section from en.ts as a string
function extractSection(content, key) {
  // Find the key: { ... } or key: [ ... ] pattern
  const regex = new RegExp(`\\b${key}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*\\w+\\s*:|\\n\\}\\s*;?\\s*$)`, "m");
  const match = content.match(regex);
  if (!match) return null;
  // We need to find the full value including nested braces
  let start = content.indexOf(key) + key.length;
  start = content.indexOf(":", start) + 1;
  let depth = 0;
  let end = start;
  let started = false;
  for (let i = start; i < content.length; i++) {
    const ch = content[i];
    if (ch === '{' || ch === '[') { depth++; started = true; }
    else if (ch === '}' || ch === ']') { depth--; }
    if (started && depth === 0) { end = i + 1; break; }
  }
  return content.substring(start, end).trim();
}

// Process each locale file
const files = readdirSync(LOCALES_DIR).filter(f => f.endsWith(".ts") && f !== "en.ts" && f !== "template.ts");

for (const file of files) {
  const filePath = join(LOCALES_DIR, file);
  let content = readFileSync(filePath, "utf-8");
  
  // Find existing top-level keys in this locale
  const localeMatch = content.match(/export default\s*\{([\s\S]*)\}\s*;?\s*$/);
  if (!localeMatch) { console.log(`Skipping ${file} - cannot parse`); continue; }
  
  const localeBody = localeMatch[1];
  const existingKeys = [];
  let depth2 = 0;
  let currentKey2 = "";
  let inKey2 = true;
  for (let i = 0; i < localeBody.length; i++) {
    const ch = localeBody[i];
    if (ch === '{' || ch === '[') { depth2++; inKey2 = false; }
    else if (ch === '}' || ch === ']') { depth2--; }
    else if (depth2 === 0 && ch === ':' && inKey2) {
      existingKeys.push(currentKey2.trim());
      inKey2 = false;
    }
    else if (depth2 === 0 && ch === ',' && !inKey2) {
      inKey2 = true;
      currentKey2 = "";
    }
    else if (inKey2 && depth2 === 0) {
      currentKey2 += ch;
    }
  }

  const missingKeys = topLevelKeys.filter(k => !existingKeys.includes(k));
  if (missingKeys.length === 0) {
    console.log(`${file}: complete ✓`);
    continue;
  }

  console.log(`${file}: missing ${missingKeys.join(", ")}`);

  // Add missing sections from en.ts with a comment indicating they need translation
  let additions = [];
  for (const key of missingKeys) {
    const section = extractSection(enContent, key);
    if (section) {
      additions.push(`  // TODO: Translate to ${file.replace('.ts', '')}\n  ${key}: ${section}`);
    }
  }

  if (additions.length > 0) {
    // Insert before the closing };
    const insertPoint = content.lastIndexOf("}");
    const newContent = content.substring(0, insertPoint) + ",\n\n" + additions.join(",\n\n") + "\n" + content.substring(insertPoint);
    writeFileSync(filePath, newContent, "utf-8");
    console.log(`  → Added ${additions.length} sections`);
  }
}

console.log("\nDone! Review TODO comments in updated files for translation.");
