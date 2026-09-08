import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { conteudoDaConstrutora, slugsComConteudo } from './construtoras-conteudo.ts';
import { slugify } from './landings.ts';

/**
 * O conteúdo é escrito à mão, então os erros possíveis são de digitação: um
 * slug que não corresponde a construtora nenhuma (a seção nunca aparece) e um
 * caminho de logo que não existe em public/ (imagem quebrada na página).
 */

test('construtora sem conteúdo devolve null, e a seção some', () => {
  assert.equal(conteudoDaConstrutora('nao-cadastrada'), null);
});

test('todo logo declarado existe em public/', () => {
  for (const slug of slugsComConteudo()) {
    const logo = conteudoDaConstrutora(slug)?.logo;
    if (!logo) continue;
    assert.ok(logo.startsWith('/'), `${slug}: o caminho do logo precisa começar com / (veio "${logo}")`);
    assert.ok(
      existsSync(join(process.cwd(), 'public', logo)),
      `${slug}: declara o logo "${logo}", que não existe em public/`
    );
  }
});

test('o slug do conteúdo é um slug de verdade — o mesmo que a URL usa', () => {
  for (const slug of slugsComConteudo()) {
    assert.equal(slugify(slug), slug, `"${slug}" não é um slug válido; a seção nunca casaria com a página`);
  }
});

test('nenhum conteúdo entra sem parágrafo — seção vazia é pior que seção ausente', () => {
  for (const slug of slugsComConteudo()) {
    const c = conteudoDaConstrutora(slug)!;
    assert.ok(c.paragrafos.length > 0, `${slug} não tem parágrafo nenhum`);
    for (const p of c.paragrafos) assert.notEqual(p.trim(), '', `${slug} tem parágrafo vazio`);
  }
});

test('o texto da Santa Angela chegou inteiro', () => {
  const c = conteudoDaConstrutora('santa-angela')!;
  assert.ok(c.paragrafos[0].includes('mais de 40 anos'));
  assert.ok(c.paragrafos[1].includes('1984'));
  assert.deepEqual(
    c.numeros?.map((n) => n.valor),
    ['59', '10.990', '+850 mil']
  );
  assert.equal(c.paragrafosFinais?.length, 2);
});
