# تقرير التدقيق الشامل — مشروع Islamic Reminders Hub

**تاريخ التدقيق:** 2026-05-17  
**المُدقِّق:** Cascade AI  
**إصدار TypeScript:** `~5.9.2` — اجتاز Typecheck بنجاح (0 أخطاء)  
**pnpm audit:** ثغرتان (high) في تبعيات عابرة

---

## ملخص تنفيذي

| الخطورة | العدد |
|---------|-------|
| 🔴 حرج (Critical) | 3 |
| 🟠 عالٍ (High) | 8 |
| 🟡 متوسط (Medium) | 12 |
| 🔵 منخفض (Low) | 9 |
| ⚪ معلوماتي (Info) | 6 |
| **الإجمالي** | **38** |

---

## 1. الأمن (Security)

### 🔴 SEC-01: ملف `.env` غير مدرج في `.gitignore`

- **الموقع:** `.gitignore`
- **الوصف:** لا يوجد سطر يتجاهل `.env` أو `.env.*` أو `.env.local`. إذا أنشأ أي مطور ملف `.env` (مثلاً لـ `DATABASE_URL` أو `VITE_SUPABASE_URL`) فسيُرفع إلى Git.
- **التأثير:** تسريب أسرار قاعدة البيانات ومفاتيح Supabase.
- **الحل:**
```gitignore
.env
.env.*
!.env.example
```

### 🔴 SEC-02: خادم API بدون حماية أمنية (Helmet / Rate-Limiting)

- **الموقع:** `artifacts/api-server/src/app.ts`
- **الوصف:** الخادم يستخدم `cors()` بدون قيود (أي دومين مسموح)، ولا يوجد `helmet` لرؤوس الأمان ولا rate-limiting.
- **التأثير:** عرضة لهجمات CSRF والـ brute-force وطلبات غير مقيّدة.
- **الحل:** إضافة `helmet()` وتقييد CORS بالدومينات المسموحة، واستخدام `express-rate-limit`.

### 🟠 SEC-03: ثغرة ReDoS في `picomatch` (تبعية عابرة)

- **الموقع:** `pnpm audit` — `picomatch@2.3.1` و `picomatch@4.0.3`
- **الوصف:** ثغرة ReDoS عبر extglob quantifiers (GHSA-c2c7-rcm5-vvqj).
- **التأثير:** احتمال هجمات حجب الخدمة عبر أنماط glob خبيثة في مرحلة البناء.
- **الحل:** إضافة override في `pnpm-workspace.yaml`:
```yaml
overrides:
  picomatch: ">=4.0.4"
```
أو الانتظار حتى تُحدّث `fast-glob` و `vite` نسختهم من `picomatch`.

### 🟠 SEC-04: `dangerouslySetInnerHTML` في `chart.tsx`

- **الموقع:** `artifacts/adhkar/src/components/ui/chart.tsx:79`
- **الوصف:** استخدام `dangerouslySetInnerHTML` لحقن CSS ديناميكي. الخطر محدود لأن المحتوى يُنشأ داخلياً، لكن يُفضل تجنبه.
- **التأثير:** منخفض — لا يأتي المحتوى من مصادر خارجية.
- **الحل:** استخدام `<style>` عادية مع Template Literal بدلاً من `dangerouslySetInnerHTML` أو قبوله كمخاطرة مقبولة.

### 🟠 SEC-05: Supabase client يُنشأ بدون env validation

- **الموقع:** `artifacts/adhkar/src/lib/supabase.ts:3-4`
- **الوصف:** `supabaseUrl` و `supabaseAnonKey` تأخذ `''` كقيمة افتراضية. لا يوجد تحقق من صيغة URL.
- **التأثير:** خطأ صامت إذا كانت القيم فارغة (يُنشأ `supabase = null`) — لا خطر أمني فعلي لكن UX سيء.
- **الحل:** إضافة تحذير في console عند غياب المتغيرات.

---

