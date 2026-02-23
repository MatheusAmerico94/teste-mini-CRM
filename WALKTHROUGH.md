# Walkthrough - Mini CRM Base (com Turso)

Implementação completa do Mini CRM, configurada para deploy na Vercel com Banco de Dados Turso.

## ✅ Funcionalidades Implementadas

### 1. Landing Page (`app/page.tsx`)
- **Design Moderno:** Dark mode por padrão e micro-interações.
- **Conteúdo:** Hero, Cards de features, e chamada para ação (CTA).

### 2. Autenticação (`@clerk/nextjs`)
- **Login/Cadastro:** Páginas personalizadas e middleware de proteção.
- **Redirect:** Redirecionamento automático para o Dashboard.

### 3. Dashboard (`app/dashboard`)
- **Visual:** Sidebar, Header com UserButton, Gráficos Recharts e Cards de Métricas.
- **Dados:** Conectado (simbolicamente por enquanto) ao banco de dados.

### 4. Banco de Dados (Turso + Drizzle)
- **Migração:** Migrado de SQLite local para **Turso (LibSQL)**.
- **Configuração:** `drizzle.config.ts` ajustado para usar URL e Token.
- **Segurança:** Variáveis de ambiente protegidas em `.env.local`.

## 🚀 Como Rodar

1. **Clone o Repositório:**
   ```bash
   git clone https://github.com/andrealencar/mini-crm-tutorial.git
   cd mini-crm-tutorial
   npm install
   ```

2. **Configure o `.env.local`:**
   Crie o arquivo com suas chaves (não versionadas):
   ```bash
   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Turso
   DATABASE_URL=libsql://[seu-banco].turso.io
   DATABASE_AUTH_TOKEN=[seu-token]
   ```

3. **Inicie o Servidor:**
   ```bash
   npm run dev
   ```

## ☁️ Deploy na Vercel

1. Importe o projeto do GitHub na Vercel.
2. Nas configurações de **Environment Variables**, adicione as mesmas chaves do passo 2.
3. Deploy! 🚀
