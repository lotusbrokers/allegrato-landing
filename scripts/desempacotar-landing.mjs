/**
 * Desempacota uma landing de public/ que veio como bundle auto-extraível
 * (formato dc-runtime: <script type="__bundler/manifest"> com fotos, fontes e
 * scripts em base64, e <script type="__bundler/template"> com o documento).
 *
 *   node scripts/desempacotar-landing.mjs mistral-jundiai [outra-landing ...]
 *
 * POR QUE: o bundle manda TODAS as fotos dentro do próprio HTML (3 a 9,6 MB por
 * página). Nada aparece antes do download inteiro, nada fica em cache, e o
 * servidor comprime megabytes a cada visita — em 06/10/2026 isso deixava o site
 * inteiro lento. Desempacotada, a página fica com dezenas de KB e as fotos
 * viram arquivos WebP em public/<slug>/midia/, com cache longo (next.config.mjs).
 *
 * O que a página faz continua igual ao bundle:
 *  - o documento é o do template, com cada uuid trocado pela URL do arquivo
 *    (no bundle, pela URL blob) e sem integrity/crossorigin, como o runtime fazia;
 *  - window.__resources recebe os ext_resources, como o runtime injetava;
 *  - título, description, canonical e metas og/twitter vêm da CASCA (o HTML de
 *    fora do bundle), que é onde as auditorias de SEO foram aplicadas; o resto
 *    do <head> é o do template, que é o que o visitante recebia depois da troca;
 *  - os scripts externos da casca (Analytics) entram no <head>;
 *  - os scripts executáveis do template rodam DEPOIS do DOMContentLoaded, como
 *    no bundle (que montava a página só então). Rodar antes mudaria a página:
 *    em Lago Samambaia e Villaggio, por exemplo, toda a lógica do template fica
 *    num listener de DOMContentLoaded que nunca disparava, e a Lotus compensou
 *    com os scripts da casca;
 *  - os scripts que a Lotus pôs DEPOIS do template na casca (rodapé, atalhos,
 *    correções) vão para o fim do <body>; eles já funcionam em página comum
 *    (são os mesmos de Santorini e Reserva Castanheira).
 *
 * O que sai: o carregador do bundle, o manifesto, o template e o aviso de
 * "Unpacking...". O HTML antigo fica no histórico do git.
 *
 * Landing que não é bundle mas traz fotos coladas como data URI (a Oásis) passa
 * só pela extração das fotos: ver extrairImagensEmbutidas.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import sharp from 'sharp';

const RAIZ = process.cwd();
/** Largura máxima das fotos: o layout mais largo das landings é a tela cheia em 1920 px. */
const LARGURA_MAX = 2000;

const EXTENSAO = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'font/woff2': 'woff2',
  'font/woff': 'woff',
  'font/ttf': 'ttf',
  'font/otf': 'otf',
  'application/javascript': 'js',
  'text/javascript': 'js',
  'text/css': 'css',
};

/** Atributos de uma tag ("<meta name="x" content="y">") em objeto. */
function atributos(tag) {
  const out = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) out[m[1].toLowerCase()] = m[2];
  return out;
}

/** Chave que identifica uma tag de SEO, ou null se a tag não é de SEO. */
function chaveSeo(tag) {
  if (/^<title\b/i.test(tag)) return 'title';
  const a = atributos(tag);
  if (/^<link\b/i.test(tag) && a.rel === 'canonical') return 'canonical';
  if (/^<meta\b/i.test(tag)) {
    if (a.name === 'description') return 'description';
    if (a.property && a.property.startsWith('og:')) return a.property;
    if (a.name && a.name.startsWith('twitter:')) return a.name;
  }
  return null;
}

function tagsSeo(html) {
  const out = new Map();
  for (const m of html.matchAll(/<title\b[^>]*>[\s\S]*?<\/title>|<(?:meta|link)\b[^>]*>/gi)) {
    const chave = chaveSeo(m[0]);
    if (chave && !out.has(chave)) out.set(chave, m[0]);
  }
  return out;
}

function blocosDeScript(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((m) => ({
    inteiro: m[0],
    attrs: atributos(`<x ${m[1]}>`),
    attrsTexto: m[1],
    corpo: m[2],
    ini: m.index,
  }));
}

function executavel(attrs) {
  const tipo = (attrs.type || '').toLowerCase();
  return tipo === '' || tipo === 'text/javascript' || tipo === 'application/javascript' || tipo === 'module';
}

/**
 * Grava um asset em midia/ e devolve a URL; JPEG e PNG viram WebP. O nome do
 * arquivo é o hash do que foi gravado, então uma URL nunca muda de conteúdo —
 * é o que permite o cache "immutable" de next.config.mjs.
 */
