import { GripVertical, Trash2 } from 'lucide-react'
import type { Block, BlockType } from '../types'
import { BlockContent } from './BlockContent'
import { SecretLevelDot, GuardedContent } from './SecretLevelControl'
import { AddBlockMenu } from './AddBlockMenu'

interface BlockRowProps {
  block: Block
  ownerId: string
  onUpdate: (patch: Partial<Block>) => void
  onDelete: () => void
  onEnter: () => void
  onBackspaceEmpty: () => void
  onInsertAfter: (type: BlockType) => void
  onChangeLevel: (level: Block['level']) => void
  registerRef: (el: HTMLDivElement | null) => void
  dragHandleProps: {
    draggable: boolean
    onDragStart: () => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: () => void
  }
  isDragging: boolean
}

export function BlockRow({
  block,
  ownerId,
  onUpdate,
  onDelete,
  onEnter,
  onBackspaceEmpty,
  onInsertAfter,
  onChangeLevel,
  registerRef,
  dragHandleProps,
  isDragging,
}: BlockRowProps) {
  return (
    <div
      className={`group/block relative flex items-start gap-1.5 rounded-md transition ${isDragging ? 'opacity-40' : ''}`}
      onDragOver={dragHandleProps.onDragOver}
      onDrop={dragHandleProps.onDrop}
    >
      <div className="flex shrink-0 items-center gap-0.5 pt-0.5 opacity-100 transition sm:opacity-0 sm:group-hover/block:opacity-100">
        <SecretLevelDot level={block.level} onChange={onChangeLevel} />
        <button
          type="button"
          draggable={dragHandleProps.draggable}
          onDragStart={dragHandleProps.onDragStart}
          title="Arrastar para reordenar"
          className="flex size-5 cursor-grab items-center justify-center rounded text-[var(--color-ink-faint)] hover:bg-[var(--color-overlay)] hover:text-[var(--color-ink-soft)] active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </button>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <GuardedContent level={block.level}>
          <BlockContent
            block={block}
            ownerId={ownerId}
            onUpdate={onUpdate}
            onEnter={onEnter}
            onBackspaceEmpty={onBackspaceEmpty}
            registerRef={registerRef}
          />
        </GuardedContent>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 pt-0.5 opacity-100 transition sm:opacity-0 sm:group-hover/block:opacity-100">
        <AddBlockMenu compact onPick={onInsertAfter} />
        <button
          type="button"
          onClick={onDelete}
          title="Excluir bloco"
          className="flex size-5 items-center justify-center rounded text-[var(--color-ink-faint)] hover:bg-[var(--color-status-secret-bg)] hover:text-[var(--color-status-secret)]"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
