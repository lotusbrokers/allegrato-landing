import type { Metadata, Viewport } from 'next';
import './gran-ville-santo-angelo.css';
import GranVilleSantoAngelo from '@/components/GranVilleSantoAngelo';
import AtalhosLanding from '@/components/AtalhosLanding';
import LightboxPlantas from '@/components/LightboxPlantas';
import RodapeLotus from '@/components/RodapeLotus';

// Metadata portada do <head> do index.html original (valores EXATOS).
export const viewport: Viewport = { themeColor: '#2A3826' };

export const metadata: Metadata = {
  title:
    'Gran Ville Santo Angelo, loteamento de alto padrão em Itupeva | Imobiliária Lotus Brokers',
  description:
    'Gran Ville Santo Angelo: o novo bairro planejado em Itupeva-SP. 450 mil m² com 200 mil m² de Mata Atlântica preservada, clube privativo, complexo esportivo e lotes a partir de 360 m². Novo urbanismo da GP Desenvolvimento Urbano.',
  keywords:
    'Gran Ville Santo Angelo, loteamento Itupeva, lotes Itupeva, bairro planejado, novo urbanismo, GP Desenvolvimento Urbano, lotes alto padrão, condomínio Itupeva, Jundiaí, Mata Atlântica',
  authors: [{ name: 'GP Desenvolvimento Urbano' }],
  robots: 'index, follow',
  // Canonical na própria página desde 02/10/2026. Antes apontava para o site da
  // construtora, e o Google tratava esta página como cópia daquela: ela não
  // aparecia como página da Lotus. Decisão da Lotus: todas as landings no Google.
  alternates: { canonical: 'https://www.lotusbrokers.com.br/gran-ville-santo-angelo' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Lotus Brokers',
    title: 'Gran Ville Santo Angelo, Loteamento de Alto Padrão em Itupeva-SP',
    description:
      'O novo bairro planejado em Itupeva. 450 mil m², 200 mil m² de Mata Atlântica preservada, clube privativo e lotes a partir de 360 m².',
    images: ['/gran-ville-santo-angelo/a038.jpg'],
    url: 'https://www.lotusbrokers.com.br/gran-ville-santo-angelo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gran Ville Santo Angelo, Itupeva-SP',
    description:
      'O novo bairro planejado em Itupeva. Novo urbanismo, clube privativo e Mata Atlântica preservada.',
    images: ['/gran-ville-santo-angelo/a038.jpg'],
  },
};

export default function Page() {
  return (
    <>
      <GranVilleSantoAngelo />
      <RodapeLotus />
      <AtalhosLanding />
      <LightboxPlantas />
    </>
  );
}
