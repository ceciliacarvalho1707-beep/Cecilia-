-- ============================================================================
-- Atualização 4: contas, perfis e amizades
-- ============================================================================
-- Login por @usuário e senha (Supabase Auth). Perfis podem ser vistos por quem tem
-- conta; amizade precisa ser aceita; cada pessoa só vê a própria lista de conversas.

create table if not exists public.perfis (
  id       uuid primary key references auth.users(id) on delete cascade,
  usuario  text not null unique check (usuario ~ '^[a-z0-9_.]{3,20}$'),
  nome     text not null check (char_length(nome) between 1 and 30),
  foto     text check (foto is null or char_length(foto) <= 80000),
  bio      text not null default '' check (char_length(bio) <= 160),
  humor    text not null default '' check (char_length(humor) <= 60),
  criado   timestamptz not null default now()
);
alter table public.perfis enable row level security;
drop policy if exists "ver perfis"       on public.perfis;
drop policy if exists "criar meu perfil" on public.perfis;
drop policy if exists "mudar meu perfil" on public.perfis;
create policy "ver perfis"       on public.perfis for select to authenticated using (true);
create policy "criar meu perfil" on public.perfis for insert to authenticated with check (id = auth.uid());
create policy "mudar meu perfil" on public.perfis for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
grant select, insert, update on public.perfis to authenticated;

create table if not exists public.amizades (
  de      uuid not null references public.perfis(id) on delete cascade,
  para    uuid not null references public.perfis(id) on delete cascade,
  aceita  boolean not null default false,
  criado  timestamptz not null default now(),
  primary key (de, para),
  check (de <> para)
);
alter table public.amizades enable row level security;
drop policy if exists "ver minhas amizades" on public.amizades;
drop policy if exists "pedir amizade"       on public.amizades;
drop policy if exists "aceitar amizade"     on public.amizades;
drop policy if exists "desfazer amizade"    on public.amizades;
create policy "ver minhas amizades" on public.amizades for select to authenticated using (auth.uid() in (de, para));
create policy "pedir amizade"       on public.amizades for insert to authenticated with check (de = auth.uid() and not aceita);
create policy "aceitar amizade"     on public.amizades for update to authenticated using (para = auth.uid()) with check (para = auth.uid());
create policy "desfazer amizade"    on public.amizades for delete to authenticated using (auth.uid() in (de, para));
grant select, insert, update, delete on public.amizades to authenticated;

-- Conversas de cada conta (aparecem em qualquer celular onde a pessoa entrar)
create table if not exists public.minhas_conversas (
  usuario  uuid not null references auth.users(id) on delete cascade,
  sala     text not null check (sala ~ '^[0-9a-f]{64}$'),
  senha    text check (senha is null or char_length(senha) <= 200),
  titulo   text check (titulo is null or char_length(titulo) <= 40),
  grupo    boolean not null default false,
  com      uuid,
  criado   timestamptz not null default now(),
  primary key (usuario, sala)
);
alter table public.minhas_conversas enable row level security;
drop policy if exists "minhas conversas" on public.minhas_conversas;
create policy "minhas conversas" on public.minhas_conversas for all to authenticated
  using (usuario = auth.uid()) with check (usuario = auth.uid());
grant select, insert, update, delete on public.minhas_conversas to authenticated;

-- Abre (ou cria) a conversa com uma amiga e devolve a senha dela
create or replace function public.abrir_conversa(amiga uuid) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare s text; codigo text;
begin
  if not exists (select 1 from public.amizades where aceita and
       ((de = auth.uid() and para = amiga) or (de = amiga and para = auth.uid()))) then
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
grant execute on function public.abrir_conversa(uuid) to authenticated;

-- Põe uma amiga numa conversa (grupo) em que eu já estou
create or replace function public.adicionar_na_conversa(p_sala text, amiga uuid) returns void
language plpgsql security definer set search_path = public as $$
declare minha public.minhas_conversas;
begin
  select * into minha from public.minhas_conversas where usuario = auth.uid() and sala = p_sala;
  if not found or minha.senha is null then raise exception 'conversa não encontrada'; end if;
  if not exists (select 1 from public.amizades where aceita and
       ((de = auth.uid() and para = amiga) or (de = amiga and para = auth.uid()))) then
    raise exception 'vocês ainda não são amigas';
  end if;
  insert into public.minhas_conversas (usuario, sala, senha, titulo, grupo)
    values (amiga, p_sala, minha.senha, minha.titulo, minha.grupo)
    on conflict (usuario, sala) do nothing;
end $$;
grant execute on function public.adicionar_na_conversa(text, uuid) to authenticated;
