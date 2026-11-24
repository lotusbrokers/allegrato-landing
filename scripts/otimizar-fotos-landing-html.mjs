/**
 * Fotos das landings em HTML de public/ (LANDINGS_HTML) em WebP, e carregamento
 * sob demanda abaixo da primeira dobra. É o par de scripts/otimizar-fotos-landing.mjs,
 * que faz o mesmo nas landings feitas no app; a conversão das duas é a de
 * lib/fotos-webp.mjs.
 *
 *   node scripts/otimizar-fotos-landing-html.mjs --analisar santorini reserva-castanheira ...
 *   node scripts/otimizar-fotos-landing-html.mjs santorini reserva-castanheira ...
 *
 * POR QUE: a conversão de 27/10/2026 cobriu só as landings do app. Na auditoria
 * de SEO de 24/11/2026 a Santorini, em HTML, teve LCP de 10,6 s no PageSpeed
 * para celular, com 564 KiB a economizar em imagens, e a Reserva Castanheira
 * citava 21 fotos JPG (3,2 MB) sem carregamento sob demanda.
 *
 * O que faz, por landing (public/<slug>/index.html):
 *  1. cada JPG/PNG de public/<slug>/ com mais de 80 KB que o index.html cita vira
 *     public/<slug>/midia/<hash>.webp. A pasta midia/ entra: nas landings
 *     desempacotadas, as fotos originais do pacote ficam nela. compartilhar.jpg,
 *     a imagem da prévia de link, não entra;
 *  2. as citações passam a apontar para o WebP, menos dentro de <meta> e do
 *     JSON-LD: og:image e dados estruturados ficam no JPG, que toda prévia de
 *     link mostra (o WebP, nem sempre). Por isso o original FICA em public/;
 *  3. toda <img> com src depois do primeiro </section> do corpo, sem `loading`,
 *     ganha loading="lazy". O topo fica como estava, e nada muda dentro de
 *     <script>, <template> ou comentário (bundle que monta a página em
 *     JavaScript fica só com a troca de caminho).
 *
 * Landing com versão pré-renderizada (<div id="dc-prerender">, ver
 * lib/pre-render-landing.mjs) fica de fora: trocar o template muda a impressão
 * digital, e a versão montada teria de ser gerada de novo pelo
 * scripts/pre-renderizar-landing.mjs.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { emWebp, nomeDoWebp } from '../lib/fotos-webp.mjs';

const RAIZ = process.cwd();
const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function fotosDaPasta(pasta) {
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return fotosDaPasta(caminho);
    return /\.(jpe?g|png)$/i.test(nome) && nome !== 'compartilhar.jpg' ? [caminho] : [];
  });
}

/** Trechos [início, fim) que casam com as expressões. */
function trechos(html, expressoes) {
  return expressoes.flatMap((re) => [...html.matchAll(re)].map((m) => [m.index, m.index + m[0].length]));
}
const dentro = (i, faixas) => faixas.some(([a, b]) => i >= a && i < b);

/** Onde a troca de caminho não entra: og:image e afins, e o JSON-LD. */
const SEM_TROCA = [/<meta\b[^>]*>/gi, /<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi];
/** Onde o loading="lazy" não entra: código, molde inerte e comentário. */
const SEM_LAZY = [/<script\b[\s\S]*?<\/script>/gi, /<style\b[\s\S]*?<\/style>/gi, /<template\b[\s\S]*?<\/template>/gi, /<!--[\s\S]*?-->/g];

/**
 * Posições em que `rel` aparece como citação da foto: depois de "/<slug>/" ou
 * de aspas, parêntese ou ";" (&quot;), e antes de aspas, parêntese, "&", "\",
 * "?", "#", vírgula ou espaço.
 */
