import assert from 'node:assert/strict';
import { test } from 'node:test';
import { creciEmTexto, descricaoDoPerfil, estaNoSite, hrefDoCorretor, slugDoNome, slugsDosCorretores, tituloDoPerfil } from './corretores-perfil.ts';

test('o slug sai do nome sem acento, sem espaço duplo e sem caractere solto', () => {
  // O cadastro tem espaço duplo em vários nomes ("Mariana  Mamede").
  assert.equal(slugDoNome('Mariana  Mamede'), 'mariana-mamede');
  assert.equal(slugDoNome('Gabriele Fávaro'), 'gabriele-favaro');
  assert.equal(slugDoNome(' Fábio Gonçalves '), 'fabio-goncalves');
  assert.equal(slugDoNome("Ana D'Ávila"), 'ana-d-avila');
  assert.equal(hrefDoCorretor('mariana-mamede'), '/lotus-corretores/mariana-mamede');
});

test('nome repetido ganha sufixo pela ordem do id, sem depender da ordem da lista', () => {
  const a = { id: 'b-2', name: 'Lara Matos' };
  const b = { id: 'a-1', name: 'Lara  Matos' };
  const c = { id: 'c-3', name: 'Celso Franciscon' };
  const slugs = slugsDosCorretores([a, b, c]);
  assert.deepEqual(slugs, { 'a-1': 'lara-matos', 'b-2': 'lara-matos-2', 'c-3': 'celso-franciscon' });
  assert.deepEqual(slugsDosCorretores([c, b, a]), slugs);
});

test('só quem tem CRECI aparece no site', () => {
  assert.equal(estaNoSite({ creci: '123.456-F' }), true);
  assert.equal(estaNoSite({ creci: '  ' }), false);
  assert.equal(estaNoSite({ creci: null }), false);
});

test('o título cabe em 70 caracteres e não marca gênero', () => {
  assert.equal(tituloDoPerfil('Mariana  Mamede'), 'Mariana Mamede: especialista em imóveis em Jundiaí | Lotus Brokers');
  const longo = tituloDoPerfil('Maria Aparecida dos Santos Albuquerque');
  assert.ok(longo.length <= 70, longo);
  assert.ok(!/corretor/i.test(tituloDoPerfil('Humberto Martinez')));
});

test('a descrição usa só o cadastro e cabe em 160 caracteres', () => {
  assert.equal(creciEmTexto('123.456-F'), 'CRECI 123.456-F');
  assert.equal(creciEmTexto('CRECI 123.456-F'), 'CRECI 123.456-F');
  assert.equal(creciEmTexto(null), null);
  assert.equal(
    descricaoDoPerfil({ nome: 'Lara  Matos', creci: '382.076-F', especialidade: 'Jundiaí e Itupeva', temImoveis: true }),
    'Lara Matos (CRECI 382.076-F) é especialista da Lotus Brokers em Jundiaí e Itupeva. Veja os imóveis e fale direto pelo WhatsApp.',
  );
  assert.equal(
    descricaoDoPerfil({ nome: 'Lara Matos', creci: null, especialidade: 'Jundiaí e Itupeva', temImoveis: false }),
    'Lara Matos é especialista da Lotus Brokers em Jundiaí e Itupeva. Fale direto pelo WhatsApp.',
  );
  const longa = descricaoDoPerfil({ nome: 'Maria Aparecida dos Santos', creci: '123.456-F', especialidade: 'Apartamento, Cobertura, Casa, Terreno e Sala Comercial', temImoveis: true });
  assert.ok(longa.length <= 160, `${longa.length}: ${longa}`);
});
