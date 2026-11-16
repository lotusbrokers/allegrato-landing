// Recortes da busca (lib/recortes-busca.ts): quem entra em "casas em Jundiaí".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RECORTES_DA_BUSCA, imoveisDoRecorte, recorteDaBusca, recortesDaCidade } from './recortes-busca.ts';

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

test('apartamentos em Jundiaí: apartamento e cobertura da cidade, só à venda', () => {
  const aptos = recorteDaBusca('apartamentos-em-jundiai');
  assert.ok(aptos);
  const lista = [
    imovel('AP1', 'Apartamento', 'Jundiaí'),
    imovel('AP2', 'COBERTURA', 'Jundiai'),
    imovel('CA1', 'Casa', 'Jundiaí'),
    imovel('AP3', 'Apartamento', 'Itupeva'),
    imovel('AP4', 'Apartamento', 'Jundiaí', 'alugar'),
  ];
  assert.deepEqual(imoveisDoRecorte(lista, aptos).map((i) => i.codigo), ['AP1', 'AP2']);
});

test('o guia de bairro acha os recortes da própria cidade, com ou sem acento', () => {
  const slugs = (cidade: string | null) => recortesDaCidade(cidade).map((r) => r.slug);
  assert.deepEqual(slugs('Jundiaí'), ['casas-em-jundiai', 'apartamentos-em-jundiai']);
  assert.deepEqual(slugs('JUNDIAI'), ['casas-em-jundiai', 'apartamentos-em-jundiai']);
  assert.deepEqual(slugs('Itupeva'), ['casas-em-itupeva']);
  assert.deepEqual(slugs('Campinas'), []);
  assert.deepEqual(slugs(''), []);
  assert.deepEqual(slugs(null), []);
});

test('slug desconhecido não é recorte, e os slugs não se repetem', () => {
  assert.equal(recorteDaBusca('apartamentos-em-marte'), undefined);
  const slugs = RECORTES_DA_BUSCA.map((r) => r.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const s of slugs) assert.match(s, /^[a-z0-9-]+$/);
});
