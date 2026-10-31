/**
 * Teste ponta a ponta (navegador real, Playwright) — cobre os 15 testes obrigatórios.
 * Uso:  npm run build && npm run test:e2e
 * O script sobe o "vite preview" sozinho. Capturas de tela ficam em e2e/screenshots/.
 * Requisições a open.spotify.com são interceptadas (o teste confere a URL, sem depender da rede).
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shots = join(root, 'e2e', 'screenshots');
mkdirSync(shots, { recursive: true });
const PORT = 4321;
const BASE = `http://localhost:${PORT}/`;

const results = [];
const check = (n, desc, ok, extra = '') => { results.push({ n, desc, ok }); console.log(`${ok ? '✅' : '❌'} ${n}. ${desc}${extra ? ` — ${extra}` : ''}`); };
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'pipe' });
await new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('preview não subiu')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); res(); } });
});

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const opened = [];
  await ctx.route(/open\.spotify\.com/, (route) => { opened.push(route.request().url()); route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>spotify (simulado)</h1>' }); });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('hitster-party:v1')));
  const curSong = async () => { const s = await state(); const m = s.match; const t = m.rounds[m.cursor.round].turns[m.cursor.turn]; return s.songs.find((x) => x.id === t.songId); };
  const totals = async () => Object.fromEntries(await page.$$eval('[data-testid=board-row]', (rows) => rows.map((r) => [r.querySelector('.board__name').childNodes[0].textContent.trim(), Number(r.querySelector('[data-testid=board-total]').textContent)])));

  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.screenshot({ path: join(shots, '01-inicio.png') });

  // 1. Criar equipes
  await page.click('[data-testid=btn-nova]');
  const names = page.locator('[data-testid=team-name]');
  await names.nth(0).fill('Equipe Roxa');
  await names.nth(1).fill('Time do Caos');
  await page.click('[data-testid=team-add]');
  await page.click('[data-testid=team-add]');
  await names.nth(2).fill('Os Inimigos do Fim');
  await page.locator('[data-testid=team-remove]').nth(3).click();
  check(1, 'É possível criar, renomear e remover equipes', (await names.count()) === 3 && (await names.nth(2).inputValue()) === 'Os Inimigos do Fim');

  // 2. Iniciar partida (2 rodadas personalizadas, modo turno)
  await page.getByRole('radio', { name: 'Personalizada' }).click();
  await page.fill('[data-testid=custom-rounds]', '2');
  await page.screenshot({ path: join(shots, '02-configuracao.png'), fullPage: true });
  await page.click('[data-testid=btn-iniciar]');
  await page.waitForSelector('[data-testid=round-card]');
  const banner = await page.textContent('[data-testid=turn-banner]');
  check(2, 'É possível iniciar uma partida', banner.includes('É A VEZ DA EQUIPE ROXA'), banner.trim());

  // 3/14. Música específica + sigilo
  let song = await curSong();
  const href = await page.getAttribute('[data-testid=spotify-button]', 'href');
  check(3, 'A rodada tem uma música específica (link de faixa)', /^https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]{22}$/.test(href) && href === song.spotifyUrl, href);
  const bodyBefore = norm(await page.textContent('body'));
  const secretInDom = await page.locator('[data-testid=secret-body]').count();
  const leak = [song.titulo, song.artista].filter((x) => x.length > 3 && bodyBefore.includes(norm(x)));
  check(14, 'A tela pública não mostra título/artista antes da revelação', leak.length === 0 && secretInDom === 0, leak.length ? `vazou: ${leak}` : `oculto: "${song.titulo}"`);
  await page.screenshot({ path: join(shots, '03-rodada.png'), fullPage: true });

  // 4. Botão do Spotify abre o link correto
  const popupP = ctx.waitForEvent('page');
  await page.click('[data-testid=spotify-button]');
  await page.waitForSelector('[data-testid=spotify-confirm]');
  await page.screenshot({ path: join(shots, '04-aviso-spotify.png') });
  await page.click('[data-testid=spotify-confirm]');
  const popup = await popupP;
  await popup.waitForLoadState().catch(() => {});
  check(4, 'O botão do Spotify abre o link correto', opened.includes(song.spotifyUrl) || popup.url() === song.spotifyUrl, popup.url());
  await popup.close();

  // 5. Gabarito começa fechado
  check(5, 'O gabarito começa fechado', (await page.textContent('[data-testid=secret-toggle]')).includes('REVELAR GABARITO') && (await page.locator('[data-testid=secret-body]').count()) === 0);

  // 7. Registrar palpites
  await page.fill('[data-testid=guess-ano]', String(song.ano + 1));
  await page.fill('[data-testid=guess-titulo]', song.titulo);
  await page.fill('[data-testid=guess-artista]', song.musical ?? song.artista);
  await page.click('[data-testid=guess-submit]');
  const sent = await page.locator('[data-testid=guess-sent]').count();
  const st1 = await state();
  const g = Object.values(st1.match.rounds[0].turns[0].guesses)[0];
  check(7, 'É possível registrar palpites', sent === 1 && g?.titulo === song.titulo);

  // 6. Revelar / ocultar várias vezes
  await page.click('[data-testid=secret-toggle]');
  const open1 = await page.locator('[data-testid=secret-body]').textContent();
  const label1 = await page.textContent('[data-testid=secret-toggle]');
  await page.screenshot({ path: join(shots, '05-gabarito-aberto.png'), fullPage: true });
  await page.click('[data-testid=secret-toggle]');
  const closedCount = await page.locator('[data-testid=secret-body]').count();
  const label2 = await page.textContent('[data-testid=secret-toggle]');
  await page.click('[data-testid=secret-toggle]');
  const open2 = await page.locator('[data-testid=secret-body]').count();
  check(6, 'O botão revela e oculta o gabarito corretamente', open1.includes(song.titulo) && label1.includes('OCULTAR') && closedCount === 0 && label2.includes('REVELAR') && open2 === 1);

  // 8. Pontuação correta (ano +1 dentro da tolerância de 1)
  const pts = await page.locator('[data-testid=eval-points]').first().textContent();
  await page.click('[data-testid=eval-confirm]');
  let t = await totals();
  check(8, 'Os pontos são calculados corretamente (música+artista+ano ±1 = 3)', pts.startsWith('3') && t['Equipe Roxa'] === 3, JSON.stringify(t));
  await page.screenshot({ path: join(shots, '06-avaliacao.png'), fullPage: true });

  // 12. Corrigir sem duplicar (desmarca e marca o ano várias vezes)
  for (let i = 0; i < 3; i++) { await page.click('[data-testid=check-ano]'); await page.click('[data-testid=check-ano]'); }
  await page.click('[data-testid=check-ano]');
  const afterUncheck = (await totals())['Equipe Roxa'];
  await page.click('[data-testid=check-ano]');
  const afterRecheck = (await totals())['Equipe Roxa'];

  // Próxima equipe (erra tudo)
  await page.click('[data-testid=btn-proximo]');
  await page.waitForFunction(() => document.querySelector('[data-testid=turn-banner]')?.textContent.includes('TIME DO CAOS'));
  const song2 = await curSong();
  const closedAgain = (await page.locator('[data-testid=secret-body]').count()) === 0;
  await page.fill('[data-testid=guess-ano]', '1800');
  await page.fill('[data-testid=guess-titulo]', 'Nada a ver');
  await page.fill('[data-testid=guess-artista]', 'Ninguém');
  await page.click('[data-testid=guess-submit]');
  await page.click('[data-testid=secret-toggle]');
  await page.click('[data-testid=eval-confirm]');
  // 3ª equipe sem palpite
  await page.click('[data-testid=btn-proximo]');
  await page.waitForFunction(() => document.querySelector('[data-testid=turn-banner]')?.textContent.includes('INIMIGOS'));
  const song3 = await curSong();
  await page.click('[data-testid=secret-toggle]');
  await page.click('[data-testid=eval-confirm]');
  // ajuste manual pelo histórico: Time do Caos ganha o ano (divergência legítima)
  await page.goto(BASE + '#/historico');
  await page.locator('.history__round').first().locator('tbody tr').nth(0).waitFor();
  const caosRow = page.locator('.history__turn').nth(1).locator('tbody tr').first();
  await caosRow.locator('.mini-check').nth(2).click();
  await caosRow.locator('.mini-check').nth(2).click();
  await caosRow.locator('.mini-check').nth(2).click();
  await page.screenshot({ path: join(shots, '07-historico.png'), fullPage: true });
  await page.goto(BASE + '#/jogo');
  await page.waitForSelector('[data-testid=round-card]');
  t = await totals();
  check(12, 'É possível corrigir pontuações sem duplicá-las', afterUncheck === 2 && afterRecheck === 3 && t['Time do Caos'] === 1 && t['Equipe Roxa'] === 3, JSON.stringify(t));
  check('5b', 'Gabarito fechado novamente ao começar novo turno', closedAgain);

  // Próxima rodada
  const nextLabel = await page.textContent('[data-testid=btn-proximo]');
  await page.click('[data-testid=btn-proximo]');
  await page.waitForFunction(() => document.querySelector('[data-testid=round-label]')?.textContent.includes('RODADA 2'));
  const song4 = await curSong();
  await page.fill('[data-testid=guess-ano]', String(song4.ano));
  await page.fill('[data-testid=guess-titulo]', song4.titulo);
  await page.fill('[data-testid=guess-artista]', 'errado demais');
  await page.click('[data-testid=guess-submit]');
  await page.click('[data-testid=secret-toggle]');
  await page.click('[data-testid=eval-confirm]');
  t = await totals();
  check(9, 'O placar acumula pontos de várias rodadas', nextLabel.includes('PRÓXIMA RODADA') && t['Equipe Roxa'] === 5, JSON.stringify(t));

  // 10. Recarregar preserva
  await page.reload();
  await page.waitForSelector('[data-testid=round-card]');
  const t2 = await totals();
  const label = await page.textContent('[data-testid=round-label]');
  check(10, 'Atualizar a página preserva a partida', JSON.stringify(t2) === JSON.stringify(t) && label.includes('RODADA 2'), label);

  // 11. Voltar e avançar
  await page.click('[data-testid=btn-anterior]');
  const backBanner = await page.textContent('[data-testid=turn-banner]');
  const backLabel = await page.textContent('[data-testid=round-label]');
  await page.click('[data-testid=btn-proximo]');
  const fwdLabel = await page.textContent('[data-testid=round-label]');
  const fwdBanner = await page.textContent('[data-testid=turn-banner]');
  check(11, 'Os botões de avançar e voltar funcionam', backLabel.includes('RODADA 1') && backBanner.includes('INIMIGOS') && fwdLabel.includes('RODADA 2') && fwdBanner.includes('ROXA'));

  // 13. Sem repetição
  const ids = (await state()).match.usedSongIds;
  check(13, 'Não repete músicas na mesma partida', new Set(ids).size === ids.length && new Set([song.id, song2.id, song3.id, song4.id]).size === 4, `${ids.length} músicas sorteadas, todas diferentes`);

  // TV: não mostra resposta até autorização
  const tv = await ctx.newPage();
  await tv.goto(BASE + '#/tv');
  await tv.waitForSelector('[data-testid=tv]');
  const tvText = norm(await tv.textContent('body'));
  await page.click('[data-testid=public-reveal]');
  await tv.waitForSelector('[data-testid=tv-answer]', { timeout: 5000 });
  const tvAns = await tv.textContent('[data-testid=tv-answer]');
  await tv.screenshot({ path: join(shots, '08-tv.png') });
  check('14b', 'Tela de TV só mostra a resposta quando o organizador autoriza', !tvText.includes(norm(song4.titulo)) && tvAns.includes(song4.titulo));
  await tv.close();

  // Placar: ajuste manual + exportar
  await page.click('[data-testid=go-placar]');
  await page.click('[data-testid=btn-corrigir]');
  await page.fill('[data-testid=adj-pontos]', '2');
  await page.click('[data-testid=adj-add]');
  await page.keyboard.press('Escape');
  const dl = page.waitForEvent('download');
  await page.click('[data-testid=btn-export-csv]');
  const file = await dl;
  t = await totals();
  check('9b', 'Ajuste avulso e exportação do placar funcionam', t['Equipe Roxa'] === 7 && file.suggestedFilename().endsWith('.csv'), JSON.stringify(t));
  await page.screenshot({ path: join(shots, '09-placar.png'), fullPage: true });

  // Encerrar → vitória
  await page.goto(BASE + '#/jogo');
  await page.click('[data-testid=btn-encerrar]');
  await page.click('[data-testid=confirm-ok]');
  await page.waitForSelector('[data-testid=winner]');
  const winner = await page.textContent('[data-testid=winner]');
  await page.screenshot({ path: join(shots, '10-vitoria.png'), fullPage: true });
  check('16', 'Tela de vitória destaca o 1º lugar', winner.includes('Equipe Roxa'), winner.trim());

  // Modo simultâneo: palpites ocultos entre equipes
  await page.goto(BASE + '#/nova');
  await page.getByRole('radio', { name: /Resposta simultânea/ }).click();
  await page.click('[data-testid=btn-iniciar]');
  await page.waitForSelector('[data-testid=guess-panel]');
  await page.fill('[data-testid=guess-ano]', '1999');
  await page.fill('[data-testid=guess-titulo]', 'Palpite Secreto Roxo');
  await page.fill('[data-testid=guess-artista]', 'Artista Secreto');
  await page.click('[data-testid=guess-submit]');
  const simBody = await page.textContent('body');
  await page.screenshot({ path: join(shots, '11-simultaneo.png'), fullPage: true });
  check('10b', 'Modo simultâneo: respostas ficam ocultas das outras equipes', !simBody.includes('Palpite Secreto Roxo') && simBody.includes('1 de 3 equipes'));

  // Admin: cadastrar música + importar JSON
  await page.goto(BASE + '#/admin');
  await page.click('[data-testid=song-new]');
  await page.fill('[data-testid=sf-titulo]', 'Música Teste');
  await page.fill('[data-testid=sf-artista]', 'Artista Teste');
  await page.fill('[data-testid=sf-ano]', '2001');
  await page.fill('[data-testid=sf-url]', 'https://open.spotify.com/intl-pt/track/4u7EnebtmKWzUH433cf5Qv?si=x');
  await page.click('[data-testid=sf-salvar]');
  const hasSong = (await state()).songs.some((s) => s.titulo === 'Música Teste' && s.spotifyUrl === 'https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv');
  await page.click('[data-testid=tab-importar]');
  await page.fill('[data-testid=import-text]', JSON.stringify([{ titulo: 'Importada', artista: 'Fulano', ano: 1990, spotifyUrl: 'https://open.spotify.com/track/0aym2LBJBk9DAYuHHutrIl' }, { titulo: 'Busca', artista: 'X', ano: 1990, spotifyUrl: 'https://open.spotify.com/search/x' }]));
  await page.click('[data-testid=import-analisar]');
  const importRes = await page.textContent('[data-testid=import-result]');
  await page.click('[data-testid=import-confirm]');
  const hasImported = (await state()).songs.some((s) => s.titulo === 'Importada');
  await page.click('[data-testid=tab-musicas]');
  await page.screenshot({ path: join(shots, '12-admin.png') });
  check('17', 'Área administrativa: cadastrar e importar (rejeitando links de busca)', hasSong && hasImported && importRes.includes('1 música(s) válida(s)') && importRes.includes('1 com erro'));

  // 15. Celular e computador
  const sizes = [[390, 844, 'celular'], [820, 1180, 'tablet'], [1440, 900, 'computador']];
  let okLayout = true; const det = [];
  for (const [w, h, nome] of sizes) {
    await page.setViewportSize({ width: w, height: h });
    for (const r of ['', '#/nova', '#/jogo', '#/placar', '#/admin']) {
      await page.goto(BASE + r);
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 1) { okLayout = false; det.push(`${nome} ${r || 'início'}: +${overflow}px`); }
    }
    await page.goto(BASE + '#/jogo');
    await page.screenshot({ path: join(shots, `13-jogo-${nome}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE);
  await page.screenshot({ path: join(shots, '14-inicio-celular.png') });
  check(15, 'Funciona em celular, tablet e computador (sem rolagem horizontal)', okLayout, det.join('; '));

  check('JS', 'Nenhum erro de JavaScript na página', errors.length === 0, errors.join(' | '));
} finally {
  await browser.close();
  server.kill();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} verificações aprovadas.`);
process.exit(failed.length ? 1 : 0);
