import { useEffect, useState } from "react";
import type { LibraryContentItem } from "@/types/library";

export function useLibraryContent() {
  const [items, setItems] = useState<LibraryContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    fetch("/data/library_content.json")
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load library content");
        return res.json() as Promise<LibraryContentItem[]>;
      })
      .then((data) => {
        if (alive) setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (alive) setItems([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return { items, loading };
}
