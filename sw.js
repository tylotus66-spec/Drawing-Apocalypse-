// DRAWING APOCALYPSE service worker: caches the app shell so it opens offline.
// Bump VERSION whenever any shell file changes so phones pick up the update.
const VERSION = 'v0.2.0-orb1';
const CACHE = 'da-shell-' + VERSION;
const SHELL = [
  './', './index.html', './manifest.json', './css/app.css',
  './js/main.js', './js/config.js', './js/content.js', './js/store.js', './js/progression.js',
  './js/audio.js', './js/orb.js', './js/voice.js', './js/guide.js', './js/fx.js', './js/ui.js',
  './js/screens/common.js', './js/screens/home.js', './js/screens/drawing.js', './js/screens/survival.js',
  './js/screens/create.js', './js/screens/vault.js', './js/screens/settings.js', './js/screens/onboarding.js',
  './content/tutorials.json',
  './js/player.js', './js/gamepad.js',
  './img/logo-orb.webp', './img/logo-title.webp', './img/ruined-skyline.svg',
  // original lesson thumbnails (small SVGs) so the library looks right offline
  './thumbs/anime-action-pose.svg',
  './thumbs/anime-face-front.svg',
  './thumbs/anime-hair-and-light.svg',
  './thumbs/anime-key-visual.svg',
  './thumbs/apocalypse-motorbike.svg',
  './thumbs/armored-truck.svg',
  './thumbs/basic-zombie.svg',
  './thumbs/cartoon-character-sheet.svg',
  './thumbs/cartoon-comic-page.svg',
  './thumbs/cartoon-expressions.svg',
  './thumbs/cartoon-zombie.svg',
  './thumbs/clockwork-dragon-hybrid.svg',
  './thumbs/convoy-scene.svg',
  './thumbs/creature-design-sheet.svg',
  './thumbs/cyber-eye-implant.svg',
  './thumbs/cyber-street-samurai.svg',
  './thumbs/dragon-head-basics.svg',
  './thumbs/fire-wyvern-step5.svg',
  './thumbs/fire-wyvern.svg',
  './thumbs/helicopter-crash.svg',
  './thumbs/inferno-steampunk.svg',
  './thumbs/mutant-brute.svg',
  './thumbs/neon-alley.svg',
  './thumbs/nightmare-rex.svg',
  './thumbs/raptor-side-view.svg',
  './thumbs/realistic-eye.svg',
  './thumbs/realistic-portrait.svg',
  './thumbs/ruined-street-perspective.svg',
  './thumbs/running-horse.svg',
  './thumbs/shadow-dragon.svg',
  './thumbs/shadow-person.svg',
  './thumbs/skinwalker.svg',
  './thumbs/sphere-of-light.svg',
  './thumbs/spinosaurus-river.svg',
  './thumbs/steampunk-airship.svg',
  './thumbs/steampunk-gear-heart.svg',
  './thumbs/triceratops.svg',
  './thumbs/wendigo.svg',
  './thumbs/wolf-head.svg',
  './thumbs/wolf-man-cyber-joints.svg',
  './thumbs/zombie-dragon.svg',
  './fonts/Rajdhani-Medium.woff2', './fonts/Rajdhani-SemiBold.woff2', './fonts/Rajdhani-Bold.woff2',
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
  // Lesson videos use HTTP range requests; let the browser stream them directly.
  if (url.pathname.includes('/videos/')) return;
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
