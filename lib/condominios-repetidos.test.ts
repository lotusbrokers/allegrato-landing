import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GRUPOS_DE_REPETIDOS, principalDoRepetido } from './condominios-repetidos.ts';

const TODOS = new Set(GRUPOS_DE_REPETIDOS.flat());

test('com os dois cadastros publicados, o segundo do grupo leva ao primeiro', () => {
  assert.equal(principalDoRepetido('tulipas-garden', TODOS), 'tulipas-garden-portaria-2');
  assert.equal(principalDoRepetido('vista-park-portaria-ii', TODOS), 'vista-park-portaria-i');
  assert.equal(principalDoRepetido('fatto-torres-de-sao-jose-portaria-1', TODOS), 'fatto-torres-de-sao-jose-portaria-2');
  assert.equal(principalDoRepetido('vista-park-portaria-i', TODOS), null, 'o que fica não redireciona');
});

test('se a Lotus despublicar o principal, o outro assume e o endereço antigo leva a ele', () => {
  const semPortariaI = new Set(['vista-park-portaria-ii']);
  assert.equal(principalDoRepetido('vista-park-portaria-ii', semPortariaI), null);
  assert.equal(principalDoRepetido('vista-park-portaria-i', semPortariaI), 'vista-park-portaria-ii');
});

test('condomínio fora dos grupos, ou grupo sem nada publicado, fica como está', () => {
  assert.equal(principalDoRepetido('chronos', TODOS), null);
  assert.equal(principalDoRepetido('tulipas-garden', new Set()), null);
});

test('nenhum slug aparece em dois grupos', () => {
  const todos = GRUPOS_DE_REPETIDOS.flat();
  assert.equal(new Set(todos).size, todos.length);
});
