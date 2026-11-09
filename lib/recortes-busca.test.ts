// Recortes da busca (lib/recortes-busca.ts): quem entra em "casas em Jundiaí".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RECORTES_DA_BUSCA, imoveisDoRecorte, recorteDaBusca, recorteDaCidade } from './recortes-busca.ts';

const imovel = (codigo: string, type: string, city: string, fin: 'comprar' | 'alugar' = 'comprar') => ({ codigo, type, city, fin });

test('casas em Jundiaí: casa, sobrado e casa em condomínio da cidade, só à venda', () => {
  const jundiai = recorteDaBusca('casas-em-jundiai');
  assert.ok(jundiai);
  const lista = [
    imovel('CA1', 'Casa', 'Jundiaí'),
    imovel('SO1', 'Sobrado', 'Jundiaí'),
    imovel('CC1', 'Casa em Condomínio', 'JUNDIAI'),
    imovel('AP1', 'Apartamento', 'Jundiaí'),
    imovel('TE1', 'Terreno', 'Jundiaí'),
    imovel('CA2', 'Casa', 'Itupeva'),
    imovel('CA3', 'Casa', 'Jundiaí', 'alugar'),
  ];
  assert.deepEqual(imoveisDoRecorte(lista, jundiai).map((i) => i.codigo), ['CA1', 'SO1', 'CC1']);
});

test('casas em Itupeva não pega as de Jundiaí', () => {
  const itupeva = recorteDaBusca('casas-em-itupeva');
  assert.ok(itupeva);
  assert.deepEqual(
    imoveisDoRecorte([imovel('CA1', 'Casa', 'Jundiaí'), imovel('CA2', 'Casa', 'Itupeva')], itupeva).map((i) => i.codigo),
    ['CA2'],
  );
});

test('o guia de bairro acha o recorte da própria cidade, com ou sem acento', () => {
  assert.equal(recorteDaCidade('Jundiaí')?.slug, 'casas-em-jundiai');
  assert.equal(recorteDaCidade('JUNDIAI')?.slug, 'casas-em-jundiai');
  assert.equal(recorteDaCidade('Itupeva')?.slug, 'casas-em-itupeva');
  assert.equal(recorteDaCidade('Campinas'), undefined);
  assert.equal(recorteDaCidade(''), undefined);
  assert.equal(recorteDaCidade(null), undefined);
});

test('slug desconhecido não é recorte, e os slugs não se repetem', () => {
  assert.equal(recorteDaBusca('apartamentos-em-marte'), undefined);
  const slugs = RECORTES_DA_BUSCA.map((r) => r.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const s of slugs) assert.match(s, /^[a-z0-9-]+$/);
});
