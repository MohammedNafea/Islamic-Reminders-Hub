/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// Cleanup outdated caches from older versions
cleanupOutdatedCaches();

// Force service worker to skip waiting and activate immediately
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Precache all compiled assets (HTML, JS, CSS, PNG, MP3)
precacheAndRoute(self.__WB_MANIFEST || []);

// ─── Cache Strategies ────────────────────────────────────────────────────────

// Cache Google Fonts (stylesheets and font files)
registerRoute(
  /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
  new CacheFirst({
    cacheName: "google-fonts-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60,
      }),
    ],
  })
);

// Cache Quran API responses for offline-first reading
registerRoute(
  /^https:\/\/(?:api\.alquran\.cloud\/v1|api\.quran\.com\/api\/v4)\/.*/i,
  new CacheFirst({
    cacheName: "quran-api-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// Prayer Times API: NetworkFirst for accuracy
registerRoute(
  /^https:\/\/api\.aladhan\.com\/v1\/.*/i,
  new NetworkFirst({
    cacheName: "prayer-times-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// Cache Quran and Adhkar audio files
registerRoute(
  /.*(?:everyayah\.com|raw\.githubusercontent\.com\/rn0x\/Adhkar-json|mp3quran\.net).*\.(?:mp3|wav)/i,
  new CacheFirst({
    cacheName: "audio-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 60 * 24 * 60 * 60,
      }),
    ],
  })
);

// ─── Push Notifications (Android PWA Background Support) ─────────────────────

/**
 * Handle incoming push events (from Push API / background notifications).
 * On Android, this fires even when the app is closed.
 */
self.addEventListener("push", (event) => {
  let data: { title?: string; body?: string; icon?: string; badge?: string; tag?: string } = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: "مركز الأذكار", body: event.data?.text() ?? "" };
  }

  const title = data.title ?? "مركز الأذكار";
  const options: NotificationOptions = {
    body: data.body ?? "",
    icon: data.icon ?? "/icon-192.png",
    badge: data.badge ?? "/favicon.png",
    dir: "rtl",
    lang: "ar",
    tag: data.tag,
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification Click Handler ───────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window if none found
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});

// ─── Message Handler (for scheduling from app) ───────────────────────────────

/**
 * Listen for messages from the app to trigger notifications directly from SW.
 * This allows the app to schedule background-compatible notifications on Android.
 */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data;
    self.registration.showNotification(title ?? "مركز الأذكار", {
      icon: "/icon-192.png",
      badge: "/favicon.png",
      dir: "rtl",
      lang: "ar",
      ...options,
    });
  }
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
