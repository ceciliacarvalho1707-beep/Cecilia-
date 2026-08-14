import type { Campaign, Entity, SecretLevel, Block } from '../types'
import { withIds, type BlockDraft } from '../editor/blocks'

function overview(prefix: string, text: string): Block[] {
  return withIds(prefix, [{ type: 'paragraph', level: 'public', text }])
}

function fromSections(prefix: string, sections: { heading: string; level: SecretLevel; text: string }[]): Block[] {
  const blocks: BlockDraft[] = []
  for (const s of sections) {
    blocks.push({ type: 'heading3', level: s.level, text: s.heading })
    blocks.push({ type: 'paragraph', level: s.level, text: s.text })
  }
  blocks.push({ type: 'divider', level: 'public' })
  blocks.push({ type: 'relation', level: 'public' })
  return withIds(prefix, blocks)
}

export const seedCampaigns: Campaign[] = [
  {
    id: 'campanha-01',
    title: 'O Silêncio de Rookwood',
    subtitle: 'Horror urbano · Investigação',
    icon: '🎭',
    status: 'ativa',
    summary:
      'Uma cidade portuária onde as pessoas somem sem deixar rastro e a névoa nunca dissipa por completo. O grupo investiga a Igreja de Santo Ambrósio e o que ela realmente guarda no porão.',
    updatedAt: '2026-08-10',
    players: 4,
    sessions: 12,
    party: [
      { name: 'Marta Cole', role: 'Jornalista investigativa' },
      { name: 'Ezra Lin', role: 'Ex-detetive' },
      { name: 'Sam Ferro', role: 'Pescador local' },
      { name: 'Dana Wray', role: 'Estudante de teologia' },
    ],
    blocks: overview(
      'campanha-01-ov',
      'Uma cidade portuária onde as pessoas somem sem deixar rastro e a névoa nunca dissipa por completo. O grupo investiga a Igreja de Santo Ambrósio e o que ela realmente guarda no porão.',
    ),
  },
  {
    id: 'campanha-02',
    title: 'Protocolo Quimera',
    subtitle: 'Bio-horror · Conspiração corporativa',
    icon: '🎭',
    status: 'ativa',
    summary:
      'O Instituto Halvard financiou experimentos proibidos em nome do "aprimoramento humano". Um deles escapou. Agora ele tem um nome de código: Quimera.',
    updatedAt: '2026-08-13',
    players: 5,
    sessions: 8,
    party: [
      { name: 'Rin Okafor', role: 'Bióloga forense' },
      { name: 'Victor Amsel', role: 'Hacker independente' },
      { name: 'Priya Nasser', role: 'Advogada' },
      { name: 'Cole Bishop', role: 'Segurança privado' },
      { name: 'Yuki Tanaka', role: 'Paramédica' },
    ],
    blocks: overview(
      'campanha-02-ov',
      'O Instituto Halvard financiou experimentos proibidos em nome do "aprimoramento humano". Um deles escapou. Agora ele tem um nome de código: Quimera.',
    ),
  },
  {
    id: 'campanha-03',
    title: 'As Marés de Val Noir',
    subtitle: 'Mistério costeiro · Culto',
    icon: '🎭',
    status: 'planejamento',
    summary: 'Uma vila de pescadores presta um culto silencioso a algo que vive sob o farol. Campanha ainda em desenvolvimento.',
    updatedAt: '2026-07-30',
    players: 0,
    sessions: 0,
    blocks: overview('campanha-03-ov', 'Uma vila de pescadores presta um culto silencioso a algo que vive sob o farol. Campanha ainda em desenvolvimento.'),
  },
]

