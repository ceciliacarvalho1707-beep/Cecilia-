import { useEffect, useRef, useState } from 'react'
import type { Block, BlockType } from '../types'
import { createEmptyBlock } from './blocks'
import { placeCaretAtEnd } from './EditableText'
import { BlockRow } from './BlockRow'
import { AddBlockMenu } from './AddBlockMenu'

export function BlockEditor({ ownerId, blocks, onChange }: { ownerId: string; blocks: Block[]; onChange: (blocks: Block[]) => void }) {
  const refs = useRef(new Map<string, HTMLDivElement>())
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)

  useEffect(() => {
    if (!focusId) return
    const el = refs.current.get(focusId)
    if (el) placeCaretAtEnd(el)
    setFocusId(null)
  }, [focusId, blocks])

  function updateBlock(id: string, patch: Partial<Block>) {
    onChange(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)))
  }

  function deleteBlock(id: string) {
    const idx = blocks.findIndex((b) => b.id === id)
    const next = blocks.filter((b) => b.id !== id)
    onChange(next)
    const prev = next[idx - 1] ?? next[0]
    if (prev) setFocusId(prev.id)
  }

  function insertAfter(id: string, type: BlockType) {
    const idx = blocks.findIndex((b) => b.id === id)
    const newBlock = createEmptyBlock(type)
    const next = [...blocks]
    next.splice(idx + 1, 0, newBlock)
    onChange(next)
    setFocusId(newBlock.id)
  }

  function moveBlock(sourceId: string, targetId: string) {
    if (sourceId === targetId) return
    const from = blocks.findIndex((b) => b.id === sourceId)
    const to = blocks.findIndex((b) => b.id === targetId)
    if (from === -1 || to === -1) return
    const next = [...blocks]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  function addBlockAtEnd(type: BlockType) {
    const newBlock = createEmptyBlock(type)
    onChange([...blocks, newBlock])
    setFocusId(newBlock.id)
  }

  if (blocks.length === 0) {
    return (
      <button
        type="button"
        onClick={() => addBlockAtEnd('paragraph')}
        className="w-full rounded-lg border border-dashed border-[var(--color-border)] py-10 text-center text-sm text-[var(--color-ink-faint)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink-soft)]"
      >
        Clique para começar a escrever...
      </button>
    )
  }

  return (
    <div className="space-y-1">
      {blocks.map((block) => (
        <BlockRow
          key={block.id}
          block={block}
          ownerId={ownerId}
          onUpdate={(patch) => updateBlock(block.id, patch)}
          onDelete={() => deleteBlock(block.id)}
          onEnter={() => insertAfter(block.id, 'paragraph')}
          onBackspaceEmpty={() => deleteBlock(block.id)}
          onInsertAfter={(type) => insertAfter(block.id, type)}
          onChangeLevel={(level) => updateBlock(block.id, { level })}
          registerRef={(el) => {
            if (el) refs.current.set(block.id, el)
            else refs.current.delete(block.id)
          }}
          dragHandleProps={{
            draggable: true,
            onDragStart: () => setDraggedId(block.id),
            onDragOver: (e) => e.preventDefault(),
            onDrop: () => {
              if (draggedId) moveBlock(draggedId, block.id)
              setDraggedId(null)
            },
          }}
          isDragging={draggedId === block.id}
        />
      ))}
      <div className="pl-7 pt-1">
        <AddBlockMenu onPick={addBlockAtEnd} />
      </div>
    </div>
  )
}
