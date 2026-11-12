import type { Metadata } from 'next';
import Link from 'next/link';
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

  // Os guias de bairro da cidade do recorte, antes do rodapé. Com o acervo
  // pequeno (/casas-em-itupeva tinha 1 casa em 11/2026, "página fraca" na
  // auditoria de SEO), a página continua levando a conteúdo real da cidade.
  const guias = listBairros()
    .filter((b) => b.publicado && b.cidade === recorte.cidade)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const complemento = guias.length > 0 && (
    <section style={{ background: '#f7f2e8', padding: '56px 32px 40px' }}>
      <div style={{ maxWidth: 1480, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: 'clamp(22px,2.6vw,30px)', color: '#15241c', margin: '0 0 8px' }}>
          Bairros de {recorte.cidade}
        </h2>
        <p style={{ fontSize: 15, color: '#3f6249', fontWeight: 300, margin: '0 0 22px' }}>
          Guias da Lotus com o dia a dia, os acessos e os imóveis de cada bairro.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {guias.map((b) => (
            <Link
              key={b.slug}
              href={`/lotus-bairro/${b.slug}`}
              style={{ fontSize: 14, color: '#15241c', background: '#ece2cf', borderRadius: 40, padding: '9px 16px' }}
            >
              {b.nome}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <LotusBusca
        imoveis={imoveis}
        bairrosDoGuia={listBairros().map((b) => b.nome)}
        titulo={recorte.titulo}
        complemento={complemento || undefined}
      />
    </>
  );
}
