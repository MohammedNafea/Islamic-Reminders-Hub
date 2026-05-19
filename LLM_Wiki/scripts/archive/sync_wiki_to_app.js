import fs from 'fs';
import path from 'path';

const wikiDir = 'd:/Islamic-Reminders-Hub/artifacts/adhkar/wiki';
const sourcesDir = path.join(wikiDir, 'sources');
const conceptsDir = path.join(wikiDir, 'concepts');
const publicDir = 'd:/Islamic-Reminders-Hub/artifacts/adhkar/public/data';

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function syncToApp() {
  const sources = fs.readdirSync(sourcesDir);
  const libraryData = [];

  for (const file of sources) {
    const content = fs.readFileSync(path.join(sourcesDir, file), 'utf8');
    const titleMatch = content.match(/# Source: (.*)/);
    const authorMatch = content.match(/- \*\*Author\*\*: (.*)/);
    const summaryMatch = content.match(/- \*\*Summary\*\*: (.*)/);
    const takeawaysMatch = content.match(/## Key Takeaways\n([\s\S]*?)\n/);

    const title = titleMatch ? titleMatch[1] : 'بدون عنوان';
    const author = authorMatch ? authorMatch[1] : 'غير معروف';
    const summary = summaryMatch ? summaryMatch[1] : (takeawaysMatch ? takeawaysMatch[1].trim() : 'نصوص علمية مستخرجة.');

    libraryData.push({
      id: `wiki-${file.replace('.md', '')}`,
      bookTitle: title, // App expects bookTitle
      text: `${summary}\n\n(المؤلف: ${author})`,
      category: "library",
      source: title // Fallback for some versions of the UI
    });
  }

  fs.writeFileSync(path.join(publicDir, 'content.json'), JSON.stringify(libraryData, null, 2));
  console.log(`Synced ${libraryData.length} items to public/data/content.json`);
}

syncToApp();
