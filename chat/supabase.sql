-- ============================================================================
-- Nosso Cantinho: banco de mensagens no Supabase
--
-- Cada conversa é identificada pelo código da senha (64 letras e números),
-- calculado no celular. O app manda esse código no cabeçalho "x-sala" de cada
-- pedido, e as regras abaixo só deixam ver e mexer nas linhas da conversa cujo
-- código veio no pedido. Sem a senha, não há como achar nem listar conversas.
--
-- Como usar: Supabase → SQL Editor → New query → colar tudo → Run.
-- Pode rodar de novo sem problema (não apaga nada).
-- ============================================================================

create or replace function public.sala_pedida() returns text
language sql stable
set search_path = public
as $$
  select coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-sala', '')
$$;

-- ── Mensagens ───────────────────────────────────────────────────────────────
create table if not exists public.mensagens (
  id       uuid primary key default gen_random_uuid(),
  sala     text not null check (sala ~ '^[0-9a-f]{64}$'),
  nome     text not null check (char_length(nome) between 1 and 30),
  texto    text not null default '' check (char_length(texto) <= 2000),
  em       bigint not null default (extract(epoch from clock_timestamp()) * 1000)::bigint,
  foto     text check (foto is null or char_length(foto) <= 200),
  w        int,
  h        int,
  audio    text check (audio is null or char_length(audio) <= 200),
  dur      real,
  tipo     text check (tipo is null or char_length(tipo) <= 40),
  fig      text check (fig is null or fig ~ '^[a-z0-9-]{1,24}$'),
  resp     jsonb,
  reacoes  jsonb not null default '{}'::jsonb,
  editada  boolean not null default false,
  apagada  boolean not null default false
);
create index if not exists mensagens_sala_em on public.mensagens (sala, em desc);

-- ── Mensagens fixadas no topo ───────────────────────────────────────────────
create table if not exists public.fixadas (
  sala       text not null check (sala ~ '^[0-9a-f]{64}$'),
  id         uuid not null,
  nome       text not null,
  texto      text not null default '',
  em         bigint not null,
  fixada_em  timestamptz not null default now(),
  primary key (sala, id)
);

-- ── Pessoas: foto de perfil, até onde leu ("visto") e quando esteve por último
create table if not exists public.pessoas (
  sala   text not null check (sala ~ '^[0-9a-f]{64}$'),
  nome   text not null check (char_length(nome) between 1 and 30),
  foto   text check (foto is null or char_length(foto) <= 80000),
  lido   bigint not null default 0,
  visto  bigint not null default 0,
  primary key (sala, nome)
);

-- ── Regras de acesso: só a conversa cujo código veio no pedido ──────────────
alter table public.mensagens enable row level security;
alter table public.fixadas   enable row level security;
alter table public.pessoas   enable row level security;

drop policy if exists "ler a conversa"    on public.mensagens;
drop policy if exists "mandar mensagem"   on public.mensagens;
drop policy if exists "mudar mensagem"    on public.mensagens;
create policy "ler a conversa"  on public.mensagens for select to anon using (sala = public.sala_pedida());
create policy "mandar mensagem" on public.mensagens for insert to anon with check (sala = public.sala_pedida());
create policy "mudar mensagem"  on public.mensagens for update to anon using (sala = public.sala_pedida()) with check (sala = public.sala_pedida());

drop policy if exists "ler fixadas"    on public.fixadas;
drop policy if exists "fixar"          on public.fixadas;
drop policy if exists "desafixar"      on public.fixadas;
create policy "ler fixadas" on public.fixadas for select to anon using (sala = public.sala_pedida());
create policy "fixar"       on public.fixadas for insert to anon with check (sala = public.sala_pedida());
create policy "desafixar"   on public.fixadas for delete to anon using (sala = public.sala_pedida());

drop policy if exists "ler pessoas"     on public.pessoas;
drop policy if exists "entrar"          on public.pessoas;
drop policy if exists "atualizar pessoa" on public.pessoas;
create policy "ler pessoas"      on public.pessoas for select to anon using (sala = public.sala_pedida());
create policy "entrar"           on public.pessoas for insert to anon with check (sala = public.sala_pedida());
create policy "atualizar pessoa" on public.pessoas for update to anon using (sala = public.sala_pedida()) with check (sala = public.sala_pedida());

grant usage on schema public to anon;
grant select, insert, update on public.mensagens to anon;
grant select, insert, delete on public.fixadas   to anon;
grant select, insert, update on public.pessoas   to anon;
grant execute on function public.sala_pedida() to anon;

