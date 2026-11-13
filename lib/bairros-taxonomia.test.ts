import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bairroDoGuia, imovelDoGuia, nomesDoBairro, subBairrosConhecidos } from './bairros-taxonomia.ts';

const GUIAS = ['Eloy Chaves', 'Jardim Ermida', 'Vianelo Bonfiglioli', 'Medeiros', 'Caxambu', 'Centro'];

test('sub-bairro encontra o bairro do guia', () => {
  // Jardim Ermida I e II são do guia do Jardim Ermida desde 13/11/2026.
  assert.equal(bairroDoGuia('Jardim Ermida II', GUIAS), 'Jardim Ermida');
  assert.equal(bairroDoGuia('Jardim Ermida I', GUIAS), 'Jardim Ermida');
  assert.equal(bairroDoGuia('Vila Sereno', GUIAS), 'Eloy Chaves');
});

test('as partes do Vianelo Bonfiglioli encontram o guia dele', () => {
  // O cadastro grava "Bonfiglioli" ou "Jardim Bonfiglioli"; o guia é dos dois.
  assert.equal(bairroDoGuia('Bonfiglioli', GUIAS), 'Vianelo Bonfiglioli');
  assert.equal(bairroDoGuia('Jardim Bonfiglioli', GUIAS), 'Vianelo Bonfiglioli');
  assert.equal(bairroDoGuia('Vianelo', GUIAS), 'Vianelo Bonfiglioli');
});

test('bairro que já é nível de guia responde por si mesmo', () => {
  assert.equal(bairroDoGuia('Eloy Chaves', GUIAS), 'Eloy Chaves');
  assert.equal(bairroDoGuia('Medeiros', GUIAS), 'Medeiros');
});

test('acento e caixa não atrapalham', () => {
  assert.equal(bairroDoGuia('JARDIM ERMIDA II', GUIAS), 'Jardim Ermida');
  assert.equal(bairroDoGuia('  jardim ermida ii  ', GUIAS), 'Jardim Ermida');
});

test('bairro de nível próprio não é agrupado sob outro', () => {
  // Confirmado pela Lotus: estes quatro são bairros, não sub-bairros.
  for (const b of ['Jardim Messina', 'Jardim Pacaembu', 'Vila Rio Branco', 'Jardim Colonial'])
    assert.equal(bairroDoGuia(b, GUIAS), null, b);
});

test('vazio e nulo devolvem null', () => {
  assert.equal(bairroDoGuia('', GUIAS), null);
  assert.equal(bairroDoGuia(null, GUIAS), null);
});

test('pai fora da lista de guias não vale', () => {
  // Se o guia de Eloy Chaves não existir, o sub-bairro não aponta para nada.
  assert.equal(bairroDoGuia('Jardim Ermida II', ['Medeiros']), null);
});

test('o guia procura por si e pelos filhos', () => {
  // Auditoria do site (28/10 e 13/11/2026): o Eloy Chaves mostrava os imóveis
  // do Jardim Ermida I e II, que têm guia próprio.
  assert.deepEqual(nomesDoBairro('Eloy Chaves'), ['Eloy Chaves', 'vila sereno', 'parque residencial eloy chaves']);
  assert.deepEqual(nomesDoBairro('Jardim Ermida'), ['Jardim Ermida', 'jardim ermida i', 'jardim ermida ii']);
});

test('imóvel entra no guia pelo bairro ou sub-bairro, na mesma cidade', () => {
  const eloy = { nome: 'Eloy Chaves', cidade: 'Jundiaí' };
  assert.equal(imovelDoGuia({ neighborhood: 'Vila Sereno', city: 'Jundiaí' }, eloy), true);
  assert.equal(imovelDoGuia({ neighborhood: 'Jardim Ermida II', city: 'Jundiaí' }, eloy), false);
  assert.equal(imovelDoGuia({ neighborhood: 'Jardim Ermida II', city: 'Jundiaí' }, { nome: 'Jardim Ermida', cidade: 'Jundiaí' }), true);
  // O "Centro" do guia é o de Itupeva: o Centro de Jundiaí não entra.
  const centroItupeva = { nome: 'Centro', cidade: 'Itupeva' };
  assert.equal(imovelDoGuia({ neighborhood: 'Centro', city: 'Jundiaí' }, centroItupeva), false);
  assert.equal(imovelDoGuia({ neighborhood: 'Centro', city: 'Itupeva' }, centroItupeva), true);
  // Acento e caixa não atrapalham, nem no bairro nem na cidade.
  const recanto = { nome: 'Recanto Quarto Centenário', cidade: 'Jundiaí' };
  assert.equal(imovelDoGuia({ neighborhood: 'Recanto IV Centenário', city: 'JUNDIAI' }, recanto), true);
  // Sem cidade no cadastro, vale o bairro; sem bairro, não entra.
  assert.equal(imovelDoGuia({ neighborhood: 'Medeiros', city: '' }, { nome: 'Medeiros', cidade: 'Jundiaí' }), true);
  assert.equal(imovelDoGuia({ neighborhood: '', city: 'Jundiaí' }, { nome: 'Medeiros', cidade: 'Jundiaí' }), false);
});

test('guia sem filhos procura só por si', () => {
  assert.deepEqual(nomesDoBairro('Caxambu'), ['Caxambu']);
});

test('o mapa é somente leitura para quem consulta', () => {
  const m = subBairrosConhecidos();
  m['inventado'] = 'Nada';
  assert.equal(bairroDoGuia('inventado', GUIAS), null);
});

// 4 condomínios gravados com o nome completo ficavam sem link para o guia (12/11/2026).
test('"Parque Residencial Eloy Chaves" é o guia de Eloy Chaves', () => {
  assert.equal(bairroDoGuia('Parque Residencial Eloy Chaves', ['Eloy Chaves', 'Medeiros']), 'Eloy Chaves');
});
