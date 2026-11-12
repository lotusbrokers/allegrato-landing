/**
 * Perguntas frequentes de /lotus-anunciar.
 *
 * Mesma separação de lib/home-faq.ts: a seção desenha esta lista e a rota
 * monta o FAQPage dela. Até 28/10/2026 o FAQPage era uma cópia antiga, com
 * perguntas escritas de outro jeito e sem a do prazo de venda.
 */
import type { PerguntaFrequente } from './home-faq';

export const FAQ_ANUNCIAR: PerguntaFrequente[] = [
  { q: 'Quanto a Lotus cobra?', a: 'A comissão segue a tabela do CRECI-SP e só é cobrada quando o imóvel é vendido. Avaliação é gratuita e sem compromisso.' },
  { q: 'A avaliação é de graça?', a: 'Sim. A estimativa online é imediata e a avaliação presencial com o especialista também não tem custo.' },
  // Três perguntas de "avaliação de imóvel em Jundiaí" (Radar C9, 12/11/2026).
  { q: 'Como a Lotus calcula o valor do imóvel?', a: 'Com uma análise comparativa de mercado: o especialista visita o imóvel e o compara com imóveis parecidos à venda no mesmo bairro, ajustando por metragem, estado de conservação, vagas e localização.' },
  { q: 'O que eu recebo depois da avaliação?', a: 'Um relatório com os imóveis comparáveis usados e a faixa de preço sugerida para anunciar, explicado pelo especialista do bairro.' },
  { q: 'A avaliação da Lotus vale para o banco ou para a Justiça?', a: 'Não. Ela serve para definir o preço de venda. No financiamento, o banco faz a própria avaliação; inventário, partilha e processos judiciais podem exigir laudo técnico de avaliação, pela norma ABNT NBR 14653.' },
  { q: 'Preciso dar exclusividade?', a: 'A Gestão Exclusiva rende mais (foco, marketing e boletim), mas a decisão é sua. O especialista explica as opções com transparência.' },
  { q: 'Quanto tempo leva para vender?', a: 'Depende do imóvel e do preço, mas com avaliação certa e marketing premium a venda costuma ser bem mais rápida que um anúncio genérico.' },
];
