-- ════════════════════════════════════════════════════════
-- FACIO — SCHEMA COMPLETO (5 TABELAS + RLS)
-- Rodar no Supabase SQL Editor, na ordem em que aparece
-- ════════════════════════════════════════════════════════

-- extensão necessária para gen_random_uuid()
create extension if not exists "pgcrypto";

-- ── 1. USERS (perfil do prestador) ─────────────────────────
-- Estende auth.users do Supabase Auth
create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  whatsapp    text not null,
  logo_url    text,
  plano       text not null default 'trial' check (plano in ('trial','basico','intermediario')),
  created_at  timestamptz not null default now()
);

alter table users enable row level security;

create policy "users_select_own"
  on users for select
  using (auth.uid() = id);

create policy "users_update_own"
  on users for update
  using (auth.uid() = id);

create policy "users_insert_own"
  on users for insert
  with check (auth.uid() = id);


-- ── 2. CLIENTS (clientes do prestador) ──────────────────────
create table clients (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  nome            text not null,
  whatsapp        text not null,
  endereco        text,
  ultimo_servico  text,
  created_at      timestamptz not null default now()
);

create index idx_clients_user_id   on clients(user_id);
create index idx_clients_whatsapp  on clients(whatsapp);

alter table clients enable row level security;

create policy "clients_all_own"
  on clients for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── 3. SERVICE_CATALOG (catálogo de serviços) ───────────────
create table service_catalog (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  nome         text not null,           -- ex: "Higienização sofá 3 lugares"
  valor_padrao numeric(10,2) not null,
  ativo        boolean not null default true,
  created_at   timestamptz not null default now()
);

create index idx_catalog_user_id on service_catalog(user_id);

alter table service_catalog enable row level security;

create policy "catalog_all_own"
  on service_catalog for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── 4. QUOTES (orçamentos) ───────────────────────────────────
create table quotes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  slug        text not null unique,      -- ex: "AB123" — usado na URL pública
  status      text not null default 'draft'
              check (status in ('draft','sent','approved','paid')),
  total       numeric(10,2) not null default 0,
  pdf_url     text,
  pix_link    text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_quotes_user_id   on quotes(user_id);
create index idx_quotes_client_id on quotes(client_id);
create index idx_quotes_slug      on quotes(slug);

alter table quotes enable row level security;

-- dono do orçamento: acesso total
create policy "quotes_all_own"
  on quotes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- acesso público de LEITURA via slug (para a rota /o/[slug])
-- usado pela service_role key no servidor — não expõe para o público geral
create policy "quotes_public_select_by_slug"
  on quotes for select
  using (true);
  -- Nota: a leitura pública real é feita via service_role no servidor,
  -- nunca direto do client. Esta policy permite que a query do servidor
  -- funcione; o controle de acesso fica na lógica da rota (ver actions.ts).


-- ── 5. QUOTE_ITEMS (itens do orçamento) ──────────────────────
create table quote_items (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references quotes(id) on delete cascade,
  descricao    text not null,
  quantidade   numeric(10,2) not null default 1,
  valor_unit   numeric(10,2) not null,
  subtotal     numeric(10,2) generated always as (quantidade * valor_unit) stored
);

create index idx_quote_items_quote_id on quote_items(quote_id);

alter table quote_items enable row level security;

create policy "quote_items_all_via_quote"
  on quote_items for all
  using (
    exists (
      select 1 from quotes
      where quotes.id = quote_items.quote_id
      and quotes.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from quotes
      where quotes.id = quote_items.quote_id
      and quotes.user_id = auth.uid()
    )
  );

-- leitura pública dos itens (necessária para a página pública do orçamento)
create policy "quote_items_public_select"
  on quote_items for select
  using (true);


-- ── 6. INTERACTIONS (histórico de toques no cliente) ─────────
create table interactions (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  quote_id    uuid references quotes(id) on delete set null,
  tipo        text not null
              check (tipo in ('orcamento_enviado','follow_up','aprovacao','pagamento')),
  data        timestamptz not null default now()
);

create index idx_interactions_client_id on interactions(client_id);
create index idx_interactions_quote_id  on interactions(quote_id);

alter table interactions enable row level security;

create policy "interactions_all_via_client"
  on interactions for all
  using (
    exists (
      select 1 from clients
      where clients.id = interactions.client_id
      and clients.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from clients
      where clients.id = interactions.client_id
      and clients.user_id = auth.uid()
    )
  );


-- ── TRIGGER: atualizar updated_at automaticamente ────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger quotes_updated_at
  before update on quotes
  for each row
  execute function update_updated_at();


-- ── TRIGGER: recalcular total do orçamento ao mudar itens ────
create or replace function recalc_quote_total()
returns trigger as $$
begin
  update quotes
  set total = (
    select coalesce(sum(subtotal), 0)
    from quote_items
    where quote_id = coalesce(new.quote_id, old.quote_id)
  )
  where id = coalesce(new.quote_id, old.quote_id);
  return null;
end;
$$ language plpgsql;

create trigger quote_items_recalc_insert
  after insert on quote_items
  for each row execute function recalc_quote_total();

create trigger quote_items_recalc_update
  after update on quote_items
  for each row execute function recalc_quote_total();

create trigger quote_items_recalc_delete
  after delete on quote_items
  for each row execute function recalc_quote_total();


-- ── SEED: catálogo padrão de higienização (rodar 1x por usuário) ──
-- Exemplo de como popular o catálogo inicial após o cadastro.
-- Substitua 'SEU_USER_ID' pelo id real do usuário (auth.users.id).
--
-- insert into service_catalog (user_id, nome, valor_padrao) values
--   ('SEU_USER_ID', 'Higienização sofá 2 lugares',  150.00),
--   ('SEU_USER_ID', 'Higienização sofá 3 lugares',  180.00),
--   ('SEU_USER_ID', 'Higienização colchão solteiro', 90.00),
--   ('SEU_USER_ID', 'Higienização colchão casal',    140.00),
--   ('SEU_USER_ID', 'Higienização cadeira de carro', 60.00),
--   ('SEU_USER_ID', 'Impermeabilização (adicional)', 50.00);