## 2. جودة الكود والمنطق (Code Quality & Logic)

### 🔴 حرج

#### 🔴 CQ-01: `console.log` في الإنتاج (`Home.tsx:15`)

- **الموقع:** `artifacts/adhkar/src/pages/Home.tsx:15`
- **الوصف:** `console.log("HOME PAGE RENDERED - V6")` — سطر تصحيح أخطاء متروك.
- **التأثير:** يظهر في console المستخدم في الإنتاج.
- **الحل:** حذف السطر.

### 🟠 عالٍ

#### 🟠 CQ-02: `useEffect` بتبعية `date` تسبب إعادة إنشاء متكررة

- **الموقع:** `artifacts/adhkar/src/pages/Home.tsx:23-31`
- **الوصف:** `useEffect` يعتمد على `[date]` لكن بداخله `setDate(now)` كل ثانية، مما يُلغي ويُعيد إنشاء الـ `setInterval` **كل ثانية**. هذا ليس خطأ وظيفي لكنه غير كفء.
- **التأثير:** إنشاء وإلغاء timer كل ثانية بدلاً من مرة واحدة.
- **الحل:** إزالة `date` من المصفوفة `[]` واستخدام `useRef` لمقارنة اليوم.

#### 🟠 CQ-03: `useEffect` بمصفوفة فارغة `[]` يستدعي `settings` بدون reactivity

- **الموقع:** `artifacts/adhkar/src/pages/Home.tsx:34-54`
- **الوصف:** `getSettings()` يُقرأ خارج الـ effect (سطر 22)، و`settings.calculationMethod` يُستخدم داخل effect لمرة واحدة. إذا تغيّرت الإعدادات لاحقاً لن يعاد جلب prayer times.
- **التأثير:** المستخدم يحتاج refresh لتطبيق تغيير طريقة الحساب في الصفحة الرئيسية (بينما في `PrayerTimesPage` يعمل بشكل صحيح لأن `settings.calculationMethod` في dependency array).
- **الحل:** إضافة `settings.calculationMethod` إلى dependency array.

#### 🟠 CQ-04: `getPrayerTimesFromAPI` تتجاهل بيانات API الفعلية

- **الموقع:** `artifacts/adhkar/src/lib/prayer-times.ts:98-117`
- **الوصف:** الدالة تستدعي `api.aladhan.com` لكنها **تتجاهل النتيجة** وتعيد حساب محلي (`getPrayerTimes()`). التعليق في السطر 112 يقول "temporary" لكنه الكود النهائي.
- **التأثير:** بيانات الشبكة مهدرة (bandwidth)، والنتيجة دائماً محلية.
- **الحل:** إما استخدام استجابة الـ API فعلياً أو إزالة استدعاء الشبكة بالكامل.

#### 🟠 CQ-05: عدد الصلوات في `salawatCount` لا يُعاد ضبطه يومياً

- **الموقع:** `artifacts/adhkar/src/lib/store.ts` — `getTasbihCount`/`setTasbihCount`
- **الوصف:** التسبيح يُحفظ بمفتاح `tasbih_home_salawat` في localStorage بدون تاريخ. العداد تراكمي إلى الأبد.
- **التأثير:** العداد المعروض على الصفحة الرئيسية ("اليوم") لا يُعاد ضبطه لـ 0 يومياً — مضلّل.
- **الحل:** إلحاق تاريخ اليوم بالمفتاح أو التحقق عند القراءة.

### 🟡 متوسط

#### 🟡 CQ-06: `next-themes` مستخدم كتبعية لكن غير مُستخدم

- **الموقع:** `artifacts/adhkar/package.json:61`
- **الوصف:** الحزمة `next-themes` مثبتة لكن ThemeProvider مكتوب يدوياً ولا يستورد شيئاً منها.
- **التأثير:** حجم تبعيات إضافي بلا فائدة.
- **الحل:** إزالتها من `devDependencies`.

