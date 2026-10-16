import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LotusBlog from '@/components/LotusBlog';
import {
  POSTS,
  hrefDoArtigo,
  relacionados,
  resumoDoPost,
  type BairrosDoBloco,
  type BlocoArtigo,
  type LinkArtigo,
  type Post,
} from '@/lib/blog-posts';
import { publicados } from '@/lib/blog-agenda';
import { BAIRROS } from '@/lib/bairros';
import { getImoveisBusca } from '@/lib/imoveis';
import { getLancamentosList } from '@/lib/lancamentos';
import { prepararCorpo, type AlvoDeLink } from '@/lib/texto-com-links';

/**
 * Página própria de cada artigo do blog: /lotus-blog/<id>.
 *
 * É o que faz o artigo existir para o Google. Até 21/09/2026 todos abriam
 * dentro de /lotus-blog, trocando a tela sem mudar o endereço: para a busca
 * era uma página só, com a descrição genérica do blog, e nenhum artigo podia
 * aparecer sozinho num resultado nem ser compartilhado por link.
 *
 * Aqui cada um tem título, descrição (o `excerpt`, que é a meta description
 * que a Lotus manda junto com o texto), canonical, Open Graph para o link
 * compartilhado e dados estruturados de artigo — tudo no HTML que o servidor
 * entrega, sem depender de JavaScript.
 *
 * AGENDA. Artigo com data futura em `publicadoEm` dá 404 até o dia chegar,
 * do mesmo jeito que some da listagem. Sem isso, bastaria adivinhar o
 * endereço para ler um texto que ainda não saiu.
 *
 * Revalida de hora em hora pelo mesmo motivo de /lotus-blog: o artigo
 * agendado entra no ar sem depender de deploy.
 */
export const revalidate = 3600;

// Domínio vem da env (NEXT_PUBLIC_SITE_URL), como nas demais rotas.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lotusbrokers.com.br';

type Params = { params: Promise<{ slug: string }> };

/** O artigo, se existir e já tiver saído. Um critério só para a página e os metadados. */
function artigoNoAr(slug: string): Post | null {
  return publicados(POSTS).find((p) => p.id === slug) ?? null;
}

export function generateStaticParams() {
  return publicados(POSTS).map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = artigoNoAr(slug);
  if (!post) {
    return { title: 'Artigo não encontrado | Blog Lotus', robots: { index: false } };
  }

  const url = `${SITE}${hrefDoArtigo(post.id)}`;
  return {
    title: `${post.title} | Blog Lotus`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      siteName: 'Lotus Brokers',
      type: 'article',
      locale: 'pt_BR',
      url,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publicadoEm,
      section: post.cat,
      ...(post.img ? { images: [`${SITE}${post.img}`] } : {}),
    },
    twitter: { card: 'summary_large_image' },
  };
}

// BlogPosting + BreadcrumbList. A data é só o dia (`publicadoEm`): é o que a
// Lotus informa, e um horário aqui seria inventado.
function jsonLd(post: Post) {
  const url = `${SITE}${hrefDoArtigo(post.id)}`;
  const lotus = { '@type': 'Organization', name: 'Lotus Brokers', url: SITE };
  const artigo = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    ...(post.img ? { image: `${SITE}${post.img}` } : {}),
    datePublished: post.publicadoEm,
    articleSection: post.cat,
    inLanguage: 'pt-BR',
    author: lotus,
    publisher: lotus,
    mainEntityOfPage: url,
    url,
  };
  const migalhas = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Blog', item: `${SITE}/lotus-blog` },
      { '@type': 'ListItem', position: 2, name: post.title, item: url },
    ],
  };
  return [artigo, migalhas];
}

// "<" vira < para que nenhum texto de artigo consiga fechar o <script>
// antes da hora. O JSON continua o mesmo para quem o lê.
const paraScript = (obj: unknown) => JSON.stringify(obj).replace(/</g, '\\u003c');

/**
 * Guias de bairro que viram link na primeira vez que o artigo cita o bairro.
 *
 * Ficam de fora os nomes que também são palavra comum ou bairro de outra
 * cidade: o "Centro" do guia é o de Itupeva, e "Retiro", "Aeroporto" e
 * "Jardim Primavera" aparecem no texto com outro sentido. Bonfiglioli e
 * Vianelo, as duas partes do Vianelo Bonfiglioli, levam ao guia dele, e o
 * Recanto IV Centenário é o outro nome do Recanto Quarto Centenário.
 */
