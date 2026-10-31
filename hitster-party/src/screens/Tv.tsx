import { Scoreboard } from '../components/game';
import { DifficultyBadge, Equalizer, Logo, Vinyl } from '../components/ui';
import { navigate } from '../router';
import { computeScores } from '../lib/scoring';
import { currentRound, currentTurn, songById, useAppState } from '../store/store';

/**
 * TELA PÚBLICA (Modo TV) — abra em outra aba/janela e espelhe na TV.
 * Atualiza sozinha (evento "storage"). Não tem botão do Spotify nem campos de resposta.
 * A resposta só é renderizada quando o organizador ativa "Mostrar a resposta também na tela da TV".
 */
export function Tv() {
  const match = useAppState((s) => s.match);
  useAppState((s) => s.songs);

  if (!match) {
    return <main className="tv tv--idle"><Logo size="lg" /><p className="tv__msg">Aguardando o início da partida… <Equalizer /></p></main>;
  }
  if (match.status === 'encerrada') {
    const rows = computeScores(match);
    const top = rows.filter((r) => r.posicao === 1);
    return (
      <main className="tv">
        <Logo />
        <h1 className="tv__title">🏆 {top.length > 1 ? 'EMPATE!' : `${top[0]?.team.emoji ?? ''} ${top[0]?.team.nome ?? ''} VENCEU!`}</h1>
        <div className="tv__board"><Scoreboard match={match} showRound={false} /></div>
      </main>
    );
  }

  const round = currentRound(match)!;
  const turn = currentTurn(match)!;
  const song = songById(turn.songId);
  const teams = turn.teamIds.map((id) => match.teams.find((t) => t.id === id)!).filter(Boolean);

  return (
    <main className="tv" data-testid="tv">
      <div className="tv__top"><button className="btn btn--ghost btn--sm" onClick={() => navigate('jogo')}>← Organizador</button><Logo size="sm" /><span className="tv__round">RODADA {round.numero}{match.config.totalRodadas ? ` / ${match.config.totalRodadas}` : ''}</span></div>
      <div className="tv__grid">
        <section className="tv__stage">
          {match.config.modo === 'turno' && teams[0]
            ? <div className="turn-banner turn-banner--tv" style={{ ['--team' as string]: teams[0].cor }}><span className="turn-banner__emoji">{teams[0].emoji}</span><span>É A VEZ DA <strong>{teams[0].nome.toUpperCase()}</strong>!</span></div>
            : <div className="turn-banner turn-banner--tv turn-banner--all"><span className="turn-banner__emoji">🎉</span><span>TODAS AS EQUIPES RESPONDEM!</span></div>}
          <div className="tv__card">
            <Vinyl />
            <div>
              {song && <DifficultyBadge value={song.dificuldade} />}
              <p className="tv__cat">Categoria: <strong>{song?.genero}</strong></p>
              <p className="muted">Ano · Música · Artista (ou musical)</p>
            </div>
          </div>
          <div className="tv__status">
            {teams.map((t) => (
              <span key={t.id} className={`tv__pill ${turn.guesses[t.id] ? 'is-done' : ''}`} style={{ ['--team' as string]: t.cor }}>
                {t.emoji} {t.nome} {turn.guesses[t.id] ? '✔' : '…'}
              </span>
            ))}
          </div>
          {turn.publicReveal && song ? (
            <div className="tv__answer" data-testid="tv-answer">
              <span className="muted">A resposta era…</span>
              <strong>{song.titulo}</strong>
              <span>{song.musical ? `${song.musical} · ${song.artista}` : song.artista} · {song.ano}</span>
            </div>
          ) : <p className="tv__msg">{turn.revealed ? '🔐 O organizador está conferindo as respostas…' : '🎧 Ouçam com atenção!'}</p>}
        </section>
        <aside className="tv__board"><h2>Placar</h2><Scoreboard match={match} compact /></aside>
      </div>
    </main>
  );
}
