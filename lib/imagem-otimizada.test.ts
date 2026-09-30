import assert from 'node:assert/strict';
import { test } from 'node:test';
import { imagemOtimizada, otimizavel } from './imagem-otimizada.ts';

test('arquivo de public/ e hosts do feed passam pelo otimizador', () => {
  assert.equal(otimizavel('/altos-da-avenida/a005.png'), true);
  assert.equal(otimizavel('https://glbtwvusiaaovllxhiig.supabase.co/storage/v1/object/public/x/portal.jpg'), true);
  assert.equal(otimizavel('https://octodash-octo-dash.fltgo5.easypanel.host/api/v1/watermark/photos/abc/portal.jpg'), true);
});

test('o que o otimizador não aceita volta como veio', () => {
  for (const src of ['https://exemplo.com/foto.jpg', 'data:image/png;base64,AAAA', '/logo.svg', '//cdn.x/foto.jpg', '/_next/image?url=x', '', 'não é url']) {
    assert.equal(otimizavel(src), false, src);
  }
  assert.deepEqual(imagemOtimizada('https://exemplo.com/foto.jpg'), { src: 'https://exemplo.com/foto.jpg' });
});

test('srcset com as larguras pedidas e src na variante de 1080', () => {
  const r = imagemOtimizada('/altos-da-avenida/a005.png');
  assert.equal(r.src, '/_next/image?url=%2Faltos-da-avenida%2Fa005.png&w=1080&q=72');
  assert.equal(
    r.srcSet,
    '/_next/image?url=%2Faltos-da-avenida%2Fa005.png&w=640&q=72 640w, /_next/image?url=%2Faltos-da-avenida%2Fa005.png&w=1080&q=72 1080w, /_next/image?url=%2Faltos-da-avenida%2Fa005.png&w=1920&q=72 1920w',
  );
  const pequeno = imagemOtimizada('/x.jpg', [640], 60);
  assert.equal(pequeno.src, '/_next/image?url=%2Fx.jpg&w=640&q=60');
});
