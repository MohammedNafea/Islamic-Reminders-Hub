import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdf from 'pdf-parse';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../artifacts/adhkar/.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cohcnmqarjvoradzlsov.supabase.co';
// Supabase Service Role Key for writing to DB
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvaGNubXFhcmp2b3JhZHpsc292Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE4ODM1MCwiZXhwIjoyMDk0NzY0MzUwfQ.n-RRLjrf_vJ-CUBbR3-tJb4IXFwaoxNhtxRgx3ZP3fc';
const CF_ACCOUNT_ID = process.env.VITE_CLOUDFLARE_ACCOUNT_ID || '904150a4e5a4ec9686bdba22644371ed';
const CF_AI_TOKEN = process.env.VITE_CLOUDFLARE_AI_TOKEN || 'cfut_a30IRZ1ovKTPTrvE8ZGj6dpm8UzQC4oe14qEyNkBa4b42378';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { redactText } = require(path.resolve(__dirname, '../LLM_Wiki/scripts/private-redactions.cjs'));

const PDF_DIR = 'C:\\Users\\mmmad\\Downloads\\مدمج';
const LOCAL_JSON_PATH = path.resolve(__dirname, '../artifacts/adhkar/public/data/library_content.json');

// Mapping of specific filenames to metadata
const TARGET_FILES = [
  {
    filename: 'الغناء_في_الميزان_عبدالعزيز_الطريفي.pdf',
    title: 'دراسة أحكام الغناء',
    bookTitle: 'دراسة أحكام الغناء',
    author: 'لجنة التحقيق والتدقيق العلمي',
    category: 'fiqh',
    tags: ['الغناء', 'الموسيقى', 'أحكام فقهية', 'المعازف']
  },
  {
    filename: 'مكتبة نور محاضرة حكم الغناء 4 .pdf',
    title: 'محاضرة في أحكام الغناء والقرآن',
    bookTitle: 'محاضرة في أحكام الغناء والقرآن',
    author: 'لجنة التحقيق والتدقيق العلمي',
    category: 'fiqh',
    tags: ['الغناء', 'الموسيقى', 'أحكام فقهية', 'محاضرة']
  },
  {
    filename: 'مكتبة_نور_الاختلاط_تحرير_وتقرير_وتعقيب_2_.pdf',
    title: 'مسألة الاختلاط في الميزان',
    bookTitle: 'مسألة الاختلاط في الميزان',
    author: 'لجنة التحقيق والتدقيق العلمي',
    category: 'fiqh',
    tags: ['الاختلاط', 'النساء', 'الحجاب', 'أحكام فقهية']
  },
  {
    filename: 'مكتبة_نور_عشرة_النساء_من_المغني_عبدالعزيز_2_.pdf',
    title: 'أحكام عشرة النساء',
    bookTitle: 'أحكام عشرة النساء',
    author: 'لجنة التحقيق والتدقيق العلمي',
    category: 'fiqh',
    tags: ['النساء', 'عشرة النساء', 'النكاح', 'أحكام فقهية']
  },
  {
    filename: 'مكتبة_نور_مختصر_صحيح_أذكار_الصباح_والمساء_مع_تخريج_2_.pdf',
    title: 'أذكار اليوم والليلة المحققة',
    bookTitle: 'أذكار اليوم والليلة المحققة',
    author: 'لجنة التحقيق والتدقيق العلمي',
    category: 'dhikr',
    tags: ['أذكار', 'الصباح والمساء', 'تخريج', 'أذكار الصباح', 'أذكار المساء']
  },
  {
    filename: 'ar_alazan_Wal_eqamh.pdf',
    title: 'أحكام الأذان والإقامة',
    bookTitle: 'أحكام الأذان والإقامة',
    author: 'لجنة التحقيق والتدقيق العلمي',
    category: 'fiqh',
    tags: ['الأذان', 'الإقامة', 'الصلاة', 'أحكام فقهية']
  },
  {
    filename: 'الرقية الشرعية .pdf',
    title: 'الرقية الشرعية من الكتاب والسنة',
    bookTitle: 'الرقية الشرعية',
    author: 'عام',
    category: 'dhikr',
    tags: ['الرقية الشرعية', 'تحصين', 'علاج', 'أذكار', 'الرقية']
  },
  {
    filename: 'ar_sefat_Salaat_elnabi.pdf',
    title: 'صفة الصلاة المحققة',
    bookTitle: 'صفة الصلاة المحققة',
    author: 'لجنة التحقيق والتدقيق العلمي',
    category: 'fiqh',
    tags: ['الصلاة', 'صفة الصلاة', 'أحكام فقهية']
  },
  {
    filename: 'ar_sefat_Wodoo_elnabi.pdf',
    title: 'صفة الوضوء المحققة',
    bookTitle: 'صفة الوضوء المحققة',
    author: 'لجنة التحقيق والتدقيق العلمي',
    category: 'fiqh',
    tags: ['الوضوء', 'صفة الوضوء', 'الطهارة', 'أحكام فقهية']
  },
  {
    filename: 'مكتبة_نور_الخلاصة_من_كتاب_صفة_حجة_النبي_صلى_الله_عليه_وسلم_للشيخ.pdf',
    title: 'صفة الحج المحققة',
    bookTitle: 'صفة الحج المحققة',
    author: 'لجنة التحقيق والتدقيق العلمي',
    category: 'hadith',
    tags: ['الحج', 'صفة الحج', 'حجة الوداع', 'أحكام فقهية']
  },
  {
    filename: 'علل_أحاديث_الأحكام_الطهارة_للطريفي.pdf',
    title: 'دراسة علل أحاديث الطهارة',
    bookTitle: 'دراسة علل أحاديث الطهارة',
    author: 'لجنة التحقيق والتدقيق العلمي',
    category: 'hadith',
    tags: ['العلل', 'حديث', 'أحاديث الأحكام', 'الطهارة']
  },
  {
    filename: 'مكتبة_نور_الإعلام_بشرح_نواقض_الإسلام_عبد_العزيز_بن_مرزوق_الطريفي.pdf',
    title: 'الإعلام بمسائل التوحيد',
    bookTitle: 'الإعلام بمسائل التوحيد',
    author: 'لجنة التحقيق والتدقيق العلمي',
    category: 'creed',
    tags: ['العقيدة', 'مسائل التوحيد', 'شرح', 'التوحيد']
  }
];

