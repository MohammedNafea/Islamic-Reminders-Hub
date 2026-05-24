import fs from 'fs';
import path from 'path';

const wikiDir = 'd:/Islamic-Reminders-Hub/artifacts/adhkar/wiki';
const sourcesDir = path.join(wikiDir, 'sources');
const conceptsDir = path.join(wikiDir, 'concepts');
const publicDir = 'd:/Islamic-Reminders-Hub/artifacts/adhkar/public/data';

async function generateWikiBundle() {
  const bundle = {
    metadata: {
      lastUpdated: new Date().toISOString(),
      totalSources: 0,
      totalConcepts: 0
    },
    library: [], // For the Hadith/Books section
    adhkar: {},  // For the Adhkar sections
    daily: {
      verse: "فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ",
      inspiration: "الذكر حياة القلوب، فاجعل لسانك رطباً بذكر الله."
    }
  };

  // 1. Process Sources for Library
  const sourceFiles = fs.readdirSync(sourcesDir);
  bundle.metadata.totalSources = sourceFiles.length;
  
  for (const file of sourceFiles) {
    const content = fs.readFileSync(path.join(sourcesDir, file), 'utf8');
    const titleMatch = content.match(/# Source:\s*(.*)/i);
    const authorMatch = content.match(/-\s*\*\*Author\*\*:\s*(.*)/i);
    
    // Extract full text after metadata sections
    const lines = content.split('\n');
    const bodyStartIndex = lines.findIndex(l => l.includes('---')) + 1 || 5;
    const fullText = lines.slice(bodyStartIndex).join('\n').trim();

    bundle.library.push({
      id: file.replace('.md', ''),
      bookTitle: titleMatch ? titleMatch[1].trim() : file.replace('.md', ''),
      author: authorMatch ? authorMatch[1].trim() : 'غير معروف',
      text: fullText || content.substring(0, 500),
      category: 'library',
      source: titleMatch ? titleMatch[1].trim() : file.replace('.md', '')
    });
  }

  // 2. Process Concepts for extra knowledge
  const conceptFiles = fs.readdirSync(conceptsDir);
  bundle.metadata.totalConcepts = conceptFiles.length;

  // 3. Save Bundle
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'wiki-bundle.json'), JSON.stringify(bundle, null, 2));
  
  // Also keep content.json for backward compatibility with HadithRulings page
  fs.writeFileSync(path.join(publicDir, 'content.json'), JSON.stringify(bundle.library, null, 2));

  console.log('Wiki Bundle generated successfully.');
}

generateWikiBundle();
