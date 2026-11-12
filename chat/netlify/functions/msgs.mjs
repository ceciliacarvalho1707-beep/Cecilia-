// Guarda e entrega as mensagens de uma conversa.
// A conversa é identificada pelo código (SHA-256) da senha, calculado no navegador:
// o servidor nunca vê a senha, e sem ela não há como achar a conversa.
import { getStore } from "@netlify/blobs";

const MAX_MSGS = 500;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  const url = new URL(req.url);
  const sala = url.searchParams.get("sala") || "";
  if (!/^[0-9a-f]{64}$/.test(sala)) return json({ erro: "sala inválida" }, 400);

  const store = getStore({ name: "cantinho", consistency: "strong" });
  const key = "sala-" + sala;

  if (req.method === "GET") {
    const depois = Number(url.searchParams.get("depois")) || 0;
    const msgs = (await store.get(key, { type: "json" })) || [];
    return json({ msgs: msgs.filter((m) => m.em > depois) });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ erro: "corpo inválido" }, 400); }
    const texto = typeof body.texto === "string" ? body.texto.trim().slice(0, 2000) : "";
    const nome = typeof body.nome === "string" ? body.nome.trim().slice(0, 30) : "";
    if (!texto || !nome) return json({ erro: "faltou texto ou nome" }, 400);

    // Grava só se ninguém escreveu ao mesmo tempo; se escreveu, tenta de novo.
    for (let i = 0; i < 6; i++) {
      const atual = await store.getWithMetadata(key, { type: "json" });
      const msgs = atual ? atual.data : [];
      const ultimo = msgs.length ? msgs[msgs.length - 1].em : 0;
      const msg = { id: crypto.randomUUID(), nome, texto, em: Math.max(Date.now(), ultimo + 1) };
      const novas = [...msgs, msg].slice(-MAX_MSGS);
      const r = atual
        ? await store.setJSON(key, novas, { onlyIfMatch: atual.etag })
        : await store.setJSON(key, novas, { onlyIfNew: true });
      if (r.modified) return json({ msg });
      await new Promise((ok) => setTimeout(ok, 50 + Math.random() * 150));
    }
    return json({ erro: "ocupado, tente de novo" }, 503);
  }

  return json({ erro: "método não permitido" }, 405);
};

export const config = { path: "/api/msgs" };
