import type { Metadata } from 'next';
import LotusAnunciar from '@/components/LotusAnunciar';
import { FAQ_ANUNCIAR } from '@/lib/anunciar-faq';

// Metadata portada de lotus-anunciar/index.html (<helmet>) — paridade de SEO com o estático.
// TODO go-live: revisar canonical/og:url para o domínio final e publicar sitemap/robots.
// Título, description e H1 com "avaliação de imóvel em Jundiaí" desde 12/11/2026
// (Radar Competitivo C9: a busca de proprietário que a página disputa).
export const metadata: Metadata = {
  title: 'Avaliação de imóvel em Jundiaí e Itupeva | Lotus Brokers',
  description:
    'Avaliação de imóvel em Jundiaí e Itupeva, sem custo: comparação com imóveis do bairro, visita do especialista e relatório com a faixa de preço.',
  alternates: { canonical: 'https://www.lotusbrokers.com.br/lotus-anunciar' },
  openGraph: {
    siteName: 'Lotus Brokers',
    type: 'website',
    url: 'https://www.lotusbrokers.com.br/lotus-anunciar',
    title: 'Avaliação de imóvel em Jundiaí, com a Lotus',
    description:
      'Avaliação sem custo, processo transparente e um especialista do seu bairro. Saiba quanto vale o seu imóvel.',
    images: [
      'https://www.lotusbrokers.com.br/home-hero-jundiai.jpg',
    ],
  },
  twitter: { card: 'summary_large_image' },
};

// JSON-LD Service (portado literal do <helmet> do estático).
const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Avaliação e venda de imóveis, Lotus Brokers',
  serviceType: 'Intermediação imobiliária e avaliação',
  // Mesmas cidades do RealEstateAgent de app/layout.tsx (decisão D026).
  areaServed: ['Jundiaí', 'Itupeva'],
  provider: { '@type': 'RealEstateAgent', name: 'Lotus Brokers' },
};

// JSON-LD FAQPage. Sai da mesma lista que a seção desenha: o FAQPage não pode
// anunciar pergunta que a página não mostra (ver lib/anunciar-faq.ts).
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ANUNCIAR.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function LotusAnunciarPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LotusAnunciar />
    </>
  );
}
