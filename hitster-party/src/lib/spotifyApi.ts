/**
 * Integração direta com a API Web do Spotify (login do organizador com PKCE).
 *
 * - Não usa "client secret": o fluxo Authorization Code + PKCE foi feito para apps no navegador.
 *   O Client ID é público (fica no navegador do organizador), não é uma senha.
 * - Regras do Spotify em vigor desde fev./mar. de 2026 (modo de desenvolvimento):
 *   a conta dona do app precisa ser Premium, no máximo 5 usuários autorizados,
 *   tocar em aparelhos exige Premium, `popularity` saiu das faixas e as playlists usam `/items`.
 * - Redirect URI: o Spotify não aceita "localhost"; use http://127.0.0.1:<porta>/ (loopback)
 *   ou um endereço HTTPS onde o jogo estiver hospedado.
 *
 * Tudo aqui é chamado só no aparelho do organizador. Nada é enviado à TV ou às equipes.
 */
import type { Dificuldade, Origem, Song } from '../types';

const AUTH_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API = 'https://api.spotify.com/v1';
const STORE = 'hitster-party:spotify';
export const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ');

export interface SpotifyAuth {
  clientId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  verifier?: string;
  state?: string;
  redirectUri?: string;
}

type Fetch = typeof fetch;
let fetchImpl: Fetch = (...a) => fetch(...a);
/** Permite testar com respostas simuladas. */
export function setFetch(f: Fetch) { fetchImpl = f; }

/* ───────────────────────── Armazenamento ───────────────────────── */

export function loadAuth(): SpotifyAuth {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) ?? '{}') as Partial<SpotifyAuth>;
    return { ...v, clientId: v.clientId ?? '' };
  } catch { return { clientId: '' }; }
}
function saveAuth(a: SpotifyAuth) { try { localStorage.setItem(STORE, JSON.stringify(a)); } catch { /* sem armazenamento */ } notify(); }
export function setClientId(clientId: string) { saveAuth({ ...loadAuth(), clientId: clientId.trim() }); }
export function disconnect() { const { clientId } = loadAuth(); saveAuth({ clientId }); }
export function isConnected(a = loadAuth()) { return !!a.refreshToken || (!!a.accessToken && (a.expiresAt ?? 0) > Date.now()); }

const listeners = new Set<() => void>();
function notify() { listeners.forEach((l) => l()); }
export function onAuthChange(l: () => void) { listeners.add(l); return () => listeners.delete(l); }

/** Endereço de retorno sugerido para cadastrar no painel do Spotify. */
export function defaultRedirectUri(): string {
  const { protocol, hostname, port, pathname } = window.location;
  const host = hostname === 'localhost' ? '127.0.0.1' : hostname;
  return `${protocol}//${host}${port ? `:${port}` : ''}${pathname}`;
}

/** true quando o jogo roda dentro do claude.ai, onde a página não pode chamar a API do Spotify. */
export function insideClaudeArtifact(): boolean {
  return !!(window as unknown as { claude?: { use?: unknown } }).claude?.use;
}

/* ───────────────────────── PKCE ───────────────────────── */

function randomString(len = 64): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Monta o endereço de login e guarda o verificador PKCE. */
export async function buildLoginUrl(redirectUri = defaultRedirectUri()): Promise<string> {
  const a = loadAuth();
  if (!a.clientId) throw new Error('Informe o Client ID do seu app do Spotify.');
  const verifier = randomString();
  const state = randomString(16);
  saveAuth({ ...a, verifier, state, redirectUri });
  const params = new URLSearchParams({
    client_id: a.clientId, response_type: 'code', redirect_uri: redirectUri, scope: SCOPES,
    code_challenge_method: 'S256', code_challenge: await codeChallenge(verifier), state,
  });
  return `${AUTH_URL}?${params}`;
}