-- ── Reagir: uma reação por pessoa; tocar de novo no mesmo emoji tira ────────
-- Feito no banco para duas reações ao mesmo tempo não se atropelarem.
create or replace function public.reagir(p_id uuid, p_nome text, p_emoji text)
returns public.mensagens
language plpgsql
set search_path = public
as $$
declare
  m     public.mensagens;
  novo  jsonb := '{}'::jsonb;
  tinha text;
  k     text;
  v     jsonb;
  resto jsonb;
begin
  if p_emoji not in ('❤️', '😂', '😮', '😢', '🙏', '👍') then
    raise exception 'emoji inválido';
  end if;
  select * into m from public.mensagens
   where id = p_id and sala = public.sala_pedida()
   for update;
  if not found then raise exception 'mensagem não encontrada'; end if;
  if m.apagada then return m; end if;
  for k, v in select key, value from jsonb_each(m.reacoes) loop
    if v ? p_nome then tinha := k; end if;
    select coalesce(jsonb_agg(x), '[]'::jsonb) into resto
      from jsonb_array_elements_text(v) as x where x <> p_nome;
    if jsonb_array_length(resto) > 0 then novo := novo || jsonb_build_object(k, resto); end if;
  end loop;
  if tinha is distinct from p_emoji then
    novo := novo || jsonb_build_object(p_emoji, coalesce(novo -> p_emoji, '[]'::jsonb) || to_jsonb(p_nome));
  end if;
  update public.mensagens set reacoes = novo where id = p_id returning * into m;
  return m;
end
$$;
grant execute on function public.reagir(uuid, text, text) to anon;

-- ── Fotos, áudios e figurinhas ──────────────────────────────────────────────
-- Pasta pública, mas sem permissão de listar: o endereço de cada arquivo leva
-- o código da conversa, então só quem tem a senha chega nele.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('midia', 'midia', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp',
              'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/aac', 'audio/x-m4a'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "midia: enviar" on storage.objects;
create policy "midia: enviar" on storage.objects for insert to anon
  with check (bucket_id = 'midia' and name ~ '^[0-9a-f]{64}/[0-9a-f-]{36}\.(jpg|png|webp|webm|m4a|ogg|mp3|aac)$');

-- ============================================================================
-- Atualização 2: enquetes, jogos, várias fotos, vídeos e mensagens encaminhadas
-- ============================================================================
-- "extra" guarda o conteúdo desses tipos novos (álbum, vídeo, enquete, jogo).
alter table public.mensagens add column if not exists extra jsonb
  check (extra is null or char_length(extra::text) <= 20000);

-- Vídeos de até 20 MB.
update storage.buckets
   set file_size_limit = 20971520,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp',
         'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/aac', 'audio/x-m4a',
         'video/mp4', 'video/webm', 'video/quicktime']
 where id = 'midia';

drop policy if exists "midia: enviar" on storage.objects;
create policy "midia: enviar" on storage.objects for insert to anon
  with check (bucket_id = 'midia' and name ~ '^[0-9a-f]{64}/[0-9a-f-]{36}\.(jpg|png|webp|webm|m4a|ogg|mp3|aac|mp4|mov)$');

-- ============================================================================
-- Atualização 3: "entregue" (dois tracinhos) e grupos
-- ============================================================================
-- Até que mensagem cada pessoa já recebeu no celular (dois tracinhos cinza).
alter table public.pessoas add column if not exists entregue bigint not null default 0;

-- Nome e foto do grupo, iguais para todo mundo do grupo.
create table if not exists public.grupos (
  sala        text primary key check (sala ~ '^[0-9a-f]{64}$'),
  nome        text not null check (char_length(nome) between 1 and 40),
  foto        text check (foto is null or char_length(foto) <= 80000),
  atualizado  bigint not null default 0
);
alter table public.grupos enable row level security;
drop policy if exists "ler grupo"     on public.grupos;
drop policy if exists "criar grupo"   on public.grupos;
drop policy if exists "mudar grupo"   on public.grupos;
create policy "ler grupo"   on public.grupos for select to anon using (sala = public.sala_pedida());
create policy "criar grupo" on public.grupos for insert to anon with check (sala = public.sala_pedida());
create policy "mudar grupo" on public.grupos for update to anon using (sala = public.sala_pedida()) with check (sala = public.sala_pedida());
grant select, insert, update on public.grupos to anon;

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
