alter table public.agents add column if not exists role text not null default 'specialist';
alter table public.agents add column if not exists service_key text not null default 'general';
alter table public.leads add column if not exists service_key text not null default 'general';
alter table public.leads add column if not exists assigned_agent_id text references public.agents(id) on delete set null;

update public.agents
set role = 'specialist',
    service_key = case when lower(name) = 'laura' then 'photos' else 'general' end;

drop index if exists public.agents_one_active_per_user;
create unique index if not exists agents_one_active_router_per_user
  on public.agents(user_id)
  where is_active = true and role = 'router';

create table if not exists public.prospects (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  lead_id text references public.leads(id) on delete set null,
  business_name text not null,
  contact_name text,
  phone text not null,
  city text,
  niche text,
  website_url text,
  website_status text not null default 'unknown',
  website_notes text,
  personalized_message text not null,
  status text not null default 'draft',
  contact_approved boolean not null default false,
  last_contacted_at timestamp,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);
create unique index if not exists prospects_user_phone_unique on public.prospects(user_id, phone);
create index if not exists prospects_user_status_idx on public.prospects(user_id, status);

alter table public.prospects enable row level security;
revoke all privileges on table public.prospects from anon, authenticated;
