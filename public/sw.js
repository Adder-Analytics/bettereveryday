/*
 * Service worker — the offline half of making Better Every Day an installable,
 * local-first app (see app/manifest.ts). The whole site already sends nothing to
 * a server; this lets it *run* with no server too, so a decision you reach for on
 * a plane or with no signal still opens.
 *
 * The design is deliberately conservative, because a service worker is the one
 * web feature that can persist a mistake past a single visit. The rule that
 * makes it safe: when the network is available, this behaves exactly like no
 * service worker at all.
 *
 *   - Navigations (HTML pages) → network-first. An online visitor ALWAYS gets
 *     the fresh page from the network; the cache is only ever a fallback for when
 *     the network fails. So a bad or stale HTML response can never be pinned on
 *     someone who is online — the failure mode is "offline", which without a
 *     service worker is a hard error anyway, and here becomes a cached page or a
 *     graceful offline notice instead.
 *   - Immutable build assets (/_next/static/…, content-hashed by Next, and the
 *     self-hosted fonts under it) → cache-first. Their URL changes whenever their
 *     content changes, so serving them from cache can never be stale, and it is
 *     what lets an already-visited page render offline.
 *   - Everything else (cross-origin, non-GET, API-like) → untouched; the browser
 *     handles it normally.
 *
 * Caches are versioned; bump CACHE_VERSION to retire the old ones on activate.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `bed-static-${CACHE_VERSION}`;
const PAGE_CACHE = `bed-pages-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";
// Seed the two front doors so a fresh install works offline right away, not only
// for pages the person happened to open while online.
const PRECACHE_PAGES = [OFFLINE_URL, "/", "/tools"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(PAGE_CACHE);
        // Best-effort: a precache miss (one route 404s, or install runs offline)
        // must never fail the install and leave the page uncontrolled.
        await Promise.allSettled(PRECACHE_PAGES.map((url) => cache.add(url)));
      } catch {
        /* storage unavailable — the worker still installs and works online */
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("bed-") && !k.endsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Cache-first, for immutable content-hashed assets only.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    try {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    } catch {
      /* ignore cache write failures */
    }
  }
  return response;
}

// Network-first, for page navigations. Falls back to the cached page, then to
// the offline notice, then to a last-resort inline message — never throws.
async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      try {
        cache.put(request, response.clone());
      } catch {
        /* ignore cache write failures */
      }
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response(
      "<!doctype html><meta charset=utf-8><title>Offline</title><p style=\"font-family:system-ui;padding:2rem;max-width:32rem;margin:auto\">You're offline, and this page isn't saved on your device yet. Reconnect, or open a page you've visited before.</p>",
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 }
    );
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  // Leave cross-origin requests (analytics, fonts on other origins, etc.) alone.
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }
  // Everything else falls through to the browser's default handling.
});