#### 🟡 CQ-07: `dompurify` و `isomorphic-dompurify` مثبتتان معاً

- **الموقع:** `artifacts/adhkar/package.json:82-86`
- **الوصف:** `dompurify` و `isomorphic-dompurify` كلاهما مثبت. الكود (`purify.ts`) يستورد فقط `isomorphic-dompurify`. ويوجد أيضاً `@types/dompurify`.
- **التأثير:** تبعيات مكررة.
- **الحل:** إزالة `dompurify` من dependencies.

#### 🟡 CQ-08: ملف `services/notifications.ts` مكرر مع `lib/notifications.ts`

- **الموقع:** `src/services/notifications.ts` و `src/lib/notifications.ts`
- **الوصف:** وظائف متطابقة مكررة في مكانين. الكود الفعلي يستورد من `@/lib/notifications`.
- **التأثير:** ملف يتيم لا يُستخدم.
- **الحل:** حذف `src/services/notifications.ts`.

#### 🟡 CQ-09: إعادة جدولة التنبيهات عبر `setTimeout` غير موثوقة

- **الموقع:** `artifacts/adhkar/src/lib/notifications.ts:35-48`
- **الوصف:** `scheduleAtHour` يستخدم `setTimeout` مع delays قد تصل لـ 24 ساعة. المتصفح قد يُعلّق الـ tab أو ينام الجهاز.
- **التأثير:** الإشعارات لن تعمل بشكل موثوق.
- **الحل:** الاعتماد على Service Worker periodic sync أو background sync في PWA.

#### 🟡 CQ-10: `Quran.tsx` ينشئ `new Audio()` داخل `useState`

- **الموقع:** `artifacts/adhkar/src/pages/Quran.tsx:31`
- **الوصف:** `useState(new Audio())[0]` ينشئ Audio object جديد في كل render (React يتجاهل القيمة بعد أول مرة لكنها تُنشأ). الأصح `useRef`.
- **التأثير:** إنشاء كائنات Audio مهملة عند كل render.
- **الحل:** `const audioRef = useRef(new Audio())`.

#### 🟡 CQ-11: نصوص مشفرة بالعربية في مكونات (hardcoded)

- **الموقع:** `artifacts/adhkar/src/pages/Qibla.tsx:57-69` و `src/components/QiblaCompass.tsx:118`
- **الوصف:** نصوص الإرشادات وأزرار الكاميرا مكتوبة بالعربية مباشرة بدلاً من استخدام `t()`.
- **التأثير:** لا تُترجم مع باقي التطبيق عند تبديل اللغة.
- **الحل:** نقل النصوص إلى ملفات الترجمة.

#### 🟡 CQ-12: نقص ضخم في الترجمات لـ 16 لغة (template-based)

- **الموقع:** `src/i18n/locales/` — `am.ts`, `az.ts`, `ckb.ts`, `ha.ts`, `ja.ts`, `kk.ts`, `mr.ts`, `ps.ts`, `so.ts`, `sq.ts`, `ta.ts`, `te.ts`, `uz.ts`, `vi.ts`
- **الوصف:** هذه الملفات (1058 bytes كل منها) مجرد نسخ من `template.ts` تحتوي ~30 مفتاحاً فقط مقابل ~500+ مفتاح في `ar.ts` و `en.ts`.
- **التأثير:** 99% من النصوص ستظهر كمفاتيح خام أو بالـ fallback الإنجليزي لهذه اللغات.
- **الحل:** إكمال الترجمات أو إزالة اللغات غير المكتملة من قائمة `supportedLanguages`.

#### 🟡 CQ-13: `index.html` يحدد `lang="en"` بينما المحتوى عربي

- **الموقع:** `artifacts/adhkar/index.html:2`
- **الوصف:** `<html lang="en">` لكن الـ `<title>` والوصف بالعربية.
- **التأثير:** SEO وإمكانية الوصول — محركات البحث قد تصنف اللغة خطأً.
- **الحل:** استخدام `lang="ar"` أو ترك اللغة ديناميكية (يتم تعديلها عبر `Layout.tsx` في runtime لكن SSR/bots لن ترى ذلك).

