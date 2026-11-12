import assert from 'node:assert/strict';
import { test } from 'node:test';
import { POSTS } from './blog-posts.ts';
import { POSTS_FUNDIDOS, redirecionamentosDosPostsFundidos } from './posts-fundidos.mjs';

const ids = new Set(POSTS.map((p) => p.id));

test('post fundido não existe mais, e o destino dele existe', () => {
  for (const [de, para] of Object.entries(POSTS_FUNDIDOS)) {
    assert.ok(!ids.has(de), `${de} voltou para a lista de posts: tire de POSTS_FUNDIDOS ou do blog`);
    assert.ok(ids.has(para), `${de} leva a ${para}, que não existe`);
  }
});

test('os redirecionamentos são permanentes e saem do blog para o blog', () => {
  for (const r of redirecionamentosDosPostsFundidos()) {
    assert.equal(r.permanent, true);
    assert.match(r.source, /^\/lotus-blog\/[a-z0-9-]+$/);
    assert.match(r.destination, /^\/lotus-blog\/[a-z0-9-]+$/);
  }
});
