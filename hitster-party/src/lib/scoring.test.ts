import { describe, expect, it } from 'vitest';
import { DEMO_SONGS } from '../data/demoSongs';
import { autoEvaluate, computeScores, normalize, pointsOf, textMatches, yearMatches } from './scoring';
import type { Match } from '../types';

const song = (id: string) => DEMO_SONGS.find((s) => s.id === id)!;

describe('normalização e comparação de textos', () => {
  it('ignora acentos, caixa, artigos e pontuação', () => {
    expect(normalize('  The Beatles! ')).toBe('beatles');
    expect(normalize('Évidências')).toBe('evidencias');
    expect(textMatches('beatles', ['The Beatles'])).toBe(true);
    expect(textMatches('evidencias', ['Evidências'])).toBe(true);
  });
  it('aceita pequenos erros de digitação', () => {
    expect(textMatches('Bohemian Rapsody', ['Bohemian Rhapsody'])).toBe(true);
    expect(textMatches('Aretha Franklim', ['Aretha Franklin'])).toBe(true);
  });
  it('não aceita palavras soltas nem respostas erradas', () => {
    expect(textMatches('love', ['I Will Always Love You'])).toBe(false);
    expect(textMatches('Queen', ['ABBA'])).toBe(false);
    expect(textMatches('', ['ABBA'])).toBe(false);
  });
});

describe('regras de musical e artistas', () => {
  it('aceita o nome do musical como resposta da categoria artista', () => {
    const ev = autoEvaluate({ ano: '2015', titulo: 'My Shot', artista: 'Hamilton', enviadoEm: '' }, song('intl-my-shot'), 1);
    expect(ev).toMatchObject({ titulo: true, artista: true, ano: true });
  });
  it('aceita um dos artistas de um crédito "feat."', () => {
    const ev = autoEvaluate({ ano: '2017', titulo: 'despacito', artista: 'Luis Fonsi', enviadoEm: '' }, song('intl-despacito'), 0);
    expect(ev).toMatchObject({ titulo: true, artista: true, ano: true });
  });
  it('aceita títulos alternativos cadastrados', () => {
    expect(autoEvaluate({ ano: '', titulo: 'Volare', artista: '', enviadoEm: '' }, song('intl-nel-blu-dipinto-di-blu'), 1).titulo).toBe(true);
  });
});

describe('tolerância do ano', () => {
  const s = song('intl-bohemian-rhapsody'); // 1975
  it.each([
    [0, '1975', true], [0, '1976', false], [1, '1976', true], [1, '1977', false],
    [2, '1973', true], [5, '1980', true], [5, '1981', false],
  ] as const)('tolerância %i, palpite %s → %s', (tol, guess, expected) => {
    expect(yearMatches(guess, s, tol)).toBe(expected);
  });
  it('considera anos alternativos legítimos', () => {
    expect(yearMatches('1917', song('br-carinhoso'), 0)).toBe(true); // composição
    expect(yearMatches('1937', song('br-carinhoso'), 0)).toBe(true); // gravação
  });
});

describe('placar', () => {
  const teams = [
    { id: 'a', nome: 'Equipe Roxa', cor: '#a855f7', emoji: '🎸' },
    { id: 'b', nome: 'Time do Caos', cor: '#3b82f6', emoji: '🎤' },
    { id: 'c', nome: 'Os Inimigos do Fim', cor: '#22d3ee', emoji: '🥁' },
  ];
  const ev = (t: boolean, a: boolean, y: boolean, concluida = true) => ({ titulo: t, artista: a, ano: y, concluida });
  const match: Match = {
    id: 'm', criadaEm: '', status: 'em_andamento', teams, usedSongIds: [], adjustments: [],
    config: { idioma: 'todas', dificuldade: 'aleatoria', totalRodadas: 10, modo: 'simultaneo', tolerancia: 1 },
    cursor: { round: 1, turn: 0 },
    rounds: [
      { numero: 1, turns: [{ id: 't1', songId: 'x', teamIds: ['a', 'b', 'c'], guesses: {}, revealed: true, publicReveal: false, evals: { a: ev(true, true, true), b: ev(true, false, false), c: ev(true, true, false) } }] },
      { numero: 2, turns: [{ id: 't2', songId: 'y', teamIds: ['a', 'b', 'c'], guesses: {}, revealed: true, publicReveal: false, evals: { a: ev(false, false, false), b: ev(true, true, false), c: ev(true, true, true, false) } }] },
    ],
  };
  it('pontua 1 por item e só conta avaliações concluídas', () => {
    expect(pointsOf(ev(true, true, true))).toBe(3);
    expect(pointsOf(ev(true, true, true, false))).toBe(0);
  });
  it('acumula várias rodadas, mostra pontos da rodada atual e trata empates', () => {
    const rows = computeScores(match);
    const by = Object.fromEntries(rows.map((r) => [r.team.id, r]));
    expect(by.a.total).toBe(3);
    expect(by.b.total).toBe(3);
    expect(by.c.total).toBe(2);
    expect(by.b.rodadaAtual).toBe(2);
    expect(by.a.posicao).toBe(1);
    expect(by.b.posicao).toBe(1); // empate na mesma posição
    expect(by.c.posicao).toBe(3);
  });
  it('ajustes manuais somam sem duplicar', () => {
    const m2 = { ...match, adjustments: [{ id: 'j', teamId: 'c', pontos: 2, motivo: 'versão alternativa', em: '' }] };
    expect(computeScores(m2).find((r) => r.team.id === 'c')!.total).toBe(4);
    expect(computeScores(m2).find((r) => r.team.id === 'c')!.total).toBe(4);
  });
});
