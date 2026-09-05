import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTOMATION_BLOCKED_STATUSES, isLeadStatus, LEAD_STATUSES } from '../lib/crm';
import { decryptSecret, encryptSecret, maskSecret } from '../lib/security/crypto';
import { agentSchema, packageSchema } from '../lib/validation';
import { isSpecialistService, normalizeServiceKey } from '../lib/services/routing';
import { selectedPackageFromMessage, type PackageSummary } from '../lib/services/chat';

test('pipeline contém as etapas comerciais na ordem esperada', () => {
  assert.deepEqual(LEAD_STATUSES.map(({ id }) => id), [
    'novo', 'atendimento', 'oferta', 'aguardando_pix',
    'comprovante_recebido', 'pago', 'aguardando_fotos', 'producao', 'entregue',
  ]);
  assert.equal(isLeadStatus('pago'), true);
  assert.equal(isLeadStatus('fechado'), false);
  assert.equal(AUTOMATION_BLOCKED_STATUSES.has('pago'), true);
  assert.equal(AUTOMATION_BLOCKED_STATUSES.has('comprovante_recebido'), true);
});

test('chave da API é criptografada e pode ser recuperada', () => {
  process.env.APP_ENCRYPTION_KEY = 'test-key-with-more-than-thirty-two-characters';
  const encrypted = encryptSecret('sk-test-secret');
  assert.notEqual(encrypted, 'sk-test-secret');
  assert.equal(decryptSecret(encrypted), 'sk-test-secret');
  assert.equal(maskSecret(encrypted), '••••••••••••');
});

test('pacotes rejeitam valores comerciais inválidos', () => {
  assert.equal(packageSchema.safeParse({ name: 'Completo', price: 50, imageCount: 10, deliveryDays: 3, isActive: true }).success, true);
  assert.equal(packageSchema.safeParse({ name: 'X', price: -1, imageCount: 0, deliveryDays: -2, isActive: true }).success, false);
});

test('roteamento aceita somente os serviços especializados previstos', () => {
  assert.equal(normalizeServiceKey('photos'), 'photos');
  assert.equal(normalizeServiceKey('sites'), 'sites');
  assert.equal(normalizeServiceKey('qualquer coisa'), 'general');
  assert.equal(isSpecialistService('photos'), true);
  assert.equal(isSpecialistService('general'), false);
});

test('agente aceita instruções de até 60 mil caracteres', () => {
  const input = { name: 'Laura', personality: 'a'.repeat(60_000), model: 'gpt-4o-mini' };
  assert.equal(agentSchema.safeParse(input).success, true);
  assert.equal(agentSchema.safeParse({ ...input, personality: 'a'.repeat(60_001) }).success, false);
});

test('Pix só é liberado após escolha explícita de pacote', () => {
  const packages: PackageSummary[] = [{ name: '10 fotos', description: null, price: 29.9, imageCount: 10, deliveryHours: 2, deliveryDays: 0 }];
  assert.equal(selectedPackageFromMessage('Perfeito, vou querer', packages), undefined);
  assert.equal(selectedPackageFromMessage('Vou querer o pacote de 10 fotos', packages)?.name, '10 fotos');
  assert.equal(selectedPackageFromMessage('Sim', packages, 'Quer seguir com o pacote de 10 fotos por R$29,90?')?.name, '10 fotos');
  assert.equal(selectedPackageFromMessage('Sim', packages, 'Você prefere um estilo elegante?'), undefined);
});
