import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { NewPageModal } from '../ui/NewPageModal'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [newPageOpen, setNewPageOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-[var(--color-ink)]">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} onNewPage={() => setNewPageOpen(true)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
            <Outlet />
          </div>
        </main>
      </div>

      {newPageOpen && <NewPageModal onClose={() => setNewPageOpen(false)} />}
    </div>
  )
}