function citacoes(html, rel, slug, protegidos) {
  const achadas = [];
  for (const m of html.matchAll(new RegExp(escapar(rel), 'g'))) {
    const i = m.index;
    if (dentro(i, protegidos)) continue;
    const depois = html[i + rel.length] ?? '';
    if (depois && !/['"`)&\\?#,\s]/.test(depois)) continue;
    const prefixoAbsoluto = html.slice(Math.max(0, i - slug.length - 2), i) === `/${slug}/`;
    if (prefixoAbsoluto || /['"`(;]/.test(html[i - 1] ?? '')) achadas.push(i);
  }
  return achadas;
}

/** Posições das <img> com src, sem `loading`, depois do primeiro </section> do corpo. */
function imgsSobDemanda(html) {
  const fora = trechos(html, SEM_LAZY);
  const corpo = html.search(/<body\b/i);
  let fimDoTopo = -1;
  for (const m of html.matchAll(/<\/section>/gi)) {
    if (m.index > corpo && !dentro(m.index, fora)) {
      fimDoTopo = m.index;
      break;
    }
  }
  const resultado = { alvo: [], noTopo: 0, jaDeclaram: 0 };
  if (corpo < 0 || fimDoTopo < 0) return resultado;
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    if (m.index < corpo || dentro(m.index, fora) || !/\ssrc\s*=/i.test(m[0])) continue;
    if (/\sloading\s*=/i.test(m[0])) resultado.jaDeclaram++;
    else if (m.index < fimDoTopo) resultado.noTopo++;
    else resultado.alvo.push(m.index);
  }
  return resultado;
}

async function otimizar(slug, { analisar }) {
  const pasta = join(RAIZ, 'public', slug);
  const arquivoHtml = join(pasta, 'index.html');
  let html = readFileSync(arquivoHtml, 'utf8');
  if (/<div id="dc-prerender"/.test(html)) {
    console.log(`${slug}: fica de fora (versão pré-renderizada; ver lib/pre-render-landing.mjs)`);
    return { antes: 0, depois: 0 };
  }

  let antes = 0;
  let depois = 0;
  let trocadas = 0;
  let citacoesTrocadas = 0;
  const ficaram = [];
  for (const foto of fotosDaPasta(pasta)) {
    const rel = relative(pasta, foto).split(sep).join('/');
    const posicoes = citacoes(html, rel, slug, trechos(html, SEM_TROCA));
    if (!posicoes.length) continue; // não citada fora de <meta>/JSON-LD: fica como está
    const r = await emWebp(foto);
    if (!r.webp) {
      if (r.motivo !== 'pequena') ficaram.push(`${rel} (${r.motivo})`);
      continue;
    }
    antes += r.antes;
    depois += r.webp.length;
    trocadas++;
    citacoesTrocadas += posicoes.length;
    if (analisar) continue;
    const nome = nomeDoWebp(r.webp);
    mkdirSync(join(pasta, 'midia'), { recursive: true });
    writeFileSync(join(pasta, 'midia', nome), r.webp);
    for (const i of [...posicoes].reverse()) html = html.slice(0, i) + `midia/${nome}` + html.slice(i + rel.length);
  }

  const sobDemanda = imgsSobDemanda(html);
  if (!analisar) {
    for (const i of [...sobDemanda.alvo].reverse()) html = `${html.slice(0, i)}<img loading="lazy"${html.slice(i + 4)}`;
    writeFileSync(arquivoHtml, html);
  }

  const mb = (n) => (n / 1e6).toFixed(2);
  console.log(
    `${slug}: ${trocadas} fotos em WebP (${mb(antes)} → ${mb(depois)} MB, ${citacoesTrocadas} citações)` +
      ` | lazy novo: ${sobDemanda.alvo.length} | já declaram: ${sobDemanda.jaDeclaram} | topo: ${sobDemanda.noTopo}` +
      (ficaram.length ? ` | ficaram: ${ficaram.join('; ')}` : ''),
  );
  return { antes, depois };
}

const args = process.argv.slice(2);
const analisar = args.includes('--analisar');
const slugs = args.filter((a) => !a.startsWith('--'));
if (!slugs.length) {
  console.error('Uso: node scripts/otimizar-fotos-landing-html.mjs [--analisar] <slug> [...]');
  process.exitCode = 1;
} else {
  let total = { antes: 0, depois: 0 };
  for (const slug of slugs) {
    const r = await otimizar(slug, { analisar });
    total = { antes: total.antes + r.antes, depois: total.depois + r.depois };
  }
  console.log(`TOTAL: ${(total.antes / 1e6).toFixed(1)} → ${(total.depois / 1e6).toFixed(1)} MB${analisar ? ' (análise, nada gravado)' : ''}`);
}
