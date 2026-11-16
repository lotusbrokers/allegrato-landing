import type { Metadata } from 'next';
import Link from 'next/link';
import LotusBusca from '@/components/LotusBusca';
import { listBairros } from '@/lib/bairros';
import { getImoveisBusca } from '@/lib/imoveis';
import { RECORTES_DA_BUSCA } from '@/lib/recortes-busca';

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

  // As subpáginas de Comprar (lib/recortes-busca), antes do rodapé: até
  // 16/11/2026 só os guias de bairro e o sitemap levavam até elas.
  const buscasProntas = (
    <section style={{ background: '#f7f2e8', padding: '56px 32px 40px' }}>
      <div style={{ maxWidth: 1480, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: 'clamp(22px,2.6vw,30px)', color: '#15241c', margin: '0 0 8px' }}>
          Buscas prontas
        </h2>
        <p style={{ fontSize: 15, color: '#3f6249', fontWeight: 300, margin: '0 0 22px' }}>
          Os imóveis à venda de cada cidade, numa página só.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {RECORTES_DA_BUSCA.map((r) => (
            <Link
              key={r.slug}
              href={`/lotus-busca/${r.slug}`}
              style={{ fontSize: 14, color: '#15241c', background: '#ece2cf', borderRadius: 40, padding: '9px 16px' }}
            >
              {r.titulo}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      {/* Só os nomes dos guias: o conteúdo deles não vai para o navegador. */}
      <LotusBusca imoveis={imoveis} bairrosDoGuia={listBairros().map((b) => b.nome)} complemento={buscasProntas} />
    </>
  );
}
