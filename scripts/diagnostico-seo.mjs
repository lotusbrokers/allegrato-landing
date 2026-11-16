/**
 * Diagnóstico de indexação do portal: rastreia o site como o robô de busca o
 * vê no primeiro momento (o HTML que o servidor entrega, sem executar
 * JavaScript) e grava seo-data/diagnostico.csv (uma linha por URL, com causa, severidade e
 * correção proposta) e seo-data/diagnostico-resumo.json.
 *
 *   node scripts/diagnostico-seo.mjs                          # produção
 *   node scripts/diagnostico-seo.mjs http://localhost:3000    # site local
 *
 * Parte do sitemap e segue os links internos (até 900 páginas, 3 por vez, sem
 * baixar imagem). Para cada URL mede: status, redirecionamento, tempo até os
 * cabeçalhos, X-Robots-Tag, meta robots, canonical, hreflang, título,
 * descrição, H1, texto visível no HTML inicial (sem cabeçalho, menu e rodapé),
 * JSON-LD, presença no sitemap e quantas páginas linkam para ela.
 *
 * O motivo que o Google dá a cada página ("descoberta, não indexada" etc.) só
 * existe no Search Console: este script mede os sinais técnicos que levam a
 * esses motivos. Só lê; não altera nada.
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'https://www.lotusbrokers.com.br').replace(/\/$/, '');
const ORIGEM = new URL(BASE).origin;
const HOST_OFICIAL = 'www.lotusbrokers.com.br';
const LIMITE = 900;
const PARALELO = 3;
const AGENTE = 'Mozilla/5.0 (compatible; LotusDiagnosticoSEO/1.0; +https://www.lotusbrokers.com.br)';
const ARQUIVO_ESTATICO = /\.(jpe?g|png|webp|avif|gif|svg|ico|pdf|css|js|mjs|json|xml|txt|woff2?|ttf|mp4|webm|zip)$/i;

// --- Leitura -------------------------------------------------------------------

async function pedir(url) {
  const inicio = Date.now();
  try {
    const r = await fetch(url, { redirect: 'manual', headers: { 'user-agent': AGENTE, accept: 'text/html,*/*' }, signal: AbortSignal.timeout(30_000) });
    const ttfb = Date.now() - inicio;
    const tipo = r.headers.get('content-type') || '';
    const corpo = tipo.includes('html') || tipo.includes('xml') || tipo.includes('text') ? await r.text() : '';
    return { status: r.status, ttfb, cabecalhos: r.headers, corpo, erro: null };
  } catch (e) {
    return { status: 0, ttfb: Date.now() - inicio, cabecalhos: new Headers(), corpo: '', erro: String(e.message || e) };
  }
}

/** Segue redirecionamentos à mão, para ver a cadeia inteira. */
async function cadeia(url, max = 6) {
  const passos = [];
  let atual = url;
  for (let i = 0; i < max; i++) {
    const r = await pedir(atual);
    passos.push({ url: atual, status: r.status });
    const destino = r.cabecalhos.get('location');
    if (r.status >= 300 && r.status < 400 && destino) atual = new URL(destino, atual).href;
    else return { passos, final: r };
  }
  return { passos, final: null };
}

// --- HTML ----------------------------------------------------------------------

const entidades = (s) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const semTags = (s) => entidades(s.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const atributo = (tag, nome) => (tag.match(new RegExp(`\\b${nome}="([^"]*)"`, 'i')) || [])[1] ?? null;

function lerHtml(html) {
  const fimHead = html.search(/<\/head>/i);
  const head = fimHead > 0 ? html.slice(0, fimHead) : html;
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const meta = (nome) => {
    const t = metas.find((m) => (atributo(m, 'name') || atributo(m, 'property') || '').toLowerCase() === nome);
    return t ? entidades(atributo(t, 'content') ?? '') : null;
  };
  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const canonical = links.find((l) => (atributo(l, 'rel') || '').toLowerCase() === 'canonical');
  const hreflang = links.filter((l) => atributo(l, 'hreflang')).map((l) => `${atributo(l, 'hreflang')}=${atributo(l, 'href')}`);

  const jsonld = [];
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const dado = JSON.parse(m[1]);
      const coletar = (o) => {
        if (Array.isArray(o)) return o.forEach(coletar);
        if (o && typeof o === 'object') {
          if (o['@type']) jsonld.push([].concat(o['@type']).join('+'));
          if (o['@graph']) coletar(o['@graph']);
        }
      };
      coletar(dado);
    } catch {
      jsonld.push('JSON-LD-INVALIDO');
    }
  }

  const corpo = html
    .slice(fimHead > 0 ? fimHead : 0)
    .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, ' ');
  const h1 = [...corpo.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => semTags(m[1])).filter(Boolean);
  // Texto principal: sem cabeçalho, menus e rodapé, que se repetem em todas as páginas.
  const principal = corpo.replace(/<(header|nav|footer)\b[\s\S]*?<\/\1>/gi, ' ');
  const texto = semTags(principal);
  const hrefs = [...corpo.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map((m) => entidades(m[1]));

  return {
    titulo: semTags((head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] ?? ''),
    descricao: meta('description'),
    robots: meta('robots'),
    canonical: canonical ? atributo(canonical, 'href') : null,
    hreflang,
    h1,
    texto,
    jsonld,
    hrefs,
  };
}

