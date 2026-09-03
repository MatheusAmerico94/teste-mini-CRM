export type ServiceKey = 'general' | 'photos' | 'sites';

export function normalizeServiceKey(value: unknown): ServiceKey {
  return value === 'photos' || value === 'sites' ? value : 'general';
}

export function isSpecialistService(value: unknown): value is Exclude<ServiceKey, 'general'> {
  return value === 'photos' || value === 'sites';
}