### 🔵 منخفض

#### 🔵 CQ-14: `Icon: any` في `HubCard` component

- **الموقع:** `artifacts/adhkar/src/pages/Home.tsx:423`
- **الوصف:** `Icon: any` بدلاً من `React.ComponentType<LucideProps>`.
- **الحل:** `Icon: React.ComponentType<{ className?: string }>`.

#### 🔵 CQ-15: `deep-scrub-all.js` يحتوي استبدالات regex مع نتيجة مطابقة للنمط

- **الموقع:** `scripts/deep-scrub-all.js:13-17`
- **الوصف:** عدة أنماط regex تستبدل النص بنفسه (مثلاً `regex: /لجنة التحقيق/g, replacement: "لجنة التحقيق"`) — عمليات بلا أثر.
- **الحل:** مراجعة وتنظيف الاستبدالات المتكررة.

#### 🔵 CQ-16: ملفات PDF مكررة في `attached_assets/`

- **الموقع:** `attached_assets/`
- **الوصف:** ملفان متطابقان:
  - `مختصر_أذكار_الصباح_والمساء_(1)_1778598139106.pdf` (1.49 MB)
  - `مختصر_أذكار_الصباح_والمساء_(2)_1778598615537.pdf` (1.49 MB)
  - وكذلك: `مكتبة_نور_...(1)_...88.pdf` = `مكتبة_نور_...(1)_...21.pdf` (74 KB)
- **الحل:** حذف النسخ المكررة.

---

## 3. الإعدادات والبنية التحتية (Configuration)

### 🟠 CFG-01: `LLM_Wiki` لا يرث `tsconfig.base.json`

- **الموقع:** `LLM_Wiki/tsconfig.json`
- **الوصف:** يستخدم `"strict": false` و `"module": "Node16"` منفصلاً عن باقي المشروع. غير متسق مع بنية الـ monorepo.
- **التأثير:** أخطاء TypeScript لن تُكتشف. لا يُبنى مع `pnpm run build`.
- **الحل:** ضبط `strict: true` والاستفادة من `tsconfig.base.json`.

### 🟠 CFG-02: `LLM_Wiki` يعتمد على Express 4 بينما `api-server` يستخدم Express 5

- **الموقع:** `LLM_Wiki/package.json:21` — `"express": "^4.21.2"` و `"@types/express": "^4.17.21"`
- **الوصف:** تعارض إصدارات Express بين حزمتين في نفس الـ workspace.
- **التأثير:** تعقيد في الصيانة وقد يسبب مشاكل type resolution.
- **الحل:** ترقية LLM_Wiki إلى Express 5 أو توحيد الإصدار عبر `catalog:`.

### 🟡 CFG-03: `artifacts/brain/` مجلد شبه فارغ

- **الموقع:** `artifacts/brain/c1d18084-45b3-4d9d-9915-70f53bc39207/scratch/`
- **الوصف:** مجلد يحتوي على UUID ومجلد `scratch` فارغ. لا يوجد `package.json`.
- **التأثير:** clutter في المشروع.
- **الحل:** حذف المجلد أو إضافة `.gitignore` لتجاهله.

### 🟡 CFG-04: `replit.md` لم يُملأ بالمحتوى الفعلي

- **الموقع:** `replit.md`
- **الوصف:** العنوان ما زال `[Project name]` وأغلب الأقسام تحتوي عبارات placeholder مثل "_Replace..._" و "_Populate as you build..._".
- **الحل:** تعبئة المعلومات أو حذف الملف إذا لم يُستخدم Replit.

### 🟡 CFG-05: `pnpm-workspace.yaml` — كتالوج يحتوي `vite: ^6.2.1` بينما Vite 7 مثبت

