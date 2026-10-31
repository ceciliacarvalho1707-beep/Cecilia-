import { useState } from 'react';
import { Modal, useFeedback } from '../components/feedback';
import { Scoreboard } from '../components/game';
import { Redirect, TeamChip, TopBar, Vinyl } from '../components/ui';
import { exportScoreCsv, exportScoreJson, scoreText } from '../lib/export';
import { computeScores } from '../lib/scoring';
import { navigate } from '../router';
import { matchActions, songById, useAppState } from '../store/store';
import type { Match } from '../types';

/* ───────────────────────── Placar geral (com ações) ───────────────────────── */

export function ScoreScreen() {
  const match = useAppState((s) => s.match);
  const { confirm, toast } = useFeedback();
  const [ajuste, setAjuste] = useState(false);

  if (!match) {
    return (
      <main className="page"><TopBar />
        <div className="empty"><Vinyl /><h2>Nenhuma partida no placar</h2><p className="muted">Comece uma nova partida ou consulte o histórico de partidas anteriores.</p>
          <div className="row row--center"><button className="btn btn--primary" onClick={() => navigate('nova')}>🎵 Nova partida</button><button className="btn btn--ghost" onClick={() => navigate('historico')}>📜 Histórico</button></div>
        </div>
      </main>
    );
  }

  const copiar = async () => {
    try { await navigator.clipboard.writeText(scoreText(match)); toast('Placar copiado!'); } catch { toast('Não foi possível copiar automaticamente.', 'erro'); }
  };

  return (
    <main className="page">
      <TopBar back={match.status === 'em_andamento' ? 'jogo' : 'home'} />
      <h1 className="page__title">🏆 Placar acumulado</h1>
      <p className="muted center">{match.status === 'em_andamento' ? `Rodada ${match.cursor.round + 1}${match.config.totalRodadas ? ` de ${match.config.totalRodadas}` : ''}` : 'Partida encerrada'} · coluna “+” = pontos na rodada atual</p>

      <section className="card"><Scoreboard match={match} /></section>

      <section className="card">
        <h2 className="card__title">Ações</h2>
        <div className="action-grid">
          {match.status === 'em_andamento' && <button className="btn btn--primary" onClick={() => navigate('jogo')}>▶ Voltar ao jogo</button>}
          <button className="btn btn--ghost" onClick={() => navigate('classificacao')} data-testid="btn-classificacao">🥇 Tela de classificação</button>
          <button className="btn btn--ghost" onClick={() => navigate('historico')} data-testid="btn-historico">📜 Ver histórico</button>
          <button className="btn btn--ghost" onClick={() => setAjuste(true)} data-testid="btn-corrigir">✏️ Corrigir pontuações</button>
          <button className="btn btn--ghost" onClick={() => exportScoreCsv(match, songById)} data-testid="btn-export-csv">⬇️ Exportar placar (CSV)</button>
          <button className="btn btn--ghost" onClick={() => exportScoreJson(match)}>⬇️ Exportar partida (JSON)</button>
          <button className="btn btn--ghost" onClick={copiar}>📋 Copiar placar (texto)</button>
          {match.status === 'em_andamento' && (
            <button className="btn btn--ghost" onClick={async () => {
              if (await confirm({ titulo: 'Encerrar partida?', mensagem: 'A partida será finalizada e guardada no histórico.', confirmar: 'Encerrar', perigo: true })) { matchActions.finish(); navigate('vitoria'); }
            }}>🏁 Encerrar partida</button>
          )}
          <button className="btn btn--danger-ghost" onClick={async () => {
            if (await confirm({ titulo: 'Reiniciar a partida?', mensagem: 'Todos os pontos, palpites e rodadas desta partida serão APAGADOS. As equipes e as configurações serão mantidas.', confirmar: 'Apagar e reiniciar', perigo: true })) {
              const r = matchActions.restart(); if (r.ok) { toast('Partida reiniciada.'); navigate('jogo'); } else toast(r.erro, 'erro');
            }
          }} data-testid="btn-reiniciar">🔁 Reiniciar partida</button>
          <button className="btn btn--danger-ghost" onClick={async () => {
            if (await confirm({ titulo: 'Apagar a partida?', mensagem: 'A partida atual será apagada definitivamente (partidas encerradas continuam no histórico).', confirmar: 'Apagar', perigo: true })) { matchActions.discard(); navigate('home'); }
          }}>🗑 Apagar partida</button>
        </div>
      </section>

      <AdjustmentsModal open={ajuste} onClose={() => setAjuste(false)} match={match} />
    </main>
  );
}

