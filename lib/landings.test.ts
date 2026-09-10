import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { slugify, hrefForSlug, isLandingDir, slugParaLanding, LANDINGS_HTML } from './landings.ts';
import { developmentsFallback } from './developments.ts';

/* ---------- slugify ---------- */
// acentos viram ASCII (é o que faz "Maxx Santa Ângela" bater com app/maxx-santa-angela)
assert.equal(slugify('Maxx Santa Ângela'), 'maxx-santa-angela');
assert.equal(slugify('Gran Ville Santo Ângelo'), 'gran-ville-santo-angelo');
assert.equal(slugify('Maitá'), 'maita');
assert.equal(slugify('Avelã'), 'avela');
// pontuação e espaços repetidos colapsam num hífen só, sem sobrar nas pontas
assert.equal(slugify('  Doppio — Jundiaí!  '), 'doppio-jundiai');

/* ---------- hrefForSlug ---------- */
// Regressão que motivou o teste: estas 8 landings foram migradas depois da lista
// escrita à mão e ficaram de fora dela, então seus cards em /lotus-lancamentos
// caíam no WhatsApp em vez de abrir a página.
for (const slug of [
  'allegrato', 'avalon', 'best-view-residence', 'doppio-jundiai',
  'maita', 'odeon', 'portal-dos-lagos', 'sky-videiras',
]) {
  assert.equal(hrefForSlug(slug), `/${slug}`, `landing ${slug} deveria linkar`);
}

// Rotas do portal não são landings de empreendimento — um lançamento chamado
// "Lotus Busca" não pode sequestrar a página de busca.
for (const slug of ['lotus-busca', 'lotus-home', 'meus-dados', 'api']) {
  assert.equal(hrefForSlug(slug), null, `${slug} não é landing`);
}

// Slug sem página: card cai no contato, não gera link quebrado.
// O exemplo era 'lago-samambaia' até a landing dela existir. Nome inventado
// agora, para o teste não voltar a quebrar quando um empreendimento novo entrar.
assert.equal(hrefForSlug('empreendimento-que-nao-existe'), null);

/* ---------- slugParaLanding (coluna landing_slug, migration 0004) ---------- */
// O motivo da coluna existir: nome comercial livre, link continua certo.
assert.equal(slugParaLanding('vivarte', 'Vivarte Grand Alamedas'), 'vivarte');
assert.equal(hrefForSlug(slugParaLanding('vivarte', 'Vivarte Grand Alamedas')), '/vivarte');
// Sem vínculo explícito, mantém o comportamento antigo (deriva do nome).
assert.equal(slugParaLanding(null, 'Maxx Santa Ângela'), 'maxx-santa-angela');
assert.equal(slugParaLanding(undefined, 'Allegrato'), 'allegrato');
// Coluna presente mas vazia/em branco não conta como vínculo — cai no nome.
assert.equal(slugParaLanding('', 'Allegrato'), 'allegrato');
assert.equal(slugParaLanding('   ', 'Allegrato'), 'allegrato');
// O explícito também é normalizado: quem digita no dash não precisa acertar a forma.
assert.equal(slugParaLanding(' Vivarte ', 'qualquer coisa'), 'vivarte');
assert.equal(slugParaLanding('Best View Residence', 'x'), 'best-view-residence');
// Slug explícito para página que não existe: sem link, e sem link quebrado.
assert.equal(hrefForSlug(slugParaLanding('pagina-inexistente', 'x')), null);

// A trava de verdade: toda landing em app/ tem que linkar. Criar uma pasta nova
// sem mais nada já é suficiente, e este teste falha se algum filtro a excluir.
const appDir = join(process.cwd(), 'app');
const landings = readdirSync(appDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && isLandingDir(appDir, e.name))
  .map((e) => e.name);

assert.ok(landings.length >= 23, `esperava ao menos 23 landings em app/, achei ${landings.length}`);
for (const slug of landings) {
  assert.equal(hrefForSlug(slug), `/${slug}`, `landing ${slug} existe em app/ mas não linka`);
}

