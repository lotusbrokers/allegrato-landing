import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { BAIRROS } from './bairros.ts';

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
