'use strict';

const CACHE_NAME = 'fire-passing-shell-v43';
const DISABLED_LEGACY_SCRIPTS = new Set([
  '/stable-flame-engine.js',
  '/stable-flame-engine-v2.js',
  '/core-special-flame-fix.js',
  '/dual-special-flames.js',
  '/dark-flame-extension.js',
  '/rainbow-extension.js',
  '/pink-meaning-extension.js',
  '/blue-party-flame-extension.js',
  '/blue-party-seven-tap.js',
  '/dark-trigger-hardening.js',
  '/pure-spark-nine-tap.js',
  '/pure-spark-ten-tap.js',
  '/dawn-rising-rhythm.js',
  '/flame-tap-priority-router.js',
  '/flame-effect-lifecycle.js',
  '/flame-rarity-engine.js',
  '/flame-rarity-engine-v2.js',
  '/flame-ui-safety.js'
]);

const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/clean-ui.css?v=1',
  '/performance-core.js?v=1',
  '/flame-meaning-texts-v2.js?v=1',
  '/ignition-touch-guard.js?v=1',
  '/flame-count-priority.js?v=2',
  '/flame-rarity-engine-v3.js?v=2',
  '/pure-spark-signature-effect.js?v=1',
  '/thunder-strike-animation.js?v=1',
  '/dawn-sunrise-animation.js?v=1',
  '/airdrop-transfer.js?v=1',
  '/app.js',
  '/persistent-flame.js?v=1',
  '/manifest.webmanifest',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (DISABLED_LEGACY_SCRIPTS.has(requestUrl.pathname)) {
    event.respondWith(new Response("'use strict';", {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    }));
    return;
  }

  if (requestUrl.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
  );
});
