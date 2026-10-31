/**
 * Sincronização entre aparelhos (TV, celular do organizador, celulares das equipes).
 *
 * O celular do organizador é a ÚNICA fonte da verdade: ele guarda o banco de músicas e o gabarito.
 * Para os outros aparelhos ele publica apenas um ESTADO PÚBLICO (rodada, vez, categoria, placar...).
 * A resposta só entra no estado público quando o organizador ativa "Mostrar na TV".
 *
 * Transportes:
 *  - "nuvem": quando a página roda como Artifact no claude.ai com a capacidade `db`
 *    (documento `sala/estado` + palpites em `palpites/<id do usuário>`). Funciona entre aparelhos.
 *  - "local": sem nuvem (ex.: `npm run dev`). Usa localStorage + BroadcastChannel:
 *    sincroniza abas/janelas do MESMO navegador (ex.: notebook ligado na TV com duas janelas).
 */

export interface PublicTeam { id: string; nome: string; cor: string; emoji: string }
export interface PublicScore extends PublicTeam { total: number; rodada: number; posicao: number; acertos: number }

export interface PublicState {
  v: 1;
  atualizadoEm: string;
  status: 'sem_partida' | 'em_andamento' | 'encerrada';
  partidaId?: string;
  rodada?: number;
  totalRodadas?: number | null;
  modo?: 'turno' | 'simultaneo';
  turnId?: string;
  vez?: PublicTeam[];
  categoria?: string;
  dificuldade?: string;
  respondeu?: string[];
  gabaritoAberto?: boolean;
  /** Só existe quando o organizador libera a resposta para a TV. */
  resposta?: { titulo: string; artista: string; musical?: string; ano: number } | null;
  equipes?: PublicTeam[];
  placar?: PublicScore[];
}

export interface RemoteGuess {
  turnId: string;
  teamId: string;
  ano: string;
  titulo: string;
  artista: string;
  em: string;
  aparelho: string;
}

type Unsub = () => void;

export interface Transport {
  kind: 'nuvem' | 'local';
  publish(state: PublicState): Promise<void>;
  subscribePublic(cb: (s: PublicState | null) => void): Unsub;
  sendGuess(g: RemoteGuess): Promise<void>;
  subscribeGuesses(cb: (gs: RemoteGuess[]) => void): Unsub;
}

/* ───────────────────────── Identidade do aparelho ───────────────────────── */

const DEVICE_KEY = 'hitster-party:aparelho';
export function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) { id = `ap-${Math.random().toString(36).slice(2, 10)}`; localStorage.setItem(DEVICE_KEY, id); }
    return id;
  } catch { return 'ap-anonimo'; }
}

/* ───────────────────────── Transporte local ───────────────────────── */

const PUB_KEY = 'hitster-party:sala';
const GUESS_KEY = 'hitster-party:palpites';

function readJson<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}

function localTransport(): Transport {
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('hitster-party') : null;
  const listen = (key: string, cb: () => void): Unsub => {
    const onStorage = (e: StorageEvent) => { if (e.key === key) cb(); };
    const onMsg = (e: MessageEvent) => { if (e.data === key) cb(); };
    window.addEventListener('storage', onStorage);
    channel?.addEventListener('message', onMsg);
    return () => { window.removeEventListener('storage', onStorage); channel?.removeEventListener('message', onMsg); };
  };
  const write = (key: string, value: unknown) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sem armazenamento: só esta aba */ }
    channel?.postMessage(key);
  };
  return {
    kind: 'local',
    async publish(state) { write(PUB_KEY, state); },
    subscribePublic(cb) {
      cb(readJson<PublicState | null>(PUB_KEY, null));
      return listen(PUB_KEY, () => cb(readJson<PublicState | null>(PUB_KEY, null)));
    },
    async sendGuess(g) {
      const all = readJson<Record<string, RemoteGuess>>(GUESS_KEY, {});
      all[`${g.aparelho}:${g.teamId}`] = g;
      write(GUESS_KEY, all);
    },
    subscribeGuesses(cb) {
      const emit = () => cb(Object.values(readJson<Record<string, RemoteGuess>>(GUESS_KEY, {})));
      emit();
      return listen(GUESS_KEY, emit);
    },
  };
}

/* ───────────────────────── Transporte em nuvem (Artifact claude.ai) ───────────────────────── */

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyDb = any;
type AnyUser = any;

function cloudTransport(db: AnyDb, user: AnyUser | null): Transport {
  const pubDoc = db.doc('sala/estado');
  let lastWritten = '';
  let writing: Promise<void> = Promise.resolve();
  return {
    kind: 'nuvem',
    publish(state) {
      const { atualizadoEm: _a, ...comparable } = state;
      const key = JSON.stringify(comparable);
      if (key === lastWritten) return Promise.resolve();
      lastWritten = key;
      // uma escrita por vez no mesmo documento
      writing = writing.then(() => pubDoc.set(state as unknown as Record<string, unknown>)).catch(() => { lastWritten = ''; });
      return writing;
    },
    subscribePublic(cb) {
      return pubDoc.onSnapshot(
        (snap: { exists: boolean; data(): unknown }) => cb(snap.exists ? (snap.data() as PublicState) : null),
        () => cb(null),
      );
    },
    async sendGuess(g) {
      const uid = user ? await user.id() : null;
      if (!uid) throw new Error('Para enviar palpites deste celular, entre na sua conta Claude com acesso a esta página.');
      const ref = db.doc(`palpites/${uid}`);
      const snap = await ref.get();
      const envio = { [`${g.aparelho}_${g.teamId}`.replace(/[^A-Za-z0-9_-]/g, '')]: g };
      if (snap.exists) await ref.update({ envios: envio });
      else await ref.set({ envios: envio });
    },
    subscribeGuesses(cb) {
      return db.collection('palpites').onSnapshot(
        (q: { docs: { data(): { envios?: Record<string, RemoteGuess> } }[] }) => {
          const all: RemoteGuess[] = [];
          for (const d of q.docs) for (const g of Object.values(d.data()?.envios ?? {})) all.push(g);
          cb(all);
        },
        () => cb([]),
      );
    },
  };
}

/* ───────────────────────── Escolha do transporte ───────────────────────── */

let transportPromise: Promise<Transport> | null = null;

/** Resolve uma vez: nuvem se o claude.ai oferecer `db`, senão local. */
export function getTransport(): Promise<Transport> {
  if (transportPromise) return transportPromise;
  transportPromise = (async () => {
    const claude = (window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
    if (claude?.use) {
      try {
        const [db, user] = await Promise.all([claude.use('db'), claude.use('user').catch(() => null)]);
        if (db) return cloudTransport(db, user);
      } catch { /* cai para o modo local */ }
    }
    return localTransport();
  })();
  return transportPromise;
}
