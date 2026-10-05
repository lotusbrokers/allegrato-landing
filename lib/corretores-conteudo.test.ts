import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { conteudoRealDe } from './corretores-conteudo.ts';

// O cadastro da Dashboard traz nomes com espaço duplo ("Mariana  Mamede") e o
// mesmo acento em formas diferentes; a busca pelo nome precisa achar os dois.
test('o nome do cadastro acha a foto e o texto, com espaço duplo e maiúsculas', () => {
  assert.equal(conteudoRealDe('Mariana  Mamede')?.foto, '/corretores/mariana-mamede.jpg');
  assert.equal(conteudoRealDe('  DANILO   GARDIM ')?.foto, '/corretores/danilo-gardim.webp');
  assert.equal(conteudoRealDe('Gabriele Fávaro')?.foto, '/corretores/gabriele-favaro.jpg', 'acento combinante');
  assert.equal(conteudoRealDe('Ninguém Cadastrado'), undefined);
});

// Foto apontando para arquivo que não existe não quebra a tela (cai nas
// iniciais), mas some sem ninguém perceber — mesma regra das capas do blog.
test('toda foto declarada existe em public/', () => {
  const nomes = ['mariana mamede', 'gabriele fávaro', 'andre marcondes', 'alex xavier da silva', 'fernanda souza', 'flavia ceolin', 'fábio gonçalves', 'reginaldo barbosa faleiros', 'humberto martinez', 'lara matos', 'marcos lafratta', 'gisele alves', 'alexandra niero', 'samir augusto', 'danilo gardim'];
  for (const nome of nomes) {
    const foto = conteudoRealDe(nome)?.foto;
    if (!foto) continue;
    assert.ok(existsSync(join(process.cwd(), 'public', foto)), `${nome}: ${foto} não existe em public/`);
  }
});
