# SPECS - Mini CRM de Vendas

## STACK TECNOLÓGICA

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **State:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **Drag & Drop:** @dnd-kit/core
- **Charts:** Recharts

### Autenticação
- **Provider:** Clerk
- **Features usadas:**
  - User Authentication
  - User Profile Management

### Database
- **DB:** SQLite (desenvolvimento) / PostgreSQL (produção)
- **ORM:** Drizzle ORM
- **API:** Next.js Server Actions

### Deploy
- **Hosting:** Vercel
- **Database:** SUPABASE

**Email:**
- Resend (emails transacionais)

---

## ARQUITETURA SINGLE-USER

### Estratégia
Cada usuário tem seus próprios dados isolados via `user_id` em todas as tabelas.

### Fluxo
```
User Login → Clerk Auth → Dashboard (todos queries filtrados por user_id)
```

---

## SCHEMA DO BANCO DE DADOS

### Tabela: users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP
);
```

### Tabela: leads
```sql
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Informações básicas
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  
  -- Vendas
  estimated_value DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'novo', -- novo, contato, proposta, negociacao, fechado
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_leads_user_status ON leads(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_user_created ON leads(user_id, created_at DESC);
```

### Tabela: activities
```sql
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- nota, status_mudou
  content TEXT,
  metadata JSONB, -- { "from": "novo", "to": "contato" }
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_lead ON activities(lead_id, created_at DESC);
```

## DRIZZLE SCHEMA
```typescript
// lib/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  clerkUserId: text('clerk_user_id').unique().notNull(),
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }),
});

