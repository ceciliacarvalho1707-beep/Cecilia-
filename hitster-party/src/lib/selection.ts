import type { DificuldadeConfig, FiltroIdioma, Song } from '../types';

/** Inteiro aleatório em [0, max) usando o gerador criptográfico do navegador quando disponível. */
export function randomInt(max: number): number {
  if (max <= 0) return 0;
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const buf = new Uint32Array(1);
    // rejeição para evitar viés de módulo
    const limit = Math.floor(0x100000000 / max) * max;
    do c.getRandomValues(buf); while (buf[0] >= limit);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function randomId(prefix = ''): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 10; i++) s += chars[randomInt(chars.length)];
  return prefix + s;
}

export function filterPool(songs: Song[], idioma: FiltroIdioma, dificuldade: DificuldadeConfig): Song[] {
  return songs.filter(
    (s) =>
      s.temLetra &&
      (idioma === 'todas' || s.origem === idioma) &&
      (dificuldade === 'aleatoria' || s.dificuldade === dificuldade),
  );
}

export interface PickResult {
  song: Song | null;
  /** true quando não havia músicas inéditas e foi preciso repetir. */
  repetida: boolean;
  /** true quando a dificuldade escolhida se esgotou e foi usada outra. */
  dificuldadeRelaxada: boolean;
}

/**
 * Sorteia a próxima música.
 *  - Sorteio uniforme entre as candidatas (sem ciclos fixos, sem alternância por país/época/gênero).
 *  - Evita repetir músicas já usadas na partida enquanto houver opções.
 *  - Evita apenas que o MESMO artista toque duas vezes seguidas, se houver alternativa.
 *  - Se a dificuldade escolhida acabar, usa outras dificuldades do mesmo idioma antes de repetir.
 */
export function pickSong(
  songs: Song[],
  opts: { idioma: FiltroIdioma; dificuldade: DificuldadeConfig; usedIds: string[]; lastArtist?: string },
): PickResult {
  const used = new Set(opts.usedIds);
  const tryPick = (pool: Song[]) => {
    const fresh = pool.filter((s) => !used.has(s.id));
    if (!fresh.length) return null;
    const varied = opts.lastArtist ? fresh.filter((s) => s.artista !== opts.lastArtist) : fresh;
    const candidates = varied.length ? varied : fresh;
    return candidates[randomInt(candidates.length)];
  };

  const strict = filterPool(songs, opts.idioma, opts.dificuldade);
  const s1 = tryPick(strict);
  if (s1) return { song: s1, repetida: false, dificuldadeRelaxada: false };

  const relaxed = filterPool(songs, opts.idioma, 'aleatoria');
  const s2 = tryPick(relaxed);
  if (s2) return { song: s2, repetida: false, dificuldadeRelaxada: true };

  // Banco esgotado: repete, mas nunca a última música tocada se houver outra
  const pool = strict.length ? strict : relaxed;
  if (!pool.length) return { song: null, repetida: false, dificuldadeRelaxada: false };
  const last = opts.usedIds[opts.usedIds.length - 1];
  const notLast = pool.filter((s) => s.id !== last);
  const c = notLast.length ? notLast : pool;
  return { song: c[randomInt(c.length)], repetida: true, dificuldadeRelaxada: pool !== strict };
}