- **الموقع:** `pnpm-workspace.yaml:66` و `pnpm-lock.yaml`
- **الوصف:** الكتالوج يحدد `vite: ^6.2.1` لكن في الـ lockfile يوجد `vite@7.3.2` أيضاً (مستخدم في mockup-sandbox). هذا يعني وجود إصدارين من Vite.
- **التأثير:** زيادة حجم `node_modules` وتعقيد.
- **الحل:** توحيد إصدار Vite في الكتالوج.

### 🔵 CFG-06: `canvas` و `pdf-parse` في جذر `package.json`

- **الموقع:** `package.json:17-18`
- **الوصف:** هاتان التبعيتان في الجذر بدلاً من الحزمة المحددة التي تحتاجهما (ربما `LLM_Wiki`). كما أن `canvas` يتطلب native build.
- **الحل:** نقلهما إلى الحزمة المناسبة.

### 🔵 CFG-07: `eslint` غير مثبت في `artifacts/adhkar/package.json`

- **الموقع:** `artifacts/adhkar/package.json` و `eslint.config.js`
- **الوصف:** ملف `eslint.config.js` موجود لكن `eslint` و`@eslint/js` و`typescript-eslint` و`eslint-plugin-react` و`eslint-plugin-react-hooks` غير مدرجة في `devDependencies`.
- **التأثير:** `pnpm --filter @workspace/adhkar run lint` سيفشل.
- **الحل:** إضافة التبعيات أو إزالة ملف الإعداد.

---

## 4. الأداء (Performance)

### 🟡 PERF-01: أيقونات PWA ضخمة (535 KB لكل واحدة)

- **الموقع:** `artifacts/adhkar/public/`
- **الوصف:** `favicon.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` كلها **535,893 bytes** — أي أنها نفس الملف!
- **التأثير:** icon-192 يجب أن يكون ~10-20 KB. حجم 536 KB يبطئ التحميل الأولي.
- **الحل:** إنشاء أحجام مناسبة (favicon: 32x32, apple-touch: 180x180, 192x192, 512x512) وضغطها.

### 🟡 PERF-02: `library_content.json` بحجم 266 KB يُحمّل بالكامل عند البحث

- **الموقع:** `artifacts/adhkar/src/hooks/useUnifiedSearch.ts:37-48`
- **الوصف:** ملف 266 KB يُحمّل بالكامل في الذاكرة عند أي بحث. يُنشئ Fuse index من جديد في كل `useMemo`.
- **التأثير:** بطء عند أول بحث على الأجهزة الضعيفة.
- **الحل:** تحميل مسبق في `useEffect` مع Web Worker أو lazy-loading.

### 🔵 PERF-03: `adhkar.ts` بحجم 33 KB — بيانات statically imported

- **الموقع:** `artifacts/adhkar/src/data/adhkar.ts`
- **الوصف:** بيانات ضخمة مدمجة في الـ bundle الرئيسي.
- **الحل:** نقلها إلى ملف JSON في `/public/data/` وتحميلها عند الحاجة، أو قبول الوضع الحالي لأن PWA يحتاج وصولاً offline.

---

## 5. SEO وإمكانية الوصول (SEO & Accessibility)

### 🟡 A11Y-01: `robots.txt` لا يحتوي Sitemap

- **الموقع:** `artifacts/adhkar/public/robots.txt`
- **الوصف:** الملف يحتوي فقط `User-agent: * Allow: /` بدون رابط sitemap.
- **الحل:** إضافة `Sitemap: https://islamic-reminders-hub.vercel.app/sitemap.xml` وإنشاء sitemap.

### 🟡 A11Y-02: أزرار بدون `aria-label` واضح

- **الموقع:** عدة مكونات مثل `HubCard` و `DhikrList`
- **الوصف:** الأزرار والبطاقات القابلة للنقر لا تحتوي على `aria-label` بديل.
- **التأثير:** قارئات الشاشة لن تقرأ الغرض بوضوح.
- **الحل:** إضافة `aria-label` وصفي.

