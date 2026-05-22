// IndexedDB Storage Engine with In-Memory Caching for Offline-First capability

const DB_NAME = "adhkar_db";
const DB_VERSION = 1;

// Memory cache for synchronous reads
const dbCache = {
  settings: {} as Record<string, any>,
  tracker: {} as Record<string, any>,
  bookmarks: {} as Record<string, any>,
  progress: {} as Record<string, any>,
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
      const stores = ["settings", "tracker", "bookmarks", "progress"];
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
    cursorRequest.onsuccess = (e: any) => {
      const cursor = e.target.result;
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
        await setToDB("settings", "app_settings", JSON.parse(settings));
      }

      // Tracker migration
      const tracker = localStorage.getItem("adhkar_worship_tracker");
      if (tracker) {
        const trackerObj = JSON.parse(tracker);
        for (const [date, record] of Object.entries(trackerObj)) {
          await setToDB("tracker", date, record);
        }
      }

      // Bookmarks migration
      const bookmarks = localStorage.getItem("quran_bookmarks");
      if (bookmarks) {
        await setToDB("bookmarks", "quran_bookmarks", JSON.parse(bookmarks));
      }
      const lastRead = localStorage.getItem("last_read_surah");
      if (lastRead) {
        await setToDB("bookmarks", "last_read_surah", parseInt(lastRead));
      }

      // Favorites migration
      const favorites = localStorage.getItem("hub_favorites");
      if (favorites) {
        await setToDB("progress", "hub_favorites", JSON.parse(favorites));
      }

      // Dhikr Progress migration
      const progress = localStorage.getItem("adhkar_progress");
      if (progress) {
        const progressObj = JSON.parse(progress);
        for (const [date, record] of Object.entries(progressObj)) {
          await setToDB("progress", date, record);
        }
      }

      // General Tasbih counts migration
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("tasbih_")) {
          const val = localStorage.getItem(key);
          if (val) {
            await setToDB("progress", key, parseInt(val));
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
  getTrackerData(): Record<string, any> {
    return { ...dbCache.tracker };
  },

  saveTrackerRecord(date: string, record: any): void {
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
  getProgress(): Record<string, any> {
    return { ...dbCache.progress };
  },

  saveProgressRecord(date: string, record: any): void {
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
  }
};
