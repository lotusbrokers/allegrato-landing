import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LotusBlog from '@/components/LotusBlog';
import { POSTS, hrefDoArtigo, type Post } from '@/lib/blog-posts';
import { publicados } from '@/lib/blog-agenda';

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

export default async function LotusBlogArtigoPage({ params }: Params) {
  const { slug } = await params;
  const post = artigoNoAr(slug);
  if (!post) notFound();

  return (
    <>
      {jsonLd(post).map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: paraScript(obj) }} />
      ))}
      <LotusBlog posts={publicados(POSTS)} artigo={post} />
    </>
  );
}
