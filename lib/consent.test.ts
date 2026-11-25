// Marca de consentimento que roda antes da primeira pintura (lib/consent.ts):
// com o cookie, o <html> ganha a classe que esconde o aviso; sem ele, não.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLASSE_COM_CONSENTIMENTO, CONSENT_MARCA_SCRIPT } from './consent.ts';

function rodar(cookie: string): string[] {
  const classes: string[] = [];
  const documento = { cookie, documentElement: { classList: { add: (c: string) => classes.push(c) } } };
  new Function('document', CONSENT_MARCA_SCRIPT)(documento);
  return classes;
}

test('com o cookie de consentimento, o <html> é marcado', () => {
  assert.deepEqual(rodar('lotus_consent=all'), [CLASSE_COM_CONSENTIMENTO]);
  assert.deepEqual(rodar('_ga=GA1.1.1; lotus_consent=essential; outro=1'), [CLASSE_COM_CONSENTIMENTO]);
});

test('sem escolha válida, o aviso continua visível', () => {
  assert.deepEqual(rodar(''), []);
  assert.deepEqual(rodar('lotus_consent=talvez'), []);
  assert.deepEqual(rodar('xlotus_consent=all'), []);
});
