# إعداد Tailwind CSS

تم إعداد إطار عمل Tailwind CSS في المشروع بشكل كامل:

1. **ملف `tailwind.config.js`**: تم إنشاء الملف وتخصيص الألوان (`primary`, `secondary`)، الخطوط (`sans`)، ومسارات المحتوى لتشمل مجلدات `src` و `pages` و `components` و `artifacts`.
2. **ملف `postcss.config.js`**: تم تهيئة `tailwindcss` و `autoprefixer`.
3. **ملف الإدخال `src/input.css`**: تم إضافة التوجيهات `@tailwind base`, `@tailwind components`, `@tailwind utilities`.
4. **سكربت البناء**: تمت إضافة أمر `build:css` في `package.json` لتسهيل بناء ومراقبة التغييرات.
