import assert from 'node:assert/strict';
import { toE164, leadId, buildLeadPayload, consentimentoValido, leadDoPortal } from './lead.ts';

/* ---------- toE164 ---------- */
// celular com DDD, com máscara
assert.equal(toE164('(11) 99999-8888'), '+5511999998888');
// fixo com DDD
assert.equal(toE164('11 3333-4444'), '+551133334444');
// já veio com código do país
assert.equal(toE164('+55 11 99999-8888'), '+5511999998888');
assert.equal(toE164('5511999998888'), '+5511999998888');
// vazio
assert.equal(toE164(''), '');
// fora do padrão brasileiro: preserva os dígitos em vez de descartar o dado
assert.equal(toE164('99999'), '99999');
// landline com código do país (12 dígitos)
assert.equal(toE164('+55 11 3333-4444'), '+551133334444');

/* ---------- leadId ---------- */
// determinístico: mesma entrada, mesmo id em chamadas separadas
assert.equal(
  leadId('landing_allegrato', '+5511999998888', 'Maria Souza'),
  leadId('landing_allegrato', '+5511999998888', 'Maria Souza'),
);
assert.equal(
  leadId('landing_allegrato', '+5511999998888', 'Maria Souza'),
  'portal:landing_allegrato:5511999998888',
);
// landings diferentes não colidem
assert.notEqual(
  leadId('landing_allegrato', '+5511999998888', 'Maria'),
  leadId('landing_maita', '+5511999998888', 'Maria'),
);
// sem telefone, cai para o nome normalizado
assert.equal(
  leadId('landing_avela', '', 'Maria Souza'),
  'portal:landing_avela:maria-souza',
);
// determinismo: raw e normalized form do mesmo número produzem o mesmo id
assert.equal(
  leadId('landing_x', '11999998888', 'M'),
  leadId('landing_x', '+5511999998888', 'M'),
);

/* ---------- buildLeadPayload ---------- */
const p = buildLeadPayload({
  name: '  Maria Souza  ',
  phone: '(11) 99999-8888',
  email: 'maria@exemplo.com',
  source: 'landing_allegrato',
  interest: 'Allegrato Residencial',
  message: '2 dormitórios (55 m²)',
});
assert.equal(p.event, 'lead.created');
assert.equal(p.data.name, 'Maria Souza', 'nome vem trimado');
assert.equal(p.data.phone, '+5511999998888', 'telefone normalizado');
assert.equal(p.data.id, 'portal:landing_allegrato:5511999998888');
assert.equal(p.data.email, 'maria@exemplo.com');
assert.equal(p.data.interest, 'Allegrato Residencial');
assert.equal(p.data.message, '2 dormitórios (55 m²)');

// campos ausentes são omitidos, não vão como string vazia
const semEmail = buildLeadPayload({
  name: 'João',
  phone: '11999998888',
  source: 'landing_odeon',
  interest: 'Odeon Residencial',
});
assert.ok(!('email' in semEmail.data), 'email ausente é omitido');
assert.ok(!('message' in semEmail.data), 'message ausente é omitido');

// limites de tamanho
const longo = buildLeadPayload({
  name: 'A'.repeat(300),
  phone: '11999998888',
  message: 'M'.repeat(3000),
  source: 'landing_odeon',
  interest: 'Odeon Residencial',
});
assert.equal(longo.data.name.length, 120, 'name cortado em 120');
assert.equal(longo.data.message.length, 1000, 'message cortado em 1000');

// caracteres de controle são removidos
const sujo = buildLeadPayload({
  name: 'Maria\u0000\u001BSouza',
  phone: '11999998888',
  source: 'landing_odeon',
  interest: 'Odeon Residencial',
});
assert.equal(sujo.data.name, 'MariaSouza', 'caracteres de controle removidos');

// consentimento LGPD entra em `message`, em texto, datado
const comConsentimento = buildLeadPayload({
  name: 'Ana',
  phone: '11999998888',
  source: 'landing_lotus-anunciar',
  interest: 'Avaliação de imóvel em Medeiros',
  message: 'Casa, 120 m²',
  consent: true,
  consentAt: '2026-09-30T12:00:00.000Z',
});
assert.equal(
  comConsentimento.data.message,
  'Casa, 120 m² · Consentimento LGPD: sim, em 2026-09-30T12:00:00.000Z.',
);
const soConsentimento = buildLeadPayload({
  name: 'Ana',
  phone: '11999998888',
  source: 'landing_lotus-anunciar',
  interest: 'Avaliação de imóvel em Medeiros',
  consent: true,
  consentAt: '2026-09-30T12:00:00.000Z',
});
assert.equal(soConsentimento.data.message, 'Consentimento LGPD: sim, em 2026-09-30T12:00:00.000Z.');
// consent false ou ausente não inventa a linha
const semConsentimento = buildLeadPayload({
  name: 'Ana',
  phone: '11999998888',
  source: 'landing_lotus-anunciar',
  interest: 'Avaliação de imóvel em Medeiros',
  consent: false,
});
assert.ok(!('message' in semConsentimento.data), 'sem consentimento não há linha de consentimento');

