import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canonizarEstagio,
  opcoesDeFiltro,
  passaNosFiltros,
  SEM_FILTRO,
  type ItemFiltravel,
} from './filtros-lancamentos.ts';

/**
 * Os casos abaixo saem do acervo real de 08/09/2026, e não de exemplos
 * inventados: são exatamente as formas pelas quais o filtro estava quebrado.
 */

const item = (p: Partial<ItemFiltravel & { builder: string }> = {}) => ({
  city: 'Jundiaí',
  stage: 'Lançamento',
  type: '',
  priceNum: 0,
  builder: '',
  ...p,
});

const nenhum = { cidade: SEM_FILTRO, estagio: SEM_FILTRO, tipologia: SEM_FILTRO, preco: SEM_FILTRO, construtora: SEM_FILTRO };

/* ---------- canonizarEstagio ---------- */

test('as duas grafias do mesmo estágio viram um rótulo só', () => {
  assert.equal(canonizarEstagio('Obras'), 'Em obras');
  assert.equal(canonizarEstagio('Em obras'), 'Em obras');
  assert.equal(canonizarEstagio('Pronto'), 'Pronto para morar');
  assert.equal(canonizarEstagio('Pronto para morar'), 'Pronto para morar');
});

test('acento e caixa não criam estágio novo', () => {
  assert.equal(canonizarEstagio('LANÇAMENTO'), 'Lançamento');
  assert.equal(canonizarEstagio('  lancamento '), 'Lançamento');
  assert.equal(canonizarEstagio('Pré-lançamento'), 'Pré-lançamento');
});

test('estágio não informado é vazio, e não vira opção', () => {
  assert.equal(canonizarEstagio(''), '');
  assert.equal(canonizarEstagio('   '), '');
  assert.equal(canonizarEstagio(null), '');
  assert.equal(canonizarEstagio(undefined), '');
});

test('estágio desconhecido sobrevive — o dash pode cadastrar um novo amanhã', () => {
  assert.equal(canonizarEstagio('Breve lançamento'), 'Breve lançamento');
});

/* ---------- opcoesDeFiltro ---------- */

test('a opção existe porque existe imóvel para ela', () => {
  const o = opcoesDeFiltro([
    item({ city: 'Jundiaí' }),
    item({ city: 'Campinas' }),
    item({ city: 'Louveira' }),
  ]);
  // Campinas e Louveira existiam no acervo e não tinham opção; Vinhedo tinha
  // opção e não tinha imóvel. Agora a lista é exatamente o que há.
  assert.deepEqual(o.cidades, ['Campinas', 'Jundiaí', 'Louveira']);
});

test('as duas grafias do estágio viram uma opção só', () => {
  const o = opcoesDeFiltro([item({ stage: 'Obras' }), item({ stage: 'Em obras' }), item({ stage: 'Pronto' })]);
  assert.deepEqual(o.estagios, ['Em obras', 'Pronto para morar']);
});

test('campo vazio em todos não vira opção nenhuma', () => {
  const o = opcoesDeFiltro([item({ type: '' }), item({ type: '   ' })]);
  assert.deepEqual(o.tipologias, []);
});

test('sem preço cadastrado, o seletor de preço não deve aparecer', () => {
  assert.equal(opcoesDeFiltro([item({ priceNum: 0 }), item({ priceNum: 0 })]).temPreco, false);
  assert.equal(opcoesDeFiltro([item({ priceNum: 0 }), item({ priceNum: 750000 })]).temPreco, true);
});

test('acervo vazio não quebra', () => {
  const o = opcoesDeFiltro([]);
  assert.deepEqual(o, { cidades: [], estagios: [], tipologias: [], temPreco: false });
});

/* ---------- passaNosFiltros ---------- */

test('sem filtro, todo mundo passa', () => {
  assert.equal(passaNosFiltros(item(), nenhum), true);
});

test('o filtro de estágio alcança as duas grafias', () => {
  const emObras = { ...nenhum, estagio: 'Em obras' };
  assert.equal(passaNosFiltros(item({ stage: 'Obras' }), emObras), true);
  assert.equal(passaNosFiltros(item({ stage: 'Em obras' }), emObras), true);
  assert.equal(passaNosFiltros(item({ stage: 'Lançamento' }), emObras), false);
});

test('quem não tem estágio some quando se filtra por estágio', () => {
  assert.equal(passaNosFiltros(item({ stage: '' }), { ...nenhum, estagio: 'Em obras' }), false);
});

test('filtros combinam com E, não com OU', () => {
  const f = { ...nenhum, cidade: 'Jundiaí', estagio: 'Em obras' };
  assert.equal(passaNosFiltros(item({ city: 'Jundiaí', stage: 'Em obras' }), f), true);
  assert.equal(passaNosFiltros(item({ city: 'Jundiaí', stage: 'Lançamento' }), f), false);
  assert.equal(passaNosFiltros(item({ city: 'Itupeva', stage: 'Em obras' }), f), false);
});

test('o bug do preço: sem valor cadastrado o imóvel não passa em faixa nenhuma', () => {
  const ate600 = { ...nenhum, preco: '600000' };
  // Antes 0 <= 600000 era verdadeiro e o acervo inteiro passava.
  assert.equal(passaNosFiltros(item({ priceNum: 0 }), ate600), false);
  assert.equal(passaNosFiltros(item({ priceNum: 550000 }), ate600), true);
  assert.equal(passaNosFiltros(item({ priceNum: 700000 }), ate600), false);
});

test('construtora filtra pelo nome canônico já gravado no item', () => {
  const f = { ...nenhum, construtora: 'Santa Ângela' };
  assert.equal(passaNosFiltros(item({ builder: 'Santa Ângela' }), f), true);
  assert.equal(passaNosFiltros(item({ builder: '' }), f), false);
});
