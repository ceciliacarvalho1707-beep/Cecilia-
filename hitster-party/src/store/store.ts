/**
 * Store global do HITSTER PARTY.
 *
 * - Estado único, imutável, salvo no localStorage a cada alteração (sobrevive a recarregar/fechar o navegador).
 * - Sincroniza abas do mesmo navegador via evento "storage" (usado pelo Modo TV).
 * - Pontos NUNCA são somados incrementalmente: o placar é recalculado a partir das avaliações,
 *   por isso cliques repetidos ou correções não duplicam pontuação.
 */
import { useSyncExternalStore } from 'react';
import { DEMO_BANK_VERSION, DEMO_SONGS } from '../data/demoSongs';
import { autoEvaluate } from '../lib/scoring';
import { pickSong, randomId } from '../lib/selection';
import type {
  AppState, ArchivedMatch, Evaluation, Guess, Match, MatchConfig, Round, Settings, Song, Team, Turn,
} from '../types';

export const STORAGE_KEY = 'hitster-party:v1';

export const TEAM_COLORS = ['#a855f7', '#3b82f6', '#22d3ee', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#eab308', '#6366f1'];
export const TEAM_EMOJIS = ['🎸', '🎤', '🥁', '🎹', '🎺', '🎷', '🎻', '💿', '🪩', '🔥', '⭐', '🦄', '🐙', '🚀', '👑', '🌈'];
const DEFAULT_NAMES = ['Equipe Roxa', 'Os Inimigos do Fim', 'Time do Caos', 'Equipe dos Amigos'];

const defaultSettings: Settings = {
  toleranciaPadrao: 1,
  spotifyModo: 'web',
  reduzirAnimacoes: false,
  mostrarAvisoSpotify: true,
};

function defaultTeams(): Team[] {
  return DEFAULT_NAMES.slice(0, 2).map((nome, i) => ({ id: randomId('t_'), nome, cor: TEAM_COLORS[i], emoji: TEAM_EMOJIS[i] }));
}

function initialState(): AppState {
  return { songs: DEMO_SONGS, draftTeams: defaultTeams(), match: null, history: [], settings: defaultSettings, bankVersion: DEMO_BANK_VERSION };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const base = initialState();
    const state: AppState = {
      ...base,
      ...parsed,
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
      songs: Array.isArray(parsed.songs) ? parsed.songs : base.songs,
      draftTeams: Array.isArray(parsed.draftTeams) && parsed.draftTeams.length ? parsed.draftTeams : base.draftTeams,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
    // Nova versão do banco de demonstração: adiciona exemplos novos sem apagar as músicas do organizador.
    if ((parsed.bankVersion ?? 0) < DEMO_BANK_VERSION) {
      const ids = new Set(state.songs.map((s) => s.id));
      state.songs = [...state.songs, ...DEMO_SONGS.filter((s) => !ids.has(s.id))];
      state.bankVersion = DEMO_BANK_VERSION;
    }
    return state;
  } catch {
    return initialState();
  }
}

let state: AppState = typeof localStorage !== 'undefined' ? load() : initialState();
const listeners = new Set<() => void>();
let saveError: string | null = null;

function emit() { listeners.forEach((l) => l()); }

function set(updater: (s: AppState) => AppState) {
  state = updater(state);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveError = null;
  } catch (e) {
    saveError = `Não foi possível salvar no navegador: ${(e as Error).message}`;
  }
  emit();
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) { state = load(); emit(); }
  });
}

export function getState() { return state; }
export function getSaveError() { return saveError; }
export function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

/* ───────────────────────── Helpers da partida ───────────────────────── */

