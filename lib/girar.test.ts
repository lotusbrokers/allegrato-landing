// girar (lib/girar.ts): listas de "veja também" em roda.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { girar } from './girar.ts';

test('começa no índice pedido e dá a volta', () => {
  assert.deepEqual(girar(['a', 'b', 'c', 'd'], 2), ['c', 'd', 'a', 'b']);
  assert.deepEqual(girar(['a', 'b', 'c', 'd'], 3), ['d', 'a', 'b', 'c']);
});

test('início fora da lista devolve a lista como está, sem mexer na original', () => {
  const lista = ['a', 'b', 'c'];
  assert.deepEqual(girar(lista, 0), ['a', 'b', 'c']);
  assert.deepEqual(girar(lista, 3), ['a', 'b', 'c']);
  assert.deepEqual(girar(lista, -1), ['a', 'b', 'c']);
  assert.deepEqual(girar([], 1), []);
  assert.notEqual(girar(lista, 1), lista);
  assert.deepEqual(lista, ['a', 'b', 'c']);
});

test('em roda, cada item aparece entre os seguintes de algum outro', () => {
  const lista = ['a', 'b', 'c', 'd', 'e', 'f'];
  const recebem = new Set<string>();
  lista.forEach((_, i) => girar(lista, i + 1).filter((x) => x !== lista[i]).slice(0, 2).forEach((x) => recebem.add(x)));
  assert.deepEqual([...recebem].sort(), lista);
});
