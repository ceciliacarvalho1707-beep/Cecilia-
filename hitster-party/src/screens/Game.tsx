import { useFeedback } from '../components/feedback';
import { EvaluationPanel, GuessPanel, Scoreboard, SecretAnswerCard, SpotifyButton } from '../components/game';
import { DifficultyBadge, Equalizer, Redirect, TopBar, Vinyl } from '../components/ui';
import { navigate } from '../router';
import { currentRound, currentTurn, hasNextTeam, isLastRound, matchActions, songById, turnComplete, useAppState } from '../store/store';

export function Game() {
  const match = useAppState((s) => s.match);
  useAppState((s) => s.songs); // re-render se o gabarito for editado no painel
  const { toast, confirm } = useFeedback();

  if (!match) {
    return (
      <main className="page">
        <TopBar />
        <div className="empty">
          <Vinyl />
          <h2>Nenhuma partida em andamento</h2>
          <button className="btn btn--hero" onClick={() => navigate('nova')}>🎵 NOVA PARTIDA</button>
        </div>
      </main>
    );
  }
  if (match.status === 'encerrada') return <Redirect to="vitoria" />;

  const round = currentRound(match)!;
  const turn = currentTurn(match)!;
  const song = songById(turn.songId);
  const total = match.config.totalRodadas;
  const turnTeams = turn.teamIds.map((id) => match.teams.find((t) => t.id === id)!).filter(Boolean);
  const complete = turnComplete(turn);
  const proximaEquipe = hasNextTeam(match);
  const ultimo = isLastRound(match) && !proximaEquipe && match.cursor.turn + 1 >= round.turns.length;
  const isFirst = match.cursor.round === 0 && match.cursor.turn === 0;
  const isPast = match.cursor.round < match.rounds.length - 1 || match.cursor.turn < round.turns.length - 1;

  const avancar = async () => {
    const r = matchActions.next();
    if (!r.ok) { toast(r.erro, 'erro'); return; }
    if ('fim' in r && r.fim) {
      const ok = await confirm({ titulo: 'Fim da partida! 🏁', mensagem: 'Todas as rodadas foram jogadas. Encerrar a partida e ver a classificação final?', confirmar: 'Ver resultado' });
      if (ok) { matchActions.finish(); navigate('vitoria'); }
    }
  };

  const nextLabel = isPast ? 'AVANÇAR ▶' : proximaEquipe ? 'PRÓXIMA EQUIPE ▶' : ultimo ? '🏁 VER RESULTADO FINAL' : 'PRÓXIMA RODADA ▶';
  const pendentes = turnTeams.filter((t) => !turn.evals[t.id]?.concluida);

  return (
    <main className="page page--game">
      <TopBar right={<button className="btn btn--ghost btn--sm" onClick={() => navigate('placar')} data-testid="go-placar">🏆 Placar</button>} />

      <div className="round-progress">
        <span className="round-progress__label" data-testid="round-label">RODADA {round.numero}{total ? ` / ${total}` : ' · ∞'}</span>
        {total && <span className="round-progress__bar"><i style={{ width: `${Math.min(100, (round.numero / total) * 100)}%` }} /></span>}
      </div>

      {match.config.modo === 'turno' && turnTeams[0] ? (
        <div className="turn-banner" style={{ ['--team' as string]: turnTeams[0].cor }} data-testid="turn-banner">
          <span className="turn-banner__emoji">{turnTeams[0].emoji}</span>
          <span>É A VEZ DA <strong>{turnTeams[0].nome.toUpperCase()}</strong>!</span>
        </div>
      ) : (
        <div className="turn-banner turn-banner--all" data-testid="turn-banner">
          <span className="turn-banner__emoji">🎉</span><span>TODAS AS EQUIPES RESPONDEM!</span>
        </div>
      )}

      {match.avisoRepeticao && <p className="notice">ℹ️ O banco não tem músicas inéditas suficientes para estes filtros: algumas músicas podem se repetir. Importe mais músicas na área do organizador.</p>}
      {isPast && <p className="notice">⏪ Você está revisando um turno anterior. Correções aqui atualizam o placar sem duplicar pontos.</p>}

      <div className="game-grid">
        <div className="game-main">
          {/* CARTÃO PÚBLICO: não contém título, artista, ano, capa ou qualquer dado secreto. */}
          <article className="round-card" data-testid="round-card">
            <div className="round-card__glow" aria-hidden />
            <div className="round-card__top">
              <span className="round-card__num">#{round.numero}{match.config.modo === 'turno' ? `.${match.cursor.turn + 1}` : ''}</span>
              {song && <DifficultyBadge value={song.dificuldade} />}
            </div>
            <div className="round-card__center">
              <Vinyl />
              <div>
                <p className="round-card__cat">Categoria: <strong>{song?.genero ?? '—'}</strong></p>
                <p className="round-card__inst">Ouça o trecho e descubra o <b>ano de lançamento</b>, o <b>nome da música</b> e o <b>artista, banda ou musical</b>. <Equalizer bars={4} /></p>
              </div>
            </div>
            {song ? <SpotifyButton url={song.spotifyUrl} /> : <p className="warn">Esta música foi removida do banco. Use “Trocar música”.</p>}
            {!turn.revealed && !Object.keys(turn.evals).length && (
              <button className="link-btn round-card__skip" onClick={async () => {
                const ok = await confirm({ titulo: 'Trocar a música?', mensagem: 'Use se o link não abrir ou se alguém já reconheceu a música. Uma nova faixa será sorteada para este turno.', confirmar: 'Sortear outra' });
                if (ok) { const r = matchActions.skipSong(); toast(r.ok ? 'Nova música sorteada.' : r.erro, r.ok ? 'ok' : 'erro'); }
              }}>🔄 Trocar música</button>
            )}
          </article>

          <GuessPanel turn={turn} match={match} />
          {song && <SecretAnswerCard turn={turn} song={song} match={match} />}
          <EvaluationPanel turn={turn} match={match} />

          <nav className="turn-nav">
            <button className="btn btn--ghost" onClick={() => { const r = matchActions.previous(); if (!r.ok) toast(r.erro, 'info'); }} disabled={isFirst} data-testid="btn-anterior">◀ Anterior</button>
            <button className="btn btn--primary btn--xl" onClick={avancar} disabled={!complete} data-testid="btn-proximo">{nextLabel}</button>
          </nav>
          {!complete && (
            <p className="muted small center">
              {!turn.revealed && !Object.keys(turn.evals).length
                ? 'Registre os palpites, revele o gabarito e conclua a avaliação para avançar.'
                : `Conclua a avaliação de: ${pendentes.map((t) => t.nome).join(', ')}.`}
            </p>
          )}
        </div>

        <aside className="game-side">
          <section className="card">
            <h3 className="section-title">🏆 Placar</h3>
            <Scoreboard match={match} compact />
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn btn--ghost btn--sm" onClick={() => navigate('placar')}>Ver placar completo</button>
              <button className="btn btn--ghost btn--sm" onClick={() => navigate('historico')}>Histórico</button>
            </div>
          </section>
          <section className="card">
            <h3 className="section-title">🎛️ Controle</h3>
            <div className="stack">
              <button className="btn btn--ghost btn--sm" onClick={() => navigate('tv')}>📺 Abrir tela pública (TV)</button>
              <button className="btn btn--ghost btn--sm" onClick={async () => {
                const ok = await confirm({ titulo: 'Encerrar partida?', mensagem: 'A partida será finalizada e enviada ao histórico. Você verá a classificação final.', confirmar: 'Encerrar', perigo: true });
                if (ok) { matchActions.finish(); navigate('vitoria'); }
              }} data-testid="btn-encerrar">🏁 Encerrar partida</button>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
