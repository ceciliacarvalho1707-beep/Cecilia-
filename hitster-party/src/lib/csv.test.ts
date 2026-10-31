import { describe, expect, it } from 'vitest';
import { DEMO_SONGS } from '../data/demoSongs';
import { importCsv, importJson, songsToCsv } from './csv';
import { canonicalTrackUrl, extractTrackId } from './spotify';

describe('links do Spotify', () => {
  it('aceita somente links de faixa e normaliza', () => {
    expect(canonicalTrackUrl('https://open.spotify.com/intl-pt/track/4u7EnebtmKWzUH433cf5Qv?si=abc')).toBe('https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv');
    expect(extractTrackId('spotify:track:4u7EnebtmKWzUH433cf5Qv')).toBe('4u7EnebtmKWzUH433cf5Qv');
    expect(canonicalTrackUrl('https://open.spotify.com/search/queen')).toBeNull();
    expect(canonicalTrackUrl('https://open.spotify.com/playlist/37i9dQZF1DZ06evO0dPrdS')).toBeNull();
  });
});

describe('importação', () => {
  it('ida e volta CSV preserva os dados', () => {
    const r = importCsv(songsToCsv(DEMO_SONGS));
    expect(r.errors).toEqual([]);
    expect(r.songs.length).toBe(DEMO_SONGS.length);
    const a = r.songs.find((s) => s.id === 'intl-summer-nights')!;
    expect(a.musical).toBe('Grease');
    expect(a.anosAceitos).toEqual([1971, 1972]);
  });
  it('rejeita instrumentais, buscas e dados incompletos', () => {
    const r = importJson(JSON.stringify([
      { titulo: 'Ok', artista: 'X', ano: 2000, spotifyUrl: 'https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv' },
      { titulo: 'Instrumental', artista: 'X', ano: 2000, spotifyUrl: 'https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv', temLetra: false },
      { titulo: 'Busca', artista: 'X', ano: 2000, spotifyUrl: 'https://open.spotify.com/search/x' },
      { titulo: '', artista: 'X', ano: 2000, spotifyUrl: 'https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv' },
    ]));
    expect(r.songs.length).toBe(1);
    expect(r.errors.length).toBe(3);
  });
  it('lê CSV com ponto e vírgula e aspas', () => {
    const csv = 'titulo;artista;ano;spotifyUrl;origem;dificuldade\n"Música; com ponto e vírgula";Fulano;1990;https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv;br;difícil\n';
    const r = importCsv(csv);
    expect(r.songs[0].titulo).toBe('Música; com ponto e vírgula');
    expect(r.songs[0].dificuldade).toBe('dificil');
    expect(r.songs[0].origem).toBe('br');
  });
});