/** Ao voltar do Spotify (?code=...), troca o código por tokens. Retorna true se tratou um retorno. */
export async function handleRedirect(): Promise<{ ok: boolean; erro?: string } | null> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const err = url.searchParams.get('error');
  if (!code && !err) return null;
  const clean = () => { url.searchParams.delete('code'); url.searchParams.delete('state'); url.searchParams.delete('error'); window.history.replaceState(null, '', url.toString()); };
  const a = loadAuth();
  if (err) { clean(); return { ok: false, erro: err === 'access_denied' ? 'Você não autorizou o acesso ao Spotify.' : `Spotify recusou: ${err}` }; }
  if (!a.verifier || url.searchParams.get('state') !== a.state) { clean(); return { ok: false, erro: 'Login expirado. Tente conectar de novo.' }; }
  try {
    const res = await fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: a.clientId, grant_type: 'authorization_code', code: code!, redirect_uri: a.redirectUri ?? defaultRedirectUri(), code_verifier: a.verifier }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.error || `HTTP ${res.status}`);
    saveAuth({ clientId: a.clientId, accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 });
    clean();
    return { ok: true };
  } catch (e) {
    clean();
    return { ok: false, erro: `Não foi possível concluir o login: ${(e as Error).message}` };
  }
}

async function token(): Promise<string> {
  const a = loadAuth();
  if (a.accessToken && (a.expiresAt ?? 0) > Date.now()) return a.accessToken;
  if (!a.refreshToken) throw new SpotifyError('Conecte sua conta do Spotify primeiro.', 401);
  const res = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: a.clientId, grant_type: 'refresh_token', refresh_token: a.refreshToken }),
  });
  const data = await res.json();
  if (!res.ok) { disconnect(); throw new SpotifyError('A conexão com o Spotify expirou. Conecte de novo.', 401); }
  saveAuth({ ...a, accessToken: data.access_token, refreshToken: data.refresh_token ?? a.refreshToken, expiresAt: Date.now() + (data.expires_in - 60) * 1000 });
  return data.access_token;
}

export class SpotifyError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetchImpl(path.startsWith('http') ? path : `${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await token()}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers ?? {}) },
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const msg = data?.error?.message ?? `HTTP ${res.status}`;
    const human =
      res.status === 401 ? 'A conexão com o Spotify expirou. Conecte de novo.'
      : res.status === 403 ? `O Spotify negou o acesso (${msg}). No modo de desenvolvimento, a conta dona do app precisa ser Premium e a sua conta precisa estar autorizada no painel do app.`
      : res.status === 404 ? 'Não encontrado no Spotify (pode ser uma playlist privada de outra pessoa ou um aparelho desligado).'
      : res.status === 429 ? 'Muitas consultas seguidas ao Spotify. Espere alguns segundos.'
      : `Erro do Spotify: ${msg}`;
    throw new SpotifyError(human, res.status);
  }
  return data as T;
}

/* ───────────────────────── Conversão faixa → música do jogo ───────────────────────── */

interface SpArtist { id: string; name: string }
export interface SpTrack {
  id: string; name: string; type?: string; is_local?: boolean;
  artists: SpArtist[];
  album: { name: string; release_date?: string; album_type?: string; images?: { url: string }[]; external_urls?: { spotify?: string } };
  external_urls?: { spotify?: string };
}

/** Tira sufixos que entregam a versão: "- Remastered 2011", "(Live)", "- 2004 Digital Remaster"... */
export function cleanTitle(name: string): string {
  return name
    .replace(/\s+-\s+(?:\d{4}\s+)?(?:remaster(?:ed)?|remasterizad[oa]|live|ao vivo|single version|radio edit|mono|stereo|versão remasterizada|digital remaster)\b.*$/i, '')
    .replace(/\s*[([](?:\d{4}\s+)?(?:remaster(?:ed)?|remasterizad[oa]|live|ao vivo)[^)\]]*[)\]]/gi, '')
    .trim() || name;
}

export function trackToSong(t: SpTrack, opts: { origem: Origem; dificuldade: Dificuldade; genero?: string }): Song {
  const ano = parseInt(t.album.release_date ?? '', 10);
  const artistas = t.artists.map((a) => a.name);
  const titulo = cleanTitle(t.name);
  return {
    id: `sp-${t.id}`,
    titulo,
    artista: artistas.length > 1 ? `${artistas[0]} feat. ${artistas.slice(1).join(', ')}` : artistas[0] ?? 'Desconhecido',
    ano: Number.isFinite(ano) ? ano : new Date().getFullYear(),
    pais: opts.origem === 'br' ? 'Brasil' : '',
    idioma: opts.origem === 'br' ? 'Português' : '',
    origem: opts.origem,
    genero: opts.genero || 'Variado',
    dificuldade: opts.dificuldade,
    spotifyUrl: `https://open.spotify.com/track/${t.id}`,
    fontes: [t.external_urls?.spotify, t.album.external_urls?.spotify].filter(Boolean) as string[],
    curiosidade: `Do álbum "${t.album.name}".`,
    temLetra: true,
    alternativas: titulo !== t.name || artistas.length > 1 ? { titulo: titulo !== t.name ? [t.name] : undefined, artista: artistas.length > 1 ? artistas : undefined } : undefined,
    verificacao: { status: 'ok', em: new Date().toISOString(), detalhe: 'Importada da API do Spotify' },
    anoConferir: t.album.album_type === 'compilation' || /remaster|live|ao vivo|deluxe|greatest|hits|best of|collection/i.test(`${t.name} ${t.album.name}`),
  };
}

