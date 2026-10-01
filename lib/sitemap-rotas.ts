import type { MetadataRoute } from 'next';

/**
 * Páginas institucionais e de listagem do portal: existem independentemente
 * de dados, então entram no sitemap sempre.
 *
 * Mora fora de app/sitemap.ts para o teste e o gerador de datas
 * (scripts/datas-de-alteracao.mjs) enxergarem a mesma lista sem arrastar os
 * clients do banco que o sitemap importa.
 *
 * /lotus-condominio voltou em 28/09/2026, agora como índice de verdade: saiu
 * em 24/09 porque a rota só redirecionava, e anunciar redirecionamento no
 * sitemap vira "página com redirecionamento" no Search Console. /lotus-imovel
 * segue fora pelo mesmo motivo: continua sendo só redirecionamento.
 */
export const ROTAS_FIXAS: {
  rota: string;
  prioridade: number;
  frequencia: MetadataRoute.Sitemap[number]['changeFrequency'];
}[] = [
  { rota: '/', prioridade: 1.0, frequencia: 'daily' },
  { rota: '/lotus-busca', prioridade: 0.9, frequencia: 'daily' },
  { rota: '/lotus-lancamentos', prioridade: 0.9, frequencia: 'daily' },
  { rota: '/lotus-bairro', prioridade: 0.7, frequencia: 'weekly' },
  { rota: '/lotus-condominio', prioridade: 0.7, frequencia: 'weekly' },
  { rota: '/lotus-corretores', prioridade: 0.7, frequencia: 'weekly' },
  { rota: '/lotus-sobre', prioridade: 0.6, frequencia: 'monthly' },
  { rota: '/lotus-blog', prioridade: 0.7, frequencia: 'weekly' },
  { rota: '/lotus-faq', prioridade: 0.5, frequencia: 'monthly' },
  { rota: '/construtoras', prioridade: 0.6, frequencia: 'weekly' },
  { rota: '/lotus-anunciar', prioridade: 0.6, frequencia: 'monthly' },
  { rota: '/lotus-recrutamento', prioridade: 0.4, frequencia: 'monthly' },
  { rota: '/lotus-privacidade', prioridade: 0.2, frequencia: 'yearly' },
  { rota: '/lotus-termos', prioridade: 0.2, frequencia: 'yearly' },
  { rota: '/lotus-cookies', prioridade: 0.2, frequencia: 'yearly' },
];
