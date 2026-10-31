import { useEffect, useId, useState } from 'react';
import { acceptedYears, computeScores, pointsOf } from '../lib/scoring';
import { appUri, canonicalTrackUrl } from '../lib/spotify';
import { matchActions, settingsActions, useAppState } from '../store/store';
import type { Match, Song, Team, Turn } from '../types';
import { Modal, useFeedback } from './feedback';
import { TeamChip, Toggle } from './ui';

/* ───────────────────────── Botão do Spotify ───────────────────────── */

let avisoMostradoNestaSessao = false;

/**
 * Botão preto que abre a FAIXA específica no Spotify.
 * O link é real (href), mas o botão não exibe título, artista, capa ou qualquer metadado.
 */
export function SpotifyButton({ url }: { url: string }) {
  const settings = useAppState((s) => s.settings);
  const [aviso, setAviso] = useState(false);
  const web = canonicalTrackUrl(url) ?? url;
  const href = settings.spotifyModo === 'app' ? appUri(url) ?? web : web;

  const abrir = () => {
    if (settings.spotifyModo === 'app') window.location.href = href;
    else window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <a
        className="spotify-btn"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="spotify-button"
        onClick={(e) => {
          if (settings.mostrarAvisoSpotify && !avisoMostradoNestaSessao) { e.preventDefault(); setAviso(true); }
        }}
      >
        <span className="spotify-btn__icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="28" height="28"><circle cx="12" cy="12" r="12" fill="#1ed760" /><path d="M9.5 7.5v9l7-4.5z" fill="#000" /></svg>
        </span>
        <span>▶ TOCAR NO SPOTIFY</span>
      </a>
      <Modal open={aviso} onClose={() => setAviso(false)} title="⚠️ Atenção, organizador">
        <p>O Spotify vai abrir esta faixa e <strong>pode mostrar o título, o artista e a capa</strong>.</p>
        <ul className="list">
          <li>Mantenha a tela do Spotify <strong>fora da visão dos jogadores</strong>.</li>
          <li>Se o celular estiver espelhado na TV, pause o espelhamento antes de abrir.</li>
          <li>Dica: use um segundo aparelho para tocar a música, longe da plateia.</li>
        </ul>
        <div className="row row--end">
          <button className="btn btn--ghost" onClick={() => { settingsActions.update({ mostrarAvisoSpotify: false }); avisoMostradoNestaSessao = true; setAviso(false); abrir(); }}>
            Não mostrar de novo
          </button>
          <button className="btn btn--primary" data-testid="spotify-confirm" onClick={() => { avisoMostradoNestaSessao = true; setAviso(false); abrir(); }}>
            Entendi, abrir música
          </button>
        </div>
      </Modal>
    </>
  );
}

/* ───────────────────────── Gabarito secreto ───────────────────────── */

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

/**
 * Painel expansível real. Quando fechado, os dados da resposta NÃO são renderizados no DOM
 * (renderização condicional, não apenas CSS).
 */
