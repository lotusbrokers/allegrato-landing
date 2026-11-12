import assert from 'node:assert/strict';
import { test } from 'node:test';
import { videoDoBairro } from './video-bairro.ts';
import { listBairros } from './bairros.ts';

test('sem vídeo cadastrado, o guia não mostra nada', () => {
  assert.equal(videoDoBairro({ nome: 'Malota', cidade: 'Jundiaí' }), null);
});

test('id ou data inválidos não viram embed', () => {
  assert.equal(videoDoBairro({ nome: 'Malota', cidade: 'Jundiaí', video: { youtubeId: 'curto', publicadoEm: '2026-11-20' } }), null);
  assert.equal(videoDoBairro({ nome: 'Malota', cidade: 'Jundiaí', video: { youtubeId: 'abcdefghijk', publicadoEm: 'logo' } }), null);
});

test('com vídeo, título "Morar em X, cidade", player sem cookie e VideoObject completo', () => {
  const v = videoDoBairro({ nome: 'Engordadouro', cidade: 'Jundiaí', video: { youtubeId: 'abcdefghijk', publicadoEm: '2026-11-20' } });
  assert.ok(v);
  assert.equal(v.titulo, 'Morar em Engordadouro, Jundiaí');
  assert.match(v.player, /^https:\/\/www\.youtube-nocookie\.com\/embed\/abcdefghijk\?/);
  assert.equal(v.jsonLd['@type'], 'VideoObject');
  assert.equal(v.jsonLd.uploadDate, '2026-11-20');
  assert.deepEqual(v.jsonLd.thumbnailUrl, ['https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg']);
});

test('nenhum bairro tem vídeo inventado: todo vídeo cadastrado é válido', () => {
  for (const b of listBairros()) {
    if (b.video) assert.ok(videoDoBairro(b), `${b.slug}: vídeo cadastrado com id ou data inválidos`);
  }
});
