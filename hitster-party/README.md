# 🎵 HITSTER PARTY

Jogo de adivinhação musical para festas: várias equipes, um único celular, tablet ou computador ligado à TV.
As equipes ouvem a música no Spotify e tentam acertar **o ano de lançamento**, **o nome da música** e **o artista, banda ou musical**.

Feito em **React + TypeScript + Vite**, com CSS próprio. Funciona 100% no navegador: não precisa de servidor, de conta nem de chave de API.

## Como executar

Requisito: Node.js 18 ou mais recente.

```bash
cd hitster-party
npm install
npm run dev          # abre em http://localhost:5173 (também na rede local, para usar no celular)
```

Versão de produção (gera arquivos estáticos em `dist/`, que podem ser hospedados em Netlify, Vercel, GitHub Pages etc.):

```bash
npm run build
npm run preview
```

Testes:

```bash
npm test             # 29 testes unitários (pontuação, sorteio, importação, fluxo da partida)
npm run build && npm run test:e2e   # 22 verificações no navegador real (Playwright), com capturas em e2e/screenshots/
```

## Como jogar

1. **🎵 NOVA PARTIDA**: cadastre de 2 a 12 equipes (nome, cor, emoji e ordem) e escolha o idioma, a dificuldade, o número de rodadas (10, 20, 30, personalizado ou infinito), o modo de jogo e a tolerância do ano.
2. Em cada rodada aparece um cartão **sem nenhuma pista da resposta**, com o botão preto **▶ TOCAR NO SPOTIFY**, que abre a faixa exata.
3. Em **🎤 HORA DE DAR SEU PALPITE!**, a equipe preenche ano, música e artista e toca em **CONFIRMAR RESPOSTAS**.
4. O organizador abre o **🔒 GABARITO SECRETO**. O sistema sugere a correção (aceita pequenos erros de digitação, títulos alternativos e a tolerância de ano), e o organizador confirma ou corrige cada item.
5. **PRÓXIMA EQUIPE**, depois **PRÓXIMA RODADA**, até a tela de vitória.

**Modos de jogo**
- **Turno por equipe**: cada equipe ouve uma música diferente na sua vez ("É A VEZ DA EQUIPE ROXA!").
- **Resposta simultânea**: todas as equipes ouvem a mesma música. Os palpites ficam ocultos até o gabarito ser revelado.

**Pontuação**: música certa +1 · artista, banda ou **nome do musical** certo +1 · ano dentro da tolerância (exato, ±1, ±2 ou ±5; padrão ±1) +1.
Os pontos nunca são somados de forma incremental. O placar é sempre recalculado a partir das avaliações, então cliques repetidos e correções não duplicam pontos. As correções podem ser feitas na própria avaliação, no **Histórico** (toque em ✔/✘) ou como ajuste avulso no **Placar**.

## Vários aparelhos: TV, celular do organizador e celulares das equipes

Na tela inicial, em "Vai usar mais de um aparelho?", cada aparelho escolhe o seu papel:

| Aparelho | O que mostra | Vê as respostas? |
|---|---|---|
| 📱 **Celular do organizador** | O jogo completo: botão do Spotify, gabarito, avaliação e placar | Sim, só ele |
| 📺 **Tela da TV** (`#tv`) | Rodada, de quem é a vez, categoria, quem já respondeu e placar | Não. A resposta só aparece quando o organizador toca em "Mostrar a resposta também na tela da TV" |
| 🙋 **Celular de equipe** (`#equipe`) | A equipe escolhe o próprio nome e manda o palpite | Não. Também não vê os palpites das outras equipes |

O celular do organizador é a única fonte da verdade. Ele guarda o banco e o gabarito e publica para os outros aparelhos apenas um **estado público**, sem título, artista nem ano. Os palpites enviados pelos celulares chegam ao organizador e só aparecem na avaliação, depois de revelado o gabarito.

**Como a sincronização funciona** (`src/lib/sync.ts`):
- **Versão publicada no claude.ai:** usa o banco de dados da página (capacidade `db`). Funciona entre aparelhos diferentes, desde que cada aparelho abra o link logado numa conta Claude com acesso à página. Celulares de equipe precisam de acesso de *Contribuidor* para enviar palpites. Regras de acesso: só o dono escreve o estado público (`sala`), e cada pessoa escreve apenas o próprio palpite (`palpites/{self}`), que só o dono e editores leem.
- **Rodando localmente (`npm run dev`):** a sincronização acontece entre abas e janelas do **mesmo navegador**. Exemplo: um notebook ligado na TV com uma janela em "Tela da TV" e outra com o organizador. Para aparelhos diferentes sem o claude.ai, seria preciso um backend de tempo real. A interface `Transport` em `sync.ts` já separa essa camada.

### Dá para esconder o nome da música no Spotify?
Não dentro do Spotify: o app sempre mostra título, artista e capa, e nenhum site consegue mudar isso. A solução prática é dividir as telas. A **TV** mostra o jogo sem spoiler, e o **celular do organizador** toca a música (direto ou por Spotify Connect numa caixa de som) longe da vista dos jogadores. O aviso antes de abrir o Spotify lembra isso.

## Sigilo das respostas

