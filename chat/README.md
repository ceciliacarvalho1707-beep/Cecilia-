# Nosso Cantinho

App de mensagens para amigas: conversas e grupos, fotos, vídeos, áudios, figurinhas,
enquetes, jogos, ligações de voz e vídeo, e notificações. Funciona no navegador e pode
ser instalado na tela de início do celular.

Endereço: https://nossaconversa.netlify.app

## Como funciona

| Parte | Onde fica | O que faz |
|---|---|---|
| `public/index.html` | Netlify | O app inteiro (tela, lógica, estilos) |
| `public/sw.js` | Netlify | Abre sem internet, notificações e número no ícone |
| `public/supabase.js` | Netlify | Biblioteca do Supabase (2.118.0), servida junto com o site |
| `netlify/functions/msgs.mjs` | Netlify | Envia as notificações e guarda as conversas antigas (antes do Supabase) |
| Banco e arquivos | Supabase | Mensagens, grupos, pessoas, fotos, vídeos e áudios |
| Tempo real | Supabase Realtime | Mensagens na hora, "digitando", online e o toque das ligações |
| Ligações | Direto entre os celulares | WebRTC com servidores STUN do Google |

Cada conversa é identificada pelo código (SHA-256) da senha, calculado no celular. O app
manda esse código no cabeçalho `x-sala`, e as regras do banco só mostram a conversa cujo
código veio no pedido. O convite por link leva a senha no endereço (`#entrar=...`).

## Configurar do zero

1. **Supabase:** crie um projeto e rode `supabase.sql` inteiro no SQL Editor.
2. Ponha a Project URL e a chave **anon** (pública) em `SUPA_URL` e `SUPA_KEY`, no começo
   do script de `public/index.html`. Nunca use a chave `service_role` no app.
3. **Netlify:** importe o repositório com *Base directory* `chat`.

## Publicar

Cada publicação no Netlify gasta 15 créditos (300 por mês no plano grátis). O Netlify só
publica quando `public/`, `netlify/` ou `package.json` mudam, e pula envios com
`[rascunho]` na mensagem do commit.
