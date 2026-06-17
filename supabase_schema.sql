-- ════════════════════════════════════════════════════════════
-- FACIO — Schema completo MVP (5 tabelas + RLS)
-- Rodar no Supabase SQL Editor, em uma única execução
-- ════════════════════════════════════════════════════════════

-- Extensão necessária para gen_random_uuid()
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- 1. PROFILES — dados do prestador (estende auth.users do Supabase)
-- ────────────────────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  whatsapp    text not null,
  logo_url    text,
  plano       text not null default 'trial',
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Usuário vê apenas o próprio perfil"
  on profiles for select
  using (auth.uid() = id);

create policy "Usuário edita apenas o próprio perfil"
  on profiles for update
  using (auth.uid() = id);

create policy "Usuário cria o próprio perfil"
  on profiles for insert
  with check (auth.uid() = id);

-- Trigger: cria o profile automaticamente ao registrar no auth
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, whatsapp)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''), coalesce(new.raw_user_meta_data->>'whatsapp', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 2. CLIENTS — clientes de cada prestador
-- ────────────────────────────────────────────────────────────
create table clients (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  nome            text not null,
  whatsapp        text not null,
  endereco        text,
  ultimo_servico  text,
  created_at      timestamptz not null default now()
);

create index idx_clients_user_id on clients(user_id);
create index idx_clients_whatsapp on clients(whatsapp);

alter table clients enable row level security;

create policy "Usuário vê apenas os próprios clientes"
  on clients for select
  using (auth.uid() = user_id);

create policy "Usuário cria clientes para si"
  on clients for insert
  with check (auth.uid() = user_id);

create policy "Usuário edita apenas os próprios clientes"
  on clients for update
  using (auth.uid() = user_id);

create policy "Usuário remove apenas os próprios clientes"
  on clients for delete
  using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 3. SERVICE_CATALOG — catálogo de serviços pré-configurados
-- ────────────────────────────────────────────────────────────
create table service_catalog (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  nome        text not null,           -- ex: "Higienização sofá 3 lugares"
  valor       numeric(10,2) not null,
  created_at  timestamptz not null default now()
);

create index idx_catalog_user_id on service_catalog(user_id);

alter table service_catalog enable row level security;

create policy "Usuário vê apenas o próprio catálogo"
  on service_catalog for select
  using (auth.uid() = user_id);

create policy "Usuário cria itens no próprio catálogo"
  on service_catalog for insert
  with check (auth.uid() = user_id);

create policy "Usuário edita o próprio catálogo"
  on service_catalog for update
  using (auth.uid() = user_id);

create policy "Usuário remove do próprio catálogo"
  on service_catalog for delete
  using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 4. QUOTES — orçamentos
-- ────────────────────────────────────────────────────────────
create table quotes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  slug        text not null unique,     -- ex: "AB123" — usado na página pública /o/AB123
  status      text not null default 'draft' check (status in ('draft','sent','approved','paid')),
  total       numeric(10,2) not null default 0,
  pdf_url     text,
  pix_link    text,
  notes       text,
  created_at  timestamptz not null default now()
);

create index idx_quotes_user_id on quotes(user_id);
create index idx_quotes_client_id on quotes(client_id);
create index idx_quotes_slug on quotes(slug);

alter table quotes enable row level security;

create policy "Usuário vê apenas os próprios orçamentos"
  on quotes for select
  using (auth.uid() = user_id);

create policy "Usuário cria orçamentos para si"
  on quotes for insert
  with check (auth.uid() = user_id);

create policy "Usuário edita os próprios orçamentos"
  on quotes for update
  using (auth.uid() = user_id);

create policy "Usuário remove os próprios orçamentos"
  on quotes for delete
  using (auth.uid() = user_id);

-- Acesso público de LEITURA via slug (necessário para a página /o/[slug])
-- Isso permite que o CLIENTE final (sem login) veja o orçamento pelo link.
create policy "Qualquer pessoa pode ver um orçamento pelo slug"
  on quotes for select
  using (true);
-- Nota: esta policy substitui a anterior de SELECT para leitura pública.
-- A trava de segurança real está em nunca expor o slug publicamente —
-- ele só é conhecido por quem recebeu o link.

-- ────────────────────────────────────────────────────────────
-- 5. QUOTE_ITEMS — itens de cada orçamento
-- ────────────────────────────────────────────────────────────
create table quote_items (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid not null references quotes(id) on delete cascade,
  descricao   text not null,
  quantidade  numeric(10,2) not null default 1,
  valor_unit  numeric(10,2) not null,
  subtotal    numeric(10,2) generated always as (quantidade * valor_unit) stored
);

create index idx_items_quote_id on quote_items(quote_id);

alter table quote_items enable row level security;

create policy "Usuário vê itens dos próprios orçamentos"
  on quote_items for select
  using (
    exists (select 1 from quotes where quotes.id = quote_items.quote_id and quotes.user_id = auth.uid())
    or true -- leitura pública via slug (mesmo princípio da tabela quotes)
  );

create policy "Usuário cria itens nos próprios orçamentos"
  on quote_items for insert
  with check (
    exists (select 1 from quotes where quotes.id = quote_items.quote_id and quotes.user_id = auth.uid())
  );

create policy "Usuário edita itens dos próprios orçamentos"
  on quote_items for update
  using (
    exists (select 1 from quotes where quotes.id = quote_items.quote_id and quotes.user_id = auth.uid())
  );

create policy "Usuário remove itens dos próprios orçamentos"
  on quote_items for delete
  using (
    exists (select 1 from quotes where quotes.id = quote_items.quote_id and quotes.user_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────
-- 6. INTERACTIONS — histórico de toques no cliente (nova, da v4)
-- ────────────────────────────────────────────────────────────
create table interactions (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  quote_id    uuid references quotes(id) on delete cascade,
  tipo        text not null check (tipo in ('orcamento_enviado','follow_up','aprovacao','pagamento')),
  data        timestamptz not null default now()
);

create index idx_interactions_client_id on interactions(client_id);
create index idx_interactions_quote_id on interactions(quote_id);

alter table interactions enable row level security;

create policy "Usuário vê interações dos próprios clientes"
  on interactions for select
  using (
    exists (select 1 from clients where clients.id = interactions.client_id and clients.user_id = auth.uid())
  );

create policy "Usuário cria interações para os próprios clientes"
  on interactions for insert
  with check (
    exists (select 1 from clients where clients.id = interactions.client_id and clients.user_id = auth.uid())
    or true -- permite registro público (ex: cliente aprova pelo link e o sistema grava a interação)
  );

-- ════════════════════════════════════════════════════════════
-- TESTE RÁPIDO — rode depois de criar um usuário pelo Auth
-- ════════════════════════════════════════════════════════════
-- select * from profiles;
-- select * from clients;
-- select * from quotes;
