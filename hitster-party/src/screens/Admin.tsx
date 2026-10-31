import { useMemo, useRef, useState } from 'react';
import { Modal, useFeedback } from '../components/feedback';
import { DIF_LABEL, DifficultyBadge, Segmented, TeamChip, TopBar } from '../components/ui';
import { importCsv, importJson, songsToCsv, validateSong, type ImportResult } from '../lib/csv';
import { download } from '../lib/export';
import { canonicalTrackUrl, checkOnline } from '../lib/spotify';
import { navigate } from '../router';
import {
  currentTurn, hashPin, matchActions, songActions, songById, TEAM_COLORS, TEAM_EMOJIS, useAppState,
} from '../store/store';
import type { Dificuldade, Song, Tolerancia } from '../types';

type Tab = 'musicas' | 'importar' | 'partida' | 'equipes';
let desbloqueado = false;

export function Admin() {
  const pinHash = useAppState((s) => s.settings.pinHash);
  const [ok, setOk] = useState(desbloqueado || !pinHash);
  const [tab, setTab] = useState<Tab>('musicas');
  if (!ok) return <PinGate onOk={() => { desbloqueado = true; setOk(true); }} />;

  return (
    <main className="page page--wide">
      <TopBar />
      <h1 className="page__title">🔑 Área do organizador</h1>
      <p className="notice">🙈 Esta área mostra respostas. <strong>Não exiba esta tela na TV</strong> nem para os jogadores.</p>
      <div className="tabs" role="tablist">
        {([['musicas', '🎵 Banco de músicas'], ['importar', '📥 Importar / exportar'], ['partida', '🎛️ Controle da partida'], ['equipes', '👥 Equipes']] as [Tab, string][]).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`tabs__tab ${tab === k ? 'is-active' : ''}`} onClick={() => setTab(k)} data-testid={`tab-${k}`}>{label}</button>
        ))}
      </div>
      {tab === 'musicas' && <SongsTab />}
      {tab === 'importar' && <ImportTab />}
      {tab === 'partida' && <MatchTab />}
      {tab === 'equipes' && <TeamsTab />}
    </main>
  );
}

function PinGate({ onOk }: { onOk: () => void }) {
  const pinHash = useAppState((s) => s.settings.pinHash);
  const [pin, setPin] = useState('');
  const { toast } = useFeedback();
  return (
    <main className="page">
      <TopBar />
      <form className="card pin" onSubmit={async (e) => {
        e.preventDefault();
        if ((await hashPin(pin)) === pinHash) onOk(); else { toast('PIN incorreto.', 'erro'); setPin(''); }
      }}>
        <h1>🔒 Área do organizador</h1>
        <p className="muted">Digite o PIN para acessar.</p>
        <input className="input input--pin" type="password" inputMode="numeric" autoFocus value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} maxLength={8} />
        <button className="btn btn--primary btn--xl" type="submit">Entrar</button>
      </form>
    </main>
  );
}

/* ───────────────────────── Banco de músicas ───────────────────────── */

const STATUS_ICON = { ok: '✅', erro: '❌', formato: '⚠️' } as const;

