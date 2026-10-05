import type { MetadataRoute } from 'next';
import { siteIndexavel } from '@/lib/indexacao.mjs';

/**
 * robots.txt do portal.
 *
 * Existe sobretudo para declarar o sitemap: é assim que o Google sai de
 * "descobre página por página seguindo links" para "confere a lista toda".
 *
 * Bloqueios: /api (não é conteúdo), /meus-dados (área do titular, LGPD, não
 * deve ser indexada) e /area-do-corretor (área logada dos corretores, que
 * também responde com noindex). O resto é liberado.
 *
 * Ambiente que não deve ser indexado (SITE_INDEXABLE=false, staging, preview —
 * ver lib/indexacao.mjs) bloqueia tudo e não anuncia sitemap.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lotusbrokers.com.br';

export default function robots(): MetadataRoute.Robots {
  if (!siteIndexavel()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/meus-dados', '/area-do-corretor'] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
