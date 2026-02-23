# Guia de Testes - Mini CRM

## 📋 Pré-requisitos Obrigatórios

> [!IMPORTANT]
> **Antes de iniciar qualquer teste, você (ou o assistente) DEVE sempre:**
> 1. ✅ Iniciar o servidor de desenvolvimento: `npm run dev`
> 2. ✅ Verificar que o servidor está rodando em http://localhost:3000
> 3. ✅ Confirmar que não há erros no terminal
> 
> **Para assistentes AI:** Sempre inicie os serviços com `npm run dev` antes de tentar acessar o navegador ou fazer testes automatizados.

---

## ⚠️ IMPORTANTE: Limitações de Teste Automatizado

> [!CAUTION]
> **O Clerk usa CAPTCHA** em desenvolvimento e produção para proteger contra bots. Por isso, **não é possível testar login/signup de forma automatizada** usando ferramentas como Playwright, Puppeteer ou browser subagents.
>
> Todos os testes de autenticação **devem ser feitos manualmente** por você.

---

## 🔧 Configuração Obrigatória no Painel Clerk

Antes de testar, você PRECISA configurar o Clerk corretamente:

### 1. Desabilitar Organizations

O sistema foi simplificado para **não usar Organizations**. Você precisa:

1. Acesse: https://dashboard.clerk.com
2. Selecione seu projeto: `AulaYoutubeCriarCrm`
3. Vá em **Configure** → **Organizations**
4. **DESABILITE** a feature "Organizations"
5. Salve as alterações

> [!WARNING]
> Se Organizations estiver habilitado no painel, o Clerk **forçará** a criação de organização mesmo que o código não tenha essa página, resultando em erro 404.

### 2. Configurar Paths e Redirects

No painel do Clerk, vá em **Paths**:

1. **After sign-in**: `/dashboard`
2. **After sign-up**: `/dashboard`
3. **Sign-in URL**: `/sign-in`
4. **Sign-up URL**: `/sign-up`

Certifique-se que **não há** menção a `/onboarding` em nenhum lugar.

---

## ✅ Checklist de Testes Manuais

### Fase 1: Landing Page

- [ ] Abrir http://localhost:3000
- [ ] Verificar se o design moderno carrega corretamente
- [ ] Verificar animações do background (grid + blobs)
- [ ] Clicar em "Começar Gratuitamente" → redireciona para `/sign-up`
- [ ] Clicar em "Fazer Login" → redireciona para `/sign-in`
- [ ] Verificar todos os CTAs funcionam

### Fase 2: Sign-Up (Cadastro)

- [ ] Ir para `/sign-up`
- [ ] Verificar que a página carrega com tema dark
- [ ] Verificar botão "Continue with Google" está visível
- [ ] Verificar campos de formulário (First name, Last name, Email, Password)
- [ ] Verificar contraste de texto (tudo legível?)
- [ ] **NÃO** deve haver menção a organizações
- [ ] Preencher formulário e criar conta
- [ ] **Resolver CAPTCHA manualmente**
- [ ] Após cadastro bem-sucedido → deve redirecionar para `/dashboard`
- [ ] **NÃO** deve aparecer 404 ou `/onboarding`

**Se der erro 404 após sign-up:**
- Verifique se Organizations está desabilitado no painel Clerk
- Verifique os redirects no painel Clerk (Paths)

### Fase 3: Sign-In (Login)

- [ ] Fazer logout (UserButton → Sign out)
- [ ] Ir para `/sign-in`
- [ ] Verificar tema dark e contraste
- [ ] Fazer login com a conta criada
- [ ] **Resolver CAPTCHA manualmente**
- [ ] Após login → deve redirecionar para `/dashboard`
- [ ] **NÃO** deve aparecer 404 ou `/onboarding`

### Fase 4: Dashboard

- [ ] Verificar que dashboard carrega corretamente
- [ ] Verificar mensagem de boas-vindas personalizada com seu nome
- [ ] Verificar Header:
  - [ ] Logo "Mini CRM" clicável
  - [ ] UserButton (avatar) visível
  - [ ] **NÃO** deve ter OrganizationSwitcher
- [ ] Verificar Sidebar:
  - [ ] Dashboard (ativo)
  - [ ] Leads (desabilitado - "Em breve")
  - [ ] Settings (desabilitado - "Em breve")
- [ ] Verificar cards de "Coming soon" features

### Fase 5: Perfil do Usuário

- [ ] Clicar no UserButton (avatar no header)
- [ ] Clicar em "Manage account"
- [ ] Verificar página do Clerk abre
- [ ] Editar informações (nome, email, etc.)
- [ ] Voltar ao dashboard
- [ ] Verificar se alterações aparecem (recarregar página)

### Fase 6: Logout

- [ ] Clicar no UserButton
- [ ] Clicar em "Sign out"
- [ ] Verificar que faz logout
- [ ] Deve redirecionar para landing page (`/`)
- [ ] Tentar acessar `/dashboard` → deve redirecionar para `/sign-in`

---

## 🐛 Problemas Conhecidos e Soluções

### Problema: 404 em `/onboarding` após login

**Causa:** O painel do Clerk ainda está configurado para usar Organizations.

**Solução:**
1. Vá no painel Clerk → Configure → Organizations
2. **Desabilite** Organizations completamente
3. Vá em Paths e configure:
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`
4. Limpe o cache do browser (Cmd+Shift+R no Mac)
5. Tente fazer login novamente

### Problema: Texto ilegível nas páginas Clerk

**Causa:** Contraste insuficiente no tema dark.

**Solução:** Já corrigido no código com variáveis de cor explícitas. Se ainda estiver com problema, limpe o cache.

### Problema: CAPTCHA não aparece

**Causa:** Pode ser bloqueador de anúncios ou extensões de browser.

**Solução:**
- Desabilite extensões de ad-block
- Use aba anônima
- Tente outro navegador

---

## 📊 Resultados Esperados

Após completar todos os testes:

✅ **Sign-up** → Dashboard (direto, sem onboarding)  
✅ **Sign-in** → Dashboard (direto, sem onboarding)  
✅ **Dashboard** mostra nome do usuário  
✅ **Header** sem OrganizationSwitcher  
✅ **Sidebar** com navegação básica  
✅ **Logout** funciona corretamente  
❌ **Nenhum erro 404**  
❌ **Nenhuma menção a Organizations**  

---

## 🔍 Como Reportar Problemas

Se encontrar erros durante os testes, forneça:

1. **Screenshot** da tela de erro
2. **URL** onde o erro ocorreu
3. **Passo a passo** para reproduzir
4. **Console logs** do navegador (F12 → Console)
5. **Logs do servidor** (terminal onde roda `npm run dev`)

### Exemplo de log útil:

```
GET /onboarding 404 in 39ms
POST /onboarding 404 in 21ms
```

Isso indica que algo está tentando acessar `/onboarding` que não existe mais.

---

## 🚀 Próximos Passos Após Testes

Se todos os testes passarem:

1. ✅ Sistema de autenticação simplificado está funcionando
2. ⏭️ Próximo: Implementar gestão de Leads
3. ⏭️ Depois: Kanban board
4. ⏭️ Depois: Métricas e analytics

---

## 📝 Notas Técnicas

- **Banco de dados**: SQLite local (`sqlite.db`)
- **Schema**: Apenas tabela `users` (sem `organizations`)
- **Webhooks**: Sincronizam `user.created` e `user.updated`
- **Middleware**: Protege rotas, mas **não verifica** organizações
- **Redirects**: Configurados para `/dashboard` direto

