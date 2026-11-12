// Guarda e entrega as mensagens de uma conversa e avisa os celulares inscritos.
// A conversa é identificada pelo código (hash) da senha, calculado no navegador:
// o servidor nunca vê a senha, e sem ela não há como achar a conversa.
import { getStore } from "@netlify/blobs";
import webpush from "web-push";

const MAX_MSGS = 500;
const MAX_INSCRICOES = 20;
const MAX_FIXADAS = 3;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));

// Atualiza um JSON no Blobs sem perder escritas feitas ao mesmo tempo.
async function alterar(store, key, fn) {
  for (let i = 0; i < 6; i++) {
    const atual = await store.getWithMetadata(key, { type: "json" });
    const { valor, resultado } = fn(atual ? atual.data : null);
    if (valor === undefined) return resultado;
    const r = atual
      ? await store.setJSON(key, valor, { onlyIfMatch: atual.etag })
      : await store.setJSON(key, valor, { onlyIfNew: true });
    if (r.modified) return resultado;
    await espera(50 + Math.random() * 150);
  }
  throw new Error("ocupado");
}

// As chaves de notificação são criadas sozinhas no primeiro uso e ficam guardadas no Blobs.
async function chavesVapid(store) {
  let k = await store.get("config-vapid", { type: "json" });
  if (k) return k;
  await store.setJSON("config-vapid", webpush.generateVAPIDKeys(), { onlyIfNew: true });
  return store.get("config-vapid", { type: "json" });
}

async function avisar(store, sala, msg, endpointQuemMandou) {
  const subs = (await store.get("subs-" + sala, { type: "json" })) || [];
  const alvos = subs.filter((s) => s.sub.endpoint !== endpointQuemMandou && s.nome !== msg.nome);
  if (!alvos.length) return;
  const k = await chavesVapid(store);
  webpush.setVapidDetails("https://netlify.app", k.publicKey, k.privateKey);
  const payload = JSON.stringify({ titulo: msg.nome, texto: msg.texto.slice(0, 180), sala: sala.slice(0, 16) });
  const mortos = [];
  await Promise.allSettled(
    alvos.map((s) =>
      webpush.sendNotification(s.sub, payload, { TTL: 60 * 60 * 24, urgency: "high", timeout: 5000 }).catch((e) => {
        if (e.statusCode === 404 || e.statusCode === 410) mortos.push(s.sub.endpoint);
      }),
    ),
  );
  if (mortos.length) {
    await alterar(store, "subs-" + sala, (lista) => ({
      valor: (lista || []).filter((s) => !mortos.includes(s.sub.endpoint)),
    })).catch(() => {});
  }
}

export default async (req) => {
  const url = new URL(req.url);
  const store = getStore({ name: "cantinho", consistency: "strong" });

  if (url.pathname === "/api/vapid") {
    const k = await chavesVapid(store);
    return json({ publicKey: k.publicKey });
  }

  const sala = url.searchParams.get("sala") || "";
  if (!/^[0-9a-f]{64}$/.test(sala)) return json({ erro: "sala inválida" }, 400);

  if (url.pathname === "/api/push") {
    let body;
    try { body = await req.json(); } catch { return json({ erro: "corpo inválido" }, 400); }
    const sub = body && body.sub;
    if (!sub || typeof sub.endpoint !== "string" || !/^https:\/\//.test(sub.endpoint) || !sub.keys)
      return json({ erro: "inscrição inválida" }, 400);
    const nome = typeof body.nome === "string" ? body.nome.trim().slice(0, 30) : "";
    await alterar(store, "subs-" + sala, (lista) => {
      const outras = (lista || []).filter((s) => s.sub.endpoint !== sub.endpoint);
      if (req.method === "DELETE") return { valor: outras };
      const limpa = { endpoint: sub.endpoint, keys: { p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth) } };
      return { valor: [...outras, { nome, sub: limpa }].slice(-MAX_INSCRICOES) };
    });
    return json({ ok: true });
  }

  const key = "sala-" + sala;
  const keyFix = "fix-" + sala;

  if (url.pathname === "/api/fixar") {
    if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);
    let body;
    try { body = await req.json(); } catch { return json({ erro: "corpo inválido" }, 400); }
    const id = typeof body.id === "string" ? body.id : "";
    const msgs = (await store.get(key, { type: "json" })) || [];
    const m = msgs.find((x) => x.id === id);
    if (body.fixar && !m) return json({ erro: "mensagem não encontrada" }, 404);
    const fixadas = await alterar(store, keyFix, (lista) => {
      const outras = (lista || []).filter((f) => f.id !== id);
      const nova = body.fixar ? [{ id: m.id, nome: m.nome, texto: m.texto.slice(0, 200), em: m.em }, ...outras].slice(0, MAX_FIXADAS) : outras;
      return { valor: nova, resultado: nova };
    });
    return json({ fixadas });
  }

  if (req.method === "GET") {
    const msgs = (await store.get(key, { type: "json" })) || [];
    if (url.searchParams.get("ultima")) return json({ msgs: msgs.slice(-1) });
    const depois = Number(url.searchParams.get("depois")) || 0;
    const fixadas = (await store.get(keyFix, { type: "json" })) || [];
    return json({ msgs: msgs.filter((m) => m.em > depois), fixadas });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ erro: "corpo inválido" }, 400); }
    const texto = typeof body.texto === "string" ? body.texto.trim().slice(0, 2000) : "";
    const nome = typeof body.nome === "string" ? body.nome.trim().slice(0, 30) : "";
    if (!texto || !nome) return json({ erro: "faltou texto ou nome" }, 400);
    try {
      const msg = await alterar(store, key, (msgs) => {
        msgs = msgs || [];
        const ultimo = msgs.length ? msgs[msgs.length - 1].em : 0;
        const msg = { id: crypto.randomUUID(), nome, texto, em: Math.max(Date.now(), ultimo + 1) };
        const orig = typeof body.respId === "string" && msgs.find((m) => m.id === body.respId);
        if (orig) msg.resp = { id: orig.id, nome: orig.nome, texto: orig.texto.slice(0, 140) };
        return { valor: [...msgs, msg].slice(-MAX_MSGS), resultado: msg };
      });
      await avisar(store, sala, msg, body.endpoint).catch((e) => console.error("push", e));
      return json({ msg });
    } catch {
      return json({ erro: "ocupado, tente de novo" }, 503);
    }
  }

  return json({ erro: "método não permitido" }, 405);
};

export const config = { path: ["/api/msgs", "/api/push", "/api/vapid", "/api/fixar"] };
