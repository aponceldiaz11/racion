/* Ración — service worker: abre sin red, actualiza cuando hay red. */
const CACHE = 'racion-v9';
const SHELL = [
  './', './index.html', './styles.css', './data.js', './ai.js', './app.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API externas (OpenRouter, Open Food Facts): red directa, sin tocar
  if (url.origin !== location.origin) return;
  // Mismo origen: red primero (así una versión nueva entra al instante), caché si no hay red
  e.respondWith(
    fetch(e.request).then(r => {
      if (r && r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
      return r;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});
