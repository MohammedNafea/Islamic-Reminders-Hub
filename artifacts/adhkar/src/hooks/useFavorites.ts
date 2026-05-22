import { useState, useEffect } from 'react';
import { syncFavoritesWithCloud } from '@/lib/supabase';
import { localDB } from '@/lib/db';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const stored = localDB.getGeneralProgress<string[]>('hub_favorites', []);
    setFavorites(stored);
  }, []);

  const toggleFavorite = (id: string, type: string = 'adhkar') => {
    setFavorites((prev) => {
      const next = prev.includes(id) 
        ? prev.filter((item) => item !== id) 
        : [...prev, id];
      
      localDB.saveGeneralProgress('hub_favorites', next);
      
      // Attempt to sync with cloud (background)
      syncFavoritesWithCloud(next.map(fid => ({ id: fid, type })));
      
      return next;
    });
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return { favorites, toggleFavorite, isFavorite };
}
