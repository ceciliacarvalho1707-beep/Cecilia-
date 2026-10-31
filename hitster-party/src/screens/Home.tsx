import { useFeedback } from '../components/feedback';
import { Equalizer, Logo } from '../components/ui';
import { navigate } from '../router';
import { useAppState } from '../store/store';

export function Home() {
  const match = useAppState((s) => s.match);
  const nSongs = useAppState((s) => s.songs.length);
  const { toast } = useFeedback();
  const emAndamento = match?.status === 'em_andamento';

  return (
    <main className="home">
      <div className="home__bg" aria-hidden>
        <span className="note n1">♪</span><span className="note n2">♫</span><span className="note n3">♬</span><span className="note n4">♩</span>
      </div>
      <div className="home__hero">
        <Logo size="lg" />
        <p className="home__tagline">Ouça. Adivinhe. Pontue. <Equalizer /></p>
        <p className="muted home__sub">O jogo de adivinhação musical para festas — várias equipes, um único celular ou TV.</p>
      </div>

      <nav className="home__menu">
        <button className="btn btn--hero" onClick={() => navigate('nova')} data-testid="btn-nova">🎵 NOVA PARTIDA</button>
        <button className="btn btn--menu" onClick={() => (match ? navigate(match.status === 'encerrada' ? 'vitoria' : 'jogo') : toast('Nenhuma partida salva para continuar.', 'info'))} disabled={!match} data-testid="btn-continuar">
          ▶ CONTINUAR PARTIDA
          {match && <small>{emAndamento ? `Rodada ${match.cursor.round + 1}${match.config.totalRodadas ? ` de ${match.config.totalRodadas}` : ''} · ${match.teams.length} equipes` : 'Partida encerrada — ver resultado'}</small>}
        </button>
        <button className="btn btn--menu" onClick={() => navigate('placar')} data-testid="btn-placar">🏆 PLACAR GERAL</button>
        <button className="btn btn--menu" onClick={() => navigate('config')} data-testid="btn-config">⚙️ CONFIGURAÇÕES</button>
      </nav>

      <div className="home__footer">
        <button className="link-btn" onClick={() => navigate('admin')}>🔑 Área do organizador</button>
        <span className="muted">·</span>
        <button className="link-btn" onClick={() => navigate('historico')}>📜 Histórico</button>
        <span className="muted">·</span>
        <button className="link-btn" onClick={() => window.open(`${window.location.pathname}#/tv`, '_blank')}>📺 Abrir tela da TV</button>
        <p className="muted small">{nSongs} músicas no banco</p>
      </div>
    </main>
  );
}
