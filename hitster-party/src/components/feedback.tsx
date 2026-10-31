import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

/* ───────────── Modal genérico (acessível: Esc fecha, foco inicial) ───────────── */

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? 'modal--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal__head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

/* ───────────── Confirmação (Promise) e Toasts ───────────── */

interface ConfirmOpts { titulo: string; mensagem: string; confirmar?: string; perigo?: boolean }
interface Toast { id: number; texto: string; tipo: 'ok' | 'erro' | 'info' }
interface Ctx { confirm: (o: ConfirmOpts) => Promise<boolean>; toast: (texto: string, tipo?: Toast['tipo']) => void }

const FeedbackCtx = createContext<Ctx | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setPending({ ...o, resolve })), []);
  const toast = useCallback((texto: string, tipo: Toast['tipo'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, texto, tipo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const close = (v: boolean) => { pending?.resolve(v); setPending(null); };

  return (
    <FeedbackCtx.Provider value={{ confirm, toast }}>
      {children}
      <Modal open={!!pending} onClose={() => close(false)} title={pending?.titulo ?? ''}>
        <p className="muted" style={{ marginTop: 0 }}>{pending?.mensagem}</p>
        <div className="row row--end">
          <button className="btn btn--ghost" onClick={() => close(false)}>Cancelar</button>
          <button className={`btn ${pending?.perigo ? 'btn--danger' : 'btn--primary'}`} onClick={() => close(true)} data-testid="confirm-ok">
            {pending?.confirmar ?? 'Confirmar'}
          </button>
        </div>
      </Modal>
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast toast--${t.tipo}`}>{t.texto}</div>)}
      </div>
    </FeedbackCtx.Provider>
  );
}

export function useFeedback(): Ctx {
  const c = useContext(FeedbackCtx);
  if (!c) throw new Error('FeedbackProvider ausente');
  return c;
}
