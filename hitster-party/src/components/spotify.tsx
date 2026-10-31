import { useEffect, useState, useSyncExternalStore } from 'react';
import { validateSong } from '../lib/csv';
import { canonicalTrackUrl, extractTrackId } from '../lib/spotify';
import * as sp from '../lib/spotifyApi';
import { getState, matchActions, settingsActions, songActions, songById, useAppState } from '../store/store';
import type { Dificuldade, Origem, Song } from '../types';
import { Modal, useFeedback } from './feedback';
import { DIF_LABEL, Segmented } from './ui';

/** Estado da conexão com o Spotify (reage a login/logout). */
export function useSpotifyAuth() {
  const auth = useSyncExternalStore(
    (cb) => sp.onAuthChange(cb) as () => void,
    () => JSON.stringify(sp.loadAuth()),
    () => '{}',
  );
  const a = JSON.parse(auth) as sp.SpotifyAuth;
  return { clientId: a.clientId ?? '', connected: sp.isConnected(a) };
}

/* ───────────────────────── Conectar conta ───────────────────────── */

export function SpotifyConnectCard() {
  const { clientId, connected } = useSpotifyAuth();
  const { toast } = useFeedback();
  const [id, setId] = useState(clientId);
  const redirect = sp.defaultRedirectUri();

  if (sp.insideClaudeArtifact()) {
    return (
      <div className="sp-card">
        <p><strong>A conexão direta com o Spotify não funciona dentro do claude.ai.</strong> Por segurança, páginas publicadas aqui não podem conversar com a API do Spotify.</p>
        <p className="muted small">Para usar: rode o jogo no seu computador (<code>npm run dev</code>) ou hospede a pasta <code>dist/</code> num endereço HTTPS. O passo a passo está no README. Aqui você ainda pode colar o link de qualquer música do Spotify.</p>
      </div>
    );
  }

  return (
    <div className="sp-card">
      {connected ? (
        <div className="row">
          <span className="sp-status sp-status--on">● Conectado ao Spotify</span>
          <button className="btn btn--ghost btn--sm" onClick={() => { sp.disconnect(); toast('Spotify desconectado.'); }}>Desconectar</button>
        </div>
      ) : (
        <>
          <ol className="list small">
            <li>Entre em <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer">developer.spotify.com/dashboard</a> com a sua conta (no modo de desenvolvimento, a conta dona do app precisa ser <strong>Premium</strong>).</li>
            <li>Crie um app e marque <em>Web API</em>.</li>
            <li>Em <em>Redirect URIs</em>, cadastre exatamente: <code className="sp-copy">{redirect}</code>{redirect.includes('localhost') && <span className="neg"> (troque “localhost” por 127.0.0.1)</span>}</li>
            <li>Em <em>User Management</em>, adicione o e-mail de quem vai entrar (até 5 pessoas).</li>
            <li>Copie o <strong>Client ID</strong> e cole abaixo. Ele não é uma senha; o jogo não usa “client secret”.</li>
          </ol>
          <form className="row" onSubmit={async (e) => {
            e.preventDefault();
            if (!/^[a-f0-9]{32}$/i.test(id.trim())) { toast('O Client ID tem 32 letras e números. Confira se copiou certo.', 'erro'); return; }
            sp.setClientId(id);
            try { window.location.href = await sp.buildLoginUrl(redirect); } catch (err) { toast((err as Error).message, 'erro'); }
          }}>
            <input className="input" style={{ maxWidth: 360 }} placeholder="Client ID do seu app" value={id} onChange={(e) => setId(e.target.value)} aria-label="Client ID do Spotify" data-testid="sp-client-id" />
            <button className="btn btn--spotify" type="submit" data-testid="sp-connect">Conectar com o Spotify</button>
          </form>
        </>
      )}
    </div>
  );
}

/* ───────────────────────── Buscar e importar ───────────────────────── */

function TrackRow({ t, children }: { t: sp.SpTrack; children: React.ReactNode }) {
  return (
    <li className="sp-track">
      {t.album.images?.[t.album.images.length - 1]?.url && <img src={t.album.images[t.album.images.length - 1].url} alt="" width={40} height={40} />}
      <div className="sp-track__info">
        <strong>{t.name}</strong>
        <span className="muted small">{t.artists.map((a) => a.name).join(', ')} · {t.album.release_date?.slice(0, 4) ?? '?'} · {t.album.name}</span>
      </div>
      {children}
    </li>
  );
}

