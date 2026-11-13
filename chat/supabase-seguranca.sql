-- ============================================================================
-- Atualização 5: bloquear, privacidade, recuperar a conta e status (24 horas)
-- Como usar: Supabase → SQL Editor → New query → colar tudo → Run.
-- ============================================================================

-- ── Privacidade do perfil ───────────────────────────────────────────────────
alter table public.perfis add column if not exists visivel text not null default 'todos'
  check (visivel in ('todos', 'amigas'));                    -- quem vê foto, bio e humor
alter table public.perfis add column if not exists mostra_online boolean not null default true;
alter table public.perfis add column if not exists mostra_lido   boolean not null default true;

-- ── Bloqueios ───────────────────────────────────────────────────────────────
create table if not exists public.bloqueios (
  quem       uuid not null references public.perfis(id) on delete cascade,
  bloqueado  uuid not null references public.perfis(id) on delete cascade,
  criado     timestamptz not null default now(),
  primary key (quem, bloqueado)
);
alter table public.bloqueios enable row level security;
drop policy if exists "meus bloqueios" on public.bloqueios;
create policy "meus bloqueios" on public.bloqueios for all to authenticated
  using (quem = auth.uid()) with check (quem = auth.uid());
grant select, insert, delete on public.bloqueios to authenticated;

create or replace function public.bloqueio_entre(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bloqueios where (quem = a and bloqueado = b) or (quem = b and bloqueado = a))
$$;
create or replace function public.sao_amigas(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.amizades where aceita and ((de = a and para = b) or (de = b and para = a)))
$$;
create or replace function public.tem_amizade(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.amizades where (de = a and para = b) or (de = b and para = a))
$$;
grant execute on function public.bloqueio_entre(uuid, uuid), public.sao_amigas(uuid, uuid), public.tem_amizade(uuid, uuid) to authenticated;

-- O perfil completo só para mim e para quem tem amizade (ou pedido) comigo, sem bloqueio.
-- Os outros veem pelas funções abaixo, que escondem foto, bio e humor de quem escolheu "só amigas".
drop policy if exists "ver perfis" on public.perfis;
create policy "ver perfis" on public.perfis for select to authenticated
  using (id = auth.uid() or (public.tem_amizade(auth.uid(), id) and not public.bloqueio_entre(auth.uid(), id)));

create or replace function public.buscar_perfis(q text)
returns table (id uuid, usuario text, nome text, foto text, bio text, humor text)
language sql stable security definer set search_path = public as $$
  select p.id, p.usuario, p.nome,
         case when p.visivel = 'todos' or public.sao_amigas(auth.uid(), p.id) then p.foto end,
         case when p.visivel = 'todos' or public.sao_amigas(auth.uid(), p.id) then p.bio else '' end,
         case when p.visivel = 'todos' or public.sao_amigas(auth.uid(), p.id) then p.humor else '' end
    from public.perfis p
   where auth.uid() is not null and p.id <> auth.uid()
     and not public.bloqueio_entre(auth.uid(), p.id)
     and char_length(q) >= 2
     and (p.usuario ilike lower(q) || '%' or p.nome ilike '%' || q || '%')
   order by (p.usuario = lower(q)) desc, p.usuario
   limit 10
$$;
create or replace function public.ver_perfil(alvo uuid)
returns table (id uuid, usuario text, nome text, foto text, bio text, humor text)
language sql stable security definer set search_path = public as $$
  select p.id, p.usuario, p.nome,
         case when p.visivel = 'todos' or p.id = auth.uid() or public.sao_amigas(auth.uid(), p.id) then p.foto end,
         case when p.visivel = 'todos' or p.id = auth.uid() or public.sao_amigas(auth.uid(), p.id) then p.bio else '' end,
         case when p.visivel = 'todos' or p.id = auth.uid() or public.sao_amigas(auth.uid(), p.id) then p.humor else '' end
    from public.perfis p
   where auth.uid() is not null and p.id = alvo and not public.bloqueio_entre(auth.uid(), p.id)
$$;
grant execute on function public.buscar_perfis(text), public.ver_perfil(uuid) to authenticated;

-- Quem está bloqueada não manda pedido de amizade nem abre conversa
drop policy if exists "pedir amizade" on public.amizades;
create policy "pedir amizade" on public.amizades for insert to authenticated
  with check (de = auth.uid() and not aceita and not public.bloqueio_entre(de, para));

create or replace function public.abrir_conversa(amiga uuid) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare s text; codigo text;
begin
  if public.bloqueio_entre(auth.uid(), amiga) or not public.sao_amigas(auth.uid(), amiga) then
    raise exception 'vocês ainda não são amigas';
  end if;
  select senha into s from public.minhas_conversas
   where usuario = auth.uid() and com = amiga and not grupo and senha is not null limit 1;
  if s is not null then return s; end if;
  select senha into s from public.minhas_conversas
   where usuario = amiga and com = auth.uid() and not grupo and senha is not null limit 1;
  if s is null then s := encode(gen_random_bytes(12), 'hex'); end if;
  codigo := encode(digest(convert_to('nosso-cantinho|' || s, 'UTF8'), 'sha256'), 'hex');
  insert into public.minhas_conversas (usuario, sala, senha, com) values (auth.uid(), codigo, s, amiga)
    on conflict (usuario, sala) do update set senha = excluded.senha, com = excluded.com;
  insert into public.minhas_conversas (usuario, sala, senha, com) values (amiga, codigo, s, auth.uid())
    on conflict (usuario, sala) do nothing;
  return s;