const NOMES_AMBIGUOS = new Set(['Centro', 'Retiro', 'Aeroporto', 'Jardim Primavera']);
const OUTROS_NOMES: Record<string, string[]> = {
  'vianelo-bonfiglioli': ['Bonfiglioli', 'Vianelo'],
  'recanto-quarto-centenario': ['Recanto IV Centenário'],
};

function alvosDosGuias(): AlvoDeLink[] {
  return BAIRROS.filter((b) => b.publicado && !NOMES_AMBIGUOS.has(b.nome)).flatMap((b) =>
    [b.nome, ...(OUTROS_NOMES[b.slug] ?? [])].map((nome) => ({ nome, href: `/lotus-bairro/${b.slug}` })),
  );
}

const normalizar = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const posicaoNoBloco = (sel: BairrosDoBloco, bairro: string) => sel.bairros.findIndex((b) => normalizar(b) === normalizar(bairro));
const estaNoBloco = (sel: BairrosDoBloco, bairro: string, cidade: string) =>
  normalizar(cidade) === normalizar(sel.cidade) && posicaoNoBloco(sel, bairro) >= 0;

/**
 * Troca os blocos de imóveis e lançamentos por listas de links com o que está
 * anunciado agora nos bairros pedidos, na ordem em que os bairros foram
 * escritos (o mais perto primeiro). Sem anúncio, o bloco some; banco fora do
 * ar também só some com o bloco, sem derrubar o artigo.
 */
async function comAnuncios(corpo: BlocoArtigo[]): Promise<BlocoArtigo[]> {
  const precisa = corpo.some((b) => typeof b !== 'string' && (b.imoveisNosBairros || b.lancamentosNosBairros));
  if (!precisa) return corpo;
  const [imoveis, lancamentos] = await Promise.all([
    getImoveisBusca().catch((e) => {
      console.error('[blog] imóveis indisponíveis:', e);
      return [];
    }),
    getLancamentosList().catch((e) => {
      console.error('[blog] lançamentos indisponíveis:', e);
      return [];
    }),
  ]);
  return corpo.flatMap((bloco): BlocoArtigo[] => {
    if (typeof bloco === 'string' || !(bloco.imoveisNosBairros || bloco.lancamentosNosBairros)) return [bloco];
    const links: LinkArtigo[] = [];
    const selImoveis = bloco.imoveisNosBairros;
    if (selImoveis) {
      links.push(
        ...imoveis
          .filter((im) => im.fin === 'comprar' && estaNoBloco(selImoveis, im.neighborhood, im.city))
          .sort((a, b) => posicaoNoBloco(selImoveis, a.neighborhood) - posicaoNoBloco(selImoveis, b.neighborhood))
          .map((im) => ({ texto: `${im.type} em ${im.neighborhood}`, href: `/lotus-imovel/${im.codigo}`, detalhe: im.price })),
      );
    }
    const selLancamentos = bloco.lancamentosNosBairros;
    if (selLancamentos) {
      links.push(
        ...lancamentos
          .filter((l) => l.href && estaNoBloco(selLancamentos, l.neighborhood, l.city))
          .sort((a, b) => posicaoNoBloco(selLancamentos, a.neighborhood) - posicaoNoBloco(selLancamentos, b.neighborhood))
          .map((l) => ({ texto: l.name, href: l.href as string, detalhe: `lançamento, ${l.neighborhood}` })),
      );
    }
    return links.length ? [{ titulo: bloco.titulo, nivel: bloco.nivel, links }] : [];
  });
}

export default async function LotusBlogArtigoPage({ params }: Params) {
  const { slug } = await params;
  const post = artigoNoAr(slug);
  if (!post) notFound();

  // Só o que a página desenha vai para o componente de cliente: o artigo aberto
  // e os três relacionados. Até 16/10/2026 iam os 26 artigos inteiros.
  const corpo = prepararCorpo(await comAnuncios(post.body), alvosDosGuias());
  const artigo = { ...resumoDoPost(post), tldr: post.tldr, corpo };
  const outros = relacionados(publicados(POSTS), post).map(resumoDoPost);

  return (
    <>
      {jsonLd(post).map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: paraScript(obj) }} />
      ))}
      <LotusBlog artigo={artigo} relacionados={outros} />
    </>
  );
}
