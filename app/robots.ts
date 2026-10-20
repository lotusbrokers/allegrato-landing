import type { MetadataRoute } from 'next';
import { siteIndexavel } from '@/lib/indexacao.mjs';

/**
 * robots.txt do portal.
 *
 * Existe sobretudo para declarar o sitemap: é assim que o Google sai de
 * "descobre página por página seguindo links" para "confere a lista toda".
 *
 * Bloqueios: /api (não é conteúdo), /area-do-corretor e /area-do-gestor (áreas
 * logadas, que também respondem com noindex). O resto é liberado.
 *
 * /meus-dados saiu da lista em 16/10/2026: ela fica fora do índice pelo
 * noindex do próprio layout, e o bloqueio aqui impedia o Google de ler esse
 * noindex (página bloqueada e linkada pode ser indexada só pelo endereço).
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
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/area-do-corretor', '/area-do-gestor'] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
