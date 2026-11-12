import type { Metadata } from 'next';
import './authoria.css';
import Authoria from '@/components/Authoria';
import AtalhosLanding from '@/components/AtalhosLanding';
import LightboxPlantas from '@/components/LightboxPlantas';
import RodapeLotus from '@/components/RodapeLotus';

// Metadata portada do <head> de authoria/index.html (paridade de SEO com o estático).
export const metadata: Metadata = {
  title: 'Authoria by Tebas, apartamentos de 3 e 4 suítes, 137 a 211 m², em Jundiaí | Imobiliária Lotus Brokers',
  description:
    'Authoria by Tebas, em Jundiaí: 3 e 4 suítes de 137 a 211 m², arquitetura HOCH, paisagismo Benedito Abbud e piscina coberta. Agende a visita ao decorado.',
  keywords:
    'Authoria by Tebas, apartamento Jundiaí, alto padrão Jundiaí, 4 suítes Jundiaí, 3 suítes, lançamento Jundiaí, Jardim Santa Teresa, Tebas, apartamento de luxo, imóvel Jundiaí',
  authors: [{ name: 'Tebas' }],
  // Canonical na própria página desde 02/10/2026. Antes apontava para o site da
  // construtora, e o Google tratava esta página como cópia daquela: ela não
  // aparecia como página da Lotus. Decisão da Lotus: todas as landings no Google.
  alternates: { canonical: 'https://www.lotusbrokers.com.br/authoria' },
  openGraph: {
    type: 'website',
    title: 'Authoria by Tebas | Alto padrão em Jundiaí, 3 e 4 suítes',
    description:
      'Um encontro raro entre exclusividade, natureza e arquitetura. Apartamentos de 137 a 211 m² em Jundiaí, com lazer completo. Entrega Agosto/2026.',
    images: ['/authoria/a046.jpg'],
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function AuthoriaPage() {
  return (
    <>
      <Authoria />
      <RodapeLotus />
      <AtalhosLanding />
      <LightboxPlantas />
    </>
  );
}
