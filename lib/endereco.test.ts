import assert from 'node:assert/strict';
import { test } from 'node:test';
import { juntarEndereco } from './endereco.ts';

test('rua com vírgula no fim não vira vírgula dobrada', () => {
  assert.equal(juntarEndereco(['Avenida Antonio Tavarnaro,', '1431', 'Jundiaí']), 'Avenida Antonio Tavarnaro, 1431, Jundiaí');
  assert.equal(juntarEndereco([' Rua A , ', ', 10']), 'Rua A, 10');
});

test('partes vazias, nulas ou só com espaço ficam de fora', () => {
  assert.equal(juntarEndereco(['Rua B', null, '', '   ', undefined, 'SP']), 'Rua B, SP');
  assert.equal(juntarEndereco([]), '');
});
