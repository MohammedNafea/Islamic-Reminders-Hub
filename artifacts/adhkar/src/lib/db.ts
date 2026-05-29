// IndexedDB Storage Engine with In-Memory Caching for Offline-First capability

const DB_NAME = "adhkar_db";
const DB_VERSION = 2;

// Memory cache for synchronous reads
const dbCache = {
  settings: {} as Record<string, unknown>,
  tracker: {} as Record<string, unknown>,
  bookmarks: {} as Record<string, unknown>,
  progress: {} as Record<string, unknown>,
};

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      const stores = ["settings", "tracker", "bookmarks", "progress", "tafsirs", "translations"];
      stores.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store);
        }
      });
    };
  });
}


async function setToDB<T>(storeName: string, key: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(value, key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getAllFromStore<T>(storeName: string): Promise<Record<string, T>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const result: Record<string, T> = {};
    
    // Use cursor or getAll/getAllKeys if supported
    const cursorRequest = store.openCursor();
    cursorRequest.onerror = () => reject(cursorRequest.error);
    cursorRequest.onsuccess = (e) => {
      const target = e.target as IDBRequest<IDBCursorWithValue | null>;
      const cursor = target.result;
      if (cursor) {
        result[cursor.key as string] = cursor.value;
        cursor.continue();
      } else {
        resolve(result);
      }
    };
  });
}

// Database initialization and localStorage migration
export async function initDatabase(): Promise<void> {
  try {
    await openDB();

    // 1. Perform Migration if not migrated yet
    const migrationDone = localStorage.getItem("adhkar_db_migrated");
    if (!migrationDone) {
      console.log("Migrating localStorage to IndexedDB...");

      // Settings migration
      const settings = localStorage.getItem("adhkar_settings");
      if (settings) {
        try {
          await setToDB("settings", "app_settings", JSON.parse(settings));
        } catch (e) {
          console.warn("Failed to migrate settings:", e);
        }
      }

      // Tracker migration
      const tracker = localStorage.getItem("adhkar_worship_tracker");
      if (tracker) {
        try {
          const trackerObj = JSON.parse(tracker);
          for (const [date, record] of Object.entries(trackerObj)) {
            await setToDB("tracker", date, record);
          }
        } catch (e) {
          console.warn("Failed to migrate tracker:", e);
        }
      }

      // Bookmarks migration
      const bookmarks = localStorage.getItem("quran_bookmarks");
      if (bookmarks) {
        try {
          await setToDB("bookmarks", "quran_bookmarks", JSON.parse(bookmarks));
        } catch (e) {
          console.warn("Failed to migrate bookmarks:", e);
        }
      }
      const lastRead = localStorage.getItem("last_read_surah");
      if (lastRead) {
        try {
          await setToDB("bookmarks", "last_read_surah", parseInt(lastRead, 10));
        } catch (e) {
          console.warn("Failed to migrate lastRead:", e);
        }
      }

      // Favorites migration
      const favorites = localStorage.getItem("hub_favorites");
      if (favorites) {
        try {
          await setToDB("progress", "hub_favorites", JSON.parse(favorites));
        } catch (e) {
          console.warn("Failed to migrate favorites:", e);
        }
      }

      // Dhikr Progress migration
      const progress = localStorage.getItem("adhkar_progress");
      if (progress) {
        try {
          const progressObj = JSON.parse(progress);
          for (const [date, record] of Object.entries(progressObj)) {
            await setToDB("progress", date, record);
          }
        } catch (e) {
          console.warn("Failed to migrate progress:", e);
        }
      }

      // General Tasbih counts migration
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("tasbih_")) {
          const val = localStorage.getItem(key);
          if (val) {
            try {
              await setToDB("progress", key, parseInt(val, 10));
            } catch (e) {
              console.warn(`Failed to migrate ${key}:`, e);
            }
          }
        }
      }

      localStorage.setItem("adhkar_db_migrated", "true");
    }

    // 2. Load into memory cache for instantaneous sync reads
    dbCache.settings = await getAllFromStore("settings");
    dbCache.tracker = await getAllFromStore("tracker");
    dbCache.bookmarks = await getAllFromStore("bookmarks");
    dbCache.progress = await getAllFromStore("progress");

    console.log("IndexedDB initialized and cached successfully.");
  } catch (error) {
    console.error("Failed to initialize IndexedDB, falling back to in-memory Cache:", error);
  }
}