async function gravarAsset(slug, entrada, pasta) {
  let bytes = Buffer.from(entrada.data, 'base64');
  if (entrada.compressed) bytes = gunzipSync(bytes);
  const mime = entrada.mime.toLowerCase();

  let saida = bytes;
  let ext = EXTENSAO[mime];
  if (mime === 'image/jpeg' || mime === 'image/png') {
    const img = sharp(bytes, { failOn: 'none' });
    const { width = 0 } = await img.metadata();
    const webp = await img
      .resize({ width: width > LARGURA_MAX ? LARGURA_MAX : undefined, withoutEnlargement: true })
      .webp({ quality: mime === 'image/png' ? 90 : 80 })
      .toBuffer();
    // Ícone pequeno às vezes fica maior em WebP: aí vale o original.
    if (webp.length < bytes.length) {
      saida = webp;
      ext = 'webp';
    }
  }
  if (!ext) throw new Error(`${slug}: tipo sem extensão conhecida: ${mime}`);
  const nome = `${createHash('sha1').update(saida).digest('hex').slice(0, 16)}.${ext}`;
  writeFileSync(join(pasta, nome), saida);
  return { url: `/${slug}/midia/${nome}`, antes: bytes.length, depois: saida.length };
}

/**
 * HTML comum com as fotos coladas como data URI (caso da Oásis): cada foto
 * distinta vira arquivo em midia/ (nome = hash do conteúdo) e todas as
 * ocorrências passam a apontar para ele. O resto do HTML fica intocado.
 */
async function extrairImagensEmbutidas(slug, arquivo, html) {
  const re = /data:image\/(jpeg|jpg|png|webp|gif);base64,([A-Za-z0-9+/=]+)/g;
  const unicas = new Map();
  for (const m of html.matchAll(re)) {
    if (!unicas.has(m[0])) unicas.set(m[0], { mime: `image/${m[1] === 'jpg' ? 'jpeg' : m[1]}`, data: m[2], compressed: false });
  }
  if (!unicas.size) {
    console.log(`${slug}: sem bundle e sem imagem embutida, nada a fazer.`);
    return;
  }
  const pasta = join(RAIZ, 'public', slug, 'midia');
  if (existsSync(pasta)) rmSync(pasta, { recursive: true });
  mkdirSync(pasta, { recursive: true });
  let final = html;
  let antes = 0;
  let depois = 0;
  for (const [dataUri, entrada] of unicas) {
    const r = await gravarAsset(slug, entrada, pasta);
    final = final.split(dataUri).join(r.url);
    antes += r.antes;
    depois += r.depois;
  }
  writeFileSync(arquivo, final);
  console.log(
    `${slug}: ${(html.length / 1e6).toFixed(2)} MB → ${(final.length / 1e3).toFixed(0)} KB de HTML` +
      ` + ${unicas.size} fotos (${(antes / 1e6).toFixed(2)} → ${(depois / 1e6).toFixed(2)} MB)`,
  );
}

