import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
