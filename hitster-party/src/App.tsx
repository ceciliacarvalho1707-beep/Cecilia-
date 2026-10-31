import { useEffect } from 'react';
import { FeedbackProvider } from './components/feedback';
import { useRoute } from './router';
import { Admin } from './screens/Admin';
import { Game } from './screens/Game';
import { History } from './screens/History';
import { Home } from './screens/Home';
import { RankingScreen, ScoreScreen } from './screens/ScoreScreens';
import { SettingsScreen } from './screens/Settings';
import { Setup } from './screens/Setup';
import { Tv } from './screens/Tv';
import { Equipe } from './screens/Equipe';
import { OrganizerSyncBridge } from './components/sync';
import { getSaveError, useAppState } from './store/store';

export default function App() {
  const route = useRoute();
  const reduzir = useAppState((s) => s.settings.reduzirAnimacoes);
  useAppState((s) => s); // re-render para exibir erro de gravação, se houver
  const saveError = getSaveError();

  useEffect(() => { document.documentElement.classList.toggle('reduce-motion', reduzir); }, [reduzir]);

  return (
    <FeedbackProvider>
      {/* Só as telas do organizador publicam o estado público (evita que uma TV com dados antigos sobrescreva a partida). */}
      {['jogo', 'placar', 'historico', 'admin', 'classificacao', 'vitoria', 'nova'].includes(route) && <OrganizerSyncBridge />}
      <div className="app" key={route}>
        {saveError && <p className="notice notice--error">{saveError}</p>}
        {route === 'home' && <Home />}
        {route === 'nova' && <Setup />}
        {route === 'jogo' && <Game />}
        {route === 'placar' && <ScoreScreen />}
        {route === 'classificacao' && <RankingScreen />}
        {route === 'vitoria' && <RankingScreen victory />}
        {route === 'historico' && <History />}
        {route === 'config' && <SettingsScreen />}
        {route === 'admin' && <Admin />}
        {route === 'tv' && <Tv />}
        {route === 'equipe' && <Equipe />}
      </div>
    </FeedbackProvider>
  );
}
