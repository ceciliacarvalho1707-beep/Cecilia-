import { useMemo, useState } from 'react';
import { useFeedback } from '../components/feedback';
import { DIF_LABEL, Segmented, TopBar } from '../components/ui';
import { filterPool } from '../lib/selection';
import { navigate } from '../router';
import { matchActions, teamActions, TEAM_COLORS, TEAM_EMOJIS, useAppState } from '../store/store';
import type { DificuldadeConfig, FiltroIdioma, ModoJogo, Tolerancia } from '../types';

type Qtd = 10 | 20 | 30 | 'custom' | 'infinito';

export function Setup() {
  const teams = useAppState((s) => s.draftTeams);
  const songs = useAppState((s) => s.songs);
  const settings = useAppState((s) => s.settings);
  const existing = useAppState((s) => s.match);
  const { toast, confirm } = useFeedback();

  const [idioma, setIdioma] = useState<FiltroIdioma>('todas');
  const [dificuldade, setDificuldade] = useState<DificuldadeConfig>('aleatoria');
  const [qtd, setQtd] = useState<Qtd>(10);
  const [custom, setCustom] = useState('15');
  const [modo, setModo] = useState<ModoJogo>('turno');
  const [tolerancia, setTolerancia] = useState<Tolerancia>(settings.toleranciaPadrao);
  const [editing, setEditing] = useState<string | null>(null);

  const pool = useMemo(() => filterPool(songs, idioma, dificuldade).length, [songs, idioma, dificuldade]);
  const totalRodadas = qtd === 'infinito' ? null : qtd === 'custom' ? Math.max(1, Math.min(500, parseInt(custom, 10) || 0)) : qtd;
  const musicasNecessarias = totalRodadas === null ? null : totalRodadas * (modo === 'turno' ? teams.length : 1);

  const iniciar = async () => {
    if (teams.some((t) => !t.nome.trim())) { toast('Dê um nome para todas as equipes.', 'erro'); return; }
    if (qtd === 'custom' && !(parseInt(custom, 10) > 0)) { toast('Informe uma quantidade de rodadas válida.', 'erro'); return; }
    if (existing && existing.status === 'em_andamento') {
      const ok = await confirm({ titulo: 'Substituir a partida atual?', mensagem: 'Já existe uma partida em andamento. Ela será encerrada e guardada no histórico antes de começar a nova.', confirmar: 'Começar nova partida', perigo: true });
      if (!ok) return;
    }
    const r = matchActions.start({ idioma, dificuldade, totalRodadas, modo, tolerancia });
    if (!r.ok) { toast(r.erro, 'erro'); return; }
    toast('Partida iniciada! Boa sorte 🎶');
    navigate('jogo');
  };

  return (
    <main className="page">
      <TopBar />
      <h1 className="page__title">Configurar partida</h1>

      <section className="card">
        <h2 className="card__title">👥 Equipes <span className="pill">{teams.length}/12</span></h2>
        <p className="muted small">A ordem da lista é a ordem dos turnos. Use as setas para reordenar.</p>
        <ul className="team-list" data-testid="team-list">
          {teams.map((t, i) => (
            <li key={t.id} className="team-row" style={{ ['--team' as string]: t.cor }}>
              <span className="team-row__order">{i + 1}</span>
              <button className="team-row__avatar" onClick={() => setEditing(editing === t.id ? null : t.id)} aria-label={`Escolher cor e emoji de ${t.nome}`}>{t.emoji}</button>
              <input className="team-row__name" value={t.nome} maxLength={32} onChange={(e) => teamActions.update(t.id, { nome: e.target.value })} aria-label={`Nome da equipe ${i + 1}`} data-testid="team-name" />
              <div className="team-row__actions">
                <button className="icon-btn" onClick={() => teamActions.move(t.id, -1)} disabled={i === 0} aria-label="Subir">▲</button>
                <button className="icon-btn" onClick={() => teamActions.move(t.id, 1)} disabled={i === teams.length - 1} aria-label="Descer">▼</button>
                <button className="icon-btn icon-btn--danger" onClick={() => { const r = teamActions.remove(t.id); if (!r.ok) toast(r.erro, 'erro'); }} aria-label={`Remover ${t.nome}`} data-testid="team-remove">🗑</button>
              </div>
              {editing === t.id && (
                <div className="team-row__picker">
                  <div className="swatches">{TEAM_COLORS.map((c) => <button key={c} className={`swatch ${t.cor === c ? 'is-active' : ''}`} style={{ background: c }} onClick={() => teamActions.update(t.id, { cor: c })} aria-label={`Cor ${c}`} />)}</div>
                  <div className="emojis">
                    {TEAM_EMOJIS.map((em) => <button key={em} className={`emoji ${t.emoji === em ? 'is-active' : ''}`} onClick={() => teamActions.update(t.id, { emoji: em })}>{em}</button>)}
                    <input className="emoji-input" maxLength={4} placeholder="✏️" aria-label="Emoji personalizado" onChange={(e) => e.target.value && teamActions.update(t.id, { emoji: e.target.value })} />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="row">
          <button className="btn btn--ghost" onClick={() => { const r = teamActions.add(); if (!r.ok) toast(r.erro, 'erro'); }} disabled={teams.length >= 12} data-testid="team-add">+ Adicionar equipe</button>
          <button className="btn btn--ghost" onClick={() => teamActions.shuffle()}>🔀 Sortear ordem</button>
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">🌎 Idioma das músicas</h2>
        <Segmented name="Idioma" value={idioma} onChange={setIdioma} options={[
          { value: 'todas', label: 'Brasileiras e internacionais' }, { value: 'br', label: '🇧🇷 Somente brasileiras' }, { value: 'intl', label: '🌍 Somente internacionais' },
        ]} />
        <h2 className="card__title">🕰️ Época</h2>
        <p className="muted small" style={{ marginTop: 0 }}>Qualquer ano, sem limites: o sorteio vai de gravações históricas (1917, no banco de exemplo) a lançamentos atuais, sem fatiar por décadas.</p>
        <h2 className="card__title">🎚️ Dificuldade</h2>
        <Segmented name="Dificuldade" value={dificuldade} onChange={setDificuldade} options={(['facil', 'media', 'dificil', 'muito_dificil', 'aleatoria'] as DificuldadeConfig[]).map((d) => ({ value: d, label: DIF_LABEL[d] }))} />
        <p className={`small ${pool < 5 ? 'warn' : 'muted'}`} data-testid="pool-info">
          {pool} música{pool === 1 ? '' : 's'} disponíve{pool === 1 ? 'l' : 'is'} com estes filtros.
          {musicasNecessarias !== null && musicasNecessarias > pool && ' Como a partida precisa de mais músicas do que isso, o sorteio vai usar outras dificuldades e, só se o banco acabar, repetir músicas.'}
        </p>
      </section>

      <section className="card">
        <h2 className="card__title">🔢 Quantidade de rodadas</h2>
        <Segmented name="Rodadas" value={qtd} onChange={setQtd} options={[
          { value: 10, label: '10' }, { value: 20, label: '20' }, { value: 30, label: '30' }, { value: 'custom', label: 'Personalizada' }, { value: 'infinito', label: '∞ Infinito' },
        ]} />
        {qtd === 'custom' && <label className="field field--inline"><span>Rodadas:</span><input type="number" min={1} max={500} value={custom} onChange={(e) => setCustom(e.target.value)} data-testid="custom-rounds" /></label>}

        <h2 className="card__title">🎯 Modo de jogo</h2>
        <Segmented name="Modo" value={modo} onChange={setModo} options={[
          { value: 'turno', label: '1 · Turno por equipe', hint: 'Cada equipe ouve uma música diferente na sua vez.' },
          { value: 'simultaneo', label: '2 · Resposta simultânea', hint: 'Todas as equipes respondem a mesma música antes do gabarito.' },
        ]} />
        <p className="muted small">{modo === 'turno' ? 'Cada equipe ouve a sua própria música, na ordem definida. Depois que todas jogarem, começa a próxima rodada.' : 'Todas as equipes ouvem a mesma música e registram os palpites, que ficam ocultos até o gabarito ser revelado.'}</p>

        <h2 className="card__title">📅 Tolerância do ano</h2>
        <Segmented name="Tolerância" value={tolerancia} onChange={setTolerancia} options={[
          { value: 0, label: 'Ano exato' }, { value: 1, label: '± 1 ano' }, { value: 2, label: '± 2 anos' }, { value: 5, label: '± 5 anos' },
        ]} />
        <p className="muted small">Pontuação: música certa +1 · artista, banda ou musical certo +1 · ano dentro da tolerância +1.</p>
      </section>

      <div className="sticky-cta">
        <button className="btn btn--hero" onClick={iniciar} data-testid="btn-iniciar">🚀 COMEÇAR PARTIDA</button>
      </div>
    </main>
  );
}
