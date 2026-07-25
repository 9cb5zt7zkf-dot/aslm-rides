// Minimal service worker: exists mainly so Chrome/Android treat the app as
// installable (the automatic install prompt requires an active fetch
// handler), and as a bonus it gives the last-seen page a chance to load
// when the network is unavailable. It deliberately does NOT pre-cache or
// aggressively serve stale content — rides, driver locations, and auth
// state must always come from the network when it's available, so every
// request is network-first with a cache fallback only for GETs.
const CACHE_NAME = "aslm-rides-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
