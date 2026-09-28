import type { MetadataRoute } from 'next';
import { getImovelCodigosComData } from '@/lib/imoveis';
import { getCondominiosCards, isCondominioApresentavel } from '@/lib/condominios';
import { bairroSlugsIndexaveis } from '@/lib/bairros';
import { landingSlugs } from '@/lib/landings';
import { getLancamentosList, isListItemApresentavel } from '@/lib/lancamentos';
import { agruparPorConstrutora, comCuradasSemLancamento } from '@/lib/construtoras-paginas';
import { curadasSemLancamento } from '@/lib/construtoras-conteudo';
import { POSTS, hrefDoArtigo } from '@/lib/blog-posts';
import { publicados } from '@/lib/blog-agenda';

/**
 * Sitemap dinâmico do portal.
 *
 * O site não tinha sitemap nem robots.txt: o Google descobria página por
 * página seguindo links, o que atrasa a indexação em semanas. Com o sitemap
 * declarado no robots.txt, novas páginas entram na fila em 24-48h.
 *
 * É gerado a cada requisição a partir das mesmas fontes que as páginas usam,
 * então imóvel novo no dashboard ou landing nova em app/ entram sozinhos. Não
 * há lista escrita à mão para esquecer de atualizar.
 *
 * `revalidate` acompanha o das páginas (1h): não faz sentido o sitemap
 * anunciar uma URL que a listagem ainda não mostra.
 */

export const revalidate = 3600;

/**
 * Data do deploy, para as páginas que só mudam quando o código muda.
 *
 * Avaliada uma vez por processo, e não a cada requisição: institucional,
 * landing e guia de bairro não mudam de hora em hora, e carimbá-las com a hora
 * atual fazia 155 das 172 URLs anunciarem alteração toda revalidação. O Google
 * usa lastmod enquanto ele é confiável — e passa a ignorá-lo quando não é.
 *
 * Quem tem data real no banco (condomínio, imóvel, artigo) não usa esta.
 */
const DEPLOY = new Date();

/** Data do banco quando existe; a do deploy quando não. */
const quando = (iso: string | null | undefined): Date => (iso ? new Date(iso) : DEPLOY);

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lotusbrokers.com.br';

// /lotus-condominio voltou em 28/09/2026, agora como índice de verdade: saiu
// em 24/09 porque a rota só redirecionava, e anunciar redirecionamento no
// sitemap vira "página com redirecionamento" no Search Console. Ganhou
// listagem própria, então volta. /lotus-imovel segue fora pelo motivo antigo:
// aquela continua sendo só redirecionamento.
/** Páginas institucionais e de listagem, que existem independentemente de dados. */
const FIXAS: { rota: string; prioridade: number; frequencia: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { rota: '/', prioridade: 1.0, frequencia: 'daily' },
  { rota: '/lotus-busca', prioridade: 0.9, frequencia: 'daily' },
  { rota: '/lotus-lancamentos', prioridade: 0.9, frequencia: 'daily' },
  { rota: '/lotus-bairro', prioridade: 0.7, frequencia: 'weekly' },
  { rota: '/lotus-condominio', prioridade: 0.7, frequencia: 'weekly' },
  { rota: '/lotus-corretores', prioridade: 0.7, frequencia: 'weekly' },
  { rota: '/lotus-sobre', prioridade: 0.6, frequencia: 'monthly' },
  { rota: '/lotus-blog', prioridade: 0.7, frequencia: 'weekly' },
  { rota: '/lotus-faq', prioridade: 0.5, frequencia: 'monthly' },
  { rota: '/construtoras', prioridade: 0.6, frequencia: 'weekly' },
  { rota: '/lotus-anunciar', prioridade: 0.6, frequencia: 'monthly' },
  { rota: '/lotus-recrutamento', prioridade: 0.4, frequencia: 'monthly' },
  { rota: '/lotus-privacidade', prioridade: 0.2, frequencia: 'yearly' },
  { rota: '/lotus-termos', prioridade: 0.2, frequencia: 'yearly' },
  { rota: '/lotus-cookies', prioridade: 0.2, frequencia: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // Falha de banco não pode derrubar o sitemap inteiro: sem imóveis ele ainda
  // declara as páginas fixas e as landings, que é melhor do que erro 500.
  const [codigos, condominios] = await Promise.all([
    getImovelCodigosComData().catch((e) => {
      console.error('[sitemap] imóveis indisponíveis:', e);
      return [] as { codigo: string; atualizadoEm: string | null }[];
    }),
    // Os MESMOS cards do índice, e não todos os cadastros: o sitemap só pode
    // anunciar condomínio que a listagem mostra. Cadastro sem foto e sem
    // descrição não entra na página nem aqui — sitemap apontando para página
    // que o site não linka é o que vira "descoberta, não indexada".
    getCondominiosCards()
      .then((cs) => cs.filter(isCondominioApresentavel))
      .catch((e) => {
        console.error('[sitemap] condomínios indisponíveis:', e);
        return [];
      }),
  ]);

  // Falha do banco não pode derrubar o sitemap inteiro: sem construtoras, o
  // arquivo sai com as demais rotas, como já acontece com imóveis e condomínios.
  const construtoras = await getLancamentosList()
    .then((l) => comCuradasSemLancamento(agruparPorConstrutora(l.filter(isListItemApresentavel)), curadasSemLancamento()))
    .catch((e) => {
      console.error('[sitemap] construtoras indisponíveis:', e);
      return [];
    });

  const url = (rota: string) => `${SITE}${rota}`;

  return [
    ...FIXAS.map((f) => ({
      url: url(f.rota),
      lastModified: DEPLOY,
      changeFrequency: f.frequencia,
      priority: f.prioridade,
    })),
    // Landings de empreendimento: derivadas do filesystem, igual aos cards.
    ...[...landingSlugs()].sort().map((slug) => ({
      url: url(`/${slug}`),
      lastModified: DEPLOY,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...bairroSlugsIndexaveis().map((slug) => ({
      url: url(`/lotus-bairro/${slug}`),
      lastModified: DEPLOY,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    // Um endereço por artigo já publicado: o agendado entra no dia dele, como
    // na listagem. lastModified é a data de publicação e não "agora" — o
    // Google usa o campo para decidir o que rastrear de novo, e um sitemap que
    // diz que tudo mudou a cada hora ensina o Google a ignorar o campo.
    ...publicados(POSTS).map((post) => ({
      url: url(hrefDoArtigo(post.id)),
      lastModified: post.publicadoEm,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    // lastmod = updated_at do dashboard, não a hora de gerar o arquivo.
    ...codigos.map((im) => ({
      url: url(`/lotus-imovel/${im.codigo}`),
      lastModified: quando(im.atualizadoEm),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    // Slug, não id: as URLs com UUID continuam respondendo (redirecionam com
    // 308), mas quem anuncia no sitemap é o endereço definitivo.
    // lastmod = updated_at do dashboard, idem.
    ...condominios.map((c) => ({
      url: url(`/lotus-condominio/${c.slug}`),
      lastModified: quando(c.atualizadoEm),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    // Uma página por construtora, derivada dos lançamentos — a mesma fonte que
    // gera as rotas em generateStaticParams. Construtora que sai do acervo sai
    // do sitemap sozinha.
    ...construtoras.map((c) => ({
      url: url(`/construtoras/${c.slug}`),
      lastModified: DEPLOY,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
}
