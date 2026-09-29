import type { Metadata, Viewport } from 'next';
import MaxxSantaAngela from '@/components/MaxxSantaAngela';
import './maxx-santa-angela.css';
import AtalhosLanding from '@/components/AtalhosLanding';
import LightboxPlantas from '@/components/LightboxPlantas';
import RodapeLotus from '@/components/RodapeLotus';

// theme-color do <helmet> estático (no Next 15 vai no export `viewport`).
export const viewport: Viewport = {
};

// Metadata portada do <helmet> de maxx-santa-angela/index.html (paridade de SEO).
export const metadata: Metadata = {
  robots: { index: true, follow: true },
  // Sem canonical próprio a página herdava o da home (app/layout.tsx) e o Google
  // podia tratá-la como cópia da home.
  alternates: { canonical: 'https://www.lotusbrokers.com.br/maxx-santa-angela' },
  title:
    'Maxx Santa Angela, apartamentos ao lado do Maxi Shopping, Jundiaí | Imobiliária Lotus Brokers',
  description:
    'Maxx Santa Angela, da Santa Angela Construtora: apartamentos de 71 a 98 m², 2 e 3 dormitórios, ao lado do Maxi Shopping Jundiaí, com lazer completo e áreas comuns decoradas. Atendimento pela Imobiliária Lotus Brokers, autorizada a comercializar os empreendimentos da Santa Angela.',
  openGraph: {
    type: 'website',
    url: 'https://www.lotusbrokers.com.br/maxx-santa-angela',
    title: 'Maxx Santa Angela, ao lado do Maxi Shopping, Jundiaí | Lotus Brokers',
    description:
      'Apartamentos de 71 a 98 m² ao lado do Maxi Shopping Jundiaí. Lazer completo e a assinatura Santa Angela.',
    images: [
      '/maxx-santa-angela/capa-max-old.jpg',
    ],
  },
};

// JSON-LD Residence (portado do <script application/ld+json> do estático).
const residenceLd = {
  '@context': 'https://schema.org',
  '@type': 'Residence',
  name: 'Maxx Santa Angela',
  description:
    'Apartamentos de 71 a 98 m², 2 e 3 dormitórios, ao lado do Maxi Shopping Jundiaí.',
  image:
    '/maxx-santa-angela/capa-max-old.jpg',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Rua João Tonini, 400 - Vila Galvão',
    addressLocality: 'Jundiaí',
    addressRegion: 'SP',
    addressCountry: 'BR',
  },
  telephone: '+5511926143393',
};

export default function MaxxSantaAngelaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(residenceLd) }}
      />
      <MaxxSantaAngela />
      <RodapeLotus />
      <AtalhosLanding />
      <LightboxPlantas />
    </>
  );
}
