import { useEffect, useState } from 'react';
import { useFeedback } from '../components/feedback';
import { usePublicState } from '../components/sync';
import { Equalizer, Logo, Vinyl } from '../components/ui';
import { deviceId, getTransport } from '../lib/sync';
import { navigate } from '../router';
import { PublicBoard } from './Tv';

const TEAM_KEY = 'hitster-party:minha-equipe';
const SENT_KEY = 'hitster-party:enviado';

function remember(key: string, value?: string): string | null {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value); return value;
  } catch { return null; }
}

/**
 * CELULAR DA EQUIPE — escolhe a equipe e manda o palpite para o organizador.
 * Não recebe a resposta nem os palpites das outras equipes.
 */
export function Equipe() {
  const { state, carregando, kind } = usePublicState();
  const { toast } = useFeedback();
  const [teamId, setTeamId] = useState<string | null>(() => remember(TEAM_KEY));
  const [form, setForm] = useState({ ano: '', titulo: '', artista: '' });
  const [enviando, setEnviando] = useState(false);
  const [enviadoTurno, setEnviadoTurno] = useState<string | null>(() => remember(SENT_KEY));

  const team = state?.equipes?.find((t) => t.id === teamId) ?? null;
  const turnId = state?.turnId ?? '';
  const minhaVez = !!team && (state?.modo === 'simultaneo' || state?.vez?.some((t) => t.id === team.id));
  const jaEnviou = enviadoTurno === `${turnId}:${teamId}` || (!!teamId && !!state?.respondeu?.includes(teamId));
  const travado = !!state?.gabaritoAberto;

  useEffect(() => { setForm({ ano: '', titulo: '', artista: '' }); }, [turnId]);

  const sair = <button className="btn btn--ghost btn--sm" onClick={() => navigate('home')}>← Início</button>;

  if (!state || state.status === 'sem_partida') {
    return (
      <main className="page equipe">
        <div className="row">{sair}</div>
        <div className="empty"><Vinyl /><h2>{carregando ? 'Conectando…' : 'A partida ainda não começou'}</h2>
          <p className="muted">{kind === 'nuvem' ? 'Assim que o organizador começar, esta tela mostra as equipes.' : 'Modo local: este celular só acompanha o jogo se estiver no mesmo navegador do organizador. Para usar celulares separados, abra a versão publicada no claude.ai.'}</p>
        </div>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="page equipe">
        <div className="row">{sair}</div>
        <h1 className="page__title">Qual é a sua equipe?</h1>
        <div className="equipe__pick">
          {(state.equipes ?? []).map((t) => (
            <button key={t.id} className="equipe__team" style={{ ['--team' as string]: t.cor }} onClick={() => setTeamId(remember(TEAM_KEY, t.id))} data-testid="pick-team">
              <span className="equipe__emoji">{t.emoji}</span>{t.nome}
            </button>
          ))}
        </div>
      </main>
    );
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ano.trim() && !form.titulo.trim() && !form.artista.trim()) { toast('Escreva pelo menos um palpite.', 'erro'); return; }
    setEnviando(true);
    try {
      const t = await getTransport();
      await t.sendGuess({ turnId, teamId: team.id, ano: form.ano.trim(), titulo: form.titulo.trim(), artista: form.artista.trim(), em: new Date().toISOString(), aparelho: deviceId() });
      setEnviadoTurno(remember(SENT_KEY, `${turnId}:${team.id}`));
      toast('Palpite enviado! Agora é torcer 🤞');
    } catch (err) {
      toast((err as Error).message || 'Não deu para enviar. Tente de novo.', 'erro');
    } finally { setEnviando(false); }
  };

  return (
    <main className="page equipe" style={{ ['--team' as string]: team.cor }}>
      <div className="row equipe__top">
        {sair}
        <Logo size="sm" />
        <button className="link-btn" onClick={() => { setTeamId(null); try { localStorage.removeItem(TEAM_KEY); } catch { /* ok */ } }}>Trocar equipe</button>
      </div>
      <div className="equipe__badge"><span className="equipe__emoji">{team.emoji}</span><strong>{team.nome}</strong></div>

      {state.status === 'encerrada' ? (
        <section className="card"><h2 className="card__title">🏁 Fim de jogo!</h2><PublicBoard placar={state.placar ?? []} compact /></section>
      ) : (
        <>
          <p className="equipe__round">Rodada {state.rodada}{state.totalRodadas ? ` de ${state.totalRodadas}` : ''} · Categoria: <strong>{state.categoria}</strong></p>
          {state.resposta && (
            <div className="tv__answer"><span className="muted">A música era…</span><strong>{state.resposta.titulo}</strong><span>{state.resposta.musical ? `${state.resposta.musical} · ` : ''}{state.resposta.artista} · {state.resposta.ano}</span></div>
          )}
          {!minhaVez ? (
            <section className="card center"><h2>Agora é a vez da {state.vez?.[0]?.nome ?? 'outra equipe'} {state.vez?.[0]?.emoji}</h2><p className="muted">Fiquem de olho na TV. Quando chegar a vez de vocês, o formulário aparece aqui. <Equalizer /></p></section>
          ) : travado ? (
            <section className="card center"><h2>🔐 Palpites encerrados</h2><p className="muted">O organizador já abriu o gabarito desta música.</p></section>
          ) : jaEnviou ? (
            <section className="card center" data-testid="equipe-enviado"><h2>✔ Palpite enviado!</h2><p className="muted">Ele fica escondido das outras equipes até a revelação.</p>
              <button className="btn btn--ghost" onClick={() => setEnviadoTurno(null)}>Mudar o palpite</button></section>
          ) : (
            <form className="card guess__form equipe__form" onSubmit={enviar} autoComplete="off">
              <h2 className="section-title">🎤 É a vez de vocês!</h2>
              <label className="field"><span>Ano de lançamento</span><input inputMode="numeric" maxLength={4} placeholder="Ex.: 1985" value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value.replace(/\D/g, '') })} data-testid="eq-ano" /></label>
              <label className="field"><span>Nome da música</span><input placeholder="Como vocês acham que ela se chama?" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} data-testid="eq-titulo" /></label>
              <label className="field"><span>Quem canta (ou o musical)</span><input placeholder="Artista, banda ou musical" value={form.artista} onChange={(e) => setForm({ ...form, artista: e.target.value })} data-testid="eq-artista" /></label>
              <button className="btn btn--primary btn--xl" type="submit" disabled={enviando} data-testid="eq-enviar">{enviando ? 'Enviando…' : 'ENVIAR PALPITE'}</button>
            </form>
          )}
          <section className="card"><h3 className="section-title">🏆 Placar</h3><PublicBoard placar={state.placar ?? []} compact /></section>
        </>
      )}
    </main>
  );
}
