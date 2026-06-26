// ── Khidkee Service Worker ──────────────────────
// Bump CACHE_NAME whenever you deploy new assets.
const CACHE_NAME = "khidkee-v1";

// Core shell files to pre-cache on install.
// Add any other local assets (CSS, fonts) if they move offline.
const SHELL = [
  "/khidkee/",
  "/khidkee/index.html",
  "/khidkee/manifest.json",
  "/khidkee/icon-192.png",
  "/khidkee/icon-512.png",
];

// ── Install: cache the shell ────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// ── Activate: delete old caches ─────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for Firebase calls,
//           cache-first for everything else ───────
self.addEventListener("fetch", event => {
  const url = event.request.url;

  // Always go live for Firebase / Google APIs
  if (
    url.includes("firebaseio.com") ||
    url.includes("googleapis.com") ||
    url.includes("firebasestorage") ||
    url.includes("identitytoolkit")
  ) {
    return; // let browser handle it normally
  }

  // Cache-first for shell assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful GET responses
        if (
          event.request.method === "GET" &&
          response.status === 200
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
