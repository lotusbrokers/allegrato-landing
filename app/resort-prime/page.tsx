import type { Metadata } from 'next';
import './resort-prime.css';
import ResortPrime from '@/components/ResortPrime';
import AtalhosLanding from '@/components/AtalhosLanding';
import LightboxPlantas from '@/components/LightboxPlantas';
import RodapeLotus from '@/components/RodapeLotus';

// Metadata portada do <head> de resort-prime/index.html (paridade de SEO com o estático).
export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title:
    'Resort Prime Santa Angela, lazer de resort em Jundiaí | Imobiliária Lotus Brokers',
  description:
    'Resort Prime, da Santa Angela Construtora, em Jundiaí: 4 torres, apartamentos de 68 a 112m², lazer completo estilo resort, Academia Céltica e Club Prime. Atendimento pela Imobiliária Lotus Brokers, autorizada a comercializar os empreendimentos da Santa Angela.',
  alternates: { canonical: 'https://www.lotusbrokers.com.br/resort-prime' },
  openGraph: {
    type: 'website',
    title: 'Resort Prime Santa Angela, Jundiaí | Lotus Brokers',
    description:
      'Resort Prime, da Santa Angela Construtora, em Jundiaí: 4 torres, apartamentos de 68 a 112m², lazer completo estilo resort, Academia Céltica e Club Prime. Atendimento pela Imobiliária Lotus Brokers, autorizada a comercializar os empreendimentos da Santa Angela.',
  },
};

export default function ResortPrimePage() {
  return (
    <>
      <ResortPrime />
      <RodapeLotus />
      <AtalhosLanding />
      <LightboxPlantas />
    </>
  );
}
