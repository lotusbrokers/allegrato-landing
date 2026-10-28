import type { Metadata } from 'next';
import LotusAnunciar from '@/components/LotusAnunciar';
import { FAQ_ANUNCIAR } from '@/lib/anunciar-faq';

// Metadata portada de lotus-anunciar/index.html (<helmet>) — paridade de SEO com o estático.
// TODO go-live: revisar canonical/og:url para o domínio final e publicar sitemap/robots.
export const metadata: Metadata = {
  title: 'Anuncie e avalie seu imóvel em Jundiaí e Itupeva | Lotus Brokers',
  description:
    'Descubra quanto vale o seu imóvel em Jundiaí e Itupeva. Avaliação justa, marketing premium e um especialista do seu bairro do anúncio à chave.',
  alternates: { canonical: 'https://www.lotusbrokers.com.br/lotus-anunciar' },
  openGraph: {
    siteName: 'Lotus Brokers',
    type: 'website',
    url: 'https://www.lotusbrokers.com.br/lotus-anunciar',
    title: 'Anuncie e avalie seu imóvel com a Lotus',
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
  areaServed: ['Jundiaí', 'Itupeva', 'Vinhedo', 'Valinhos'],
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
