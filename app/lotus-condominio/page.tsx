import type { Metadata } from 'next';
import LotusCondominios from '@/components/LotusCondominios';
import { getCondominiosCards, isCondominioApresentavel } from '@/lib/condominios';

/**
 * Índice /lotus-condominio — lista os condomínios publicados no dashboard.
 *
 * Até 28/09/2026 esta rota não tinha página: redirecionava para o primeiro
 * condomínio publicado. Só que o breadcrumb das páginas [id] já mostrava
 * "Condomínios" apontando para cá, e o que o visitante recebia era um
 * condomínio qualquer em vez da lista. Agora é a lista.
 *
 * ISR de 1h, igual às rotas [id]: condomínio publicado no dashboard aparece
 * aqui sozinho, sem deploy.
 */

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lotusbrokers.com.br';

export const metadata: Metadata = {
  title: 'Condomínios em Jundiaí e Itupeva: fotos, estrutura e localização | Lotus Brokers',
  description:
    'Conheça por dentro os condomínios de Jundiaí e Itupeva: fotos, estrutura de lazer, localização e bairro de cada um, com quem acompanha o que entra e sai.',
  alternates: { canonical: `${SITE}/lotus-condominio` },
  openGraph: {
    siteName: 'Lotus Brokers',
    type: 'website',
    url: `${SITE}/lotus-condominio`,
    title: 'Condomínios de Jundiaí e Itupeva, por dentro',
    description:
      'Fotos, estrutura, lazer e localização de cada condomínio acompanhado pela Lotus.',
  },
  twitter: { card: 'summary_large_image' },
};

export default async function LotusCondominioIndex() {
  // Falha do banco não pode derrubar a rota: getCondominiosCards já loga e
  // devolve lista vazia, e a página cai no estado vazio — que convida a falar
  // com um especialista em vez de mostrar tela em branco ou inventar dados.
  const cards = await getCondominiosCards();

  // Mesma regra do resto do site: entra quem tem o que mostrar. Ordem
  // alfabética, que é a única previsível para quem procura um nome específico.
  const condominios = cards
    .filter(isCondominioApresentavel)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  // ItemList com os condomínios reais da página, na mesma ordem em que aparecem
  // — anunciar item que a página não mostra é o que o Google proíbe.
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Condomínios em Jundiaí e Itupeva',
    numberOfItems: condominios.length,
    itemListElement: condominios.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: [c.nome, c.bairro, c.cidade].filter(Boolean).join(', '),
      url: `${SITE}/lotus-condominio/${c.slug}`,
    })),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Condomínios', item: `${SITE}/lotus-condominio` },
    ],
  };

  return (
    <>
      {/* "<" escapado: nenhum nome de condomínio pode fechar o <script> antes da hora. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, '\\u003c') }}
      />
      <LotusCondominios condominios={condominios} />
    </>
  );
}
