import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const cfAccountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID || '';
const cfAiToken = import.meta.env.VITE_CLOUDFLARE_AI_TOKEN || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Cloud sync disabled.');
}

if (supabaseUrl && !/^https?:\/\/.+/.test(supabaseUrl)) {
  console.warn('[Supabase] VITE_SUPABASE_URL does not look like a valid URL:', supabaseUrl);
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Syncs local favorites with Supabase if the user is logged in.
 */
export async function syncFavoritesWithCloud(favorites: { id: string; type: string; [key: string]: unknown }[]) {
  if (!supabase) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Simple upsert logic
  const { error } = await supabase
    .from('user_favorites')
    .upsert(
      favorites.map(f => ({
        user_id: user.id,
        item_id: f.id,
        type: f.type,
        metadata: f
      })),
      { onConflict: 'user_id, item_id' }
    );

  if (error) console.error('Sync Error:', error);
}

/**
 * Generates an embedding vector (1024 dimensions) using Cloudflare Workers AI with BGE-M3 model.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!cfAccountId || !cfAiToken) {
    console.warn('[Cloudflare AI] VITE_CLOUDFLARE_ACCOUNT_ID or VITE_CLOUDFLARE_AI_TOKEN is missing.');
    return null;
  }
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/baai/bge-m3`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfAiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      }
    );
    if (!response.ok) {
      throw new Error(`Cloudflare AI API returned status ${response.status}`);
    }
    const result = await response.json();
    if (result.success && result.result?.data?.[0]) {
      return result.result.data[0];
    }
    throw new Error(result.errors?.[0]?.message || 'Unknown Cloudflare AI error');
  } catch (err) {
    console.error('[Cloudflare AI] Failed to generate embedding:', err);
    return null;
  }
}

export interface LibraryItemMatch {
  id: string;
  category: string;
  title: string;
  book_title?: string;
  text: string;
  source?: string;
  tags: string[];
  benefits: string[];
  similarity: number;
}

/**
 * Performs semantic similarity search on Supabase using vector distance.
 */
export async function matchLibraryItems(
  embedding: number[],
  threshold = 0.35,
  limit = 20,
  category = 'all'
): Promise<LibraryItemMatch[]> {
  if (!supabase) {
    console.warn('[Supabase] Client not initialized. Cannot perform similarity match.');
    return [];
  }
  try {
    const { data, error } = await supabase.rpc('match_library_items', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      filter_category: category,
    });

    if (error) {
      throw error;
    }
    return data || [];
  } catch (err) {
    console.error('[Supabase] matchLibraryItems failed:', err);
    return [];
  }
}

