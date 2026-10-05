import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CORRECOES_DE_CADASTRO, corrigirCadastro, type CamposCorrigiveis } from './correcoes-cadastro.ts';

/** Cadastro como o dashboard publicava em 29/09/2026. */
const cadastro = (campos: Partial<CamposCorrigiveis> = {}): CamposCorrigiveis & { nome: string } => ({
  nome: 'Empreendimento',
  preco_texto: null,
  preco_num: null,
  specs: null,
  bairro: null,
  estagio: null,
  ...campos,
});

test('cadastro defasado recebe o valor da tabela oficial', () => {
  const r = corrigirCadastro(cadastro({ preco_texto: 'a partir de R$ 397.896', preco_num: 397896 }), 'vigore');
  assert.equal(r.preco_texto, 'a partir de R$ 410.191');
  assert.equal(r.preco_num, 410191.2);
});

test('cadastro atualizado no dashboard vence a correção', () => {
  // Alguém corrigiu lá: a linha deixa de casar e o banco volta a mandar.
  const atualizado = cadastro({ preco_texto: 'a partir de R$ 415.000', preco_num: 415000 });
  assert.equal(corrigirCadastro(atualizado, 'vigore'), atualizado);
});

test('cada campo expira sozinho', () => {
  // Texto já corrigido no dashboard, número ainda não.
  const r = corrigirCadastro(cadastro({ preco_texto: 'a partir de R$ 990.000', preco_num: 941498 }), 'resort-prime');
  assert.equal(r.preco_texto, 'a partir de R$ 990.000');
  assert.equal(r.preco_num, 988992.74);
});

test('estágio vazio é preenchido; estágio informado é respeitado', () => {
  assert.equal(corrigirCadastro(cadastro({ estagio: null }), 'portal-dos-lagos').estagio, 'Entregue');
  assert.equal(corrigirCadastro(cadastro({ estagio: '  ' }), 'portal-dos-lagos').estagio, 'Entregue');
  assert.equal(corrigirCadastro(cadastro({ estagio: 'Em obras' }), 'portal-dos-lagos').estagio, 'Em obras');
});

test('nome, bairro e metragem do Maxx', () => {
  const r = corrigirCadastro(cadastro({ nome: 'Maxx Santa Ângela', bairro: 'Horto Florestal', specs: '51–98 m² · 2 e 3 dorms' }), 'maxx-santa-angela');
  assert.equal(r.nome, 'Maxx Santa Angela');
  assert.equal(r.bairro, 'Vila Galvão');
  assert.equal(r.specs, '71–98 m² · 2 e 3 dorms');
});

test('Reserva Castanheira com a tabela de 01/10/2026', () => {
  const r = corrigirCadastro(cadastro({ preco_texto: 'a partir de R$ 460.582', preco_num: 460582, specs: 'Lotes a partir de 250 m²' }), 'reserva-castanheira');
  assert.equal(r.preco_texto, 'a partir de R$ 461.734');
  assert.equal(r.preco_num, 461734.74);
  assert.equal(r.specs, 'Lotes a partir de 250 m²');
});

test('número que chega como texto do banco ainda casa', () => {
  const r = corrigirCadastro(cadastro({ preco_num: '881875' as unknown as number }), 'altos-da-avenida');
  assert.equal(r.preco_num, 884223.72);
});

test('empreendimento sem correção e slug ausente passam intactos', () => {
  const c = cadastro({ preco_texto: 'a partir de R$ 397.896' });
  assert.equal(corrigirCadastro(c, 'gioviale'), c);
  assert.equal(corrigirCadastro(c, null), c);
});

test('não altera o objeto recebido e preserva os outros campos', () => {
  const c = cadastro({ preco_texto: 'a partir de R$ 358.182', preco_num: 358182 });
  const r = corrigirCadastro(c, 'allegrato');
  assert.equal(c.preco_texto, 'a partir de R$ 358.182');
  assert.equal(r.nome, 'Empreendimento');
  assert.equal(r.preco_texto, 'a partir de R$ 365.345');
});

test('toda correção muda alguma coisa', () => {
  for (const [slug, lista] of Object.entries(CORRECOES_DE_CADASTRO))
    for (const c of lista) assert.notEqual(c.de, c.para, `${slug}/${c.campo}: "de" igual a "para"`);
});
