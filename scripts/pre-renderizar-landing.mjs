/**
 * Grava a versão montada (pré-render) de uma landing dc-runtime de public/.
 *
 *   node scripts/pre-renderizar-landing.mjs altissimi vila-triunfo
 *
 * POR QUE e COMO a página fica: ver lib/pre-render-landing.mjs.
 *
 * Rodar de novo sempre que o template (<x-dc>) ou o script da landing
 * (<script type="text/x-dc">) mudar, inclusive depois de desempacotar um bundle
 * novo. O teste lib/pre-render-landing.test.mts acusa versão montada velha.
 *
 * Como captura: serve public/ num servidor local, abre uma cópia da landing
 * num Chrome headless (sem Analytics nem os scripts da Lotus, que decoram a
 * página depois e continuam rodando no site) e guarda o HTML que o React pôs
 * no #dc-root no primeiro commit, ANTES do componentDidMount. Depois dele as
 * animações escondem seções (opacity 0) e os contadores começam do zero; a
 * versão montada tem de ser o estado inicial, igual ao que o React monta.
 *
 * Precisa de internet (o runtime baixa o React do unpkg) e do Chrome; fora dos
 * caminhos comuns, aponte CHROME_PATH para o executável.
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { comPreRender, ehLandingDc, semPreRender, textoForaDoTemplate } from '../lib/pre-render-landing.mjs';

const PUBLIC = resolve('public');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

// Grava no <pre id="__montada"> o innerHTML do #dc-root no fim do primeiro
// commit do React. appendChild/insertBefore são chamados na fase de mutação,
// antes do componentDidMount; o setTimeout fecha a captura quando a tarefa do
// commit termina, com a última versão anotada.
const GANCHO = `<script>
(function () {
  var nativo = { appendChild: Node.prototype.appendChild, insertBefore: Node.prototype.insertBefore };
  var ultima = '', marcada = false, fechada = false;
  function anotar(pai) {
    if (fechada || !pai || pai.id !== 'dc-root') return;
    ultima = pai.innerHTML;
    if (!ultima || marcada) return;
    marcada = true;
    setTimeout(function () {
      fechada = true;
      var pre = document.createElement('pre');
      pre.id = '__montada';
      pre.textContent = ultima;
      nativo.appendChild.call(document.body, pre);
    }, 0);
  }
  Node.prototype.appendChild = function (filho) { var r = nativo.appendChild.call(this, filho); anotar(this); return r; };
  Node.prototype.insertBefore = function (filho, ref) { var r = nativo.insertBefore.call(this, filho, ref); anotar(this); return r; };
})();
</script>`;

/** A cópia que o Chrome abre: só o necessário para o runtime montar. */
function paginaDeCaptura(html) {
  const essenciais = (bloco) =>
    bloco.includes('window.__resources') || bloco.startsWith('<script type="text/x-dc"') || bloco.includes('var fila =');
  return semPreRender(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, (bloco) => (essenciais(bloco) ? bloco : ''))
    .replace('<head>', `<head>\n${GANCHO}`);
}

function servir(slug, captura) {
  const servidor = createServer((req, res) => {
    const caminho = decodeURIComponent(new URL(req.url ?? '/', 'http://local').pathname);
    if (caminho === `/__captura/${slug}`) {
      res.writeHead(200, { 'Content-Type': TIPOS['.html'] });
      return res.end(captura);
    }
    const arquivo = resolve(PUBLIC, `.${caminho}`);
    const dentro = arquivo.startsWith(PUBLIC + sep);
    if (!dentro || !existsSync(arquivo) || !statSync(arquivo).isFile()) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': TIPOS[extname(arquivo).toLowerCase()] ?? 'application/octet-stream' });
    res.end(readFileSync(arquivo));
  });
  return new Promise((pronto) => servidor.listen(0, '127.0.0.1', () => pronto(servidor)));
}

function acharChrome() {
  const candidatos = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  const achado = candidatos.find((c) => existsSync(c));
  if (!achado) throw new Error('Chrome não encontrado; defina CHROME_PATH');
  return achado;
}

function abrirNoChrome(chrome, url) {
  const perfil = mkdtempSync(join(tmpdir(), 'pre-render-'));
  const args = [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    `--user-data-dir=${perfil}`, '--window-size=1280,900', '--virtual-time-budget=30000', '--dump-dom', url,
  ];
  return new Promise((pronto, falha) => {
    execFile(chrome, args, { maxBuffer: 64 * 1024 * 1024, timeout: 120_000 }, (erro, saida) => {
      rmSync(perfil, { recursive: true, force: true });
      if (erro) falha(erro);
      else pronto(saida);
    });
  });
}

function versaoMontada(dom) {
  const m = /<pre id="__montada">([\s\S]*?)<\/pre>/.exec(dom);
  if (!m) throw new Error('o React não montou a página (sem internet para o unpkg?)');
  return m[1]
    .replace(/^\n/, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, '\u00a0')
    .replace(/&amp;/g, '&');
}

async function preRenderizar(slug, chrome) {
  const arquivo = join(PUBLIC, slug, 'index.html');
  const html = readFileSync(arquivo, 'utf8');
  if (!ehLandingDc(html)) throw new Error(`${slug}: não é landing dc-runtime (sem <x-dc>)`);

  const servidor = await servir(slug, paginaDeCaptura(html));
  try {
    const { port } = servidor.address();
    const montada = versaoMontada(await abrirNoChrome(chrome, `http://127.0.0.1:${port}/__captura/${slug}`));
    const novo = comPreRender(html, montada);
    const sobra = textoForaDoTemplate(novo).match(/\{\{[^}]{0,40}\}\}/g);
    if (sobra) throw new Error(`${slug}: ainda há template fora do <template>: ${sobra.slice(0, 3).join(', ')}`);
    writeFileSync(arquivo, novo);
    console.log(`${slug}: versão montada com ${Math.round(montada.length / 1024)} KB gravada em ${arquivo}`);
  } finally {
    servidor.close();
  }
}

const slugs = process.argv.slice(2);
if (slugs.length === 0) {
  console.error('uso: node scripts/pre-renderizar-landing.mjs <slug> [<slug> ...]');
  process.exit(1);
}
const chrome = acharChrome();
for (const slug of slugs) await preRenderizar(slug, chrome);
