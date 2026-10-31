// DRAWING APOCALYPSE service worker: caches the app shell so it opens offline.
// Bump VERSION whenever any shell file changes so phones pick up the update.
const VERSION = 'v0.1.0';
const CACHE = 'da-shell-' + VERSION;
const SHELL = [
  './', './index.html', './manifest.json', './css/app.css',
  './js/main.js', './js/config.js', './js/content.js', './js/store.js', './js/progression.js',
  './js/audio.js', './js/orb.js', './js/voice.js', './js/guide.js', './js/fx.js', './js/ui.js',
  './js/screens/common.js', './js/screens/home.js', './js/screens/drawing.js', './js/screens/survival.js',
  './js/screens/create.js', './js/screens/vault.js', './js/screens/settings.js', './js/screens/onboarding.js',
  './content/tutorials.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('da-shell-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Same-origin GET: cache first (instant + offline), refresh in the background.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true }) ||
      (req.mode === 'navigate' ? await cache.match('./index.html') : undefined);
    const network = fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => undefined);
    if (cached) { e.waitUntil(network); return cached; }
    const res = await network;
    return res || new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
});