export function currentRound(m: Match): Round | undefined { return m.rounds[m.cursor.round]; }
export function currentTurn(m: Match): Turn | undefined { return currentRound(m)?.turns[m.cursor.turn]; }
export function songById(id: string): Song | undefined { return state.songs.find((s) => s.id === id); }
export function isLastRound(m: Match): boolean { return m.config.totalRodadas !== null && m.cursor.round + 1 >= m.config.totalRodadas; }
export function turnComplete(t: Turn): boolean { return t.teamIds.every((id) => t.evals[id]?.concluida); }
export function roundComplete(r: Round, m: Match): boolean {
  return r.turns.length >= expectedTurns(m) && r.turns.every(turnComplete);
}
function expectedTurns(m: Match) { return m.config.modo === 'turno' ? m.teams.length : 1; }
/** true se ainda há equipes para jogar nesta rodada (modo turno). */
export function hasNextTeam(m: Match): boolean {
  const r = currentRound(m);
  return !!r && m.cursor.turn + 1 >= r.turns.length && r.turns.length < expectedTurns(m);
}

function updateMatch(fn: (m: Match) => Match) {
  set((s) => (s.match ? { ...s, match: fn(s.match) } : s));
}

function updateCurrentTurn(fn: (t: Turn, m: Match) => Turn) {
  updateMatch((m) => {
    const { round, turn } = m.cursor;
    const rounds = m.rounds.map((r, ri) => ri !== round ? r : { ...r, turns: r.turns.map((t, ti) => (ti === turn ? fn(t, m) : t)) });
    return { ...m, rounds };
  });
}

/** Cria um turno sorteando uma música inédita. */
function makeTurn(m: Match, teamIds: string[]): { turn: Turn; match: Match } | null {
  const lastId = m.usedSongIds[m.usedSongIds.length - 1];
  const last = state.songs.find((s) => s.id === lastId);
  const res = pickSong(state.songs, { idioma: m.config.idioma, dificuldade: m.config.dificuldade, usedIds: m.usedSongIds, lastArtist: last?.artista });
  if (!res.song) return null;
  const turn: Turn = { id: randomId('turn_'), songId: res.song.id, teamIds, guesses: {}, evals: {}, revealed: false, publicReveal: false };
  return { turn, match: { ...m, usedSongIds: [...m.usedSongIds, res.song.id], avisoRepeticao: m.avisoRepeticao || res.repetida } };
}

/** Equipes do próximo turno de uma rodada: no modo turno, a próxima equipe (na ordem) que ainda não jogou. */
function teamsForNextTurn(m: Match, round: Round | undefined): string[] {
  if (m.config.modo === 'simultaneo') return m.teams.map((t) => t.id);
  const played = new Set((round?.turns ?? []).flatMap((t) => t.teamIds));
  const next = m.teams.find((t) => !played.has(t.id)) ?? m.teams[0];
  return [next.id];
}

export type ActionResult = { ok: true } | { ok: false; erro: string };

/* ───────────────────────── Ações: equipes (rascunho) ───────────────────────── */

