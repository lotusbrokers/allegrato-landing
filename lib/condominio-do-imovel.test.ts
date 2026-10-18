import assert from 'node:assert/strict';
import { test } from 'node:test';
// Sem o sufixo .ts dos outros testes: com ele o `tsc --noEmit` acusa TS5097.
import { condominioDoImovel, galeriaDoImovel } from './condominio-do-imovel';

const foto = (url: string, isCapa = false) => ({ id: url, url, isCapa, legenda: '' });

test('sem condomínio (imóvel sem condominio_id ou condomínio não publicado): nada', () => {
  assert.equal(condominioDoImovel(null), null);
});

test('condomínio publicado sem fotos: nada, a seção não aparece', () => {
  assert.equal(condominioDoImovel({ nome: 'Reserva da Mata', fotos: [] }), null);
  assert.equal(condominioDoImovel({ nome: 'Reserva da Mata', fotos: null }), null);
  assert.equal(condominioDoImovel({ nome: 'Reserva da Mata', fotos: [{ url: '' }] }), null);
});

test('capa no meio da lista vai para a frente; o resto mantém a ordem do cadastro', () => {
  const r = condominioDoImovel({ nome: 'New Garden', fotos: [foto('a'), foto('b'), foto('c', true), foto('d')] });
  assert.deepEqual(r?.fotos.map((f) => f.url), ['c', 'a', 'b', 'd']);
});

test('sem capa marcada: ordem do cadastro', () => {
  const r = condominioDoImovel({ nome: 'Real Park', fotos: [foto('a'), foto('b'), foto('c')] });
  assert.deepEqual(r?.fotos.map((f) => f.url), ['a', 'b', 'c']);
});

test('nome e slug batem com a rota /lotus-condominio/[slug]', () => {
  const r = condominioDoImovel({ nome: 'Pleno Novo Engordadouro', fotos: [foto('a')] });
  assert.equal(r?.nome, 'Pleno Novo Engordadouro');
  assert.equal(r?.slug, 'pleno-novo-engordadouro');
  assert.equal(r?.titulo, 'O condomínio Pleno Novo Engordadouro');
});

test('nome que já começa com "Condomínio" não repete a palavra no título', () => {
  const r = condominioDoImovel({ nome: 'Condomínio Chácara Primavera', fotos: [foto('a')] });
  assert.equal(r?.titulo, 'O condomínio Chácara Primavera');
  assert.equal(r?.slug, 'condominio-chacara-primavera');
});

// Galeria da página do imóvel: as fotos da unidade primeiro, as do condomínio
// depois (pedido do dono em 18/10, prompt 75).
const urls = (g: { url: string }[]) => g.map((f) => f.url);
const cond = (nome: string, fotos: ReturnType<typeof foto>[]) => condominioDoImovel({ nome, fotos });

test('galeria sem condomínio: só as fotos do imóvel, capa primeiro, como antes', () => {
  const g = galeriaDoImovel([foto('a'), foto('b', true), foto('c')], null);
  assert.deepEqual(urls(g), ['b', 'a', 'c']);
  assert.ok(g.every((f) => !f.doCondominio));
});

test('galeria com condomínio sem foto: igual à do imóvel sozinho', () => {
  const fotos = [foto('a'), foto('b', true)];
  assert.deepEqual(galeriaDoImovel(fotos, cond('Real Park', [])), galeriaDoImovel(fotos, null));
});

test('capa no meio das duas listas: capa do imóvel no topo, a do condomínio só depois da última do imóvel', () => {
  // 8 fotos do imóvel com a capa na 3ª e 14 do condomínio com a capa na 5ª,
  // o mesmo caso do critério dos feeds.
  const imovel = Array.from({ length: 8 }, (_, i) => foto(`i${i + 1}`, i === 2));
  const condo = Array.from({ length: 14 }, (_, i) => foto(`c${i + 1}`, i === 4));
  const g = galeriaDoImovel(imovel, cond('Pleno Novo Engordadouro', condo));
  assert.deepEqual(urls(g), [
    'i3', 'i1', 'i2', 'i4', 'i5', 'i6', 'i7', 'i8',
    'c5', 'c1', 'c2', 'c3', 'c4', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12', 'c13', 'c14',
  ]);
  assert.deepEqual(g.map((f) => f.doCondominio), [...Array(8).fill(false), ...Array(14).fill(true)]);
});

test('foto do condomínio leva "Condomínio <nome>" na legenda, seguido da legenda dela', () => {
  const g = galeriaDoImovel(
    [{ ...foto('a'), legenda: 'Sala' }],
    cond('Vila Sereno', [{ ...foto('c1'), legenda: 'Piscina' }, foto('c2')]),
  );
  assert.deepEqual(g.map((f) => f.legenda), ['Sala', 'Condomínio Vila Sereno · Piscina', 'Condomínio Vila Sereno']);
  // Nome que já começa com "Condomínio" não repete a palavra.
  const g2 = galeriaDoImovel([], cond('Condomínio Chácara Primavera', [foto('c1')]));
  assert.equal(g2[0].legenda, 'Condomínio Chácara Primavera');
});

test('URL repetida entre as listas fica uma vez só, no lugar da foto do imóvel', () => {
  const g = galeriaDoImovel([foto('a', true), foto('x')], cond('New Garden', [foto('x', true), foto('c')]));
  assert.deepEqual(urls(g), ['a', 'x', 'c']);
  assert.equal(g[1].doCondominio, false);
});

test('sem URL vazia e sem URL repetida dentro da mesma lista', () => {
  const g = galeriaDoImovel([foto(''), foto('a'), foto('a')], cond('Real Park', [foto('c'), foto('c')]));
  assert.deepEqual(urls(g), ['a', 'c']);
});

test('unidade sem foto nenhuma: a galeria é só do condomínio, com a capa dele primeiro', () => {
  const g = galeriaDoImovel(null, cond('Maraville Nature', [foto('c1'), foto('c2', true)]));
  assert.deepEqual(urls(g), ['c2', 'c1']);
  assert.ok(g.every((f) => f.doCondominio));
  assert.deepEqual(galeriaDoImovel([], null), []);
});
