import assert from 'node:assert/strict';
import { test } from 'node:test';
import { siteIndexavel } from './indexacao.mjs';

const prod = { NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://www.lotusbrokers.com.br' };

test('produção no domínio oficial indexa por padrão', () => {
  assert.equal(siteIndexavel(prod), true);
  assert.equal(siteIndexavel({ ...prod, NEXT_PUBLIC_SITE_URL: 'https://www.lotusbrokers.com.br/' }), true, 'barra final não muda nada');
});

test('domínio oficial ausente ou malformado conta como produção', () => {
  assert.equal(siteIndexavel({ NODE_ENV: 'production' }), true);
  assert.equal(siteIndexavel({ NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'lotusbrokers' }), true);
  assert.equal(siteIndexavel({ NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://lotusbrokers.com.br' }), true, 'sem www também é o oficial');
});

test('staging e preview ficam em noindex sem precisar de variável', () => {
  assert.equal(siteIndexavel({ NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://staging.lotusbrokers.com.br' }), false);
  assert.equal(siteIndexavel({ NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'https://www.lotusbrokers.com.br' }), false, 'next dev nunca indexa');
});

test('SITE_INDEXABLE manda, nos dois sentidos', () => {
  assert.equal(siteIndexavel({ ...prod, SITE_INDEXABLE: 'false' }), false);
  assert.equal(siteIndexavel({ ...prod, SITE_INDEXABLE: '0' }), false);
  assert.equal(siteIndexavel({ NODE_ENV: 'development', SITE_INDEXABLE: 'true' }), true);
  assert.equal(siteIndexavel({ NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://staging.lotusbrokers.com.br', SITE_INDEXABLE: 'true' }), true);
});

test('valor irreconhecível cai na regra padrão', () => {
  assert.equal(siteIndexavel({ ...prod, SITE_INDEXABLE: 'talvez' }), true);
});
