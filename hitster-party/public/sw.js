/* Service worker do HITSTER PARTY: deixa o app abrir e funcionar sem internet.
 * - Páginas: tenta a rede primeiro (pega atualizações) e usa a cópia salva se estiver offline.
 * - Arquivos do app (JS, CSS, ícones): usa a cópia salva e atualiza em segundo plano.
 * - Nada de outros sites é guardado (Spotify, fontes etc. continuam direto na rede). */
const CACHE = 'hitster-party-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const cached = await c.match(req);
      const network = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => cached);
      return cached || network;
    }),
  );
});