export const teamActions = {
  add(): ActionResult {
    const teams = state.draftTeams;
    if (teams.length >= 12) return { ok: false, erro: 'O máximo é 12 equipes.' };
    const used = new Set(teams.map((t) => t.cor));
    const cor = TEAM_COLORS.find((c) => !used.has(c)) ?? TEAM_COLORS[teams.length % TEAM_COLORS.length];
    const nome = DEFAULT_NAMES.find((n) => !teams.some((t) => t.nome === n)) ?? `Equipe ${teams.length + 1}`;
    set((s) => ({ ...s, draftTeams: [...s.draftTeams, { id: randomId('t_'), nome, cor, emoji: TEAM_EMOJIS[teams.length % TEAM_EMOJIS.length] }] }));
    return { ok: true };
  },
  update(id: string, patch: Partial<Team>) {
    set((s) => ({ ...s, draftTeams: s.draftTeams.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  },
  remove(id: string): ActionResult {
    if (state.draftTeams.length <= 2) return { ok: false, erro: 'São necessárias pelo menos 2 equipes.' };
    set((s) => ({ ...s, draftTeams: s.draftTeams.filter((t) => t.id !== id) }));
    return { ok: true };
  },
  move(id: string, dir: -1 | 1) {
    set((s) => {
      const arr = [...s.draftTeams];
      const i = arr.findIndex((t) => t.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return s;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...s, draftTeams: arr };
    });
  },
  shuffle() {
    set((s) => {
      const arr = [...s.draftTeams];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return { ...s, draftTeams: arr };
    });
  },
};

/* ───────────────────────── Ações: partida ───────────────────────── */

function archive(m: Match): ArchivedMatch {
  const songs: Record<string, Song> = {};
  for (const id of new Set(m.usedSongIds)) { const s = songById(id); if (s) songs[id] = s; }
  return { match: m, songs };
}

export const matchActions = {
  start(config: MatchConfig): ActionResult {
    const teams = state.draftTeams.map((t) => ({ ...t, nome: t.nome.trim() || 'Equipe sem nome' }));
    if (teams.length < 2) return { ok: false, erro: 'Cadastre pelo menos 2 equipes.' };
    let m: Match = {
      id: randomId('m_'), criadaEm: new Date().toISOString(), status: 'em_andamento', config, teams,
      rounds: [], cursor: { round: 0, turn: 0 }, usedSongIds: [], adjustments: [],
    };
    const first = makeTurn(m, teamsForNextTurn(m, undefined));
    if (!first) return { ok: false, erro: 'Nenhuma música disponível com esse filtro de idioma. Cadastre ou importe músicas na área do organizador.' };
    m = { ...first.match, rounds: [{ numero: 1, turns: [first.turn] }] };
    // Uma partida em andamento é arquivada antes de ser substituída, para não perder o histórico.
    set((s) => ({ ...s, match: m, history: s.match && s.match.rounds.some((r) => r.turns.some((t) => Object.keys(t.evals).length)) ? [archive({ ...s.match, status: 'encerrada', encerradaEm: new Date().toISOString() }), ...s.history] : s.history }));
    return { ok: true };
  },

  submitGuess(teamId: string, guess: Omit<Guess, 'enviadoEm'>): ActionResult {
    const m = state.match; const t = m && currentTurn(m);
    if (!m || !t) return { ok: false, erro: 'Nenhuma partida em andamento.' };
    if (!t.teamIds.includes(teamId)) return { ok: false, erro: 'Esta equipe não responde neste turno.' };
    if (t.revealed || t.evals[teamId]?.concluida) return { ok: false, erro: 'O gabarito já foi revelado: os palpites estão travados.' };
    updateCurrentTurn((turn) => ({ ...turn, guesses: { ...turn.guesses, [teamId]: { ...guess, enviadoEm: new Date().toISOString() } } }));
    return { ok: true };
  },

  /** Palpite recebido de um celular de equipe. Só vale para o turno atual e antes da revelação. */
  submitRemoteGuess(g: { turnId: string; teamId: string; ano: string; titulo: string; artista: string; em: string }): boolean {
    const m = state.match; const t = m && currentTurn(m);
    if (!m || !t || m.status !== 'em_andamento' || t.id !== g.turnId) return false;
    if (!t.teamIds.includes(g.teamId) || t.revealed || t.evals[g.teamId]) return false;
    const prev = t.guesses[g.teamId];
    if (prev && prev.enviadoEm >= g.em) return false;
    const clean = (v: unknown, max: number) => String(v ?? '').slice(0, max).trim();
    updateCurrentTurn((turn) => ({ ...turn, guesses: { ...turn.guesses, [g.teamId]: { ano: clean(g.ano, 4).replace(/\D/g, ''), titulo: clean(g.titulo, 120), artista: clean(g.artista, 120), enviadoEm: g.em } } }));
    return true;
  },

  /** Abre/fecha o gabarito. Na primeira abertura gera a sugestão automática de correção. */
  setRevealed(revealed: boolean) {
    updateCurrentTurn((t, m) => {
      if (!revealed) return { ...t, revealed: false };
      const song = songById(t.songId);
      const evals = { ...t.evals };
      if (song) for (const id of t.teamIds) if (!evals[id]) evals[id] = autoEvaluate(t.guesses[id], song, m.config.tolerancia);
      return { ...t, revealed: true, evals };
    });
  },

  setPublicReveal(v: boolean) { updateCurrentTurn((t) => ({ ...t, publicReveal: v })); },

  setTolerance(tolerancia: Match['config']['tolerancia']) { updateMatch((m) => ({ ...m, config: { ...m.config, tolerancia } })); },

  /** Altera um item da avaliação em qualquer turno (correção manual). */
  setEval(turnId: string, teamId: string, patch: Partial<Pick<Evaluation, 'titulo' | 'artista' | 'ano'>>) {
    updateMatch((m) => ({
      ...m,
      rounds: m.rounds.map((r) => ({
        ...r,
        turns: r.turns.map((t) => {
          if (t.id !== turnId) return t;
          const prev = t.evals[teamId] ?? { titulo: false, artista: false, ano: false, concluida: false };
          return { ...t, evals: { ...t.evals, [teamId]: { ...prev, ...patch, manual: true } } };
        }),
      })),
    }));
  },

  /** Conclui a avaliação de uma equipe (os pontos passam a contar). Idempotente. */
  confirmEval(turnId: string, teamId: string, concluida = true) {
    updateMatch((m) => ({
      ...m,
      rounds: m.rounds.map((r) => ({
        ...r,
        turns: r.turns.map((t) => {
          if (t.id !== turnId) return t;
          const prev = t.evals[teamId] ?? { titulo: false, artista: false, ano: false, concluida: false };
          return { ...t, evals: { ...t.evals, [teamId]: { ...prev, concluida } } };
        }),
      })),
    }));
  },

  /** Troca a música do turno atual (ex.: link indisponível). Só antes de revelar. */
  skipSong(): ActionResult {
    const m = state.match; const t = m && currentTurn(m);
    if (!m || !t) return { ok: false, erro: 'Nenhuma partida em andamento.' };
    if (t.revealed || Object.values(t.evals).some((e) => e.concluida)) return { ok: false, erro: 'Não é possível trocar a música depois de revelar o gabarito.' };
    const res = makeTurn(m, t.teamIds);
    if (!res) return { ok: false, erro: 'Não há outra música disponível.' };
    updateMatch(() => res.match);
    updateCurrentTurn((turn) => ({ ...turn, songId: res.turn.songId, guesses: {}, evals: {}, revealed: false, publicReveal: false }));
    return { ok: true };
  },

  /** Avança: próximo turno existente, próxima equipe (cria turno) ou próxima rodada. */
  next(): ActionResult & { fim?: boolean } {
    const m = state.match;
    if (!m) return { ok: false, erro: 'Nenhuma partida em andamento.' };
    const round = currentRound(m)!;
    const turn = currentTurn(m)!;
    if (!turnComplete(turn)) return { ok: false, erro: 'Conclua a avaliação de todas as equipes deste turno antes de avançar.' };
    // Turno seguinte já existe (estávamos revisando o passado)
    if (m.cursor.turn + 1 < round.turns.length) {
      updateMatch((mm) => ({ ...mm, cursor: { round: mm.cursor.round, turn: mm.cursor.turn + 1 } }));
      return { ok: true };
    }
    // Próxima equipe da mesma rodada
    if (round.turns.length < expectedTurns(m)) {
      const res = makeTurn(m, teamsForNextTurn(m, round));
      if (!res) return { ok: false, erro: 'Não há músicas disponíveis.' };
      updateMatch(() => ({
        ...res.match,
        rounds: res.match.rounds.map((r, ri) => (ri === m.cursor.round ? { ...r, turns: [...r.turns, res.turn] } : r)),
        cursor: { round: m.cursor.round, turn: round.turns.length },
      }));
      return { ok: true };
    }
    // Rodada seguinte já existe
    if (m.cursor.round + 1 < m.rounds.length) {
      updateMatch((mm) => ({ ...mm, cursor: { round: mm.cursor.round + 1, turn: 0 } }));
      return { ok: true };
    }
    if (isLastRound(m)) return { ok: true, fim: true };
    const res = makeTurn(m, teamsForNextTurn(m, undefined));
    if (!res) return { ok: false, erro: 'Não há músicas disponíveis.' };
    updateMatch(() => ({
      ...res.match,
      rounds: [...res.match.rounds, { numero: res.match.rounds.length + 1, turns: [res.turn] }],
      cursor: { round: res.match.rounds.length, turn: 0 },
    }));
    return { ok: true };
  },

  /** Volta para o turno anterior (para revisar ou corrigir). */
  previous(): ActionResult {
    const m = state.match;
    if (!m) return { ok: false, erro: 'Nenhuma partida em andamento.' };
    const { round, turn } = m.cursor;
    if (turn > 0) { updateMatch((mm) => ({ ...mm, cursor: { round, turn: turn - 1 } })); return { ok: true }; }
    if (round > 0) { updateMatch((mm) => ({ ...mm, cursor: { round: round - 1, turn: mm.rounds[round - 1].turns.length - 1 } })); return { ok: true }; }
    return { ok: false, erro: 'Este já é o primeiro turno.' };
  },

  goTo(round: number, turn: number) {
    updateMatch((m) => (m.rounds[round]?.turns[turn] ? { ...m, cursor: { round, turn } } : m));
  },

  addAdjustment(teamId: string, pontos: number, motivo: string) {
    updateMatch((m) => ({ ...m, adjustments: [...m.adjustments, { id: randomId('adj_'), teamId, pontos, motivo: motivo.trim() || 'Correção manual', em: new Date().toISOString() }] }));
  },
  removeAdjustment(id: string) { updateMatch((m) => ({ ...m, adjustments: m.adjustments.filter((a) => a.id !== id) })); },

  /** Edita uma equipe durante a partida (nome, cor, emoji). */
  updateTeam(id: string, patch: Partial<Team>) {
    updateMatch((m) => ({ ...m, teams: m.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  },
  addTeamToMatch(): ActionResult {
    const m = state.match; if (!m) return { ok: false, erro: 'Nenhuma partida.' };
    if (m.teams.length >= 12) return { ok: false, erro: 'O máximo é 12 equipes.' };
    const used = new Set(m.teams.map((t) => t.cor));
    const team: Team = { id: randomId('t_'), nome: `Equipe ${m.teams.length + 1}`, cor: TEAM_COLORS.find((c) => !used.has(c)) ?? TEAM_COLORS[0], emoji: TEAM_EMOJIS[m.teams.length % TEAM_EMOJIS.length] };
    // No modo simultâneo a nova equipe entra no turno atual se o gabarito ainda não foi aberto.
    updateMatch((mm) => {
      const next = { ...mm, teams: [...mm.teams, team] };
      if (mm.config.modo === 'simultaneo') {
        next.rounds = mm.rounds.map((r, ri) => ri !== mm.cursor.round ? r : { ...r, turns: r.turns.map((t, ti) => (ti === mm.cursor.turn && !t.revealed ? { ...t, teamIds: [...t.teamIds, team.id] } : t)) });
      }
      return next;
    });
    return { ok: true };
  },
  removeTeamFromMatch(id: string): ActionResult {
    const m = state.match; if (!m) return { ok: false, erro: 'Nenhuma partida.' };
    if (m.teams.length <= 2) return { ok: false, erro: 'A partida precisa de pelo menos 2 equipes.' };
    updateMatch((mm) => ({
      ...mm,
      teams: mm.teams.filter((t) => t.id !== id),
      // Turnos exclusivos da equipe removida são descartados; nos demais ela sai da lista.
      rounds: mm.rounds.map((r) => ({ ...r, turns: r.turns.map((t) => ({ ...t, teamIds: t.teamIds.filter((x) => x !== id) })).filter((t) => t.teamIds.length > 0) }))
        .filter((r) => r.turns.length > 0)
        .map((r, i) => ({ ...r, numero: i + 1 })),
      adjustments: mm.adjustments.filter((a) => a.teamId !== id),
    }));
    // Garante cursor válido
    updateMatch((mm) => {
      if (!mm.rounds.length) return mm;
      const ri = Math.min(mm.cursor.round, mm.rounds.length - 1);
      const ti = Math.min(mm.cursor.turn, mm.rounds[ri].turns.length - 1);
      return { ...mm, cursor: { round: ri, turn: ti } };
    });
    set((s) => ({ ...s, draftTeams: s.draftTeams.filter((t) => t.id !== id) }));
    return { ok: true };
  },

  /** Encerra a partida e arquiva no histórico. */
  finish() {
    set((s) => {
      if (!s.match) return s;
      const ended: Match = { ...s.match, status: 'encerrada', encerradaEm: new Date().toISOString() };
      return { ...s, match: ended, history: [archive(ended), ...s.history.filter((h) => h.match.id !== ended.id)] };
    });
  },

  /** Recomeça do zero com as mesmas equipes e configuração (pontos zerados). */
  restart(): ActionResult {
    const m = state.match;
    if (!m) return { ok: false, erro: 'Nenhuma partida.' };
    set((s) => ({ ...s, draftTeams: m.teams }));
    set((s) => ({ ...s, match: null }));
    return matchActions.start(m.config);
  },

  /** Apaga a partida atual (sem arquivar). */
  discard() { set((s) => ({ ...s, match: null })); },
};

/* ───────────────────────── Ações: banco de músicas ───────────────────────── */

export const songActions = {
  upsert(song: Song) {
    set((s) => {
      const exists = s.songs.some((x) => x.id === song.id);
      return { ...s, songs: exists ? s.songs.map((x) => (x.id === song.id ? song : x)) : [song, ...s.songs] };
    });
  },
  remove(id: string) { set((s) => ({ ...s, songs: s.songs.filter((x) => x.id !== id) })); },
  removeMany(ids: string[]) { const del = new Set(ids); set((s) => ({ ...s, songs: s.songs.filter((x) => !del.has(x.id)) })); },
  import(songs: Song[], mode: 'merge' | 'replace') {
    set((s) => {
      if (mode === 'replace') return { ...s, songs };
      const map = new Map(s.songs.map((x) => [x.id, x]));
      for (const song of songs) map.set(song.id, song);
      return { ...s, songs: [...map.values()] };
    });
  },
  restoreDemo() {
    set((s) => {
      const ids = new Set(DEMO_SONGS.map((d) => d.id));
      return { ...s, songs: [...DEMO_SONGS, ...s.songs.filter((x) => !ids.has(x.id))] };
    });
  },
  setVerification(id: string, v: Song['verificacao']) {
    set((s) => ({ ...s, songs: s.songs.map((x) => (x.id === id ? { ...x, verificacao: v } : x)) }));
  },
};

/* ───────────────────────── Ações: configurações e histórico ───────────────────────── */

export const settingsActions = {
  update(patch: Partial<Settings>) { set((s) => ({ ...s, settings: { ...s.settings, ...patch } })); },
  resetAll() { set(() => initialState()); },
};

export const historyActions = {
  remove(id: string) { set((s) => ({ ...s, history: s.history.filter((h) => h.match.id !== id) })); },
  clear() { set((s) => ({ ...s, history: [] })); },
};

/** Hash simples (não criptográfico forte) — o PIN só impede acesso casual à área do organizador. */
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`hitster-party:${pin}`);
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0; for (const b of data) h = (h * 31 + b) | 0; return String(h);
}