function SongsTab() {
  const songs = useAppState((s) => s.songs);
  const { confirm, toast } = useFeedback();
  const [q, setQ] = useState('');
  const [origem, setOrigem] = useState<'todas' | 'br' | 'intl'>('todas');
  const [dif, setDif] = useState<'todas' | Dificuldade>('todas');
  const [edit, setEdit] = useState<Song | 'novo' | null>(null);
  const [checking, setChecking] = useState<{ done: number; total: number } | null>(null);
  const abort = useRef<AbortController | null>(null);

  const filtered = useMemo(() => {
    const n = q.toLowerCase();
    return songs.filter((s) => (origem === 'todas' || s.origem === origem) && (dif === 'todas' || s.dificuldade === dif)
      && (!n || `${s.titulo} ${s.artista} ${s.musical ?? ''} ${s.ano} ${s.genero}`.toLowerCase().includes(n)));
  }, [songs, q, origem, dif]);

  const verificarFormato = () => {
    let bad = 0;
    for (const s of songs) {
      const okFmt = !!canonicalTrackUrl(s.spotifyUrl);
      if (!okFmt) bad++;
      songActions.setVerification(s.id, okFmt ? (s.verificacao?.status === 'ok' ? s.verificacao : undefined) : { status: 'formato', em: new Date().toISOString(), detalhe: 'Não é um link de faixa do Spotify.' });
    }
    toast(bad ? `${bad} música(s) com link em formato inválido.` : 'Todos os links estão no formato de faixa do Spotify.', bad ? 'erro' : 'ok');
  };

  const verificarOnline = async (lista: Song[]) => {
    abort.current = new AbortController();
    setChecking({ done: 0, total: lista.length });
    let erros = 0;
    for (let i = 0; i < lista.length; i++) {
      if (abort.current.signal.aborted) break;
      const s = lista[i];
      const r = await checkOnline(s.spotifyUrl, abort.current.signal);
      if (!r.ok) erros++;
      songActions.setVerification(s.id, { status: r.ok ? 'ok' : 'erro', em: new Date().toISOString(), detalhe: r.ok ? `Spotify: “${r.titulo ?? '?'}”` : r.detalhe });
      setChecking({ done: i + 1, total: lista.length });
      await new Promise((res) => setTimeout(res, 250)); // gentil com o servidor
    }
    setChecking(null);
    toast(erros ? `${erros} link(s) com problema. Veja os ❌ na lista.` : 'Verificação concluída sem erros.', erros ? 'erro' : 'ok');
  };

  const invalidas = songs.filter((s) => s.verificacao && s.verificacao.status !== 'ok');

  return (
    <section className="card">
      <div className="admin-toolbar">
        <input className="input" placeholder="Buscar por título, artista, ano, gênero…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar música" />
        <select className="input" value={origem} onChange={(e) => setOrigem(e.target.value as typeof origem)} aria-label="Filtrar origem">
          <option value="todas">Todas as origens</option><option value="br">Brasileiras</option><option value="intl">Internacionais</option>
        </select>
        <select className="input" value={dif} onChange={(e) => setDif(e.target.value as typeof dif)} aria-label="Filtrar dificuldade">
          <option value="todas">Todas as dificuldades</option>{(['facil', 'media', 'dificil', 'muito_dificil'] as Dificuldade[]).map((d) => <option key={d} value={d}>{DIF_LABEL[d]}</option>)}
        </select>
        <button className="btn btn--primary" onClick={() => setEdit('novo')} data-testid="song-new">+ Nova música</button>
      </div>
      <div className="row" style={{ margin: '10px 0' }}>
        <button className="btn btn--ghost btn--sm" onClick={verificarFormato}>🔎 Verificar formato dos links</button>
        {checking ? (
          <button className="btn btn--ghost btn--sm" onClick={() => abort.current?.abort()}>⏹ Parar ({checking.done}/{checking.total})</button>
        ) : (
          <button className="btn btn--ghost btn--sm" onClick={() => verificarOnline(filtered)} title="Consulta o oEmbed público do Spotify (precisa de internet)">🌐 Verificar links on-line ({filtered.length})</button>
        )}
        {invalidas.length > 0 && (
          <button className="btn btn--danger-ghost btn--sm" onClick={async () => {
            if (await confirm({ titulo: 'Remover músicas inválidas?', mensagem: `${invalidas.length} música(s) com link inválido ou com erro na verificação serão removidas do banco.`, confirmar: 'Remover', perigo: true })) {
              songActions.removeMany(invalidas.map((s) => s.id)); toast('Músicas removidas.');
            }
          }}>🗑 Remover inválidas ({invalidas.length})</button>
        )}
      </div>
      <p className="muted small">{filtered.length} de {songs.length} músicas · ✅ verificada · ❌ erro · ⚠️ formato inválido · (sem ícone) não verificada nesta máquina</p>

      <div className="song-table-wrap">
        <table className="song-table" data-testid="song-table">
          <thead><tr><th></th><th>Música</th><th>Artista / musical</th><th>Ano</th><th>Gênero</th><th>Dificuldade</th><th>Ações</th></tr></thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td title={s.verificacao?.detalhe}>{s.verificacao ? STATUS_ICON[s.verificacao.status] : ''}{s.origem === 'br' ? '🇧🇷' : '🌍'}</td>
                <td><strong>{s.titulo}</strong>{s.exemplo && <span className="pill pill--sm">exemplo</span>}</td>
                <td>{s.musical ? <>{s.musical} <span className="muted small">({s.artista})</span></> : s.artista}</td>
                <td>{s.ano}{s.anosAceitos?.length ? <span className="muted small"> / {s.anosAceitos.join(', ')}</span> : null}</td>
                <td className="small">{s.genero}</td>
                <td><DifficultyBadge value={s.dificuldade} /></td>
                <td className="song-table__actions">
                  <button className="icon-btn" onClick={() => setEdit(s)} aria-label={`Editar ${s.titulo}`}>✏️</button>
                  <a className="icon-btn" href={s.spotifyUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir no Spotify">▶</a>
                  <button className="icon-btn" onClick={() => verificarOnline([s])} aria-label="Verificar link" disabled={!!checking}>🌐</button>
                  <button className="icon-btn icon-btn--danger" aria-label={`Remover ${s.titulo}`} onClick={async () => {
                    if (await confirm({ titulo: 'Remover música?', mensagem: `“${s.titulo}” será removida do banco.`, confirmar: 'Remover', perigo: true })) songActions.remove(s.id);
                  }}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && <SongForm song={edit === 'novo' ? null : edit} onClose={() => setEdit(null)} />}
    </section>
  );
}

