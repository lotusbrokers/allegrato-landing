import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agruparPorConstrutora, construtoraPorSlug } from './construtoras-paginas.ts';

const l = (name: string, builder: string, img: string | null = null) => ({ name, builder, img });

test('agrupa as grafias da mesma construtora numa página só', () => {
  // "Santa Angela" e "Santa Ângela" convivem no dashboard, que é campo livre.
  // Duas páginas para a mesma empresa é exatamente o que não pode acontecer.
  const cs = agruparPorConstrutora([
    l('Allegrato', 'Santa Angela'),
    l('Maxx', 'Santa Ângela'),
    l('Vigóre', 'SANTA ANGELA'),
  ]);
  assert.equal(cs.length, 1);
  assert.equal(cs[0].nome, 'Santa Ângela');
  assert.equal(cs[0].slug, 'santa-angela');
  assert.equal(cs[0].lancamentos.length, 3);
});

test('lançamento sem construtora não cria página', () => {
  const cs = agruparPorConstrutora([l('A', ''), l('B', '   '), l('C', 'Inkkorp')]);
  assert.deepEqual(cs.map((c) => c.nome), ['Inkkorp']);
});

test('preenchimento genérico do dashboard não vira construtora', () => {
  // 'Construtora' e 'Alto padrão' ocupam o campo em várias entradas curadas —
  // virariam uma página juntando empresas diferentes sob o mesmo rótulo.
  const cs = agruparPorConstrutora([l('A', 'Construtora'), l('B', 'Alto padrão'), l('C', 'Tebas')]);
  assert.deepEqual(cs.map((c) => c.nome), ['Tebas']);
});

test('a capa é emprestada do primeiro empreendimento que tem foto', () => {
  const cs = agruparPorConstrutora([
    l('Sem foto', 'Inkkorp', null),
    l('Epic', 'Inkkorp', '/epic-jundiai/capa.jpg'),
  ]);
  assert.deepEqual(cs[0].capa, { img: '/epic-jundiai/capa.jpg', empreendimento: 'Epic' });
});

test('construtora sem nenhuma foto fica sem capa, e não com imagem inventada', () => {
  const cs = agruparPorConstrutora([l('A', 'Inkkorp', null)]);
  assert.equal(cs[0].capa, null);
});

test('ordem alfabética, como na listagem de lançamentos', () => {
  const cs = agruparPorConstrutora([l('A', 'Tebas'), l('B', 'F A Oliva'), l('C', 'Inkkorp')]);
  assert.deepEqual(cs.map((c) => c.nome), ['F A Oliva', 'Inkkorp', 'Tebas']);
});

test('acervo vazio devolve lista vazia, e não quebra', () => {
  assert.deepEqual(agruparPorConstrutora([]), []);
});

test('busca por slug acha e devolve null quando não existe', () => {
  const cs = agruparPorConstrutora([l('A', 'Mac Lucer')]);
  assert.equal(construtoraPorSlug(cs, 'mac-lucer')?.nome, 'Mac Lucer');
  assert.equal(construtoraPorSlug(cs, 'nao-existe'), null);
});
