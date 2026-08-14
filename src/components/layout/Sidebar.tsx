import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Plus, X } from 'lucide-react'
import { navigation, campaignSections, buildCampaignChildren, type NavChild } from '../../data/navigation'
import { useUniverse } from '../../store/UniverseStore'

function isChildActive(href: string, pathname: string, hash: string): boolean {
  const [childPath, childHash] = href.split('#')
  if (childHash) return pathname === childPath && hash === `#${childHash}`
  return pathname === childPath
}

function CampaignChild({ child, pathname, hash }: { child: NavChild; pathname: string; hash: string }) {
  const campaignId = child.href.split('/').pop()
  const isCurrentCampaign = pathname === `/campanhas/${campaignId}`
  const active = isChildActive(child.href, pathname, hash)

  return (
    <div>
      <Link
        to={child.href}
        className={`group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13.5px] transition ${
          active
            ? 'bg-[var(--color-overlay)] text-[var(--color-gold-soft)]'
            : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-overlay)]/60 hover:text-[var(--color-ink-soft)]'
        }`}
      >
        <span className="text-[13px] opacity-80">{child.icon}</span>
        <span className="truncate">{child.label}</span>
        {child.badge && (
          <span className="ml-auto shrink-0 rounded-full border border-[var(--color-border-soft)] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[var(--color-ink-faint)]">
            {child.badge}
          </span>
        )}
      </Link>
      {isCurrentCampaign && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-[var(--color-border-soft)] pl-3">
          {campaignSections(campaignId!).map((s) => (
            <Link
              key={s.label}
              to={s.href}
              className={`flex items-center gap-2 rounded-md px-2 py-1 text-[13px] transition ${
                hash === `#${s.href.split('#')[1]}`
                  ? 'text-[var(--color-gold-soft)]'
                  : 'text-[var(--color-ink-faint)] hover:text-[var(--color-ink-soft)]'
              }`}
            >
              <span className="text-[11px] opacity-70">{s.icon}</span>
              <span className="truncate">{s.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({
  mobileOpen,
  onCloseMobile,
  onNewPage,
}: {
  mobileOpen: boolean
  onCloseMobile: () => void
  onNewPage: () => void
}) {
  const { pathname, hash } = useLocation()
  const { campaigns } = useUniverse()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Campanhas: true })

  useEffect(() => {
    const topGroup = navigation.find((g) => g.href !== '/' && pathname.startsWith(g.href ?? '#'))
    if (topGroup) setExpanded((e) => ({ ...e, [topGroup.label]: true }))
  }, [pathname])

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md border border-[var(--color-gold-dim)]/50 bg-[var(--color-overlay)] text-sm">
            🎲
          </span>
          <div className="leading-tight">
            <p className="font-serif-display text-[15px] font-semibold text-[var(--color-ink)]">Meu Universo</p>
            <p className="text-[10.5px] uppercase tracking-wider text-[var(--color-ink-faint)]">Bíblia do Universo</p>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="flex size-8 items-center justify-center rounded-md text-[var(--color-ink-muted)] hover:bg-[var(--color-overlay)] lg:hidden"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-3">
        {navigation.map((group) => {
          const children = group.dynamicCampaigns ? buildCampaignChildren(campaigns) : undefined
          const hasChildren = !!children?.length
          const isOpen = expanded[group.label]
          const groupActive = group.href === '/' ? pathname === '/' : pathname.startsWith(group.href ?? '#')

          return (
            <div key={group.label}>
              <div
                className={`flex items-center rounded-md transition ${
                  groupActive && !hasChildren ? 'bg-[var(--color-overlay)]' : ''
                }`}
              >
                <Link
                  to={group.href ?? '#'}
                  onClick={onCloseMobile}
                  className={`flex flex-1 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13.5px] font-medium transition ${
                    groupActive
                      ? 'text-[var(--color-gold-soft)]'
                      : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-overlay)]/60'
                  }`}
                >
                  <span className="text-[14px]">{group.icon}</span>
                  <span className="truncate">{group.label}</span>
                </Link>
                {hasChildren && (
                  <button
                    onClick={() => setExpanded((e) => ({ ...e, [group.label]: !e[group.label] }))}
                    className="mr-1 flex size-6 shrink-0 items-center justify-center rounded text-[var(--color-ink-faint)] hover:bg-[var(--color-overlay)] hover:text-[var(--color-ink-soft)]"
                  >
                    <ChevronRight className={`size-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                )}
              </div>

              {hasChildren && isOpen && (
                <div className="ml-3.5 mt-0.5 space-y-0.5 border-l border-[var(--color-border-soft)] pl-2.5">
                  {children!.map((child) => (
                    <CampaignChild key={child.href} child={child} pathname={pathname} hash={hash} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-[var(--color-border-soft)] p-2.5">
        <button
          onClick={onNewPage}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] font-medium text-[var(--color-ink-muted)] transition hover:bg-[var(--color-overlay)] hover:text-[var(--color-gold-soft)]"
        >
          <Plus className="size-4" />
          Nova página
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden w-[268px] shrink-0 border-r border-[var(--color-border-soft)] bg-[var(--color-abyss)] lg:block">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-[var(--color-border-soft)] bg-[var(--color-abyss)] shadow-[var(--shadow-float)]">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
