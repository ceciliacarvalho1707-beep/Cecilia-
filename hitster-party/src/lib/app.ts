/** Recursos de "app de celular": instalação (PWA), funcionamento offline e tela sempre acesa. */
import { useEffect, useState } from 'react';
import { insideClaudeArtifact } from './spotifyApi';

/** Registra o service worker (fora do claude.ai, onde não é permitido). */
export function registerServiceWorker() {
  if (insideClaudeArtifact() || !('serviceWorker' in navigator) || !window.isSecureContext) return;
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => undefined); });
}

interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
let deferred: BeforeInstallPromptEvent | null = null;
const subs = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BeforeInstallPromptEvent; subs.forEach((f) => f()); });
  window.addEventListener('appinstalled', () => { deferred = null; subs.forEach((f) => f()); });
}

export function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}
export function isIOS(): boolean { return /iphone|ipad|ipod/i.test(navigator.userAgent); }

/** Estado da instalação: pode instalar direto (Android/PC), precisa de instruções (iPhone) ou já é app. */
export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force((n) => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  return {
    instalado: isStandalone(),
    podeInstalar: !!deferred,
    dentroDoClaude: insideClaudeArtifact(),
    async instalar(): Promise<boolean> {
      if (!deferred) return false;
      await deferred.prompt();
      const r = await deferred.userChoice; deferred = null; subs.forEach((f) => f());
      return r.outcome === 'accepted';
    },
  };
}

/** Mantém a tela acesa enquanto a tela do jogo está aberta (quando o navegador permite). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    type Lock = { release(): Promise<void> };
    const wl = (navigator as unknown as { wakeLock?: { request(t: 'screen'): Promise<Lock> } }).wakeLock;
    if (!wl) return;
    let lock: Lock | null = null;
    const pedir = () => { if (document.visibilityState === 'visible') wl.request('screen').then((l) => { lock = l; }).catch(() => undefined); };
    pedir();
    document.addEventListener('visibilitychange', pedir);
    return () => { document.removeEventListener('visibilitychange', pedir); lock?.release().catch(() => undefined); };
  }, [active]);
}
