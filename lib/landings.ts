import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Descoberta das landing pages ricas e o link do card de empreendimento.
 *
 * Mora fora de `lancamentos.ts` para o teste importar sem arrastar o client do
 * Supabase junto (mesmo motivo das funções puras em `lead.ts`).
 *
 * Uma landing é um diretório de rota em `app/` que não pertence ao portal —
 * derivado do filesystem, não de uma lista escrita à mão. A lista à mão JÁ ficou
 * defasada uma vez: 8 landings migradas depois dela (allegrato, avalon,
 * best-view-residence, doppio-jundiai, maita, odeon, portal-dos-lagos,
 * sky-videiras) nunca foram registradas, e os cards delas em /lotus-lancamentos
 * caíam no WhatsApp em vez de abrir a página. Agora criar `app/<slug>/page.tsx`
 * basta: o link aparece sozinho, sem lista para esquecer de atualizar.
 *
 * `fs` é seguro aqui porque só Server Components chegam neste módulo
 * (app/lotus-home e app/lotus-lancamentos, via lancamentos.ts).
 */

// 'construtoras' entrou em 08/09/2026 e não tem o prefixo lotus-: sem estar
// aqui, a varredura de app/ a trataria como landing de empreendimento, e
// /construtoras viraria destino de card de lançamento.
const PORTAL_ROUTE = /^(lotus-|construtoras$|api$|meus-dados$)/;

/** Regra única de "este diretório de app/ é uma landing" — o teste reusa esta função. */
export function isLandingDir(appDir: string, name: string): boolean {
  return (
    !name.startsWith('[') && // rotas dinâmicas não são landings
    !PORTAL_ROUTE.test(name) &&
    existsSync(join(appDir, name, 'page.tsx'))
  );
}

/**
 * Landings servidas como HTML estático de public/<slug>/index.html, com rewrite
 * em next.config.mjs. Não vivem em app/, então a varredura do diretório não as
 * enxerga — daí a lista explícita. Ao converter uma para componente React,
 * remover o slug daqui e criar app/<slug>/.
 */
export const LANDINGS_HTML = ['altissimi', 'oasis', 'vila-triunfo', 'reserva-castanheira', 'santorini', 'epic-jundiai', 'mistral-jundiai', 'gioviale', 'lago-samambaia'] as const;

let cache: Set<string> | null = null;

export function landingSlugs(): Set<string> {
  if (cache) return cache;
  const appDir = join(process.cwd(), 'app');
  let slugs: string[] = [];
  try {
    slugs = readdirSync(appDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && isLandingDir(appDir, e.name))
      .map((e) => e.name);
  } catch (err) {
    // Sem app/ legível não dá para saber quais landings existem. Loga alto em vez
    // de degradar em silêncio: o sintoma seria a listagem inteira cair no contato.
    console.error('[landings] não foi possível ler app/:', err);
  }
  if (slugs.length === 0) {
    console.error('[landings] nenhuma landing encontrada em app/, cards vão cair no contato');
  }
  cache = new Set([...slugs, ...LANDINGS_HTML]);
  return cache;
}

/** slug a partir do nome (ex.: "Gran Ville Santo Ângelo" -> "gran-ville-santo-angelo") */
export function slugify(nome: string): string {
  return nome
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/**
 * Rota da landing rica para um slug, ou null se não existir página.
 * Fonte única de verdade do link do card (banco e fallback estático).
 */
export function hrefForSlug(slug: string): string | null {
  return landingSlugs().has(slug) ? `/${slug}` : null;
}

/**
 * Slug da landing de um lançamento: o vínculo explícito do dash quando houver,
 * senão o nome normalizado.
 *
 * O explícito (coluna `landing_slug`, migration 0004) também passa pelo slugify:
 * ele vem de um campo de texto digitado à mão, então "Vivarte" ou " vivarte "
 * valem tanto quanto "vivarte" — a coluna deve poupar o operador de adivinhar,
 * não criar uma segunda forma de errar.
 */
export function slugParaLanding(landingSlug: string | null | undefined, nome: string): string {
  const explicito = landingSlug?.trim();
  if (explicito) return slugify(explicito);
  return LANDING_POR_NOME[slugify(nome)] ?? slugify(nome);
}

/**
 * Nomes do dash que não geram o slug da landing correspondente.
 *
 * O vínculo normal sai do nome, e funciona para quase todos. Estes dois não
 * batem por diferença de grafia, e o custo é alto: sem landing, o filtro
 * `temPaginaPropria` descarta o registro do banco, a entrada curada de
 * lib/developments.ts ocupa o lugar dele — e como ela traz a construtora
 * genérica, o empreendimento some da página da construtora de verdade.
 *
 *   "Vivart Grand Alamedas"  → falta o "e"; a landing é /vivarte.
 *                              Custa o único lançamento da Diretiva.
 *   "Authoria By Tebas"      → a landing é /authoria.
 *                              Custa um lançamento da Tebas.
 *
 * A correção definitiva é no dash, e existe campo próprio para ela: preencher
 * `landing_slug` (migration 0004) resolve sem tocar em código, e o valor
 * explícito tem precedência sobre este mapa. Corrigido lá, apagar a linha daqui.
 */
const LANDING_POR_NOME: Record<string, string> = {
  'vivart-grand-alamedas': 'vivarte',
  'authoria-by-tebas': 'authoria',
};
