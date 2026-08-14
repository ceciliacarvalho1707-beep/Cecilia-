import { Menu, Search, Settings } from 'lucide-react'

export function Header({ onOpenMobileSidebar }: { onOpenMobileSidebar: () => void }) {
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
        <button className="flex size-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-violet-dim)] to-[var(--color-gold-dim)] text-xs font-semibold text-[var(--color-ink)]">
          M
        </button>
      </div>
    </header>
  )
}