export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  
  estimatedValue: real('estimated_value').default(0),
  status: text('status').default('novo'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const activities = sqliteTable('activities', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  
  type: text('type').notNull(),
  content: text('content'),
  metadata: text('metadata'), // JSON stringified
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

---

## CLERK INTEGRATION

### Setup Básico
```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.)']);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});
```

### Webhook Simples
```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function POST(req: Request) {
  const payload = await req.json();
  const { type, data } = payload;

  if (type === 'user.created') {
    await db.insert(users).values({
      id: crypto.randomUUID(),
      clerkUserId: data.id,
      email: data.email_addresses[0].email_address,
      name: `${data.first_name} ${data.last_name}`.trim(),
      avatarUrl: data.image_url,
    });
  }

  return Response.json({ success: true });
}
```

---

## COMPONENTES PRINCIPAIS

### Estrutura de Pastas
```
/app
  /(auth)
    /sign-in/[[...sign-in]]
    /sign-up/[[...sign-up]]
  /(onboarding)
    /onboarding
  /(app)
    /dashboard
    /leads
      /[id]
    /team
  /api
    /webhooks/clerk
/components
  /leads
    - LeadCard.tsx
    - LeadForm.tsx
    - KanbanBoard.tsx
    - LeadDetail.tsx
  /dashboard
    - StatsCards.tsx
    - FunnelChart.tsx
  /team
    - MembersList.tsx
  /ui (shadcn)
/lib
  /db
  /hooks
  /actions (Server Actions)
```

### KanbanBoard Component
```typescript
// components/leads/KanbanBoard.tsx
'use client';

import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { LeadCard } from './LeadCard';
import { updateLeadStatus } from '@/lib/actions/leads';

const COLUMNS = [
  { id: 'novo', label: 'Novo Lead', color: 'bg-gray-100' },
  { id: 'contato', label: 'Contato Feito', color: 'bg-blue-100' },
  { id: 'proposta', label: 'Proposta Enviada', color: 'bg-purple-100' },
  { id: 'negociacao', label: 'Negociação', color: 'bg-orange-100' },
  { id: 'fechado', label: 'Fechado', color: 'bg-green-100' },
];

export function KanbanBoard({ leads }: { leads: Lead[] }) {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;

    await updateLeadStatus(leadId, newStatus);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const columnLeads = leads.filter(l => l.status === column.id);
          const totalValue = columnLeads.reduce((sum, l) => sum + Number(l.estimatedValue), 0);

          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className={`${column.color} rounded-lg p-4`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">{column.label}</h3>
                  <span className="text-sm text-gray-600">
                    {columnLeads.length} • R$ {totalValue.toFixed(2)}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {columnLeads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}
```

---

## DESIGN SYSTEM

### Cores
```javascript
// tailwind.config.js
colors: {
  primary: '#3b82f6',    // blue-500
  secondary: '#8b5cf6',  // purple-500
  success: '#10b981',    // green-500
  warning: '#f59e0b',    // amber-500
  danger: '#ef4444',     // red-500
}
```

### Typography
- Headings: `font-bold text-2xl`
- Body: `text-base text-gray-700`
- Small: `text-sm text-gray-500`

### Espaçamentos
- Container: `max-w-7xl mx-auto px-4`
- Cards: `p-6 rounded-lg shadow-sm`
- Gaps: `gap-4` (padrão)

---

## ONBOARDING FLOW

### Passo 1: Sign Up/In (Clerk)
```typescript
// app/(auth)/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp 
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-xl'
          }
        }}
        afterSignUpUrl="/onboarding"
      />
    </div>
  );
}
```

### Passo 2: Criar Organização
```typescript
// app/(onboarding)/onboarding/page.tsx
import { CreateOrganization } from '@clerk/nextjs';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2">Bem-vindo! 👋</h1>
        <p className="text-gray-600 mb-8">
          Crie sua organização para começar a gerenciar seus leads
        </p>
        
        <CreateOrganization 
          afterCreateOrganizationUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border'
            }
          }}
        />
      </div>
    </div>
  );
}
```

### Passo 3: Tour Guiado (opcional)
```typescript
// Usar biblioteca como react-joyride ou shepherd.js
// Tooltips em:
// 1. Botão "Novo Lead"
// 2. Pipeline Kanban
// 3. Card de Lead (click para detalhes)
```

---

## SERVER ACTIONS
```typescript
// lib/actions/leads.ts
'use server';

import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { leads, activities } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';

export async function createLead(data: NewLead) {
  const { userId, orgId } = auth();
  
  if (!userId || !orgId) {
    throw new Error('Não autorizado');
  }

  const leadId = crypto.randomUUID();

  await db.insert(leads).values({
    id: leadId,
    organizationId: orgId,
    ...data,
    createdBy: userId,
  });

  revalidatePath('/dashboard');
  return { success: true, leadId };
}

export async function updateLeadStatus(leadId: string, newStatus: string) {
  const { userId, orgId } = auth();
  
  if (!userId || !orgId) {
    throw new Error('Não autorizado');
  }

  const lead = await db.query.leads.findFirst({
    where: (leads, { eq, and }) => 
      and(eq(leads.id, leadId), eq(leads.organizationId, orgId))
  });

  if (!lead) {
    throw new Error('Lead não encontrado');
  }

  await db.update(leads)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(leads.id, leadId));

  // Registrar atividade
  await db.insert(activities).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    leadId,
    type: 'status_mudou',
    content: `Status alterado de "${lead.status}" para "${newStatus}"`,
    metadata: { from: lead.status, to: newStatus },
    createdBy: userId,
  });

  revalidatePath('/dashboard');
}
```

---

## PERFORMANCE

### Otimizações
- Server Components por padrão
- Client Components apenas quando necessário
- Lazy loading de modais
- React Query para cache de dados
- Optimistic updates no Kanban

### Metas
- First Load: < 100KB
- Time to Interactive: < 2s
- Lighthouse Score: > 90

---

## SEGURANÇA

### Proteções
- Todas as queries filtram por `organization_id`
- Server Actions validam `auth()` do Clerk
- Zod validation em todos os forms
- Prepared statements (ORM)

### Exemplo de Query Segura
```typescript
// ✅ CORRETO - Sempre filtra por org
const leads = await db.query.leads.findMany({
  where: (leads, { eq, and }) => 
    and(
      eq(leads.organizationId, orgId),
      eq(leads.status, 'novo')
    )
});

// ❌ ERRADO - Vaza dados de outras orgs
const leads = await db.query.leads.findMany({
  where: (leads, { eq }) => eq(leads.status, 'novo')
});
```

---

## DEPLOY CHECKLIST

**Variáveis de Ambiente:**
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Database
DATABASE_URL=

# App
NEXT_PUBLIC_URL=
```

**Passos:**
1. Criar projeto no Vercel
2. Conectar ao GitHub
3. Configurar env vars
4. Deploy automático
5. Configurar webhook Clerk com URL de produção