import { useEffect, useRef } from 'react'

/** Calls `commit(value)` `delay`ms after `value` stops changing — keeps autosave off the keystroke path. */
export function useDebouncedCommit<T>(value: T, commit: (value: T) => void, delay = 600) {
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    const handle = setTimeout(() => commit(value), delay)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
}
