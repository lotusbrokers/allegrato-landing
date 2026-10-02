import assert from 'node:assert/strict';
import { test } from 'node:test';
import { descricaoComNome } from './descricao-com-nome.ts';

const NATURE = 'O Nature Village Jundiaí, no Eloy Chaves, oferece um conceito de moradia em meio à natureza.';
const FLEX = 'Localizado no Jardim Ana Maria, o Flex Jundiaí reúne conforto e praticidade.';

test('texto que já cita o nome exato fica como está', () => {
  assert.equal(descricaoComNome(NATURE, 'Nature Village'), NATURE);
  assert.equal(descricaoComNome('  Tudo sobre morar no Saint Marie.  ', 'Saint Marie'), 'Tudo sobre morar no Saint Marie.');
});

test('fases com o mesmo texto ganham o próprio nome na frente e deixam de ser iguais', () => {
  assert.equal(descricaoComNome(NATURE, 'Nature Village II'), `Nature Village II: ${NATURE}`);
  const flexI = descricaoComNome(FLEX, 'Flex I');
  const flexII = descricaoComNome(FLEX, 'Flex II');
  assert.equal(flexI, `Flex I: ${FLEX}`);
  assert.equal(flexII, `Flex II: ${FLEX}`);
  assert.notEqual(flexI, flexII);
});

test('o nome tem de aparecer inteiro: "Flex I" não está citado em "Flex II"', () => {
  assert.equal(descricaoComNome('O Flex II tem lazer completo.', 'Flex I'), 'Flex I: O Flex II tem lazer completo.');
  assert.equal(descricaoComNome('O Flex II tem lazer completo.', 'Flex II'), 'O Flex II tem lazer completo.');
});

test('caracteres especiais no nome não quebram a busca, e nome vazio não muda nada', () => {
  assert.equal(descricaoComNome('Morar no Residencial (Fase 2) é bom.', 'Residencial (Fase 2)'), 'Morar no Residencial (Fase 2) é bom.');
  assert.equal(descricaoComNome('Texto qualquer.', '  '), 'Texto qualquer.');
});
