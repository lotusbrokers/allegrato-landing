/**
 * Fotos das landings feitas no app (app/<slug> + components/<Componente>.tsx)
 * em WebP, e carregamento sob demanda abaixo da primeira dobra.
 *
 *   node scripts/otimizar-fotos-landing.mjs --analisar allegrato vigore ...
 *   node scripts/otimizar-fotos-landing.mjs allegrato vigore ...
 *
 * POR QUE: até 27/10/2026 essas landings usavam as fotos originais em JPG e
 * PNG (pastas de 1,3 a 31 MB, um PNG de 3,8 MB no Manawa), e muitas não tinham
 * carregamento sob demanda. O React pré-carrega no <head> toda <img> sem
 * loading="lazy", então a página inteira disputava a banda com a foto do topo:
 * no PageSpeed para celular (16/10/2026) o Allegrato tinha LCP de 24,6 s, com
 * 3,7 MB de economia possível só em imagens.
 *
 * O que faz, por landing:
 *  1. cada foto JPG/PNG de public/<slug>/ com mais de 80 KB que o componente ou
 *     o CSS da rota citam vira WebP (largura máxima 2000 px; qualidade 80, ou 90
 *     para PNG, que costuma ser planta com texto; orientação EXIF aplicada) em
 *     public/<slug>/midia/<hash>.webp, o mesmo formato das landings
 *     desempacotadas: nome = hash do conteúdo, cache "immutable"
 *     (next.config.mjs). Se o WebP não ficar ao menos 10% menor, a foto fica;
 *  2. as citações no componente e no CSS passam a apontar para o WebP;
 *  3. toda <img> da função principal do componente (export default) que vem
 *     depois da primeira </section> e não declara `loading` ganha
 *     loading="lazy". O topo e as <img> de funções auxiliares (lightbox,
 *     galeria reaproveitada) ficam como estavam: a auxiliar pode desenhar
 *     também a foto do topo.
 *
 * O original FICA em public/: cards, capas do blog, og:image e JSON-LD das
 * páginas ainda apontam para ele (page.tsx não é tocado).
 *
 * Só troca citação inequívoca: o caminho da foto relativo a public/<slug>/,
 * precedido de "/<slug>/", de aspas, de "}" (fim de ${PREFIXO}) ou de "(".
 * Ficam como estavam, e aparecem no relatório: foto com o mesmo nome em duas
 * pastas, e nome solto usado com prefixo de subpasta
 * (PLANTAS = '/doppio-jundiai/plantas/' + 'p1.jpg').
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import sharp from 'sharp';

const RAIZ = process.cwd();
const LARGURA_MAX = 2000;
const TAMANHO_MIN = 80 * 1024;
const MOLDURA = /^(RodapeLotus|AtalhosLanding|LightboxPlantas)$/;
const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function fotosDaPasta(pasta) {
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return nome === 'midia' ? [] : fotosDaPasta(caminho);
    return /\.(jpe?g|png)$/i.test(nome) && nome !== 'compartilhar.jpg' ? [caminho] : [];
  });
}

/** Componente(s) da landing (o que a page.tsx importa de components/, fora a moldura) e CSS da rota. */
function fontesDaLanding(slug) {
  const pagina = readFileSync(join(RAIZ, 'app', slug, 'page.tsx'), 'utf8');
  const comps = [...pagina.matchAll(/from '@\/components\/(\w+)'/g)]
    .map((m) => m[1])
    .filter((n) => !MOLDURA.test(n))
    .map((n) => join(RAIZ, 'components', `${n}.tsx`))
    .filter(existsSync);
  const css = readdirSync(join(RAIZ, 'app', slug)).filter((n) => n.endsWith('.css')).map((n) => join(RAIZ, 'app', slug, n));
  return [...comps, ...css];
}

/**
 * Posições em que `rel` aparece como citação inequívoca da foto. `${IMG}/foto.jpg`
 * só conta quando o arquivo declara o prefixo como a raiz da landing
 * (const IMG = '/<slug>', sem subpasta): é o caso da Gran Ville e do Terrace.
 */