### 🔵 A11Y-03: missing `og:image` meta tag

- **الموقع:** `artifacts/adhkar/index.html`
- **الوصف:** `og:image` غير محدد رغم وجود `opengraph.jpg` في public.
- **الحل:** إضافة `<meta property="og:image" content="/opengraph.jpg" />`.

---

## 6. البنية والتنظيم (Architecture)

### 🟠 ARCH-01: مخطط قاعدة البيانات فارغ

- **الموقع:** `lib/db/src/schema/index.ts`
- **الوصف:** الملف يحتوي فقط تعليقات و `export {}`. لا توجد جداول معرّفة.
- **التأثير:** `@workspace/db` لا يقدم أي وظيفة فعلية. api-server يعتمد عليه لكن لا يستفيد منه.
- **الحل:** إما بناء الجداول المطلوبة أو إزالة التبعية مؤقتاً.

### 🟡 ARCH-02: `drizzle.config.ts` يستخدم `__dirname` في ملف ESM

- **الموقع:** `lib/db/drizzle.config.ts:9`
- **الوصف:** `path.join(__dirname, ...)` — `__dirname` غير متاح في ESM modules. سيعمل فقط لأن `drizzle-kit` ينفذ عبر `tsx` الذي يحقنها.
- **التأثير:** خطر فشل إذا تم تنفيذه بطريقة أخرى.
- **الحل:** استخدام `import.meta.dirname` (Node 21+) أو `path.dirname(fileURLToPath(import.meta.url))`.

### 🔵 ARCH-03: `@workspace/api-client-react` لا يُستخدم في الواجهة

- **الموقع:** `artifacts/adhkar/package.json:52` — مدرجة كتبعية
- **الوصف:** الواجهة تستورد `@workspace/api-client-react` لكن لا يوجد أي استدعاء فعلي لـ `useHealthCheck` أو أي hook.
- **الحل:** إما البدء باستخدامها أو إزالتها لتبسيط البنية.

---

## 7. الوثائق والأصول (Documentation & Assets)

### 🔵 DOC-01: `README.md` يذكر "Vite 7" لكن الكتالوج يحدد Vite 6

- **الموقع:** `README.md:19`
- **الوصف:** "_Vite 7_" مذكور لكن الكتالوج يقول `vite: ^6.2.1`.
- **الحل:** توحيد ومطابقة الإصدار.

### ⚪ DOC-02: ملف `checkout-final_1778642125545.js` في `attached_assets/`

- **الموقع:** `attached_assets/checkout-final_1778642125545.js` (12 KB)
- **الوصف:** ملف JavaScript يبدو أنه كود checkout لتطبيق آخر. لا علاقة له بالمشروع.
- **الحل:** التحقق من الحاجة إليه وإزالته إن كان خارج السياق.

### ⚪ DOC-03: `WIKI_SCHEMA.md` و `wiki/` في `artifacts/adhkar/`

- **الموقع:** `artifacts/adhkar/WIKI_SCHEMA.md` و `artifacts/adhkar/wiki/` (75 items)
- **الوصف:** بيانات ويكي كبيرة داخل حزمة الواجهة بدلاً من `LLM_Wiki`.
- **الحل:** توحيد مسار الويكي أو إبقاءها إذا كانت مطلوبة في build.

---

## 8. تبعيات وإدارة الحزم (Dependencies)

### 🟡 DEP-01: `pdf-parse` و `tesseract.js` في frontend app

- **الموقع:** `artifacts/adhkar/package.json:88-90`
- **الوصف:** `pdf-parse` (يحتاج Node.js) و `tesseract.js` (16 MB+) في تبعيات تطبيق frontend.
- **التأثير:** `pdf-parse` لن يعمل في المتصفح. `tesseract.js` يزيد الـ bundle بشكل كبير.
- **الحل:** نقل معالجة PDF إلى backend أو build script. إذا كان tesseract.js مطلوباً (OCR)، التأكد من lazy-load.

