import type { Metadata, Viewport } from 'next';
import Vigore from '@/components/Vigore';
import './vigore.css';
import AtalhosLanding from '@/components/AtalhosLanding';
import LightboxPlantas from '@/components/LightboxPlantas';
import RodapeLotus from '@/components/RodapeLotus';

// theme-color do <head> do estático (Next 15: vai no export viewport, não em metadata).
export const viewport: Viewport = {
};

// Metadata portada do <helmet> do fonte estático (vigore/index.html).
// canonical/og:url seguem o padrão das demais rotas (domínio lotusbrokers.com.br).
export const metadata: Metadata = {
  title:
    'Residencial Vigóre, da Santa Angela, no Colônia, Jundiaí | Imobiliária Lotus Brokers',
  description:
    'Residencial Vigóre, da Santa Angela Construtora: apartamentos de 53 a 54 m², 2 dormitórios e lazer completo no bairro Colônia, em Jundiaí/SP. 3 torres, 280 unidades. Atendimento pela Imobiliária Lotus Brokers, autorizada a comercializar os empreendimentos da Santa Angela.',
  keywords: [
    'Residencial Vigóre',
    'apartamento Jundiaí',
    'bairro Colônia',
    'apartamento 2 dormitórios',
    'lançamento Jundiaí',
    'Santa Angela',
    'lazer completo',
    'Avenida Nami Azém',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.lotusbrokers.com.br/vigore' },
  openGraph: {
    type: 'website',
    url: 'https://www.lotusbrokers.com.br/vigore',
    locale: 'pt_BR',
    title: 'Residencial Vigóre, no Colônia, Jundiaí | Lotus Brokers',
    description:
      'Apartamentos de 53 a 54 m² com lazer completo no bairro Colônia. 3 torres, 280 unidades. Atendimento pela Imobiliária Lotus Brokers.',
  },
  twitter: { card: 'summary_large_image' },
};

// JSON-LD ApartmentComplex portado EXATO do <helmet> do estático.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ApartmentComplex',
  name: 'Residencial Vigóre',
  url: '',
  description:
    'Apartamentos de 53 a 54 m², 2 dormitórios e lazer completo no bairro Colônia, em Jundiaí/SP. 3 torres e 280 unidades.',
  numberOfAccommodationUnits: 280,
  petsAllowed: true,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Avenida Nami Azém, 1093 - Bairro Colônia',
    addressLocality: 'Jundiaí',
    addressRegion: 'SP',
    postalCode: '13218-000',
    addressCountry: 'BR',
  },
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Piscina adulto e infantil', value: true },
    {
      '@type': 'LocationFeatureSpecification',
      name: 'Salão de festas com espaço gourmet',
      value: true,
    },
    { '@type': 'LocationFeatureSpecification', name: 'Quadra recreativa', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Espaço fitness', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Espaço pet', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Playground', value: true },
  ],
  // Sem preço: a Lotus pediu "valor a consultar" nas landings da Santa Angela
  // (exceto o Reserva Castanheira) em 05/10/2026, quando a tabela de setembro venceu.
  makesOffer: {
    '@type': 'Offer',
    description: 'Apartamento Torre A, 53 m². Valor a consultar.',
    seller: { '@type': 'Organization', name: 'Construtora Santa Angela' },
    // Quem oferece e atende é a Lotus; a construtora segue como vendedora do imóvel.
    offeredBy: {
      '@type': 'RealEstateAgent',
      name: 'Imobiliária Lotus Brokers',
      url: 'https://www.lotusbrokers.com.br',
    },
  },
};

export default function VigorePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Vigore />
      <RodapeLotus />
      <AtalhosLanding />
      <LightboxPlantas />
    </>
  );
}
