import { describe, expect, it } from 'vitest';
import { DEMO_SONGS } from '../data/demoSongs';
import { filterPool, pickSong } from './selection';

describe('sorteio de músicas', () => {
  it('nunca repete músicas enquanto houver inéditas', () => {
    const used: string[] = [];
    for (let i = 0; i < DEMO_SONGS.length; i++) {
      const r = pickSong(DEMO_SONGS, { idioma: 'todas', dificuldade: 'aleatoria', usedIds: used });
      expect(r.repetida).toBe(false);
      expect(used).not.toContain(r.song!.id);
      used.push(r.song!.id);
    }
    expect(new Set(used).size).toBe(DEMO_SONGS.length);
    // banco esgotado → avisa repetição
    expect(pickSong(DEMO_SONGS, { idioma: 'todas', dificuldade: 'aleatoria', usedIds: used }).repetida).toBe(true);
  });
  it('respeita o filtro de idioma', () => {
    for (let i = 0; i < 30; i++) {
      expect(pickSong(DEMO_SONGS, { idioma: 'br', dificuldade: 'aleatoria', usedIds: [] }).song!.origem).toBe('br');
      expect(pickSong(DEMO_SONGS, { idioma: 'intl', dificuldade: 'aleatoria', usedIds: [] }).song!.origem).toBe('intl');
    }
  });
  it('relaxa a dificuldade quando ela se esgota, antes de repetir', () => {
    const dificeis = filterPool(DEMO_SONGS, 'todas', 'muito_dificil').map((s) => s.id);
    const r = pickSong(DEMO_SONGS, { idioma: 'todas', dificuldade: 'muito_dificil', usedIds: dificeis });
    expect(r.dificuldadeRelaxada).toBe(true);
    expect(r.repetida).toBe(false);
  });
  it('não segue ciclos fixos (ordens diferentes em sorteios diferentes)', () => {
    const seq = () => { const u: string[] = []; for (let i = 0; i < 10; i++) u.push(pickSong(DEMO_SONGS, { idioma: 'todas', dificuldade: 'aleatoria', usedIds: u }).song!.id); return u.join(); };
    const seqs = new Set(Array.from({ length: 5 }, seq));
    expect(seqs.size).toBeGreaterThan(1);
  });
});

describe('banco de demonstração', () => {
  it('todas as músicas têm letra, link de faixa específico, ano e fonte', () => {
    const ids = new Set<string>();
    for (const s of DEMO_SONGS) {
      expect(s.temLetra).toBe(true);
      expect(s.spotifyUrl).toMatch(/^https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]{22}$/);
      expect(s.fontes.length).toBeGreaterThan(0);
      expect(s.ano).toBeGreaterThan(1800);
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
    }
    expect(new Set(DEMO_SONGS.map((s) => s.spotifyUrl)).size).toBe(DEMO_SONGS.length);
  });
  it('tem músicas brasileiras e internacionais de várias épocas', () => {
    expect(DEMO_SONGS.some((s) => s.origem === 'br')).toBe(true);
    expect(DEMO_SONGS.some((s) => s.origem === 'intl')).toBe(true);
    const decadas = new Set(DEMO_SONGS.map((s) => Math.floor(s.ano / 10)));
    expect(decadas.size).toBeGreaterThanOrEqual(10);
  });
});