// Helper to delay execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate embedding from Cloudflare Workers AI
async function getEmbedding(text) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/baai/bge-m3`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_AI_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      }
    );
    if (!response.ok) {
      throw new Error(`Workers AI returned status ${response.status}`);
    }
    const result = await response.json();
    if (result.success && result.result?.data?.[0]) {
      return result.result.data[0];
    }
    throw new Error(result.errors?.[0]?.message || 'Unknown Workers AI error');
  } catch (err) {
    console.error(`Error generating embedding: ${err.message}`);
    return null;
  }
}

// Clean text to avoid garbage
function cleanText(text) {
  if (!text) return '';
  let cleaned = text.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '');
  cleaned = cleaned.replace(/\[\d+\]/g, '');
  cleaned = cleaned.replace(/L\s*\d+\s*J/gi, '');
  cleaned = cleaned.replace(/األ/g, 'الأ');
  cleaned = cleaned.replace(/اإل/g, 'الإ');
  cleaned = cleaned.replace(/اآل/g, 'الآ');
  cleaned = cleaned.replace(/اال/g, 'الا');

  // 1. Remove Private Use Area unicode characters (like  or other wingdings/icon fonts)
  cleaned = cleaned.replace(/[\uE000-\uF8FF]/g, '');

  // 2. Convert صلى الله عليه وسلم (with or without dashes/spaces) to ﷺ
  cleaned = cleaned.replace(/-?\s*صلى\s+الله\s+عليه\s+وسلم\s*-?/g, ' ﷺ ');

  // 3. Remove all diacritics (Tashkeel) and Tatweel/Kashida
  cleaned = cleaned.replace(/[\u064B-\u0652\u0670\u0640]/g, '');

  // 4. Fix double brackets/quotes
  cleaned = cleaned.replace(/\)\)\s*/g, ' «');
  cleaned = cleaned.replace(/\s*\(\(/g, '» ');

  // 5. Fix single brackets that are reversed or floating
  cleaned = cleaned.replace(/\s*\)\s*([^)]+?)\s*\(\s*/g, ' ($1) ');

  // 6. Fix specific typos using regex with space/boundary lookbehinds/lookaheads (Arabic letter-safe boundaries)
  const replaceWord = (bad, good) => {
    const reg = new RegExp(`(?<![\\u0600-\\u06FF])${bad}(?![\\u0600-\\u06FF])`, 'g');
    cleaned = cleaned.replace(reg, good);
  };

  replaceWord('فل', 'فلا');
  replaceWord('إل', 'إلا');
  replaceWord('النسان', 'الإنسان');
  replaceWord('المام', 'الإمام');
  replaceWord('الحكام', 'الأحكام');
  replaceWord('الاصوات', 'الأصوات');
  replaceWord('الْ橫\u064E\u0635\u0652\u0648\u064E\u0627\u062A', 'الأصوات'); // wait, let's keep it normalized
  replaceWord('الَْصْوَات', 'الأصوات');
  replaceWord('الئمة', 'الأئمة');
  replaceWord('الخر', 'الآخر');
  replaceWord('جللة', 'جلالة');
  replaceWord('اللفاظ', 'الألفاظ');
  replaceWord('العقلء', 'العقلاء');
  replaceWord('الدلة', 'الأدلة');
  replaceWord('الشعار', 'الأشعار');
  replaceWord('الناشيد', 'الأناشيد');
  replaceWord('الوائل', 'الأوائل');
  replaceWord('المرين', 'الأمرين');
  replaceWord('أفل', 'أفلا');
  replaceWord('اهلل', 'الله');
  replaceWord('الولى', 'الأولى');
  replaceWord('الخرة', 'الآخرة');
  replaceWord('الصحاب', 'الأصحاب');
  replaceWord('الخلافا', 'الخلاف');
  replaceWord('بالصحاب', 'بالأصحاب');
  replaceWord('الول', 'الأول');
  replaceWord('الخرون', 'الآخرون');
  replaceWord('النبياء', 'الأنبياء');
  replaceWord('الشياء', 'الأشياء');
  replaceWord('الفعال', 'الأفعال');
  replaceWord('الديان', 'الأديان');
  replaceWord('اليات', 'الآيات');
  replaceWord('الراي', 'الرأي');
  replaceWord('الراء', 'الآراء');
  replaceWord('المر', 'الأمر');
  replaceWord('بالمر', 'بالأمر');
  replaceWord('الصلح', 'الصلاح');
  replaceWord('الصل', 'الأصل');
  replaceWord('الساس', 'الأساس');
  replaceWord('الذان', 'الأذان');
  replaceWord('القامة', 'الإقامة');
  replaceWord('اليمان', 'الإيمان');

  cleaned = cleaned.replace(/كلم\s+الله/g, 'كلام الله');
  cleaned = cleaned.replace(/الخلفا\s+بالصحاب/g, 'الخلاف بين الأصحاب');
  cleaned = cleaned.replace(/أفل\s+تبصرون/g, 'أفلا تبصرون');
  cleaned = cleaned.replace(/أفل\s+تعقلون/g, 'أفلا تعقلون');
  cleaned = cleaned.replace(/أفل\s+تتفكرون/g, 'أفلا تتفكرون');
  cleaned = cleaned.replace(/أفل\s+يتدبرون/g, 'أفلا يتدبرون');
  cleaned = cleaned.replace(/رسول\s+اهلل/g, 'رسول الله');
  cleaned = cleaned.replace(/عبد\s+اهلل/g, 'عبد الله');
  cleaned = cleaned.replace(/سبحان\s+اهلل/g, 'سبحان الله');
  cleaned = cleaned.replace(/بسم\s+اهلل/g, 'بسم الله');
  cleaned = cleaned.replace(/إن\s+شاء\s+اهلل/g, 'إن شاء الله');
  cleaned = cleaned.replace(/كتاب\s+اهلل/g, 'كتاب الله');
  cleaned = cleaned.replace(/أهل\s+الصلح/g, 'أهل الصلاح');
  cleaned = cleaned.replace(/ويأتي\s+الكلم/g, 'ويأتي الكلام');

  // 7. Replace English comma with Arabic comma
  cleaned = cleaned.replace(/([\u0600-\u06FF]+),([\s\u0600-\u06FF]+)/g, '$1،$2');

  // 8. Fix spaces before punctuation
  cleaned = cleaned.replace(/\s+،/g, '،');
  cleaned = cleaned.replace(/\s+\./g, '.');
  cleaned = cleaned.replace(/\s+؛/g, '؛');
  cleaned = cleaned.replace(/\s+\?/g, '؟');
  cleaned = cleaned.replace(/\s+؟/g, '؟');

  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = redactText(cleaned);
  return cleaned.trim();
}

// Segment full text into logical chunks of ~600-1200 characters
function createChunks(text) {
  const paragraphs = text.split(/\n+/);
  const chunks = [];
  let currentChunk = '';

  for (const p of paragraphs) {
    const cleaned = cleanText(p);
    if (!cleaned || cleaned.length < 40) continue;

    if ((currentChunk + ' ' + cleaned).length > 1000) {
      if (currentChunk.trim().length >= 100) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = cleaned;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + cleaned;
    }
  }

  if (currentChunk.trim().length >= 100) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

async function start() {
  console.log('=== بدء عملية معالجة ملفات الـ PDF واستيراد الأحكام فقهية ===');

  if (!fs.existsSync(PDF_DIR)) {
    console.error(`المجلد ${PDF_DIR} غير موجود على هذا النظام!`);
    process.exit(1);
  }

  // Load existing local library_content.json to append items
  let localItems = [];
  if (fs.existsSync(LOCAL_JSON_PATH)) {
    try {
      localItems = JSON.parse(fs.readFileSync(LOCAL_JSON_PATH, 'utf8'));
      console.log(`تم تحميل ${localItems.length} عنصر موجود حالياً في الملف المحلي.`);
    } catch (e) {
      console.error('فشل قراءة الملف المحلي library_content.json. سيتم إنشاء ملف جديد.');
    }
  }

  const addedItemsCount = {};

  for (const target of TARGET_FILES) {
    const filePath = path.join(PDF_DIR, target.filename);
    if (!fs.existsSync(filePath)) {
      console.log(`[!] تخطي الملف ${target.filename} لعدم وجوده في المجلد.`);
      continue;
    }

    console.log(`\n--------------------------------------------`);
    console.log(`جاري قراءة ومعالجة الملف: ${target.filename}`);
    
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      const fullText = data.text;
      
      console.log(`تم قراءة الملف بنجاح. عدد الصفحات: ${data.numpages}. حجم النص: ${fullText.length} حرف.`);
      
      const rawChunks = createChunks(fullText);
      console.log(`تم توليد ${rawChunks.length} مقطع مبدئي.`);
      
      // Limit number of chunks to index per file to avoid overloading APIs
      const maxChunks = Math.min(rawChunks.length, 30); 
      const selectedChunks = rawChunks.slice(2, maxChunks + 2); // Skip first two introductory chunks usually containing publisher info
      
      console.log(`تم اختيار ${selectedChunks.length} مقطع رئيسي للاستيراد وتوليد المتجهات.`);
      
      addedItemsCount[target.filename] = 0;

      for (let i = 0; i < selectedChunks.length; i++) {
        const text = selectedChunks[i];
        const chunkId = `pdf-${target.filename.replace('.pdf', '')}-chunk-${String(i + 1).padStart(3, '0')}`;
        
        console.log(`  -> جاري معالجة المقطع ${i + 1}/${selectedChunks.length} (حجم: ${text.length} حرف)...`);
        
        // Generate embedding vector
        const embedding = await getEmbedding(text);
        if (!embedding) {
          console.log(`  [!] فشل توليد المتجه للمقطع ${i + 1}. تخطي.`);
          continue;
        }

        // 1. Save to Supabase using service role client
        const itemRecord = {
          id: chunkId,
          category: target.category,
          title: target.title,
          book_title: target.bookTitle,
          text: text,
          source: target.author,
          tags: target.tags,
          benefits: []
        };

        const { error } = await supabase
          .from('library_items')
          .upsert({
            ...itemRecord,
            embedding: embedding
          });

        if (error) {
          console.error(`  [!] خطأ في الرفع لـ Supabase للمقطع ${chunkId}:`, error.message);
        } else {
          console.log(`  [+] تم الرفع لـ Supabase بنجاح.`);
        }

        // 2. Append to local JSON (excluding embedding for file size optimization)
        // Check if item already exists locally, update or add
        const existingIndex = localItems.findIndex(item => item.id === chunkId);
        if (existingIndex > -1) {
          localItems[existingIndex] = {
            ...itemRecord,
            confidence: 0.9,
            reviewStatus: 'approved'
          };
        } else {
          localItems.push({
            ...itemRecord,
            confidence: 0.9,
            reviewStatus: 'approved'
          });
        }

        addedItemsCount[target.filename]++;
        // Wait 250ms to respect rate limit
        await sleep(250);
      }
      
      console.log(`اكتملت معالجة ${target.filename}. تم استيراد ${addedItemsCount[target.filename]} مقطع بنجاح.`);
    } catch (err) {
      console.error(`[!] خطأ أثناء معالجة ${target.filename}:`, err);
    }
  }

  // Write updated library_content.json
  try {
    fs.writeFileSync(LOCAL_JSON_PATH, JSON.stringify(localItems, null, 2), 'utf8');
    console.log(`\n============================================`);
    console.log(`[نجاح] تم تحديث وحفظ الملف المحلي بنجاح: ${LOCAL_JSON_PATH}`);
    console.log(`إجمالي العناصر الفقهية والعلمية في الموسوعة المحلية الآن: ${localItems.length} عنصر.`);
  } catch (err) {
    console.error('فشل حفظ الملف المحلي library_content.json:', err);
  }

  console.log('=== انتهت العملية بنجاح! ===');
}

start().catch(err => {
  console.error('خطأ غير متوقع:', err);
});
