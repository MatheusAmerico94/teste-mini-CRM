alter table public.agents
  add column if not exists response_temperature double precision not null default 0.7;

update public.agents
set response_temperature = case when role = 'router' then 0.3 else 0.7 end
where response_temperature is null or response_temperature = 0.7;