function SongForm({ song, onClose }: { song: Song | null; onClose: () => void }) {
  const { toast } = useFeedback();
  const [f, setF] = useState(() => ({
    titulo: song?.titulo ?? '', artista: song?.artista ?? '', musical: song?.musical ?? '', filme: song?.filme ?? '',
    ano: song ? String(song.ano) : '', anosAceitos: (song?.anosAceitos ?? []).join(', '), pais: song?.pais ?? '', idioma: song?.idioma ?? '',
    origem: song?.origem ?? 'br', genero: song?.genero ?? '', dificuldade: song?.dificuldade ?? 'media', spotifyUrl: song?.spotifyUrl ?? '',
    fontes: (song?.fontes ?? []).join('\n'), curiosidade: song?.curiosidade ?? '', altT: (song?.alternativas?.titulo ?? []).join(' | '),
    altA: (song?.alternativas?.artista ?? []).join(' | '), temLetra: song?.temLetra ?? true,
  }));
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const urlOk = !!canonicalTrackUrl(f.spotifyUrl);

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.temLetra) { toast('O jogo aceita apenas músicas com letra/vocal.', 'erro'); return; }
    const r = validateSong({
      id: song?.id, titulo: f.titulo, artista: f.artista, musical: f.musical, filme: f.filme, ano: f.ano,
      anosAceitos: f.anosAceitos.split(/[,;|\s]+/).filter(Boolean).join('|'), pais: f.pais, idioma: f.idioma, origem: f.origem,
      genero: f.genero, dificuldade: f.dificuldade, spotifyUrl: f.spotifyUrl, fontes: f.fontes.split(/\n+/).map((x) => x.trim()).filter(Boolean),
      curiosidade: f.curiosidade, titulosAlternativos: f.altT, artistasAlternativos: f.altA, temLetra: 'true',
    }, 'Formulário');
    if (!r.song) { toast(r.error!, 'erro'); return; }
    if (!song && songById(r.song.id)) r.song.id = `${r.song.id}-${Date.now().toString(36)}`;
    songActions.upsert({ ...r.song, exemplo: song?.exemplo, verificacao: song && song.spotifyUrl === r.song.spotifyUrl ? song.verificacao : undefined });
    toast(song ? 'Gabarito atualizado.' : 'Música cadastrada.');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={song ? `Editar gabarito — ${song.titulo}` : 'Cadastrar música'} wide>
      <form className="song-form" onSubmit={salvar}>
        <label className="field"><span>Título <em className="req">obrigatório</em></span><input value={f.titulo} onChange={set('titulo')} required data-testid="sf-titulo" /></label>
        <label className="field"><span>Artista ou banda <em className="req">obrigatório</em></span><input value={f.artista} onChange={set('artista')} required data-testid="sf-artista" /></label>
        <label className="field"><span>Musical (se houver)</span><input value={f.musical} onChange={set('musical')} placeholder="Aceito como resposta de artista" /></label>
        <label className="field"><span>Filme (se houver)</span><input value={f.filme} onChange={set('filme')} /></label>
        <label className="field"><span>Ano de lançamento <em className="req">obrigatório</em></span><input inputMode="numeric" value={f.ano} onChange={set('ano')} required data-testid="sf-ano" /></label>
        <label className="field"><span>Outros anos aceitos</span><input value={f.anosAceitos} onChange={set('anosAceitos')} placeholder="Ex.: 1971, 1972" /></label>
        <label className="field"><span>País</span><input value={f.pais} onChange={set('pais')} /></label>
        <label className="field"><span>Idioma</span><input value={f.idioma} onChange={set('idioma')} /></label>
        <label className="field"><span>Origem</span><select value={f.origem} onChange={set('origem')}><option value="br">Brasileira</option><option value="intl">Internacional</option></select></label>
        <label className="field"><span>Gênero</span><input value={f.genero} onChange={set('genero')} /></label>
        <label className="field"><span>Dificuldade</span><select value={f.dificuldade} onChange={set('dificuldade')}>{(['facil', 'media', 'dificil', 'muito_dificil'] as Dificuldade[]).map((d) => <option key={d} value={d}>{DIF_LABEL[d]}</option>)}</select></label>
        <label className="field field--full"><span>Link da música no Spotify <em className="req">obrigatório</em> {f.spotifyUrl && (urlOk ? <em className="pos">✔ link de faixa</em> : <em className="neg">✘ precisa ser open.spotify.com/track/…</em>)}</span>
          <input value={f.spotifyUrl} onChange={set('spotifyUrl')} placeholder="https://open.spotify.com/track/…" required data-testid="sf-url" /></label>
        <label className="field field--full"><span>Fontes (uma URL por linha)</span><textarea rows={2} value={f.fontes} onChange={set('fontes')} /></label>
        <label className="field field--full"><span>Curiosidade</span><textarea rows={2} value={f.curiosidade} onChange={set('curiosidade')} /></label>
        <label className="field"><span>Títulos alternativos (separe com |)</span><input value={f.altT} onChange={set('altT')} /></label>
        <label className="field"><span>Artistas alternativos (separe com |)</span><input value={f.altA} onChange={set('altA')} /></label>
        <label className="checkbox field--full"><input type="checkbox" checked={f.temLetra} onChange={(e) => setF({ ...f, temLetra: e.target.checked })} /> Esta versão tem letra (alguém canta nela)</label>
        <div className="row row--end field--full">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary" data-testid="sf-salvar">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}

