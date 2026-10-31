import { useFeedback } from '../components/feedback';
import { Equalizer, Logo } from '../components/ui';
import { navigate } from '../router';
import { useAppState } from '../store/store';
import { useTransportKind } from '../components/sync';

export function Home() {
  const match = useAppState((s) => s.match);
  const nSongs = useAppState((s) => s.songs.length);
  const { toast } = useFeedback();
  const emAndamento = match?.status === 'em_andamento';
  const kind = useTransportKind();

  return (
    <main className="home">
      <div className="home__bg" aria-hidden>
        <span className="note n1">♪</span><span className="note n2">♫</span><span className="note n3">♬</span><span className="note n4">♩</span>
      </div>
      <div className="home__hero">
        <Logo size="lg" />
        <p className="home__tagline">Ouça. Adivinhe. Pontue. <Equalizer /></p>
        <p className="muted home__sub">Junte a galera, separe as equipes e descubra quem manja mais de música. Funciona num celular só ou com TV e celulares.</p>
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

      <section className="devices" aria-labelledby="devices-title">
        <h2 id="devices-title">Vai usar mais de um aparelho?</h2>
        <p className="muted small">Abra este mesmo jogo em cada aparelho e diga qual é o papel dele. Só o celular do organizador vê as respostas.</p>
        <div className="devices__grid">
          <button className="device" onClick={() => navigate('jogo')}>
            <span className="device__icon">📱</span><strong>Celular do organizador</strong><small>Toca a música, abre o gabarito e dá os pontos.</small>
          </button>
          <button className="device" onClick={() => navigate('tv')} data-testid="mode-tv">
            <span className="device__icon">📺</span><strong>Tela da TV</strong><small>Mostra a rodada, de quem é a vez e o placar. Sem spoiler.</small>
          </button>
          <button className="device" onClick={() => navigate('equipe')} data-testid="mode-equipe">
            <span className="device__icon">🙋</span><strong>Celular de equipe</strong><small>A equipe manda o palpite do próprio celular.</small>
          </button>
        </div>
        <p className="muted small">{kind === 'nuvem' ? '🟢 Sincronização entre aparelhos ligada.' : kind === 'local' ? '🟡 Sincronização local: funciona entre abas e janelas deste navegador. Para aparelhos diferentes, use a versão publicada no claude.ai.' : ''}</p>
      </section>

      <div className="home__footer">
        <button className="link-btn" onClick={() => navigate('admin')}>🔑 Área do organizador</button>
        <span className="muted">·</span>
        <button className="link-btn" onClick={() => navigate('historico')}>📜 Histórico</button>
        <p className="muted small">{nSongs} músicas no banco</p>
      </div>
    </main>
  );
}
