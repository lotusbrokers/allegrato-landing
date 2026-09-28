import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import LotusCondominio from '@/components/LotusCondominio';
import {
  getCondominio,
  getCondominioPorSlug,
  getCondominiosCards,
  slugCondominio,
  type CondominioRow,
  isCondominioApresentavel,
} from '@/lib/condominios';
import { getImoveisDoCondominio } from '@/lib/imoveis';
import { getLancamentosList, isListItemApresentavel, type LancamentoListItem } from '@/lib/lancamentos';

// Rota dinâmica /lotus-condominio/[slug] — lê cada condomínio do Supabase.
//
// O endereço era /lotus-condominio/<uuid> até 28/09/2026. UUID não diz nada a
// quem lê, não ajuda o Google e não dá para ditar no telefone; virou o nome do
// condomínio. As URLs antigas continuam funcionando (ver `resolver`).
//
// ISR sob demanda: a página é renderizada no primeiro acesso (em runtime, onde
// as env vars do Supabase existem) e cacheada por 1h. Não pré-renderizamos no
// build (`generateStaticParams`) porque o ambiente de build não recebe as env
// vars do Supabase, e os dados mudam com frequência — prerender de tudo no build
// não agrega aqui.
export const revalidate = 3600;

const SITE = 'https://www.lotusbrokers.com.br';

/** UUID v4 canônico — o formato das URLs antigas. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Params = { params: Promise<{ slug: string }> };

/** Texto comparável: sem acento, sem caixa. "Jardim Ermida" casa com "jardim ermida". */
function chave(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Peso de proximidade: 2 = mesmo bairro, 1 = mesma cidade, 0 = nem um nem outro.
 *
 * Compara por CONTÉM e não por igualdade porque os dois lados guardam o local de
 * jeitos diferentes: o condomínio tem bairro e cidade em campos separados, o
 * lançamento traz "Bairro · Cidade" numa string só.
 */
function proximidade(texto: string, bairro: string | null, cidade: string | null): number {
  const t = chave(texto);
  const b = chave(bairro);
  const c = chave(cidade);
  if (b && t.includes(b)) return 2;
  if (c && t.includes(c)) return 1;
  return 0;
}

/**
 * Resolve o parâmetro da URL, aceitando slug novo ou UUID antigo.
 *
 * As URLs com UUID ficaram no ar, entraram no sitemap e podem estar indexadas
 * ou salvas por alguém — some-las devolveria 404 para quem já tinha o link. Em
 * vez disso, o UUID encontra o condomínio e a página manda para o endereço novo
 * com 308, que é o que o Google entende como "mudou de lugar para sempre".
 *
 * `redirecionarPara` só vem preenchido nesse caso; para o slug normal é null.
 */
async function resolver(
  param: string,
): Promise<{ cond: CondominioRow | null; redirecionarPara: string | null }> {
  if (UUID.test(param)) {
    const cond = await getCondominio(param);
    return cond
      ? { cond, redirecionarPara: `/lotus-condominio/${slugCondominio(cond.nome)}` }
      : { cond: null, redirecionarPara: null };
  }
  return { cond: await getCondominioPorSlug(param), redirecionarPara: null };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { cond } = await resolver(slug);
  if (!cond) {
    return { title: 'Condomínio, Lotus Brokers', robots: { index: false } };
  }
  const cidade = cond.cidade || 'Jundiaí e Itupeva';
  const capa = (cond.fotos?.find((f) => f.isCapa) ?? cond.fotos?.[0])?.url;
  const title = `${cond.nome}, ${cidade}, guia do condomínio e imóveis | Lotus Brokers`;
  const description =
    cond.descricao_site?.trim() ||
    `Tudo sobre morar no ${cond.nome}, ${cidade}: estrutura, localização e imóveis disponíveis com o especialista da Lotus.`;
  // Canonical sempre no endereço novo, mesmo quando se chegou pelo UUID: duas
  // URLs para o mesmo texto é o que o canonical existe para evitar.
  const url = `${SITE}/lotus-condominio/${slugCondominio(cond.nome)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      siteName: 'Lotus Brokers',
      type: 'website',
      url,
      title: `Morar no ${cond.nome}, ${cidade}, guia da Lotus`,
      description,
      images: capa ? [capa] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  };
}

// JSON-LD (ApartmentComplex + FAQPage + BreadcrumbList) adaptado ao condomínio.
function buildJsonLd(cond: CondominioRow, slug: string) {
  const cidade = cond.cidade || 'Jundiaí e Itupeva';
  const url = `${SITE}/lotus-condominio/${slug}`;
  const amenities = cond.infra_portaria_24h === true
    ? [{ '@type': 'LocationFeatureSpecification', name: 'Portaria 24h' }]
    : [];

  const apartmentComplex = {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    name: cond.nome,
    description:
      cond.descricao_site?.trim() ||
      `${cond.nome} é um condomínio em ${cidade}, procurado por famílias pela estrutura, segurança e qualidade de vida.`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: cond.cidade || undefined,
      addressRegion: cond.estado || 'SP',
      addressCountry: 'BR',
    },
    ...(amenities.length ? { amenityFeature: amenities } : {}),
  };

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Vale a pena morar no ${cond.nome}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `O ${cond.nome} é procurado por famílias em ${cidade} pela combinação de segurança, estrutura de lazer e qualidade de vida. A Lotus conhece o condomínio por dentro.`,
        },
      },
      {
        '@type': 'Question',
        name: `Quais tipos de imóvel existem no ${cond.nome}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'As unidades variam em metragem e configuração. A Lotus tem especialistas que conhecem cada tipo de unidade do condomínio.',
        },
      },
    ],
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Condomínios', item: `${SITE}/lotus-condominio` },
      { '@type': 'ListItem', position: 2, name: cond.nome, item: url },
    ],
  };

  return [apartmentComplex, faq, breadcrumb];
}

