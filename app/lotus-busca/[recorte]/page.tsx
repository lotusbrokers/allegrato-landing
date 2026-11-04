import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LotusBusca from '@/components/LotusBusca';
import { listBairros } from '@/lib/bairros';
import { getImoveisBusca } from '@/lib/imoveis';
import { RECORTES_DA_BUSCA, imoveisDoRecorte, recorteDaBusca } from '@/lib/recortes-busca';

const SITE = 'https://www.lotusbrokers.com.br';

// Mesma cadência de /lotus-busca: o recorte muda com o acervo.
export const revalidate = 3600;

// Só os recortes de lib/recortes-busca: outro endereço debaixo de /lotus-busca dá 404.
export const dynamicParams = false;

export function generateStaticParams(): { recorte: string }[] {
  return RECORTES_DA_BUSCA.map((r) => ({ recorte: r.slug }));
}

type Params = { params: Promise<{ recorte: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const recorte = recorteDaBusca((await params).recorte);
  if (!recorte) return {};
  const url = `${SITE}/lotus-busca/${recorte.slug}`;
  return {
    title: `${recorte.titulo} | Lotus Brokers`,
    description: recorte.descricao,
    alternates: { canonical: url },
    openGraph: {
      siteName: 'Lotus Brokers',
      type: 'website',
      url,
      title: `${recorte.titulo}, Lotus Brokers`,
      description: recorte.descricao,
      images: [`${SITE}/home-hero-jundiai.jpg`],
    },
    twitter: { card: 'summary_large_image' },
  };
}

/**
 * Recorte da busca (ver lib/recortes-busca): a página de /lotus-busca já
 * filtrada no servidor, com título e H1 próprios. Fora do menu, no sitemap.
 */
export default async function RecorteDaBuscaPage({ params }: Params) {
  const recorte = recorteDaBusca((await params).recorte);
  if (!recorte) notFound();
  const imoveis = imoveisDoRecorte(await getImoveisBusca(), recorte);

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: recorte.titulo,
    itemListElement: imoveis.map((im, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE}/lotus-imovel/${im.codigo}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <LotusBusca imoveis={imoveis} bairrosDoGuia={listBairros().map((b) => b.nome)} titulo={recorte.titulo} />
    </>
  );
}
