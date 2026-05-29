const fs = require('fs');
const path = require('path');

// Supported language codes from index.ts (96 languages)
const languages = [
  "bg", "ca", "hr", "et", "is", "lv", "lt", "mk", "sk", "sl", "hy", "ka", "mn", "ne", "si", "km", "lo", "my", "gu", "sr",
  "ar", "fa", "ur", "en", "fr", "de", "es", "tr", "id", "ms", "ru", "zh", "bn", "pt", "sw", "it", "nl", "pl", "sv", "ko",
  "hi", "bs", "ckb", "ja", "te", "mr", "ta", "vi", "ha", "am", "so", "sq", "az", "ps", "kk", "uz", "pt-BR", "uk", "th",
  "el", "he", "no", "da", "fi", "cs", "hu", "ro", "fil", "ml", "kn", "af", "be", "cy", "eo", "eu", "gl", "ht", "ig", "jv",
  "ku", "lb", "mg", "mi", "mt", "ny", "pa", "sd", "sm", "sn", "st", "su", "tk", "tl", "tt", "ug", "xh", "yi", "yo", "zu"
];

const mainRoutes = [
  "",
  "quran",
  "prayer-times",
  "adhkar",
  "tasbih",
  "qibla",
  "zakat",
  "settings"
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

// Add main routes for all languages
for (const route of mainRoutes) {
  for (const lang of languages) {
    const suffix = route ? `/${route}` : '';
    const loc = `https://adhkar.thedarkgalaxy.com${suffix}?lng=${lang}`;
    xml += `  <url>\n    <loc>${loc}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${route === "" ? "1.0" : "0.8"}</priority>\n  </url>\n`;
  }
}

// Add Quran Surah pages for all languages
for (let surah = 1; surah <= 114; surah++) {
  for (const lang of languages) {
    const loc = `https://adhkar.thedarkgalaxy.com/quran?surah=${surah}&amp;lng=${lang}`;
    xml += `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  }
}

xml += `</urlset>\n`;

const targetPath = path.join(__dirname, '../artifacts/adhkar/public/sitemap.xml');
fs.writeFileSync(targetPath, xml, 'utf8');
console.log(`Successfully generated sitemap.xml with ${mainRoutes.length * languages.length + 114 * languages.length} URLs!`);
