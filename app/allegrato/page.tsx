import type { Metadata } from 'next';
import './allegrato.css';
import Allegrato from '@/components/Allegrato';
import AtalhosLanding from '@/components/AtalhosLanding';
import LightboxPlantas from '@/components/LightboxPlantas';
import RodapeLotus from '@/components/RodapeLotus';

// Metadata portada do <head> do fonte estático.
export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: 'Allegrato Residencial Santa Angela no Medeiros, Jundiaí | Imobiliária Lotus Brokers',
  description:
    'Allegrato Residencial, da Santa Angela Construtora, no Medeiros, Jundiaí/SP: lazer entregue decorado, condomínio econômico e Minha Casa Minha Vida. Atendimento pela Imobiliária Lotus Brokers, autorizada a comercializar os empreendimentos da Santa Angela.',
  keywords:
    'Allegrato Residencial, apartamento Medeiros, Jundiaí, Minha Casa Minha Vida, MCMV, Santa Angela, lançamento Jundiaí',
  alternates: { canonical: 'https://www.lotusbrokers.com.br/allegrato' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'Allegrato Residencial, Medeiros, Jundiaí | Lotus Brokers',
    description:
      'Lançamento Minha Casa Minha Vida no Medeiros: lazer entregue decorado e condomínio econômico.',
    images: ['/allegrato/a012.jpg'],
  },
};

export default function AllegratoPage() {
  return (
    <>
      <Allegrato />
      <RodapeLotus />
      <AtalhosLanding />
      <LightboxPlantas />
    </>
  );
}
