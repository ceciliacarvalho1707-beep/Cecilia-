import type { Campaign } from '../types'

export interface NavChild {
  label: string
  icon: string
  href: string
  badge?: string
}

export interface NavGroup {
  label: string
  icon: string
  href?: string
  collapsible?: boolean
  /** Campaigns change at runtime, so this group's children are computed from live data instead of a static list. */
  dynamicCampaigns?: boolean
}

export function buildCampaignChildren(campaigns: Campaign[]): NavChild[] {
  return [
    ...campaigns.map((c) => ({ label: c.title || 'Sem título', icon: c.icon, href: `/campanhas/${c.id}` })),
    { label: 'Próximas campanhas', icon: '💭', href: '/campanhas#futuras', badge: 'em breve' },
  ]
}

export const campaignSections = (campaignId: string): NavChild[] => [
  { label: 'Visão geral', icon: '📖', href: `/campanhas/${campaignId}#visao-geral` },
  { label: 'Personagens', icon: '👥', href: `/campanhas/${campaignId}#personagens` },
  { label: 'Ameaças', icon: '👹', href: `/campanhas/${campaignId}#ameacas` },
  { label: 'NPCs', icon: '👤', href: `/campanhas/${campaignId}#npcs` },
  { label: 'Locais', icon: '🗺️', href: `/campanhas/${campaignId}#locais` },
  { label: 'Documentos', icon: '📜', href: `/campanhas/${campaignId}#documentos` },
  { label: 'Pistas', icon: '🔎', href: `/campanhas/${campaignId}#pistas` },
  { label: 'Organizações', icon: '🏛️', href: `/campanhas/${campaignId}#organizacoes` },
  { label: 'Experimentos', icon: '🧪', href: `/campanhas/${campaignId}#experimentos` },
  { label: 'Segredos', icon: '🔒', href: `/campanhas/${campaignId}#segredos` },
]

export const navigation: NavGroup[] = [
  { label: 'Início', icon: '🏠', href: '/' },
  { label: 'Campanhas', icon: '📚', href: '/campanhas', collapsible: true, dynamicCampaigns: true },
  { label: 'Criaturas', icon: '👹', href: '/criaturas' },
  { label: 'Antagonistas', icon: '☠️', href: '/antagonistas' },
  { label: 'Personagens', icon: '👤', href: '/personagens' },
  { label: 'Locais', icon: '🗺️', href: '/locais' },
  { label: 'Documentos', icon: '📜', href: '/documentos' },
  { label: 'Pistas', icon: '🔎', href: '/pistas' },
  { label: 'Experimentos', icon: '🧪', href: '/experimentos' },
  { label: 'Organizações', icon: '🏛️', href: '/organizacoes' },
  { label: 'Conexões', icon: '🔗', href: '/conexoes' },
  { label: 'Banco de Ideias', icon: '💡', href: '/ideias' },
  { label: 'Páginas', icon: '📄', href: '/paginas' },
  { label: 'Arquivo', icon: '🗑️', href: '/arquivo' },
]
