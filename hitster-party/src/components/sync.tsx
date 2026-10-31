import { useEffect, useRef, useState } from 'react';
import { computeScores } from '../lib/scoring';
import { getTransport, type PublicState, type RemoteGuess, type Transport } from '../lib/sync';
import { currentRound, currentTurn, matchActions, songById, useAppState } from '../store/store';
import type { Match } from '../types';

/** Monta o estado público a partir da partida. NUNCA inclui título/artista/ano, exceto se liberado para a TV. */
export function buildPublicState(match: Match | null): PublicState {
  const base = { v: 1 as const, atualizadoEm: new Date().toISOString() };
  if (!match) return { ...base, status: 'sem_partida' };
  const team = (id: string) => { const t = match.teams.find((x) => x.id === id); return t ? { id: t.id, nome: t.nome, cor: t.cor, emoji: t.emoji } : null; };
  const placar = computeScores(match).map((r) => ({ id: r.team.id, nome: r.team.nome, cor: r.team.cor, emoji: r.team.emoji, total: r.total, rodada: r.rodadaAtual, posicao: r.posicao, acertos: r.acertos }));
  const equipes = match.teams.map((t) => ({ id: t.id, nome: t.nome, cor: t.cor, emoji: t.emoji }));
  if (match.status === 'encerrada') return { ...base, status: 'encerrada', partidaId: match.id, equipes, placar };
  const round = currentRound(match);
  const turn = currentTurn(match);
  const song = turn ? songById(turn.songId) : undefined;
  return {
    ...base,
    status: 'em_andamento',
    partidaId: match.id,
    rodada: round?.numero,
    totalRodadas: match.config.totalRodadas,
    modo: match.config.modo,
    turnId: turn?.id,
    vez: (turn?.teamIds ?? []).map(team).filter(Boolean) as PublicState['vez'],
    categoria: song?.genero,
    dificuldade: song?.dificuldade,
    respondeu: turn ? Object.keys(turn.guesses) : [],
    gabaritoAberto: !!turn?.revealed,
    resposta: turn?.publicReveal && song ? { titulo: song.titulo, artista: song.artista, musical: song.musical, ano: song.ano } : null,
    equipes,
    placar,
  };
}

let currentKind: Transport['kind'] | null = null;
const kindListeners = new Set<(k: Transport['kind']) => void>();

/** Tipo de conexão em uso ("nuvem" entre aparelhos ou "local" no mesmo navegador). */
export function useTransportKind(): Transport['kind'] | null {
  const [kind, setKind] = useState(currentKind);
  useEffect(() => {
    kindListeners.add(setKind);
    getTransport().then((t) => { currentKind = t.kind; kindListeners.forEach((l) => l(t.kind)); });
    return () => { kindListeners.delete(setKind); };
  }, []);
  return kind;
}

/**
 * Ponte do organizador: publica o estado público sempre que a partida muda
 * e recebe os palpites enviados pelos celulares das equipes.
 */
export function OrganizerSyncBridge() {
  const match = useAppState((s) => s.match);
  useAppState((s) => s.songs);
  const transport = useRef<Transport | null>(null);
  const processed = useRef(new Set<string>());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let alive = true;
    getTransport().then((t) => {
      if (!alive) return;
      transport.current = t;
      setReady(true);
      unsub = t.subscribeGuesses((gs: RemoteGuess[]) => importGuesses(gs, processed.current));
    });
    return () => { alive = false; unsub?.(); };
  }, []);

  // Publica (com pequena espera para agrupar mudanças rápidas)
  useEffect(() => {
    if (!ready || !transport.current) return;
    const id = setTimeout(() => { transport.current?.publish(buildPublicState(match)).catch(() => undefined); }, 250);
    return () => clearTimeout(id);
  }, [match, ready]);

  return null;
}

function importGuesses(gs: RemoteGuess[], processed: Set<string>) {
  for (const g of gs) {
    const key = `${g.aparelho}|${g.teamId}|${g.turnId}|${g.em}`;
    if (processed.has(key)) continue;
    processed.add(key);
    // A ação valida: turno atual, equipe do turno e gabarito ainda fechado.
    matchActions.submitRemoteGuess(g);
  }
}

/** Assina o estado público (usado pela TV e pelos celulares das equipes). */
export function usePublicState(): { state: PublicState | null; carregando: boolean; kind: Transport['kind'] | null } {
  const [state, setState] = useState<PublicState | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [kind, setKind] = useState<Transport['kind'] | null>(null);
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let alive = true;
    const timer = setTimeout(() => setCarregando(false), 10000);
    getTransport().then((t) => {
      if (!alive) return;
      setKind(t.kind);
      unsub = t.subscribePublic((s) => { setState(s); setCarregando(false); clearTimeout(timer); });
    });
    return () => { alive = false; unsub?.(); clearTimeout(timer); };
  }, []);
  return { state, carregando, kind };
}
