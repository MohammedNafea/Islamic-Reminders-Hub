import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');

/**
 * أداة تطهير النصوص — تستبدل الأنماط المطلوبة بعبارات محايدة.
 * ملاحظة: الأنماط التي تستبدل النص بنفسه (no-ops) تم إزالتها.
 */
const replacements = [
  // تنظيف المعرفات (IDs) في مسارات وملفات الويكي
  { regex: /الغناء_في_الميزان_لجنة التحقيق_scholar/g, replacement: "الغناء_في_الميزان_لجنة_التحقيق" },
  { regex: /مكتبة_نور_عشرة_النساء_من_المغني_لجنة التحقيق_2_/g, replacement: "مكتبة_نور_عشرة_النساء_لجنة_التحقيق" },
  { regex: /concept-الغناء_في_الميزان_لجنة التحقيق_scholar/g, replacement: "concept-الغناء_في_الميزان_لجنة_التحقيق" },
  { regex: /concept-مكتبة_نور_عشرة_النساء_من_المغني_لجنة التحقيق_2_/g, replacement: "concept-مكتبة_نور_عشرة_النساء_لجنة_التحقيق" },
];

// لا استثناءات فعلية — المصطلحات التاريخية محفوظة كما هي
const restoreHistorical = [];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === '.pnpm' || file === 'dist') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else {
      const ext = path.extname(file);
      if (['.json', '.md', '.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        try {
          let content = fs.readFileSync(fullPath, 'utf-8');
          let modified = content;
          let changed = false;

          for (const rule of replacements) {
            if (rule.regex.test(modified)) {
              modified = modified.replace(rule.regex, rule.replacement);
              changed = true;
            }
          }

          for (const rule of restoreHistorical) {
            if (rule.regex.test(modified)) {
              modified = modified.replace(rule.regex, rule.replacement);
              changed = true;
            }
          }

          if (changed) {
            fs.writeFileSync(fullPath, modified, 'utf-8');
            console.log(`[DeepScrub] تم تطهير الملف: ${fullPath}`);
          }
        } catch (e) {
          // تخطي الملفات التي لا يمكن قراءتها كنص
        }
      }
    }
  }
}

console.log('[DeepScrub] بدء عملية التطهير الشاملة والعميقة لكافة ملفات المشروع...');
processDirectory(rootDir);
console.log('[DeepScrub] اكتمل التطهير الشامل بنجاح.');
