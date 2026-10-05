import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CORRECOES_DE_CADASTRO } from './correcoes-cadastro.ts';
import { PRECO_SOB_CONSULTA, SEM_PRECO, semPrecoSobConsulta } from './preco-sob-consulta.ts';

const cadastro = { nome: 'Vigóre', preco_texto: 'a partir de R$ 410.191', preco_num: 410191.2, specs: '53–54 m² · 2 dorms' };

test('lançamento com valor a consultar perde o preço e mantém o resto', () => {
  const r = semPrecoSobConsulta(cadastro, 'vigore');
  assert.equal(r.preco_texto, null);
  assert.equal(r.preco_num, null);
  assert.equal(r.specs, cadastro.specs);
  assert.equal(cadastro.preco_texto, 'a partir de R$ 410.191', 'não altera o objeto recebido');
});

test('fora da lista (e sem slug), o preço continua', () => {
  assert.equal(semPrecoSobConsulta(cadastro, 'reserva-castanheira'), cadastro);
  assert.equal(semPrecoSobConsulta(cadastro, 'doppio-jundiai'), cadastro);
  assert.equal(semPrecoSobConsulta(cadastro, null), cadastro);
});

// Pedido da Lotus em 05/10/2026: todas as landings da Santa Angela, menos o
// Reserva Castanheira, que recebeu a tabela de outubro.
test('Santa Angela: valor a consultar em todas, menos o Reserva Castanheira', () => {
  const santaAngela = ['allegrato', 'altos-da-avenida', 'gioviale', 'jardins-do-horto', 'maxx-santa-angela', 'portal-dos-lagos', 'resort-prime', 'santorini', 'vigore'];
  assert.deepEqual([...PRECO_SOB_CONSULTA].sort(), santaAngela);
  assert.equal(PRECO_SOB_CONSULTA.has('reserva-castanheira'), false);
  assert.equal(SEM_PRECO, 'Valor a consultar');
});

// Uma correção de preço para quem está "a consultar" não aparece hoje, mas
// voltaria sozinha, com o valor vencido, no dia em que o slug saísse da lista.
test('nenhum lançamento a consultar guarda correção de preço', () => {
  for (const slug of PRECO_SOB_CONSULTA) {
    const precos = (CORRECOES_DE_CADASTRO[slug] ?? []).filter((c) => c.campo === 'preco_texto' || c.campo === 'preco_num');
    assert.deepEqual(precos, [], `${slug} ainda tem correção de preço`);
  }
});
