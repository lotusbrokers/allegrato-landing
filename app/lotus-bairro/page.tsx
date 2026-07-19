import type { Metadata } from 'next';
import LotusBairro from '@/components/LotusBairro';

// Metadata portada do <head>/<helmet> de lotus-bairro/index.html (paridade de SEO).
// TODO go-live: trocar canonical/og:url para o domínio final, remover noindex e publicar sitemap.
export const metadata: Metadata = {
  title:
    'Morar em Eloy Chaves, Jundiaí — guia do bairro e imóveis | Lotus Brokers',
  description:
    'Guia honesto de Eloy Chaves, Jundiaí: como é viver no bairro, escolas, comércio, lazer e imóveis com o especialista da Lotus.',
  alternates: { canonical: 'https://www.lotusbrokers.com.br/lotus-bairro' },
  openGraph: {
    siteName: 'Lotus Brokers',
    type: 'website',
    url: 'https://www.lotusbrokers.com.br/lotus-bairro',
    title: 'Morar em Eloy Chaves, Jundiaí — o guia da Lotus',
    description:
      'Como é viver em Eloy Chaves: o dia a dia, o que tem por perto e os imóveis certos, com quem conhece cada rua.',
    images: [
      'https://i.postimg.cc/nzx1wvHM/Chat-GPT-Image-25-de-jun-de-2026-14-04-13.png',
    ],
  },
  twitter: { card: 'summary_large_image' },
};

// JSON-LD portados do estático (Place, FAQPage, BreadcrumbList).
const placeLd = {
  '@context': 'https://schema.org',
  '@type': 'Place',
  name: 'Eloy Chaves, Jundiaí',
  description:
    'Eloy Chaves é um bairro residencial e arborizado de Jundiaí (SP), procurado por famílias pela tranquilidade, proximidade da Serra do Japi e boa infraestrutura. Faixa de preço médio entre R$ 600 mil e R$ 2,5 milhões.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Jundiaí',
    addressRegion: 'SP',
    addressCountry: 'BR',
  },
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Eloy Chaves é um bom bairro para famílias?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. Eloy Chaves é um dos bairros mais procurados por famílias em Jundiaí: ruas arborizadas e tranquilas, boas escolas a poucos minutos, comércio de bairro e proximidade com a Serra do Japi e parques.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quanto custa morar em Eloy Chaves?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'O preço médio do m² para compra gira em torno de R$ 7.500. Casas costumam variar de R$ 600 mil a R$ 2,5 milhões; apartamentos a partir de cerca de R$ 450 mil. Locação de casa parte de aproximadamente R$ 3.000/mês.',
      },
    },
    {
      '@type': 'Question',
      name: 'Eloy Chaves fica perto da Serra do Japi?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. O acesso à Serra do Japi e a parques da região fica a cerca de 10 minutos de carro, um dos motivos da procura pelo bairro.',
      },
    },
  ],
};

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Bairros',
      item: 'https://www.lotusbrokers.com.br/lotus-bairro',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Jundiaí',
      item: 'https://www.lotusbrokers.com.br/lotus-bairro/jundiai',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Eloy Chaves',
      item: 'https://www.lotusbrokers.com.br/lotus-bairro/jundiai/eloy-chaves',
    },
  ],
};

export default function LotusBairroPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <LotusBairro />
    </>
  );
}
