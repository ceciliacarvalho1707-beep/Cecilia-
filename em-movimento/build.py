#!/usr/bin/env python3
"""Gera as páginas estáticas do site Em Movimento a partir de partes compartilhadas.

Uso: python3 build.py  (requer Python 3.12 ou mais recente)
"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parent

def ic(paths):
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>')

I = {
    'bone': ic('<path d="M17 3a3 3 0 0 0-2.8 4.1L7.1 14.2A3 3 0 1 0 6 20a3 3 0 1 0 5.8-1.1l7.1-7.1A3 3 0 1 0 17 3z"/>'),
    'heart': ic('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M4 12h4l2-3 3 6 2-3h5"/>'),
    'brain': ic('<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>'),
    'smile': ic('<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5s1.3 2 3.5 2 3.5-2 3.5-2"/><path d="M9 9.5h.01M15 9.5h.01"/>'),
    'moon': ic('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
    'target': ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    'clock': ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    'run': ic('<circle cx="14" cy="4.5" r="2"/><path d="M8 21l3-6 3 2v5"/><path d="M6 12l3-4 4 1 3 3 3 1"/><path d="M11 15l2-6"/>'),
    'sun': ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    'users': ic('<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 5 5"/>'),
    'check': ic('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>'),
    'info': ic('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
    'alert': ic('<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17h.01"/>'),
    'puzzle': ic('<path d="M10 3h4v3a2 2 0 1 0 4 0V3h3v7h-3a2 2 0 1 0 0 4h3v7h-7v-3a2 2 0 1 0-4 0v3H3v-7h3a2 2 0 1 0 0-4H3V3h7z"/>'),
    'dumbbell': ic('<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>'),
    'book': ic('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>'),
    'baby': ic('<circle cx="12" cy="8" r="4"/><path d="M6 21a6 6 0 0 1 12 0"/><path d="M10.5 8h.01M13.5 8h.01"/>'),
    'shield': ic('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
}

LOGO_SVG = ('<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="14.5" stroke="#B9893C"/>'
            '<path d="M6 20c4-9 8-11 10-4s6 5 10-4" stroke="#B9893C" stroke-width="1.6" stroke-linecap="round"/></svg>')

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com" />\n'
         '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n'
         '  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500..700;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />')

NAV_ITEMS = [('index.html', 'Início'), ('corpo.html', 'O corpo'), ('mente.html', 'A mente'), ('por-idade.html', 'Por idade')]


def page(filename, title, description, body):
    links = '\n'.join(
        f'          <li><a href="{href}"{" aria-current=\"page\"" if href == filename else ""}>{label}</a></li>'
        for href, label in NAV_ITEMS)
    return f'''<!doctype html>
<html lang="pt-BR" class="no-js">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content="{description}" />
  <meta name="theme-color" content="#16261D" />
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />
  {FONTS}
  <link rel="stylesheet" href="assets/styles.css" />
</head>
<body>
  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>

  <header class="nav">
    <div class="wrap">
      <a class="logo" href="index.html" aria-label="Em Movimento, página inicial">{LOGO_SVG}<span>Em <em>Movimento</em></span></a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="Abrir menu"><span></span></button>
      <nav class="nav-menu" id="nav-menu" aria-label="Principal">
        <ul class="nav-links">
{links}
        </ul>
        <a class="btn btn-gold btn-sm" href="por-idade.html#aula-10-12">Aula-modelo</a>
      </nav>
    </div>
  </header>

  <main id="conteudo">
{body}
  </main>

  <footer class="footer">
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <a class="logo" href="index.html">{LOGO_SVG}<span>Em <em>Movimento</em></span></a>
          <p>Informação confiável sobre exercício físico, corpo e mente na infância, escrita para pais e mães.</p>
        </div>
        <div>
          <h4>Conteúdo</h4>
          <ul>
            <li><a href="corpo.html">O corpo</a></li>
            <li><a href="mente.html">A mente</a></li>
            <li><a href="por-idade.html">Guia por idade</a></li>
            <li><a href="por-idade.html#aula-10-12">Aula-modelo (10 a 12 anos)</a></li>
          </ul>
        </div>
        <div>
          <h4>Mais</h4>
          <ul>
            <li><a href="index.html#dicas">Dicas práticas</a></li>
            <li><a href="index.html#perguntas">Perguntas frequentes</a></li>
            <li><a href="index.html#fontes">Fontes</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-base">
        <span>© <span data-year>2026</span> Em Movimento</span>
        <span>Conteúdo informativo. Não substitui a orientação do pediatra.</span>
      </div>
    </div>
  </footer>

  <script src="assets/main.js"></script>
</body>
</html>
'''


def page_header(crumb, eyebrow, h1, lead):
    return f'''    <section class="page-header on-dark">
      <div class="wrap">
        <p class="crumbs"><a href="index.html">Início</a> › {crumb}</p>
        <span class="eyebrow">{eyebrow}</span>
        <h1>{h1}</h1>
        <p class="lead">{lead}</p>
      </div>
    </section>'''


NOTICE = f'''<div class="notice">{I['info']}<p style="margin:0"><strong>Importante:</strong> este site é informativo e não substitui a orientação do pediatra ou de outros profissionais que acompanham seu filho.</p></div>'''


def sources(items, section_class='bg-parchment'):
    lis = '\n'.join(f'            <li>{x}</li>' for x in items)
    return f'''    <section class="section {section_class}" id="fontes">
      <div class="wrap">
        <div class="section-head">
          <span class="eyebrow">Fontes</span>
          <h2>De onde vêm <em>essas</em> informações</h2>
        </div>
        <div class="sources">
          <ol>
{lis}
          </ol>
        </div>
        {NOTICE}
      </div>
    </section>'''


SRC_WHO2020 = 'Organização Mundial da Saúde. <em>Diretrizes sobre atividade física e comportamento sedentário.</em> 2020.'
SRC_WHO2019 = 'Organização Mundial da Saúde. <em>Diretrizes sobre atividade física, comportamento sedentário e sono para crianças menores de 5 anos.</em> 2019.'
SRC_MS = 'Ministério da Saúde. <em>Guia de Atividade Física para a População Brasileira.</em> 2021.'

# --------------------------------------------------------------------------
# Página inicial
# --------------------------------------------------------------------------

HERO_SCENE = '''<svg viewBox="0 0 400 340" role="img" aria-label="Ilustração de uma criança correndo ao ar livre, com sol e colinas ao fundo.">
              <rect width="400" height="340" fill="#223629"/>
              <circle cx="300" cy="92" r="46" fill="#B9893C"/>
              <circle cx="300" cy="92" r="68" fill="#B9893C" fill-opacity=".14"/>
              <path d="M0 250 C70 214 130 222 200 240 S330 262 400 226 V340 H0Z" fill="#2E4A38"/>
              <path d="M0 282 C90 256 170 268 250 284 S360 300 400 280 V340 H0Z" fill="#16261D"/>
              <g stroke="#F4F0E1" stroke-opacity=".35" stroke-width="5" stroke-linecap="round">
                <path d="M52 168h46M38 192h58M60 216h36"/>
              </g>
              <g transform="translate(196 196) scale(2.3)" stroke="#F4F0E1" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
                <path d="M0 0 L8 -38"/>
                <path d="M6 -32 L22 -21 L33 -32"/>
                <path d="M6 -32 L-9 -21 L-21 -12"/>
                <path d="M0 0 L19 13 L14 36"/>
                <path d="M0 0 L-7 23 L-29 29"/>
                <circle cx="14" cy="-53" r="10" fill="#F4F0E1" stroke="none"/>
              </g>
            </svg>'''

AGES = [
    ('bebes', 'Até 1 ano', '30 min', 'de barriga para baixo por dia, além de brincar no chão',
     'Bebês: o chão é o primeiro parquinho',
     ['Movimento várias vezes ao dia, principalmente brincando no chão.',
      'Para quem ainda não engatinha: <strong>ao menos 30 minutos</strong> por dia de barriga para baixo, acordado e com um adulto por perto.',
      'Não deixar no carrinho ou bebê-conforto por <strong>mais de 1 hora seguida</strong>.',
      'Telas: <strong>não são recomendadas</strong>.']),
    ('um-dois', '1 a 2 anos', '3 horas', 'por dia, de qualquer intensidade',
     'Primeiros passos: andar, subir e explorar',
     ['<strong>Ao menos 180 minutos</strong> por dia de atividades variadas.',
      'Empurrar brinquedos, dançar, subir degraus com ajuda.',
      'Telas: nada até 1 ano; aos 2 anos, <strong>no máximo 1 hora</strong> por dia.',
      'Sono: 11 a 14 horas, contando os cochilos.']),
    ('tres-cinco', '3 a 5 anos', '3 horas', 'por dia, sendo 1 hora mais intensa',
     'Pré-escola: a fase de aprender a correr, pular e arremessar',
     ['<strong>Ao menos 180 minutos</strong> por dia, dos quais <strong>60 minutos</strong> de atividade moderada a intensa.',
      'Brincar ao ar livre, pega-pega, bicicleta de equilíbrio, circuitos.',
      'Telas: <strong>no máximo 1 hora</strong> por dia.',
      'Sono: 10 a 13 horas.']),
    ('seis-doze', '6 a 12 anos', '1 hora', 'por dia, de moderada a intensa',
     'Idade escolar: experimentar vários esportes',
     ['<strong>Média de 60 minutos por dia</strong> de atividade que deixa a criança ofegante.',
      'Em <strong>3 dias por semana</strong>, atividades que fortalecem músculos e ossos (saltos, escalada, ginástica).',
      'Evitar treinar um único esporte cedo demais: variar reduz lesões.',
      'Diminuir o tempo parado em frente às telas.']),
    ('treze', '13 a 17 anos', '1 hora', 'por dia, de moderada a intensa',
     'Adolescência: autonomia para escolher',
     ['As mesmas metas: <strong>60 minutos por dia</strong> e fortalecimento <strong>3 vezes por semana</strong>.',
      'Musculação é segura quando há orientação e boa técnica.',
      'Deixar o adolescente escolher a atividade ajuda ele a continuar.',
      'É a fase em que a atividade mais cai, principalmente entre as meninas.']),
]

tab_buttons = '\n'.join(
    f'            <button type="button" role="tab" id="tab-{k}" aria-controls="painel-{k}" aria-selected="{"true" if i == 0 else "false"}"{"" if i == 0 else " tabindex=\"-1\""}>{label}</button>'
    for i, (k, label, *_rest) in enumerate(AGES))
tab_panels = '\n'.join(
    f'''          <div class="tab-panel" role="tabpanel" id="painel-{k}" aria-labelledby="tab-{k}"{"" if i == 0 else " hidden"}>
            <div class="big"><strong>{big}</strong><span>{small}</span></div>
            <div>
              <h3>{h}</h3>
              <ul class="check-list">
{chr(10).join(f"                <li>{li}</li>" for li in lis)}
              </ul>
            </div>
          </div>'''
    for i, (k, label, big, small, h, lis) in enumerate(AGES))

BENEFITS = [
    ('bone', 'Ossos mais fortes', 'Pular e correr estimulam os ossos a ficarem mais densos. A maior parte dessa “reserva” é formada até o fim da adolescência.', 'corpo.html#ossos'),
    ('heart', 'Coração saudável', 'Atividades que deixam a criança ofegante melhoram o fôlego, a pressão arterial e a saúde do coração.', 'corpo.html#coracao'),
    ('target', 'Coordenação', 'Correr, pular, arremessar e se equilibrar são a base de todos os esportes e da confiança para brincar.', 'corpo.html#coordenacao'),
    ('brain', 'Mais atenção', 'Crianças ativas costumam ter mais facilidade para se concentrar e controlar impulsos.', 'mente.html#atencao'),
    ('smile', 'Bom humor', 'O exercício está ligado a menos sintomas de tristeza e ansiedade e a uma autoestima melhor.', 'mente.html#emocoes'),
    ('moon', 'Sono melhor', 'Quem gasta energia durante o dia costuma pegar no sono mais rápido e dormir melhor.', 'mente.html#sono'),
]
benefit_cards = '\n'.join(
    f'''          <a class="card" href="{href}">
            <div class="icon">{I[icon]}</div>
            <h3>{t}</h3>
            <p>{d}</p>
            <span class="text-link">Saiba mais →</span>
          </a>''' for icon, t, d, href in BENEFITS)

TIPS = [
    ('Some pequenos momentos', 'A 1 hora por dia não precisa ser seguida. Ir a pé para a escola, o recreio e uma brincadeira à tarde já contam.'),
    ('Varie as atividades', 'Correr, nadar, dançar, pedalar, subir em árvores. Variar desenvolve mais habilidades e evita lesões.'),
    ('Deixe brincar livre', 'Brincadeiras ao ar livre e sem regras rígidas são naturalmente intensas e estimulam a criatividade.'),
    ('Dê o exemplo', 'Crianças imitam os pais. Caminhadas em família e idas ao parque ensinam mais que qualquer conselho.'),
]
tip_cards = '\n'.join(
    f'''          <div class="step">
            <div class="step-num">{n:02d}</div>
            <h3>{t}</h3>
            <p>{d}</p>
          </div>''' for n, (t, d) in enumerate(TIPS, 1))

FAQ = [
    ('Exercício atrapalha o crescimento?', 'Não. Essa é uma ideia antiga que a ciência não confirma. A atividade física regular, ao contrário, ajuda a formar ossos e músculos mais fortes.'),
    ('Criança pode fazer musculação?', 'Pode, desde que tenha orientação de um profissional, aprenda a técnica correta e use cargas adequadas para a idade. Nas crianças pequenas, a força vem naturalmente das brincadeiras, como se pendurar e escalar.'),
    ('Como sei se a atividade é “moderada” ou “intensa”?', 'Um teste simples: na atividade moderada, a criança fica ofegante mas ainda consegue conversar. Na intensa, ela não consegue falar uma frase inteira sem parar para respirar.'),
    ('Meu filho não gosta de esporte. E agora?', 'Esporte é só uma das opções. Dança, bicicleta, patins, trilhas e brincadeiras no parque também contam. O mais importante é que seja divertido.'),
    ('Quanto tempo de tela é aceitável?', 'Para menores de 2 anos, a recomendação é evitar telas. De 2 a 4 anos, no máximo 1 hora por dia. Para crianças maiores, a orientação é diminuir o tempo parado, principalmente o de lazer em frente às telas.'),
]
faq_items = '\n'.join(
    f'''          <details>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>''' for q, a in FAQ)

HOME = f'''    <section class="hero on-dark">
      <div class="wrap hero-grid">
        <div>
          <span class="eyebrow">Para pais e mães</span>
          <h1>Crianças que se movem <em>crescem</em> por inteiro.</h1>
          <p class="lead">Descubra, de forma simples, como o exercício físico ajuda o corpo e a mente do seu filho, e quanto movimento é recomendado em cada idade.</p>
          <div class="hero-actions">
            <a class="btn btn-gold" href="por-idade.html">Ver o guia por idade →</a>
            <a class="btn btn-outline-light" href="#beneficios">Conhecer os benefícios</a>
          </div>
          <div class="hero-trust">
            <span>{I['shield']} Baseado na OMS e no Ministério da Saúde</span>
            <span>{I['clock']} Leitura rápida</span>
          </div>
        </div>
        <div class="hero-art">
          <div class="scene">
            {HERO_SCENE}
          </div>
          <div class="chip chip-a"><span class="chip-icon">{I['clock']}</span><span><strong>60 min</strong>por dia, dos 5 aos 17 anos</span></div>
          <div class="chip chip-b"><span class="chip-icon">{I['dumbbell']}</span><span><strong>3× por semana</strong>fortalecer músculos e ossos</span></div>
        </div>
      </div>
    </section>

    <section class="section bg-cream" id="beneficios">
      <div class="wrap">
        <div class="section-head">
          <span class="eyebrow">Benefícios</span>
          <h2>O que o exercício faz <em>pelo</em> seu filho</h2>
          <p class="lead">O movimento diário ajuda no corpo e na mente ao mesmo tempo. Veja os principais benefícios.</p>
        </div>
        <div class="cards">
{benefit_cards}
        </div>
      </div>
    </section>

    <section class="section bg-parchment" id="idades">
      <div class="wrap">
        <div class="section-head">
          <span class="eyebrow">Recomendações</span>
          <h2>Quanto movimento <em>em</em> cada idade?</h2>
          <p class="lead">Escolha a faixa de idade do seu filho para ver o que a Organização Mundial da Saúde recomenda.</p>
        </div>
        <div class="tabs" data-tabs>
          <div class="tab-list" role="tablist" aria-label="Faixas de idade">
{tab_buttons}
          </div>
{tab_panels}
        </div>
        <p style="margin-top:2.5rem"><a class="text-link" href="por-idade.html">Ver o guia completo por idade →</a></p>
      </div>
    </section>

    <section class="section bg-cream" id="dicas">
      <div class="wrap">
        <div class="section-head">
          <span class="eyebrow">Dicas práticas</span>
          <h2>Mais movimento <em>no</em> dia a dia</h2>
          <p class="lead">Não é preciso academia nem planilha. Pequenas mudanças na rotina fazem diferença.</p>
        </div>
        <div class="steps">
{tip_cards}
        </div>
      </div>
    </section>

    <section class="section bg-cream" style="padding-top:0">
      <div class="wrap">
        <div class="feature">
          <div>
            <span class="eyebrow">Novo · 10 a 12 anos</span>
            <h2>Uma aula de educação física completa, em 60 minutos</h2>
            <p class="lead">Veja como é uma aula pensada para crianças de 10 a 12 anos: do aquecimento ao relaxamento, com o porquê de cada parte.</p>
            <a class="btn btn-gold" href="por-idade.html#aula-10-12">Ver a aula-modelo →</a>
          </div>
          <ul class="mini-timeline">
            <li><span>Aquecimento</span><span>8 min</span></li>
            <li><span>Cardio</span><span>12 min</span></li>
            <li><span>Força: pernas</span><span>12 min</span></li>
            <li><span>Força: tronco e braços</span><span>10 min</span></li>
            <li><span>Coordenação e agilidade</span><span>8 min</span></li>
            <li><span>Volta à calma</span><span>10 min</span></li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section bg-parchment" id="perguntas">
      <div class="wrap">
        <div class="section-head">
          <span class="eyebrow">Dúvidas</span>
          <h2>Perguntas <em>frequentes</em></h2>
        </div>
        <div class="faq">
{faq_items}
        </div>
      </div>
    </section>

    <section class="section bg-cream">
      <div class="wrap">
        <div class="cta">
          <h2>Toda atividade <em>conta</em>.</h2>
          <p class="lead">Fazer um pouco é melhor do que nada, e fazer mais traz mais benefícios. Comece hoje, do jeito que der.</p>
          <a class="btn btn-gold" href="por-idade.html">Ver o que é ideal para o meu filho →</a>
        </div>
      </div>
    </section>

{sources([SRC_WHO2020, SRC_WHO2019, SRC_MS,
          'Donnelly, J. E. e colaboradores. Atividade física, aptidão, função cognitiva e desempenho escolar em crianças: revisão sistemática. <em>Medicine &amp; Science in Sports &amp; Exercise</em>, 2016.',
          'Weaver, C. M. e colaboradores. Desenvolvimento do pico de massa óssea e fatores de estilo de vida. <em>Osteoporosis International</em>, 2016.'])}'''

# --------------------------------------------------------------------------
# O corpo
# --------------------------------------------------------------------------

def topic(id_, icon, title, paras, tip=None, warn=None):
    ps = '\n'.join(f'            <p>{p}</p>' for p in paras)
    extra = ''
    if tip:
        extra += f'\n            <div class="tip">{I["check"]}<p>{tip}</p></div>'
    if warn:
        extra += f'\n            <div class="tip warn">{I["alert"]}<p>{warn}</p></div>'
    return f'''        <article class="topic" id="{id_}">
          <div class="icon">{I[icon]}</div>
          <div>
            <h2>{title}</h2>
{ps}{extra}
          </div>
        </article>'''


def stats(items):
    return '\n'.join(f'          <div class="stat"><strong>{a}</strong><span>{b}</span></div>' for a, b in items)

CORPO = f'''{page_header('O corpo', 'O corpo', 'Como o exercício fortalece <em>o</em> corpo', 'Ossos, músculos, coração e coordenação: o corpo da criança está se formando e responde muito bem ao movimento.')}
    <section class="on-dark" style="padding-bottom:3.5rem">
      <div class="wrap">
        <div class="stats">
{stats([('~25%', 'da massa óssea adulta se forma nos cerca de 2 anos do estirão de crescimento'), ('3× por semana', 'atividades que fortalecem músculos e ossos (5 a 17 anos)'), ('60 min', 'por dia, em média, de atividade moderada a intensa')])}
        </div>
      </div>
    </section>

    <section class="section bg-cream">
      <div class="wrap narrow">
{topic('ossos', 'bone', 'Ossos: uma reserva para a vida toda',
       ['O osso é um tecido vivo. Quando a criança corre, pula ou sobe em algum lugar, o impacto avisa o esqueleto que ele precisa ficar mais forte, e ele responde ficando mais denso.',
        'Isso acontece principalmente antes e durante a puberdade. <strong>A maior parte da massa óssea é formada até o fim da adolescência</strong> e funciona como uma poupança que protege o adulto contra a perda óssea na velhice.'],
       tip='Atividades com impacto (pular corda, amarelinha, basquete, corrida) fortalecem mais os ossos do que a natação. O ideal é combinar as duas coisas.')}
{topic('musculos', 'dumbbell', 'Músculos: força com segurança',
       ['Muita gente acha que exercício de força “atrapalha o crescimento”. A ciência não confirma isso. Os pediatras consideram o treino de força <strong>seguro e benéfico</strong> quando há supervisão, boa técnica e carga adequada.',
        'Nas crianças pequenas, a força vem das brincadeiras: se pendurar no trepa-trepa, empurrar, carregar e escalar.'])}
{topic('coracao', 'heart', 'Coração e fôlego',
       ['Atividades que aceleram a respiração por alguns minutos melhoram o fôlego, a pressão arterial e a forma como o corpo usa o açúcar e a gordura. A OMS liga a atividade regular na infância a <strong>um coração mais saudável e menos gordura corporal</strong>.',
        'Um teste simples: na atividade moderada a criança fica ofegante mas ainda conversa. Na intensa, não consegue falar uma frase inteira.'],
       warn='O objetivo não é o peso. Usar exercício como castigo ou para “compensar” o que se comeu costuma afastar a criança do movimento.')}
{topic('coordenacao', 'target', 'Coordenação: a base de todos os esportes',
       ['Correr, saltar, arremessar, chutar, se equilibrar e pegar uma bola são as <strong>habilidades motoras básicas</strong>. Elas não aparecem sozinhas com a idade: precisam de oportunidade e prática.',
        'Crianças que se sentem capazes brincam mais, e quem brinca mais fica ainda mais capaz. É um ciclo que se alimenta.'])}
        <p style="margin-top:2.5rem"><a class="btn btn-pine" href="mente.html">Próximo: a mente →</a></p>
      </div>
    </section>

{sources([SRC_WHO2020, 'Weaver, C. M. e colaboradores. Desenvolvimento do pico de massa óssea e fatores de estilo de vida. <em>Osteoporosis International</em>, 2016.', SRC_MS, 'Stricker, P. R. e colaboradores. Treino de força para crianças e adolescentes. <em>Pediatrics</em>, 2020.'])}'''

# --------------------------------------------------------------------------
# A mente
# --------------------------------------------------------------------------

MENTE = f'''{page_header('A mente', 'A mente', 'O cérebro também <em>vai</em> ao parquinho', 'Movimento também é aprendizado. Ele ajuda na atenção, no humor e no sono das crianças.')}

    <section class="section bg-cream">
      <div class="wrap narrow">
{topic('atencao', 'brain', 'Atenção e concentração',
       ['As <strong>funções executivas</strong> são as habilidades que nos ajudam a planejar, prestar atenção e controlar impulsos. Elas se desenvolvem durante toda a infância e são muito importantes na escola.',
        'Em um estudo conhecido, crianças de 9 e 10 anos que caminharam 20 minutos se saíram melhor em um teste de atenção logo depois, em comparação com quando ficaram em repouso. O efeito é real, mas pequeno e passageiro.'],
       tip='Pausas ativas na sala de aula, recreio de verdade e ir a pé para a escola são formas simples de aproveitar esse efeito.')}
{topic('aprender', 'book', 'Aprendizagem e escola',
       ['Estudos mostram, em geral, uma <strong>relação positiva</strong> entre atividade física e desempenho escolar, embora os resultados variem. Uma coisa é certa: o tempo de movimento na escola não atrapalha o aprendizado.',
        'Em animais, o exercício aumenta substâncias que ajudam os neurônios a criar novas conexões. Em humanos isso ainda está sendo estudado, então desconfie de promessas de “exercício que deixa a criança mais inteligente”.'])}
{topic('emocoes', 'smile', 'Humor, ansiedade e autoestima',
       ['A atividade física está ligada a <strong>menos sintomas de tristeza</strong> e, em menor grau, a menos ansiedade e mais autoestima. Brincadeiras em grupo e esportes coletivos ainda trazem amizade, cooperação e sensação de pertencer.'],
       warn='Pressão excessiva por resultado transforma o esporte em ansiedade. Diversão é o que mais faz a criança continuar se movendo.')}
{topic('sono', 'moon', 'Sono',
       ['Movimento de dia e sono bom à noite andam juntos. Crianças ativas costumam dormir mais rápido e melhor. E é durante o sono que a memória se fixa, o corpo cresce e as emoções se organizam.'])}
        <p style="margin-top:2.5rem"><a class="btn btn-pine" href="por-idade.html">Próximo: guia por idade →</a></p>
      </div>
    </section>

{sources(['Hillman, C. H. e colaboradores. Efeito da caminhada na esteira sobre o controle cognitivo e o desempenho escolar em crianças. <em>Neuroscience</em>, 2009.',
          'Donnelly, J. E. e colaboradores. Atividade física, aptidão, função cognitiva e desempenho escolar em crianças: revisão sistemática. <em>Medicine &amp; Science in Sports &amp; Exercise</em>, 2016.',
          'Biddle, S. J. H. e colaboradores. Atividade física e saúde mental em crianças e adolescentes: revisão de revisões. <em>Psychology of Sport and Exercise</em>, 2019.',
          SRC_WHO2019])}'''

# --------------------------------------------------------------------------
# Por idade
# --------------------------------------------------------------------------

AGE_PAGE = [
    ('bebes', '0–1', 'Bebês', 'O chão é o primeiro parquinho',
     'Para o bebê, se mexer é explorar: virar, alcançar, se arrastar e engatinhar. Cada conquista abre um mundo novo.',
     ['Brincadeiras no chão várias vezes ao dia.', 'Barriga para baixo, acordado e com um adulto por perto.', 'Brinquedos um pouco longe, para incentivar o bebê a alcançar.'],
     ['Movimento <strong>várias vezes ao dia</strong>', '<strong>30 min</strong> de barriga para baixo, para quem ainda não engatinha', 'No máximo <strong>1 hora seguida</strong> no carrinho ou cadeirinha', 'Telas: <strong>não recomendadas</strong>']),
    ('um-dois', '1–2', 'Primeiros passos', 'Andar, subir, carregar, derrubar',
     'A criança começa a andar e quer explorar tudo. É hora de oferecer espaço seguro em vez de conter.',
     ['Empurrar e puxar brinquedos.', 'Dançar e subir degraus com ajuda.', 'Percursos com almofadas e obstáculos baixos.'],
     ['<strong>3 horas</strong> por dia de atividades variadas', 'Telas: nada até 1 ano; aos 2, <strong>no máximo 1 hora</strong>', 'Sono: <strong>11 a 14 horas</strong> com cochilos']),
    ('pre-escolar', '3–5', 'Pré-escola', 'A melhor fase para aprender a se mexer',
     'É quando a criança aprende com mais facilidade a correr, saltar, arremessar e se equilibrar.',
     ['Brincar livre ao ar livre.', 'Pega-pega, roda, circuitos.', 'Bicicleta de equilíbrio e triciclo.'],
     ['<strong>3 horas</strong> por dia, sendo <strong>1 hora</strong> mais intensa (3 e 4 anos)', 'Telas: <strong>no máximo 1 hora</strong> por dia', 'Sono: <strong>10 a 13 horas</strong>']),
    ('escolar', '6–12', 'Idade escolar', 'Experimentar vários esportes, sem pressa',
     'A criança já entende regras e gosta de desafios. É uma ótima fase para conhecer várias modalidades e descobrir do que gosta.',
     ['Esportes com bola, natação, lutas, ginástica.', 'Brincadeiras com saltos e escalada.', 'Evitar treinar um único esporte cedo demais: variar reduz lesões e desistência.'],
     ['<strong>Média de 60 min</strong> por dia de atividade moderada a intensa', '<strong>3 dias por semana</strong> com atividades que fortalecem músculos e ossos', 'Menos tempo parado em frente às telas']),
    ('adolescentes', '13–17', 'Adolescência', 'Autonomia para escolher',
     'É na adolescência que a atividade física mais cai, principalmente entre as meninas. Ouvir o adolescente e deixá-lo escolher faz diferença.',
     ['Dança, skate, academia, trilhas: tudo conta.', 'Musculação com orientação e boa técnica é segura.', 'Atividades com amigos ajudam a manter o hábito.'],
     ['<strong>Média de 60 min</strong> por dia', 'Fortalecimento <strong>3 vezes por semana</strong>', 'Menos tempo parado em frente às telas']),
]

age_cards = '\n'.join(
    f'''        <article class="age-card" id="{k}">
          <header>
            <span class="age">{age}</span>
            <div>
              <h2>{title}</h2>
              <p><strong>{name}.</strong> {intro}</p>
            </div>
          </header>
          <div class="age-body">
            <div>
              <h3 style="font-size:1.1rem;margin-bottom:.75rem">Ideias de atividades</h3>
              <ul class="check-list">
{chr(10).join(f"                <li>{x}</li>" for x in ideas)}
              </ul>
              {'<p style="margin:1.25rem 0 0"><a class="text-link" href="#aula-10-12">Veja a aula-modelo para 10 a 12 anos ↓</a></p>' if k == 'escolar' else ''}
            </div>
            <div class="age-goal">
              <h3>Recomendação</h3>
              <ul>
{chr(10).join(f"                <li>{x}</li>" for x in goals)}
              </ul>
            </div>
          </div>
        </article>''' for k, age, name, title, intro, ideas, goals in AGE_PAGE)

LESSON = [
    ('Aquecimento', 'Aquecimento', 8, 'Marcha, polichinelo e rotação de articulações: ombro, quadril e tornozelo.',
     'Eleva a frequência cardíaca aos poucos e prepara as articulações antes do esforço, reduzindo o risco de lesão.'),
    ('Cardio', 'Cardio', 12, 'Pular corda em intervalos: 1min30 pulando e 30 s de descanso, em 3 séries.',
     'Nessa idade a criança já aguenta intervalos de esforço mais longos que as menores, parecido com o treino de adultos, mas com descanso suficiente para não se cansar demais.'),
    ('Força: pernas', 'Pernas', 12, 'Agachamento livre, afundo alternado e salto no agachamento.',
     'Entre 10 e 12 anos, a criança já consegue fazer variações mais difíceis, como o salto no agachamento, que trabalha potência e não só força. Mas só depois de dominar bem o agachamento simples.'),
    ('Força: tronco e braços', 'Tronco', 10, 'Prancha, flexão com os joelhos no chão, abdominal remador e prancha lateral.',
     'Já existe controle do tronco para fazer a prancha lateral com boa postura. Ela fortalece a lateral do corpo, importante em esportes com mudança de direção.'),
    ('Coordenação e agilidade', 'Coordenação', 8, 'Escada de agilidade e equilíbrio num pé só, de olhos fechados.',
     'Fechar os olhos tira a ajuda da visão no equilíbrio. Crianças menores geralmente ainda não conseguem, e o corpo passa a depender só da percepção da própria posição.'),
    ('Volta à calma', 'Calma', 10, 'Alongamento de pernas, costas e ombros, seguido de respiração guiada.',
     'Nessa idade já faz sentido ensinar a “desligar” o corpo depois do esforço, criando um hábito útil para a adolescência e a vida adulta.'),
]
lesson_bar = '\n'.join(
    f'            <span style="--m:{m}"><b>{n:02d}</b> {short}</span>'
    for n, (t, short, m, ex, why) in enumerate(LESSON, 1))
lesson_items = '\n'.join(
    f'''          <li>
            <span class="numeral lesson-num">{n:02d}</span>
            <div class="lesson-body">
              <h3>{t}</h3>
              <p class="lesson-ex"><span class="lesson-label">Exercícios</span>{ex}</p>
              <p class="lesson-why"><span class="lesson-label">Por que nessa idade</span>{why}</p>
            </div>
            <span class="lesson-time"><span class="numeral">{m}</span> min</span>
          </li>''' for n, (t, short, m, ex, why) in enumerate(LESSON, 1))

POR_IDADE = f'''{page_header('Por idade', 'Guia por idade', 'Quanto movimento <em>em</em> cada fase', 'Do bebê ao adolescente: o que é recomendado e ideias simples para cada idade, segundo a OMS e o Ministério da Saúde.')}

    <section class="section bg-cream">
      <div class="wrap narrow">
{age_cards}
        <div class="tip warn" style="max-width:none;margin-top:1.5rem">{I['alert']}<p><strong>Quando procurar o pediatra:</strong> dor que não passa ou piora com a atividade, falta de ar ou desmaio durante o esforço, atraso nos marcos do desenvolvimento motor, ou antes de começar treinos intensos e competições.</p></div>
      </div>
    </section>

    <section class="section bg-parchment" id="aula-10-12">
      <div class="wrap">
        <div class="section-head">
          <span class="eyebrow">Aula-modelo · 10 a 12 anos</span>
          <h2>Uma aula de 60 minutos, <em>em</em> seis blocos.</h2>
          <p class="lead">Uma aula organizada, pensada para crianças de 10 a 12 anos, que já conseguem seguir uma sequência e aguentar esforços mais longos. Ela complementa a brincadeira livre, não substitui.</p>
        </div>
        <div class="lesson-bar" aria-hidden="true">
          <div class="lesson-bar-track">
{lesson_bar}
          </div>
          <div class="lesson-bar-scale"><span>0 min</span><span>30</span><span>60 min</span></div>
        </div>
        <ol class="lesson">
{lesson_items}
          <li class="lesson-total">
            <span></span>
            <span class="lesson-label">Duração total</span>
            <span class="lesson-time"><span class="numeral">60</span> min</span>
          </li>
        </ol>
      </div>
    </section>

{sources([SRC_WHO2020, SRC_WHO2019, SRC_MS, 'Brenner, J. S. e colaboradores. Especialização esportiva e treino intenso em jovens atletas. <em>Pediatrics</em>, 2016.'], 'bg-cream')}'''

PAGES = [
    ('index.html', 'Em Movimento — exercício, corpo e mente na infância', 'Como o exercício físico ajuda o corpo e a mente das crianças, e quanto movimento é recomendado em cada idade. Um guia simples para pais.', HOME),
    ('corpo.html', 'O corpo — Em Movimento', 'Como o exercício físico fortalece ossos, músculos, coração e coordenação das crianças.', CORPO),
    ('mente.html', 'A mente — Em Movimento', 'Como o exercício físico ajuda na atenção, no aprendizado, no humor e no sono das crianças.', MENTE),
    ('por-idade.html', 'Guia por idade — Em Movimento', 'Quanto movimento é recomendado do bebê ao adolescente, e uma aula-modelo para crianças de 10 a 12 anos.', POR_IDADE),
]

for fn, title, desc, body in PAGES:
    (OUT / fn).write_text(page(fn, title, desc, body), encoding='utf-8')
    print('ok', fn)
