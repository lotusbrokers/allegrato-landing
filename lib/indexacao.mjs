/**
 * Decide se o site pode ser indexado, a partir das variáveis de ambiente.
 *
 * Fonte única para o meta robots (app/layout.tsx), o robots.txt (app/robots.ts)
 * e o cabeçalho X-Robots-Tag (next.config.mjs). É .mjs, e não .ts, porque o
 * next.config.mjs precisa importar daqui — e ele não passa pelo TypeScript.
 *
 * Regra, nesta ordem:
 *  - SITE_INDEXABLE=false → NÃO indexa (staging, preview, qualquer ambiente
 *    que não deva aparecer no Google);
 *  - SITE_INDEXABLE=true  → indexa;
 *  - sem a variável: indexa só o build de produção no domínio oficial. Fora
 *    disso — `next dev`, ou NEXT_PUBLIC_SITE_URL apontando para outro
 *    domínio — fica em noindex por padrão.
 *
 * Domínio oficial AUSENTE conta como produção: deixar a produção em noindex
 * por falta de uma variável seria o pior erro possível aqui. Para desligar a
 * indexação num ambiente, o jeito explícito é SITE_INDEXABLE=false.
 *
 * As variáveis são lidas no build (next.config.mjs, metadata estática) — mudar
 * o valor exige novo deploy.
 */
export const DOMINIO_OFICIAL = 'https://www.lotusbrokers.com.br';

/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {boolean}
 */
export function siteIndexavel(env = process.env) {
  const flag = (env.SITE_INDEXABLE ?? '').trim().toLowerCase();
  if (['false', '0', 'off', 'no', 'nao', 'não'].includes(flag)) return false;
  if (['true', '1', 'on', 'yes', 'sim'].includes(flag)) return true;
  if (env.NODE_ENV !== 'production') return false;
  const url = (env.NEXT_PUBLIC_SITE_URL ?? '').trim();
  if (!url) return true;
  // Com ou sem www é o domínio oficial (o sem www redireciona para o com);
  // qualquer subdomínio (staging., preview.) ou outro host é noindex.
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'www.lotusbrokers.com.br' || host === 'lotusbrokers.com.br';
  } catch {
    // URL malformada na variável: trata como produção, pelo mesmo motivo acima.
    return true;
  }
}
