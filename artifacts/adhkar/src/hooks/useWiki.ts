import { useState, useEffect } from 'react';

export interface WikiItem {
  id: string;
  bookTitle: string;
  author: string;
  text: string;
  category: string;
  source?: string;
}

export interface WikiBundle {
  metadata: {
    lastUpdated: string;
    totalSources: number;
    totalConcepts: number;
  };
  library: WikiItem[];
  adhkar: Record<string, unknown>;
  daily: {
    verse: string;
    inspiration: string;
    sura?: string;
    verse_number?: string;
    verse_en?: string;
  };
}

export function useWiki() {
  const [data, setData] = useState<WikiBundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/wiki-bundle.json')
      .then(res => res.json())
      .then(bundle => {
        setData(bundle);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { data, loading };
}
