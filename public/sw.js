// ForearmForge service worker: precache the app shell, serve it offline.
//
// Strategy:
// - Page loads: network first, falling back to the cached shell when the network fails or
//   takes longer than NAV_TIMEOUT (gym lie-fi). Each successful load refreshes the shell.
// - <base>/assets/* (content-hashed): cache first.
// - Other same-origin files (manifest, icons): network first, cache as offline fallback.
// The build writes precache.json: every file under assets/ (bundles, fonts, photos). The
// shell is refreshed atomically: all listed assets are cached first (only the ones not
// already cached; they're content-hashed), and only then is the new index.html stored and
// stale assets pruned. If any step fails, the previous shell stays intact.
// The app may live at the site root or under a subpath (GitHub Pages: /<repo>/);
// the worker's own scope tells us which.
const BASE = new URL(self.registration.scope).pathname;
const ASSETS = `${BASE}assets/`;
const CACHE = 'ff-shell-v3';
const SHELL = ['manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'].map((f) => BASE + f);
const NAV_TIMEOUT = 3000;

const assetsIn = (html) =>
  [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]).filter((p) => p.startsWith(ASSETS));

async function precacheList() {
  const response = await fetch(`${BASE}precache.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`precache.json: HTTP ${response.status}`);
  return (await response.json()).map((f) => BASE + f);
}

async function cacheShell(cache, response) {
  const html = await response.clone().text();
  const keep = new Set([...(await precacheList()), ...assetsIn(html)]);
  const missing = [];
  for (const path of keep) if (!(await cache.match(path, { ignoreVary: true }))) missing.push(path);
  await cache.addAll(missing);
  await cache.put(BASE, response);
  for (const req of await cache.keys()) {
    const path = new URL(req.url).pathname;
    if (path.startsWith(ASSETS) && !keep.has(path)) await cache.delete(req);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(SHELL);
      const response = await fetch(BASE, { cache: 'no-store' });
      if (!response.ok) throw new Error(`app shell: HTTP ${response.status}`);
      await cacheShell(cache, response);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

// Hashed assets never change, so a cached copy fits any request for that URL. ignoreVary:
// servers may send `Vary: Origin`, and crossorigin module/font requests carry an Origin
// header that the precache requests didn't, which would otherwise miss the cache offline.
async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreVary: true });
    if (cached) return cached;
    throw new Error('offline and not cached');
  }
}

function navigate(event) {
  const network = fetch(event.request);
  // Clone before the page starts reading the body; this handler is attached first.
  event.waitUntil(
    network
      .then((response) => {
        if (!response.ok) return;
        const copy = response.clone();
        return caches.open(CACHE).then((cache) => cacheShell(cache, copy));
      })
      .catch(() => {}),
  );
  return (async () => {
    let timer;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(resolve, NAV_TIMEOUT);
    });
    try {
      const response = await Promise.race([network, timeout]);
      if (response) return response;
      // Slow network: serve the cached shell; with no shell yet, keep waiting.
      return (await caches.match(BASE)) ?? (await network);
    } catch {
      return (await caches.match(BASE)) ?? Response.error();
    } finally {
      clearTimeout(timer);
    }
  })();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(navigate(event));
  } else if (url.origin === self.location.origin) {
    event.respondWith(url.pathname.startsWith(ASSETS) ? cacheFirst(request) : networkFirst(request));
  }
});
