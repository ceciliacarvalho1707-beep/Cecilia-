import { usePublicState } from '../components/sync';
import { DIF_LABEL, Equalizer, Logo, Vinyl } from '../components/ui';
import type { PublicScore } from '../lib/sync';
import { navigate } from '../router';
import { useWakeLock } from '../lib/app';
import type { Dificuldade } from '../types';

export function PublicBoard({ placar, compact }: { placar: PublicScore[]; compact?: boolean }) {
  const lider = placar[0]?.total > 0 ? placar[0].total : null;
  return (
    <div className={`board ${compact ? 'board--compact' : ''}`} data-testid="public-board">
      {placar.map((r) => {
        const isLeader = lider !== null && r.total === lider;
        return (
          <div key={r.id} className={`board__row ${isLeader ? 'is-leader' : ''}`} style={{ ['--team' as string]: r.cor }}>
            <span className="board__pos">{isLeader ? '👑' : `${r.posicao}º`}</span>
            <span className="board__avatar">{r.emoji}</span>
            <span className="board__name">{r.nome}{!compact && <small className="muted">{r.acertos} acerto{r.acertos === 1 ? '' : 's'}</small>}</span>
            <span className={`board__round ${r.rodada ? 'is-pos' : ''}`}>+{r.rodada}</span>
            <span className="board__total">{r.total}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * TELA DA TV — pode rodar em outro aparelho.
 * Ela recebe só o estado público publicado pelo celular do organizador:
 * não tem acesso ao banco de músicas nem ao gabarito (a resposta só chega quando o organizador libera).
 */
export function Tv() {
  const { state, carregando, kind } = usePublicState();
  useWakeLock(true);
  const voltar = <button className="btn btn--ghost btn--sm" onClick={() => navigate('home')}>← Sair da TV</button>;

  if (!state || state.status === 'sem_partida') {
    return (
      <main className="tv tv--idle" data-testid="tv">
        <Logo size="lg" />
        <p className="tv__msg">{carregando ? 'Conectando…' : 'Esperando o organizador começar a partida'} <Equalizer /></p>
        <p className="muted center tv__hint">
          {kind === 'nuvem'
            ? 'Esta tela atualiza sozinha assim que o celular do organizador iniciar o jogo.'
            : 'Modo local: abra o jogo do organizador neste mesmo navegador (outra aba ou janela) para esta tela acompanhar.'}
        </p>
        {voltar}
      </main>
    );
  }

  if (state.status === 'encerrada') {
    const top = (state.placar ?? []).filter((r) => r.posicao === 1);
    return (
      <main className="tv" data-testid="tv">
        <div className="tv__top">{voltar}<Logo size="sm" /><span /></div>
        <h1 className="tv__title">🏆 {top.length > 1 ? `Empate entre ${top.map((t) => t.nome).join(' e ')}!` : `${top[0]?.emoji ?? ''} ${top[0]?.nome ?? ''} venceu!`}</h1>
        <div className="tv__board"><PublicBoard placar={state.placar ?? []} /></div>
      </main>
    );
  }

  const vez = state.vez ?? [];
  const equipesDoTurno = state.modo === 'turno' ? vez : state.equipes ?? [];
  return (
    <main className="tv" data-testid="tv">
      <div className="tv__top">{voltar}<Logo size="sm" /><span className="tv__round">RODADA {state.rodada}{state.totalRodadas ? ` / ${state.totalRodadas}` : ''}</span></div>
      <div className="tv__grid">
        <section className="tv__stage">
          {state.modo === 'turno' && vez[0]
            ? <div className="turn-banner turn-banner--tv" style={{ ['--team' as string]: vez[0].cor }}><span className="turn-banner__emoji">{vez[0].emoji}</span><span>É A VEZ DA <strong>{vez[0].nome.toUpperCase()}</strong>!</span></div>
            : <div className="turn-banner turn-banner--tv turn-banner--all"><span className="turn-banner__emoji">🎉</span><span>TODAS AS EQUIPES RESPONDEM!</span></div>}
          <div className="tv__card">
            <Vinyl />
            <div>
              {state.dificuldade && <span className={`dif dif--${state.dificuldade}`}>{DIF_LABEL[state.dificuldade as Dificuldade]}</span>}
              <p className="tv__cat">Categoria: <strong>{state.categoria}</strong></p>
              <p className="muted">Valendo: ano · nome da música · artista (ou musical)</p>
            </div>
          </div>
          <div className="tv__status">
            {equipesDoTurno.map((t) => {
              const ok = state.respondeu?.includes(t.id);
              return <span key={t.id} className={`tv__pill ${ok ? 'is-done' : ''}`} style={{ ['--team' as string]: t.cor }}>{t.emoji} {t.nome} {ok ? '✔ respondeu' : '… pensando'}</span>;
            })}
          </div>
          {state.resposta ? (
            <div className="tv__answer" data-testid="tv-answer">
              <span className="muted">A música era…</span>
              <strong>{state.resposta.titulo}</strong>
              <span>{state.resposta.musical ? `${state.resposta.musical} · ${state.resposta.artista}` : state.resposta.artista} · {state.resposta.ano}</span>
            </div>
          ) : <p className="tv__msg">{state.gabaritoAberto ? '🔐 O organizador está conferindo as respostas…' : '🎧 Ouçam com atenção!'}</p>}
        </section>
        <aside className="tv__board"><h2>Placar</h2><PublicBoard placar={state.placar ?? []} compact /></aside>
      </div>
    </main>
  );
}
