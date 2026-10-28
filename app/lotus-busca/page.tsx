import type { Metadata } from 'next';
import LotusBusca from '@/components/LotusBusca';
import { listBairros } from '@/lib/bairros';
import { getImoveisBusca } from '@/lib/imoveis';

const SITE = 'https://www.lotusbrokers.com.br';

// ISR: revalida o catálogo da busca a cada 1h (mesma cadência das rotas de
// imóvel). Os dados vêm do Supabase em runtime, não no build.
export const revalidate = 3600;

// Metadata portada do <helmet> de lotus-busca. "Alugar" saiu do título e da
// descrição em 27/10/2026: a Lotus não trabalha com locação, e a busca virou só
// de compra (o seletor da página leva quem quer anunciar a /lotus-anunciar).
export const metadata: Metadata = {
  title: 'Comprar imóveis em Jundiaí e Itupeva | Lotus Brokers',
  description:
    'Busque imóveis à venda em Jundiaí, Itupeva e região com a Lotus Brokers. Descreva o imóvel que você procura e o especialista do bairro caça pra você.',
  alternates: { canonical: 'https://www.lotusbrokers.com.br/lotus-busca' },
  openGraph: {
    siteName: 'Lotus Brokers',
    type: 'website',
    url: 'https://www.lotusbrokers.com.br/lotus-busca',
    title: 'Comprar imóveis em Jundiaí e Itupeva, Lotus Brokers',
    description:
      'Casas, apartamentos, coberturas e terrenos em Jundiaí, Itupeva e região, curados pelo especialista do bairro.',
    images: [
      'https://www.lotusbrokers.com.br/home-hero-jundiai.jpg',
    ],
  },
  twitter: { card: 'summary_large_image' },
};

// JSON-LD: só o ItemList. O WebSite que vinha do estático saiu em 16/10/2026: a
// busca dele apontava para /comprar, endereço que não existe, e o WebSite do
// site agora mora na home, que é onde o Google o procura.
export default async function LotusBuscaPage() {
  const imoveis = await getImoveisBusca();

  // ItemList JSON-LD montado a partir dos imóveis reais (antes eram URLs fixas).
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: imoveis.map((im, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE}/lotus-imovel/${im.codigo}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      {/* Só os nomes dos guias: o conteúdo deles não vai para o navegador. */}
      <LotusBusca imoveis={imoveis} bairrosDoGuia={listBairros().map((b) => b.nome)} />
    </>
  );
}
