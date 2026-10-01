/**
 * Valida o lastmod do sitemap publicado.
 *
 * O sintoma que isto pega: dezenas de URLs com o MESMO lastmod, no segundo —
 * é a hora do build vazando como "data de alteração". A regra que não pode
 * quebrar: refazer o build não é alterar a página.
 *
 *   node scripts/validar-lastmod.mjs                       # produção
 *   node scripts/validar-lastmod.mjs http://localhost:3000/sitemap.xml
 *
 * Sai com código 1 quando um mesmo instante aparece em 20 URLs ou mais — a
 * assinatura do carimbo de build. Lastmod recente em si não é erro: imóvel e
 * condomínio trazem o updated_at do dashboard, que pode ser de hoje; o script
 * só mostra quantos são, por grupo, para quem estiver olhando julgar.
 * Só lê; não altera nada.
 */
const url = process.argv[2] || 'https://www.lotusbrokers.com.br/sitemap.xml';
const LIMITE_DO_GRUPO = 20;

const xml = await (await fetch(url, { headers: { 'cache-control': 'no-cache' } })).text();
const entradas = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
  loc: (m[1].match(/<loc>([^<]*)<\/loc>/) || [])[1] || '',
  lastmod: (m[1].match(/<lastmod>([^<]*)<\/lastmod>/) || [])[1] || null,
}));

const porInstante = new Map();
for (const e of entradas) {
  if (!e.lastmod) continue;
  const k = e.lastmod;
  porInstante.set(k, [...(porInstante.get(k) || []), e.loc]);
}
const grupos = [...porInstante.entries()].sort((a, b) => b[1].length - a[1].length);
const agora = Date.now();
const recentes = entradas.filter((e) => e.lastmod && Math.abs(agora - new Date(e.lastmod).getTime()) < 2 * 3600 * 1000);
const semLastmod = entradas.filter((e) => !e.lastmod);

console.log(`${url}`);
console.log(`URLs: ${entradas.length} · com lastmod: ${entradas.length - semLastmod.length} · sem lastmod: ${semLastmod.length} · instantes distintos: ${porInstante.size}`);
console.log('Maiores grupos com o mesmo instante:');
for (const [instante, locs] of grupos.slice(0, 5)) {
  console.log(`  ${String(locs.length).padStart(3)} × ${instante}  ex.: ${locs.slice(0, 3).map((l) => l.replace(/^https?:\/\/[^/]+/, '')).join(', ')}`);
}
if (semLastmod.length) console.log('Sem lastmod: ' + semLastmod.map((e) => e.loc.replace(/^https?:\/\/[^/]+/, '')).join(', '));
if (recentes.length) {
  const porGrupo = {};
  for (const e of recentes) {
    const g = e.loc.replace(/^https?:\/\/[^/]+/, '').split('/')[1] || '(home)';
    porGrupo[g] = (porGrupo[g] || 0) + 1;
  }
  console.log(`Lastmod a menos de 2 h de agora: ${recentes.length} ${JSON.stringify(porGrupo)} — normal quando vem do updated_at do dashboard; suspeito se forem rotas estáticas.`);
}

const maior = grupos[0] ? grupos[0][1].length : 0;
const falhou = maior >= LIMITE_DO_GRUPO;
console.log(falhou ? `FALHOU: ${maior} URLs no mesmo instante (carimbo de build?)` : 'OK: nenhum instante compartilhado em massa.');
process.exit(falhou ? 1 : 0);