/* ───────────────────────── Importar / exportar ───────────────────────── */

const CSV_EXEMPLO = `id,titulo,artista,musical,ano,anosAceitos,pais,idioma,origem,genero,dificuldade,spotifyUrl,fontes,curiosidade,temLetra,titulosAlternativos,artistasAlternativos,filme
,Nome da música,Nome do artista,,1999,,Brasil,Português,br,MPB,media,https://open.spotify.com/track/COLE_O_ID_DA_FAIXA_AQUI,https://pt.wikipedia.org/wiki/...,Uma curiosidade verificável,true,,,
`;

function ImportTab() {
  const songs = useAppState((s) => s.songs);
  const { confirm, toast } = useFeedback();
  const [texto, setTexto] = useState('');
  const [modo, setModo] = useState<'merge' | 'replace'>('merge');
  const [res, setRes] = useState<ImportResult | null>(null);

  const analisar = (content: string, nome = '') => {
    try {
      const isJson = nome.endsWith('.json') || /^\s*[[{]/.test(content);
      setRes(isJson ? importJson(content) : importCsv(content));
    } catch (e) { setRes(null); toast(`Arquivo inválido: ${(e as Error).message}`, 'erro'); }
  };

  return (
    <section className="card">
      <h2 className="card__title">📥 Importar músicas verificadas (JSON ou CSV)</h2>
      <p className="muted small">Cada música precisa de título, artista, ano e um link de <b>faixa</b> do Spotify (open.spotify.com/track/…). Músicas instrumentais e links de busca/playlist são rejeitados. Separe listas (fontes, anos aceitos) com “|”.</p>
      <div className="row">
        <label className="btn btn--ghost file-btn">📂 Escolher arquivo
          <input type="file" accept=".json,.csv,text/csv,application/json" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { const t = await file.text(); setTexto(t); analisar(t, file.name.toLowerCase()); } e.target.value = ''; }} data-testid="import-file" />
        </label>
        <button className="btn btn--ghost" onClick={() => download('modelo-hitster.csv', '﻿' + CSV_EXEMPLO, 'text/csv')}>⬇️ Baixar modelo CSV</button>
      </div>
      <textarea className="input" rows={6} placeholder="…ou cole aqui o conteúdo JSON/CSV" value={texto} onChange={(e) => setTexto(e.target.value)} data-testid="import-text" />
      <div className="row">
        <button className="btn btn--ghost" onClick={() => analisar(texto)} disabled={!texto.trim()} data-testid="import-analisar">Analisar</button>
        <Segmented name="Modo de importação" value={modo} onChange={setModo} options={[{ value: 'merge', label: 'Adicionar/atualizar' }, { value: 'replace', label: 'Substituir banco' }]} />
      </div>
      {res && (
        <div className="import-result" data-testid="import-result">
          <p><strong className="pos">{res.songs.length} música(s) válida(s)</strong>{res.errors.length > 0 && <> · <strong className="neg">{res.errors.length} com erro</strong></>}</p>
          {res.errors.length > 0 && <ul className="errors">{res.errors.slice(0, 20).map((er) => <li key={er}>{er}</li>)}{res.errors.length > 20 && <li>…</li>}</ul>}
          <button className="btn btn--primary" disabled={!res.songs.length} data-testid="import-confirm" onClick={async () => {
            if (modo === 'replace' && !(await confirm({ titulo: 'Substituir o banco?', mensagem: `As ${songs.length} músicas atuais serão trocadas pelas ${res.songs.length} importadas.`, confirmar: 'Substituir', perigo: true }))) return;
            songActions.import(res.songs, modo); toast(`${res.songs.length} música(s) importada(s).`); setRes(null); setTexto('');
          }}>Importar {res.songs.length} música(s)</button>
        </div>
      )}

      <h2 className="card__title">📤 Exportar banco ({songs.length} músicas)</h2>
      <div className="row">
        <button className="btn btn--ghost" onClick={() => download('banco-hitster.json', JSON.stringify(songs.map(({ verificacao: _v, ...s }) => s), null, 2), 'application/json')}>⬇️ JSON</button>
        <button className="btn btn--ghost" onClick={() => download('banco-hitster.csv', '﻿' + songsToCsv(songs), 'text/csv')}>⬇️ CSV</button>
        <button className="btn btn--ghost" onClick={async () => {
          if (await confirm({ titulo: 'Restaurar exemplos?', mensagem: 'As músicas de demonstração serão restauradas (suas músicas cadastradas são mantidas).', confirmar: 'Restaurar' })) { songActions.restoreDemo(); toast('Exemplos restaurados.'); }
        }}>↺ Restaurar músicas de exemplo</button>
      </div>
    </section>
  );
}

