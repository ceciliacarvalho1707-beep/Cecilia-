import type { SupabaseClient } from '@supabase/supabase-js'
import type { Block } from '../types'
import { blockToContent } from './mappers'

/** Finds the single id that moved between two same-length, same-membership id arrays. */
function findMovedBlockId(oldIds: string[], newIds: string[]): string | null {
  for (const candidate of oldIds) {
    const oldWithout = oldIds.filter((id) => id !== candidate).join(',')
    const newWithout = newIds.filter((id) => id !== candidate).join(',')
    if (oldWithout === newWithout) return candidate
  }
  return null
}

/** Midpoint of two fractional positions, or an edge extension when at the start/end of the list.
 * Returns null when the gap is too thin to split further — the caller should reindex and retry. */
function computePosition(prev: number | undefined, next: number | undefined): number | null {
  if (prev !== undefined && next !== undefined) {
    const mid = prev + (next - prev) / 2
    if (mid === prev || mid === next) return null
    return mid
  }
  if (prev !== undefined) return prev + 1000
  if (next !== undefined) return next - 1000
  return 1000
}

/**
 * Persists the difference between the last-synced block list and the new one: deletes removed
 * blocks, updates changed content, moves at most one reordered block, and inserts new ones —
 * each as its own row write, never a full-page rewrite. Mutates `positions` (blockId -> position)
 * as it goes so the next call has fresh data.
 */
export async function syncBlocks(
  supabase: SupabaseClient,
  pageId: string,
  oldBlocks: Block[],
  newBlocks: Block[],
  positions: Map<string, number>,
): Promise<void> {
  const oldIds = oldBlocks.map((b) => b.id)
  const newIds = newBlocks.map((b) => b.id)
  const oldSet = new Set(oldIds)
  const newSet = new Set(newIds)

  const removed = oldBlocks.filter((b) => !newSet.has(b.id))
  const added = newBlocks.filter((b) => !oldSet.has(b.id))
  const kept = newBlocks.filter((b) => oldSet.has(b.id))

  if (removed.length) {
    await supabase.from('blocks').delete().in('id', removed.map((b) => b.id))
    for (const b of removed) positions.delete(b.id)
  }

  for (const block of kept) {
    const previous = oldBlocks.find((b) => b.id === block.id)!
    if (JSON.stringify(previous) !== JSON.stringify(block)) {
      await supabase.from('blocks').update({ type: block.type, level: block.level, content: blockToContent(block) }).eq('id', block.id)
    }
  }

  const keptOldOrder = oldIds.filter((id) => newSet.has(id))
  const keptNewOrder = newIds.filter((id) => oldSet.has(id))
  if (keptOldOrder.join(',') !== keptNewOrder.join(',')) {
    const movedId = findMovedBlockId(keptOldOrder, keptNewOrder)
    if (movedId) {
      const idx = newIds.indexOf(movedId)
      const prevId = newIds[idx - 1]
      const nextId = newIds[idx + 1]
      let pos = computePosition(prevId ? positions.get(prevId) : undefined, nextId ? positions.get(nextId) : undefined)

      if (pos === null) {
        await supabase.rpc('reindex_page_blocks', { p_page_id: pageId })
        const { data } = await supabase.from('blocks').select('id, position').eq('page_id', pageId)
        for (const row of data ?? []) positions.set(row.id, row.position)
        pos = computePosition(prevId ? positions.get(prevId) : undefined, nextId ? positions.get(nextId) : undefined) ?? 1000
      }

      await supabase.from('blocks').update({ position: pos }).eq('id', movedId)
      positions.set(movedId, pos)
    }
  }

  for (const block of added) {
    const idx = newIds.indexOf(block.id)
    const prevId = newIds[idx - 1]
    const nextId = newIds[idx + 1]
    const pos =
      computePosition(prevId ? positions.get(prevId) : undefined, nextId ? positions.get(nextId) : undefined) ??
      (positions.size ? Math.max(...positions.values()) + 1000 : 1000)

    await supabase.from('blocks').insert({ id: block.id, page_id: pageId, type: block.type, level: block.level, position: pos, content: blockToContent(block) })
    positions.set(block.id, pos)
  }
}
