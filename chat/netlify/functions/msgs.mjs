// Guarda e entrega as mensagens de uma conversa e avisa os celulares inscritos.
// A conversa é identificada pelo código (hash) da senha, calculado no navegador:
// o servidor nunca vê a senha, e sem ela não há como achar a conversa.
//
// Cada mudança na conversa (mensagem nova, reação, mensagem apagada) ganha um
// número de revisão; o app pede só o que mudou desde a última revisão que viu.
import { getStore } from "@netlify/blobs";
import webpush from "web-push";

const MAX_MSGS = 500;
const MAX_INSCRICOES = 20;
const MAX_FIXADAS = 3;
const MAX_FOTO = 2.5 * 1024 * 1024;
const MAX_AUDIO = 4 * 1024 * 1024;
const TIPOS = /^(image\/(jpeg|webp|png)|audio\/(webm|mp4|ogg|mpeg|aac|x-m4a))$/;
const MAX_PERFIL = 80 * 1024;
const EMOJIS = ["❤️", "😂", "😮", "😢", "🙏", "👍"];
const DIGITANDO_MS = 7000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const limpaNome = (n) => (typeof n === "string" ? n.trim().slice(0, 30) : "");

// Atualiza um JSON no Blobs sem perder escritas feitas ao mesmo tempo.
async function alterar(store, key, fn) {
  for (let i = 0; i < 8; i++) {
    const atual = await store.getWithMetadata(key, { type: "json" });
    const { valor, resultado } = fn(atual ? atual.data : null);
    if (valor === undefined) return resultado;
    const r = atual
      ? await store.setJSON(key, valor, { onlyIfMatch: atual.etag })
      : await store.setJSON(key, valor, { onlyIfNew: true });
    if (r.modified) return resultado;
    await espera(40 + Math.random() * 160);
  }
  throw new Error("ocupado");
}

// A primeira versão guardava só a lista de mensagens; agora é { rev, msgs }.
const abrirSala = (d) => (Array.isArray(d) ? { rev: 0, msgs: d } : d || { rev: 0, msgs: [] });

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
  const texto = resumo(msg);
  const payload = JSON.stringify({ titulo: msg.nome, texto: texto.slice(0, 180), sala: sala.slice(0, 16) });
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

function resumo(m) {
  if (m.apagada) return "Mensagem apagada";
  if (m.fig) return "Figurinha";
  if (m.audio) return "🎤 Mensagem de voz";
  if (m.foto) return "📷 " + (m.texto || "Foto");
  return m.texto;
}
const ehId = (x) => typeof x === "string" && /^[0-9a-f-]{36}$/.test(x);

