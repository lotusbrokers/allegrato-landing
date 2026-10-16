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

test('nenhum link interno fixo é relativo nem termina com barra', () => {
  const raiz = process.cwd();
  const problemas: string[] = [];
  for (const arquivo of [...arquivos(join(raiz, 'app')), ...arquivos(join(raiz, 'components'))]) {
    for (const [, href] of readFileSync(arquivo, 'utf8').matchAll(/href="([^"]*)"/g)) {
      if (href.startsWith('../') || /^\/[^?#]*[^/]\/$/.test(href)) problemas.push(`${arquivo}: ${href}`);
    }
  }
  assert.deepEqual(problemas, []);
});
