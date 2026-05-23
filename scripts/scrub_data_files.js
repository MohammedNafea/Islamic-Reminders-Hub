import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToScrub = [
  path.resolve(__dirname, 'verified-seeds.cjs'),
  path.resolve(__dirname, '../artifacts/adhkar/public/data/library_content.json'),
  path.resolve(__dirname, '../artifacts/adhkar/public/data/content.json')
];

const rules = [
  { pattern: /الأربعون النووية/g, replacement: "الأربعون حديثاً" },
  { pattern: /الأربعين النووية/g, replacement: "الأربعين حديثاً" },
  { pattern: /رياض الصالحين/g, replacement: "رياض الحديث" },
  { pattern: /التحجيل في تخريج الأحاديث/g, replacement: "دراسات حديثية" },
  { pattern: /زوائد سنن أبي داود/g, replacement: "أحاديث السنن" },
  { pattern: /علل أحاديث الطهارة/g, replacement: "شروح أحاديث الطهارة" },
  { pattern: /صحيح أذكار الصباح والمساء/g, replacement: "أذكار الصباح والمساء" },
  { pattern: /شروح أذكار الصباح والمساء/g, replacement: "أذكار الصباح والمساء" },
  
  // Book names for classical authors to be stripped
  { pattern: /صحيح البخاري وصحيح مسلم/g, replacement: "رواه البخاري ومسلم" },
  { pattern: /صحيح البخاري/g, replacement: "رواه البخاري" },
  { pattern: /صحيح مسلم بشرح النووي/g, replacement: "رواه مسلم" },
  { pattern: /صحيح مسلم/g, replacement: "رواه مسلم" },
  { pattern: /سنن أبي داود/g, replacement: "رواه أبو داود" },
  { pattern: /سنن الترمذي/g, replacement: "رواه الترمذي" },
  { pattern: /سنن النسائي/g, replacement: "رواه النسائي" },
  { pattern: /سنن ابن ماجه/g, replacement: "رواه ابن ماجه" },
  { pattern: /أخرجه البخاري ومسلم في صحيحيهما/g, replacement: "رواه البخاري ومسلم" },
  { pattern: /أخرجه البخاري/g, replacement: "رواه البخاري" },
  { pattern: /أخرجه مسلم/g, replacement: "رواه مسلم" },
  { pattern: /رواه البخاري في صحيحه/g, replacement: "رواه البخاري" },
  { pattern: /رواه مسلم في صحيحه/g, replacement: "رواه مسلم" },
  { pattern: /رواه أبو داود في سننه/g, replacement: "رواه أبو داود" },
  { pattern: /رواه النسائي في سننه/g, replacement: "رواه النسائي" },
  { pattern: /رواه ابن ماجه في سننه/g, replacement: "رواه ابن ماجه" },
  { pattern: /رواه الترمذي في سننه/g, replacement: "رواه الترمذي" },

  // Contemporary names to be completely removed
  { pattern: /الألباني/g, replacement: "" },
  { pattern: /النووي/g, replacement: "" },
  { pattern: /العلوان/g, replacement: "" },
  { pattern: /الطريفي/g, replacement: "" },
  { pattern: /الدرر السنية/g, replacement: "" },
  { pattern: /حصن المسلم/g, replacement: "" },
  
  // Clean up any double spaces, comma artifacts or empty gradings created by removals
  { pattern: /وصححه \s*،/g, replacement: "" },
  { pattern: /وصحّحه \s*/g, replacement: "" },
  { pattern: /وحسنه \s*/g, replacement: "" },
  { pattern: /وضعفه \s*/g, replacement: "" },
  { pattern: /بشرح \s*/g, replacement: "" },
  { pattern: /صحيح بشواهد/g, replacement: "صحيح" },
  { pattern: /، وإسناده صحيح/g, replacement: "، وهو حديث صحيح" },
  { pattern: /، وإسناده حسن/g, replacement: "، وهو حديث حسن" }
];

filesToScrub.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  rules.forEach(rule => {
    content = content.replace(rule.pattern, rule.replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully scrubbed: ${filePath}`);
  } else {
    console.log(`No changes made to: ${filePath}`);
  }
});

console.log('Scrubbing complete!');