/* ---------- consentimentoValido (regra que a rota /api/lead aplica) ---------- */
assert.equal(consentimentoValido(true, '2026-09-30T12:00:00.000Z'), true);
assert.equal(consentimentoValido(false, '2026-09-30T12:00:00.000Z'), false, 'desmarcado não vale');
assert.equal(consentimentoValido('true', '2026-09-30T12:00:00.000Z'), false, 'só booleano verdadeiro');
assert.equal(consentimentoValido(true, 'não-é-data'), false, 'precisa de instante legível');
assert.equal(consentimentoValido(true, undefined), false, 'precisa do instante');

/* ---------- leadDoPortal (formulários de imóvel, condomínio, lançamentos e corretores) ---------- */
const agora = new Date('2026-10-18T15:00:00.000Z');
const CONSENTIMENTO = 'Consentimento LGPD: sim, em 2026-10-18T15:00:00.000Z.';

// imóvel, vindo pelo link de um corretor
const imovel = buildLeadPayload(
  leadDoPortal(
    'imovel',
    { name: 'Ana', phone: '(11) 99999-8888', interest: 'AP677 · Apartamento de 3 suítes em Anhangabaú', detalhes: ['Visita desejada em 20/10/2026'] },
    'k7m2qx',
    agora,
  ),
);
assert.equal(imovel.data.source, 'landing_lotus-imovel');
assert.equal(imovel.data.interest, 'AP677 · Apartamento de 3 suítes em Anhangabaú');
assert.equal(imovel.data.phone, '+5511999998888');
assert.equal(imovel.data.message, `Visita desejada em 20/10/2026 · código do corretor: k7m2qx · ${CONSENTIMENTO}`);
assert.equal(/código do corretor:\s*([a-z2-9]{6})/i.exec(imovel.data.message)?.[1], 'k7m2qx', 'a Lia acha o código');
assert.ok(!('portal' in imovel.data), 'não é lançamento: buildLeadPayload não marca nada');

// imóvel sem link de corretor e sem data: só o consentimento
const imovelSemNada = buildLeadPayload(
  leadDoPortal('imovel', { name: 'Ana', phone: '11999998888', interest: 'AP677 · Casa' }, null, agora),
);
assert.equal(imovelSemNada.data.message, CONSENTIMENTO);

// condomínio, com e-mail
const condominio = buildLeadPayload(
  leadDoPortal('condominio', { name: 'Bia', phone: '11999998888', email: 'bia@exemplo.com', interest: 'Condomínio Reserva da Serra' }, 'k7m2qx', agora),
);
assert.equal(condominio.data.source, 'landing_lotus-condominio');
assert.equal(condominio.data.email, 'bia@exemplo.com');
assert.equal(condominio.data.message, `código do corretor: k7m2qx · ${CONSENTIMENTO}`);

// lançamentos, sem código
const lancamentos = buildLeadPayload(
  leadDoPortal('lancamentos', { name: 'Caio', phone: '11999998888', email: 'caio@exemplo.com', interest: 'Lançamentos em Jundiaí e região' }, null, agora),
);
assert.equal(lancamentos.data.source, 'landing_lotus-lancamentos');
assert.equal(lancamentos.data.message, CONSENTIMENTO);

// corretores: o corretor escolhido na tela e o assunto entram no message
const corretores = buildLeadPayload(
  leadDoPortal(
    'corretores',
    { name: 'Davi', phone: '11999998888', interest: 'Contato com Mariana Mamede', detalhes: ['Corretor escolhido: Mariana Mamede', 'Quero vender'] },
    'k7m2qx',
    agora,
  ),
);
assert.equal(corretores.data.source, 'landing_lotus-corretores');
assert.equal(
  corretores.data.message,
  `Corretor escolhido: Mariana Mamede · Quero vender · código do corretor: k7m2qx · ${CONSENTIMENTO}`,
);

// os quatro passam na regra de consentimento da rota e no formato de source dela
for (const p of [imovel, condominio, lancamentos, corretores]) {
  assert.match(p.data.source, /^landing_[a-z0-9-]{1,48}$/);
}
const declarado = leadDoPortal('imovel', { name: 'Ana', phone: '1', interest: 'x' }, null, agora);
assert.equal(consentimentoValido(declarado.consent, declarado.consentAt), true);

console.log('ok');