export default async (req) => {
  const url = new URL(req.url);
  const rota = url.pathname.replace(/^\/api\//, "");
  const store = getStore({ name: "cantinho", consistency: "strong" });
  const fotos = getStore({ name: "cantinho-fotos", consistency: "strong" });

  if (rota === "vapid") {
    const k = await chavesVapid(store);
    return json({ publicKey: k.publicKey });
  }

  const sala = url.searchParams.get("sala") || "";
  if (!/^[0-9a-f]{64}$/.test(sala)) return json({ erro: "sala inválida" }, 400);
  const key = "sala-" + sala, keyFix = "fix-" + sala, keyPres = "pres-" + sala, keyPerfis = "perfis-" + sala;

  // Fotos e áudios: guardados à parte; o endereço só funciona com o código da conversa.
  if (rota === "foto" || rota === "midia") {
    if (req.method === "GET") {
      const id = url.searchParams.get("id") || "";
      if (!ehId(id)) return json({ erro: "arquivo inválido" }, 400);
      const r = await fotos.getWithMetadata(sala + "/" + id, { type: "arrayBuffer" });
      if (!r || !r.data) return json({ erro: "arquivo não encontrado" }, 404);
      const tipo = (r.metadata && r.metadata.tipo) || "image/jpeg";
      return new Response(r.data, {
        headers: { "content-type": tipo, "content-length": String(r.data.byteLength), "cache-control": "private, max-age=31536000, immutable" },
      });
    }
    if (req.method === "POST") {
      const tipo = (req.headers.get("content-type") || "").split(";")[0].trim();
      if (!TIPOS.test(tipo)) return json({ erro: "tipo de arquivo não aceito" }, 400);
      const dados = await req.arrayBuffer();
      const max = tipo.startsWith("audio/") ? MAX_AUDIO : MAX_FOTO;
      if (!dados.byteLength || dados.byteLength > max) return json({ erro: "arquivo grande demais" }, 413);
      const id = crypto.randomUUID();
      await fotos.set(sala + "/" + id, dados, { metadata: { tipo } });
      return json({ id });
    }
    return json({ erro: "método não permitido" }, 405);
  }

  if (rota === "push") {
    let body;
    try { body = await req.json(); } catch { return json({ erro: "corpo inválido" }, 400); }
    const sub = body && body.sub;
    if (!sub || typeof sub.endpoint !== "string" || !/^https:\/\//.test(sub.endpoint) || !sub.keys)
      return json({ erro: "inscrição inválida" }, 400);
    const nome = limpaNome(body.nome);
    await alterar(store, "subs-" + sala, (lista) => {
      const outras = (lista || []).filter((s) => s.sub.endpoint !== sub.endpoint);
      if (req.method === "DELETE") return { valor: outras };
      const limpa = { endpoint: sub.endpoint, keys: { p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth) } };
      return { valor: [...outras, { nome, sub: limpa }].slice(-MAX_INSCRICOES) };
    });
    return json({ ok: true });
  }

  if (req.method === "GET" && rota === "msgs") {
    const s = abrirSala(await store.get(key, { type: "json" }));
    if (url.searchParams.get("ultima")) return json({ msgs: s.msgs.slice(-1) });
    const desde = Number(url.searchParams.get("desde"));
    const eu = limpaNome(url.searchParams.get("eu") || "");
    const pv = Number(url.searchParams.get("pv")) || 0;
    const [fixadas, pres, perfis] = await Promise.all([
      store.get(keyFix, { type: "json" }),
      store.get(keyPres, { type: "json" }),
      store.get(keyPerfis, { type: "json" }),
    ]);
    const dig = pres && pres.dig;
    const agora = Date.now();
    const resp = {
      rev: s.rev,
      msgs: Number.isFinite(desde) && desde >= 0 ? s.msgs.filter((m) => (m.rev || 0) > desde) : s.msgs,
      fixadas: fixadas || [],
      digitando: Object.entries(dig || {}).filter(([n, t]) => n !== eu && agora - t < DIGITANDO_MS).map(([n]) => n),
      lidos: (pres && pres.lidos) || {},
    };
    if (perfis && perfis.v !== pv) resp.perfis = perfis;
    return json(resp);
  }

  let body;
  try { body = await req.json(); } catch { return json({ erro: "corpo inválido" }, 400); }
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);
  const nome = limpaNome(body.nome);

  // Presença: quem está digitando e até onde cada pessoa já leu ("visto").
  if (rota === "digitando" || rota === "lido") {
    if (!nome) return json({ erro: "faltou nome" }, 400);
    await alterar(store, keyPres, (p) => {
      p = p || {};
      const agora = Date.now(), dig = {};
      for (const [n, t] of Object.entries(p.dig || {})) if (agora - t < DIGITANDO_MS) dig[n] = t;
      const lidos = { ...(p.lidos || {}) };
      if (rota === "digitando") { if (body.parou) delete dig[nome]; else dig[nome] = agora; }
      else {
        const em = Number(body.em) || 0;
        if (em <= (lidos[nome] || 0)) return {};
        lidos[nome] = Math.min(em, agora + 60000);
      }
      return { valor: { dig, lidos } };
    }).catch(() => {});
    return json({ ok: true });
  }

  if (rota === "perfil") {
    if (!nome) return json({ erro: "faltou nome" }, 400);
    const foto = body.foto;
    if (foto !== null && (typeof foto !== "string" || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(foto) || foto.length > MAX_PERFIL))
      return json({ erro: "foto inválida" }, 400);
    const perfis = await alterar(store, keyPerfis, (p) => {
      p = p || { v: 0, fotos: {} };
      const fotosP = { ...p.fotos };
      if (foto) fotosP[nome] = foto; else delete fotosP[nome];
      const novo = { v: (p.v || 0) + 1, fotos: fotosP };
      return { valor: novo, resultado: novo };
    });
    return json({ perfis });
  }

  if (rota === "fixar") {
    const id = typeof body.id === "string" ? body.id : "";
    const s = abrirSala(await store.get(key, { type: "json" }));
    const m = s.msgs.find((x) => x.id === id);
    if (body.fixar && (!m || m.apagada)) return json({ erro: "mensagem não encontrada" }, 404);
    const fixadas = await alterar(store, keyFix, (lista) => {
      const outras = (lista || []).filter((f) => f.id !== id);
      const nova = body.fixar ? [{ id: m.id, nome: m.nome, texto: resumo(m).slice(0, 200), em: m.em }, ...outras].slice(0, MAX_FIXADAS) : outras;
      return { valor: nova, resultado: nova };
    });
    return json({ fixadas });
  }

  // Reagir (uma reação por pessoa; tocar de novo no mesmo emoji tira) e apagar mudam uma mensagem.
  if (rota === "reagir" || rota === "apagar") {
    const id = typeof body.id === "string" ? body.id : "";
    if (!nome || !id) return json({ erro: "faltou nome ou mensagem" }, 400);
    if (rota === "reagir" && !EMOJIS.includes(body.emoji)) return json({ erro: "emoji inválido" }, 400);
    let fotoApagada = null;
    try {
      const r = await alterar(store, key, (d) => {
        const s = abrirSala(d);
        const i = s.msgs.findIndex((m) => m.id === id);
        if (i < 0) return { resultado: { erro: "mensagem não encontrada", status: 404 } };
        const m = { ...s.msgs[i] };
        if (m.apagada) return { resultado: { erro: "mensagem apagada", status: 409 } };
        if (rota === "apagar") {
          if (m.nome !== nome) return { resultado: { erro: "só dá para apagar as suas mensagens", status: 403 } };
          fotoApagada = m.foto || m.audio || null;
          for (const k of ["texto", "foto", "w", "h", "resp", "reacoes", "audio", "dur", "fig"]) delete m[k];
          m.apagada = true; m.texto = "";
        } else {
          const reacoes = {};
          let tinha = null;
          for (const [e, ns] of Object.entries(m.reacoes || {})) {
            if (ns.includes(nome)) tinha = e;
            const resto = ns.filter((n) => n !== nome);
            if (resto.length) reacoes[e] = resto;
          }
          if (tinha !== body.emoji) reacoes[body.emoji] = [...(reacoes[body.emoji] || []), nome];
          m.reacoes = reacoes;
        }
        m.rev = s.rev + 1;
        const msgs = [...s.msgs]; msgs[i] = m;
        return { valor: { rev: m.rev, msgs }, resultado: { msg: m } };
      });
      if (r.erro) return json({ erro: r.erro }, r.status);
      if (rota === "apagar") {
        if (fotoApagada) await fotos.delete(sala + "/" + fotoApagada).catch(() => {});
        await alterar(store, keyFix, (l) => (l && l.some((f) => f.id === id) ? { valor: l.filter((f) => f.id !== id) } : {})).catch(() => {});
      }
      return json(r);
    } catch {
      return json({ erro: "ocupado, tente de novo" }, 503);
    }
  }

  if (rota === "msgs") {
    const texto = typeof body.texto === "string" ? body.texto.trim().slice(0, 2000) : "";
    const foto = ehId(body.foto) ? body.foto : null;
    const audio = ehId(body.audio) ? body.audio : null;
    const fig = typeof body.fig === "string" && /^[a-z0-9-]{1,24}$/.test(body.fig) ? body.fig : null;
    if ((!texto && !foto && !audio && !fig) || !nome) return json({ erro: "faltou texto ou nome" }, 400);
    try {
      const { msg, removidas } = await alterar(store, key, (d) => {
        const s = abrirSala(d);
        const ultimo = s.msgs.length ? s.msgs[s.msgs.length - 1].em : 0;
        const msg = { id: crypto.randomUUID(), nome, texto, em: Math.max(Date.now(), ultimo + 1), rev: s.rev + 1 };
        if (foto) { msg.foto = foto; msg.w = Math.min(4096, Math.max(1, body.w | 0)); msg.h = Math.min(4096, Math.max(1, body.h | 0)); }
        if (audio) { msg.audio = audio; msg.dur = Math.min(600, Math.max(0, Number(body.dur) || 0)); msg.tipo = String(body.tipo || "").slice(0, 40); }
        if (fig) { msg.fig = fig; msg.texto = ""; }
        const orig = typeof body.respId === "string" && s.msgs.find((m) => m.id === body.respId && !m.apagada);
        if (orig) msg.resp = { id: orig.id, nome: orig.nome, texto: resumo(orig).slice(0, 140) };
        const todas = [...s.msgs, msg];
        const removidas = todas.slice(0, Math.max(0, todas.length - MAX_MSGS));
        return { valor: { rev: msg.rev, msgs: todas.slice(-MAX_MSGS) }, resultado: { msg, removidas } };
      });
      for (const m of removidas) for (const f of [m.foto, m.audio]) if (f) await fotos.delete(sala + "/" + f).catch(() => {});
      await alterar(store, keyPres, (p) => (p && p.dig && p.dig[nome] ? { valor: { ...p, dig: { ...p.dig, [nome]: 0 } } } : {})).catch(() => {});
      await avisar(store, sala, msg, body.endpoint).catch((e) => console.error("push", e));
      return json({ msg });
    } catch {
      return json({ erro: "ocupado, tente de novo" }, 503);
    }
  }

  return json({ erro: "não encontrado" }, 404);
};

export const config = {
  path: ["/api/msgs", "/api/push", "/api/vapid", "/api/fixar", "/api/reagir", "/api/apagar", "/api/digitando", "/api/lido", "/api/perfil", "/api/foto", "/api/midia"],
};