export const seedEntities: Entity[] = [
  // ── Antagonistas ──────────────────────────────
  {
    id: 'aldric-voss',
    type: 'antagonist',
    title: 'Quimera',
    subtitle: 'Aldric Voss',
    icon: '☠️',
    campaignId: 'campanha-02',
    status: 'secret',
    tags: ['antagonista principal', 'experimento'],
    element: 'Conhecimento',
    summary: 'Principal antagonista do universo. Ex-pesquisador-chefe do Instituto Halvard, agora fusão instável entre homem e protocolo.',
    updatedAt: '2026-08-13',
    blocks: fromSections('aldric-voss', [
      {
        heading: 'Conceito',
        level: 'public',
        text: 'Uma figura encapuzada que aparece nos limites da cidade sempre que o Instituto Halvard está prestes a ser exposto. Testemunhas descrevem uma presença que "muda de rosto" ao ser observada por tempo demais.',
      },
      {
        heading: 'Objetivos',
        level: 'master',
        text: 'Completar o Protocolo Quimera em si mesmo, absorvendo os dados dos sujeitos de teste restantes para estabilizar sua forma antes que o corpo original de Voss se decomponha por completo.',
      },
      {
        heading: 'A verdade',
        level: 'secret',
        text: 'Aldric Voss não morreu no incêndio do Laboratório 4. Ele se fundiu ao Experimento 07 na tentativa desesperada de sobreviver — e agora as duas consciências disputam controle do mesmo corpo.',
      },
    ]),
    relations: ['grupo-quimera', 'voraz', 'experimento-07', 'campanha-02', 'instituto-halvard'],
  },
  {
    id: 'arquiteto',
    type: 'antagonist',
    title: 'O Arquiteto',
    icon: '☠️',
    campaignId: 'campanha-01',
    status: 'master',
    tags: ['antagonista', 'culto'],
    element: 'Sombra',
    summary: 'Voz que orienta a Igreja de Santo Ambrósio. Nunca visto — apenas ouvido, através de quem já "assinou o contrato".',
    updatedAt: '2026-08-05',
    blocks: fromSections('arquiteto', [
      { heading: 'Conceito', level: 'public', text: 'Os fiéis da igreja falam dele em sussurros. Dizem que ele desenha os destinos de Rookwood antes que aconteçam.' },
      { heading: 'Método', level: 'master', text: 'Opera através de contratos verbais — promessas que, uma vez aceitas, reescrevem sutilmente a memória de quem as fez.' },
    ]),
    relations: ['rookwood', 'padre-thomas', 'marca-na-parede', 'campanha-02'],
  },
  {
    id: 'voraz',
    type: 'antagonist',
    title: 'Voraz',
    icon: '☠️',
    campaignId: 'campanha-02',
    status: 'master',
    tags: ['entidade', 'experimento'],
    element: 'Sangue',
    summary: 'O primeiro sujeito de teste do Protocolo Quimera a sobreviver à mutação completa. Não fala. Apenas caça.',
    updatedAt: '2026-08-02',
    blocks: fromSections('voraz', [
      { heading: 'Conceito', level: 'public', text: 'Uma forma humanoide alongada, vista nos dutos de ventilação do Instituto nas noites de manutenção.' },
    ]),
    relations: ['aldric-voss', 'instituto-halvard'],
  },

  // ── Criaturas ──────────────────────────────
  {
    id: 'criatura-sangrenta',
    type: 'monster',
    title: 'Filha da Névoa',
    icon: '👹',
    campaignId: 'campanha-01',
    status: 'master',
    element: 'Sangue',
    tags: ['criatura menor'],
    summary: 'Emerge da névoa do porto de Rookwood nas marés altas. Se alimenta de memórias recentes, não de carne.',
    updatedAt: '2026-08-09',
    blocks: fromSections('criatura-sangrenta', [
      { heading: 'Comportamento', level: 'public', text: 'Aparece apenas quando a névoa está espessa o suficiente para esconder mais da metade de um prédio.' },
      { heading: 'Fraqueza', level: 'master', text: 'Luz de sódio (postes antigos) dissolve sua forma temporariamente.' },
    ]),
    relations: ['rookwood', 'arquiteto'],
  },
  {
    id: 'vigia-do-conhecimento',
    type: 'monster',
    title: 'Vigia do Conhecimento',
    icon: '👹',
    campaignId: 'campanha-02',
    status: 'public',
    element: 'Conhecimento',
    tags: ['guardião', 'experimento'],
    summary: 'Construto criado pelo Instituto Halvard para proteger os arquivos do subsolo. Reage a perguntas, não a intrusos.',
    updatedAt: '2026-07-28',
    blocks: fromSections('vigia-do-conhecimento', [
      { heading: 'Comportamento', level: 'public', text: 'Só ataca quem tenta acessar os arquivos sem antes "se apresentar" ao terminal central.' },
    ]),
    relations: ['instituto-halvard', 'experimento-07'],
  },
  {
    id: 'eco-de-val-noir',
    type: 'monster',
    title: 'Eco de Val Noir',
    icon: '👹',
    campaignId: 'campanha-03',
    status: 'public',
    element: 'Água',
    tags: ['entidade costeira'],
    summary: 'Um som, não uma criatura — ao menos é o que a vila insiste em dizer. Vem do farol, uma vez por lua.',
    updatedAt: '2026-07-30',
    blocks: fromSections('eco-de-val-noir', [
      { heading: 'Comportamento', level: 'public', text: 'Detalhes ainda em desenvolvimento para a Campanha 03.' },
    ]),
    relations: ['farol-de-val-noir', 'ordem-do-farol'],
  },

  // ── NPCs ──────────────────────────────
  {
    id: 'alice-mercer',
    type: 'npc',
    title: 'Alice Mercer',
    subtitle: 'Ex-assistente de laboratório',
    icon: '👤',
    campaignId: 'campanha-02',
    status: 'public',
    tags: ['aliada', 'informante'],
    summary: 'Deixou o Instituto Halvard seis meses antes do incidente. Sabe mais do que aparenta — e tem medo o suficiente para ajudar o grupo.',
    updatedAt: '2026-08-11',
    blocks: fromSections('alice-mercer', [
      { heading: 'Perfil', level: 'public', text: 'Trabalha agora em um bar perto do porto. Evita falar sobre o Instituto em lugares fechados.' },
      { heading: 'Segredo', level: 'secret', text: 'Foi ela quem vazou os primeiros relatórios do Experimento 07 para a imprensa — sob pseudônimo.' },
    ]),
    relations: ['instituto-halvard', 'experimento-07', 'dr-elena-cross'],
  },
  {
    id: 'padre-thomas',
    type: 'npc',
    title: 'Padre Thomas Reyes',
    subtitle: 'Pároco de Santo Ambrósio',
    icon: '👤',
    campaignId: 'campanha-01',
    status: 'master',
    tags: ['ambíguo'],
    summary: 'Dirige a paróquia há vinte anos. Ninguém tem certeza de quando exatamente ele "assinou" seu próprio contrato com o Arquiteto.',
    updatedAt: '2026-08-06',
    blocks: fromSections('padre-thomas', [
      { heading: 'Perfil', level: 'public', text: 'Gentil, paciente, sempre disposto a ouvir. Conhece o nome de todos em Rookwood.' },
      { heading: 'Segredo', level: 'master', text: 'Repassa ao Arquiteto tudo o que ouve em confissão.' },
    ]),
    relations: ['arquiteto', 'rookwood'],
  },
  {
    id: 'dr-elena-cross',
    type: 'npc',
    title: 'Dra. Elena Cross',
    subtitle: 'Diretora de Pesquisa, Instituto Halvard',
    icon: '👤',
    campaignId: 'campanha-02',
    status: 'secret',
    tags: ['antagonista secundário'],
    summary: 'Assumiu o cargo de Voss após seu desaparecimento oficial. Publicamente, lidera a "contenção" da crise.',
    updatedAt: '2026-08-12',
    blocks: fromSections('dr-elena-cross', [
      { heading: 'Perfil', level: 'public', text: 'Fria, meticulosa, extremamente competente em entrevistas de imprensa.' },
      { heading: 'A verdade', level: 'secret', text: 'Sabe exatamente onde Voss está e o está mantendo vivo — precisa dos dados que só ele pode gerar.' },
    ]),
    relations: ['aldric-voss', 'instituto-halvard', 'alice-mercer'],
  },

  // ── Locais ──────────────────────────────
  {
    id: 'rookwood',
    type: 'location',
    title: 'Rookwood',
    subtitle: 'Cidade portuária',
    icon: '🗺️',
    campaignId: 'campanha-01',
    status: 'public',
    summary: 'Cidade pequena, cercada de névoa a maior parte do ano. O porto movimenta menos da metade do que movimentava há uma década.',
    updatedAt: '2026-08-08',
    blocks: fromSections('rookwood', [
      { heading: 'Descrição', level: 'public', text: 'Ruas estreitas, casario vitoriano decadente, uma igreja no topo do morro que se vê de qualquer ponto da cidade.' },
    ]),
    relations: ['arquiteto', 'padre-thomas', 'criatura-sangrenta'],
  },
  {
    id: 'instituto-halvard',
    type: 'location',
    title: 'Instituto Halvard',
    subtitle: 'Complexo de pesquisa privado',
    icon: '🗺️',
    campaignId: 'campanha-02',
    status: 'master',
    summary: 'Financiado por capital não declarado, opera sob a fachada de "pesquisa biomédica avançada". O subsolo não consta em nenhuma planta oficial.',
    updatedAt: '2026-08-13',
    blocks: fromSections('instituto-halvard', [
      { heading: 'Descrição', level: 'public', text: 'Prédio de vidro e aço nos arredores da cidade, cercado por segurança privada discreta demais para uma empresa "comum".' },
      { heading: 'Subsolo', level: 'secret', text: 'Quatro níveis abaixo do que consta nas plantas. É lá que o Experimento 07 foi mantido — e onde Voss se fundiu a ele.' },
    ]),
    relations: ['aldric-voss', 'voraz', 'dr-elena-cross', 'experimento-07', 'vigia-do-conhecimento'],
  },
  {
    id: 'farol-de-val-noir',
    type: 'location',
    title: 'Farol de Val Noir',
    icon: '🗺️',
    campaignId: 'campanha-03',
    status: 'public',
    summary: 'Desativado oficialmente há trinta anos. A vila insiste em mantê-lo "por tradição". Ninguém sobe até lá depois do anoitecer.',
    updatedAt: '2026-07-29',
    blocks: fromSections('farol-de-val-noir', [
      { heading: 'Descrição', level: 'public', text: 'Detalhes ainda em desenvolvimento para a Campanha 03.' },
    ]),
    relations: ['eco-de-val-noir', 'ordem-do-farol'],
  },

  // ── Documentos ──────────────────────────────
  {
    id: 'diario-de-voss',
    type: 'document',
    title: 'Diário de Aldric Voss',
    subtitle: 'Manuscrito · 47 páginas',
    icon: '📜',
    campaignId: 'campanha-02',
    status: 'master',
    summary: 'Recuperado parcialmente carbonizado do Laboratório 4. As últimas dez páginas são ilegíveis — ou talvez o grupo ainda não tenha permissão para lê-las.',
    updatedAt: '2026-08-07',
    blocks: fromSections('diario-de-voss', [
      {
        heading: 'Trecho recuperado',
        level: 'master',
        text: '"...o protocolo não pede um corpo perfeito, pede um corpo disposto. Eu estava disposto. Ainda estou — é a única parte de mim que não mudou."',
      },
    ]),
    relations: ['aldric-voss', 'experimento-07'],
  },
  {
    id: 'relatorio-experimento-07',
    type: 'document',
    title: 'Relatório — Experimento 07',
    subtitle: 'Documento interno, classificado',
    icon: '📜',
    campaignId: 'campanha-02',
    status: 'secret',
    summary: 'Relatório técnico dos primeiros dezoito meses do Protocolo Quimera aplicado ao Sujeito 07.',
    updatedAt: '2026-08-12',
    blocks: fromSections('relatorio-experimento-07', [
      { heading: 'Resumo', level: 'secret', text: 'Taxa de rejeição inicial de 94%. Sujeito 07 foi o primeiro a ultrapassar a barreira dos seis meses pós-fusão sem colapso total.' },
    ]),
    relations: ['experimento-07', 'instituto-halvard', 'aldric-voss'],
  },
  {
    id: 'carta-anonima',
    type: 'document',
    title: 'Carta anônima',
    subtitle: 'Entregue à polícia local',
    icon: '📜',
    campaignId: 'campanha-01',
    status: 'public',
    summary: '"Não desçam ao porão de Santo Ambrósio. Ele conta o que você diz para quem não deveria ouvir."',
    updatedAt: '2026-08-04',
    blocks: fromSections('carta-anonima', [
      { heading: 'Conteúdo', level: 'public', text: 'Escrita à mão, sem assinatura, entregue na delegacia de Rookwood três dias antes do último desaparecimento.' },
    ]),
    relations: ['arquiteto', 'rookwood'],
  },

  // ── Pistas ──────────────────────────────
  {
    id: 'marca-na-parede',
    type: 'clue',
    title: 'Marca na parede do porão',
    icon: '🔎',
    campaignId: 'campanha-01',
    status: 'public',
    summary: 'Um símbolo entalhado, repetido sete vezes, encontrado no porão de Santo Ambrósio.',
    updatedAt: '2026-08-05',
    blocks: fromSections('marca-na-parede', [
      { heading: 'Observação', level: 'public', text: 'O símbolo não corresponde a nenhuma iconografia religiosa católica conhecida.' },
      { heading: 'Significado', level: 'master', text: 'É a assinatura do Arquiteto — cada marca representa um contrato selado.' },
    ]),
    relations: ['arquiteto', 'padre-thomas'],
  },
  {
    id: 'amostra-de-sangue',
    type: 'clue',
    title: 'Amostra de sangue não catalogada',
    icon: '🔎',
    campaignId: 'campanha-02',
    status: 'master',
    summary: 'Encontrada em um freezer sem etiqueta no Laboratório 4. Não corresponde a nenhum tipo sanguíneo humano catalogado.',
    updatedAt: '2026-08-11',
    blocks: fromSections('amostra-de-sangue', [
      { heading: 'Análise', level: 'master', text: 'Contém marcadores genéticos parcialmente sintéticos, consistentes com sujeitos do Protocolo Quimera.' },
    ]),
    relations: ['experimento-07', 'voraz'],
  },

  // ── Experimentos ──────────────────────────────
  {
    id: 'experimento-07',
    type: 'experiment',
    title: 'Experimento 07',
    subtitle: 'Protocolo Quimera — Sujeito 07',
    icon: '🧪',
    campaignId: 'campanha-02',
    status: 'secret',
    summary: 'A sétima e única tentativa bem-sucedida de fusão homem-protocolo. Sujeito: Aldric Voss.',
    updatedAt: '2026-08-13',
    blocks: fromSections('experimento-07', [
      { heading: 'Objetivo declarado', level: 'master', text: 'Testar a viabilidade de fusão neural entre um sujeito humano e o Protocolo Quimera para fins de "aprimoramento cognitivo".' },
      { heading: 'Resultado real', level: 'secret', text: 'O sujeito sobreviveu à fusão, mas o protocolo passou a operar com autonomia parcial própria dentro do mesmo corpo.' },
    ]),
    relations: ['aldric-voss', 'voraz', 'instituto-halvard', 'relatorio-experimento-07'],
  },

  // ── Organizações ──────────────────────────────
  {
    id: 'grupo-quimera',
    type: 'organization',
    title: 'Grupo de Quimera',
    subtitle: 'Facção não oficial',
    icon: '🏛️',
    campaignId: 'campanha-02',
    status: 'master',
    summary: 'Ex-funcionários do Instituto Halvard que se recusam a deixar o caso morrer. Metade quer expor a verdade; a outra metade quer proteção.',
    updatedAt: '2026-08-09',
    blocks: fromSections('grupo-quimera', [
      { heading: 'Descrição', level: 'public', text: 'Grupo pequeno e disperso, se comunica por canais criptografados.' },
    ]),
    relations: ['aldric-voss', 'alice-mercer'],
  },
  {
    id: 'ordem-do-farol',
    type: 'organization',
    title: 'Ordem do Farol',
    subtitle: 'Culto local',
    icon: '🏛️',
    campaignId: 'campanha-03',
    status: 'master',
    summary: 'Descendentes das famílias fundadoras de Val Noir. Mantêm o farol aceso "por tradição" — mas todos sabem que é por outro motivo.',
    updatedAt: '2026-07-29',
    blocks: fromSections('ordem-do-farol', [
      { heading: 'Descrição', level: 'public', text: 'Detalhes ainda em desenvolvimento para a Campanha 03.' },
    ]),
    relations: ['farol-de-val-noir', 'eco-de-val-noir'],
  },

  // ── Ideias ──────────────────────────────
  {
    id: 'ideia-relogio',
    type: 'idea',
    title: 'Um relógio que conta ao contrário para alguém específico',
    icon: '💡',
    status: 'public',
    summary: 'Item amaldiçoado — quando chega a zero, a pessoa "marcada" desaparece sem deixar rastro, como os casos de Rookwood.',
    updatedAt: '2026-08-10',
    blocks: fromSections('ideia-relogio', []),
  },
  {
    id: 'ideia-gemeos',
    type: 'idea',
    title: 'NPC gêmeo do Sujeito 07',
    icon: '💡',
    status: 'master',
    summary: 'E se houvesse um segundo sujeito que rejeitou a fusão perfeitamente — e por isso é o único que consegue prever os movimentos de Quimera?',
    updatedAt: '2026-08-06',
    blocks: fromSections('ideia-gemeos', []),
  },
  {
    id: 'ideia-cruzamento',
    type: 'idea',
    title: 'Cruzar Campanha 01 e Campanha 02',
    icon: '💡',
    status: 'secret',
    summary: 'O Arquiteto e o Instituto Halvard podem ter a mesma fonte de financiamento original. Guardar para um arco futuro.',
    updatedAt: '2026-07-25',
    blocks: fromSections('ideia-cruzamento', []),
    relations: ['arquiteto', 'instituto-halvard'],
  },
]

