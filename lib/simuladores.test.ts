import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SIMULADORES, SIMULADORES_CONFERIDOS_EM } from './simuladores.ts';

// Domínio oficial de cada banco: link para correspondente ou comparador não entra.
const DOMINIO_DO_BANCO: Record<string, RegExp> = {
  Caixa: /(^|\.)caixa\.gov\.br$/,
  'Banco do Brasil': /(^|\.)bb\.com\.br$/,
  Itaú: /(^|\.)itau\.com\.br$/,
  Bradesco: /(^|\.)bradesco$/,
  Santander: /(^|\.)santander\.com\.br$/,
};

test('cada simulador aponta para o site do próprio banco, em https', () => {
  for (const s of SIMULADORES) {
    const url = new URL(s.url);
    assert.equal(url.protocol, 'https:', s.banco);
    assert.match(url.hostname, DOMINIO_DO_BANCO[s.banco] ?? /^$/, `${s.banco}: ${url.hostname} não é domínio do banco`);
  }
});

test('os cinco bancos aparecem uma vez cada, e a conferência tem data', () => {
  assert.deepEqual(SIMULADORES.map((s) => s.banco).sort(), ['Banco do Brasil', 'Bradesco', 'Caixa', 'Itaú', 'Santander']);
  assert.ok(!Number.isNaN(Date.parse(SIMULADORES_CONFERIDOS_EM)));
});
