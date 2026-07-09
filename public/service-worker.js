'use strict';

const CACHE_NAME = 'fire-passing-shell-v31';
const DISABLED_LEGACY_SCRIPTS = new Set([
  '/stable-flame-engine.js',
  '/core-special-flame-fix.js',
  '/dual-special-flames.js',
  '/dark-flame-extension.js',
  '/rainbow-extension.js',
  '/pink-meaning-extension.js',
  '/blue-party-flame-extension.js',
  '/pure-spark-nine-tap.js'
]);

const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/clean-ui.css?v=1',
  '/performance-core.js?v=1',
  '/flame-meaning-texts-v2.js?v=1',
  '/blue-party-seven-tap.js?v=1',
  '/dark-trigger-hardening.js?v=1',
  '/pure-spark-ten-tap.js?v=1',
  '/dawn-rising-rhythm.js?v=1',
  '/stable-flame-engine-v2.js?v=1',
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
