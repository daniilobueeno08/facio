-- ════════════════════════════════════════════════════════════
-- FACIO — Migration Dia 5
-- Rodar no Supabase SQL Editor, depois do schema inicial
-- ════════════════════════════════════════════════════════════

-- Data do pagamento — preenchida só quando status muda para 'paid'.
-- created_at já existe e serve como "data de elaboração do orçamento".
alter table quotes
  add column if not exists paid_at timestamptz;

-- Garante que a policy de DELETE existe para o dono do orçamento
-- (a versão anterior do schema já criava isso — este bloco é idempotente,
-- só recria caso não exista por algum motivo)
drop policy if exists "Usuário remove os próprios orçamentos" on quotes;
create policy "Usuário remove os próprios orçamentos"
  on quotes for delete
  using (auth.uid() = user_id);

-- Itens do orçamento são removidos automaticamente via
-- "on delete cascade" já definido na FK quote_items.quote_id → quotes.id
-- Interações também: client_id e quote_id têm on delete cascade.
