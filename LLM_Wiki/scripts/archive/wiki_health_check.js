import fs from 'fs';
import path from 'path';

const wikiDir = 'd:/Islamic-Reminders-Hub/artifacts/adhkar/wiki';

function healthCheck() {
  const sources = fs.readdirSync(path.join(wikiDir, 'sources'));
  const entities = fs.readdirSync(path.join(wikiDir, 'entities'));
  const concepts = fs.readdirSync(path.join(wikiDir, 'concepts'));
  const indexContent = fs.readFileSync(path.join(wikiDir, 'index.md'), 'utf8');

  const allFiles = [...sources.map(f => `sources/${f}`), ...entities.map(f => `entities/${f}`), ...concepts.map(f => `concepts/${f}`)];
  const orphans = [];
  const brokenLinks = [];

  // Check for orphans (not linked in index)
  for (const file of allFiles) {
    const id = file.replace('.md', '');
    if (!indexContent.includes(id)) {
      orphans.push(file);
    }
  }

  // Check for cross-links integrity
  const allWikiText = allFiles.map(f => fs.readFileSync(path.join(wikiDir, f), 'utf8')).join('\n');
  const wikiLinks = allWikiText.match(/\[\[(.*?)\]\]/g) || [];
  
  for (const link of wikiLinks) {
    const target = link.replace('[[', '').replace(']]', '').split('|')[0];
    // Check if target exists
    const exists = allFiles.some(f => f.startsWith(target) || f.endsWith(`${target}.md`));
    if (!exists && target !== 'index' && target !== 'log') {
      brokenLinks.push(target);
    }
  }

  console.log('--- Wiki Health Report ---');
  console.log(`Total Pages: ${allFiles.length}`);
  console.log(`Orphans found: ${orphans.length}`);
  orphans.forEach(o => console.log(`  - ${o}`));
  console.log(`Broken links found: ${brokenLinks.length}`);
  Array.from(new Set(brokenLinks)).forEach(b => console.log(`  - ${b}`));
  console.log('--------------------------');
}

healthCheck();
