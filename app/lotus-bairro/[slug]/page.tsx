import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LotusBairro from '@/components/LotusBairro';
import { getBairro, bairroSlugs, bairrosVizinhos, guiaDoBairro, type Bairro } from '@/lib/bairros';
import { nomesDoBairro } from '@/lib/bairros-taxonomia';
import { getImoveisPorBairro } from '@/lib/imoveis';
import { getLancamentosList } from '@/lib/lancamentos';
import { POSTS, hrefDoArtigo } from '@/lib/blog-posts';
import { publicados } from '@/lib/blog-agenda';
import { IMAGEM_COMPARTILHAMENTO } from '@/lib/site';

// Guias de bairro são conteúdo estático (lib/bairros) — dá pra pré-renderizar
// todos no build. Os imóveis do bairro vêm do banco em runtime; por isso ISR
// (revalida a lista de imóveis a cada 1h sem rebuild).
export const revalidate = 3600;

// Domínio vem da env (NEXT_PUBLIC_SITE_URL) — não hard-codar. Fallback só
// evita quebrar canonical/JSON-LD se a env não estiver definida no ambiente.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lotusbrokers.com.br';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return bairroSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const bairro = getBairro(slug);
  if (!bairro) {
    return { title: 'Bairro, Lotus Brokers', robots: { index: false } };
  }
  const title = `Morar em ${bairro.nome}, ${bairro.cidade}: guia do bairro e imóveis | Lotus Brokers`;
  const description = bairro.tagline;
  const url = `${SITE}/lotus-bairro/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    // Bairros com conteúdo ainda placeholder não são indexados até revisão.
    ...(bairro.publicado ? {} : { robots: { index: false } }),
    openGraph: {
      siteName: 'Lotus Brokers',
      type: 'website',
      url,
      title: `Morar em ${bairro.nome}, ${bairro.cidade}, o guia da Lotus`,
      description,
      // Declarar openGraph aqui substitui o do layout inteiro, imagem inclusive:
      // sem esta linha o link do guia saía sem foto no WhatsApp.
      images: [bairro.heroImg ? `${SITE}${bairro.heroImg}` : IMAGEM_COMPARTILHAMENTO],
    },
    twitter: { card: 'summary_large_image' },
  };
}

// JSON-LD (Place + FAQPage + BreadcrumbList) do bairro.
function buildJsonLd(bairro: Bairro, slug: string) {
  const url = `${SITE}/lotus-bairro/${slug}`;
  const place = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${bairro.nome}, ${bairro.cidade}`,
    description: bairro.tldr,
    address: {
      '@type': 'PostalAddress',
      addressLocality: bairro.cidade,
      addressRegion: 'SP',
      addressCountry: 'BR',
    },
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: bairro.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Bairros', item: `${SITE}/lotus-bairro` },
      { '@type': 'ListItem', position: 2, name: bairro.nome, item: url },
    ],
  };
  return [place, faq, breadcrumb];
}

/**
 * Lançamentos com página própria cujo bairro, no cadastro (já corrigido por
 * lib/correcoes-cadastro), é o deste guia. Até 16/10/2026 nenhum guia apontava
 * para os lançamentos do bairro, e as landings, que são as páginas que vendem,
 * não recebiam link dos guias. Banco fora do ar não derruba o guia: a seção
 * só não aparece.
 */
async function lancamentosDoBairro(slug: string) {
  const lista = await getLancamentosList().catch((e) => {
    console.error('[bairro] lançamentos indisponíveis:', e);
    return [];
  });
  return lista
    .filter((l) => l.href && guiaDoBairro(l.neighborhood, l.city)?.slug === slug)
    .map((l) => ({ nome: l.name, href: l.href as string, construtora: l.builder }));
}

const normalizar = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Até 3 artigos do blog para "Leituras sobre a região": primeiro os que citam
 * o bairro (ou um sub-bairro dele) no título ou no texto, depois os mais
 * recentes. Até 16/10/2026 essa lista era fixa no componente, com três títulos
 * que levavam à home, e um deles nem existia no blog.
 */
function leiturasDoBairro(bairro: Bairro) {
  const nomes = nomesDoBairro(bairro.nome).map(normalizar);
  const cita = (texto: string) => nomes.some((n) => new RegExp(`(^|[^a-z0-9])${n}([^a-z0-9]|$)`).test(texto));
  const textoDo = (p: (typeof POSTS)[number]) =>
    normalizar([p.title, p.excerpt, ...p.body.map((b) => (typeof b === 'string' ? b : [b.titulo, ...(b.itens ?? [])].join(' ')))].join(' '));
  const lista = publicados(POSTS);
  const citam = lista.filter((p) => cita(textoDo(p)));
  return [...citam, ...lista.filter((p) => !citam.includes(p))]
    .slice(0, 3)
    .map((p) => ({ href: hrefDoArtigo(p.id), img: p.img, cat: p.cat, title: p.title, slot: p.slot }));
}

export default async function LotusBairroSlugPage({ params }: Params) {
  const { slug } = await params;
  const bairro = getBairro(slug);
  if (!bairro) notFound();

  const imoveis = await getImoveisPorBairro(bairro.nome);
  const vizinhos = bairrosVizinhos(slug).map((v) => ({
    name: v.nome,
    note: v.cidade,
    slug: v.slug,
  }));
  const jsonLd = buildJsonLd(bairro, slug);

  return (
    <>
      {jsonLd.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
      <LotusBairro
        bairro={bairro}
        imoveis={imoveis}
        vizinhos={vizinhos}
        lancamentos={await lancamentosDoBairro(slug)}
        leituras={leiturasDoBairro(bairro)}
      />
    </>
  );
}
