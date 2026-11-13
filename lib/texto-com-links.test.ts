import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pedacosDoTexto, prepararCorpo } from './texto-com-links.ts';

const ALVOS = [
  { nome: 'Medeiros', href: '/lotus-bairro/medeiros' },
  { nome: 'Bonfiglioli', href: '/lotus-bairro/vianelo-bonfiglioli' },
  { nome: 'Jardim Bonfiglioli', href: '/lotus-bairro/vianelo-bonfiglioli' },
];

test('link explícito no texto vira pedaço de link', () => {
  assert.deepEqual(pedacosDoTexto('Inscreva-se [aqui](https://exemplo.com/f) hoje.'), [
    'Inscreva-se ',
    { texto: 'aqui', href: 'https://exemplo.com/f' },
    ' hoje.',
  ]);
});

test('a primeira menção de um bairro com guia vira link, só uma vez', () => {
  const usados = new Set<string>();
  assert.deepEqual(pedacosDoTexto('O Medeiros cresce. O Medeiros é calmo.', ALVOS, usados), [
    'O ',
    { texto: 'Medeiros', href: '/lotus-bairro/medeiros' },
    ' cresce. O Medeiros é calmo.',
  ]);
  // Já usado no artigo: o parágrafo seguinte não repete o link.
  assert.deepEqual(pedacosDoTexto('Mais sobre o Medeiros.', ALVOS, usados), ['Mais sobre o Medeiros.']);
});

test('nome mais longo vence e o nome tem de estar inteiro', () => {
  assert.deepEqual(pedacosDoTexto('Fica no Jardim Bonfiglioli.', ALVOS), [
    'Fica no ',
    { texto: 'Jardim Bonfiglioli', href: '/lotus-bairro/vianelo-bonfiglioli' },
    '.',
  ]);
  assert.deepEqual(pedacosDoTexto('Medeirosville não é bairro.', ALVOS), ['Medeirosville não é bairro.']);
});

test('dentro de link explícito não entra link automático', () => {
  assert.deepEqual(pedacosDoTexto('[Imóveis no Medeiros](/lotus-busca) e Medeiros.', ALVOS), [
    { texto: 'Imóveis no Medeiros', href: '/lotus-busca' },
    ' e ',
    { texto: 'Medeiros', href: '/lotus-bairro/medeiros' },
    '.',
  ]);
});

test('o corpo inteiro: título sem link, itens com link, uma vez por artigo', () => {
  const pronto = prepararCorpo([{ titulo: 'Morar no Medeiros' }, 'O Medeiros é calmo.', { itens: ['Perto do Medeiros'] }], ALVOS);
  assert.deepEqual(pronto[0], { titulo: 'Morar no Medeiros', nivel: undefined, itens: undefined, links: undefined, imagem: undefined, empreendimentos: undefined });
  assert.deepEqual(pronto[1], { paragrafo: ['O ', { texto: 'Medeiros', href: '/lotus-bairro/medeiros' }, ' é calmo.'] });
  assert.deepEqual(pronto[2], { titulo: undefined, nivel: undefined, itens: [['Perto do Medeiros']], links: undefined, imagem: undefined, empreendimentos: undefined });
});

test('os cartões de lançamento passam intactos, sem link automático no nome', () => {
  const cartao = { nome: 'Reserva Di Medeiros', href: '/reserva-di-medeiros', img: '/reserva-di-medeiros/capa.jpg', detalhe: 'Lançamento · Medeiros' };
  const [pronto] = prepararCorpo([{ titulo: 'Lançamentos no Medeiros', empreendimentos: [cartao] }], ALVOS);
  assert.deepEqual(pronto, { titulo: 'Lançamentos no Medeiros', nivel: undefined, itens: undefined, links: undefined, imagem: undefined, empreendimentos: [cartao] });
});

test('a foto passa intacta, sem link automático na descrição', () => {
  const foto = { src: '/blog/medeiros/praca.jpg', alt: 'Praça no Medeiros', largura: 1200, altura: 800, credito: 'Arquivo PMJ' };
  const [pronto] = prepararCorpo([{ imagem: foto }], ALVOS);
  assert.deepEqual(pronto, { titulo: undefined, nivel: undefined, itens: undefined, links: undefined, imagem: foto, empreendimentos: undefined });
});