async function desempacotar(slug) {
  const arquivo = join(RAIZ, 'public', slug, 'index.html');
  const html = readFileSync(arquivo, 'utf8');
  if (!html.includes('__bundler/manifest')) {
    await extrairImagensEmbutidas(slug, arquivo, html);
    return;
  }

  const blocos = blocosDeScript(html);
  const pega = (tipo) => blocos.find((b) => b.attrs.type === tipo);
  const manifesto = JSON.parse(pega('__bundler/manifest').corpo);
  let template = JSON.parse(pega('__bundler/template').corpo);
  const extRes = pega('__bundler/ext_resources') ? JSON.parse(pega('__bundler/ext_resources').corpo) : [];
  const paginas = pega('__bundler/page_order') ? JSON.parse(pega('__bundler/page_order').corpo) : [];
  if (paginas.length) throw new Error(`${slug}: bundle com páginas aninhadas (page_order), não suportado.`);

  // 1) Assets em arquivo. A pasta é recriada: re-rodar não deixa sobra.
  const pasta = join(RAIZ, 'public', slug, 'midia');
  if (existsSync(pasta)) rmSync(pasta, { recursive: true });
  mkdirSync(pasta, { recursive: true });
  const urls = {};
  let antes = 0;
  let depois = 0;
  for (const [uuid, entrada] of Object.entries(manifesto)) {
    const r = await gravarAsset(slug, entrada, pasta);
    urls[uuid] = r.url;
    antes += r.antes;
    depois += r.depois;
  }

  // 2) Template: uuid → URL do arquivo, sem integrity/crossorigin (como o runtime).
  for (const [uuid, url] of Object.entries(urls)) template = template.split(uuid).join(url);
  template = template.replace(/\s+integrity="[^"]*"/gi, '').replace(/\s+crossorigin="[^"]*"/gi, '');

  // 3) Scripts executáveis do template saem do lugar e rodam depois do
  // DOMContentLoaded (passo 5). Vem antes do <head>, para não levar junto o
  // Analytics e o window.__resources, que entram no passo 4 e rodam na hora.
  const fila = [];
  template = template.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (inteiro, attrsTexto, corpo) => {
    const attrs = atributos(`<x ${attrsTexto}>`);
    if (!executavel(attrs)) return inteiro;
    const { src, ...outros } = attrs;
    delete outros.async;
    delete outros.defer;
    fila.push(src ? { src, attrs: outros } : { inline: corpo, attrs: outros });
    return '';
  });

  // 4) <head>: SEO da casca por cima do template, Analytics e window.__resources.
  const iManifesto = pega('__bundler/manifest').ini;
  const casca = html.slice(0, iManifesto);
  const cabecaCasca = (casca.match(/<head\b[^>]*>([\s\S]*?)(?:<\/head>|<body\b|$)/i) || [])[1] || casca;
  const seoCasca = tagsSeo(cabecaCasca);
  const fimHead = template.search(/<\/head>/i);
  let cabeca = template.slice(0, fimHead);
  const resto = template.slice(fimHead);
  for (const [chave, tagCasca] of seoCasca) {
    let trocou = false;
    cabeca = cabeca.replace(/<title\b[^>]*>[\s\S]*?<\/title>|<(?:meta|link)\b[^>]*>/gi, (tag) => {
      if (!trocou && chaveSeo(tag) === chave) {
        trocou = true;
        return tagCasca;
      }
      return tag;
    });
    if (!trocou) cabeca += `\n${tagCasca}`;
  }
  const scriptsCasca = blocosDeScript(casca).filter((b) => b.attrs.src).map((b) => b.inteiro);
  const recursos = Object.fromEntries(extRes.filter((e) => urls[e.uuid]).map((e) => [e.id, urls[e.uuid]]));
  const injecao =
    `\n<script>window.__resources = ${JSON.stringify(recursos).replace(/<\//g, '<\\/')};</script>` +
    (scriptsCasca.length ? `\n${scriptsCasca.join('\n')}` : '');
  const aberturaHead = cabeca.match(/<head\b[^>]*>/i);
  if (!aberturaHead) throw new Error(`${slug}: template sem <head>.`);
  const posHead = aberturaHead.index + aberturaHead[0].length;
  template = cabeca.slice(0, posHead) + injecao + cabeca.slice(posHead) + resto;

  // 5) Scripts da Lotus que vinham depois do template na casca, e o carregador da fila.
  const iTemplate = blocos.indexOf(pega('__bundler/template'));
  const daLotus = blocos.slice(iTemplate + 1).map((b) => b.inteiro);

  const carregador = `<script>
/* Desempacotada de um bundle (scripts/desempacotar-landing.mjs). No bundle,
   estes scripts rodavam depois do DOMContentLoaded, quando a página era
   montada; continuam assim para o comportamento ficar idêntico. */
(function () {
  var fila = ${JSON.stringify(fila).replace(/<\//g, '<\\/')};
  function proximo() {
    var item = fila.shift();
    if (!item) return;
    var s = document.createElement('script');
    for (var k in item.attrs) s.setAttribute(k, item.attrs[k]);
    if (item.src) {
      s.onload = s.onerror = proximo;
      s.src = item.src;
      document.body.appendChild(s);
    } else {
      s.textContent = item.inline;
      document.body.appendChild(s);
      proximo();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', proximo);
  else proximo();
})();
</script>`;
  const fimBody = template.search(/<\/body>/i);
  if (fimBody < 0) throw new Error(`${slug}: template sem </body>.`);
  template = template.slice(0, fimBody) + daLotus.join('\n') + '\n' + carregador + '\n' + template.slice(fimBody);

  // 6) Grava, com a origem anotada logo depois do DOCTYPE.
  const nota = `<!-- Desempacotada do bundle dc-runtime por scripts/desempacotar-landing.mjs. Fotos, fontes e scripts em ./midia. -->`;
  const final = /^\s*<!DOCTYPE html>/i.test(template)
    ? template.replace(/^\s*<!DOCTYPE html>/i, (d) => `${d.trim()}\n${nota}`)
    : `<!DOCTYPE html>\n${nota}\n${template}`;
  writeFileSync(arquivo, final);

  const hash = createHash('sha1').update(final).digest('hex').slice(0, 8);
  console.log(
    `${slug}: ${(html.length / 1e6).toFixed(2)} MB → ${(final.length / 1e3).toFixed(0)} KB de HTML` +
      ` + ${new Set(Object.values(urls)).size} arquivos (${(antes / 1e6).toFixed(2)} → ${(depois / 1e6).toFixed(2)} MB)` +
      ` | SEO da casca: ${[...seoCasca.keys()].length} tags | scripts adiados: ${fila.length} | da Lotus: ${daLotus.length} | ${hash}`,
  );
}

const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error('Uso: node scripts/desempacotar-landing.mjs <slug> [...]');
  process.exit(1);
}
for (const slug of slugs) await desempacotar(slug);
