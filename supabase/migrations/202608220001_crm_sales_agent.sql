create table if not exists users (
  id text primary key,
  clerk_user_id text unique not null,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamp not null default now(),
  last_seen_at timestamp
);

create table if not exists leads (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  estimated_value double precision default 0,
  status text default 'novo',
  temperature text default 'frio',
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  persistent_memory text,
  deleted_at timestamp
);

create table if not exists activities (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  type text not null,
  content text,
  metadata text,
  created_at timestamp not null default now()
);

create table if not exists agents (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  personality text not null,
  provider text not null default 'openai',
  model text,
  api_key text,
  is_active boolean default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists whatsapp_connections (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  status text not null default 'disconnected',
  session_data text,
  qr_code text,
  updated_at timestamp not null default now()
);

create table if not exists messages (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamp not null default now()
);

alter table if exists leads add column if not exists ai_enabled boolean not null default true;
alter table if exists leads add column if not exists source text default 'whatsapp';
alter table if exists leads add column if not exists notes text;
alter table if exists leads add column if not exists paid_at timestamp;
alter table if exists leads add column if not exists handoff_at timestamp;
create index if not exists leads_user_status_idx on leads(user_id, status);
create index if not exists leads_user_phone_idx on leads(user_id, phone);
create index if not exists messages_lead_created_idx on messages(lead_id, created_at);

alter table if exists whatsapp_connections add column if not exists phone_number text;
alter table if exists whatsapp_connections add column if not exists last_error text;
create unique index if not exists whatsapp_connections_user_unique on whatsapp_connections(user_id);

alter table if exists messages add column if not exists external_id text;
alter table if exists messages add column if not exists message_type text not null default 'text';
create unique index if not exists messages_external_id_unique on messages(external_id) where external_id is not null;

create table if not exists business_settings (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  business_name text not null default 'Estúdio de Ensaios com IA',
  pix_key text,
  pix_recipient text,
  default_greeting text,
  sales_instructions text,
  payment_instructions text,
  human_handoff_message text,
  updated_at timestamp not null default now()
);
create unique index if not exists business_settings_user_unique on business_settings(user_id);

create table if not exists service_packages (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  description text,
  price double precision not null default 0,
  image_count integer not null default 1,
  delivery_days integer not null default 3,
  is_active boolean not null default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);
create index if not exists service_packages_user_idx on service_packages(user_id);

create table if not exists portfolio_items (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  title text not null,
  category text,
  media_url text not null,
  is_active boolean not null default true,
  created_at timestamp not null default now()
);
create index if not exists portfolio_items_user_idx on portfolio_items(user_id);

-- O CRM acessa o Postgres exclusivamente pelo servidor Next.js/worker usando
-- DATABASE_URL. Nenhuma destas tabelas deve ser consultável pela API pública
-- do Supabase, especialmente agents.api_key e whatsapp_connections.qr_code.
alter table users enable row level security;
alter table leads enable row level security;
alter table activities enable row level security;
alter table agents enable row level security;
alter table whatsapp_connections enable row level security;
alter table messages enable row level security;
alter table business_settings enable row level security;
alter table service_packages enable row level security;
alter table portfolio_items enable row level security;

revoke all privileges on table users from anon, authenticated;
revoke all privileges on table leads from anon, authenticated;
revoke all privileges on table activities from anon, authenticated;
revoke all privileges on table agents from anon, authenticated;
revoke all privileges on table whatsapp_connections from anon, authenticated;
revoke all privileges on table messages from anon, authenticated;
revoke all privileges on table business_settings from anon, authenticated;
revoke all privileges on table service_packages from anon, authenticated;
revoke all privileges on table portfolio_items from anon, authenticated;
