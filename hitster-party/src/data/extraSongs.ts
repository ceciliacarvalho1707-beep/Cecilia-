import type { Song } from '../types';

/**
 * BANCO AMPLIADO (gerado a partir de buscas em páginas públicas do Spotify).
 *  - Cada link aponta para uma FAIXA específica cujo título e intérprete conferem na página do Spotify.
 *  - Os anos seguem o lançamento original da música; divergências legítimas estão em `anosAceitos`.
 *  - A fonte indicada é uma busca na Wikipédia que leva ao verbete da música ou do artista.
 *    Estas músicas tiveram verificação mais leve que o banco de demonstração principal:
 *    revise pelo painel do organizador quando quiser 100% de rigor.
 */
type Base = Omit<Song, 'temLetra' | 'exemplo' | 'spotifyUrl'> & { spotify: string };

const raw: Base[] = [
 {
  "id": "br-mas-que-nada-jorge-ben",
  "titulo": "Mas, Que Nada!",
  "artista": "Jorge Ben",
  "ano": 1963,
  "alternativas": {
   "titulo": [
    "Mas Que Nada"
   ]
  },
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Samba",
  "dificuldade": "media",
  "spotify": "6U03Orwr5Dxt8jahLnQpYV",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Mas%2C%20Que%20Nada%21%20Jorge%20Ben"
  ]
 },
 {
  "id": "br-ainda-bem-marisa-monte",
  "titulo": "Ainda Bem",
  "artista": "Marisa Monte",
  "ano": 2011,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "MPB",
  "dificuldade": "media",
  "spotify": "2I0KjmrfE6CweVGX9iBNdo",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Ainda%20Bem%20Marisa%20Monte"
  ]
 },
 {
  "id": "br-aguas-de-marco-elis-regina-e-tom-jo",
  "titulo": "Águas de Março",
  "artista": "Elis Regina e Tom Jobim",
  "ano": 1974,
  "anosAceitos": [
   1972
  ],
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Bossa nova / MPB",
  "dificuldade": "media",
  "spotify": "4VhGrvG7RTngmMKydcyZXH",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=%C3%81guas%20de%20Mar%C3%A7o%20Elis%20Regina"
  ]
 },
 {
  "id": "br-tempo-perdido-legiao-urbana",
  "titulo": "Tempo Perdido",
  "artista": "Legião Urbana",
  "ano": 1986,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "facil",
  "spotify": "7MnT7msJZg3XBAS0OTfGrB",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Tempo%20Perdido%20Legi%C3%A3o%20Urbana"
  ]
 },
 {
  "id": "br-exagerado-cazuza",
  "titulo": "Exagerado",
  "artista": "Cazuza",
  "ano": 1985,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "facil",
  "spotify": "4d0DpU7Odiv0ztvX2GxJlk",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Exagerado%20Cazuza"
  ]
 },
 {
  "id": "br-pro-dia-nascer-feliz-barao-vermelho",
  "titulo": "Pro Dia Nascer Feliz",
  "artista": "Barão Vermelho",
  "ano": 1983,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "media",
  "spotify": "44BxEH341a9zeJq2z1UDdc",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Pro%20Dia%20Nascer%20Feliz%20Bar%C3%A3o%20Vermelho"
  ]
 },
 {
  "id": "br-andar-com-fe-gilberto-gil",
  "titulo": "Andar com Fé",
  "artista": "Gilberto Gil",
  "ano": 1982,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "MPB",
  "dificuldade": "media",
  "spotify": "76SJIvQGGxvJ9LTJP6nWbu",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Andar%20com%20F%C3%A9%20Gilberto%20Gil"
  ]
 },
 {
  "id": "br-sa-marina-wilson-simonal",
  "titulo": "Sá Marina",
  "artista": "Wilson Simonal",
  "ano": 1968,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Samba-pop",
  "dificuldade": "dificil",
  "spotify": "4YTfGpGTczlC9Fzpk0hglC",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=S%C3%A1%20Marina%20Wilson%20Simonal"
  ]
 },
 {
  "id": "br-chao-de-giz-ze-ramalho",
  "titulo": "Chão de Giz",
  "artista": "Zé Ramalho",
  "ano": 1978,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "MPB",
  "dificuldade": "media",
  "spotify": "3FeucMNAH554FvNODhUG8P",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Ch%C3%A3o%20de%20Giz%20Z%C3%A9%20Ramalho"
  ]
 },
 {
  "id": "br-oceano-djavan",
  "titulo": "Oceano",
  "artista": "Djavan",
  "ano": 1989,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "MPB",
  "dificuldade": "media",
  "spotify": "4O75XPkWrB2tIi0PCYkwOh",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Oceano%20Djavan"
  ]
 },
 {
  "id": "br-epitafio-titas",
  "titulo": "Epitáfio",
  "artista": "Titãs",
  "ano": 2001,
  "anosAceitos": [
   2005
  ],
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "facil",
  "spotify": "0btIPBtwqpyNkr4qv6E1w4",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Epit%C3%A1fio%20Tit%C3%A3s"
  ]
 },
 {
  "id": "br-mulher-de-fases-raimundos",
  "titulo": "Mulher de Fases",
  "artista": "Raimundos",
  "ano": 1999,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "facil",
  "spotify": "0n0vWLQxKjbNtItPpnZz8H",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Mulher%20de%20Fases%20Raimundos"
  ]
 },
 {
  "id": "br-fico-assim-sem-voce-claudinho-buchecha",
  "titulo": "Fico Assim Sem Você",
  "artista": "Claudinho & Buchecha",
  "ano": 2002,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Funk melody",
  "dificuldade": "facil",
  "spotify": "1L3XZAKODPVuBgeJQpJHLM",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Fico%20Assim%20Sem%20Voc%C3%AA%20Claudinho%20%26%20Buchecha"
  ]
 },
 {
  "id": "br-rap-da-felicidade-cidinho-doca",
  "titulo": "Rap da Felicidade",
  "artista": "Cidinho & Doca",
  "ano": 1995,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Funk carioca",
  "dificuldade": "media",
  "spotify": "3cTqR1kGcMnobdxx1lFTXl",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Rap%20da%20Felicidade%20Cidinho%20%26%20Doca"
  ]
 },
 {
  "id": "br-festa-ivete-sangalo",
  "titulo": "Festa",
  "artista": "Ivete Sangalo",
  "ano": 2001,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Axé",
  "dificuldade": "facil",
  "spotify": "6oSMm35tlmLqMFKLfkcokV",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Festa%20Ivete%20Sangalo"
  ]
 },
 {
  "id": "br-voce-tim-maia",
  "titulo": "Você",
  "artista": "Tim Maia",
  "ano": 1971,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Soul brasileiro",
  "dificuldade": "media",
  "spotify": "5c12DVTlsyFbxmysLw0Vll",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Voc%C3%AA%20Tim%20Maia"
  ]
 },
 {
  "id": "br-o-descobridor-dos-sete-mares-tim-maia",
  "titulo": "O Descobridor dos Sete Mares",
  "artista": "Tim Maia",
  "ano": 1983,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Soul brasileiro",
  "dificuldade": "facil",
  "spotify": "6NT6XzMQN4VEjejLgMu5jS",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=O%20Descobridor%20dos%20Sete%20Mares%20Tim%20Maia"
  ]
 },
 {
  "id": "br-garota-de-ipanema-stan-getz-e-joao-gil",
  "titulo": "Garota de Ipanema",
  "artista": "Stan Getz e João Gilberto",
  "ano": 1964,
  "anosAceitos": [
   1962,
   1963
  ],
  "alternativas": {
   "titulo": [
    "The Girl from Ipanema"
   ],
   "artista": [
    "Tom Jobim",
    "João Gilberto"
   ]
  },
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Bossa nova",
  "dificuldade": "media",
  "spotify": "20TYZJldybVCyUQnv91N97",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Garota%20de%20Ipanema%20Stan%20Getz"
  ]
 },
 {
  "id": "br-sozinho-caetano-veloso",
  "titulo": "Sozinho",
  "artista": "Caetano Veloso",
  "ano": 1998,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "MPB",
  "dificuldade": "facil",
  "spotify": "02a8cGumnKuEPgoCzmalJp",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Sozinho%20Caetano%20Veloso"
  ]
 },
 {
  "id": "intl-billie-jean-michael-jackson",
  "titulo": "Billie Jean",
  "artista": "Michael Jackson",
  "ano": 1982,
  "anosAceitos": [
   1983
  ],
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Pop / Funk",
  "dificuldade": "facil",
  "spotify": "7J1uxwnxfQLu4APicE5Rnj",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Billie%20Jean%20Michael%20Jackson"
  ]
 },
 {
  "id": "br-menina-veneno-ritchie",
  "titulo": "Menina Veneno",
  "artista": "Ritchie",
  "ano": 1983,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Pop rock",
  "dificuldade": "facil",
  "spotify": "6pCniOL0CLE5wmKK0ssAJz",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Menina%20Veneno%20Ritchie"
  ]
 },
 {
  "id": "br-dancin-days-freneticas",
  "titulo": "Dancin' Days",
  "artista": "Frenéticas",
  "ano": 1978,
  "alternativas": {
   "artista": [
    "As Frenéticas"
   ]
  },
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Disco",
  "dificuldade": "media",
  "spotify": "1uPth8yGR2GjTqqK1PWj1B",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Dancin%27%20Days%20Fren%C3%A9ticas"
  ]
 },
 {
  "id": "br-deixa-a-vida-me-levar-zeca-pagodinho",
  "titulo": "Deixa a Vida Me Levar",
  "artista": "Zeca Pagodinho",
  "ano": 2002,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Samba / Pagode",
  "dificuldade": "facil",
  "spotify": "7bdhM9AJqWAIHooF4sh3wW",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Deixa%20a%20Vida%20Me%20Levar%20Zeca%20Pagodinho"
  ]
 },
 {
  "id": "br-as-rosas-nao-falam-cartola",
  "titulo": "As Rosas Não Falam",
  "artista": "Cartola",
  "ano": 1976,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Samba",
  "dificuldade": "dificil",
  "spotify": "6J4gdn9L1im9uqzqBLhht6",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=As%20Rosas%20N%C3%A3o%20Falam%20Cartola"
  ]
 },
 {
  "id": "br-mania-de-voce-rita-lee",
  "titulo": "Mania de Você",
  "artista": "Rita Lee",
  "ano": 1979,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Pop rock",
  "dificuldade": "facil",
  "spotify": "52yIG8UJYHt0m9eA5vIbVc",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Mania%20de%20Voc%C3%AA%20Rita%20Lee"
  ]
 },
 {
  "id": "br-maluco-beleza-raul-seixas",
  "titulo": "Maluco Beleza",
  "artista": "Raul Seixas",
  "ano": 1977,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "facil",
  "spotify": "6S8Lf8wUXCuFzf9SOdeIqt",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Maluco%20Beleza%20Raul%20Seixas"
  ]
 },
 {
  "id": "br-metamorfose-ambulante-raul-seixas",
  "titulo": "Metamorfose Ambulante",
  "artista": "Raul Seixas",
  "ano": 1973,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "media",
  "spotify": "3W7YWsbAxji68U0CIX2V3f",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Metamorfose%20Ambulante%20Raul%20Seixas"
  ]
 },
 {
  "id": "br-alegria-alegria-caetano-veloso",
  "titulo": "Alegria, Alegria",
  "artista": "Caetano Veloso",
  "ano": 1967,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Tropicália",
  "dificuldade": "media",
  "spotify": "6cmbHKqPOKVOUbGkBX64zk",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Alegria%2C%20Alegria%20Caetano%20Veloso"
  ]
 },
 {
  "id": "br-envolver-anitta",
  "titulo": "Envolver",
  "artista": "Anitta",
  "ano": 2021,
  "anosAceitos": [
   2022
  ],
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Reggaeton / Pop",
  "dificuldade": "facil",
  "spotify": "2dHMqkmQXs9zzGT99hLG1d",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Envolver%20Anitta"
  ]
 },
 {
  "id": "br-camaro-amarelo-munhoz-mariano",
  "titulo": "Camaro Amarelo",
  "artista": "Munhoz & Mariano",
  "ano": 2012,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Sertanejo universitário",
  "dificuldade": "facil",
  "spotify": "5ivya8USJX3ezDjd2FYSXa",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Camaro%20Amarelo%20Munhoz%20%26%20Mariano"
  ]
 },
 {
  "id": "br-e-o-amor-zeze-di-camargo-luci",
  "titulo": "É o Amor",
  "artista": "Zezé Di Camargo & Luciano",
  "ano": 1991,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Sertanejo",
  "dificuldade": "facil",
  "spotify": "1VwwA0tYr5cy9Gp2gLObnL",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=%C3%89%20o%20Amor%20Zez%C3%A9%20Di%20Camargo%20%26%20Luciano"
  ]
 },
 {
  "id": "br-a-banda-chico-buarque",
  "titulo": "A Banda",
  "artista": "Chico Buarque",
  "ano": 1966,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Marcha / MPB",
  "dificuldade": "media",
  "spotify": "7JIY3EZgp2bqAPdj8cORZO",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=A%20Banda%20Chico%20Buarque"
  ]
 },
 {
  "id": "br-maria-maria-milton-nascimento",
  "titulo": "Maria, Maria",
  "artista": "Milton Nascimento",
  "ano": 1978,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "MPB",
  "dificuldade": "media",
  "spotify": "61ChX8Bleid8DXFIuR0H6F",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Maria%2C%20Maria%20Milton%20Nascimento"
  ]
 },
 {
  "id": "br-chiclete-com-banana-jackson-do-pandeiro",
  "titulo": "Chiclete com Banana",
  "artista": "Jackson do Pandeiro",
  "ano": 1959,
  "anosAceitos": [
   1962
  ],
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Forró / Samba",
  "dificuldade": "dificil",
  "spotify": "4H35Eob8l4RhqrvgyIDtWV",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Chiclete%20com%20Banana%20Jackson%20do%20Pandeiro"
  ]
 },
 {
  "id": "br-gita-raul-seixas",
  "titulo": "Gita",
  "artista": "Raul Seixas",
  "ano": 1974,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "media",
  "spotify": "0NnsKhrs17wj0Zm3pOPwh9",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Gita%20Raul%20Seixas"
  ]
 },
 {
  "id": "br-como-uma-onda-zen-surfismo-lulu-santos",
  "titulo": "Como uma Onda (Zen-Surfismo)",
  "artista": "Lulu Santos",
  "ano": 1983,
  "alternativas": {
   "titulo": [
    "Como uma Onda"
   ]
  },
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Pop rock",
  "dificuldade": "facil",
  "spotify": "3cFf4K6ew15k8bYe16kJ9N",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Como%20uma%20Onda%20%28Zen-Surfismo%29%20Lulu%20Santos"
  ]
 },
 {
  "id": "br-upa-neguinho-elis-regina",
  "titulo": "Upa, Neguinho",
  "artista": "Elis Regina",
  "ano": 1966,
  "alternativas": {
   "artista": [
    "Edu Lobo"
   ]
  },
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "MPB",
  "dificuldade": "dificil",
  "spotify": "05Rfp1iyA1Fuux2YQNa7Fk",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Upa%2C%20Neguinho%20Elis%20Regina"
  ]
 },
 {
  "id": "br-lua-de-cristal-xuxa",
  "titulo": "Lua de Cristal",
  "artista": "Xuxa",
  "ano": 1990,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Pop infantil",
  "dificuldade": "facil",
  "spotify": "3dN0VcQhz4BMma8dNHBJ6f",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Lua%20de%20Cristal%20Xuxa"
  ]
 },
 {
  "id": "br-equalize-pitty",
  "titulo": "Equalize",
  "artista": "Pitty",
  "ano": 2003,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "facil",
  "spotify": "2iUxWUv5TovjBmayOcWohB",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Equalize%20Pitty"
  ]
 },
 {
  "id": "br-amor-i-love-you-marisa-monte",
  "titulo": "Amor I Love You",
  "artista": "Marisa Monte",
  "ano": 2000,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "MPB",
  "dificuldade": "facil",
  "spotify": "7zUNqxNQQ44iWnI6o4Oqlo",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Amor%20I%20Love%20You%20Marisa%20Monte"
  ]
 },
 {
  "id": "br-trem-bala-ana-vilela",
  "titulo": "Trem-Bala",
  "artista": "Ana Vilela",
  "ano": 2017,
  "anosAceitos": [
   2016
  ],
  "alternativas": {
   "titulo": [
    "Trem Bala"
   ]
  },
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "MPB / Pop",
  "dificuldade": "facil",
  "spotify": "05QeyKGAn4TZrv41tMiD1A",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Trem-Bala%20Ana%20Vilela"
  ]
 },
 {
  "id": "br-fio-de-cabelo-chitaozinho-xororo",
  "titulo": "Fio de Cabelo",
  "artista": "Chitãozinho & Xororó",
  "ano": 1982,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Sertanejo",
  "dificuldade": "media",
  "spotify": "23YivytkoHqnZnOvuj29mC",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Fio%20de%20Cabelo%20Chit%C3%A3ozinho%20%26%20Xoror%C3%B3"
  ]
 },
 {
  "id": "br-disparada-jair-rodrigues",
  "titulo": "Disparada",
  "artista": "Jair Rodrigues",
  "ano": 1966,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Moda de viola / MPB",
  "dificuldade": "dificil",
  "spotify": "5tFFr1sHnwQjC2SNJCYqjo",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Disparada%20Jair%20Rodrigues"
  ]
 },
 {
  "id": "intl-imagine-john-lennon",
  "titulo": "Imagine",
  "artista": "John Lennon",
  "ano": 1971,
  "pais": "Reino Unido",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Rock / Balada",
  "dificuldade": "facil",
  "spotify": "3cfuzAeQx3FbxoioF5tcZj",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Imagine%20John%20Lennon"
  ]
 },
 {
  "id": "intl-yesterday-the-beatles",
  "titulo": "Yesterday",
  "artista": "The Beatles",
  "ano": 1965,
  "alternativas": {
   "artista": [
    "Beatles"
   ]
  },
  "pais": "Reino Unido",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Balada pop",
  "dificuldade": "facil",
  "spotify": "3BQHpFgAp4l80e1XslIjNI",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Yesterday%20The%20Beatles"
  ]
 },
 {
  "id": "intl-i-can-t-get-no-satisfaction-the-rolling-stones",
  "titulo": "(I Can't Get No) Satisfaction",
  "artista": "The Rolling Stones",
  "ano": 1965,
  "alternativas": {
   "titulo": [
    "Satisfaction",
    "I Can't Get No Satisfaction"
   ],
   "artista": [
    "Rolling Stones"
   ]
  },
  "pais": "Reino Unido",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Rock",
  "dificuldade": "media",
  "spotify": "5FKkbyGm42hw1y08l2knlO",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=%28I%20Can%27t%20Get%20No%29%20Satisfaction%20The%20Rolling%20Stones"
  ]
 },
 {
  "id": "intl-my-way-frank-sinatra",
  "titulo": "My Way",
  "artista": "Frank Sinatra",
  "ano": 1969,
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Pop tradicional",
  "dificuldade": "facil",
  "spotify": "2YkIDPL5lGhRhomCq4S2RO",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=My%20Way%20Frank%20Sinatra"
  ]
 },
 {
  "id": "intl-jailhouse-rock-elvis-presley",
  "titulo": "Jailhouse Rock",
  "artista": "Elvis Presley",
  "ano": 1957,
  "filme": "Prisioneiro do Rock",
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Rock and roll",
  "dificuldade": "media",
  "spotify": "5OIMEeKoVsRQcDyFXHTRoQ",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Jailhouse%20Rock%20Elvis%20Presley"
  ]
 },
 {
  "id": "intl-rock-around-the-clock-bill-haley-his-comet",
  "titulo": "Rock Around the Clock",
  "artista": "Bill Haley & His Comets",
  "ano": 1954,
  "alternativas": {
   "artista": [
    "Bill Haley"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Rock and roll",
  "dificuldade": "media",
  "spotify": "5PKJgHY9qRn3G3Mz56oAAU",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Rock%20Around%20the%20Clock%20Bill%20Haley%20%26%20His%20Comets"
  ]
 },
 {
  "id": "intl-stayin-alive-bee-gees",
  "titulo": "Stayin' Alive",
  "artista": "Bee Gees",
  "ano": 1977,
  "filme": "Os Embalos de Sábado à Noite",
  "pais": "Reino Unido / Austrália",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Disco",
  "dificuldade": "facil",
  "spotify": "4G1JE13eHAyHdmT8RG5Afl",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Stayin%27%20Alive%20Bee%20Gees"
  ]
 },
 {
  "id": "intl-i-will-survive-gloria-gaynor",
  "titulo": "I Will Survive",
  "artista": "Gloria Gaynor",
  "ano": 1978,
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Disco",
  "dificuldade": "facil",
  "spotify": "6g0cpYD7gmMHKrqYhPZ6Qq",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=I%20Will%20Survive%20Gloria%20Gaynor"
  ]
 },
 {
  "id": "intl-superstition-stevie-wonder",
  "titulo": "Superstition",
  "artista": "Stevie Wonder",
  "ano": 1972,
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Funk / Soul",
  "dificuldade": "media",
  "spotify": "4N0TP4Rmj6QQezWV88ARNJ",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Superstition%20Stevie%20Wonder"
  ]
 },
 {
  "id": "intl-purple-rain-prince",
  "titulo": "Purple Rain",
  "artista": "Prince",
  "ano": 1984,
  "alternativas": {
   "artista": [
    "Prince and The Revolution"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Rock / Balada",
  "dificuldade": "media",
  "spotify": "54X78diSLoUDI3joC2bjMz",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Purple%20Rain%20Prince"
  ]
 },
 {
  "id": "intl-every-breath-you-take-the-police",
  "titulo": "Every Breath You Take",
  "artista": "The Police",
  "ano": 1983,
  "alternativas": {
   "artista": [
    "Police",
    "Sting"
   ]
  },
  "pais": "Reino Unido",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Pop rock",
  "dificuldade": "facil",
  "spotify": "1JSTJqkT5qHq8MDJnJbRE1",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Every%20Breath%20You%20Take%20The%20Police"
  ]
 },
 {
  "id": "intl-don-t-stop-believin-journey",
  "titulo": "Don't Stop Believin'",
  "artista": "Journey",
  "ano": 1981,
  "alternativas": {
   "titulo": [
    "Don't Stop Believing"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Rock",
  "dificuldade": "media",
  "spotify": "6Z58EMyjNlSxrAeHsHG7yY",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Don%27t%20Stop%20Believin%27%20Journey"
  ]
 },
 {
  "id": "intl-take-on-me-a-ha",
  "titulo": "Take On Me",
  "artista": "a-ha",
  "ano": 1985,
  "anosAceitos": [
   1984
  ],
  "pais": "Noruega",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Synth-pop",
  "dificuldade": "facil",
  "spotify": "2WfaOiMkCvy7F5fcp2zZ8L",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Take%20On%20Me%20a-ha"
  ]
 },
 {
  "id": "intl-girls-just-want-to-have-fun-cyndi-lauper",
  "titulo": "Girls Just Want to Have Fun",
  "artista": "Cyndi Lauper",
  "ano": 1983,
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Pop",
  "dificuldade": "facil",
  "spotify": "0H7q3fGbRdqPvxO91zXCfK",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Girls%20Just%20Want%20to%20Have%20Fun%20Cyndi%20Lauper"
  ]
 },
 {
  "id": "intl-wonderwall-oasis",
  "titulo": "Wonderwall",
  "artista": "Oasis",
  "ano": 1995,
  "pais": "Reino Unido",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Britpop",
  "dificuldade": "facil",
  "spotify": "5wj4E6IsrVtn8IBJQOd0Cl",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Wonderwall%20Oasis"
  ]
 },
 {
  "id": "intl-creep-radiohead",
  "titulo": "Creep",
  "artista": "Radiohead",
  "ano": 1992,
  "anosAceitos": [
   1993
  ],
  "pais": "Reino Unido",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Rock alternativo",
  "dificuldade": "media",
  "spotify": "62J6RO53R6vNhOB6QXajFV",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Creep%20Radiohead"
  ]
 },
 {
  "id": "intl-zombie-the-cranberries",
  "titulo": "Zombie",
  "artista": "The Cranberries",
  "ano": 1994,
  "alternativas": {
   "artista": [
    "Cranberries"
   ]
  },
  "pais": "Irlanda",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Rock alternativo",
  "dificuldade": "facil",
  "spotify": "2IZZqH4K02UIYg5EohpNHF",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Zombie%20The%20Cranberries"
  ]
 },
 {
  "id": "intl-baby-one-more-time-britney-spears",
  "titulo": "...Baby One More Time",
  "artista": "Britney Spears",
  "ano": 1998,
  "alternativas": {
   "titulo": [
    "Baby One More Time"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Pop",
  "dificuldade": "facil",
  "spotify": "7D3mb7afjaxob8K1eLIm0H",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=...Baby%20One%20More%20Time%20Britney%20Spears"
  ]
 },
 {
  "id": "intl-macarena-bayside-boys-remix-los-del-rio",
  "titulo": "Macarena (Bayside Boys Remix)",
  "artista": "Los del Río",
  "ano": 1995,
  "anosAceitos": [
   1993,
   1996
  ],
  "alternativas": {
   "titulo": [
    "Macarena"
   ]
  },
  "pais": "Espanha",
  "idioma": "Espanhol e inglês",
  "origem": "intl",
  "genero": "Dance / Latin",
  "dificuldade": "facil",
  "spotify": "07DcH2UllHvVRKjD2HEJuC",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Macarena%20%28Bayside%20Boys%20Remix%29%20Los%20del%20R%C3%ADo"
  ]
 },
 {
  "id": "intl-livin-la-vida-loca-ricky-martin",
  "titulo": "Livin' la Vida Loca",
  "artista": "Ricky Martin",
  "ano": 1999,
  "alternativas": {
   "titulo": [
    "Living la Vida Loca"
   ]
  },
  "pais": "Porto Rico",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Pop latino",
  "dificuldade": "facil",
  "spotify": "0Ph6L4l8dYUuXFmb71Ajnd",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Livin%27%20la%20Vida%20Loca%20Ricky%20Martin"
  ]
 },
 {
  "id": "intl-hips-don-t-lie-shakira-feat-wyclef-",
  "titulo": "Hips Don't Lie",
  "artista": "Shakira feat. Wyclef Jean",
  "ano": 2006,
  "pais": "Colômbia",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Pop latino",
  "dificuldade": "facil",
  "spotify": "0yHhDpBAZWpd6dlZMQgU49",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Hips%20Don%27t%20Lie%20Shakira"
  ]
 },
 {
  "id": "intl-crazy-in-love-beyonce-feat-jay-z",
  "titulo": "Crazy in Love",
  "artista": "Beyoncé feat. JAY-Z",
  "ano": 2003,
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "R&B",
  "dificuldade": "facil",
  "spotify": "0TwBtDAWpkpM3srywFVOV5",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Crazy%20in%20Love%20Beyonc%C3%A9"
  ]
 },
 {
  "id": "intl-hey-ya-outkast",
  "titulo": "Hey Ya!",
  "artista": "OutKast",
  "ano": 2003,
  "alternativas": {
   "titulo": [
    "Hey Ya"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Hip-hop / Funk",
  "dificuldade": "facil",
  "spotify": "5dBdCRTTkibsoj93j1PLvi",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Hey%20Ya%21%20OutKast"
  ]
 },
 {
  "id": "intl-umbrella-rihanna-feat-jay-z",
  "titulo": "Umbrella",
  "artista": "Rihanna feat. JAY-Z",
  "ano": 2007,
  "pais": "Barbados / Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "R&B / Pop",
  "dificuldade": "facil",
  "spotify": "49FYlytm3dAAraYgpoJZux",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Umbrella%20Rihanna"
  ]
 },
 {
  "id": "intl-poker-face-lady-gaga",
  "titulo": "Poker Face",
  "artista": "Lady Gaga",
  "ano": 2008,
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Electropop",
  "dificuldade": "facil",
  "spotify": "1QV6tiMFM6fSOKOGLMHYYg",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Poker%20Face%20Lady%20Gaga"
  ]
 },
 {
  "id": "intl-someone-like-you-adele",
  "titulo": "Someone Like You",
  "artista": "Adele",
  "ano": 2011,
  "pais": "Reino Unido",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Balada pop",
  "dificuldade": "facil",
  "spotify": "19RKuCdPh68WknFtjG9BJN",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Someone%20Like%20You%20Adele"
  ]
 },
 {
  "id": "intl-uptown-funk-mark-ronson-feat-bru",
  "titulo": "Uptown Funk",
  "artista": "Mark Ronson feat. Bruno Mars",
  "ano": 2014,
  "anosAceitos": [
   2015
  ],
  "pais": "Reino Unido / Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Funk / Pop",
  "dificuldade": "facil",
  "spotify": "32OlwWuMpZ6b0aN2RZOeMS",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Uptown%20Funk%20Mark%20Ronson"
  ]
 },
 {
  "id": "intl-happy-pharrell-williams",
  "titulo": "Happy",
  "artista": "Pharrell Williams",
  "ano": 2013,
  "filme": "Meu Malvado Favorito 2",
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Soul / Pop",
  "dificuldade": "facil",
  "spotify": "3RkvscbM4aNbELiQf7PJwn",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Happy%20Pharrell%20Williams"
  ]
 },
 {
  "id": "intl-get-lucky-daft-punk-feat-pharr",
  "titulo": "Get Lucky",
  "artista": "Daft Punk feat. Pharrell Williams e Nile Rodgers",
  "ano": 2013,
  "pais": "França",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Disco / Funk",
  "dificuldade": "facil",
  "spotify": "69kOkLUCkxIZYexIgSG8rq",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Get%20Lucky%20Daft%20Punk"
  ]
 },
 {
  "id": "intl-old-town-road-remix-lil-nas-x-feat-billy",
  "titulo": "Old Town Road (Remix)",
  "artista": "Lil Nas X feat. Billy Ray Cyrus",
  "ano": 2019,
  "anosAceitos": [
   2018
  ],
  "alternativas": {
   "titulo": [
    "Old Town Road"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Country rap",
  "dificuldade": "facil",
  "spotify": "2YpeDb67231RjR0MgVLzsG",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Old%20Town%20Road%20%28Remix%29%20Lil%20Nas%20X"
  ]
 },
 {
  "id": "intl-drivers-license-olivia-rodrigo",
  "titulo": "drivers license",
  "artista": "Olivia Rodrigo",
  "ano": 2021,
  "alternativas": {
   "titulo": [
    "Driver's License"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Pop / Balada",
  "dificuldade": "facil",
  "spotify": "5wANPM4fQCJwkGd4rN57mH",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=drivers%20license%20Olivia%20Rodrigo"
  ]
 },
 {
  "id": "intl-as-it-was-harry-styles",
  "titulo": "As It Was",
  "artista": "Harry Styles",
  "ano": 2022,
  "pais": "Reino Unido",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Synth-pop",
  "dificuldade": "facil",
  "spotify": "2kWEcNYBLVgseMD3KZqiMP",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=As%20It%20Was%20Harry%20Styles"
  ]
 },
 {
  "id": "intl-shake-it-off-taylor-swift",
  "titulo": "Shake It Off",
  "artista": "Taylor Swift",
  "ano": 2014,
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Pop",
  "dificuldade": "facil",
  "spotify": "0cqRj7pUJDkTCEsJkx8snD",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Shake%20It%20Off%20Taylor%20Swift"
  ]
 },
 {
  "id": "intl-dynamite-bts",
  "titulo": "Dynamite",
  "artista": "BTS",
  "ano": 2020,
  "pais": "Coreia do Sul",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "K-pop / Disco-pop",
  "dificuldade": "facil",
  "spotify": "0t1kP63rueHleOhQkYSXFY",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Dynamite%20BTS"
  ]
 },
 {
  "id": "intl-mamma-mia-abba",
  "titulo": "Mamma Mia",
  "artista": "ABBA",
  "ano": 1975,
  "pais": "Suécia",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Pop",
  "dificuldade": "facil",
  "spotify": "2TxCwUlqaOH3TIyJqGgR91",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Mamma%20Mia%20ABBA"
  ]
 },
 {
  "id": "intl-non-je-ne-regrette-rien-edith-piaf",
  "titulo": "Non, je ne regrette rien",
  "artista": "Édith Piaf",
  "ano": 1960,
  "alternativas": {
   "artista": [
    "Edith Piaf",
    "Piaf"
   ]
  },
  "pais": "França",
  "idioma": "Francês",
  "origem": "intl",
  "genero": "Chanson",
  "dificuldade": "dificil",
  "spotify": "7570EPj8eGThH8wgIp5Puw",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Non%2C%20je%20ne%20regrette%20rien%20%C3%89dith%20Piaf"
  ]
 },
 {
  "id": "intl-99-luftballons-nena",
  "titulo": "99 Luftballons",
  "artista": "Nena",
  "ano": 1983,
  "anosAceitos": [
   1984
  ],
  "alternativas": {
   "titulo": [
    "99 Red Balloons"
   ]
  },
  "pais": "Alemanha",
  "idioma": "Alemão",
  "origem": "intl",
  "genero": "New wave alemã",
  "dificuldade": "media",
  "spotify": "7Ap8xK2cKeosY83lfoRZGQ",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=99%20Luftballons%20Nena"
  ]
 },
 {
  "id": "intl-gasolina-daddy-yankee",
  "titulo": "Gasolina",
  "artista": "Daddy Yankee",
  "ano": 2004,
  "pais": "Porto Rico",
  "idioma": "Espanhol",
  "origem": "intl",
  "genero": "Reggaeton",
  "dificuldade": "facil",
  "spotify": "228BxWXUYQPJrJYHDLOHkj",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Gasolina%20Daddy%20Yankee"
  ]
 },
 {
  "id": "intl-bailando-enrique-iglesias-fea",
  "titulo": "Bailando",
  "artista": "Enrique Iglesias feat. Descemer Bueno e Gente de Zona",
  "ano": 2014,
  "alternativas": {
   "artista": [
    "Enrique Iglesias"
   ]
  },
  "pais": "Espanha / Cuba",
  "idioma": "Espanhol",
  "origem": "intl",
  "genero": "Pop latino",
  "dificuldade": "facil",
  "spotify": "32lm3769IRfcnrQV11LO4E",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Bailando%20Enrique%20Iglesias"
  ]
 },
 {
  "id": "intl-tusa-karol-g-e-nicki-mina",
  "titulo": "Tusa",
  "artista": "KAROL G e Nicki Minaj",
  "ano": 2019,
  "alternativas": {
   "artista": [
    "Karol G"
   ]
  },
  "pais": "Colômbia / Estados Unidos",
  "idioma": "Espanhol",
  "origem": "intl",
  "genero": "Reggaeton",
  "dificuldade": "facil",
  "spotify": "0fTQZ3sCBnxV81l5rPJd8v",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Tusa%20KAROL%20G"
  ]
 },
 {
  "id": "intl-sweet-dreams-are-made-of-this-eurythmics",
  "titulo": "Sweet Dreams (Are Made of This)",
  "artista": "Eurythmics",
  "ano": 1983,
  "alternativas": {
   "titulo": [
    "Sweet Dreams"
   ],
   "artista": [
    "Annie Lennox"
   ]
  },
  "pais": "Reino Unido",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Synth-pop",
  "dificuldade": "facil",
  "spotify": "7Bp898e0U9IReLs2oKC7G4",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Sweet%20Dreams%20%28Are%20Made%20of%20This%29%20Eurythmics"
  ]
 },
 {
  "id": "intl-hotel-california-eagles",
  "titulo": "Hotel California",
  "artista": "Eagles",
  "ano": 1976,
  "anosAceitos": [
   1977
  ],
  "alternativas": {
   "artista": [
    "The Eagles"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Rock",
  "dificuldade": "facil",
  "spotify": "40riOy7x9W7GXjyGp4pjAv",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Hotel%20California%20Eagles"
  ]
 },
 {
  "id": "intl-another-one-bites-the-dust-queen",
  "titulo": "Another One Bites the Dust",
  "artista": "Queen",
  "ano": 1980,
  "pais": "Reino Unido",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Rock / Funk",
  "dificuldade": "facil",
  "spotify": "57JVGBtBLCfHw2muk5416J",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Another%20One%20Bites%20the%20Dust%20Queen"
  ]
 },
 {
  "id": "intl-smooth-santana-feat-rob-tho",
  "titulo": "Smooth",
  "artista": "Santana feat. Rob Thomas",
  "ano": 1999,
  "alternativas": {
   "artista": [
    "Carlos Santana"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Rock latino",
  "dificuldade": "media",
  "spotify": "2pX4FpOgwItRVPPUFdRcxA",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Smooth%20Santana"
  ]
 },
 {
  "id": "intl-the-phantom-of-the-opera-sarah-brightman-e-mi",
  "titulo": "The Phantom of the Opera",
  "artista": "Sarah Brightman e Michael Crawford",
  "ano": 1986,
  "anosAceitos": [
   1987
  ],
  "musical": "O Fantasma da Ópera",
  "alternativas": {
   "artista": [
    "Phantom of the Opera",
    "Andrew Lloyd Webber"
   ]
  },
  "pais": "Reino Unido",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Musical",
  "dificuldade": "dificil",
  "spotify": "5qlABWwod6dgDCmRAAF5J5",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=The%20Phantom%20of%20the%20Opera%20Sarah%20Brightman"
  ]
 },
 {
  "id": "intl-do-re-mi-julie-andrews-e-elen",
  "titulo": "Do-Re-Mi",
  "artista": "Julie Andrews e elenco de A Noviça Rebelde",
  "ano": 1965,
  "anosAceitos": [
   1959
  ],
  "musical": "A Noviça Rebelde",
  "alternativas": {
   "artista": [
    "The Sound of Music",
    "Julie Andrews"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Musical",
  "dificuldade": "media",
  "spotify": "1L6NSZq5R7lMcVw0YOrUE9",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Do-Re-Mi%20Julie%20Andrews"
  ]
 },
 {
  "id": "intl-singin-in-the-rain-gene-kelly",
  "titulo": "Singin' in the Rain",
  "artista": "Gene Kelly",
  "ano": 1952,
  "anosAceitos": [
   1929
  ],
  "musical": "Cantando na Chuva",
  "alternativas": {
   "titulo": [
    "Singing in the Rain"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Musical",
  "dificuldade": "media",
  "spotify": "2WhfLbSe7XTQBBz6HIEOnh",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Singin%27%20in%20the%20Rain%20Gene%20Kelly"
  ]
 },
 {
  "id": "intl-this-is-me-keala-settle-e-elenc",
  "titulo": "This Is Me",
  "artista": "Keala Settle e elenco de O Rei do Show",
  "ano": 2017,
  "musical": "O Rei do Show",
  "alternativas": {
   "artista": [
    "The Greatest Showman",
    "Keala Settle"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Musical / Pop",
  "dificuldade": "facil",
  "spotify": "45aBsnKRWUzhwbcqOJLwfe",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=This%20Is%20Me%20Keala%20Settle"
  ]
 },
 {
  "id": "intl-defying-gravity-idina-menzel-e-krist",
  "titulo": "Defying Gravity",
  "artista": "Idina Menzel e Kristin Chenoweth",
  "ano": 2003,
  "musical": "Wicked",
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Musical",
  "dificuldade": "dificil",
  "spotify": "0yM3VmM8gHEVGViKvAbQkc",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Defying%20Gravity%20Idina%20Menzel"
  ]
 },
 {
  "id": "intl-a-whole-new-world-brad-kane-e-lea-salo",
  "titulo": "A Whole New World",
  "artista": "Brad Kane e Lea Salonga",
  "ano": 1992,
  "filme": "Aladdin",
  "musical": "Aladdin",
  "alternativas": {
   "titulo": [
    "Um Mundo Ideal"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Trilha de filme",
  "dificuldade": "facil",
  "spotify": "0k7Shopj669EbywEjsqoqm",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=A%20Whole%20New%20World%20Brad%20Kane"
  ]
 },
 {
  "id": "intl-hakuna-matata-nathan-lane-ernie-sa",
  "titulo": "Hakuna Matata",
  "artista": "Nathan Lane, Ernie Sabella, Jason Weaver e Joseph Williams",
  "ano": 1994,
  "filme": "O Rei Leão",
  "musical": "O Rei Leão",
  "alternativas": {
   "artista": [
    "The Lion King"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Trilha de filme",
  "dificuldade": "facil",
  "spotify": "1VjGO2cyPEWbs3ToxGCYO4",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Hakuna%20Matata%20Nathan%20Lane%2C%20Ernie%20Sabella%2C%20Jason%20Weaver"
  ]
 },
 {
  "id": "intl-under-the-sea-samuel-e-wright",
  "titulo": "Under the Sea",
  "artista": "Samuel E. Wright",
  "ano": 1989,
  "filme": "A Pequena Sereia",
  "musical": "A Pequena Sereia",
  "alternativas": {
   "titulo": [
    "Aqui no Mar"
   ],
   "artista": [
    "The Little Mermaid"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Trilha de filme",
  "dificuldade": "facil",
  "spotify": "1Ce6wFTflxs6HPN8WWc9Yt",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Under%20the%20Sea%20Samuel%20E.%20Wright"
  ]
 },
 {
  "id": "intl-shallow-lady-gaga-e-bradley-",
  "titulo": "Shallow",
  "artista": "Lady Gaga e Bradley Cooper",
  "ano": 2018,
  "filme": "Nasce uma Estrela",
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Trilha de filme / Pop rock",
  "dificuldade": "facil",
  "spotify": "2VxeLyX666F8uXCJ0dZF8B",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Shallow%20Lady%20Gaga"
  ]
 },
 {
  "id": "intl-aquarius-let-the-sunshine-in-the-5th-dimension",
  "titulo": "Aquarius / Let the Sunshine In",
  "artista": "The 5th Dimension",
  "ano": 1969,
  "anosAceitos": [
   1967
  ],
  "musical": "Hair",
  "alternativas": {
   "titulo": [
    "Aquarius",
    "Let the Sunshine In"
   ],
   "artista": [
    "5th Dimension"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Musical / Soul",
  "dificuldade": "dificil",
  "spotify": "7mxcKht4CgA1OvXilOvnZh",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Aquarius%20/%20Let%20the%20Sunshine%20In%20The%205th%20Dimension"
  ]
 },
 {
  "id": "intl-cabaret-liza-minnelli",
  "titulo": "Cabaret",
  "artista": "Liza Minnelli",
  "ano": 1972,
  "anosAceitos": [
   1966
  ],
  "musical": "Cabaret",
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Musical",
  "dificuldade": "dificil",
  "spotify": "5KhMLaz5JNZviJJAmubGPM",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Cabaret%20Liza%20Minnelli"
  ]
 },
 {
  "id": "intl-white-christmas-bing-crosby",
  "titulo": "White Christmas",
  "artista": "Bing Crosby",
  "ano": 1942,
  "anosAceitos": [
   1947
  ],
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Canção natalina",
  "dificuldade": "media",
  "spotify": "4rp2Hr51C99Nx5AC9GfSeI",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=White%20Christmas%20Bing%20Crosby"
  ]
 },
 {
  "id": "intl-minnie-the-moocher-cab-calloway",
  "titulo": "Minnie the Moocher",
  "artista": "Cab Calloway",
  "ano": 1931,
  "anosAceitos": [
   1930
  ],
  "alternativas": {
   "artista": [
    "Cab Calloway & His Orchestra"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Jazz",
  "dificuldade": "muito_dificil",
  "spotify": "61mXNQZPtqCS7jjM7b3Gv6",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Minnie%20the%20Moocher%20Cab%20Calloway"
  ]
 },
 {
  "id": "br-conversa-de-botequim-noel-rosa",
  "titulo": "Conversa de Botequim",
  "artista": "Noel Rosa",
  "ano": 1935,
  "alternativas": {
   "artista": [
    "Vadico"
   ]
  },
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Samba",
  "dificuldade": "muito_dificil",
  "spotify": "50iiKfZSguRQWMkSieUPou",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Conversa%20de%20Botequim%20Noel%20Rosa"
  ]
 },
 {
  "id": "br-o-que-e-que-a-baiana-tem-carmen-miranda-e-dor",
  "titulo": "O Que É Que a Baiana Tem?",
  "artista": "Carmen Miranda e Dorival Caymmi",
  "ano": 1939,
  "alternativas": {
   "titulo": [
    "O Que É Que a Baiana Tem"
   ],
   "artista": [
    "Carmen Miranda",
    "Dorival Caymmi"
   ]
  },
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Samba",
  "dificuldade": "muito_dificil",
  "spotify": "5doJrgFnw907nsWK5q9xhc",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=O%20Que%20%C3%89%20Que%20a%20Baiana%20Tem%3F%20Carmen%20Miranda"
  ]
 },
 {
  "id": "intl-cheek-to-cheek-fred-astaire",
  "titulo": "Cheek to Cheek",
  "artista": "Fred Astaire",
  "ano": 1935,
  "filme": "O Picolino",
  "musical": "O Picolino",
  "alternativas": {
   "artista": [
    "Ginger Rogers",
    "Top Hat"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Musical / Jazz",
  "dificuldade": "muito_dificil",
  "spotify": "3fTiXxISfUy1BEqa2GhwDk",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Cheek%20to%20Cheek%20Fred%20Astaire"
  ]
 },
 {
  "id": "intl-st-louis-blues-bessie-smith-e-louis",
  "titulo": "St. Louis Blues",
  "artista": "Bessie Smith e Louis Armstrong",
  "ano": 1925,
  "anosAceitos": [
   1914
  ],
  "alternativas": {
   "artista": [
    "Bessie Smith",
    "W.C. Handy"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Blues",
  "dificuldade": "muito_dificil",
  "spotify": "4u2mGcx8iAPueKUOFNQUmb",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=St.%20Louis%20Blues%20Bessie%20Smith"
  ]
 },
 {
  "id": "intl-swanee-al-jolson",
  "titulo": "Swanee",
  "artista": "Al Jolson",
  "ano": 1920,
  "anosAceitos": [
   1919
  ],
  "alternativas": {
   "artista": [
    "George Gershwin"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Canção popular americana",
  "dificuldade": "muito_dificil",
  "spotify": "6mjrraNYoezeXNmoZASJ0B",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Swanee%20Al%20Jolson"
  ]
 },
 {
  "id": "intl-tutti-frutti-little-richard",
  "titulo": "Tutti Frutti",
  "artista": "Little Richard",
  "ano": 1955,
  "anosAceitos": [
   1957
  ],
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Rock and roll",
  "dificuldade": "media",
  "spotify": "2iXcvnD3d1gfLBum0cE5Eg",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Tutti%20Frutti%20Little%20Richard"
  ]
 },
 {
  "id": "intl-i-got-you-i-feel-good-james-brown",
  "titulo": "I Got You (I Feel Good)",
  "artista": "James Brown",
  "ano": 1965,
  "anosAceitos": [
   1966
  ],
  "alternativas": {
   "titulo": [
    "I Feel Good"
   ],
   "artista": [
    "James Brown & The Famous Flames"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Funk / Soul",
  "dificuldade": "facil",
  "spotify": "5haXbSJqjjM0TCJ5XkfEaC",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=I%20Got%20You%20%28I%20Feel%20Good%29%20James%20Brown"
  ]
 },
 {
  "id": "intl-fly-me-to-the-moon-frank-sinatra-e-coun",
  "titulo": "Fly Me to the Moon",
  "artista": "Frank Sinatra e Count Basie",
  "ano": 1964,
  "alternativas": {
   "titulo": [
    "In Other Words"
   ],
   "artista": [
    "Frank Sinatra"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Jazz / Swing",
  "dificuldade": "media",
  "spotify": "1iZgzgmsFsi0deffe0rleB",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Fly%20Me%20to%20the%20Moon%20Frank%20Sinatra"
  ]
 },
 {
  "id": "br-vai-malandra-anitta-feat-mc-zaac-",
  "titulo": "Vai Malandra",
  "artista": "Anitta feat. MC Zaac, Maejor, Tropkillaz e DJ Yuri Martins",
  "ano": 2017,
  "alternativas": {
   "artista": [
    "Anitta"
   ]
  },
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Funk carioca",
  "dificuldade": "facil",
  "spotify": "6u0EAxf1OJTLS7CvInuNd7",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Vai%20Malandra%20Anitta"
  ]
 },
 {
  "id": "br-ilarie-xuxa",
  "titulo": "Ilariê",
  "artista": "Xuxa",
  "ano": 1988,
  "alternativas": {
   "titulo": [
    "Ilarie"
   ]
  },
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Pop infantil",
  "dificuldade": "facil",
  "spotify": "1k7fKhUfxC3wl1JFgrcKa4",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Ilari%C3%AA%20Xuxa"
  ]
 },
 {
  "id": "br-pais-e-filhos-legiao-urbana",
  "titulo": "Pais e Filhos",
  "artista": "Legião Urbana",
  "ano": 1989,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "facil",
  "spotify": "711HQaXT4z10tsKERKqyuz",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Pais%20e%20Filhos%20Legi%C3%A3o%20Urbana"
  ]
 },
 {
  "id": "br-ideologia-cazuza",
  "titulo": "Ideologia",
  "artista": "Cazuza",
  "ano": 1988,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "media",
  "spotify": "4s6qyTWg5r4EyOi2QIwM9g",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Ideologia%20Cazuza"
  ]
 },
 {
  "id": "br-whisky-a-go-go-roupa-nova",
  "titulo": "Whisky a Go-Go",
  "artista": "Roupa Nova",
  "ano": 1984,
  "alternativas": {
   "titulo": [
    "Whisky a Go Go"
   ]
  },
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Pop rock",
  "dificuldade": "media",
  "spotify": "5s47EQXprop8YKcNSzv9Bn",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Whisky%20a%20Go-Go%20Roupa%20Nova"
  ]
 },
 {
  "id": "br-flores-titas",
  "titulo": "Flores",
  "artista": "Titãs",
  "ano": 1989,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "facil",
  "spotify": "7p1kRO0ysz7EnYSCeDnsXn",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Flores%20Tit%C3%A3s"
  ]
 },
 {
  "id": "br-proibida-pra-mim-grazon-charlie-brown-jr",
  "titulo": "Proibida pra Mim (Grazon)",
  "artista": "Charlie Brown Jr.",
  "ano": 1997,
  "alternativas": {
   "titulo": [
    "Proibida pra Mim"
   ],
   "artista": [
    "Charlie Brown"
   ]
  },
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "facil",
  "spotify": "7waT9JEouElUGt0JyI7q1i",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Proibida%20pra%20Mim%20%28Grazon%29%20Charlie%20Brown%20Jr."
  ]
 },
 {
  "id": "br-travessia-milton-nascimento",
  "titulo": "Travessia",
  "artista": "Milton Nascimento",
  "ano": 1967,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "MPB",
  "dificuldade": "dificil",
  "spotify": "6MN3vF1tGzG7nkAOLjK0YG",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Travessia%20Milton%20Nascimento"
  ]
 },
 {
  "id": "br-baile-de-favela-mc-joao",
  "titulo": "Baile de Favela",
  "artista": "MC João",
  "ano": 2015,
  "anosAceitos": [
   2016
  ],
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Funk paulista",
  "dificuldade": "facil",
  "spotify": "6RvMVidQrwAh2VkXLIVfQn",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Baile%20de%20Favela%20MC%20Jo%C3%A3o"
  ]
 },
 {
  "id": "br-supera-marilia-mendonca",
  "titulo": "Supera",
  "artista": "Marília Mendonça",
  "ano": 2019,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Sertanejo",
  "dificuldade": "facil",
  "spotify": "3GmJxfnUDrIs1iCfKUELFz",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Supera%20Mar%C3%ADlia%20Mendon%C3%A7a"
  ]
 },
 {
  "id": "br-florentina-tiririca",
  "titulo": "Florentina",
  "artista": "Tiririca",
  "ano": 1996,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Forró / Humor",
  "dificuldade": "media",
  "spotify": "3tqv7xESjYRUjnBoJvfLhN",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Florentina%20Tiririca"
  ]
 },
 {
  "id": "br-na-sua-estante-pitty",
  "titulo": "Na Sua Estante",
  "artista": "Pitty",
  "ano": 2005,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "facil",
  "spotify": "1cc0kyZrheNxOYPn3VoVEH",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Na%20Sua%20Estante%20Pitty"
  ]
 },
 {
  "id": "br-sonifera-ilha-titas",
  "titulo": "Sonífera Ilha",
  "artista": "Titãs",
  "ano": 1984,
  "pais": "Brasil",
  "idioma": "Português",
  "origem": "br",
  "genero": "Rock nacional",
  "dificuldade": "media",
  "spotify": "6uUORbJHSVvBoX6qp9cDda",
  "fontes": [
   "https://pt.wikipedia.org/w/index.php?search=Son%C3%ADfera%20Ilha%20Tit%C3%A3s"
  ]
 },
 {
  "id": "intl-blue-suede-shoes-carl-perkins",
  "titulo": "Blue Suede Shoes",
  "artista": "Carl Perkins",
  "ano": 1956,
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Rockabilly",
  "dificuldade": "dificil",
  "spotify": "6YCs6UsDfOuz17PM3ueHxv",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Blue%20Suede%20Shoes%20Carl%20Perkins"
  ]
 },
 {
  "id": "intl-le-freak-chic",
  "titulo": "Le Freak",
  "artista": "Chic",
  "ano": 1978,
  "alternativas": {
   "artista": [
    "CHIC"
   ]
  },
  "pais": "Estados Unidos",
  "idioma": "Inglês",
  "origem": "intl",
  "genero": "Disco",
  "dificuldade": "media",
  "spotify": "7z3aH1QV2zwMKXxShBNOGe",
  "fontes": [
   "https://en.wikipedia.org/w/index.php?search=Le%20Freak%20Chic"
  ]
 }
];

export const EXTRA_SONGS: Song[] = raw.map(({ spotify, ...s }) => ({
  ...s,
  spotifyUrl: `https://open.spotify.com/track/${spotify}`,
  temLetra: true,
  exemplo: true,
}));
