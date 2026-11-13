import type { Metadata } from 'next';
import LotusBairrosIndex from '@/components/LotusBairrosIndex';
import { listBairros } from '@/lib/bairros';
import { imovelDoGuia } from '@/lib/bairros-taxonomia';
import { getImoveisBusca } from '@/lib/imoveis';
import { IMAGEM_COMPARTILHAMENTO } from '@/lib/site';

// A contagem de imóveis de cada cartão vem do banco: refeita de hora em hora,
// como nas demais rotas do portal.
export const revalidate = 3600;

// Domínio vem da env (NEXT_PUBLIC_SITE_URL) — não hard-codar.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lotusbrokers.com.br';

export const metadata: Metadata = {
  title: 'Bairros de Jundiaí e Itupeva: guias por bairro | Lotus Brokers',
  description:
    'Guias honestos dos bairros de Jundiaí e Itupeva: como é o dia a dia, escolas, comércio, lazer e faixa de preço, com o especialista da Lotus.',
  alternates: { canonical: `${SITE}/lotus-bairro` },
  openGraph: {
    siteName: 'Lotus Brokers',
    type: 'website',
    url: `${SITE}/lotus-bairro`,
    title: 'Bairros de Jundiaí e Itupeva, guias da Lotus',
    description:
      'Escolha o bairro certo, não só o imóvel certo. Guias por bairro de Jundiaí e Itupeva.',
    images: [IMAGEM_COMPARTILHAMENTO],
  },
  twitter: { card: 'summary_large_image' },
};

export default async function LotusBairroIndexPage() {
  const bairros = listBairros();

  // Quantos imóveis cada guia lista, pelo mesmo critério da página do guia
  // (auditoria do site de 13/11/2026: "Índice mostra quantos imóveis há por
  // bairro"). Banco fora do ar só tira a contagem; o índice continua de pé.
  const imoveis = await getImoveisBusca().catch((e) => {
    console.error('[lotus-bairro] imóveis indisponíveis:', e);
    return [];
  });
  const contagens = Object.fromEntries(bairros.map((b) => [b.slug, imoveis.filter((im) => imovelDoGuia(im, b)).length]));

  // JSON-LD: coleção de guias de bairro (lista dos itens reais).
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: bairros.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${b.nome}, ${b.cidade}`,
      url: `${SITE}/lotus-bairro/${b.slug}`,
    })),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Bairros', item: `${SITE}/lotus-bairro` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <LotusBairrosIndex bairros={bairros} contagens={contagens} />
    </>
  );
}
