/**
 * Data da última alteração de cada rota estática do portal, para o lastmod do
 * sitemap (app/sitemap.ts).
 *
 * O que vem do banco (imóvel, condomínio, artigo) já carrega a própria data.
 * As rotas estáticas — institucionais, landings, guias de bairro, páginas de
 * construtora — não têm registro nenhum, e o sitemap carimbava todas com a
 * hora do build. Refazer o build não é alterar a página: um deploy sem mudança
 * de conteúdo movia o lastmod de 90 URLs, e o Google aprende a ignorar o
 * campo quando ele não é confiável.
 *
 * Aqui a data é a do último commit que tocou os arquivos-fonte da rota
 * (`git log -1 --format=%cI -- <arquivos>`), gravada em
 * lib/datas-de-alteracao.json. Bairros e construtoras vivem todos num mesmo
 * arquivo cada; para eles a data é a da própria entrada no histórico
 * (`git log -L`), para um bairro editado não mover a data dos outros 21.
 *
 * O JSON é versionado: se o build rodar sem git (container sem .git), o
 * arquivo commitado continua valendo. Mesmos commits, mesmo arquivo — a
 * saída é determinística, sem metadado de "gerado em".
 *
 *   npm run datas       — regenera o JSON (também roda no prebuild)
 *
 * Nunca escreve "agora": rota sem commit conhecido fica sem data, e o sitemap
 * omite o lastmod dela — melhor do que anunciar uma alteração que não houve.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = process.cwd();
const SAIDA = join(RAIZ, 'lib', 'datas-de-alteracao.json');

/** Páginas que existem independentemente de dados (mesma lista de lib/sitemap-rotas.ts). */
const ROTAS_FIXAS = [
  '/',
  '/lotus-busca',
  '/lotus-lancamentos',
  '/lotus-bairro',
  '/lotus-condominio',
  '/lotus-corretores',
  '/lotus-sobre',
  '/lotus-blog',
  '/lotus-faq',
  '/construtoras',
  '/lotus-anunciar',
  '/lotus-recrutamento',
  '/lotus-privacidade',
  '/lotus-termos',
  '/lotus-cookies',
];

/** Landings servidas de public/<slug>/index.html (espelha LANDINGS_HTML de lib/landings.ts). */
const LANDINGS_HTML = [
  'altissimi',
  'oasis',
  'vila-triunfo',
  'reserva-castanheira',
  'santorini',
  'epic-jundiai',
  'mistral-jundiai',
  'gioviale',
  'lago-samambaia',
  'villaggio-engordadouro',
  'reserva-di-medeiros',
  'edificio-trend',
  'auten-serrah',
];

// Componentes de moldura, presentes em dezenas de páginas: um ajuste no
// rodapé não é uma alteração de conteúdo de cada landing.
const MOLDURA = /^(RodapeLotus|AtalhosLanding|LightboxPlantas|LotusHeader|MobileMenu|CookieConsent|Analytics|PreloadHints|RodapeVoltarLancamentos|CtaSimulacao|ConsentimentoLgpd)$/;

const PORTAL_ROUTE = /^(lotus-|construtoras$|api$|meus-dados$)/;

function existe(p) {
  return existsSync(join(RAIZ, p));
}