end $$;

create or replace function public.adicionar_na_conversa(p_sala text, amiga uuid) returns void
language plpgsql security definer set search_path = public as $$
declare minha public.minhas_conversas;
begin
  select * into minha from public.minhas_conversas where usuario = auth.uid() and sala = p_sala;
  if not found or minha.senha is null then raise exception 'conversa não encontrada'; end if;
  if public.bloqueio_entre(auth.uid(), amiga) or not public.sao_amigas(auth.uid(), amiga) then
    raise exception 'vocês ainda não são amigas';
  end if;
  insert into public.minhas_conversas (usuario, sala, senha, titulo, grupo)
    values (amiga, p_sala, minha.senha, minha.titulo, minha.grupo)
    on conflict (usuario, sala) do nothing;
end $$;

-- ── Recuperar a conta com um código (sem e-mail) ────────────────────────────
create table if not exists public.recuperacao (
  usuario     uuid primary key references auth.users(id) on delete cascade,
  codigo      text not null,            -- guardado embaralhado (bcrypt), nunca o código em si
  tentativas  int not null default 0,
  atualizado  timestamptz not null default now()
);
alter table public.recuperacao enable row level security;   -- sem regras: só pelas funções

create or replace function public.guardar_codigo(p_codigo text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null or char_length(p_codigo) < 12 then raise exception 'código inválido'; end if;
  insert into public.recuperacao (usuario, codigo) values (auth.uid(), crypt(p_codigo, gen_salt('bf')))
    on conflict (usuario) do update set codigo = excluded.codigo, tentativas = 0, atualizado = now();
end $$;
grant execute on function public.guardar_codigo(text) to authenticated;

create or replace function public.tem_codigo() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.recuperacao where usuario = auth.uid())
$$;
grant execute on function public.tem_codigo() to authenticated;

create or replace function public.recuperar_conta(p_usuario text, p_codigo text, p_senha text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid; r public.recuperacao;
begin
  if char_length(p_senha) < 6 then raise exception 'senha curta'; end if;
  select id into uid from auth.users where email = lower(p_usuario) || '@nossocantinho.app';
  if uid is null then return false; end if;
  select * into r from public.recuperacao where usuario = uid for update;
  if not found then return false; end if;
  if r.tentativas >= 10 and r.atualizado > now() - interval '1 hour' then raise exception 'muitas tentativas'; end if;
  if r.codigo <> crypt(p_codigo, r.codigo) then
    update public.recuperacao set tentativas = tentativas + 1, atualizado = now() where usuario = uid;
    return false;
  end if;
  update auth.users set encrypted_password = crypt(p_senha, gen_salt('bf')), updated_at = now() where id = uid;
  update public.recuperacao set tentativas = 0, atualizado = now() where usuario = uid;
  return true;
end $$;
grant execute on function public.recuperar_conta(text, text, text) to anon, authenticated;

-- ── Status (some em 24 horas) ───────────────────────────────────────────────
create table if not exists public.status (
  id       uuid primary key default gen_random_uuid(),
  usuario  uuid not null default auth.uid() references public.perfis(id) on delete cascade,
  texto    text not null default '' check (char_length(texto) <= 300),
  foto     text check (foto is null or char_length(foto) <= 200),
  cor      int not null default 0,
  criado   timestamptz not null default now(),
  expira   timestamptz not null default now() + interval '24 hours'
);
create index if not exists status_usuario_expira on public.status (usuario, expira desc);
alter table public.status enable row level security;
drop policy if exists "ver status"   on public.status;
drop policy if exists "postar status" on public.status;
drop policy if exists "apagar status" on public.status;
create policy "ver status" on public.status for select to authenticated
  using (expira > now() and (usuario = auth.uid() or (public.sao_amigas(auth.uid(), usuario) and not public.bloqueio_entre(auth.uid(), usuario))));
create policy "postar status" on public.status for insert to authenticated with check (usuario = auth.uid());
create policy "apagar status" on public.status for delete to authenticated using (usuario = auth.uid());
grant select, insert, delete on public.status to authenticated;

create table if not exists public.status_vistas (
  status  uuid not null references public.status(id) on delete cascade,
  quem    uuid not null default auth.uid() references public.perfis(id) on delete cascade,
  em      timestamptz not null default now(),
  reacao  text check (reacao is null or char_length(reacao) <= 8),
  primary key (status, quem)
);
alter table public.status_vistas enable row level security;
drop policy if exists "ver vistas"   on public.status_vistas;
drop policy if exists "marcar vista" on public.status_vistas;
drop policy if exists "reagir status" on public.status_vistas;
create policy "ver vistas" on public.status_vistas for select to authenticated
  using (quem = auth.uid() or exists (select 1 from public.status s where s.id = status and s.usuario = auth.uid()));
create policy "marcar vista" on public.status_vistas for insert to authenticated
  with check (quem = auth.uid() and exists (select 1 from public.status s where s.id = status));
create policy "reagir status" on public.status_vistas for update to authenticated
  using (quem = auth.uid()) with check (quem = auth.uid());
grant select, insert, update on public.status_vistas to authenticated;
