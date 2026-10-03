# Em Movimento

Site editorial sobre o impacto do exercício físico no corpo e na mente das crianças, escrito para pais.

HTML + CSS + JS puros, sem etapa de build. Para visualizar, abra `index.html` no navegador ou sirva a pasta:

```bash
npx serve em-movimento
```

## Página

Tudo fica em `index.html`, numa página única com menu de âncoras: banner, O corpo, A mente, Por idade, aula-modelo de 10 a 12 anos, dicas, perguntas frequentes e fontes.

## Estrutura

- `assets/styles.css` — tokens de cor (`--pine`, `--gold` etc.), tipografia (Fraunces + Inter) e componentes compartilhados
- `assets/main.js` — menu no celular e abas por idade
- `assets/favicon.svg`

As páginas são geradas por `build.py` (menu, rodapé e ícones compartilhados). Para mudar textos ou seções, edite `build.py` e rode `python3 build.py` (Python 3.12+).