/** URL interna normalizada (sem âncora, sem parâmetros, sem barra final), ou null. */
function interna(href, pagina) {
  if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return null;
  let u;
  try {
    u = new URL(href, pagina);
  } catch {
    return null;
  }
  const host = u.host.replace(/^lotusbrokers\.com\.br$/, HOST_OFICIAL);
  if (host !== new URL(ORIGEM).host && host !== HOST_OFICIAL) return null;
  if (u.pathname.startsWith('/_next/') || u.pathname.startsWith('/api/') || ARQUIVO_ESTATICO.test(u.pathname)) return null;
  const caminho = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, '') : '/';
  return { chave: `${ORIGEM}${caminho}`, comParametro: Boolean(u.search), comBarra: u.pathname.length > 1 && u.pathname.endsWith('/'), hostErrado: u.host === 'lotusbrokers.com.br' || u.protocol === 'http:' };
}

/** A correção proposta para cada causa (a coluna correcao_proposta do CSV). */
const CORRECOES = [
  [/erro de servidor|erro\/timeout/, 'Ver o log do servidor (Easypanel) e corrigir até voltar a 200'],
  [/^(404|410)/, 'Tirar do sitemap e dos links; se a página foi removida de propósito, manter 404/410'],
  [/redirecionamento/, 'Trocar no sitemap e nos links internos pela URL final (sem passar pelo redirecionamento)'],
  [/X-Robots-Tag|meta robots/, 'Confirmar se a página deve ser indexada; se sim, tirar o noindex (o motivo está no código)'],
  [/canonical aponta|canonical para outro host|sem canonical|canonical não absoluto/, 'Canonical absoluto, https, www e autorreferente'],
  [/título repetido|descrição repetida/, 'Título e descrição únicos, com o nome da página'],
  [/título com/, 'Título em até 70 caracteres, com a cidade'],
  [/descrição com|sem meta description/, 'Descrição única entre 70 e 160 caracteres'],
  [/sem H1|\d+ H1|H1 repetido/, 'Um H1 por página, com a palavra-chave'],
  [/só via JavaScript/, 'Pré-renderizar o conteúdo no HTML que o servidor entrega'],
  [/conteúdo fino/, 'Conteúdo próprio e útil (ver seo-data/conteudo.csv)'],
  [/quase duplicada/, 'Diferenciar o conteúdo ou consolidar (decidir com o dono antes de redirecionar)'],
  [/sem dados estruturados|JSON-LD inválido/, 'JSON-LD válido e adequado ao tipo de página'],
  [/fora do sitemap/, 'Incluir no sitemap se for indexável; senão, noindex'],
  [/órfã|linkam para ela/, 'Links internos contextuais de páginas fortes (hub, guia do bairro, relacionados)'],
  [/barra final|host\/protocolo/, 'Corrigir os links internos para a URL final'],
  [/servidor lento/, 'Investigar o tempo de resposta do servidor'],
  [/soft 404/, 'Responder 404/410 de verdade'],
];
const correcaoPara = (causas) => [...new Set(causas.flatMap((c) => CORRECOES.filter(([re]) => re.test(c)).map(([, txt]) => txt)))].join(' | ');

// --- Rastreio --------------------------------------------------------------------

