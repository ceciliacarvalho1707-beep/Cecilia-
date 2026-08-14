import type { Block, BlockType, SecretLevel } from '../types'

/** `Omit<Block, 'id'>` would collapse the discriminated union to only its shared keys — this preserves each variant. */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never
export type BlockDraft = DistributiveOmit<Block, 'id'>

/** A real UUID, generated client-side — stays valid as a Postgres `uuid` primary key so the block a
 * user just created can be shown and typed into immediately, without waiting on a server round-trip. */
export function makeBlockId(): string {
  return crypto.randomUUID()
}

/** Assigns stable, readable ids to hand-authored seed blocks: `${prefix}-1`, `${prefix}-2`, ... */
export function withIds(prefix: string, blocks: BlockDraft[]): Block[] {
  return blocks.map((b, i) => ({ ...b, id: `${prefix}-${i + 1}` }) as Block)
}

export function createEmptyBlock(type: BlockType, level: SecretLevel = 'public'): Block {
  const id = makeBlockId()
  switch (type) {
    case 'heading2':
    case 'heading3':
    case 'paragraph':
    case 'quote':
      return { id, type, level, text: '' }
    case 'bulleted_list':
    case 'numbered_list':
      return { id, type, level, items: [{ id: makeBlockId(), text: '' }] }
    case 'divider':
      return { id, type, level }
    case 'callout':
      return { id, type, level, icon: '💡', text: '' }
    case 'image':
      return { id, type, level, url: '', caption: '' }
    case 'page_link':
      return { id, type, level, targetId: '' }
    case 'relation':
      return { id, type, level }
  }
}

export interface BlockMenuEntry {
  type: BlockType
  icon: string
  label: string
  desc: string
}

export const BLOCK_MENU: BlockMenuEntry[] = [
  { type: 'paragraph', icon: '¶', label: 'Texto', desc: 'Parágrafo simples' },
  { type: 'heading2', icon: 'H', label: 'Subtítulo grande', desc: 'Título de seção' },
  { type: 'heading3', icon: 'h', label: 'Subtítulo', desc: 'Título menor' },
  { type: 'bulleted_list', icon: '•', label: 'Lista', desc: 'Marcadores' },
  { type: 'numbered_list', icon: '1.', label: 'Lista numerada', desc: 'Passos ou ordem' },
  { type: 'quote', icon: '❝', label: 'Citação', desc: 'Trecho em destaque' },
  { type: 'callout', icon: '💡', label: 'Bloco de destaque', desc: 'Informação em evidência' },
  { type: 'divider', icon: '—', label: 'Divisor', desc: 'Separa seções' },
  { type: 'image', icon: '🖼️', label: 'Imagem', desc: 'A partir de uma URL' },
  { type: 'page_link', icon: '↗︎', label: 'Link de página', desc: 'Referência a outra página' },
  { type: 'relation', icon: '🕸️', label: 'Relação', desc: 'Conectar a outra página do universo' },
]