export function SpotifyLibrary() {
  const { connected } = useSpotifyAuth();
  const { toast, confirm } = useFeedback();
  const bank = useAppState((s) => s.songs);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<sp.SpTrack[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [origem, setOrigem] = useState<Origem>('br');
  const [dif, setDif] = useState<Dificuldade>('media');
  const [playlists, setPlaylists] = useState<sp.SpPlaylist[] | null>(null);
  const [link, setLink] = useState('');
  const [progress, setProgress] = useState<string | null>(null);

  if (!connected) return <SpotifyConnectCard />;

  const inBank = (t: sp.SpTrack) => bank.some((s) => extractTrackId(s.spotifyUrl) === t.id);

  const buscar = async (offset = 0) => {
    if (!q.trim()) return;
    setBusy(true);
    try {
      const r = await sp.searchTracks(q.trim(), offset);
      setResults(offset ? [...results, ...r.items] : r.items); setTotal(r.total);
    } catch (e) { toast((e as Error).message, 'erro'); } finally { setBusy(false); }
  };

  const adicionar = (t: sp.SpTrack) => {
    songActions.upsert(sp.trackToSong(t, { origem, dificuldade: dif }));
    toast(`“${sp.cleanTitle(t.name)}” entrou no banco.`);
  };

  const importar = async (playlistId: string, nome: string) => {
    setProgress('Lendo a playlist…');
    try {
      const tracks = await sp.playlistTracks(playlistId, (n) => setProgress(`Lendo a playlist… ${n} músicas`));
      if (!tracks.length) { toast('Essa playlist está vazia ou não pôde ser lida.', 'erro'); return; }
      const novas = tracks.filter((t) => !inBank(t));
      const ok = await confirm({ titulo: `Importar “${nome}”?`, mensagem: `${tracks.length} músicas encontradas, ${novas.length} novas no banco. Todas entram como ${origem === 'br' ? 'brasileiras' : 'internacionais'} e dificuldade ${DIF_LABEL[dif].toLowerCase()}. O Spotify não informa se a música é instrumental: confira e remova as sem letra depois.`, confirmar: `Importar ${novas.length}` });
      if (!ok) return;
      setProgress('Buscando os gêneros dos artistas…');
      const genres = await sp.artistGenres(novas.map((t) => t.artists[0]?.id).filter(Boolean));
      songActions.import(novas.map((t) => sp.trackToSong(t, { origem, dificuldade: dif, genero: genres[t.artists[0]?.id] })), 'merge');
      toast(`${novas.length} músicas importadas!`);
    } catch (e) { toast((e as Error).message, 'erro'); } finally { setProgress(null); }
  };

  return (
    <div className="stack sp-lib">
      <SpotifyConnectCard />
      <div className="row">
        <span className="small muted">Músicas adicionadas entram como:</span>
        <Segmented name="Origem" value={origem} onChange={setOrigem} options={[{ value: 'br', label: '🇧🇷 Brasileiras' }, { value: 'intl', label: '🌍 Internacionais' }]} />
        <select className="input input--sm" value={dif} onChange={(e) => setDif(e.target.value as Dificuldade)} aria-label="Dificuldade">
          {(['facil', 'media', 'dificil', 'muito_dificil'] as Dificuldade[]).map((d) => <option key={d} value={d}>{DIF_LABEL[d]}</option>)}
        </select>
      </div>

      <h3 className="card__title">🔎 Qualquer música do Spotify</h3>
      <form className="row" onSubmit={(e) => { e.preventDefault(); buscar(0); }}>
        <input className="input" style={{ flex: 1, minWidth: 0 }} placeholder="Nome da música, artista…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="sp-search" />
        <button className="btn btn--primary" disabled={busy} data-testid="sp-search-btn">{busy ? 'Buscando…' : 'Buscar'}</button>
      </form>
      {results.length > 0 && (
        <ul className="sp-results">
          {results.map((t) => (
            <TrackRow key={t.id} t={t}>
              {inBank(t) ? <span className="muted small">no banco ✔</span> : <button className="btn btn--ghost btn--sm" onClick={() => adicionar(t)}>+ Adicionar</button>}
            </TrackRow>
          ))}
        </ul>
      )}
      {results.length > 0 && results.length < total && <button className="btn btn--ghost btn--sm" onClick={() => buscar(results.length)} disabled={busy}>Mostrar mais</button>}

      <h3 className="card__title">📚 Importar uma playlist inteira</h3>
      <p className="muted small" style={{ margin: 0 }}>Desde 2026, o Spotify só libera playlists suas (ou que você segue), não as editoriais do próprio Spotify. Monte uma playlist com as músicas da festa e importe aqui.</p>
      <form className="row" onSubmit={(e) => { e.preventDefault(); const id = sp.extractPlaylistId(link); if (!id) { toast('Cole o link de uma playlist do Spotify.', 'erro'); return; } importar(id, 'playlist'); }}>
        <input className="input" style={{ flex: 1, minWidth: 0 }} placeholder="https://open.spotify.com/playlist/…" value={link} onChange={(e) => setLink(e.target.value)} />
        <button className="btn btn--ghost" disabled={!!progress}>Importar link</button>
      </form>
      <button className="btn btn--ghost btn--sm" onClick={async () => { try { setPlaylists(await sp.myPlaylists()); } catch (e) { toast((e as Error).message, 'erro'); } }}>Ver minhas playlists</button>
      {playlists && (
        <ul className="sp-results">
          {playlists.map((p) => (
            <li key={p.id} className="sp-track">
              <div className="sp-track__info"><strong>{p.name}</strong><span className="muted small">{(p.items?.total ?? p.tracks?.total ?? 0)} músicas · {p.owner?.display_name}</span></div>
              <button className="btn btn--ghost btn--sm" disabled={!!progress} onClick={() => importar(p.id, p.name)}>Importar</button>
            </li>
          ))}
        </ul>
      )}
      {progress && <p className="notice">{progress}</p>}
    </div>
  );
}

/* ───────────────────────── Tocar direto num aparelho ───────────────────────── */

export function PlayOnDevice({ url }: { url: string }) {
  const deviceId = useAppState((s) => s.settings.spotifyDeviceId);
  const { toast } = useFeedback();
  const [list, setList] = useState<sp.SpDevice[]>([]);
  const [busy, setBusy] = useState(false);
  const trackId = extractTrackId(url);

  const atualizar = async () => {
    try { const d = await sp.devices(); setList(d); if (!deviceId && d[0]) settingsActions.update({ spotifyDeviceId: d.find((x) => x.is_active)?.id ?? d[0].id }); }
    catch (e) { toast((e as Error).message, 'erro'); }
  };
  useEffect(() => { atualizar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <div className="sp-play">
      <button className="spotify-btn" disabled={busy || !trackId} data-testid="sp-play" onClick={async () => {
        setBusy(true);
        try { await sp.playOnDevice(trackId!, deviceId); toast('Tocando! 🎶'); }
        catch (e) { toast((e as Error).message, 'erro'); } finally { setBusy(false); }
      }}>
        <span className="spotify-btn__icon" aria-hidden><svg viewBox="0 0 24 24" width="28" height="28"><circle cx="12" cy="12" r="12" fill="#1ed760" /><path d="M9.5 7.5v9l7-4.5z" fill="#000" /></svg></span>
        <span>{busy ? 'CONECTANDO…' : '▶ TOCAR NO SPOTIFY'}</span>
      </button>
      <div className="row sp-play__ctrl">
        <select className="input input--sm" value={deviceId ?? ''} onChange={(e) => settingsActions.update({ spotifyDeviceId: e.target.value })} aria-label="Aparelho do Spotify">
          {!list.length && <option value="">Abra o Spotify em algum aparelho…</option>}
          {list.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.type})</option>)}
        </select>
        <button className="btn btn--ghost btn--sm" onClick={atualizar}>↻ Aparelhos</button>
        <button className="btn btn--ghost btn--sm" onClick={() => sp.pausePlayback(deviceId).catch((e) => toast((e as Error).message, 'erro'))}>⏸ Pausar</button>
      </div>
      <p className="muted small center" style={{ margin: 0 }}>A música toca na caixa de som ou no aparelho escolhido. Esta tela não mostra o nome dela.</p>
    </div>
  );
}

