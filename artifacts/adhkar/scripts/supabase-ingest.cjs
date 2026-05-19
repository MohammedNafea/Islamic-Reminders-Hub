const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://cohcnmqarjvoradzlsov.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvaGNubXFhcmp2b3JhZHpsc292Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE4ODM1MCwiZXhwIjoyMDk0NzY0MzUwfQ.n-RRLjrf_vJ-CUBbR3-tJb4IXFwaoxNhtxRgx3ZP3fc';

const CF_ACCOUNT_ID = '904150a4e5a4ec9686bdba22644371ed';
const CF_TOKEN = 'cfut_a30IRZ1ovKTPTrvE8ZGj6dpm8UzQC4oe14qEyNkBa4b42378';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getEmbedding(text) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/baai/bge-m3`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudflare API error: ${response.statusText}. ${errText}`);
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(`Cloudflare AI failed: ${JSON.stringify(json.errors)}`);
  }

  // BGE-M3 outputs a 1024-dimensional embedding vector in result.data[0]
  if (json.result && json.result.data && json.result.data[0]) {
    return json.result.data[0];
  } else if (json.result && Array.isArray(json.result.data)) {
    return json.result.data;
  }
  
  throw new Error(`Unexpected embedding format: ${JSON.stringify(json.result)}`);
}

async function run() {
  const libraryPath = path.resolve(__dirname, '../public/data/library_content.json');
  console.log(`Loading library items from: ${libraryPath}`);
  
  if (!fs.existsSync(libraryPath)) {
    throw new Error(`Library content file not found at ${libraryPath}`);
  }
  
  const items = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
  console.log(`Loaded ${items.length} items to ingest.`);

  // Process items in batches of 5 to avoid API rate limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(items.length / BATCH_SIZE)} (items ${i + 1} to ${i + batch.length})...`);

    const promises = batch.map(async (item) => {
      try {
        console.log(`  Generating embedding for item [${item.id}]: ${item.title}`);
        // Truncate text if it's too long (BGE-M3 limit is 512 tokens, roughly 2000-3000 characters)
        const embedText = item.text.substring(0, 3000);
        const embedding = await getEmbedding(embedText);

        console.log(`  Uploading item [${item.id}] to Supabase...`);
        const { error } = await supabase
          .from('library_items')
          .upsert({
            id: item.id,
            category: item.category,
            title: item.title,
            book_title: item.bookTitle || null,
            text: item.text,
            source: item.source || null,
            tags: item.tags || [],
            benefits: item.benefits || [],
            embedding: embedding
          });

        if (error) {
          throw new Error(`Supabase upload failed for ${item.id}: ${error.message}`);
        }
        console.log(`  Successfully ingested item [${item.id}]`);
      } catch (err) {
        console.error(`  Error processing item [${item.id}]:`, err.message);
      }
    });

    await Promise.all(promises);
    
    // Slight delay between batches to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('Ingestion pipeline completed successfully!');
}

run().catch(err => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
