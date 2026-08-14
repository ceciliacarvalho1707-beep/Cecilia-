# 🎲 Meu Universo — Bíblia do Universo

Um workspace estilo Notion, com identidade própria de mistério e investigação, para organizar campanhas de RPG: personagens, antagonistas, criaturas, locais, documentos, pistas, experimentos, organizações e ideias.

Esta é a primeira etapa do projeto: **fundação visual** — identidade, layout, navegação e experiência de uso, com conteúdo fictício de exemplo. Funcionalidades (edição real, banco de dados, autenticação, backend) virão em etapas futuras.

## Rodando localmente

```bash
npm install
npm run dev
```

## Stack

- React + TypeScript + Vite
- React Router
- Tailwind CSS v4
- lucide-react (ícones)

## Estrutura

- `src/data/universe.ts` — dados fictícios do universo (campanhas, entidades)
- `src/data/navigation.ts` — árvore de navegação da sidebar
- `src/components/layout` — sidebar, header, breadcrumbs, shell da aplicação
- `src/components/ui` — cards, badges de segredo, blocos revogáveis, modal de nova página
- `src/pages` — dashboard, coleções, páginas de campanha e de entidades