/* ───────────────────────── Escolher qualquer música para a rodada ───────────────────────── */

export function PickSongModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connected } = useSpotifyAuth();
  const { toast } = useFeedback();
  const [link, setLink] = useState('');
  const [form, setForm] = useState({ titulo: '', artista: '', ano: '', origem: 'br' as Origem, genero: '' });
  const [q, setQ] = useState('');
  const [results, setResults] = useState<sp.SpTrack[]>([]);
  const [busy, setBusy] = useState(false);

  const usar = (song: Song) => {
    const r = matchActions.chooseSong(song);
    if (!r.ok) { toast(r.erro, 'erro'); return; }
    toast('Música escolhida! O gabarito já está pronto.');
    setLink(''); setForm({ titulo: '', artista: '', ano: '', origem: 'br', genero: '' }); setResults([]); setQ('');
    onClose();
  };

  const colarLink = async (value: string) => {
    setLink(value);
    const id = extractTrackId(value);
    if (!id) return;
    const existing = songById(`sp-${id}`) ?? getState().songs.find((x) => extractTrackId(x.spotifyUrl) === id);
    if (existing) { setForm({ titulo: existing.titulo, artista: existing.artista, ano: String(existing.ano), origem: existing.origem, genero: existing.genero }); return; }
    if (connected) {
      try { const t = await sp.getTrack(id); const s = sp.trackToSong(t, { origem: form.origem, dificuldade: 'media' }); setForm({ ...form, titulo: s.titulo, artista: s.artista, ano: String(s.ano) }); }
      catch (e) { toast((e as Error).message, 'erro'); }
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="🎯 Escolher a música desta rodada" wide>
      <p className="muted small" style={{ marginTop: 0 }}>Coloque qualquer música do mundo nesta rodada. Só você vê esta janela; a TV e as equipes continuam sem spoiler.</p>
      {connected && !sp.insideClaudeArtifact() && (
        <>
          <form className="row" onSubmit={async (e) => { e.preventDefault(); if (!q.trim()) return; setBusy(true); try { setResults((await sp.searchTracks(q.trim())).items); } catch (err) { toast((err as Error).message, 'erro'); } finally { setBusy(false); } }}>
            <input className="input" style={{ flex: 1, minWidth: 0 }} placeholder="Buscar no Spotify: música ou artista" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn btn--primary" disabled={busy}>{busy ? 'Buscando…' : 'Buscar'}</button>
          </form>
          {results.length > 0 && (
            <ul className="sp-results">
              {results.map((t) => (
                <TrackRow key={t.id} t={t}><button className="btn btn--primary btn--sm" onClick={() => usar(sp.trackToSong(t, { origem: form.origem, dificuldade: 'media' }))}>Usar esta</button></TrackRow>
              ))}
            </ul>
          )}
          <p className="muted small center">ou cole um link</p>
        </>
      )}
      <form className="song-form" onSubmit={(e) => {
        e.preventDefault();
        const r = validateSong({ id: extractTrackId(link) ? `sp-${extractTrackId(link)}` : undefined, titulo: form.titulo, artista: form.artista, ano: form.ano, origem: form.origem, genero: form.genero || 'Variado', dificuldade: 'media', spotifyUrl: link, fontes: canonicalTrackUrl(link) ? [canonicalTrackUrl(link)!] : [] }, 'Música');
        if (!r.song) { toast(r.error!, 'erro'); return; }
        usar(r.song);
      }}>
        <label className="field field--full"><span>Link da música no Spotify <em className="req">no app: Compartilhar → Copiar link</em></span>
          <input value={link} onChange={(e) => colarLink(e.target.value)} placeholder="https://open.spotify.com/track/…" data-testid="pick-link" /></label>
        <label className="field"><span>Nome da música</span><input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} data-testid="pick-titulo" /></label>
        <label className="field"><span>Quem canta</span><input value={form.artista} onChange={(e) => setForm({ ...form, artista: e.target.value })} data-testid="pick-artista" /></label>
        <label className="field"><span>Ano de lançamento</span><input inputMode="numeric" value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value.replace(/\D/g, '') })} data-testid="pick-ano" /></label>
        <label className="field"><span>Estilo (aparece como categoria)</span><input value={form.genero} onChange={(e) => setForm({ ...form, genero: e.target.value })} placeholder="Ex.: Samba, Rock, Pop…" /></label>
        <div className="field field--full"><Segmented name="Origem" value={form.origem} onChange={(v) => setForm({ ...form, origem: v })} options={[{ value: 'br', label: '🇧🇷 Brasileira' }, { value: 'intl', label: '🌍 Internacional' }]} /></div>
        <div className="row row--end field--full">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary" data-testid="pick-usar">Usar nesta rodada</button>
        </div>
      </form>
    </Modal>
  );
}

