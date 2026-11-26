import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CORRECOES_DE_CADASTRO } from './correcoes-cadastro.ts';
import { PRECO_SOB_CONSULTA, SEM_PRECO, semPrecoSobConsulta } from './preco-sob-consulta.ts';

const cadastro = { nome: 'Maxx Santa Angela', preco_texto: 'a partir de R$ 941.276', preco_num: 941275.7, specs: '71–98 m² · 2 e 3 dorms' };

test('lançamento com valor a consultar perde o preço e mantém o resto', () => {
  const r = semPrecoSobConsulta(cadastro, 'maxx-santa-angela');
  assert.equal(r.preco_texto, null);
  assert.equal(r.preco_num, null);
  assert.equal(r.specs, cadastro.specs);
  assert.equal(cadastro.preco_texto, 'a partir de R$ 941.276', 'não altera o objeto recebido');
});

test('fora da lista (e sem slug), o preço continua', () => {
  assert.equal(semPrecoSobConsulta(cadastro, 'reserva-castanheira'), cadastro);
  assert.equal(semPrecoSobConsulta(cadastro, 'vigore'), cadastro);
  assert.equal(semPrecoSobConsulta(cadastro, 'doppio-jundiai'), cadastro);
  assert.equal(semPrecoSobConsulta(cadastro, null), cadastro);
});

// Pedido da Lotus em 05/10/2026: todas as landings da Santa Angela, menos o
// Reserva Castanheira, que recebeu a tabela de outubro. O Jardins do Horto
// voltou a ter preço em 27/10/2026, também a pedido da Lotus. Em 26/11/2026
// ("mostre apenas os deste mês de novembro") voltaram os que têm a tabela de
// novembro; ficaram o Altos da Avenida (vendido) e o Maxx (tabela de julho).
test('Santa Angela: valor a consultar só no Altos da Avenida e no Maxx', () => {
  assert.deepEqual([...PRECO_SOB_CONSULTA].sort(), ['altos-da-avenida', 'maxx-santa-angela']);
  for (const slug of ['allegrato', 'gioviale', 'jardins-do-horto', 'portal-dos-lagos', 'reserva-castanheira', 'resort-prime', 'santorini', 'vigore']) {
    assert.equal(PRECO_SOB_CONSULTA.has(slug), false, `${slug} deveria mostrar o preço`);
  }
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
