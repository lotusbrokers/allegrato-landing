import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ARTIGOS_JAPI, HOST_JAPI, PAGINAS_JAPI, redirecionamentosDoJapi } from './redirecionamento-japi.mjs';
import { POSTS } from './blog-posts.ts';
import { bairroSlugsIndexaveis } from './bairros.ts';

// O Next compara o host com a expressão inteira, do início ao fim.
const casaHost = (host: string) => new RegExp(`^${HOST_JAPI}$`).test(host);

test('as regras valem só para o domínio antigo, nunca para o do portal', () => {
  assert.ok(casaHost('japilancamentos.com.br'));
  assert.ok(casaHost('www.japilancamentos.com.br'));
  // Casar o host do portal mandaria o site inteiro para ele mesmo, sem fim.
  for (const host of ['www.lotusbrokers.com.br', 'lotusbrokers.com.br', 'localhost:3000', 'japilancamentos.com.br.exemplo.com']) {
    assert.equal(casaHost(host), false, host);
  }
});

test('todo artigo e todo guia de destino existem no portal', () => {
  const artigos = new Set(POSTS.map((p) => p.id));
  const bairros = new Set(bairroSlugsIndexaveis());
  const destinos = [...Object.values(ARTIGOS_JAPI), ...Object.values(PAGINAS_JAPI)];
  for (const destino of destinos) {
    const [, rota, slug] = destino.split('/');
    if (rota === 'lotus-blog' && slug) assert.ok(artigos.has(slug), `artigo inexistente: ${destino}`);
    if (rota === 'lotus-bairro' && slug) assert.ok(bairros.has(slug), `guia inexistente: ${destino}`);
  }
});

test('cada artigo com par vem antes das regras gerais do blog e do caminho igual', () => {
  const fontes = redirecionamentosDoJapi().map((r) => r.source);
  const geral = fontes.indexOf('/post/:slug*');
  for (const slug of Object.keys(ARTIGOS_JAPI)) {
    const i = fontes.indexOf(`/post/${encodeURIComponent(slug)}`);
    assert.ok(i >= 0 && i < geral, slug);
  }
  assert.equal(fontes.at(-1), '/:caminho*');
});
