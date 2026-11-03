// Depoimentos da home (lib/depoimentos.ts): o formato da nota e a lista que o
// carrossel percorre.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEPOIMENTOS, NOTA_NO_GOOGLE, notaComVirgula } from './depoimentos.ts';

test('nota sai com uma casa decimal e vírgula, como no Google', () => {
  assert.equal(notaComVirgula(5), '5,0');
  assert.equal(notaComVirgula(4.8), '4,8');
  assert.equal(notaComVirgula(NOTA_NO_GOOGLE.nota), '5,0');
});

test('cada depoimento tem autor e texto, sem repetir autor', () => {
  // A lista vazia derrubaria o carrossel (índice % 0) e a seção sumiria da home.
  assert.ok(DEPOIMENTOS.length > 0);
  for (const d of DEPOIMENTOS) {
    assert.ok(d.autor.trim(), 'autor vazio');
    assert.ok(d.texto.trim(), `texto vazio de ${d.autor}`);
  }
  const autores = DEPOIMENTOS.map((d) => d.autor);
  assert.equal(new Set(autores).size, autores.length);
});
