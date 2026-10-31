import { useSyncExternalStore } from 'react';

/** Roteador mínimo baseado em hash (#/rota): funciona em qualquer hospedagem estática e preserva a tela ao recarregar. */
export type Route = 'home' | 'nova' | 'jogo' | 'placar' | 'classificacao' | 'historico' | 'vitoria' | 'config' | 'admin' | 'tv';

const ROUTES: Route[] = ['home', 'nova', 'jogo', 'placar', 'classificacao', 'historico', 'vitoria', 'config', 'admin', 'tv'];

function parse(): Route {
  const h = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return (ROUTES as string[]).includes(h) ? (h as Route) : 'home';
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, parse, () => 'home' as Route);
}

export function navigate(route: Route) {
  const target = route === 'home' ? '#/' : `#/${route}`;
  if (window.location.hash !== target) window.location.hash = target;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
