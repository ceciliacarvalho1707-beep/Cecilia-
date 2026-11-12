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
