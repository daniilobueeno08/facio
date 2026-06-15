# Facio — Landing Page

## Stack
- Next.js 14 (App Router)
- Tailwind CSS
- Supabase (captura de leads)
- Vercel (deploy)

## Setup local

```bash
npm install
cp .env.example .env.local
# Preencha as variáveis do Supabase
npm run dev
```

## Supabase — criar tabela de leads

```sql
create table leads (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  whatsapp   text not null,
  created_at timestamptz default now()
);

-- Habilitar RLS e bloquear leitura pública
alter table leads enable row level security;
```

## Deploy na Vercel

1. Push no GitHub
2. Importar projeto na Vercel
3. Adicionar variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
4. Deploy automático a cada push na main

## Paleta de cores
| Token         | Hex       |
|---------------|-----------|
| Fundo         | #FFFFFF   |
| Superfície    | #F4F6F3   |
| Texto         | #1A1A2E   |
| Muted         | #6B7280   |
| Primária      | #639922   |
| Destaque      | #97C459   |
| Pale          | #EAF3DE   |
| Dark          | #3B6D11   |
| Navy          | #1A1A2E   |
