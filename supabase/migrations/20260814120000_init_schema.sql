-- ============================================================================
-- Meu Universo — schema inicial
--
-- Filosofia: campanhas e todo tipo de entidade (criatura, antagonista, NPC,
-- documento, ideia, página em branco...) são a MESMA coisa — uma "page" com
-- um `type`. Tipos novos (event, item, ritual, faction, scene, session, map...)
-- são uma linha em `page_types`, nunca uma migração. Conteúdo de bloco e
-- propriedades específicas de tipo vivem em `jsonb`, pelo mesmo motivo.
-- ============================================================================

create extension if not exists pgcrypto;

-- ── updated_at automático ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- workspaces — o "universo". Existe desde já para que múltiplos universos ou
-- colaboradores futuros não exijam reestruturar nada.
-- ============================================================================
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Meu Universo',
  created_at timestamptz not null default now()
);

create index workspaces_owner_id_idx on public.workspaces(owner_id);

-- ============================================================================
-- workspace_members — hoje só 'owner'. É aqui que o futuro papel 'player'
-- entra sem tocar em pages/blocks/relations.
-- ============================================================================
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'player')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_id_idx on public.workspace_members(user_id);

-- ============================================================================
-- page_types — tabela de referência, não enum. Adicionar "event" ou "item"
-- no futuro é um INSERT, nunca um ALTER TYPE / ALTER TABLE.
-- ============================================================================
create table public.page_types (
  id text primary key,
  label text not null,
  plural_label text not null,
  icon text not null,
  path_slug text not null unique,
  sort_order int not null default 0
);

insert into public.page_types (id, label, plural_label, icon, path_slug, sort_order) values
  ('page', 'Página', 'Páginas', '📄', 'paginas', 0),
  ('campaign', 'Campanha', 'Campanhas', '🎭', 'campanhas', 1),
  ('monster', 'Criatura', 'Criaturas', '👹', 'criaturas', 2),
  ('antagonist', 'Antagonista', 'Antagonistas', '☠️', 'antagonistas', 3),
  ('npc', 'Personagem', 'Personagens', '👤', 'personagens', 4),
  ('location', 'Local', 'Locais', '🗺️', 'locais', 5),
  ('document', 'Documento', 'Documentos', '📜', 'documentos', 6),
  ('clue', 'Pista', 'Pistas', '🔎', 'pistas', 7),
  ('experiment', 'Experimento', 'Experimentos', '🧪', 'experimentos', 8),
  ('organization', 'Organização', 'Organizações', '🏛️', 'organizacoes', 9),
  ('idea', 'Ideia', 'Banco de Ideias', '💡', 'ideias', 10);

-- ============================================================================
-- pages — campanhas e todo tipo de entidade.
-- ============================================================================
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null references public.page_types(id),
  -- "onde a página pertence originalmente" — nunca obrigatório, e nunca
  -- apagado em cascata (ver enforce_campaign_id_type e a ausência de
  -- "on delete cascade" aqui: arquivar/excluir uma campanha não deve levar
  -- junto suas entidades).
  campaign_id uuid references public.pages(id) on delete set null,
  title text not null default '',
  subtitle text,
  icon text,
  summary text,
  -- nível de acesso PADRÃO da página — dado real, não efeito visual.
  status text not null default 'public' check (status in ('public', 'master', 'secret')),
  tags text[] not null default '{}',
  -- tudo que é específico do tipo: `element` de uma criatura, `players`/
  -- `sessions`/`party` de uma campanha, e qualquer campo que um tipo futuro
  -- precisar. Nunca exige migração.
  properties jsonb not null default '{}',
  archived_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.pages.campaign_id is 'Localização/campanha principal — opcional. Distinto de relations, que são vínculos adicionais.';
comment on column public.pages.properties is 'Campos específicos do tipo da página. Ex.: campanha -> {"players":4,"sessions":12,"party":[...],"campaignStatus":"ativa"}; criatura -> {"element":"Sangue"}.';

create index pages_workspace_id_idx on public.pages(workspace_id);
create index pages_campaign_id_idx on public.pages(campaign_id);
create index pages_type_idx on public.pages(type);
create index pages_updated_at_idx on public.pages(updated_at desc);

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

-- campaign_id só pode apontar para uma page do tipo 'campaign'.
create or replace function public.enforce_campaign_id_type()
returns trigger
language plpgsql
as $$
begin
  if new.campaign_id is not null then
    if not exists (select 1 from public.pages p where p.id = new.campaign_id and p.type = 'campaign') then
      raise exception 'campaign_id must reference a page of type campaign';
    end if;
  end if;
  return new;
end;
$$;

create trigger pages_enforce_campaign_id
  before insert or update of campaign_id on public.pages
  for each row execute function public.enforce_campaign_id_type();

-- ============================================================================
-- blocks — conteúdo estruturado do documento. Nunca HTML/texto solto.
-- ============================================================================
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  type text not null,
  -- nível de acesso DESTE bloco — pode divergir do nível da página.
  level text not null default 'public' check (level in ('public', 'master', 'secret')),
  -- índice fracionário: mover um bloco grava só a linha dele.
  position double precision not null,
  content jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.blocks.content is 'Formato depende de type: paragraph/heading2/heading3/quote/callout -> {"text"}; bulleted_list/numbered_list -> {"items":[{"id","text"}]}; image -> {"url","caption"}; page_link -> {"targetId"}; divider/relation -> {}.';

create index blocks_page_id_idx on public.blocks(page_id);
create index blocks_page_id_position_idx on public.blocks(page_id, position);

create trigger blocks_set_updated_at
  before update on public.blocks
  for each row execute function public.set_updated_at();

