import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BAIRROS, bairroSlugsIndexaveis, guiaDoBairro, tituloDoGuia } from './bairros.ts';

test('o guia do bairro confere o nome, o pertencimento e a cidade', () => {
  assert.equal(guiaDoBairro('Medeiros', 'Jundiaí')?.slug, 'medeiros');
  // Parte do bairro do guia, como o cadastro grava.
  assert.equal(guiaDoBairro('Bonfiglioli', 'Jundiaí')?.slug, 'vianelo-bonfiglioli');
  // Jardim Ermida I e II têm guia próprio desde 13/11/2026 (eram do Eloy Chaves).
  assert.equal(guiaDoBairro('Jardim Ermida II', 'Jundiaí')?.slug, 'jardim-ermida');
  assert.equal(guiaDoBairro('Vila Sereno', 'Jundiaí')?.slug, 'eloy-chaves');
  // Cidade sem acento também vale.
  assert.equal(guiaDoBairro('Recanto Quarto Centenário', 'Jundiai')?.slug, 'recanto-quarto-centenario');
  // O guia do Centro é o de Itupeva: o Centro de Jundiaí não tem guia.
  assert.equal(guiaDoBairro('Centro', 'Itupeva')?.slug, 'centro-itupeva');
  assert.equal(guiaDoBairro('Centro', 'Jundiaí'), null);
  assert.equal(guiaDoBairro('', 'Jundiaí'), null);
});

/**
 * O erro possível aqui é de digitação: um caminho de foto que não existe em
 * public/. Nada quebra — o hero simplesmente mostra imagem quebrada, e ninguém
 * fica sabendo até alguém abrir a página.
 *
 * `heroImg: ''` é válido e comum: o bairro cujo guia ainda não tem foto cai no
 * gradiente do template de propósito.
 */
test('toda foto de bairro declarada existe em public/', () => {
  for (const b of BAIRROS) {
    if (!b.heroImg) continue;
    assert.ok(b.heroImg.startsWith('/'), `${b.slug}: o caminho precisa começar com / (veio "${b.heroImg}")`);
    assert.ok(
      existsSync(join(process.cwd(), 'public', b.heroImg)),
      `${b.slug}: declara a foto "${b.heroImg}", que não existe em public/`
    );
  }
});

test('a foto de cada bairro é a do próprio bairro, e não a de outro', () => {
  // O arquivo tem 15 campos `heroImg` iguais e adjacentes; trocar um pelo do
  // vizinho é o engano fácil, e nenhum teste pegaria pelo caminho existir.
  for (const b of BAIRROS) {
    if (!b.heroImg.startsWith('/bairros/')) continue;
    assert.equal(
      b.heroImg,
      `/bairros/${b.slug}.jpg`,
      `${b.slug} aponta para "${b.heroImg}", que é de outro bairro`
    );
  }
});

/**
 * As landings apontam para o guia do bairro delas com o slug escrito à mão
 * (componente ou HTML em public/). Errar o slug não dá 404:
 * /lotus-bairro/<inexistente> responde 200, e o link vira página vazia para o
 * Google. Apontar para guia com `publicado: false` manda o visitante para uma
 * página noindex. Os dois casos só aparecem aqui.
 */
test('todo link fixo para guia de bairro aponta para um guia publicado', () => {
  const raiz = process.cwd();
  const arquivos = [
    ...readdirSync(join(raiz, 'components')).filter((n) => n.endsWith('.tsx')).map((n) => join(raiz, 'components', n)),
    ...readdirSync(join(raiz, 'public'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(join(raiz, 'public', e.name, 'index.html')))
      .map((e) => join(raiz, 'public', e.name, 'index.html')),
  ];
  const publicados = new Set(bairroSlugsIndexaveis());
  for (const arquivo of arquivos) {
    for (const [, slug] of readFileSync(arquivo, 'utf8').matchAll(/href="\/lotus-bairro\/([a-z0-9-]+)"/g)) {
      assert.ok(publicados.has(slug), `${arquivo} aponta para /lotus-bairro/${slug}, que não é um guia publicado`);
    }
  }
});

// Auditoria do site (13/11/2026): o título do Eloy Chaves tinha 71 caracteres.
test('o título de todo guia cabe em 70 caracteres e diz a cidade', () => {
  for (const b of BAIRROS) {
    const t = tituloDoGuia(b);
    assert.ok(t.length <= 70, `${b.slug}: "${t}" tem ${t.length} caracteres`);
    assert.ok(t.includes(b.cidade), `${b.slug}: "${t}" não diz a cidade`);
  }
  assert.equal(tituloDoGuia({ nome: 'Eloy Chaves', cidade: 'Jundiaí' }), 'Morar em Eloy Chaves, Jundiaí: guia do bairro | Lotus Brokers');
  assert.equal(tituloDoGuia({ nome: 'Medeiros', cidade: 'Jundiaí' }), 'Morar em Medeiros, Jundiaí: guia do bairro e imóveis | Lotus Brokers');
});