/** Ajustes manuais de pontos (bônus/penalidade). Cada ajuste é um registro único → sem duplicação. */
function AdjustmentsModal({ open, onClose, match }: { open: boolean; onClose: () => void; match: Match }) {
  const { toast } = useFeedback();
  const [teamId, setTeamId] = useState(match.teams[0]?.id ?? '');
  const [pontos, setPontos] = useState('1');
  const [motivo, setMotivo] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="✏️ Corrigir pontuações" wide>
      <p className="muted small" style={{ marginTop: 0 }}>
        Para corrigir <b>música, artista ou ano</b> de um turno específico, use o <button className="link-btn" onClick={() => { onClose(); navigate('historico'); }}>Histórico das rodadas</button> — basta tocar no item para marcar/desmarcar.
        Aqui você adiciona um ajuste avulso (bônus ou penalidade) com motivo.
      </p>
      <form className="adj-form" onSubmit={(e) => {
        e.preventDefault();
        const n = parseInt(pontos, 10);
        if (!Number.isFinite(n) || n === 0) { toast('Informe um número diferente de zero.', 'erro'); return; }
        matchActions.addAdjustment(teamId, n, motivo);
        setMotivo(''); toast('Ajuste registrado.');
      }}>
        <label className="field"><span>Equipe</span>
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>{match.teams.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.nome}</option>)}</select>
        </label>
        <label className="field"><span>Pontos (+/−)</span><input type="number" value={pontos} onChange={(e) => setPontos(e.target.value)} data-testid="adj-pontos" /></label>
        <label className="field field--grow"><span>Motivo</span><input value={motivo} placeholder="Ex.: versão alternativa aceita" onChange={(e) => setMotivo(e.target.value)} /></label>
        <button className="btn btn--primary" type="submit" data-testid="adj-add">Adicionar ajuste</button>
      </form>
      {match.adjustments.length > 0 && (
        <ul className="adj-list">
          {match.adjustments.map((a) => {
            const t = match.teams.find((x) => x.id === a.teamId);
            return (
              <li key={a.id}>
                {t && <TeamChip team={t} size="sm" />}
                <strong className={a.pontos > 0 ? 'pos' : 'neg'}>{a.pontos > 0 ? '+' : ''}{a.pontos}</strong>
                <span className="muted">{a.motivo}</span>
                <button className="icon-btn icon-btn--danger" onClick={() => matchActions.removeAdjustment(a.id)} aria-label="Remover ajuste">🗑</button>
              </li>
            );
          })}
        </ul>
      )}
      <Scoreboard match={match} compact showRound={false} />
    </Modal>
  );
}

/* ───────────────────────── Classificação / Vitória ───────────────────────── */

export function RankingScreen({ victory }: { victory?: boolean }) {
  const match = useAppState((s) => s.match);
  if (!match) return <Redirect to="home" />;
  const rows = computeScores(match);
  const top = rows.filter((r) => r.posicao === 1);
  const podium = [rows.find((r) => r.posicao === 2), top[0], rows.find((r) => r.posicao === 3)];
  const empate = top.length > 1;

  return (
    <main className={`page ranking ${victory ? 'ranking--victory' : ''}`}>
      {victory && <div className="confetti" aria-hidden>{Array.from({ length: 40 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 10) * 0.35}s`, background: ['#a855f7', '#22d3ee', '#ec4899', '#f59e0b', '#3b82f6'][i % 5] }} />)}</div>}
      <TopBar back={victory ? 'home' : 'placar'} />
      <h1 className="page__title">{victory ? '🏆 FIM DE JOGO!' : '🥇 Classificação'}</h1>

      {top[0] && top[0].total > 0 ? (
        <div className="winner" style={{ ['--team' as string]: top[0].team.cor }} data-testid="winner">
          <span className="winner__crown">👑</span>
          <span className="winner__emoji">{empate ? '🤝' : top[0].team.emoji}</span>
          <h2>{empate ? `Empate: ${top.map((t) => t.team.nome).join(' e ')}` : top[0].team.nome}</h2>
          <p>{top[0].total} pontos{victory ? (empate ? ' — vitória compartilhada!' : ' — campeã da noite!') : ''}</p>
        </div>
      ) : <p className="muted center">Ainda não há pontos. Jogue algumas rodadas!</p>}

      <div className="podium" aria-hidden={rows.length < 2}>
        {podium.map((r, i) => r && (
          <div key={r.team.id} className={`podium__col podium__col--${[2, 1, 3][i]}`} style={{ ['--team' as string]: r.team.cor, animationDelay: `${i * 0.15}s` }}>
            <span className="podium__emoji">{r.team.emoji}</span>
            <span className="podium__name">{r.team.nome}</span>
            <span className="podium__block"><b>{r.posicao}º</b><small>{r.total} pts</small></span>
          </div>
        ))}
      </div>

      <section className="card">
        <ol className="ranking__list">
          {rows.map((r, i) => (
            <li key={r.team.id} style={{ ['--team' as string]: r.team.cor, animationDelay: `${i * 0.06}s` }} className={r.posicao === 1 && r.total > 0 ? 'is-first' : ''}>
              <span className="ranking__pos">{r.posicao}º{rows.filter((x) => x.posicao === r.posicao).length > 1 && <small> (empate)</small>}</span>
              <TeamChip team={r.team} />
              <span className="muted small">{r.acertos} acertos</span>
              <strong>{r.total} pts</strong>
            </li>
          ))}
        </ol>
      </section>

      <div className="row row--center">
        {victory ? (
          <>
            <button className="btn btn--primary" onClick={() => navigate('nova')}>🎵 Nova partida</button>
            <button className="btn btn--ghost" onClick={() => navigate('placar')}>Placar e exportação</button>
            <button className="btn btn--ghost" onClick={() => navigate('historico')}>📜 Histórico</button>
          </>
        ) : (
          <button className="btn btn--primary" onClick={() => navigate(match.status === 'em_andamento' ? 'jogo' : 'home')}>{match.status === 'em_andamento' ? '▶ Voltar ao jogo' : 'Início'}</button>
        )}
      </div>
    </main>
  );
}
