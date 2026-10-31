import type { Dificuldade, Song } from '../types';
import { canonicalTrackUrl } from './spotify';

/** Parser CSV simples (RFC 4180): aspas, vírgulas/; e quebras de linha dentro de aspas. */
export function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

export function toCsv(rows: (string | number | undefined)[][]): string {
  return rows
    .map((r) => r.map((v) => {
      const s = v === undefined ? '' : String(v);
      return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','))
    .join('\n');
}

export const CSV_COLUMNS = [
  'id', 'titulo', 'artista', 'musical', 'ano', 'anosAceitos', 'pais', 'idioma', 'origem', 'genero',
  'dificuldade', 'spotifyUrl', 'fontes', 'curiosidade', 'temLetra', 'titulosAlternativos', 'artistasAlternativos', 'filme',
] as const;

const DIFS: Dificuldade[] = ['facil', 'media', 'dificil', 'muito_dificil'];
const DIF_ALIASES: Record<string, Dificuldade> = {
  facil: 'facil', 'fácil': 'facil', media: 'media', 'média': 'media', medio: 'media', 'médio': 'media',
  dificil: 'dificil', 'difícil': 'dificil', muito_dificil: 'muito_dificil', 'muito difícil': 'muito_dificil', 'muito dificil': 'muito_dificil',
  easy: 'facil', medium: 'media', hard: 'dificil', 'very hard': 'muito_dificil',
};

const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean)
    : typeof v === 'string' ? v.split('|').map((s) => s.trim()).filter(Boolean) : [];

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export interface ImportResult {
  songs: Song[];
  errors: string[];
}

/** Valida e normaliza um registro vindo de JSON ou CSV. Rejeita músicas sem letra e links que não sejam de faixa. */
export function validateSong(input: Record<string, unknown>, line: string): { song?: Song; error?: string } {
  const titulo = String(input.titulo ?? '').trim();
  const artista = String(input.artista ?? '').trim();
  const ano = parseInt(String(input.ano ?? ''), 10);
  if (!titulo) return { error: `${line}: título vazio.` };
  if (!artista) return { error: `${line}: artista vazio.` };
  if (!Number.isFinite(ano) || ano < 1000 || ano > new Date().getFullYear() + 1) return { error: `${line}: ano inválido.` };
  const url = canonicalTrackUrl(String(input.spotifyUrl ?? ''));
  if (!url) return { error: `${line}: "spotifyUrl" precisa ser um link de FAIXA (open.spotify.com/track/...). Buscas e playlists não são aceitas.` };
  const temLetraRaw = input.temLetra;
  const temLetra = temLetraRaw === undefined || temLetraRaw === '' ? true : ['true', 'sim', '1', 'yes', 's'].includes(String(temLetraRaw).toLowerCase());
  if (!temLetra) return { error: `${line}: músicas instrumentais (temLetra = false) não são aceitas.` };
  const difRaw = String(input.dificuldade ?? 'media').trim().toLowerCase();
  const dificuldade = DIF_ALIASES[difRaw] ?? (DIFS.includes(difRaw as Dificuldade) ? (difRaw as Dificuldade) : 'media');
  const origemRaw = String(input.origem ?? '').toLowerCase();
  const pais = String(input.pais ?? '').trim();
  const origem = origemRaw === 'br' || origemRaw === 'brasileira' || origemRaw === 'brasil' ? 'br'
    : origemRaw === 'intl' || origemRaw === 'internacional' ? 'intl'
    : /brasil/i.test(pais) ? 'br' : 'intl';
  const musical = String(input.musical ?? '').trim() || undefined;
  const filme = String(input.filme ?? '').trim() || undefined;
  const altT = list(input.titulosAlternativos ?? (input.alternativas as { titulo?: unknown } | undefined)?.titulo);
  const altA = list(input.artistasAlternativos ?? (input.alternativas as { artista?: unknown } | undefined)?.artista);
  const anosAceitos = list(input.anosAceitos).map((x) => parseInt(x, 10)).filter(Number.isFinite);
  const song: Song = {
    id: String(input.id ?? '').trim() || `${origem}-${slug(titulo)}-${slug(artista)}`.slice(0, 80),
    titulo, artista, musical, filme, ano,
    anosAceitos: anosAceitos.length ? anosAceitos : undefined,
    alternativas: altT.length || altA.length ? { titulo: altT.length ? altT : undefined, artista: altA.length ? altA : undefined } : undefined,
    pais: pais || (origem === 'br' ? 'Brasil' : ''),
    idioma: String(input.idioma ?? '').trim() || (origem === 'br' ? 'Português' : ''),
    origem, genero: String(input.genero ?? '').trim() || 'Variado', dificuldade,
    spotifyUrl: url, fontes: list(input.fontes),
    curiosidade: String(input.curiosidade ?? '').trim() || undefined,
    temLetra: true,
  };
  return { song };
}

export function importJson(text: string): ImportResult {
  const data = JSON.parse(text) as unknown;
  const arr = Array.isArray(data) ? data : (data as { songs?: unknown[] })?.songs;
  if (!Array.isArray(arr)) throw new Error('O JSON precisa ser uma lista de músicas ou um objeto { "songs": [...] }.');
  const out: ImportResult = { songs: [], errors: [] };
  arr.forEach((item, i) => {
    const r = validateSong(item as Record<string, unknown>, `Item ${i + 1}`);
    if (r.song) out.songs.push(r.song); else out.errors.push(r.error!);
  });
  return out;
}

export function importCsv(text: string): ImportResult {
  const rows = parseCsv(text.replace(/^﻿/, ''));
  if (rows.length < 2) throw new Error('CSV vazio: inclua uma linha de cabeçalho e ao menos uma música.');
  const header = rows[0].map((h) => h.trim());
  const out: ImportResult = { songs: [], errors: [] };
  rows.slice(1).forEach((r, i) => {
    const obj: Record<string, unknown> = {};
    header.forEach((h, j) => { obj[h] = r[j] ?? ''; });
    const res = validateSong(obj, `Linha ${i + 2}`);
    if (res.song) out.songs.push(res.song); else out.errors.push(res.error!);
  });
  return out;
}

export function songsToCsv(songs: Song[]): string {
  return toCsv([
    [...CSV_COLUMNS],
    ...songs.map((s) => [
      s.id, s.titulo, s.artista, s.musical, s.ano, (s.anosAceitos ?? []).join('|'), s.pais, s.idioma, s.origem, s.genero,
      s.dificuldade, s.spotifyUrl, s.fontes.join('|'), s.curiosidade, s.temLetra ? 'true' : 'false',
      (s.alternativas?.titulo ?? []).join('|'), (s.alternativas?.artista ?? []).join('|'), s.filme,
    ]),
  ]);
}
