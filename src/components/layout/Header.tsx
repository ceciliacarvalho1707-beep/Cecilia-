import { useRef, useState } from 'react'
import { LogOut, Menu, Search, Settings } from 'lucide-react'
import { useAuth } from '../../store/AuthProvider'
import { useClickOutside } from '../../hooks/useClickOutside'

export function Header({ onOpenMobileSidebar }: { onOpenMobileSidebar: () => void }) {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useClickOutside(menuRef, () => setMenuOpen(false))

  const initial = (user?.email ?? '?').charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--color-border-soft)] bg-[var(--color-void)]/85 px-4 py-3 backdrop-blur-md sm:px-6">
      <button
        onClick={onOpenMobileSidebar}
        className="flex size-9 shrink-0 items-center justify-center rounded-md text-[var(--color-ink-muted)] hover:bg-[var(--color-overlay)] hover:text-[var(--color-ink)] lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-faint)]" />
        <input
          type="text"
          placeholder="Pesquisar no universo..."
          disabled
          className="w-full cursor-not-allowed rounded-lg border border-[var(--color-border)] bg-[var(--color-raised)] py-2 pl-9 pr-3 text-sm text-[var(--color-ink-soft)] placeholder:text-[var(--color-ink-faint)] outline-none transition focus:border-[var(--color-gold-dim)]"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-[var(--color-border)] bg-[var(--color-overlay)] px-1.5 py-0.5 text-[10px] text-[var(--color-ink-faint)] sm:block">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button className="flex size-9 items-center justify-center rounded-md text-[var(--color-ink-muted)] transition hover:bg-[var(--color-overlay)] hover:text-[var(--color-ink)]">
          <Settings className="size-[18px]" />
        </button>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex size-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-violet-dim)] to-[var(--color-gold-dim)] text-xs font-semibold text-[var(--color-ink)]"
          >
            {initial}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-56 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-raised)] p-1.5 shadow-[var(--shadow-float)]">
              <p className="truncate px-2.5 py-1.5 text-xs text-[var(--color-ink-faint)]">{user?.email}</p>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  signOut()
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-[var(--color-ink-soft)] transition hover:bg-[var(--color-overlay)]"
              >
                <LogOut className="size-3.5" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
