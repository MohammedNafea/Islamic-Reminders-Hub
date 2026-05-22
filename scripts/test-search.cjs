global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../artifacts/adhkar/.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cohcnmqarjvoradzlsov.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvaGNubXFhcmp2b3JhZHpsc292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxODgzNTAsImV4cCI6Mj50NjQzNTB9.5YvQ4iAPQjq8ReqefwhkqWYy4LNegaH7hLjKKAQu4oo';
const CF_ACCOUNT_ID = process.env.VITE_CLOUDFLARE_ACCOUNT_ID || '904150a4e5a4ec9686bdba22644371ed';
const CF_AI_TOKEN = process.env.VITE_CLOUDFLARE_AI_TOKEN || 'cfut_a30IRZ1ovKTPTrvE8ZGj6dpm8UzQC4oe14qEyNkBa4b42378';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    const result = await response.json();
    if (result.success && result.result?.data?.[0]) {
      return result.result.data[0];
    }
    throw new Error('Failed to generate embedding');
  } catch (err) {
    console.error('Embedding error:', err.message);
    return null;
  }
}

async function search(queryText) {
  console.log(`\nالبحث عن: "${queryText}"`);
  const embedding = await getEmbedding(queryText);
  if (!embedding) return;

  const { data, error } = await supabase.rpc('match_library_items', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 3
  });

  if (error) {
    console.error('خطأ في البحث:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('لم يتم العثور على نتائج دلالية.');
    return;
  }

  data.forEach((item, index) => {
    console.log(`${index + 1}. [المطابقة: ${(item.similarity * 100).toFixed(1)}%] [الكتاب: ${item.book_title || item.title}] [المصدر: ${item.source}]`);
    console.log(`   النص: "${item.text.slice(0, 150)}..."`);
  });
}

async function start() {
  console.log('=== بدء اختبار محرك البحث الدلالي (Semantic Search) ===');
  await search('حكم الغناء والموسيقى في الإسلام');
  await search('أحكام الاختلاط والحجاب');
  await search('كيفية الوضوء صفة وضوء النبي');
  console.log('\n=== انتهى الاختبار بنجاح ===');
}

start();
