export const LEAD_STATUSES = [
  { id: 'novo', label: 'Novo lead' },
  { id: 'atendimento', label: 'Em atendimento' },
  { id: 'oferta', label: 'Oferta enviada' },
  { id: 'aguardando_pix', label: 'Aguardando Pix' },
  { id: 'pago', label: 'Pago' },
  { id: 'aguardando_fotos', label: 'Aguardando fotos' },
  { id: 'producao', label: 'Em produção' },
  { id: 'entregue', label: 'Entregue' },
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number]['id'];

export const AUTOMATION_BLOCKED_STATUSES = new Set<LeadStatus>([
  'pago',
  'aguardando_fotos',
  'producao',
  'entregue',
]);

export function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUSES.some((status) => status.id === value);
}

