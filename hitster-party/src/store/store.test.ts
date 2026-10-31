import { beforeAll, describe, expect, it } from 'vitest';

// localStorage em memória para rodar a store no Node
const mem = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };

let S: typeof import('./store');
let scoring: typeof import('../lib/scoring');
beforeAll(async () => { S = await import('./store'); scoring = await import('../lib/scoring'); });

const score = () => Object.fromEntries(scoring.computeScores(S.getState().match!).map((r) => [r.team.nome, r.total]));

describe('fluxo da partida (modo turno)', () => {
  it('cria equipes, joga rodadas, corrige sem duplicar e persiste', () => {
    const st = S.getState();
    S.teamActions.update(st.draftTeams[0].id, { nome: 'Equipe Roxa' });
    S.teamActions.update(st.draftTeams[1].id, { nome: 'Time do Caos' });
    expect(S.teamActions.add().ok).toBe(true);
    expect(S.getState().draftTeams.length).toBe(3);
    expect(S.teamActions.remove(S.getState().draftTeams[2].id).ok).toBe(true);

    expect(S.matchActions.start({ idioma: 'todas', dificuldade: 'aleatoria', totalRodadas: 2, modo: 'turno', tolerancia: 1 }).ok).toBe(true);
    let m = S.getState().match!;
    const t1 = S.currentTurn(m)!;
    expect(t1.revealed).toBe(false);                 // gabarito começa fechado
    expect(t1.teamIds).toEqual([m.teams[0].id]);     // é a vez da 1ª equipe
    const song = S.songById(t1.songId)!;
    expect(song.spotifyUrl).toMatch(/open\.spotify\.com\/track\//);

    // não pode avançar sem avaliar
    expect(S.matchActions.next().ok).toBe(false);
    S.matchActions.submitGuess(m.teams[0].id, { ano: String(song.ano), titulo: song.titulo, artista: song.artista });
    S.matchActions.setRevealed(true);
    S.matchActions.setRevealed(false);
    S.matchActions.setRevealed(true);                // abrir/fechar várias vezes
    // palpite travado depois de revelar
    expect(S.matchActions.submitGuess(m.teams[0].id, { ano: '1', titulo: 'x', artista: 'y' }).ok).toBe(false);
    S.matchActions.confirmEval(t1.id, m.teams[0].id);
    S.matchActions.confirmEval(t1.id, m.teams[0].id);   // clique repetido
    expect(score()['Equipe Roxa']).toBe(3);

    // próxima equipe
    expect(S.matchActions.next().ok).toBe(true);
    m = S.getState().match!;
    const t2 = S.currentTurn(m)!;
    expect(t2.teamIds).toEqual([m.teams[1].id]);
    expect(t2.revealed).toBe(false);
    expect(t2.songId).not.toBe(t1.songId);          // música diferente
    S.matchActions.submitGuess(m.teams[1].id, { ano: '1800', titulo: 'nada', artista: 'ninguém' });
    S.matchActions.setRevealed(true);
    S.matchActions.confirmEval(t2.id, m.teams[1].id);
    expect(score()['Time do Caos']).toBe(0);

    // correção manual (ano aceito por divergência) não duplica
    S.matchActions.setEval(t2.id, m.teams[1].id, { ano: true });
    S.matchActions.setEval(t2.id, m.teams[1].id, { ano: true });
    expect(score()['Time do Caos']).toBe(1);

    // próxima rodada
    expect(S.matchActions.next().ok).toBe(true);
    m = S.getState().match!;
    expect(m.cursor).toEqual({ round: 1, turn: 0 });
    expect(S.currentTurn(m)!.revealed).toBe(false);

    // voltar e avançar
    expect(S.matchActions.previous().ok).toBe(true);
    expect(S.getState().match!.cursor).toEqual({ round: 0, turn: 1 });
    expect(S.matchActions.next().ok).toBe(true);
    expect(S.getState().match!.cursor).toEqual({ round: 1, turn: 0 });

    // persistência: o JSON salvo contém a partida
    const saved = JSON.parse(mem.get(S.STORAGE_KEY)!);
    expect(saved.match.rounds.length).toBe(2);
    expect(new Set(saved.match.usedSongIds).size).toBe(saved.match.usedSongIds.length);
  });

  it('modo simultâneo: uma música para todas as equipes', () => {
    expect(S.matchActions.start({ idioma: 'br', dificuldade: 'aleatoria', totalRodadas: null, modo: 'simultaneo', tolerancia: 0 }).ok).toBe(true);
    const m = S.getState().match!;
    const t = S.currentTurn(m)!;
    expect(t.teamIds.length).toBe(m.teams.length);
    expect(S.songById(t.songId)!.origem).toBe('br');
    // a partida anterior foi arquivada no histórico
    expect(S.getState().history.length).toBeGreaterThan(0);
  });
});
