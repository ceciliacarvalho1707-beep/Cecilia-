// Service worker do Nosso Cantinho: abre o app sem internet e mostra as notificações.
const CACHE = "cantinho-v11";
const BASE = ["/", "/supabase.js", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== "cantinho-badge").map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const c = r.clone(); caches.open(CACHE).then((k) => k.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("/"))),
  );
});

// Soma 1 no número do ícone do app a cada notificação (o app corrige ao abrir)
async function somarBadge() {
  try {
    const k = await caches.open("cantinho-badge");
    const r = await k.match("/badge");
    const n = (r ? Number(await r.text()) || 0 : 0) + 1;
    await k.put("/badge", new Response(String(n)));
    if (self.navigator.setAppBadge) await self.navigator.setAppBadge(n);
  } catch (_) {}
}
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data.json(); } catch { d = { titulo: "Nosso Cantinho", texto: "Mensagem nova" }; }
  e.waitUntil(Promise.all([somarBadge(),
    self.registration.showNotification(d.titulo || "Nosso Cantinho", {
      body: d.texto || "Mensagem nova",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "cantinho-" + (d.sala || ""),
      renotify: true,
      data: { sala: d.sala || "" },
    })]),
  );
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const sala = (e.notification.data && e.notification.data.sala) || "";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      for (const c of cs) if ("focus" in c) { if (sala) c.postMessage({ abrir: sala }); return c.focus(); }
      return self.clients.openWindow(sala ? "/?c=" + sala : "/");
    }),
  );
});
