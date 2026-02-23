# PRD - Mini CRM de Vendas

## 1. VISÃO DO PRODUTO
Sistema pessoal de CRM para gerenciar leads e pipeline de vendas,
com autenticação segura e interface intuitiva.

## 2. OBJETIVOS
- Permitir gestão visual de leads em formato Kanban
- Organizar pipeline de vendas pessoal
- Histórico completo de interações com cada lead
- Interface limpa e responsiva

## 3. PERSONA
**Vendedor Individual/Freelancer**
- Gerencia 20-200 leads simultaneamente
- Precisa de visão rápida do funil
- Trabalha de forma independente
- Acessa via desktop e mobile

## 4. FUNCIONALIDADES CORE

### 4.1 Autenticação (Clerk)
- Login com Google/GitHub
- Gerenciamento de perfil pessoal
- Acesso direto ao dashboard após login

### 4.2 Dashboard
- Total de leads por status
- Valor total em pipeline
- Leads criados esta semana
- Gráfico simples de funil

### 4.3 Gestão de Leads
**Criar Lead:**
- Nome (obrigatório)
- Email
- Telefone
- Empresa
- Valor estimado
- Status inicial: "Novo Lead"

**Editar/Deletar:**
- Edição inline ou modal
- Soft delete (recuperável)

**Filtros:**
- Por status
- Por data de criação
- Busca por nome/empresa

### 4.4 Pipeline Kanban
**5 Colunas:**
1. Novo Lead
2. Contato Feito
3. Proposta Enviada
4. Negociação
5. Fechado

**Funcionalidades:**
- Drag and drop entre colunas
- Contador de leads por coluna
- Soma de valores por coluna
- Cards com info essencial do lead

### 4.5 Detalhes do Lead
- Informações completas
- Timeline de atividades
- Adicionar notas
- Registrar mudanças de status



## 5. REQUISITOS NÃO-FUNCIONAIS
- Carregamento inicial < 3 segundos
- Responsivo (mobile e desktop)
- Dados isolados por usuário (single-user)
- Interface em português

## 6. FORA DO ESCOPO V1
❌ Integrações (email, WhatsApp)
❌ Relatórios complexos
❌ Automações
❌ Sistema de pagamentos
❌ Campos customizados
❌ Múltiplos pipelines
❌ Importação/Exportação CSV

## 7. ONBOARDING SIMPLIFICADO

**Passo 1:** Login com Clerk (Google/GitHub)
**Passo 2:** Acesso direto ao dashboard
**Passo 3:** Tour rápido (3 tooltips):
   - "Clique aqui para criar seu primeiro lead"
   - "Arraste leads entre as colunas"
   - "Clique no lead para ver detalhes"

**Checklist de Primeiros Passos:**
- [ ] Criar primeiro lead
- [ ] Mover lead no Kanban
- [ ] Adicionar uma nota

## 8. MÉTRICAS BÁSICAS
- Leads totais
- Taxa de conversão (Novo → Fechado)
- Valor total em pipeline
- Leads por status