import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export function placeCaretAtEnd(el: HTMLElement) {
  el.focus()
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

interface EditableTextProps {
  value: string
  onChange: (text: string) => void
  onEnter?: () => void
  onBackspaceEmpty?: () => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

/**
 * A single-line, plain-text contentEditable primitive. The DOM is the source of truth while
 * focused — the initial value is written once on mount and never re-synced from props, so
 * re-renders triggered by our own typing don't reset the caret position.
 */
export const EditableText = forwardRef<HTMLDivElement, EditableTextProps>(function EditableText(
  { value, onChange, onEnter, onBackspaceEmpty, placeholder, className, autoFocus },
  ref,
) {
  const innerRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(ref, () => innerRef.current as HTMLDivElement, [])

  useEffect(() => {
    const el = innerRef.current
    if (el && el.textContent !== value) el.textContent = value
    if (autoFocus && el) placeCaretAtEnd(el)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative">
      {value === '' && placeholder && (
        <span className={`pointer-events-none absolute inset-0 select-none text-[var(--color-ink-faint)] ${className ?? ''}`}>{placeholder}</span>
      )}
      <div
        ref={innerRef}
        contentEditable
        suppressContentEditableWarning
        className={`relative outline-none ${className ?? ''}`}
        onInput={(e) => onChange(e.currentTarget.textContent ?? '')}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onEnter?.()
          } else if (e.key === 'Backspace') {
            if ((e.currentTarget.textContent ?? '') === '' && onBackspaceEmpty) {
              e.preventDefault()
              onBackspaceEmpty()
            }
          }
        }}
      />
    </div>
  )
})
