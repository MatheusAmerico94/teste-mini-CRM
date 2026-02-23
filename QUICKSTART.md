# 🚀 Quick Start - Mini CRM

## Comandos Essenciais

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Aplicar mudanças no banco de dados
npm run db:push

# Visualizar banco de dados
npm run db:studio
```

## 🔑 Variáveis de Ambiente Necessárias

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Clerk Redirects (força dashboard após login)
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database
DATABASE_URL=file:./sqlite.db
```

## 🧪 Como Testar

1. **Iniciar servidor**: `npm run dev`
2. **Acessar**: http://localhost:3000
3. **Login**: Usar Google/GitHub via Clerk
4. **Verificar**: Deve ir direto para `/dashboard`

> ⚠️ **Importante**: O Clerk usa CAPTCHA, então testes automatizados de login não funcionam. Consulte [`TESTING.md`](file:///Users/andrealencar/GoogleAntigravity/AulaCriarAppCrm/TESTING.md) para guia completo.

## 🔧 Configuração do Clerk

Acesse: https://dashboard.clerk.com

### Obrigatório
- ✅ **Desabilitar Organizations** (Configure → Organizations)
- ✅ **Configurar Paths**:
  - After sign-in: `/dashboard`
  - After sign-up: `/dashboard`

## 🐛 Troubleshooting

### Loop Infinito no Dashboard
**Causa**: Dashboard verificando `orgId` que não existe mais  
**Solução**: Verificar que linhas 11-13 do `dashboard/page.tsx` foram removidas

### Erro 404 em /onboarding
**Causa**: Clerk tentando redirecionar para página removida  
**Solução**: Página `/onboarding` com redirect automático está implementada

### CAPTCHA não aparece
**Causa**: Bloqueador de anúncios ou extensões  
**Solução**: Desabilitar ad-blockers ou usar aba anônima

## 📁 Estrutura de Arquivos Importantes

```
/
├── app/
│   ├── (app)/
│   │   └── dashboard/page.tsx       # Dashboard principal
│   ├── sign-in/[[...sign-in]]/      # Página de login
│   ├── sign-up/[[...sign-up]]/      # Página de cadastro
│   └── onboarding/page.tsx          # Redirect automático
├── components/
│   └── layout/Header.tsx            # Header sem OrganizationSwitcher
├── lib/
│   └── db/schema.ts                 # Schema single-user
├── middleware.ts                     # Proteção de rotas
├── .env                             # Variáveis de ambiente
├── PRD.md                           # Requisitos do produto
├── SPECS.md                         # Especificações técnicas
└── TESTING.md                       # Guia de testes manuais
```

## 📚 Documentos de Referência

- **[PRD.md](file:///Users/andrealencar/GoogleAntigravity/AulaCriarAppCrm/PRD.md)**: Requisitos do produto
- **[SPECS.md](file:///Users/andrealencar/GoogleAntigravity/AulaCriarAppCrm/SPECS.md)**: Especificações técnicas
- **[TESTING.md](file:///Users/andrealencar/GoogleAntigravity/AulaCriarAppCrm/TESTING.md)**: Guia de testes
- **[task.md](file:///Users/andrealencar/.gemini/antigravity/brain/e8b97cd9-5424-4208-850d-d3821f3dde54/task.md)**: Checklist de tarefas
- **[walkthrough.md](file:///Users/andrealencar/.gemini/antigravity/brain/e8b97cd9-5424-4208-850d-d3821f3dde54/walkthrough.md)**: Documentação de mudanças

## ✅ Status Atual

- ✅ Autenticação funcionando
- ✅ Dashboard acessível após login
- ✅ Arquitetura single-user implementada
- ✅ Documentação atualizada
- ⏳ Gestão de Leads (próximo)
- ⏳ Kanban Board (futuro)
- ⏳ Métricas (futuro)
