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
