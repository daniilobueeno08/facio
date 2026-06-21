-- ════════════════════════════════════════════════════════════
-- FACIO — Migration Dia 6: Catálogo com 3 níveis de preço
-- Rodar no Supabase SQL Editor, depois das migrations anteriores
-- ════════════════════════════════════════════════════════════

-- Renomeia a coluna antiga "valor" para "valor_higienizacao"
-- e adiciona as duas colunas novas — preserva dados já cadastrados.
alter table service_catalog
  rename column valor to valor_higienizacao;

alter table service_catalog
  add column if not exists valor_blindagem numeric(10,2),
  add column if not exists valor_combo     numeric(10,2);

-- valor_higienizacao continua obrigatório (todo serviço tem esse preço).
-- valor_blindagem e valor_combo são opcionais — alguns itens da tabela
-- Doctor Clean (ex: colchões) só têm o preço de higienização.

comment on column service_catalog.valor_higienizacao is 'Preço da higienização simples — sempre obrigatório';
comment on column service_catalog.valor_blindagem     is 'Preço com blindagem/impermeabilização — opcional';
comment on column service_catalog.valor_combo         is 'Preço do combo completo — opcional';
