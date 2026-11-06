import type { Metadata } from 'next';
import './avalon.css';
import Avalon from '@/components/Avalon';
import AtalhosLanding from '@/components/AtalhosLanding';
import LightboxPlantas from '@/components/LightboxPlantas';
import RodapeLotus from '@/components/RodapeLotus';
// Playfair Display e Montserrat ficam no projeto (app/_fontes): o build não
// depende do Google. As variáveis alimentam --serif/--sans do avalon.css.
import { montserrat, playfair } from '@/app/_fontes/playfair-montserrat';

// Metadata portada do <head> do fonte estático.
export const metadata: Metadata = {
  title: 'Avalon Residencial, apartamentos de 78,5 e 108 m² em Jundiaí | Imobiliária Lotus Brokers',
  description:
    'Avalon Residencial, da F A Oliva. Apartamentos de 78,5 e 108 m², 2 e 3 dormitórios com suíte, 19 áreas de lazer, piscina coberta e aquecida. Vila Hortolândia, Jundiaí/SP.',
  keywords:
    'Avalon Residencial, apartamento Jundiaí, Vila Hortolândia, F A Oliva, 3 dormitórios com suíte, piscina aquecida',
  alternates: { canonical: 'https://www.lotusbrokers.com.br/avalon' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'Avalon Residencial, Vila Hortolândia, Jundiaí/SP',
    description:
      'Apartamentos de 78,5 e 108 m² com suíte, 19 áreas de lazer e piscina coberta e aquecida.',
    images: ['/avalon/a001.jpg'],
  },
};

export default function AvalonPage() {
  return (
    <div className={`${playfair.variable} ${montserrat.variable} avalon-root`}>
      <Avalon />
      <RodapeLotus />
      <AtalhosLanding />
      <LightboxPlantas />
    </div>
  );
}
