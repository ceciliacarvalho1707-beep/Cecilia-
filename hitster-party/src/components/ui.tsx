import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Dificuldade, DificuldadeConfig, Team } from '../types';
import { navigate, type Route } from '../router';

export const DIF_LABEL: Record<DificuldadeConfig, string> = {
  facil: 'Fácil', media: 'Média', dificil: 'Difícil', muito_dificil: 'Muito difícil', aleatoria: 'Aleatória',
};
const DIF_LEVEL: Record<Dificuldade, number> = { facil: 1, media: 2, dificil: 3, muito_dificil: 4 };

export function DifficultyBadge({ value }: { value: Dificuldade }) {
  const lvl = DIF_LEVEL[value];
  return (
    <span className={`dif dif--${value}`} title={`Dificuldade: ${DIF_LABEL[value]}`}>
      <span className="dif__bars" aria-hidden>{[1, 2, 3, 4].map((i) => <i key={i} className={i <= lvl ? 'on' : ''} />)}</span>
      {DIF_LABEL[value]}
    </span>
  );
}

export function TeamChip({ team, size = 'md', extra }: { team: Team; size?: 'sm' | 'md' | 'lg'; extra?: ReactNode }) {
  return (
    <span className={`team-chip team-chip--${size}`} style={{ ['--team' as string]: team.cor }}>
      <span className="team-chip__avatar">{team.emoji || team.nome.slice(0, 1)}</span>
      <span className="team-chip__name">{team.nome}</span>
      {extra}
    </span>
  );
}

/** Logo com disco de vinil animado. */
export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={`logo logo--${size}`}>
      <Vinyl small={size !== 'lg'} />
      <div className="logo__text">
        <span className="logo__hitster">HITSTER</span>
        <span className="logo__party">PARTY</span>
      </div>
    </div>
  );
}

export function Vinyl({ small, spinning = true }: { small?: boolean; spinning?: boolean }) {
  return (
    <div className={`vinyl ${small ? 'vinyl--sm' : ''} ${spinning ? 'vinyl--spin' : ''}`} aria-hidden>
      <div className="vinyl__label" />
    </div>
  );
}

export function Equalizer({ bars = 5 }: { bars?: number }) {
  return <span className="eq" aria-hidden>{Array.from({ length: bars }, (_, i) => <i key={i} style={{ animationDelay: `${i * 0.13}s` }} />)}</span>;
}

export function TopBar({ title, back = 'home', right }: { title?: string; back?: Route | null; right?: ReactNode }) {
  return (
    <header className="topbar">
      {back ? <button className="btn btn--ghost btn--sm" onClick={() => navigate(back)}>← {back === 'home' ? 'Início' : 'Voltar'}</button> : <span />}
      <button className="topbar__logo" onClick={() => navigate('home')} aria-label="Ir para o início"><Logo size="sm" /></button>
      <div className="topbar__right">{right}</div>
      {title && <h1 className="topbar__title">{title}</h1>}
    </header>
  );
}

export function Toggle({ checked, onChange, label, testId }: { checked: boolean; onChange: (v: boolean) => void; label: string; testId?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={`toggle ${checked ? 'toggle--on' : ''}`} onClick={() => onChange(!checked)} data-testid={testId}>
      <span className="toggle__track"><span className="toggle__thumb" /></span>
      <span>{label}</span>
    </button>
  );
}

/** Grupo de opções em formato de "pílulas" (radio). */
export function Segmented<T extends string | number>({ options, value, onChange, name }: { options: { value: T; label: ReactNode; hint?: string }[]; value: T; onChange: (v: T) => void; name: string }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value} className={`segmented__opt ${value === o.value ? 'is-active' : ''}`} onClick={() => onChange(o.value)} title={o.hint}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Redireciona após a renderização (evita efeitos colaterais durante o render). */
export function Redirect({ to }: { to: Route }) {
  useEffect(() => { navigate(to); }, [to]);
  return null;
}
