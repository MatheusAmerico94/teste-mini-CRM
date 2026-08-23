alter table if exists public.leads
  add column if not exists persistent_memory text;