export function SecretAnswerCard({ turn, song, match }: { turn: Turn; song: Song; match: Match }) {
  const { confirm } = useFeedback();
  const panelId = useId();
  const open = turn.revealed;
  const faltam = turn.teamIds.filter((id) => !turn.guesses[id]).length;

  const toggle = async () => {
    if (!open && match.config.modo === 'simultaneo' && faltam > 0 && !Object.keys(turn.evals).length) {
      const ok = await confirm({ titulo: 'Revelar o gabarito?', mensagem: `Ainda ${faltam === 1 ? 'falta 1 equipe' : `faltam ${faltam} equipes`} registrar o palpite. Depois de revelar, os palpites ficam travados.`, confirmar: 'Revelar mesmo assim' });
      if (!ok) return;
    }
    matchActions.setRevealed(!open);
  };

  const anos = acceptedYears(song);
  return (
    <section className={`secret ${open ? 'secret--open' : ''}`} data-testid="secret-card">
      <div className="secret__head">
        <h3><span aria-hidden>{open ? '🔓' : '🔒'}</span> GABARITO SECRETO</h3>
        <button className={`btn ${open ? 'btn--ghost' : 'btn--reveal'}`} aria-expanded={open} aria-controls={panelId} onClick={toggle} data-testid="secret-toggle">
          {open ? 'OCULTAR GABARITO' : 'REVELAR GABARITO'}
        </button>
      </div>
      <div className="secret__wrap" id={panelId} role="region" aria-label="Gabarito">
        {open && (
          <div className="secret__body" data-testid="secret-body">
            <dl className="answer">
              <div><dt>Música</dt><dd className="answer__big">{song.titulo}</dd></div>
              <div><dt>{song.musical ? 'Musical / intérprete' : 'Artista / banda'}</dt>
                <dd>{song.musical ? <><strong>{song.musical}</strong> <span className="muted">— {song.artista}</span></> : song.artista}</dd></div>
              <div><dt>Ano de lançamento</dt><dd>{song.ano}{anos.length > 1 && <span className="muted"> (também aceito: {anos.slice(1).join(', ')})</span>}</dd></div>
              <div><dt>Estilo musical</dt><dd>{song.genero}</dd></div>
              {song.filme && <div><dt>Filme</dt><dd>{song.filme}</dd></div>}
              {(song.alternativas?.titulo?.length || song.alternativas?.artista?.length) ? (
                <div><dt>Também aceito</dt><dd className="muted">{[...(song.alternativas?.titulo ?? []), ...(song.alternativas?.artista ?? [])].join(' · ')}</dd></div>
              ) : null}
            </dl>
            {song.curiosidade && <p className="curiosity"><span aria-hidden>💡</span> {song.curiosidade}</p>}
            <div className="sources">
              <span className="muted">Fonte{song.fontes.length > 1 ? 's' : ''}:</span>
              {song.fontes.length ? song.fontes.map((f) => <a key={f} href={f} target="_blank" rel="noopener noreferrer">{host(f)} ↗</a>) : <span className="muted">não informada</span>}
            </div>
            <Toggle checked={turn.publicReveal} onChange={(v) => matchActions.setPublicReveal(v)} label="Mostrar a resposta também na tela da TV" testId="public-reveal" />
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────── Palpites ───────────────────────── */

export function GuessPanel({ turn, match }: { turn: Turn; match: Match }) {
  const { toast } = useFeedback();
  const teams = turn.teamIds.map((id) => match.teams.find((t) => t.id === id)).filter(Boolean) as Team[];
  const firstPending = teams.find((t) => !turn.guesses[t.id]) ?? teams[0];
  const [teamId, setTeamId] = useState(firstPending?.id ?? '');
  const [form, setForm] = useState({ ano: '', titulo: '', artista: '' });
  const [editing, setEditing] = useState(false);
  const locked = turn.revealed || Object.keys(turn.evals).length > 0;

  // Novo turno → volta para a primeira equipe pendente e limpa o formulário
  useEffect(() => {
    setTeamId((teams.find((t) => !turn.guesses[t.id]) ?? teams[0])?.id ?? '');
    setForm({ ano: '', titulo: '', artista: '' });
    setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn.id]);

  const selected = teams.find((t) => t.id === teamId);
  const jaEnviou = !!turn.guesses[teamId];
  const showForm = !locked && (!jaEnviou || editing);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ano.trim() && !form.titulo.trim() && !form.artista.trim()) { toast('Preencha pelo menos um campo.', 'erro'); return; }
    if (form.ano.trim() && !/^\d{3,4}$/.test(form.ano.trim())) { toast('Informe o ano com 4 dígitos (ex.: 1987).', 'erro'); return; }
    const r = matchActions.submitGuess(teamId, { ano: form.ano.trim(), titulo: form.titulo.trim(), artista: form.artista.trim() });
    if (!r.ok) { toast(r.erro, 'erro'); return; }
    toast(`Respostas da ${selected?.nome} registradas!`);
    setForm({ ano: '', titulo: '', artista: '' });
    setEditing(false);
    // No modo simultâneo, pula automaticamente para a próxima equipe que ainda não respondeu
    const next = teams.find((t) => t.id !== teamId && !turn.guesses[t.id]);
    if (next) setTeamId(next.id);
  };

  return (
    <section className="card guess" data-testid="guess-panel">
      <h3 className="section-title">🎤 HORA DE DAR SEU PALPITE!</h3>
      {teams.length > 1 && (
        <div className="team-select" role="radiogroup" aria-label="Equipe que está respondendo">
          {teams.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={t.id === teamId} className={`team-select__opt ${t.id === teamId ? 'is-active' : ''}`} style={{ ['--team' as string]: t.cor }} onClick={() => { setTeamId(t.id); setEditing(false); setForm({ ano: '', titulo: '', artista: '' }); }}>
              <span>{t.emoji}</span> {t.nome} {turn.guesses[t.id] && <span className="ok-dot" title="Palpite registrado">✔</span>}
            </button>
          ))}
        </div>
      )}
      {teams.length === 1 && selected && <p className="muted" style={{ marginTop: 0 }}>Respondendo: <TeamChip team={selected} size="sm" /></p>}

      {locked && <p className="notice">🔐 Gabarito revelado — os palpites deste turno estão travados. Use a avaliação abaixo para corrigir.</p>}

      {!locked && jaEnviou && !editing && (
        <div className="sent" data-testid="guess-sent">
          <span className="sent__icon">✔</span>
          <div>
            <strong>Respostas da {selected?.nome} registradas.</strong>
            <p className="muted">{match.config.modo === 'simultaneo' ? 'O conteúdo fica oculto das outras equipes até o gabarito ser revelado.' : 'Aguardando o organizador revelar o gabarito.'}</p>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => setEditing(true)}>Refazer palpite</button>
        </div>
      )}

      {showForm && (
        <form className="guess__form" onSubmit={enviar} autoComplete="off">
          <label className="field">
            <span>1. Ano de lançamento</span>
            <input inputMode="numeric" maxLength={4} placeholder="Ex.: 1985" value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value.replace(/\D/g, '') })} data-testid="guess-ano" />
          </label>
          <label className="field">
            <span>2. Nome da música</span>
            <input placeholder="Título da música" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} data-testid="guess-titulo" />
          </label>
          <label className="field">
            <span>3. Artista, banda ou musical</span>
            <input placeholder="Quem canta (ou o nome do musical)" value={form.artista} onChange={(e) => setForm({ ...form, artista: e.target.value })} data-testid="guess-artista" />
          </label>
          <button type="submit" className="btn btn--primary btn--xl" data-testid="guess-submit">CONFIRMAR RESPOSTAS</button>
        </form>
      )}

      {match.config.modo === 'simultaneo' && (
        <p className="muted small" style={{ marginBottom: 0 }}>
          {teams.filter((t) => turn.guesses[t.id]).length} de {teams.length} equipes já registraram o palpite.
        </p>
      )}
    </section>
  );
}

