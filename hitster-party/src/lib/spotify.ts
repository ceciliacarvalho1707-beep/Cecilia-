/** Utilitários para links do Spotify. Nenhuma chave/segredo é necessária. */

const TRACK_RE = /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}(?:-[a-z]{2})?\/)?track\/([A-Za-z0-9]{22})(?:[/?#].*)?$/;
const URI_RE = /^spotify:track:([A-Za-z0-9]{22})$/;

/** Extrai o ID (22 caracteres base62) de uma URL/URI de FAIXA. Retorna null para buscas, playlists etc. */
export function extractTrackId(input: string): string | null {
  const v = input.trim();
  return v.match(TRACK_RE)?.[1] ?? v.match(URI_RE)?.[1] ?? null;
}

/** Normaliza para a forma canônica https://open.spotify.com/track/<id> (remove ?si= e /intl-xx/). */
export function canonicalTrackUrl(input: string): string | null {
  const id = extractTrackId(input);
  return id ? `https://open.spotify.com/track/${id}` : null;
}

export function appUri(url: string): string | null {
  const id = extractTrackId(url);
  return id ? `spotify:track:${id}` : null;
}

export interface OnlineCheck {
  ok: boolean;
  /** Título informado pelo Spotify (SOMENTE para o painel do organizador). */
  titulo?: string;
  detalhe?: string;
}

/**
 * Verificação on-line via oEmbed público do Spotify (não exige credenciais).
 * Executa no navegador do organizador. Pode falhar se a rede/navegador bloquear a requisição;
 * nesse caso o resultado informa o erro em vez de afirmar que o link é inválido.
 */
export async function checkOnline(url: string, signal?: AbortSignal): Promise<OnlineCheck> {
  const canonical = canonicalTrackUrl(url);
  if (!canonical) return { ok: false, detalhe: 'Formato inválido: não é um link de faixa (track).' };
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(canonical)}`, { signal });
    if (res.status === 404 || res.status === 400) return { ok: false, detalhe: `Faixa não encontrada (HTTP ${res.status}).` };
    if (!res.ok) return { ok: false, detalhe: `Spotify respondeu HTTP ${res.status}.` };
    const data = (await res.json()) as { title?: string };
    return { ok: true, titulo: data.title };
  } catch (e) {
    return { ok: false, detalhe: `Não foi possível consultar o Spotify (${(e as Error).message}). Verifique a conexão.` };
  }
}