/* ───────────────────────── Controle da partida ───────────────────────── */

function MatchTab() {
  const match = useAppState((s) => s.match);
  const [mostrar, setMostrar] = useState(false);
  if (!match) return <section className="card"><p className="muted">Nenhuma partida em andamento.</p><button className="btn btn--primary" onClick={() => navigate('nova')}>🎵 Nova partida</button></section>;
  const turn = currentTurn(match);
  const song = turn && songById(turn.songId);
  return (
    <section className="card">
      <h2 className="card__title">Rodada {match.cursor.round + 1}{match.config.totalRodadas ? ` de ${match.config.totalRodadas}` : ' (modo infinito)'} · {match.config.modo === 'turno' ? 'Turno por equipe' : 'Resposta simultânea'}</h2>
      {turn && (
        <div className="stack">
          <div className="row">
            <button className="btn btn--ghost" onClick={() => setMostrar(!mostrar)}>{mostrar ? '🙈 Esconder música atual' : '👁 Ver música atual (só para você)'}</button>
            <button className="btn btn--ghost" onClick={() => matchActions.setRevealed(!turn.revealed)}>{turn.revealed ? 'Ocultar gabarito no jogo' : 'Revelar gabarito no jogo'}</button>
            <button className="btn btn--ghost" onClick={() => matchActions.setPublicReveal(!turn.publicReveal)}>{turn.publicReveal ? 'Esconder resposta da TV' : 'Mostrar resposta na TV'}</button>
            <button className="btn btn--primary" onClick={() => navigate('jogo')}>▶ Ir para o jogo</button>
          </div>
          {mostrar && song && <p className="notice">🎵 <strong>{song.titulo}</strong> — {song.musical ? `${song.musical} (${song.artista})` : song.artista} · {song.ano} · {song.genero}</p>}
        </div>
      )}
      <h2 className="card__title">📏 Regras de pontuação desta partida</h2>
      <p className="muted small">Música +1 · artista/banda/musical +1 · ano dentro da tolerância +1. A tolerância vale para as próximas sugestões automáticas; avaliações já feitas podem ser corrigidas no histórico.</p>
      <Segmented name="Tolerância da partida" value={match.config.tolerancia} onChange={(v: Tolerancia) => matchActions.setTolerance(v)} options={[
        { value: 0, label: 'Ano exato' }, { value: 1, label: '± 1' }, { value: 2, label: '± 2' }, { value: 5, label: '± 5' },
      ]} />
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn btn--ghost" onClick={() => navigate('historico')}>✏️ Corrigir pontos (histórico)</button>
        <button className="btn btn--ghost" onClick={() => navigate('placar')}>🏆 Placar e ajustes</button>
      </div>
    </section>
  );
}