/* ───────────────────────── Avaliação ───────────────────────── */

function Check({ on, onClick, label, testId }: { on: boolean; onClick: () => void; label: string; testId?: string }) {
  return (
    <button type="button" className={`check ${on ? 'check--on' : ''}`} aria-pressed={on} onClick={onClick} data-testid={testId}>
      <span className="check__box">{on ? '✔' : '✘'}</span>
      <span>{label}</span>
      <span className="check__pts">{on ? '+1' : '0'}</span>
    </button>
  );
}

/** Avaliação individual por item. Os pontos são derivados → corrigir nunca duplica pontos. */
export function EvaluationPanel({ turn, match }: { turn: Turn; match: Match }) {
  if (!Object.keys(turn.evals).length) return null;
  return (
    <section className="card eval" data-testid="eval-panel">
      <h3 className="section-title">✅ Avaliação das respostas</h3>
      <p className="muted small" style={{ marginTop: 0 }}>
        Sugestão automática (aceita pequenos erros de digitação e tolerância de ano de {match.config.tolerancia === 0 ? '0 anos' : `±${match.config.tolerancia}`}). Toque em cada item para corrigir manualmente.
      </p>
      <div className="eval__list">
        {turn.teamIds.map((id) => {
          const team = match.teams.find((t) => t.id === id);
          if (!team) return null;
          const ev = turn.evals[id] ?? { titulo: false, artista: false, ano: false, concluida: false };
          const g = turn.guesses[id];
          const pts = (ev.titulo ? 1 : 0) + (ev.artista ? 1 : 0) + (ev.ano ? 1 : 0);
          return (
            <div key={id} className={`eval__team ${ev.concluida ? 'is-done' : ''}`} style={{ ['--team' as string]: team.cor }} data-testid={`eval-${team.nome}`}>
              <div className="eval__head">
                <TeamChip team={team} size="sm" />
                <span className="eval__pts" data-testid="eval-points">{pts} {pts === 1 ? 'ponto' : 'pontos'}</span>
              </div>
              <div className="eval__guess">
                {g ? (<><span><b>Ano:</b> {g.ano || '—'}</span><span><b>Música:</b> {g.titulo || '—'}</span><span><b>Artista:</b> {g.artista || '—'}</span></>) : <span className="muted">Sem palpite registrado</span>}
              </div>
              <div className="eval__checks">
                <Check on={ev.titulo} label="Música" onClick={() => matchActions.setEval(turn.id, id, { titulo: !ev.titulo })} testId="check-titulo" />
                <Check on={ev.artista} label="Artista/musical" onClick={() => matchActions.setEval(turn.id, id, { artista: !ev.artista })} testId="check-artista" />
                <Check on={ev.ano} label="Ano" onClick={() => matchActions.setEval(turn.id, id, { ano: !ev.ano })} testId="check-ano" />
              </div>
              {ev.concluida ? (
                <div className="eval__done">
                  <span>✔ Avaliação concluída — {pts} {pts === 1 ? 'ponto somado' : 'pontos somados'} ao placar{ev.manual ? ' (com correção manual)' : ''}.</span>
                  <button className="link-btn" onClick={() => matchActions.confirmEval(turn.id, id, false)}>Reabrir</button>
                </div>
              ) : (
                <button className="btn btn--primary" onClick={() => matchActions.confirmEval(turn.id, id)} data-testid="eval-confirm">
                  Concluir avaliação (+{pts})
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────────────────── Placar ───────────────────────── */

export function Scoreboard({ match, compact, showRound = true }: { match: Match; compact?: boolean; showRound?: boolean }) {
  const rows = computeScores(match);
  const leader = rows[0]?.total > 0 ? rows[0].total : null;
  return (
    <div className={`board ${compact ? 'board--compact' : ''}`} data-testid="scoreboard">
      {rows.map((r) => {
        const isLeader = leader !== null && r.total === leader;
        return (
          <div key={r.team.id} className={`board__row ${isLeader ? 'is-leader' : ''}`} style={{ ['--team' as string]: r.team.cor }} data-testid="board-row">
            <span className="board__pos">{isLeader ? '👑' : `${r.posicao}º`}</span>
            <span className="board__avatar">{r.team.emoji}</span>
            <span className="board__name">
              {r.team.nome}
              {!compact && <small className="muted">{r.acertos} acerto{r.acertos === 1 ? '' : 's'} · 🎵{r.acertosTitulo} 🎤{r.acertosArtista} 📅{r.acertosAno}{r.ajustes ? ` · ajuste ${r.ajustes > 0 ? '+' : ''}${r.ajustes}` : ''}</small>}
            </span>
            {showRound && <span className={`board__round ${r.rodadaAtual ? 'is-pos' : ''}`} title="Pontos nesta rodada">+{r.rodadaAtual}</span>}
            <span className="board__total" data-testid="board-total">{r.total}</span>
          </div>
        );
      })}
    </div>
  );
}

export function turnPoints(turn: Turn, teamId: string) { return pointsOf(turn.evals[teamId]); }
