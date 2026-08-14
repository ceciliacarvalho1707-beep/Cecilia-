import { useState, type FormEvent } from 'react'
import { useAuth } from '../store/AuthProvider'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)

    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password)

    if (result.error) {
      setError(result.error)
    } else if (mode === 'signup') {
      setInfo('Conta criada. Se a confirmação por e-mail estiver ativa no projeto, verifique sua caixa de entrada antes de entrar.')
    }
    setBusy(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 text-[var(--color-ink)]">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mb-3 inline-flex size-12 items-center justify-center rounded-xl border border-[var(--color-gold-dim)]/50 bg-[var(--color-overlay)] text-2xl">
            🎲
          </span>
          <h1 className="font-serif-display text-2xl font-semibold text-[var(--color-ink)]">Meu Universo</h1>
          <p className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)]">Bíblia do Universo</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-raised)] p-6 shadow-[var(--shadow-panel)]">
          <div className="mb-5 flex rounded-lg border border-[var(--color-border-soft)] p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-md py-1.5 transition ${mode === 'signin' ? 'bg-[var(--color-overlay)] text-[var(--color-gold-soft)]' : 'text-[var(--color-ink-faint)]'}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-md py-1.5 transition ${mode === 'signup' ? 'bg-[var(--color-overlay)] text-[var(--color-gold-soft)]' : 'text-[var(--color-ink-faint)]'}`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-[var(--color-ink-muted)]">E-mail</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-gold-dim)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--color-ink-muted)]">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-gold-dim)]"
              />
            </div>

            {error && <p className="text-xs text-[var(--color-status-secret)]">{error}</p>}
            {info && <p className="text-xs text-[var(--color-status-public)]">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[var(--color-gold-dim)] py-2 text-sm font-medium text-[var(--color-void)] transition hover:bg-[var(--color-gold)] disabled:opacity-50"
            >
              {busy ? 'Um momento...' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--color-ink-faint)]">
          {mode === 'signin' ? 'Ainda não tem conta? Use "Criar conta" acima.' : 'O primeiro acesso já cria seu universo automaticamente.'}
        </p>
      </div>
    </div>
  )
}
