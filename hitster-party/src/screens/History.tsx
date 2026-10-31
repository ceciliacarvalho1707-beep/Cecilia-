import { useState } from 'react';
import { useFeedback } from '../components/feedback';
import { Scoreboard } from '../components/game';
import { DifficultyBadge, TeamChip, TopBar } from '../components/ui';
import { exportScoreCsv } from '../lib/export';
import { computeScores, pointsOf } from '../lib/scoring';
import { historyActions, matchActions, songById, useAppState } from '../store/store';
import { navigate } from '../router';
import type { Match, Song } from '../types';

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '');

/**
 * Lista de rodadas/turnos com os palpites e a avaliação de cada equipe.
 * Músicas de turnos ainda não revelados aparecem como "🔒 oculto" (sigilo).
 */
function RoundsTable({ match, songOf, editable }: { match: Match; songOf: (id: string) => Song | undefined; editable: boolean }) {
  return (
    <div className="history">
      {match.rounds.map((round, ri) => (
        <details key={round.numero} className="history__round" open={editable && ri === match.cursor.round}>
          <summary>
            <strong>Rodada {round.numero}</strong>
            <span className="muted small">{round.turns.length} turno{round.turns.length === 1 ? '' : 's'}</span>
          </summary>
          {round.turns.map((turn, ti) => {
            const song = songOf(turn.songId);
            const visivel = turn.revealed || Object.keys(turn.evals).length > 0;
            return (
              <div key={turn.id} className="history__turn">
                <div className="history__song">
                  {visivel && song ? (
                    <>
                      <span>🎵 <strong>{song.titulo}</strong> — {song.musical ? `${song.musical} (${song.artista})` : song.artista} · {song.ano}</span>
                      <DifficultyBadge value={song.dificuldade} />
                    </>
                  ) : <span className="muted">🔒 Música oculta — o gabarito deste turno ainda não foi revelado.</span>}
                  {editable && <button className="link-btn" onClick={() => { matchActions.goTo(ri, ti); navigate('jogo'); }}>Abrir turno ↗</button>}
                </div>
                <table className="history__table">
                  <thead><tr><th>Equipe</th><th>Palpite</th><th>Música</th><th>Artista</th><th>Ano</th><th>Pts</th></tr></thead>
                  <tbody>
                    {turn.teamIds.map((id) => {
                      const team = match.teams.find((t) => t.id === id);
                      const g = turn.guesses[id];
                      const ev = turn.evals[id];
                      const cell = (field: 'titulo' | 'artista' | 'ano') => {
                        const on = !!ev?.[field];
                        if (!editable || !ev) return <td className={on ? 'yes' : 'no'}>{ev ? (on ? '✔' : '✘') : '—'}</td>;
                        return (
                          <td>
                            <button className={`mini-check ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => matchActions.setEval(turn.id, id, { [field]: !on })} title="Tocar para corrigir">{on ? '✔' : '✘'}</button>
                          </td>
                        );
                      };
                      return (
                        <tr key={id}>
                          <td>{team ? <TeamChip team={team} size="sm" /> : '?'}</td>
                          <td className="small">{visivel ? (g ? `${g.ano || '—'} · ${g.titulo || '—'} · ${g.artista || '—'}` : 'sem palpite') : (g ? '🔒 registrado' : '—')}</td>
                          {cell('titulo')}{cell('artista')}{cell('ano')}
                          <td><strong>{pointsOf(ev)}</strong>{ev && !ev.concluida && <small className="muted"> (pendente)</small>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </details>
      ))}
    </div>
  );
}

export function History() {
  const match = useAppState((s) => s.match);
  const history = useAppState((s) => s.history);
  const { confirm } = useFeedback();
  const [aberta, setAberta] = useState<string | null>(null);
  const passadas = history.filter((h) => h.match.id !== match?.id);

  return (
    <main className="page">
      <TopBar back={match?.status === 'em_andamento' ? 'jogo' : 'home'} />
      <h1 className="page__title">📜 Histórico das rodadas</h1>

      {match ? (
        <section className="card">
          <h2 className="card__title">{match.status === 'em_andamento' ? 'Partida atual' : 'Última partida'} <span className="pill">{fmt(match.criadaEm)}</span></h2>
          <p className="muted small">Toque em ✔/✘ para corrigir qualquer item. O placar é recalculado na hora, sem duplicar pontos.</p>
          <RoundsTable match={match} songOf={songById} editable />
        </section>
      ) : <p className="muted center">Nenhuma partida atual.</p>}

      <section className="card">
        <h2 className="card__title">Partidas anteriores <span className="pill">{passadas.length}</span></h2>
        {passadas.length === 0 && <p className="muted">As partidas encerradas aparecem aqui.</p>}
        <ul className="past-list">
          {passadas.map(({ match: m, songs }) => {
            const rows = computeScores(m);
            const vencedores = rows.filter((r) => r.posicao === 1);
            return (
              <li key={m.id} className="past">
                <div className="past__head">
                  <div>
                    <strong>{fmt(m.encerradaEm ?? m.criadaEm)}</strong>
                    <span className="muted small"> · {m.rounds.length} rodada{m.rounds.length === 1 ? '' : 's'} · {m.teams.length} equipes</span>
                    <div className="small">🏆 {vencedores.map((v) => `${v.team.emoji} ${v.team.nome}`).join(' / ')} — {vencedores[0]?.total ?? 0} pts</div>
                  </div>
                  <div className="row">
                    <button className="btn btn--ghost btn--sm" onClick={() => setAberta(aberta === m.id ? null : m.id)}>{aberta === m.id ? 'Fechar' : 'Detalhes'}</button>
                    <button className="btn btn--ghost btn--sm" onClick={() => exportScoreCsv(m, (id) => songs[id])}>⬇️ CSV</button>
                    <button className="icon-btn icon-btn--danger" aria-label="Apagar do histórico" onClick={async () => {
                      if (await confirm({ titulo: 'Apagar do histórico?', mensagem: 'Esta partida será removida permanentemente.', confirmar: 'Apagar', perigo: true })) historyActions.remove(m.id);
                    }}>🗑</button>
                  </div>
                </div>
                {aberta === m.id && (<><Scoreboard match={m} compact showRound={false} /><RoundsTable match={m} songOf={(id) => songs[id]} editable={false} /></>)}
              </li>
            );
          })}
        </ul>
        {passadas.length > 0 && (
          <button className="btn btn--danger-ghost btn--sm" onClick={async () => {
            if (await confirm({ titulo: 'Limpar todo o histórico?', mensagem: 'Todas as partidas anteriores serão apagadas. Esta ação não pode ser desfeita.', confirmar: 'Apagar tudo', perigo: true })) historyActions.clear();
          }}>Limpar histórico</button>
        )}
      </section>
    </main>
  );
}
