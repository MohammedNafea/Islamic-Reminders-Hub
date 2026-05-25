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

// Cache Google Fonts (stylesheets and font files)
registerRoute(
  /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
  new CacheFirst({
    cacheName: "google-fonts-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
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
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache Prayer Times API using NetworkFirst (always try online first to get accurate date adjustments)
registerRoute(
  /^https:\/\/api\.aladhan\.com\/v1\/.*/i,
  new NetworkFirst({
    cacheName: "prayer-times-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// Cache Quran and Adhkar audio files for offline listening
registerRoute(
  /.*(?:everyayah\.com|raw\.githubusercontent\.com\/rn0x\/Adhkar-json|mp3quran\.net).*\.(?:mp3|wav)/i,
  new CacheFirst({
    cacheName: "audio-cache",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
      }),
    ],
  })
);

// Handle notification click to open or focus the app window
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Find and focus an already open window client
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // If no open client exists, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});
