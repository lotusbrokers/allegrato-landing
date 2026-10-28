import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

/**
 * Proteção da área e ausência de credencial, conferidas no código: a
 * ferramenta não pode depender de um botão escondido, e nenhum token da Meta
 * pode estar no repositório (que é público).
 */

const RAIZ = process.cwd();
const ROTA = join(RAIZ, 'app', 'area-do-gestor', 'utm');

function arquivos(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
  });
}

test('o middleware exige sessão em toda a Área do Gestor, inclusive no UTM Manager', () => {
  const middleware = readFileSync(join(RAIZ, 'middleware.ts'), 'utf8');
  assert.match(middleware, /'\/area-do-gestor\/:path\*'/);
});

test('toda página e o layout do UTM Manager conferem o papel no servidor', () => {
  const paginas = arquivos(ROTA).filter((a) => /(page|layout)\.tsx$/.test(a));
  assert.ok(paginas.length >= 9, `só ${paginas.length} páginas encontradas`);
  for (const pagina of paginas) {
    assert.match(readFileSync(pagina, 'utf8'), /await exigirGestor\(\)/, `${pagina} não chama exigirGestor`);
  }
});

test('toda Server Action do UTM Manager confere o papel antes de qualquer coisa', () => {
  const fonte = readFileSync(join(ROTA, 'acoes.ts'), 'utf8');
  assert.match(fonte, /^'use server';/);
  const acoes = [...fonte.matchAll(/^export async function (\w+)\([^]*?\{\n([^]*?)\n\}/gm)];
  assert.ok(acoes.length >= 8, `só ${acoes.length} ações encontradas`);
  for (const [, nome, corpo] of acoes) {
    const primeiraLinha = corpo.split('\n').find((l) => l.trim() !== '') ?? '';
    assert.match(primeiraLinha, /await exigirGestor\(\)/, `${nome} não começa por exigirGestor`);
  }
});

test('nada de rota de API pública: o UTM Manager só fala por Server Actions', () => {
  assert.deepEqual(arquivos(ROTA).filter((a) => /route\.(ts|tsx)$/.test(a)), []);
});

test('nenhuma credencial da Meta no código da ferramenta', () => {
  const codigo = [...arquivos(ROTA), ...arquivos(join(RAIZ, 'lib', 'utm')), ...arquivos(join(RAIZ, 'components', 'utm'))].filter((a) => /\.(ts|tsx)$/.test(a));
  for (const arquivo of codigo) {
    const fonte = readFileSync(arquivo, 'utf8');
    assert.doesNotMatch(fonte, /EAA[A-Za-z0-9]{20,}/, `${arquivo} parece ter um token da Meta`);
    assert.doesNotMatch(fonte, /NEXT_PUBLIC_[A-Z_]*META|NEXT_PUBLIC_[A-Z_]*TOKEN/, `${arquivo} expõe variável de token ao navegador`);
    assert.doesNotMatch(fonte, /access_token\s*[:=]\s*['"][^'"]+['"]/, `${arquivo} tem access_token fixo`);
  }
});

test('o armazém não tem campo de token nem de senha', () => {
  const tipos = readFileSync(join(RAIZ, 'lib', 'utm', 'tipos.ts'), 'utf8');
  assert.doesNotMatch(tipos, /token|senha|password|secret/i);
});
