import { beforeEach, describe, expect, it } from 'vitest';

// Ambiente mínimo de navegador para a integração (sem rede: o fetch é simulado)
const mem = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
(globalThis as any).window = { location: { href: 'http://127.0.0.1:5173/?code=abc&state=ST', protocol: 'http:', hostname: '127.0.0.1', port: '5173', pathname: '/' }, history: { replaceState: () => undefined } };

const sp = await import('./spotifyApi');

type Call = { url: string; init?: RequestInit };
let calls: Call[] = [];
function fake(routes: Record<string, (init?: RequestInit) => { status?: number; body?: unknown }>) {
  sp.setFetch((async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) return new Response(JSON.stringify({ error: { message: 'não simulado' } }), { status: 404 });
    const r = routes[key](init);
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), { status: r.status ?? 200 });
  }) as typeof fetch);
}

const track = (id: string, name: string, artists: string[], date: string, album = 'Álbum', album_type = 'album') => ({
  id, name, type: 'track', artists: artists.map((n, i) => ({ id: `a${i}${id}`, name: n })),
  album: { name: album, release_date: date, album_type, external_urls: { spotify: `https://open.spotify.com/album/x${id}` } },
  external_urls: { spotify: `https://open.spotify.com/track/${id}` },
});

beforeEach(() => { mem.clear(); calls = []; });

describe('PKCE', () => {
  it('gera o desafio S256 em base64url (conferido com hashlib do Python)', async () => {
    expect(await sp.codeChallenge('dBjftJeZ4CVP-mJ92K1qUJGTSBhn-DzHB2oJFm8oMFk')).toBe('hnsQAAhQZzv-XwL31Bf0Y2LhR01YkzXTIU2SOtw3oMw');
  });
  it('monta o login com client_id, redirect 127.0.0.1, escopos e state', async () => {
    sp.setClientId('0123456789abcdef0123456789abcdef');
    const url = new URL(await sp.buildLoginUrl());
    expect(url.origin + url.pathname).toBe('https://accounts.spotify.com/authorize');
    expect(url.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:5173/');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('scope')).toContain('user-modify-playback-state');
    expect(sp.loadAuth().verifier).toBeTruthy();
  });
  it('troca o código por tokens no retorno do login', async () => {
    mem.set('hitster-party:spotify', JSON.stringify({ clientId: 'cid', verifier: 'v', state: 'ST', redirectUri: 'http://127.0.0.1:5173/' }));
    fake({ 'api/token': () => ({ body: { access_token: 'AT', refresh_token: 'RT', expires_in: 3600 } }) });
    const r = await sp.handleRedirect();
    expect(r).toEqual({ ok: true });
    expect(sp.isConnected()).toBe(true);
    const body = String(calls[0].init?.body);
    expect(body).toContain('grant_type=authorization_code');
    expect(body).toContain('code_verifier=v');
    expect(body).not.toContain('client_secret');
  });
});

describe('API', () => {
  beforeEach(() => mem.set('hitster-party:spotify', JSON.stringify({ clientId: 'cid', accessToken: 'AT', refreshToken: 'RT', expiresAt: Date.now() + 60_000 })));

  it('busca faixas (limite 10) e converte para músicas do jogo', async () => {
    fake({ '/search': () => ({ body: { tracks: { total: 1, items: [track('4u7EnebtmKWzUH433cf5Qv', 'Bohemian Rhapsody - Remastered 2011', ['Queen'], '1975-11-21')] } } }) });
    const r = await sp.searchTracks('queen');
    expect(calls[0].url).toContain('limit=10');
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe('Bearer AT');
    const s = sp.trackToSong(r.items[0], { origem: 'intl', dificuldade: 'facil' });
    expect(s).toMatchObject({ titulo: 'Bohemian Rhapsody', artista: 'Queen', ano: 1975, spotifyUrl: 'https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv', temLetra: true });
    expect(s.alternativas?.titulo).toContain('Bohemian Rhapsody - Remastered 2011');
    expect(s.anoConferir).toBe(true); // remaster → conferir ano
  });

  it('lê playlists pelo endpoint novo /items (campo "item") com paginação', async () => {
    fake({
      '/items?limit=50': () => ({ body: { items: [{ item: track('1111111111111111111111', 'Asa Branca', ['Luiz Gonzaga'], '1947') }, { item: { ...track('2222222222222222222222', 'Ep', ['X'], '2020'), type: 'episode' } }], next: 'https://api.spotify.com/v1/playlists/P/items?offset=50&limit=50' } }),
      'offset=50': () => ({ body: { items: [{ item: track('3333333333333333333333', 'Carinhoso', ['Orlando Silva', 'Pixinguinha'], '1937') }], next: null } }),
    });
    const ts = await sp.playlistTracks('P');
    expect(ts.map((t) => t.name)).toEqual(['Asa Branca', 'Carinhoso']); // podcast ignorado
    expect(sp.trackToSong(ts[1], { origem: 'br', dificuldade: 'dificil' }).artista).toBe('Orlando Silva feat. Pixinguinha');
  });

  it('cai para /tracks (campo "track") se /items não existir', async () => {
    fake({
      '/items': () => ({ status: 404, body: { error: { message: 'nope' } } }),
      '/tracks?limit=50': () => ({ body: { items: [{ track: track('4444444444444444444444', 'Detalhes', ['Roberto Carlos'], '1971') }], next: null } }),
    });
    expect((await sp.playlistTracks('P')).map((t) => t.name)).toEqual(['Detalhes']);
  });

  it('toca num aparelho via Spotify Connect sem abrir o app', async () => {
    fake({ '/me/player/play': () => ({ status: 204 }) });
    await sp.playOnDevice('4u7EnebtmKWzUH433cf5Qv', 'DEV1');
    expect(calls[0].url).toBe('https://api.spotify.com/v1/me/player/play?device_id=DEV1');
    expect(calls[0].init?.method).toBe('PUT');
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ uris: ['spotify:track:4u7EnebtmKWzUH433cf5Qv'] });
  });

  it('renova o token vencido e explica o erro 403 (Premium / usuário autorizado)', async () => {
    mem.set('hitster-party:spotify', JSON.stringify({ clientId: 'cid', accessToken: 'OLD', refreshToken: 'RT', expiresAt: 0 }));
    fake({ 'api/token': () => ({ body: { access_token: 'NEW', expires_in: 3600 } }), '/me/player/devices': () => ({ status: 403, body: { error: { message: 'Premium required' } } }) });
    await expect(sp.devices()).rejects.toThrow(/Premium/);
    expect(String(calls[0].init?.body)).toContain('grant_type=refresh_token');
    expect((calls[1].init?.headers as Record<string, string>).Authorization).toBe('Bearer NEW');
  });

  it('extrai IDs de links de playlist', () => {
    expect(sp.extractPlaylistId('https://open.spotify.com/playlist/37i9dQZF1DZ06evO0dPrdS?si=1')).toBe('37i9dQZF1DZ06evO0dPrdS');
    expect(sp.extractPlaylistId('https://open.spotify.com/track/37i9dQZF1DZ06evO0dPrdS')).toBeNull();
  });
});