// Synchronous Sync read / Async write API
export const localDB = {
  // SETTINGS
  getSettings<T>(defaultValue: T): T {
    return (dbCache.settings["app_settings"] as T) || defaultValue;
  },
  
  saveSettings<T>(settings: T): void {
    dbCache.settings["app_settings"] = settings;
    setToDB("settings", "app_settings", settings).catch(err => 
      console.error("IndexedDB Save Settings Error:", err)
    );
  },

  // TRACKER
  getTrackerData(): Record<string, unknown> {
    return { ...dbCache.tracker };
  },

  saveTrackerRecord(date: string, record: unknown): void {
    dbCache.tracker[date] = record;
    setToDB("tracker", date, record).catch(err =>
      console.error("IndexedDB Save Tracker Error:", err)
    );
  },

  // BOOKMARKS
  getBookmarks<T>(defaultValue: T): T {
    return (dbCache.bookmarks["quran_bookmarks"] as T) || defaultValue;
  },

  saveBookmarks<T>(bookmarks: T): void {
    dbCache.bookmarks["quran_bookmarks"] = bookmarks;
    setToDB("bookmarks", "quran_bookmarks", bookmarks).catch(err =>
      console.error("IndexedDB Save Bookmarks Error:", err)
    );
  },

  getLastRead(defaultValue: number | null): number | null {
    const val = dbCache.bookmarks["last_read_surah"];
    return val !== undefined ? (val as number) : defaultValue;
  },

  saveLastRead(surahNumber: number): void {
    dbCache.bookmarks["last_read_surah"] = surahNumber;
    setToDB("bookmarks", "last_read_surah", surahNumber).catch(err =>
      console.error("IndexedDB Save Last Read Error:", err)
    );
  },

  // PROGRESS & TASBIH
  getProgress(): Record<string, unknown> {
    return { ...dbCache.progress };
  },

  saveProgressRecord(date: string, record: unknown): void {
    dbCache.progress[date] = record;
    setToDB("progress", date, record).catch(err =>
      console.error("IndexedDB Save Progress Error:", err)
    );
  },

  getGeneralProgress<T>(key: string, defaultValue: T): T {
    const val = dbCache.progress[key];
    return val !== undefined ? (val as T) : defaultValue;
  },

  saveGeneralProgress<T>(key: string, value: T): void {
    dbCache.progress[key] = value;
    setToDB("progress", key, value).catch(err =>
      console.error("IndexedDB Save General Progress Error:", key, err)
    );
  },

  // TAFSIR & TRANSLATION CACHING
  async getCachedTafsir(tafsirId: number, surah: number, ayah: number): Promise<string | null> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction("tafsirs", "readonly");
        const store = transaction.objectStore("tafsirs");
        const request = store.get(`${tafsirId}:${surah}:${ayah}`);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },
  
  async saveCachedTafsir(tafsirId: number, surah: number, ayah: number, text: string): Promise<void> {
    try {
      await setToDB("tafsirs", `${tafsirId}:${surah}:${ayah}`, text);
    } catch (err) {
      console.error("Failed to cache tafsir:", err);
    }
  },

  async getCachedTranslation(editionId: string, surah: number, ayah: number): Promise<string | null> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction("translations", "readonly");
        const store = transaction.objectStore("translations");
        const request = store.get(`${editionId}:${surah}:${ayah}`);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  async saveCachedTranslation(editionId: string, surah: number, ayah: number, text: string): Promise<void> {
    try {
      await setToDB("translations", `${editionId}:${surah}:${ayah}`, text);
    } catch (err) {
      console.error("Failed to cache translation:", err);
    }
  }
};
