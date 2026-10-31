/**
 * Tipos centrais do HITSTER PARTY.
 * Todo o estado do jogo é serializável (JSON) para ser salvo no localStorage.
 */

export type Dificuldade = 'facil' | 'media' | 'dificil' | 'muito_dificil';
export type DificuldadeConfig = Dificuldade | 'aleatoria';
export type Origem = 'br' | 'intl';
export type FiltroIdioma = 'todas' | 'br' | 'intl';
export type ModoJogo = 'turno' | 'simultaneo';
export type Tolerancia = 0 | 1 | 2 | 5;

/** Uma música do banco. Os campos de resposta NUNCA são exibidos na tela pública antes da revelação. */
export interface Song {
  /** Identificador único e estável (ex.: "br-asa-branca"). */
  id: string;
  titulo: string;
  /** Intérprete da gravação vinculada ao link do Spotify. */
  artista: string;
  /** Nome do musical, quando a música pertence a um (aceito como resposta na categoria "artista"). */
  musical?: string;
  /** Filme de origem, quando aplicável (apenas informativo). */
  filme?: string;
  /** Ano de lançamento considerado oficial no gabarito. */
  ano: number;
  /** Outros anos legitimamente aceitos (ex.: composição x gravação). */
  anosAceitos?: number[];
  /** Respostas alternativas aceitas (títulos alternativos, compositor famoso etc.). */
  alternativas?: { titulo?: string[]; artista?: string[] };
  /** País de origem da gravação. */
  pais: string;
  /** Idioma da letra. */
  idioma: string;
  /** Brasileira ou internacional (usado no filtro de idioma da partida). */
  origem: Origem;
  genero: string;
  dificuldade: Dificuldade;
  /** URL de uma FAIXA específica: https://open.spotify.com/track/<id> */
  spotifyUrl: string;
  /** Links usados para verificar os dados. */
  fontes: string[];
  curiosidade?: string;
  /** Precisa ser true: o jogo só usa músicas com letra/vocal. */
  temLetra: boolean;
  /** Marca músicas de demonstração incluídas no projeto. */
  exemplo?: boolean;
  /** Resultado da última verificação de link no painel administrativo. */
  verificacao?: { status: 'ok' | 'erro' | 'formato'; em: string; detalhe?: string };
}

export interface Team {
  id: string;
  nome: string;
  cor: string;
  emoji: string;
}

export interface Guess {
  ano: string;
  titulo: string;
  artista: string;
  enviadoEm: string;
}

/** Avaliação individual de cada item. Os pontos são SEMPRE derivados daqui (nunca somados incrementalmente). */
export interface Evaluation {
  titulo: boolean;
  artista: boolean;
  ano: boolean;
  /** true depois que o organizador concluiu (ou confirmou) a avaliação desta equipe neste turno. */
  concluida: boolean;
  /** true se algum item foi alterado manualmente pelo organizador. */
  manual?: boolean;
}

/** Um turno = uma música tocada para uma ou mais equipes. */
export interface Turn {
  id: string;
  songId: string;
  /** Equipes que respondem esta música (1 no modo turno; todas no modo simultâneo). */
  teamIds: string[];
  guesses: Record<string, Guess>;
  evals: Record<string, Evaluation>;
  /** Gabarito aberto no cartão do organizador. Sempre começa fechado. */
  revealed: boolean;
  /** Organizador autorizou exibir a resposta na tela de TV. */
  publicReveal: boolean;
}

export interface Round {
  numero: number;
  turns: Turn[];
}

export interface MatchConfig {
  idioma: FiltroIdioma;
  dificuldade: DificuldadeConfig;
  /** null = modo infinito */
  totalRodadas: number | null;
  modo: ModoJogo;
  tolerancia: Tolerancia;
}

export interface ScoreAdjustment {
  id: string;
  teamId: string;
  pontos: number;
  motivo: string;
  em: string;
}

export interface Match {
  id: string;
  criadaEm: string;
  encerradaEm?: string;
  status: 'em_andamento' | 'encerrada';
  config: MatchConfig;
  /** Equipes na ordem de jogo configurada. */
  teams: Team[];
  rounds: Round[];
  /** Posição atual: índice da rodada e do turno dentro da rodada. */
  cursor: { round: number; turn: number };
  usedSongIds: string[];
  adjustments: ScoreAdjustment[];
  /** Aviso exibido quando o banco não tem músicas suficientes para evitar repetição. */
  avisoRepeticao?: boolean;
}

export interface Settings {
  toleranciaPadrao: Tolerancia;
  spotifyModo: 'web' | 'app';
  /** Hash simples do PIN do organizador (opcional). */
  pinHash?: string;
  reduzirAnimacoes: boolean;
  mostrarAvisoSpotify: boolean;
}

export interface ArchivedMatch {
  match: Match;
  /** Snapshot das músicas usadas, para o histórico continuar legível mesmo se o banco mudar. */
  songs: Record<string, Song>;
}

export interface AppState {
  songs: Song[];
  draftTeams: Team[];
  match: Match | null;
  history: ArchivedMatch[];
  settings: Settings;
  bankVersion: number;
}
