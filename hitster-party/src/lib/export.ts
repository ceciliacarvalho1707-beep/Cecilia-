import type { Match, Song } from '../types';
import { toCsv } from './csv';
import { computeScores, pointsOf } from './scoring';

export function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');

/** CSV com o placar final + detalhamento de cada turno (com BOM para abrir acentuado no Excel). */
export function scoreCsv(match: Match, songOf: (id: string) => Song | undefined): string {
  const rows = computeScores(match);
  const placar = [
    ['Posição', 'Equipe', 'Pontos', 'Acertos', 'Música', 'Artista/Musical', 'Ano', 'Ajustes'],
    ...rows.map((r) => [r.posicao, r.team.nome, r.total, r.acertos, r.acertosTitulo, r.acertosArtista, r.acertosAno, r.ajustes]),
  ];
  const detalhe: (string | number)[][] = [['Rodada', 'Equipe', 'Música (gabarito)', 'Artista', 'Ano', 'Palpite ano', 'Palpite música', 'Palpite artista', 'Música ✔', 'Artista ✔', 'Ano ✔', 'Pontos']];
  for (const round of match.rounds) {
    for (const turn of round.turns) {
      const s = songOf(turn.songId);
      for (const id of turn.teamIds) {
        const team = match.teams.find((t) => t.id === id);
        const g = turn.guesses[id];
        const ev = turn.evals[id];
        detalhe.push([round.numero, team?.nome ?? '?', s?.titulo ?? turn.songId, s?.artista ?? '', s?.ano ?? '', g?.ano ?? '', g?.titulo ?? '', g?.artista ?? '',
          ev?.titulo ? 'sim' : 'não', ev?.artista ? 'sim' : 'não', ev?.ano ? 'sim' : 'não', pointsOf(ev)]);
      }
    }
  }
  return '﻿' + toCsv(placar) + '\n\n' + toCsv(detalhe);
}

export function exportScoreCsv(match: Match, songOf: (id: string) => Song | undefined) {
  download(`hitster-placar-${stamp()}.csv`, scoreCsv(match, songOf), 'text/csv');
}

export function exportScoreJson(match: Match) {
  download(`hitster-partida-${stamp()}.json`, JSON.stringify({ placar: computeScores(match).map((r) => ({ posicao: r.posicao, equipe: r.team.nome, pontos: r.total, acertos: r.acertos })), partida: match }, null, 2), 'application/json');
}

/** Texto curto para colar no WhatsApp. */
export function scoreText(match: Match): string {
  const medal = ['🥇', '🥈', '🥉'];
  const linhas = computeScores(match).map((r) => `${medal[r.posicao - 1] ?? `${r.posicao}º`} ${r.team.emoji} ${r.team.nome} — ${r.total} pts`);
  return `🎵 HITSTER PARTY — placar (${match.rounds.length} rodada${match.rounds.length === 1 ? '' : 's'})\n${linhas.join('\n')}`;
}
