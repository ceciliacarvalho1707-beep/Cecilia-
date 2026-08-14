/**
 * Popula um projeto Supabase (já com a migração aplicada) com o conteúdo fictício de exemplo.
 *
 * Requer um usuário já cadastrado (via a tela de login do site) — o script entra com essas
 * credenciais e semeia dentro do workspace criado automaticamente para ele no primeiro login.
 *
 * Uso:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... SEED_EMAIL=voce@exemplo.com SEED_PASSWORD=senha \
 *     npm run seed
 *
 * Ou coloque as quatro variáveis em .env.local e rode `npm run seed`.
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { seedCampaigns, seedEntities } from '../src/data/universe'
import type { Block, Campaign, Entity } from '../src/types'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const email = process.env.SEED_EMAIL
const password = process.env.SEED_PASSWORD

if (!url || !anonKey || !email || !password) {
  console.error('Defina VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SEED_EMAIL e SEED_PASSWORD (em .env.local ou no ambiente) antes de rodar.')
  process.exit(1)
}

const supabase = createClient(url, anonKey)

function blockContent(block: Block): Record<string, unknown> {
  const { id: _id, type: _type, level: _level, ...rest } = block
  return rest
}

async function insertBlocks(pageId: string, blocks: Block[]) {
  let position = 1000
  for (const block of blocks) {
    const { error } = await supabase
      .from('blocks')
      .insert({ page_id: pageId, type: block.type, level: block.level, position, content: blockContent(block) })
    if (error) throw new Error(`bloco "${block.type}" em ${pageId}: ${error.message}`)
    position += 1000
  }
}

async function main() {
  console.log(`Entrando como ${email}...`)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: email!, password: password! })
  if (authError || !authData.session) throw authError ?? new Error('login falhou')

  const { data: ws, error: wsError } = await supabase.from('workspaces').select('id, name').limit(1).single()
  if (wsError || !ws) throw wsError ?? new Error('workspace não encontrado — faça login pelo site uma vez antes de rodar o seed')
  console.log(`Semeando em "${ws.name}" (${ws.id})`)

  const idMap = new Map<string, string>()

  console.log(`Criando ${seedCampaigns.length} campanhas...`)
  for (const c of seedCampaigns as Campaign[]) {
    const { data, error } = await supabase
      .from('pages')
      .insert({
        workspace_id: ws.id,
        type: 'campaign',
        title: c.title,
        subtitle: c.subtitle,
        icon: c.icon,
        summary: c.summary,
        status: 'public',
        tags: [],
        properties: { campaignStatus: c.status, players: c.players, sessions: c.sessions, party: c.party },
      })
      .select('id')
      .single()
    if (error) throw new Error(`campanha "${c.title}": ${error.message}`)
    idMap.set(c.id, data.id)
  }

  console.log(`Criando ${seedEntities.length} entidades...`)
  for (const e of seedEntities as Entity[]) {
    const { data, error } = await supabase
      .from('pages')
      .insert({
        workspace_id: ws.id,
        type: e.type,
        campaign_id: e.campaignId ? idMap.get(e.campaignId) : null,
        title: e.title,
        subtitle: e.subtitle ?? null,
        icon: e.icon,
        summary: e.summary,
        status: e.status ?? 'public',
        tags: e.tags ?? [],
        properties: { element: e.element },
      })
      .select('id')
      .single()
    if (error) throw new Error(`página "${e.title}": ${error.message}`)
    idMap.set(e.id, data.id)
  }

  console.log('Criando blocos...')
  for (const c of seedCampaigns as Campaign[]) await insertBlocks(idMap.get(c.id)!, c.blocks ?? [])
  for (const e of seedEntities as Entity[]) await insertBlocks(idMap.get(e.id)!, e.blocks)

  console.log('Criando relações...')
  const allSources = [...(seedCampaigns as (Campaign | Entity)[]), ...(seedEntities as (Campaign | Entity)[])]
  for (const item of allSources) {
    for (const targetSeedId of item.relations ?? []) {
      const source = idMap.get(item.id)
      const target = idMap.get(targetSeedId)
      if (!source || !target) {
        console.warn(`  relação ignorada: ${item.id} -> ${targetSeedId} (id não encontrado)`)
        continue
      }
      const { error } = await supabase.from('relations').insert({ source_page_id: source, target_page_id: target })
      if (error) console.warn(`  relação ${item.id} -> ${targetSeedId}: ${error.message}`)
    }
  }

  console.log(`Pronto. ${idMap.size} páginas criadas.`)
}

main().catch((err) => {
  console.error('Falha no seed:', err.message ?? err)
  process.exit(1)
})
