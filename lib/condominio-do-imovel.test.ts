import assert from 'node:assert/strict';
import { test } from 'node:test';
// Sem o sufixo .ts dos outros testes: com ele o `tsc --noEmit` acusa TS5097.
import { condominioDoImovel } from './condominio-do-imovel';

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
