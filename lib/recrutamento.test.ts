import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WHATSAPP_RECRUTAMENTO, linkDoWhatsApp, mensagemDeCandidatura } from './recrutamento';

const base = { nome: 'Ana Souza', whatsapp: '(11) 99999-0000', experiencia: 'Tenho CRECI', area: 'Corretor de imóveis' };

test('candidatura leva nome, área, experiência e WhatsApp, sem espaços sobrando', () => {
  assert.equal(
    mensagemDeCandidatura({ ...base, nome: '  Ana Souza ', whatsapp: ' (11) 99999-0000 ' }),
    'Olá! Meu nome é Ana Souza e quero me candidatar na Lotus (Corretor de imóveis). Tenho CRECI. Meu WhatsApp: (11) 99999-0000.',
  );
});

test('e-mail entra na mensagem só quando foi preenchido', () => {
  assert.match(mensagemDeCandidatura({ ...base, email: ' ana@exemplo.com ' }), / Meu e-mail: ana@exemplo\.com\.$/);
  assert.doesNotMatch(mensagemDeCandidatura({ ...base, email: '   ' }), /e-mail/);
  assert.doesNotMatch(mensagemDeCandidatura(base), /e-mail/);
});

test('link do WhatsApp: número do site só com dígitos e texto codificado', () => {
  assert.match(WHATSAPP_RECRUTAMENTO, /^55\d{10,11}$/);
  assert.equal(
    linkDoWhatsApp('Olá & até'),
    `https://wa.me/${WHATSAPP_RECRUTAMENTO}?text=Ol%C3%A1%20%26%20at%C3%A9`,
  );
});