/* ---------- toda landing aparece na vitrine ---------- */
// A vitrine (home e /lotus-lancamentos) mostra os lançamentos do Supabase MAIS as
// landings que nenhum deles representa, e os dados dessas últimas saem de
// developmentsFallback. Uma landing sem entrada lá só apareceria se alguém a
// cadastrasse no dash — que é exatamente como 8 páginas prontas ficaram
// invisíveis antes. Criar app/<slug>/page.tsx sem a entrada quebra aqui.
const fallbackSlugs = developmentsFallback
  .map((d) => d.href?.replace(/^\//, '') ?? '')
  .filter(Boolean);

for (const slug of landings) {
  assert.ok(
    fallbackSlugs.includes(slug),
    `landing ${slug} não tem entrada em lib/developments.ts — não apareceria na vitrine sem cadastro no dash`,
  );
}

/* ---------- landings estáticas ---------- */
// As de LANDINGS_HTML não moram em app/: são public/<slug>/index.html servidos
// por um rewrite. O slug listado sem o arquivo no lugar vira 404 no link do
// card, que é a única forma de quebrar delas.
for (const slug of LANDINGS_HTML) {
  assert.ok(
    existsSync(join(process.cwd(), 'public', slug, 'index.html')),
    `landing estática ${slug} está em LANDINGS_HTML mas não tem public/${slug}/index.html`,
  );
  assert.equal(hrefForSlug(slug), `/${slug}`, `landing estática ${slug} deveria linkar`);
}

/* ---------- a landing estática não pode ir ao ar em branco ---------- */
// Como o Lago Samambaia foi: o template esconde cada bloco com
// `.reveal{opacity:0}` e conta com um script que devolve a classe `in` quando o
// bloco entra na tela — script que o export "arquivo único" não traz. O texto
// fica no DOM, invisível, e a página abre vazia.
//
// Escapou da revisão porque o próprio template mostra tudo dentro de um
// `@media (prefers-reduced-motion:reduce)`: quem revisa com animações reduzidas
// vê a página inteira. Só o navegador comum vê o branco.
//
// A correção mora no fim do arquivo, no bloco `data-lt-revelar`. Uma landing
// nova que chegue escondendo `.reveal` sem trazer nem o script próprio nem o
// bloco falha aqui, antes de ir ao ar.
const escondeReveal = /\.reveal\s*\{[^}]*opacity\s*:\s*0/;

for (const slug of LANDINGS_HTML) {
  const html = readFileSync(join(process.cwd(), 'public', slug, 'index.html'), 'utf8');

  if (escondeReveal.test(html)) {
    assert.ok(
      html.includes('data-lt-revelar') || html.includes('IntersectionObserver'),
      `landing ${slug} esconde .reveal e não traz como mostrar de volta — abriria em branco`,
    );
  }

  // O rodapé institucional é quem identifica a imobiliária responsável pela
  // página (CRECI e CNPJ inclusive) e quem devolve o visitante ao portal.
  assert.ok(
    html.includes('data-rodape-lotus'),
    `landing ${slug} está sem o rodapé da Lotus`,
  );
}

// E o contrário: entrada apontando para página que não existe vira card com link
// quebrado na home, já que o fallback não passa por hrefForSlug. Vale tanto a
// pasta em app/ quanto o HTML estático — as duas são página de verdade.
const paginas = new Set([...landings, ...LANDINGS_HTML]);
for (const slug of fallbackSlugs) {
  assert.ok(
    paginas.has(slug),
    `lib/developments.ts aponta para /${slug}, que não existe nem em app/ nem em LANDINGS_HTML`,
  );
}

console.log(
  `ok — ${landings.length} landings em app/ + ${LANDINGS_HTML.length} estáticas, todas linkáveis`,
);

/* ---------- nomes que não geram o slug da landing ---------- */
// Sem esta correção o registro do banco é descartado por não ter landing, a
// entrada curada ocupa o lugar dele com a construtora genérica, e o
// empreendimento some da página da construtora de verdade.
assert.equal(slugParaLanding(null, 'Vivart Grand Alamedas'), 'vivarte');
assert.equal(slugParaLanding(null, 'Authoria By Tebas'), 'authoria');
// O landing_slug explícito continua tendo precedência sobre o mapa.
assert.equal(slugParaLanding('outra-landing', 'Vivart Grand Alamedas'), 'outra-landing');
// Nome sem correção segue derivando normalmente.
assert.equal(slugParaLanding(null, 'Allegrato'), 'allegrato');
