import { useState, useEffect } from 'react';
import { syncFavoritesWithCloud } from '@/lib/supabase';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('hub_favorites');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
  }, []);

  const toggleFavorite = (id: string, type: string = 'adhkar') => {
    setFavorites((prev) => {
      const next = prev.includes(id) 
        ? prev.filter((item) => item !== id) 
        : [...prev, id];
      
      localStorage.setItem('hub_favorites', JSON.stringify(next));
      
      // Attempt to sync with cloud (background)
      syncFavoritesWithCloud(next.map(fid => ({ id: fid, type })));
      
      return next;
    });
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return { favorites, toggleFavorite, isFavorite };
}