/** Arquivos diretamente no diretório (sem descer em subrotas como [slug]). */
function arquivosDoDiretorio(dir) {
  if (!existe(dir)) return [];
  return readdirSync(join(RAIZ, dir), { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => `${dir}/${e.name}`);
}

/** Componentes que a page.tsx importa de components/, fora a moldura. */
function componentesDaPagina(pagina) {
  if (!existe(pagina)) return [];
  const fonte = readFileSync(join(RAIZ, pagina), 'utf8');
  const nomes = [...fonte.matchAll(/from\s+['"]@\/components\/([A-Za-z0-9_]+)['"]/g)].map((m) => m[1]);
  return nomes.filter((n) => !MOLDURA.test(n)).map((n) => `components/${n}.tsx`).filter(existe);
}

function landingsEmApp() {
  const appDir = join(RAIZ, 'app');
  return readdirSync(appDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('[') && !PORTAL_ROUTE.test(e.name) && existsSync(join(appDir, e.name, 'page.tsx')))
    .map((e) => e.name)
    .sort();
}

function paraIsoUtc(saidaDoGit) {
  const linha = saidaDoGit.split('\n')[0].trim();
  if (!linha) return undefined;
  const data = new Date(linha);
  return Number.isNaN(data.getTime()) ? undefined : data.toISOString();
}

/** Data (UTC, ISO) do último commit que tocou qualquer um dos caminhos; undefined sem histórico. */
function dataDoUltimoCommit(caminhos) {
  const existentes = caminhos.filter(existe);
  if (existentes.length === 0) return undefined;
  return paraIsoUtc(execFileSync('git', ['log', '-1', '--format=%cI', '--', ...existentes], { cwd: RAIZ, encoding: 'utf8' }));
}

/**
 * Data do último commit que alterou um trecho do arquivo: da linha que casa
 * com `inicio` até a primeira que casa com `fim`. É o `git log -L`, que segue
 * o trecho pelo histórico mesmo quando ele muda de lugar no arquivo.
 */
function dataDaEntrada(arquivo, inicio, fim) {
  try {
    return paraIsoUtc(execFileSync('git', ['log', '-n', '1', '--format=%cI', `-L/${inicio}/,/${fim}/:${arquivo}`], { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return undefined; // trecho não encontrado nesta versão do arquivo
  }
}

function fontesDaRotaFixa(rota) {
  if (rota === '/') return ['app/page.tsx', ...componentesDaPagina('app/page.tsx')];
  const dir = `app${rota}`;
  return [...arquivosDoDiretorio(dir), ...componentesDaPagina(`${dir}/page.tsx`)];
}

function fontesDaLanding(slug) {
  const dir = `app/${slug}`;
  return [...arquivosDoDiretorio(dir), ...componentesDaPagina(`${dir}/page.tsx`), `public/${slug}`];
}

/** Slugs declarados em lib/bairros.ts (um `const x: Bairro = { slug: '…' … };` por bairro). */
function slugsDosBairros() {
  const fonte = readFileSync(join(RAIZ, 'lib/bairros.ts'), 'utf8');
  return [...fonte.matchAll(/^  slug: '([a-z0-9-]+)',/gm)].map((m) => m[1]);
}

/**
 * Chaves do mapa CONTEUDO em lib/construtoras-conteudo.ts, com a linha exata
 * em que cada uma abre (`  'santa-angela': {` ou `  inkkorp: {`): o git log -L
 * usa expressão regular básica, em que `?` e `{` são literais, então a busca
 * parte da linha como ela está escrita.
 */
function chavesDasConstrutoras() {
  const fonte = readFileSync(join(RAIZ, 'lib/construtoras-conteudo.ts'), 'utf8');
  return [...fonte.matchAll(/^(  '?([a-z0-9-]+)'?: \{)$/gm)].map((m) => ({ chave: m[2], linha: m[1] }));
}

const maisRecente = (...isos) => isos.filter(Boolean).sort().at(-1);

function main() {
  let anterior = { rotas: {}, grupos: {} };
  try {
    anterior = JSON.parse(readFileSync(SAIDA, 'utf8'));
  } catch {
    // primeira geração
  }

  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: RAIZ, stdio: 'ignore' });
  } catch {
    console.log('[datas] git indisponível neste ambiente: mantido lib/datas-de-alteracao.json commitado.');
    return;
  }
  // Clone raso, comum em build de PaaS: o histórico só tem o último commit, e
  // toda rota sairia com a data dele — o mesmo carimbo em massa que este
  // script existe para evitar. Qualquer resposta que não seja "false" (git
  // antigo não conhece a opção) também mantém o JSON commitado.
  const raso = execFileSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: RAIZ, encoding: 'utf8' }).trim();
  if (raso !== 'false') {
    console.log('[datas] clone raso ou git sem a checagem: mantido lib/datas-de-alteracao.json commitado.');
    return;
  }

  const rotas = {};
  const semData = [];
  const registra = (rota, data) => {
    if (data) rotas[rota] = data;
    else if (anterior.rotas?.[rota]) rotas[rota] = anterior.rotas[rota];
    else semData.push(rota);
  };

  for (const rota of ROTAS_FIXAS) registra(rota, dataDoUltimoCommit(fontesDaRotaFixa(rota)));
  for (const slug of landingsEmApp()) registra(`/${slug}`, dataDoUltimoCommit(fontesDaLanding(slug)));
  for (const slug of LANDINGS_HTML) registra(`/${slug}`, dataDoUltimoCommit([`public/${slug}`]));

  // Bairros: o texto de cada um é a entrada dele em lib/bairros.ts, e é a data
  // dessa entrada que vale — um bairro editado não move a data dos outros 21.
  // Mexer no molde (rota dinâmica, componente, taxonomia) muda a moldura de
  // todos, não o conteúdo; fica só como reserva, para entrada sem histórico.
  const moldeBairros = dataDoUltimoCommit(['app/lotus-bairro/[slug]', 'components/LotusBairro.tsx', 'lib/bairros-taxonomia.ts']);
  for (const slug of slugsDosBairros()) {
    registra(`/lotus-bairro/${slug}`, dataDaEntrada('lib/bairros.ts', `slug: '${slug}'`, '^};') ?? moldeBairros);
  }
  // Construtoras: idem, com a entrada em lib/construtoras-conteudo.ts. A chave
  // do conteúdo é o slug da rota; construtora sem conteúdo curado fica com a
  // data do grupo (abaixo), que o sitemap usa como reserva.
  const moldeConstrutoras = dataDoUltimoCommit([
    'app/construtoras/[slug]',
    'lib/construtoras-paginas.ts',
    'lib/construtoras.ts',
    ...componentesDaPagina('app/construtoras/[slug]/page.tsx'),
  ]);
  for (const { chave, linha } of chavesDasConstrutoras()) {
    registra(`/construtoras/${chave}`, dataDaEntrada('lib/construtoras-conteudo.ts', `^${linha}`, '^  },') ?? moldeConstrutoras);
  }

  const grupos = {
    bairros: maisRecente(moldeBairros, dataDoUltimoCommit(['lib/bairros.ts'])) ?? anterior.grupos?.bairros,
    construtoras: maisRecente(moldeConstrutoras, dataDoUltimoCommit(['lib/construtoras-conteudo.ts'])) ?? anterior.grupos?.construtoras,
  };

  const ordenado = Object.fromEntries(Object.entries(rotas).sort(([a], [b]) => a.localeCompare(b)));
  const conteudo = JSON.stringify({ rotas: ordenado, grupos }, null, 2) + '\n';
  const mudou = !existsSync(SAIDA) || readFileSync(SAIDA, 'utf8') !== conteudo;
  if (mudou) writeFileSync(SAIDA, conteudo);
  console.log(
    `[datas] ${Object.keys(ordenado).length} rotas e ${Object.keys(grupos).length} grupos com data de commit` +
      (semData.length ? ` · sem histórico (ficam sem lastmod): ${semData.join(', ')}` : '') +
      (mudou ? ' · JSON atualizado' : ' · JSON já estava em dia'),
  );
}

main();
