import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTOMATION_BLOCKED_STATUSES, isLeadStatus, LEAD_STATUSES } from '../lib/crm';
import { decryptSecret, encryptSecret, maskSecret } from '../lib/security/crypto';
import { agentSchema, packageSchema } from '../lib/validation';
import { isSpecialistService, normalizeServiceKey } from '../lib/services/routing';
import { isConversationGreeting, isPixResendRequest, removeRepeatedInitialGreeting, selectedPackageFromMessage, type PackageSummary } from '../lib/services/chat';

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
  const packages: PackageSummary[] = [
    { name: '2 fotos', description: null, price: 10, imageCount: 2, deliveryHours: 2, deliveryDays: 0 },
    { name: '5 fotos', description: null, price: 20, imageCount: 5, deliveryHours: 2, deliveryDays: 0 },
    { name: '10 fotos', description: null, price: 30, imageCount: 10, deliveryHours: 2, deliveryDays: 0 },
  ];
  assert.equal(selectedPackageFromMessage('Perfeito, vou querer', packages), undefined);
  assert.equal(selectedPackageFromMessage('Vou querer o pacote de 10 fotos', packages)?.name, '10 fotos');
  assert.equal(selectedPackageFromMessage('10 fotos', packages)?.name, '10 fotos');
  assert.equal(selectedPackageFromMessage('vou de 5', packages)?.name, '5 fotos');
  assert.equal(selectedPackageFromMessage('quero testar com 2', packages)?.name, '2 fotos');
  assert.equal(selectedPackageFromMessage('o de 30', packages)?.name, '10 fotos');
  assert.equal(selectedPackageFromMessage('dez', packages, 'Temos 2, 5 e 10 fotos. Qual faz mais sentido pra você?')?.name, '10 fotos');
  assert.equal(selectedPackageFromMessage('Sim', packages, 'Quer seguir com o pacote de 10 fotos por R$29,90?')?.name, '10 fotos');
  assert.equal(selectedPackageFromMessage('Sim', packages, 'Você prefere um estilo elegante?'), undefined);
});

test('pedido explícito de reenvio de Pix é reconhecido em variações naturais', () => {
  for (const message of [
    'Manda novamente pfv', 'manda de novo', 'me manda de novo',
    'qual era a chave?', 'perdi a chave', 'não consigo copiar',
    'manda só ela', 'reenvia pra mim', 'me passa o pix de novo',
  ]) assert.equal(isPixResendRequest(message), true, message);
  assert.equal(isPixResendRequest('Quanto tempo demora?'), false);
  assert.equal(isPixResendRequest('Ok'), false);
});

test('segunda mensagem inicial não repete a saudação enviada pelo CRM', () => {
  assert.equal(removeRepeatedInitialGreeting('Bom dia! Tudo bem? Claro, posso explicar como funciona.', 'Bom dia'), 'Claro, posso explicar como funciona.');
  assert.equal(removeRepeatedInitialGreeting('Claro, posso explicar como funciona.', 'Bom dia'), 'Claro, posso explicar como funciona.');
});

test('saudação é reconhecida como estado global da conversa', () => {
  assert.equal(isConversationGreeting('Oi, tudo bem?'), true);
  assert.equal(isConversationGreeting('Bom dia! Como posso te ajudar?'), true);
  assert.equal(isConversationGreeting('Claro, me conta o que você imaginou.'), false);
});
