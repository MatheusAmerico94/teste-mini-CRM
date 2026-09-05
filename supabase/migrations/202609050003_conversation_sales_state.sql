alter table public.leads
  add column if not exists conversation_stage text not null default 'new_lead',
  add column if not exists selected_package_id text,
  add column if not exists selected_quantity integer,
  add column if not exists selected_price double precision,
  add column if not exists package_confirmed boolean not null default false,
  add column if not exists payment_method text,
  add column if not exists payment_status text not null default 'not_started',
  add column if not exists pix_sent boolean not null default false,
  add column if not exists pix_sent_at timestamp,
  add column if not exists pix_send_count integer not null default 0,
  add column if not exists payment_proof_received boolean not null default false,
  add column if not exists awaiting_manual_payment_review boolean not null default false,
  add column if not exists last_user_intent text,
  add column if not exists last_ai_action text,
  add column if not exists human_handoff boolean not null default false;

update public.leads
set conversation_stage = case
  when status = 'comprovante_recebido' then 'awaiting_manual_confirmation'
  when status = 'pago' then 'payment_confirmed'
  when status = 'aguardando_pix' then 'awaiting_payment'
  else conversation_stage
end,
payment_status = case
  when status = 'comprovante_recebido' then 'pending_review'
  when status = 'pago' then 'confirmed'
  else payment_status
end;