/* ───────────────────────── Equipes ───────────────────────── */

function TeamsTab() {
  const match = useAppState((s) => s.match);
  const { confirm, toast } = useFeedback();
  if (!match || match.status !== 'em_andamento') {
    return <section className="card"><p className="muted">Sem partida em andamento: cadastre, renomeie e ordene as equipes na tela de configuração.</p><button className="btn btn--primary" onClick={() => navigate('nova')}>Configurar equipes</button></section>;
  }
  return (
    <section className="card">
      <p className="muted small">Edite as equipes da partida em andamento. Remover uma equipe apaga os pontos dela.</p>
      <ul className="team-list">
        {match.teams.map((t) => (
          <li key={t.id} className="team-row" style={{ ['--team' as string]: t.cor }}>
            <TeamChip team={t} size="sm" />
            <input className="team-row__name" value={t.nome} onChange={(e) => matchActions.updateTeam(t.id, { nome: e.target.value })} aria-label="Nome" />
            <select className="input input--sm" value={t.emoji} onChange={(e) => matchActions.updateTeam(t.id, { emoji: e.target.value })} aria-label="Emoji">{[...new Set([t.emoji, ...TEAM_EMOJIS])].map((em) => <option key={em}>{em}</option>)}</select>
            <div className="swatches swatches--inline">{TEAM_COLORS.map((c) => <button key={c} className={`swatch swatch--sm ${t.cor === c ? 'is-active' : ''}`} style={{ background: c }} onClick={() => matchActions.updateTeam(t.id, { cor: c })} aria-label={`Cor ${c}`} />)}</div>
            <button className="icon-btn icon-btn--danger" aria-label={`Remover ${t.nome}`} onClick={async () => {
              if (await confirm({ titulo: `Remover ${t.nome}?`, mensagem: 'A equipe e todos os pontos dela serão apagados desta partida.', confirmar: 'Remover', perigo: true })) {
                const r = matchActions.removeTeamFromMatch(t.id); if (!r.ok) toast(r.erro, 'erro');
              }
            }}>🗑</button>
          </li>
        ))}
      </ul>
      <button className="btn btn--ghost" onClick={() => { const r = matchActions.addTeamToMatch(); toast(r.ok ? 'Equipe adicionada.' : r.erro, r.ok ? 'ok' : 'erro'); }}>+ Adicionar equipe</button>
    </section>
  );
}
