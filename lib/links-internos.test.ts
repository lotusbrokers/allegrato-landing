import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Links internos fixos no código não podem passar por redirecionamento.
 *
 * Até 16/10/2026, 13 arquivos linkavam "../lotus-privacidade/" (relativo e com
 * barra no fim): cada link respondia 308, eram 353 por rastreamento, e o
 * Google chegou a indexar /lotus-termos/ e /lotus-privacidade/ como endereços
 * separados. O endereço certo é absoluto e sem barra: /lotus-privacidade.
 */
function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho);
    return /\.tsx?$/.test(nome) && !/\.test\.tsx?$/.test(nome) ? [caminho] : [];
  });
}

function fontesDoSite(): string[] {
  const raiz = process.cwd();
  return [...arquivos(join(raiz, 'app')), ...arquivos(join(raiz, 'components'))];
}

test('nenhum link interno fixo é relativo nem termina com barra', () => {
  const problemas: string[] = [];
  for (const arquivo of fontesDoSite()) {
    for (const [, href] of readFileSync(arquivo, 'utf8').matchAll(/href="([^"]*)"/g)) {
      if (href.startsWith('../') || /^\/[^?#]*[^/]\/$/.test(href)) problemas.push(`${arquivo}: ${href}`);
    }
  }
  assert.deepEqual(problemas, []);
});

/**
 * Até 19/10/2026, o "Seja um corretor" do rodapé da home levava a /lotus-sobre;
 * nas demais páginas o mesmo link já ia para o recrutamento.
 */
test('todo link "Seja um corretor" leva à página de recrutamento', () => {
  const problemas: string[] = [];
  for (const arquivo of fontesDoSite()) {
    const texto = readFileSync(arquivo, 'utf8');
    for (const [, href] of texto.matchAll(/href="([^"]*)"[^<>]*>\s*Seja um corretor\s*</g)) {
      if (href !== '/lotus-recrutamento') problemas.push(`${arquivo}: ${href}`);
    }
  }
  assert.deepEqual(problemas, []);
});