function citacoes(texto, rel, slug) {
  const prefixoNaRaiz = new RegExp(`=\\s*['"\`]/${escapar(slug)}['"\`]`).test(texto);
  const achadas = [];
  for (const m of texto.matchAll(new RegExp(escapar(rel), 'g'))) {
    const i = m.index;
    const depois = texto[i + rel.length] ?? '';
    if (depois && !/['"`)\s?#,]/.test(depois)) continue;
    const antes = texto[i - 1] ?? '';
    const prefixoAbsoluto = texto.slice(Math.max(0, i - slug.length - 2), i) === `/${slug}/`;
    const prefixoComBarra = prefixoNaRaiz && texto.slice(Math.max(0, i - 2), i) === '}/';
    if (prefixoAbsoluto || prefixoComBarra || /['"`}(]/.test(antes)) achadas.push(i);
  }
  return achadas;
}

/** Prefixos de subpasta declarados no componente: const X = '/slug/sub/'. */
function prefixosDeSubpasta(texto, slug) {
  return [...texto.matchAll(new RegExp(`['"\`]/${escapar(slug)}/([^'"\`/]+)/['"\`]`, 'g'))].map((m) => m[1]);
}

async function emWebp(arquivo) {
  const bytes = readFileSync(arquivo);
  if (bytes.length < TAMANHO_MIN) return { motivo: 'pequena' };
  const png = /\.png$/i.test(arquivo);
  const webp = await sharp(bytes, { failOn: 'none' })
    .rotate()
    .resize({ width: LARGURA_MAX, withoutEnlargement: true })
    .webp({ quality: png ? 90 : 80 })
    .toBuffer();
  if (webp.length > bytes.length * 0.9) return { motivo: 'WebP não ficou 10% menor' };
  return { webp, antes: bytes.length };
}

/** Fim da tag JSX que começa em `inicio` ("<img"): conta chaves e aspas, porque onClick={() => ...} tem ">". */
function fimDaTag(texto, inicio) {
  let chaves = 0;
  let aspas = null;
  for (let i = inicio + 1; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === aspas && texto[i - 1] !== '\\') aspas = null;
      continue;
    }
    if (c === '{') chaves++;
    else if (c === '}') chaves--;
    else if (chaves === 0 && (c === '"' || c === "'")) aspas = c;
    else if (chaves === 0 && c === '>') return i;
  }
  return -1;
}

/**
 * <img> da função principal (export default) depois da primeira </section>
 * dela, sem `loading`. Devolve também quantas ficaram de fora e por quê.
 */
function imgsSobDemanda(texto) {
  const principal = texto.indexOf('export default function');
  const fimDoTopo = principal < 0 ? -1 : texto.indexOf('</section>', principal);
  const resultado = { alvo: [], noTopo: 0, emAuxiliar: 0, jaDeclaram: 0 };
  for (const m of texto.matchAll(/<img\b/g)) {
    const i = m.index;
    const fim = fimDaTag(texto, i);
    if (fim < 0) continue;
    const tag = texto.slice(i, fim + 1);
    if (/\bloading=/.test(tag)) resultado.jaDeclaram++;
    else if (principal < 0 || i < principal) resultado.emAuxiliar++;
    else if (fimDoTopo < 0 || i < fimDoTopo) resultado.noTopo++;
    else resultado.alvo.push(i);
  }
  return resultado;
}

function comCarregamentoSobDemanda(texto) {
  const { alvo } = imgsSobDemanda(texto);
  let novo = texto;
  for (const i of [...alvo].reverse()) novo = `${novo.slice(0, i)}<img loading="lazy"${novo.slice(i + 4)}`;
  return { texto: novo, n: alvo.length };
}

async function otimizar(slug, { analisar }) {
  const pastaPublica = join(RAIZ, 'public', slug);
  const fontes = fontesDaLanding(slug);
  const textos = new Map(fontes.map((f) => [f, readFileSync(f, 'utf8')]));
  const fotos = fotosDaPasta(pastaPublica);
  const porNome = new Map();
  for (const f of fotos) porNome.set(basename(f), (porNome.get(basename(f)) ?? 0) + 1);

  const pastaMidia = join(pastaPublica, 'midia');
  let antes = 0;
  let depois = 0;
  let trocadas = 0;
  const ficaram = [];
  for (const foto of fotos) {
    const rel = relative(pastaPublica, foto).split('\\').join('/');
    const comCitacao = [...textos].filter(([, t]) => citacoes(t, rel, slug).length);
    if (!comCitacao.length) continue; // não citada pelo componente: fica como está
    if (porNome.get(basename(foto)) > 1) {
      ficaram.push(`${rel} (mesmo nome em duas pastas)`);
      continue;
    }
    const r = await emWebp(foto);
    if (!r.webp) {
      if (r.motivo !== 'pequena') ficaram.push(`${rel} (${r.motivo})`);
      continue;
    }
    antes += r.antes;
    depois += r.webp.length;
    trocadas++;
    if (analisar) continue;
    mkdirSync(pastaMidia, { recursive: true });
    const nome = `${createHash('sha1').update(r.webp).digest('hex').slice(0, 16)}.webp`;
    writeFileSync(join(pastaMidia, nome), r.webp);
    for (const [arquivo, texto] of comCitacao) {
      let novo = texto;
      for (const i of citacoes(texto, rel, slug).reverse()) novo = novo.slice(0, i) + `midia/${nome}` + novo.slice(i + rel.length);
      textos.set(arquivo, novo);
    }
  }

  const subpastas = new Set();
  let preguicosas = 0;
  const contagemImg = { noTopo: 0, emAuxiliar: 0, jaDeclaram: 0 };
  for (const [arquivo, texto] of textos) {
    if (!arquivo.endsWith('.tsx')) continue;
    for (const s of prefixosDeSubpasta(texto, slug)) subpastas.add(s);
    const info = imgsSobDemanda(texto);
    contagemImg.noTopo += info.noTopo;
    contagemImg.emAuxiliar += info.emAuxiliar;
    contagemImg.jaDeclaram += info.jaDeclaram;
    if (analisar) {
      preguicosas += info.alvo.length;
      continue;
    }
    const r = comCarregamentoSobDemanda(texto);
    textos.set(arquivo, r.texto);
    preguicosas += r.n;
  }
  if (!analisar) {
    for (const [arquivo, texto] of textos) if (texto !== readFileSync(arquivo, 'utf8')) writeFileSync(arquivo, texto);
  }

  const mb = (n) => (n / 1e6).toFixed(2);
  console.log(
    `${slug}: ${trocadas} fotos em WebP (${mb(antes)} → ${mb(depois)} MB) | lazy novo: ${preguicosas}` +
      ` | já declaram: ${contagemImg.jaDeclaram} | topo: ${contagemImg.noTopo} | em auxiliar: ${contagemImg.emAuxiliar}` +
      (subpastas.size ? ` | prefixo de subpasta: ${[...subpastas].join(', ')}` : '') +
      (ficaram.length ? ` | ficaram: ${ficaram.join('; ')}` : ''),
  );
  return { antes, depois };
}

const args = process.argv.slice(2);
const analisar = args.includes('--analisar');
const slugs = args.filter((a) => !a.startsWith('--'));
if (!slugs.length) {
  console.error('Uso: node scripts/otimizar-fotos-landing.mjs [--analisar] <slug> [...]');
  process.exit(1);
}
let total = { antes: 0, depois: 0 };
for (const slug of slugs) {
  const r = await otimizar(slug, { analisar });
  total = { antes: total.antes + r.antes, depois: total.depois + r.depois };
}
console.log(`TOTAL: ${(total.antes / 1e6).toFixed(1)} → ${(total.depois / 1e6).toFixed(1)} MB${analisar ? ' (análise, nada gravado)' : ''}`);