### 🟡 DEP-02: `wouter` في devDependencies بينما يجب أن يكون في dependencies

- **الموقع:** `artifacts/adhkar/package.json:76`
- **الوصف:** `wouter` (الراوتر الأساسي) مدرج كـ `devDependency` لا `dependency`. يعمل لأن Vite يُضمّنه أثناء البناء، لكنه خطأ تصنيفي.
- **الحل:** نقله إلى `dependencies`.

### ⚪ DEP-03: كل radix-ui وshadcn في devDependencies

- **الموقع:** `artifacts/adhkar/package.json:14-40`
- **الوصف:** جميع مكونات `@radix-ui/*` و`framer-motion` وغيرها في `devDependencies`. هذا يعمل مع Vite (يُضمّن كل شيء) لكنه غير تقليدي.
- **التأثير:** لا مشكلة فعلية مع Vite. فقط غير تقليدي.

### ⚪ DEP-04: `date-fns` مثبتة لكن لا تُستخدم ظاهرياً في الكود

- **الموقع:** `artifacts/adhkar/package.json:56`
- **الوصف:** `date-fns@^3.6.0` مثبتة لكن لم أجد أي import لها في الكود المصدري.
- **الحل:** التحقق من الاستخدام وإزالتها إن كانت غير مطلوبة.

---

## 9. خطة العمل المرتّبة حسب الأولوية

| # | الخطورة | المعرّف | الإجراء المطلوب |
|---|---------|---------|-----------------|
| 1 | 🔴 | SEC-01 | إضافة `.env*` إلى `.gitignore` فوراً |
| 2 | 🔴 | SEC-02 | إضافة `helmet` + تقييد CORS + rate-limit في api-server |
| 3 | 🔴 | CQ-01 | حذف `console.log` من `Home.tsx:15` |
| 4 | 🟠 | CQ-02 | إصلاح dependency array في useEffect (Home.tsx) |
| 5 | 🟠 | CQ-04 | إصلاح أو إزالة استدعاء aladhan API العقيم |
| 6 | 🟠 | CQ-05 | ربط عداد الصلوات بالتاريخ |
| 7 | 🟠 | SEC-03 | override picomatch في pnpm-workspace |
| 8 | 🟠 | CFG-01 | توحيد tsconfig الـ LLM_Wiki مع strict |
| 9 | 🟠 | ARCH-01 | بناء schema قاعدة البيانات أو إزالة التبعية |
| 10 | 🟠 | CFG-07 | إضافة eslint dependencies أو حذف eslint.config.js |
| 11 | 🟡 | CQ-12 | إكمال أو إزالة اللغات الـ 16 الناقصة |
| 12 | 🟡 | PERF-01 | تصغير/ضغط أيقونات PWA |
| 13 | 🟡 | CQ-11 | نقل النصوص المشفرة إلى i18n |
| 14 | 🟡 | DEP-01 | نقل pdf-parse إلى backend |
| 15 | 🟡 | CQ-13 | تصحيح `lang` في index.html |

---

## 10. ملاحظات إيجابية

- **TypeScript strict mode** مفعّل في كل الحزم — ممتاز.
- **لا أخطاء TypeScript** — المشروع يُبنى بنجاح 100%.
- **بنية monorepo** مع pnpm workspaces منظمة وواضحة.
- **أمان سلسلة التوريد** ممتاز (minimumReleaseAge: 1440).
- **PWA configuration** شاملة مع Service Worker وcaching strategies.
- **DOMPurify** مستخدم لتنقية HTML — ممارسة أمنية جيدة.
- **halal-guard** حماية محتوى إبداعية ومناسبة للسياق.
- **i18n** شامل بـ 36 لغة مع دعم RTL.
- **أداء البناء**: manual chunks, dedupe, tree-shaking مُعدّة جيداً.

---

*انتهى التقرير.*