- O cartão público não exibe título, artista, ano, capa nem nome de playlist. O botão do Spotify mostra apenas "▶ TOCAR NO SPOTIFY".
- O gabarito é um acordeão real: quando está fechado, os dados **não são renderizados** na página (não é só CSS escondendo). Ele começa fechado a cada novo turno.
- O Spotify mostra o título ao abrir a faixa. Por isso, na primeira vez, o jogo avisa o organizador para manter essa tela fora da visão dos jogadores.
- **Limite honesto**: como tudo roda no navegador, o banco de músicas fica salvo no `localStorage` do aparelho do organizador. Quem mexer nas ferramentas de desenvolvedor desse aparelho consegue ver os dados. Para festas isso basta. O PIN opcional da área do organizador impede o acesso casual, mas não é uma proteção criptográfica.

## Banco de músicas

O projeto vem com **181 músicas de exemplo** (marcadas como "exemplo"), 80 brasileiras e 101 internacionais, de 1917 a 2024, todas com letra, incluindo musicais e trilhas de filmes:
- **58 com verificação detalhada** (`src/data/demoSongs.ts`): o link aponta para uma **faixa específica** encontrada em páginas públicas do Spotify cujo título e artista conferem; ano, autoria e curiosidade foram conferidos no verbete da Wikipédia indicado; anos legitimamente divergentes (composição × gravação, single × álbum) estão em `anosAceitos`.
- **123 do banco ampliado** (`src/data/extraSongs.ts`): o link também foi conferido em páginas públicas do Spotify (título e intérprete). O ano segue o lançamento original conhecido, com anos alternativos quando há divergência. Aqui a fonte é uma busca na Wikipédia que leva ao verbete, e não há curiosidade cadastrada. Algumas faixas são gravações ao vivo, remasterizações ou coletâneas do próprio artista.

Catálogos de streaming mudam. Antes da festa, use **Área do organizador → 🌐 Verificar links on-line**.

### Adicionar músicas

Pela **Área do organizador** (sem editar código):
- **+ Nova música**: formulário com validação (só aceita link de faixa e música com letra);
- **📥 Importar**: arquivo JSON ou CSV (baixe o modelo pelo botão "Baixar modelo CSV"), no modo adicionar/atualizar ou substituir;
- **📤 Exportar**: JSON ou CSV do banco atual.

Formato JSON (lista ou `{ "songs": [...] }`):

```json
{
  "titulo": "Asa Branca",
  "artista": "Luiz Gonzaga",
  "musical": "",
  "ano": 1947,
  "anosAceitos": [],
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Baião",
  "dificuldade": "facil",
  "spotifyUrl": "https://open.spotify.com/track/6wiuWSeZQ585HWw3pbLpkx",
  "fontes": ["https://en.wikipedia.org/wiki/Asa_Branca"],
  "curiosidade": "Composta com Humberto Teixeira.",
  "temLetra": true,
  "alternativas": { "titulo": [], "artista": [] }
}
```

`dificuldade`: `facil`, `media`, `dificil` ou `muito_dificil`. `origem`: `br` ou `intl`. No CSV, separe listas com `|`.
São rejeitados: links de busca ou de playlist, músicas com `temLetra: false`, ano inválido e título ou artista vazios.
O banco suporta milhares de músicas (o limite prático é o `localStorage`, cerca de 5 MB, ou seja, dezenas de milhares de registros).

### Sorteio

Sorteio uniforme com o gerador criptográfico do navegador, sem ciclos, sem alternar país, época ou gênero. Ele não repete músicas na partida enquanto houver inéditas e evita apenas o mesmo artista duas vezes seguidas. Se a dificuldade escolhida acabar, usa outras dificuldades. Só repete quando o banco inteiro (no filtro de idioma) se esgota, e nesse caso avisa na tela. Com um banco pequeno a variedade é limitada; importe mais músicas para partidas longas.

## O que depende de serviços externos

| Recurso | Depende de | Observação |
|---|---|---|
| Tocar música | App ou site do Spotify | O jogo só abre o link da faixa. Tocar a música inteira depende da conta Spotify do organizador. |
| Verificar links on-line | oEmbed público do Spotify (`open.spotify.com/oembed`) | Não usa credenciais e roda no navegador do organizador. **Não foi testado de ponta a ponta** neste ambiente de desenvolvimento, porque o acesso ao Spotify estava bloqueado na rede. Se a consulta falhar, o jogo informa o erro em vez de marcar o link como inválido. A verificação de *formato* funciona sem internet. |
| Fonte "Outfit" | Google Fonts | Sem internet, o jogo usa a fonte do sistema. |

Não há integração com a API Web do Spotify e não há segredo no código. Se no futuro você quiser buscar músicas automaticamente pela API oficial, faça isso num backend (por exemplo, uma função serverless) que guarde `SPOTIFY_CLIENT_ID` e `SPOTIFY_CLIENT_SECRET` em variáveis de ambiente e exporte o resultado no formato JSON acima. Nunca coloque essas credenciais no código do navegador.

## Estrutura

```
src/
  data/demoSongs.ts      banco de demonstração verificado
  lib/scoring.ts         normalização, comparação tolerante, pontos, placar e empates
  lib/selection.ts       sorteio sem repetição
  lib/csv.ts             importação/exportação e validação
  lib/spotify.ts         validação de links de faixa e verificação oEmbed
  lib/export.ts          exportação do placar (CSV/JSON/texto)
  store/store.ts         estado global + persistência (localStorage) + sincronização entre abas
  components/game.tsx    botão do Spotify, gabarito secreto, palpites, avaliação, placar
  components/ui.tsx      logo, vinil, badges, chips, toggles
  screens/               Início, Configuração, Jogo, Placar, Classificação/Vitória, Histórico, Configurações, Organizador, TV
e2e/e2e.mjs              teste ponta a ponta (Playwright)
```
