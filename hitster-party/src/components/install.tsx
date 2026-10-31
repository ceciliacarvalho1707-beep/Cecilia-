import { useState } from 'react';
import { isIOS, useInstall } from '../lib/app';
import { useFeedback } from './feedback';

/** Convite para instalar o jogo como app no celular. Some quando já está instalado. */
export function InstallCard() {
  const { instalado, podeInstalar, dentroDoClaude, instalar } = useInstall();
  const { toast } = useFeedback();
  const [ajuda, setAjuda] = useState(false);
  if (instalado) return null;

  return (
    <section className="install" aria-label="Instalar o app">
      <img src="./icons/icon-192.png" alt="" width={48} height={48} className="install__icon" />
      <div className="install__text">
        <strong>Tenha o Hitster como app no celular</strong>
        <span className="muted small">Ícone na tela inicial, tela cheia, funciona sem internet e a tela não apaga durante o jogo.</span>
      </div>
      {podeInstalar ? (
        <button className="btn btn--primary btn--sm" onClick={async () => { if (await instalar()) toast('App instalado! Procure o ícone na tela inicial.'); }} data-testid="btn-instalar">📲 Instalar</button>
      ) : (
        <button className="btn btn--ghost btn--sm" onClick={() => setAjuda(!ajuda)} data-testid="btn-instalar-ajuda">📲 Como instalar</button>
      )}
      {ajuda && (
        <div className="install__help small">
          {dentroDoClaude ? (
            <p>Esta versão roda dentro do claude.ai, que não permite instalar como app. Abra o endereço do app publicado (veja o README do projeto) e instale por lá. Se quiser só um atalho, use o menu do navegador e escolha <b>Adicionar à tela inicial</b>.</p>
          ) : isIOS() ? (
            <ol className="list"><li>Abra este endereço no <b>Safari</b>.</li><li>Toque em <b>Compartilhar</b> (o quadrado com a seta para cima).</li><li>Escolha <b>Adicionar à Tela de Início</b> e confirme.</li></ol>
          ) : (
            <ol className="list"><li>No <b>Chrome</b>, toque no menu <b>⋮</b>.</li><li>Escolha <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).</li><li>Confirme. O ícone aparece junto dos outros apps.</li></ol>
          )}
        </div>
      )}
    </section>
  );
}