export function typeToPath(type: Entity['type']): string {
  const map: Record<Entity['type'], string> = {
    page: 'paginas',
    campaign: 'campanhas',
    monster: 'criaturas',
    antagonist: 'antagonistas',
    npc: 'personagens',
    location: 'locais',
    document: 'documentos',
    clue: 'pistas',
    experiment: 'experimentos',
    organization: 'organizacoes',
    idea: 'ideias',
  }
  return map[type]
}

export const typeLabels: Record<Entity['type'], { singular: string; plural: string; icon: string }> = {
  page: { singular: 'Página', plural: 'Páginas', icon: '📄' },
  campaign: { singular: 'Campanha', plural: 'Campanhas', icon: '🎭' },
  monster: { singular: 'Criatura', plural: 'Criaturas', icon: '👹' },
  antagonist: { singular: 'Antagonista', plural: 'Antagonistas', icon: '☠️' },
  npc: { singular: 'Personagem', plural: 'Personagens', icon: '👤' },
  location: { singular: 'Local', plural: 'Locais', icon: '🗺️' },
  document: { singular: 'Documento', plural: 'Documentos', icon: '📜' },
  clue: { singular: 'Pista', plural: 'Pistas', icon: '🔎' },
  experiment: { singular: 'Experimento', plural: 'Experimentos', icon: '🧪' },
  organization: { singular: 'Organização', plural: 'Organizações', icon: '🏛️' },
  idea: { singular: 'Ideia', plural: 'Banco de Ideias', icon: '💡' },
}
