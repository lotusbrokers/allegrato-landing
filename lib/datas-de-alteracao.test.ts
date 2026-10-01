import assert from 'node:assert/strict';
import { test } from 'node:test';
import datas from './datas-de-alteracao.json' with { type: 'json' };
import { dataDaRota, dataDoGrupo, maisRecente } from './datas-de-alteracao.ts';
import { LANDINGS_HTML, landingSlugs } from './landings.ts';
import { ROTAS_FIXAS } from './sitemap-rotas.ts';

const ISO_VALIDO = (s: string) => !Number.isNaN(new Date(s).getTime());

test('toda rota estática do sitemap tem data de commit no JSON', () => {
  const faltam = [
    ...ROTAS_FIXAS.map((f) => f.rota),
    ...[...landingSlugs()].map((s) => `/${s}`),
    ...LANDINGS_HTML.map((s) => `/${s}`),
  ].filter((rota) => !datas.rotas[rota as keyof typeof datas.rotas]);
  assert.deepEqual(faltam, [], `rode "npm run datas" — rotas sem data: ${faltam.join(', ')}`);
  assert.ok(datas.grupos.bairros && datas.grupos.construtoras, 'grupos bairros e construtoras precisam de data');
});

test('as datas são ISO válidas e nunca estão no futuro', () => {
  const agora = Date.now();
  for (const [rota, iso] of [...Object.entries(datas.rotas), ...Object.entries(datas.grupos)]) {
    assert.ok(ISO_VALIDO(iso), `${rota}: ${iso}`);
    assert.ok(new Date(iso).getTime() <= agora, `${rota} está no futuro: ${iso}`);
  }
});

test('dataDaRota e dataDoGrupo devolvem Date, e undefined para o desconhecido', () => {
  assert.ok(dataDaRota('/') instanceof Date);
  assert.ok(dataDoGrupo('bairros') instanceof Date);
  assert.equal(dataDaRota('/rota-que-nao-existe'), undefined);
});

test('maisRecente escolhe a maior data e ignora nulos e lixo', () => {
  const r = maisRecente(null, '2026-01-01T00:00:00.000Z', new Date('2026-03-01T00:00:00.000Z'), 'não é data', undefined);
  assert.equal(r?.toISOString(), '2026-03-01T00:00:00.000Z');
  assert.equal(maisRecente(null, undefined, 'x'), undefined);
});
