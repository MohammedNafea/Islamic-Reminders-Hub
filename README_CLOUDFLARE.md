# دليل إعداد ونشر الموقع على Cloudflare Pages

اتبع الخطوات التالية لربط مستودع GitHub الخاص بك بـ **Cloudflare Pages** ونشره على نطاقك الخاص `thedarkgalaxy.com`:

---

## 1. ربط مستودع GitHub بـ Cloudflare Pages
1. افتح لوحة تحكم **Cloudflare**.
2. اذهب إلى قسم **Compute (Workers & Pages)** من القائمة الجانبية.
3. اضغط على **Create application** ثم اختر علامة التبويب **Pages**.
4. اضغط على **Connect to Git** وقم بتسجيل الدخول بحساب GitHub الخاص بك.
5. اختر المستودع الخاص: `Islamic-Reminders-Hub`.

---

## 2. إعدادات البناء (Build Settings)
في صفحة إعداد المشروع داخل Cloudflare، قم بتعيين الخيارات التالية بدقة:

* **Framework Preset**: اختر `Vite` (أو اتركه فارغاً/مخصصاً).
* **Build command**: 
  ```bash
  pnpm install && pnpm --filter @workspace/adhkar run build
  ```
* **Build output directory**:
  ```text
  artifacts/adhkar/dist/public
  ```
* **Root directory**: 
  ```text
  /
  ```

---

## 3. المتغيرات البيئية (Environment Variables)
في قسم **Variables and Secrets** داخل إعدادات المشروع في Cloudflare Pages، أضف المتغيرات التالية لربط الموقع بـ Supabase:

| اسم المتغير | القيمة |
| :--- | :--- |
| `VITE_SUPABASE_URL` | `https://siimuzrjiobhxftntppr.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (انسخه من ملف المفاتيح) |

---

## 4. ربط الدومين الخاص (`thedarkgalaxy.com`)
1. بعد اكتمال البناء الأول بنجاح، اذهب إلى علامة التبويب **Custom domains** داخل مشروع Pages الخاص بك.
2. اضغط على **Set up a custom domain**.
3. أضف نطاقك: `thedarkgalaxy.com` (أو نطاقاً فرعياً مثل `adhkar.thedarkgalaxy.com`).
4. سيقوم Cloudflare بتهيئة ملفات الـ DNS وتأمين الموقع بشهادة SSL تلقائياً وبسرعة فائقة!