/* ───────────────────────── Consultas ───────────────────────── */

export async function searchTracks(q: string, offset = 0): Promise<{ items: SpTrack[]; total: number }> {
  // Limite 10: no modo de desenvolvimento o Spotify pode recusar valores maiores.
  const data = await api<{ tracks: { items: SpTrack[]; total: number } }>(`/search?${new URLSearchParams({ q, type: 'track', limit: '10', offset: String(offset) })}`);
  return { items: data.tracks.items.filter(Boolean), total: data.tracks.total };
}

export async function getTrack(id: string): Promise<SpTrack> {
  return api<SpTrack>(`/tracks/${encodeURIComponent(id)}`);
}

export interface SpPlaylist { id: string; name: string; owner?: { display_name?: string }; items?: { total?: number }; tracks?: { total?: number } }

export async function myPlaylists(): Promise<SpPlaylist[]> {
  const out: SpPlaylist[] = [];
  let url: string | null = '/me/playlists?limit=50';
  while (url && out.length < 500) {
    const page: { items: SpPlaylist[]; next: string | null } = await api(url);
    out.push(...page.items.filter(Boolean));
    url = page.next;
  }
  return out;
}

export function extractPlaylistId(input: string): string | null {
  const m = input.trim().match(/playlist[/:]([A-Za-z0-9]{22})/);
  return m ? m[1] : /^[A-Za-z0-9]{22}$/.test(input.trim()) ? input.trim() : null;
}

/** Lê todas as faixas de uma playlist (endpoint novo `/items`; usa `/tracks` se o novo não existir). */
export async function playlistTracks(id: string, onProgress?: (n: number) => void): Promise<SpTrack[]> {
  const out: SpTrack[] = [];
  let url: string | null = `/playlists/${id}/items?limit=50`;
  let usedFallback = false;
  while (url) {
    let page: { items: { item?: SpTrack; track?: SpTrack }[]; next: string | null };
    try {
      page = await api(url);
    } catch (e) {
      if (!usedFallback && (e as SpotifyError).status === 404 && out.length === 0) { usedFallback = true; url = `/playlists/${id}/tracks?limit=50`; continue; }
      throw e;
    }
    for (const it of page.items) {
      const t = it?.item ?? it?.track;
      if (t && t.id && !t.is_local && (t.type ?? 'track') === 'track') out.push(t);
    }
    onProgress?.(out.length);
    url = page.next;
    if (out.length >= 2000) break;
  }
  return out;
}

/** Gênero do artista (melhor esforço; se o Spotify não informar, fica "Variado"). */
export async function artistGenres(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const id of [...new Set(ids)].slice(0, 40)) {
    try {
      const a = await api<{ genres?: string[] }>(`/artists/${id}`);
      if (a.genres?.[0]) out[id] = a.genres[0].replace(/\b\w/g, (c) => c.toUpperCase());
    } catch { /* ignora */ }
  }
  return out;
}

/* ───────────────────────── Tocar em um aparelho (Spotify Connect) ───────────────────────── */

export interface SpDevice { id: string; name: string; type: string; is_active: boolean }

export async function devices(): Promise<SpDevice[]> {
  const d = await api<{ devices: SpDevice[] }>('/me/player/devices');
  return d.devices.filter((x) => x.id);
}

/** Toca a faixa no aparelho escolhido SEM abrir o app do Spotify nesta tela. Requer Premium. */
export async function playOnDevice(trackId: string, deviceId?: string): Promise<void> {
  const q = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
  await api(`/me/player/play${q}`, { method: 'PUT', body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }) });
}

export async function pausePlayback(deviceId?: string): Promise<void> {
  const q = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
  await api(`/me/player/pause${q}`, { method: 'PUT' });
}