-- ============================================================================
-- relations — arestas do grafo. Cadastrar de um lado já é suficiente: o
-- backlink reverso é consulta (target_page_id = X), nunca precisa do par
-- espelhado.
-- ============================================================================
create table public.relations (
  id uuid primary key default gen_random_uuid(),
  source_page_id uuid not null references public.pages(id) on delete cascade,
  target_page_id uuid not null references public.pages(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint relations_no_self check (source_page_id <> target_page_id),
  constraint relations_unique unique (source_page_id, target_page_id)
);

create index relations_source_page_id_idx on public.relations(source_page_id);
create index relations_target_page_id_idx on public.relations(target_page_id);

-- ============================================================================
-- profiles — nome de exibição do usuário (usado no avatar/header).
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Helpers de autorização — security definer para evitar recursão de RLS
-- entre pages/blocks/relations e workspace_members, e para já ficarem
-- prontos para checar `role` quando 'player' existir.
-- ============================================================================
create or replace function public.workspace_role(p_workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.workspace_members
  where workspace_id = p_workspace_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.workspace_role(p_workspace_id) is not null;
$$;

create or replace function public.page_workspace_id(p_page_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from public.pages where id = p_page_id;
$$;

-- source e target de uma relation precisam pertencer ao mesmo workspace.
create or replace function public.enforce_relation_same_workspace()
returns trigger
language plpgsql
as $$
begin
  if public.page_workspace_id(new.source_page_id) is distinct from public.page_workspace_id(new.target_page_id) then
    raise exception 'source and target pages must belong to the same workspace';
  end if;
  return new;
end;
$$;

create trigger relations_enforce_workspace
  before insert or update on public.relations
  for each row execute function public.enforce_relation_same_workspace();

-- ============================================================================
-- Bootstrap: primeiro login cria profile + workspace + membership 'owner'
-- automaticamente. Atômico, não depende do frontend lembrar de fazer isso.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));

  insert into public.workspaces (owner_id, name)
  values (new.id, 'Meu Universo')
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Reindexação de blocos: reduz o índice fracionário de volta a espaçamentos
-- inteiros largos. Só precisa ser chamada quando duas posições ficarem
-- perigosamente próximas — a reordenação normal nunca chama isto.
-- ============================================================================
create or replace function public.reindex_page_blocks(p_page_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  v_workspace_id := public.page_workspace_id(p_page_id);
  if v_workspace_id is null or not public.is_workspace_member(v_workspace_id) then
    raise exception 'not authorized';
  end if;

  with ordered as (
    select id, row_number() over (order by position) as rn
    from public.blocks
    where page_id = p_page_id
  )
  update public.blocks b
  set position = ordered.rn * 1000
  from ordered
  where b.id = ordered.id;
end;
$$;

grant execute on function public.reindex_page_blocks(uuid) to authenticated;

-- ============================================================================
-- Grants — Supabase's `authenticated`/`anon` roles have no table access by
-- default beyond what's granted here; RLS policies above are what actually
-- narrow it down to rows the caller is allowed to see.
-- ============================================================================
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select on public.page_types to authenticated, anon;
grant select, insert, update, delete on public.pages to authenticated;
grant select, insert, update, delete on public.blocks to authenticated;
grant select, insert, update, delete on public.relations to authenticated;
grant select, insert, update on public.profiles to authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.page_types enable row level security;
alter table public.pages enable row level security;
alter table public.blocks enable row level security;
alter table public.relations enable row level security;
alter table public.profiles enable row level security;

-- workspaces
create policy workspaces_select on public.workspaces
  for select using (public.is_workspace_member(id));
create policy workspaces_insert on public.workspaces
  for insert with check (owner_id = auth.uid());
create policy workspaces_update on public.workspaces
  for update using (owner_id = auth.uid());
create policy workspaces_delete on public.workspaces
  for delete using (owner_id = auth.uid());

-- workspace_members
create policy workspace_members_select on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));
create policy workspace_members_insert on public.workspace_members
  for insert with check (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));
create policy workspace_members_update on public.workspace_members
  for update using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));
create policy workspace_members_delete on public.workspace_members
  for delete using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));

-- page_types: leitura pública (referência), escrita só via migração/service role
create policy page_types_select on public.page_types
  for select using (true);

-- pages — via workspace_members diretamente (não existe outro caminho)
create policy pages_select on public.pages
  for select using (public.is_workspace_member(workspace_id));
create policy pages_insert on public.pages
  for insert with check (public.is_workspace_member(workspace_id));
create policy pages_update on public.pages
  for update using (public.is_workspace_member(workspace_id));
create policy pages_delete on public.pages
  for delete using (public.is_workspace_member(workspace_id));

-- blocks — via pages.workspace_id (nunca acessível só por conhecer o id do bloco)
create policy blocks_select on public.blocks
  for select using (public.is_workspace_member(public.page_workspace_id(page_id)));
create policy blocks_insert on public.blocks
  for insert with check (public.is_workspace_member(public.page_workspace_id(page_id)));
create policy blocks_update on public.blocks
  for update using (public.is_workspace_member(public.page_workspace_id(page_id)));
create policy blocks_delete on public.blocks
  for delete using (public.is_workspace_member(public.page_workspace_id(page_id)));

-- relations — via pages.workspace_id da página de origem
create policy relations_select on public.relations
  for select using (public.is_workspace_member(public.page_workspace_id(source_page_id)));
create policy relations_insert on public.relations
  for insert with check (public.is_workspace_member(public.page_workspace_id(source_page_id)));
create policy relations_delete on public.relations
  for delete using (public.is_workspace_member(public.page_workspace_id(source_page_id)));

-- profiles
create policy profiles_select on public.profiles
  for select using (id = auth.uid());
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid());