async function main() {
  mkdirSync('seo-data', { recursive: true });
  const robots = await pedir(`${ORIGEM}/robots.txt`);
  const mapa = await pedir(`${ORIGEM}/sitemap.xml`);
  let locs = [...mapa.corpo.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  // Sitemap index: abre os filhos.
  if (/<sitemapindex/i.test(mapa.corpo)) {
    const filhos = [];
    for (const f of locs) filhos.push(...[...(await pedir(f)).corpo.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
    locs = filhos;
  }
  // A mesma chave das URLs rastreadas: host oficial, sem barra final (a raiz fica "/").
  const chaveDe = (l) => {
    const u = new URL(l.replace(/^https?:\/\/(www\.)?lotusbrokers\.com\.br/, ORIGEM));
    return `${ORIGEM}${u.pathname.length > 1 ? u.pathname.replace(/\/+$/, '') : '/'}`;
  };
  const lastmods = new Map(
    [...mapa.corpo.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => [
      chaveDe(((m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1] ?? '').trim()),
      (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] ?? null,
    ]),
  );
  const noSitemap = new Set(locs.map(chaveDe));

  const fila = [...noSitemap];
  const vistos = new Set(fila);
  const paginas = new Map();
  const recebidos = new Map(); // destino -> Set(origens)
  const linksComProblema = new Map(); // destino -> { parametro, barra, hostErrado }

  async function visitar(url) {
    const r = await pedir(url);
    const p = { url, status: r.status, ttfb: r.ttfb, erro: r.erro, local: r.cabecalhos.get('location'), xRobots: r.cabecalhos.get('x-robots-tag'), linkHeader: r.cabecalhos.get('link'), encoding: r.cabecalhos.get('content-encoding'), cache: r.cabecalhos.get('cache-control'), html: null };
    if (r.status === 200 && r.corpo) {
      p.html = lerHtml(r.corpo);
      for (const href of p.html.hrefs) {
        const alvo = interna(href, url);
        if (!alvo) continue;
        if (alvo.chave !== url) {
          if (!recebidos.has(alvo.chave)) recebidos.set(alvo.chave, new Set());
          recebidos.get(alvo.chave).add(url);
        }
        if (alvo.comParametro || alvo.comBarra || alvo.hostErrado) {
          const x = linksComProblema.get(alvo.chave) ?? { parametro: 0, barra: 0, hostErrado: 0 };
          x.parametro += alvo.comParametro ? 1 : 0;
          x.barra += alvo.comBarra ? 1 : 0;
          x.hostErrado += alvo.hostErrado ? 1 : 0;
          linksComProblema.set(alvo.chave, x);
        }
        if (!vistos.has(alvo.chave) && vistos.size < LIMITE) {
          vistos.add(alvo.chave);
          fila.push(alvo.chave);
        }
      }
      delete p.html.hrefs;
    }
    paginas.set(url, p);
  }

  while (fila.length) {
    const lote = fila.splice(0, PARALELO);
    await Promise.all(lote.map(visitar));
    process.stdout.write(`\r${paginas.size} páginas lidas, ${fila.length} na fila   `);
  }
  process.stdout.write('\n');

  // Variações do domínio: http, sem www e barra final devem cair em um passo só no endereço oficial.
  const variacoes = {};
  for (const v of ['http://lotusbrokers.com.br/', 'https://lotusbrokers.com.br/', 'http://www.lotusbrokers.com.br/', 'https://lotusbrokers.com.br/lotus-blog', `${ORIGEM}/lotus-blog/`]) {
    if (!BASE.includes('lotusbrokers.com.br')) break;
    const c = await cadeia(v);
    variacoes[v] = c.passos.map((s) => `${s.status} ${s.url}`).join(' -> ');
  }

  // --- Duplicatas --------------------------------------------------------------
  const indexaveis = [...paginas.values()].filter((p) => p.status === 200 && p.html);
  const repetidos = (campo) => {
    const m = new Map();
    for (const p of indexaveis) {
      const v = campo(p);
      if (!v) continue;
      m.set(v, [...(m.get(v) ?? []), p.url]);
    }
    return new Map([...m].filter(([, us]) => us.length > 1));
  };
  const titulosRep = repetidos((p) => p.html.titulo.toLowerCase());
  const descRep = repetidos((p) => (p.html.descricao || '').toLowerCase());
  const h1Rep = repetidos((p) => (p.html.h1[0] || '').toLowerCase());
  // Quase duplicadas: Jaccard de trechos de 5 palavras do texto principal.
  const trechos = new Map(indexaveis.map((p) => {
    const palavras = p.html.texto.toLowerCase().split(' ').filter(Boolean);
    const s = new Set();
    for (let i = 0; i + 5 <= palavras.length; i += 2) s.add(palavras.slice(i, i + 5).join(' '));
    return [p.url, s];
  }));
  const quaseDup = new Map();
  const lista = [...trechos];
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const [a, sa] = lista[i];
      const [b, sb] = lista[j];
      if (sa.size < 30 || sb.size < 30) continue;
      let comum = 0;
      const [menor, maior] = sa.size < sb.size ? [sa, sb] : [sb, sa];
      for (const t of menor) if (maior.has(t)) comum++;
      const jac = comum / (sa.size + sb.size - comum);
      if (jac >= 0.8) {
        quaseDup.set(a, [...(quaseDup.get(a) ?? []), `${b} (${Math.round(jac * 100)}%)`]);
        quaseDup.set(b, [...(quaseDup.get(b) ?? []), `${a} (${Math.round(jac * 100)}%)`]);
      }
    }
  }

  // --- Classificação -------------------------------------------------------------
  const linhas = [];
  const porCausa = new Map();
  const conta = (causa, url) => porCausa.set(causa, [...(porCausa.get(causa) ?? []), url]);
  for (const p of paginas.values()) {
    const causas = [];
    let sev = 'baixa';
    const sobe = (s) => { if (s === 'alta' || (s === 'media' && sev === 'baixa')) sev = s; };
    const naSitemap = noSitemap.has(p.url);
    const nRecebidos = recebidos.get(p.url)?.size ?? 0;
    const h = p.html;

    if (p.status === 0) { causas.push(`erro/timeout: ${p.erro}`); sobe('alta'); }
    else if (p.status >= 500) { causas.push(`erro de servidor ${p.status}`); sobe('alta'); }
    else if (p.status === 404 || p.status === 410) { causas.push(`${p.status}${naSitemap ? ' no sitemap' : ''}`); sobe(naSitemap || nRecebidos ? 'alta' : 'media'); }
    else if (p.status >= 300 && p.status < 400) { causas.push(`redirecionamento ${p.status} -> ${p.local}${naSitemap ? ' (no sitemap)' : ''}`); sobe(naSitemap ? 'alta' : 'media'); }
    else if (p.status !== 200) { causas.push(`status ${p.status}`); sobe('alta'); }

    if (h) {
      if (/noindex/i.test(p.xRobots || '')) { causas.push(`X-Robots-Tag: ${p.xRobots}`); sobe('alta'); }
      if (/noindex/i.test(h.robots || '')) { causas.push(`meta robots: ${h.robots}`); sobe('alta'); }
      const can = h.canonical;
      if (!can) { causas.push('sem canonical'); sobe('media'); }
      else {
        let canUrl = null;
        try { canUrl = new URL(can, p.url); } catch { /* inválido */ }
        if (!/^https:\/\//.test(can)) { causas.push(`canonical não absoluto/https: ${can}`); sobe('media'); }
        if (canUrl && canUrl.host !== HOST_OFICIAL) { causas.push(`canonical para outro host: ${can}`); sobe('alta'); }
        const alvo = canUrl ? `${ORIGEM}${canUrl.pathname.length > 1 ? canUrl.pathname.replace(/\/+$/, '') : '/'}` : null;
        if (alvo && alvo !== p.url) { causas.push(`canonical aponta para outra página: ${can}`); sobe('alta'); }
      }
      if (!h.titulo) { causas.push('sem <title>'); sobe('media'); }
      else if (h.titulo.length > 70) causas.push(`título com ${h.titulo.length} caracteres`);
      if (titulosRep.has(h.titulo.toLowerCase())) { causas.push(`título repetido em ${titulosRep.get(h.titulo.toLowerCase()).length} páginas`); sobe('media'); }
      if (!h.descricao) { causas.push('sem meta description'); sobe('media'); }
      else if (h.descricao.length > 160 || h.descricao.length < 70) causas.push(`descrição com ${h.descricao.length} caracteres`);
      if (h.descricao && descRep.has(h.descricao.toLowerCase())) { causas.push(`descrição repetida em ${descRep.get(h.descricao.toLowerCase()).length} páginas`); sobe('media'); }
      if (h.h1.length === 0) { causas.push('sem H1'); sobe('media'); }
      else if (h.h1.length > 1) causas.push(`${h.h1.length} H1`);
      if (h.h1[0] && h1Rep.has(h.h1[0].toLowerCase())) causas.push(`H1 repetido em ${h1Rep.get(h.h1[0].toLowerCase()).length} páginas`);
      if (h.texto.length < 300) { causas.push(`conteúdo só via JavaScript ou quase vazio (${h.texto.length} caracteres no HTML inicial)`); sobe('alta'); }
      else if (h.texto.length < 1500) { causas.push(`conteúdo fino (${h.texto.length} caracteres de texto principal)`); sobe('media'); }
      if (quaseDup.has(p.url)) { causas.push(`quase duplicada de ${quaseDup.get(p.url).slice(0, 3).join(', ')}`); sobe('media'); }
      if (h.jsonld.length === 0) causas.push('sem dados estruturados');
      if (h.jsonld.includes('JSON-LD-INVALIDO')) { causas.push('JSON-LD inválido'); sobe('media'); }
      if (/n[aã]o encontrad|p[aá]gina n[aã]o existe|404/i.test(h.titulo)) { causas.push('soft 404 (título de página não encontrada)'); sobe('alta'); }
    }
    if (p.status === 200 && !naSitemap && !/noindex/i.test(`${h?.robots} ${p.xRobots}`)) { causas.push('fora do sitemap'); sobe('media'); }
    if (p.status === 200 && nRecebidos === 0 && p.url !== `${ORIGEM}/`) { causas.push('órfã (nenhum link interno no HTML inicial)'); sobe('media'); }
    else if (p.status === 200 && nRecebidos <= 2 && p.url !== `${ORIGEM}/`) causas.push(`só ${nRecebidos} página(s) linkam para ela`);
    const lp = linksComProblema.get(p.url);
    if (lp?.barra || lp?.hostErrado) { causas.push(`linkada com ${lp.barra ? 'barra final' : ''}${lp.barra && lp.hostErrado ? ' e ' : ''}${lp.hostErrado ? 'host/protocolo errado' : ''} (redirecionamento a cada clique)`); sobe('media'); }
    if (p.ttfb > 2000) { causas.push(`servidor lento (${p.ttfb} ms até a resposta)`); sobe('media'); }

    for (const c of causas) conta(c.replace(/\d+/g, 'N').replace(/:.*$/, '').replace(/ de http.*$/, '').trim(), p.url);
    linhas.push({
      url: p.url, status: p.status, ttfb_ms: p.ttfb, redirect_para: p.local ?? '', x_robots_tag: p.xRobots ?? '',
      meta_robots: h?.robots ?? '', canonical: h?.canonical ?? '', titulo: h?.titulo ?? '', titulo_chars: h?.titulo.length ?? 0,
      descricao_chars: h?.descricao?.length ?? 0, h1_qtd: h?.h1.length ?? 0, h1: h?.h1[0] ?? '', texto_chars: h?.texto.length ?? 0,
      jsonld: h ? [...new Set(h.jsonld)].join(' ') : '', hreflang: h?.hreflang.join(' ') ?? '', no_sitemap: naSitemap ? 'sim' : 'não',
      lastmod: lastmods.get(p.url) ?? '', links_recebidos: nRecebidos, causas: causas.join(' | '), severidade: causas.length ? sev : 'ok',
      correcao_proposta: correcaoPara(causas),
    });
  }

  const colunas = Object.keys(linhas[0]);
  const csv = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const ordem = { alta: 0, media: 1, baixa: 2, ok: 3 };
  linhas.sort((a, b) => ordem[a.severidade] - ordem[b.severidade] || a.url.localeCompare(b.url));
  writeFileSync('seo-data/diagnostico.csv', '﻿' + [colunas.join(','), ...linhas.map((l) => colunas.map((c) => csv(l[c])).join(','))].join('\n'));
  const resumo = {
    base: BASE,
    lido_em: new Date().toISOString(),
    robots_txt: robots.corpo,
    sitemap: { status: mapa.status, urls: locs.length, com_lastmod: [...lastmods.values()].filter(Boolean).length },
    paginas_lidas: paginas.size,
    variacoes_do_dominio: variacoes,
    por_causa: Object.fromEntries([...porCausa].sort((a, b) => b[1].length - a[1].length).map(([c, us]) => [c, us.length])),
    severidade: linhas.reduce((m, l) => ({ ...m, [l.severidade]: (m[l.severidade] ?? 0) + 1 }), {}),
  };
  writeFileSync('seo-data/diagnostico-resumo.json', JSON.stringify(resumo, null, 2));
  console.log(JSON.stringify({ ...resumo, robots_txt: resumo.robots_txt.split('\n').length + ' linhas' }, null, 2));
}

main();
