import { useState } from 'react';
import { useFeedback } from '../components/feedback';
import { Segmented, Toggle, TopBar } from '../components/ui';
import { navigate } from '../router';
import { hashPin, settingsActions, useAppState } from '../store/store';
import type { Tolerancia } from '../types';

export function SettingsScreen() {
  const settings = useAppState((s) => s.settings);
  const { confirm, toast } = useFeedback();
  const [pin, setPin] = useState('');

  return (
    <main className="page">
      <TopBar />
      <h1 className="page__title">⚙️ Configurações</h1>

      <section className="card">
        <h2 className="card__title">📅 Tolerância padrão do ano</h2>
        <p className="muted small">Usada como padrão ao criar partidas. A tolerância da partida atual pode ser ajustada na área do organizador.</p>
        <Segmented name="Tolerância padrão" value={settings.toleranciaPadrao} onChange={(v: Tolerancia) => settingsActions.update({ toleranciaPadrao: v })} options={[
          { value: 0, label: 'Ano exato' }, { value: 1, label: '± 1 ano (padrão)' }, { value: 2, label: '± 2 anos' }, { value: 5, label: '± 5 anos' },
        ]} />
      </section>

      <section className="card">
        <h2 className="card__title">🎧 Spotify</h2>
        <Segmented name="Como abrir" value={settings.spotifyModo} onChange={(v) => settingsActions.update({ spotifyModo: v })} options={[
          { value: 'web', label: 'Link web (abre o app se instalado)' }, { value: 'app', label: 'Abrir direto no aplicativo' },
        ]} />
        <div className="stack" style={{ marginTop: 12 }}>
          <Toggle checked={settings.mostrarAvisoSpotify} onChange={(v) => settingsActions.update({ mostrarAvisoSpotify: v })} label="Avisar o organizador para esconder a tela do Spotify" />
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">✨ Aparência</h2>
        <Toggle checked={settings.reduzirAnimacoes} onChange={(v) => settingsActions.update({ reduzirAnimacoes: v })} label="Reduzir animações" />
      </section>

      <section className="card">
        <h2 className="card__title">🔑 PIN do organizador</h2>
        <p className="muted small">Opcional. Protege a área do organizador (banco de músicas e gabaritos) contra acesso casual dos convidados. {settings.pinHash ? 'Um PIN está ativo.' : 'Nenhum PIN definido.'}</p>
        <form className="row" onSubmit={async (e) => {
          e.preventDefault();
          if (!/^\d{4,8}$/.test(pin)) { toast('O PIN deve ter de 4 a 8 números.', 'erro'); return; }
          settingsActions.update({ pinHash: await hashPin(pin) }); setPin(''); toast('PIN definido.');
        }}>
          <input className="input" type="password" inputMode="numeric" placeholder="Novo PIN (4 a 8 números)" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} maxLength={8} />
          <button className="btn btn--primary" type="submit">Salvar PIN</button>
          {settings.pinHash && <button type="button" className="btn btn--ghost" onClick={() => { settingsActions.update({ pinHash: undefined }); toast('PIN removido.'); }}>Remover PIN</button>}
        </form>
      </section>

      <section className="card">
        <h2 className="card__title">🛠️ Organizador e dados</h2>
        <div className="row">
          <button className="btn btn--ghost" onClick={() => navigate('admin')}>Abrir área do organizador</button>
          <button className="btn btn--danger-ghost" onClick={async () => {
            const ok = await confirm({ titulo: 'Apagar TODOS os dados?', mensagem: 'Partida atual, histórico, equipes, configurações e músicas cadastradas serão apagados. O banco de demonstração será restaurado.', confirmar: 'Apagar tudo', perigo: true });
            if (ok) { settingsActions.resetAll(); toast('Dados apagados.'); navigate('home'); }
          }}>Apagar todos os dados</button>
        </div>
        <p className="muted small">Os dados ficam salvos apenas neste navegador (localStorage).</p>
      </section>
    </main>
  );
}
