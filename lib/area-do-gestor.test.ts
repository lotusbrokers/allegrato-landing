// Partes puras da Área do Gestor (lib/area-do-gestor/). Fica na raiz de lib/
// porque o `npm test` roda lib/*.test.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODULOS_DA_DASHBOARD, linkDaDashboard } from './area-do-gestor/dashboard';
import { idDaPasta, pastaDaGestao, pastasDaGestao } from './area-do-gestor/pastas';

const ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';

test('pastas: aceita o ID ou o link copiado do Drive, e recusa o resto', () => {
  assert.equal(idDaPasta(ID), ID);
  assert.equal(idDaPasta(` https://drive.google.com/drive/folders/${ID}?usp=drive_link `), ID);
  assert.equal(idDaPasta(`https://drive.google.com/drive/u/2/folders/${ID}`), ID);
  for (const ruim of [undefined, null, '', 'abc', "1Ab' or 1=1", 'https://drive.google.com/file/d/x/view']) {
    assert.equal(idDaPasta(ruim), null, String(ruim));
  }
});

test('pastas: Diretoria e Marketing vêm do ambiente; sem a variável, o id fica null', () => {
  const pastas = pastasDaGestao({ GOOGLE_DRIVE_PASTA_DIRETORIA_ID: ID });
  assert.deepEqual(
    pastas.map((p) => [p.chave, p.id]),
    [
      ['diretoria', ID],
      ['marketing', null],
    ],
  );
  assert.equal(pastaDaGestao('marketing', { GOOGLE_DRIVE_PASTA_MARKETING_ID: ID })?.id, ID);
  assert.equal(pastaDaGestao('financeiro', {}), null);
});

test('dashboard: cada atalho é uma rota da Dashboard, sem repetir', () => {
  const rotas = MODULOS_DA_DASHBOARD.flatMap((g) => g.modulos.map((m) => m.rota));
  assert.ok(rotas.length > 20);
  for (const rota of rotas) assert.match(rota, /^\/[a-z]/, rota);
  assert.equal(new Set(rotas).size, rotas.length);
});

test('dashboard: o link junta o endereço da Dashboard e a rota', () => {
  assert.equal(linkDaDashboard('/financeiro', 'https://dash.example.com/'), 'https://dash.example.com/financeiro');
  assert.equal(linkDaDashboard('/imoveis?tab=catalogo', 'https://dash.example.com'), 'https://dash.example.com/imoveis?tab=catalogo');
});