export default async function LotusCondominioPage({ params }: Params) {
  const { slug } = await params;
  const { cond, redirecionarPara } = await resolver(slug);
  if (redirecionarPara) permanentRedirect(redirecionarPara);
  if (!cond) notFound();

  // Em paralelo: os três dependem só do que já temos em mãos. Os lançamentos
  // falham sozinhos — sem eles a seção de semelhantes mostra só condomínios.
  const [todosRelacionados, imoveis, lancamentosTodos] = await Promise.all([
    getCondominiosCards(cond.id),
    getImoveisDoCondominio(cond.id),
    getLancamentosList().catch((e) => {
      console.error('[condominio] lançamentos indisponíveis:', e);
      return [] as LancamentoListItem[];
    }),
  ]);

  // Semelhantes DE PERTO: mesmo bairro na frente, depois mesma cidade. Sem isso
  // a lista vinha na ordem do banco e um condomínio de Itupeva podia abrir a
  // seção na página de um de Jundiaí.
  const relacionados = todosRelacionados
    .filter(isCondominioApresentavel)
    .map((r) => ({ r, peso: proximidade(`${r.bairro ?? ''} ${r.cidade ?? ''}`, cond.bairro, cond.cidade) }))
    .sort((a, b) => b.peso - a.peso || a.r.nome.localeCompare(b.r.nome, 'pt-BR'))
    .map((x) => x.r)
    .slice(0, 4);

  // Lançamentos da MESMA região, só com página própria e foto — card que não
  // leva a lugar nenhum não ajuda quem está comparando.
  const lancamentos = lancamentosTodos
    .filter(isListItemApresentavel)
    .filter((l) => l.href)
    .map((l) => ({ l, peso: proximidade(l.neighborhood + ' ' + l.city, cond.bairro, cond.cidade) }))
    .filter((x) => x.peso > 0)
    .sort((a, b) => b.peso - a.peso || a.l.name.localeCompare(b.l.name, 'pt-BR'))
    .map((x) => x.l)
    .slice(0, 4);
  const jsonLd = buildJsonLd(cond, slugCondominio(cond.nome));

  return (
    <>
      {jsonLd.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj).replace(/</g, '\\u003c') }}
        />
      ))}
      <LotusCondominio
        data={cond}
        relacionados={relacionados}
        imoveis={imoveis}
        lancamentos={lancamentos}
      />
    </>
  );
}
