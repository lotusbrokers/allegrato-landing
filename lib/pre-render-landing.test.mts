import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  comPreRender,
  ehLandingDc,
  origemDoTemplate,
  origemGravada,
  semPreRender,
  textoForaDoTemplate,
} from './pre-render-landing.mjs';

const MINIMA = [
  '<!DOCTYPE html>',
  '<html><head>',
  '<title>T</title>',
  '</head>',
  '<body>',
  '<x-dc>',
  '<helmet><style>body{margin:0}</style></helmet>',
  '<sc-for list="{{ itens }}" as="i"><p>{{ i.nome }}</p></sc-for>',
  '</x-dc>',
  '<script type="text/x-dc" data-dc-script="">class Component extends DCLogic {}</script>',
  '</body></html>',
].join('\n');

test('gravar a versão montada é idempotente e desfazer devolve o HTML original', () => {
  const uma = comPreRender(MINIMA, '<p>Um</p><p>Dois</p>');
  assert.equal(comPreRender(uma, '<p>Um</p><p>Dois</p>'), uma, 'gerar de novo não duplica nada');
  assert.equal(semPreRender(uma), MINIMA);
  assert.equal(origemGravada(uma), origemDoTemplate(MINIMA));
});

// O runtime relê o template do TEXTO do arquivo: primeiro "<x-dc" e último
// "</x-dc>". Nada do pré-render pode escrever a tag fora do template.
test('o template continua sendo o primeiro <x-dc> e o último </x-dc> do arquivo', () => {
  const html = comPreRender(MINIMA, '<p>Um</p>');
  assert.equal(html.indexOf('<x-dc'), html.indexOf('<template id="dc-template">') + '<template id="dc-template">'.length);
  assert.equal(html.lastIndexOf('</x-dc>') + '</x-dc>'.length, html.indexOf('</template>'));
  assert.match(html, /<head>[\s\S]*body\{margin:0\}[\s\S]*<\/head>/, 'os estilos do <helmet> valem antes do runtime');
});

test('versão montada com {{ }} ou com a tag do template é recusada', () => {
  assert.throws(() => comPreRender(MINIMA, '<p>{{ i.nome }}</p>'), /\{\{/);
  assert.throws(() => comPreRender(MINIMA, '<x-dc></x-dc>'), /tag do template/);
});

const PUBLIC = join(process.cwd(), 'public');
const landingsDc = readdirSync(PUBLIC, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(PUBLIC, d.name, 'index.html')))
  .map((d) => ({ slug: d.name, html: readFileSync(join(PUBLIC, d.name, 'index.html'), 'utf8') }))
  .filter(({ html }) => ehLandingDc(html));

// Sem esta guarda, uma detecção quebrada passaria em silêncio (zero testes no laço).
test('as landings dc-runtime conhecidas são detectadas', () => {
  const slugs = landingsDc.map((l) => l.slug);
  for (const conhecida of ['altissimi', 'vila-triunfo']) assert.ok(slugs.includes(conhecida), conhecida);
});

for (const { slug, html } of landingsDc) {
  test(`${slug}: versão montada em dia com o template`, () => {
    assert.equal(
      origemGravada(html),
      origemDoTemplate(html),
      `o template ou o script de ${slug} mudou: rode node scripts/pre-renderizar-landing.mjs ${slug}`,
    );
  });

  test(`${slug}: nenhum {{ }} no que um robô sem JavaScript lê`, () => {
    assert.deepEqual(textoForaDoTemplate(html).match(/\{\{[^}]{0,40}\}\}/g), null);
  });
}
