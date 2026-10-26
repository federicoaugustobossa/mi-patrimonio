// Service worker: permite abrir la app sin conexión.
// Estrategia: primero la red (siempre la versión más nueva), y si no hay señal, la copia guardada.
// Las llamadas a /api y a Supabase nunca se guardan en caché.
const CACHE = 'mi-patrimonio-v1';
const SHELL = ['/', '/index.html', '/styles.css', '/app.js?v=1', '/manifest.webmanifest',
  '/icons/apple-touch-icon.png', '/icons/icon-192.png', '/icons/icon-512.png'];
const CDN = ['cdn.jsdelivr.net', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mismo = url.origin === self.location.origin;
  if (mismo && url.pathname.startsWith('/api/')) return;
  if (!mismo && !CDN.includes(url.hostname)) return; // Supabase y otros: directo a la red

  // Librerías y fuentes de CDN (versión fija): primero la caché
  if (!mismo) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  // Archivos de la app: primero la red, si falla la copia guardada
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('/index.html') : Response.error()))));
});
