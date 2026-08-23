create unique index if not exists agents_one_active_per_user
  on public.agents(user_id)
  where is_active = true;
