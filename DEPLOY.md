# Guia de Deploy na Vercel 🚀

Este guia cobre o processo de deploy do Mini CRM na Vercel, com instruções específicas para banco de dados **Turso (SQLite)** (configuração atual) e **Supabase (PostgreSQL)**.

## 1. Preparação Geral

Antes de tudo, certifique-se de que seu código está no GitHub.
1. Crie uma conta na [Vercel](https://vercel.com).
2. Clique em **"Add New..."** > **"Project"**.
3. Importe o repositório `mini-crm-tutorial` do seu GitHub.

---

## 2. Configuração com Turso (Padrão)

Como o projeto já está configurado para Turso (`@libsql/client`), este é o caminho mais rápido.

### Passo a Passo

1. **No Painel da Vercel**, na tela de configuração do projeto (antes de clicar em Deploy):
2. Vá até a seção **Environment Variables**.
3. Adicione as seguintes chaves (copie do seu `.env.local`):

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Chave pública do Clerk | `pk_test_...` |
| `CLERK_SECRET_KEY` | Chave secreta do Clerk | `sk_test_...` |
| `DATABASE_URL` | URL do banco Turso | `libsql://seu-banco.turso.io` |
| `DATABASE_AUTH_TOKEN` | Token de autenticação do Turso | `eyJ...` |

4. Clique em **Deploy**.

> **Nota:** Se você atualizar o Schema do banco futuramente, lembre-se de rodar `npx drizzle-kit push` localmente, pois o deploy da Vercel roda apenas a aplicação, não as migrações de banco automaticamente nesta configuração simples.

---

## 3. Configuração com Supabase (PostgreSQL)

Se você preferir usar PostgreSQL via Supabase, precisará fazer algumas alterações no código antes do deploy.

### Alterações Necessárias no Código

1. **Instale as dependências:**
   ```bash
   npm uninstall @libsql/client drizzle-orm/libsql
   npm install postgres drizzle-orm/vercel-postgres
   ```

2. **Ajuste o Schema (`lib/db/schema.ts`):**
   Troque `sqlite-core` por `pg-core`.
   ```typescript
   // De:
   import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
   // Para:
   import { pgTable, text } from 'drizzle-orm/pg-core';
   ```

3. **Ajuste a Conexão (`lib/db/index.ts`):**
   Use o driver postgres.
   ```typescript
   import { drizzle } from 'drizzle-orm/postgres-js';
   import postgres from 'postgres';
   
   const client = postgres(process.env.DATABASE_URL!);
   export const db = drizzle(client, { schema });
   ```

4. **Ajuste o Config (`drizzle.config.ts`):**
   Mude o `dialect` para `'postgresql'`.

### Variáveis na Vercel (Supabase)

Adicione estas variáveis no painel da Vercel:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão do Supabase (ex: `postgres://user:pass@host:5432/db`) |
| `NEXT_PUBLIC_CLERK_...` | Chaves do Clerk (mesmas do Turso) |

---

## 4. Pós-Deploy

Após o deploy ser concluído com sucesso:

1. A Vercel fornecerá uma URL (ex: `mini-crm-tutorial.vercel.app`).
2. **Atualize o Clerk:**
   - Vá no Dashboard do Clerk > **Developers** > **API Keys**.
   - Adicione a URL da Vercel nas configurações de **Allowed Origins** (se necessário).
   - Configure as URLs de redirecionamento (Sign-in/Sign-up) se forem diferentes em produção.

✅ **Pronto! Seu CRM está no ar.**
