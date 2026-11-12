import assert from 'node:assert/strict';
import { test } from 'node:test';
import { destinoDoImovelQueSaiu } from './imovel-que-saiu.ts';

test('o imóvel que saiu leva à busca do mesmo tipo, pelo prefixo do código', () => {
  assert.equal(destinoDoImovelQueSaiu('AP0685'), '/lotus-busca?tipo=Apartamento');
  assert.equal(destinoDoImovelQueSaiu('ca0064'), '/lotus-busca?tipo=Casa');
  assert.equal(destinoDoImovelQueSaiu('TE0012'), '/lotus-busca?tipo=Terreno');
});

test('prefixo desconhecido ou código estranho cai na busca inteira', () => {
  assert.equal(destinoDoImovelQueSaiu('XX0001'), '/lotus-busca');
  assert.equal(destinoDoImovelQueSaiu(''), '/lotus-busca');
  assert.equal(destinoDoImovelQueSaiu('qualquer-coisa'), '/lotus-busca');
});
