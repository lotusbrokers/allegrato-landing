import type { Metadata } from 'next';
import LotusBlog from '@/components/LotusBlog';
import { POSTS, hrefDoArtigo, type Post } from '@/lib/blog-posts';
import { publicados } from '@/lib/blog-agenda';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lotusbrokers.com.br';

/**
 * Revalida de hora em hora para os artigos agendados entrarem no ar sem
 * depender de um deploy. Sem isso a pagina ficaria estatica no build e um
 * artigo marcado para amanha so apareceria no proximo push.
 *
 * A janela de ate uma hora depois da meia-noite e aceitavel para blog, e e
 * o mesmo intervalo que /lotus-home ja usa.
 */
export const revalidate = 3600;

// Metadata portada do <helmet> do fonte estático (lotus-blog, dc-runtime).
export const metadata: Metadata = {
  title: 'Blog Lotus: notícias da cidade e do mercado imobiliário',
  description:
    'Blog Lotus: notícias de Jundiaí e Itupeva, mercado imobiliário sem juridiquês, guias de compra, venda e locação e a vida na região da Serra do Japi.',
  alternates: {
    canonical: 'https://www.lotusbrokers.com.br/lotus-blog',
  },
  openGraph: {
    siteName: 'Lotus Brokers',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://www.lotusbrokers.com.br/lotus-blog',
    title: 'Blog Lotus: notícias da cidade e do mercado imobiliário',
    description:
      'Notícias de Jundiaí e Itupeva, mercado imobiliário e a vida na região da Serra do Japi, por quem vive aqui.',
  },
};

/**
 * O blog e os artigos, com o endereço de cada um, para o Google ligar esta
 * página às páginas dos artigos. Antes era escrito por um efeito no
 * navegador — e por isso não existia no HTML que o servidor entrega.
 */
function jsonLd(posts: Post[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog Lotus',
    url: `${SITE}/lotus-blog`,
    inLanguage: 'pt-BR',
    publisher: { '@type': 'Organization', name: 'Lotus Brokers', url: SITE },
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.excerpt,
      url: `${SITE}${hrefDoArtigo(p.id)}`,
      datePublished: p.publicadoEm,
      ...(p.img ? { image: `${SITE}${p.img}` } : {}),
    })),
  };
}

export default function LotusBlogPage() {
  // O filtro roda no servidor: LotusBlog e componente de cliente, e decidir a
  // data la dentro daria divergencia de hidratacao na virada do dia.
  const posts = publicados(POSTS);
  return (
    <>
      <script
        type="application/ld+json"
        // "<" escapado: nenhum texto de artigo pode fechar o <script> antes da hora.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(posts)).replace(/</g, '\\u003c') }}
      />
      <LotusBlog posts={posts} />
    </>
  );
}
