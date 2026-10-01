import type { MetadataRoute } from 'next';
import { getImovelCodigosComData } from '@/lib/imoveis';
import { getCondominiosCards, isCondominioApresentavel } from '@/lib/condominios';
import { bairroSlugsIndexaveis } from '@/lib/bairros';
import { landingSlugs } from '@/lib/landings';
import { getLancamentosList, isListItemApresentavel, type LancamentoListItem } from '@/lib/lancamentos';
import { agruparPorConstrutora, comCuradasSemLancamento } from '@/lib/construtoras-paginas';
import { curadasSemLancamento } from '@/lib/construtoras-conteudo';
import { POSTS, hrefDoArtigo } from '@/lib/blog-posts';
import { publicados } from '@/lib/blog-agenda';
import { ROTAS_FIXAS } from '@/lib/sitemap-rotas';
import { dataDaRota, dataDoGrupo, maisRecente } from '@/lib/datas-de-alteracao';

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
 * lastmod.
 *
 * Quem tem data real no banco (imóvel, condomínio, artigo) usa a dela. As
 * rotas estáticas — institucionais, landings, bairros, construtoras — usam a
 * data do último commit que tocou os arquivos delas, lida de
 * lib/datas-de-alteracao.json (gerado por scripts/datas-de-alteracao.mjs).
 *
 * Até 30/09/2026 elas levavam a hora do build: 90 das 176 URLs anunciavam
 * alteração a cada deploy, e o Google aprende a ignorar o campo quando ele
 * não é confiável. Refazer o build não é alterar a página.
 *
 * Os índices (/lotus-busca, /lotus-lancamentos, /lotus-condominio,
 * /lotus-blog, /lotus-bairro, /construtoras) mudam quando o filho mais novo
 * entra: o lastmod deles é o mais recente entre o próprio arquivo e o que
 * listam. Rota sem data conhecida sai sem lastmod — o campo é opcional, e
 * omitir é melhor do que inventar.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lotusbrokers.com.br';

type Frequencia = MetadataRoute.Sitemap[number]['changeFrequency'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Falha de banco não pode derrubar o sitemap inteiro: sem imóveis ele ainda
  // declara as páginas fixas e as landings, que é melhor do que erro 500.
  const [codigos, condominios, lancamentos] = await Promise.all([
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
    // Sem lançamentos as páginas de construtora ficam só com as curadas, como
    // já acontece com imóveis e condomínios.
    getLancamentosList().catch((e) => {
      console.error('[sitemap] lançamentos indisponíveis:', e);
      return [] as LancamentoListItem[];
    }),
  ]);

  // Uma página por construtora, derivada dos lançamentos — a mesma fonte que
  // gera as rotas em generateStaticParams. Construtora que sai do acervo sai
  // do sitemap sozinha.
  const construtoras = comCuradasSemLancamento(
    agruparPorConstrutora(lancamentos.filter(isListItemApresentavel)),
    curadasSemLancamento(),
  );
  // Um endereço por artigo já publicado: o agendado entra no dia dele, como
  // na listagem.
  const posts = publicados(POSTS);

  const url = (rota: string) => `${SITE}${rota}`;
  const entrada = (
    rota: string,
    lastModified: Date | undefined,
    changeFrequency: Frequencia,
    priority: number,
  ): MetadataRoute.Sitemap[number] => ({
    url: url(rota),
    ...(lastModified ? { lastModified } : {}),
    changeFrequency,
    priority,
  });

  // Bairros e construtoras: data da própria entrada quando o gerador conseguiu
  // isolá-la no histórico; senão a do arquivo que todas compartilham.
  const dataDoBairro = (slug: string) => dataDaRota(`/lotus-bairro/${slug}`) ?? dataDoGrupo('bairros');
  const dataDaConstrutora = (slug: string) => dataDaRota(`/construtoras/${slug}`) ?? dataDoGrupo('construtoras');
  const bairros = bairroSlugsIndexaveis();

  const dataDoIndice: Record<string, Date | undefined> = {
    '/lotus-busca': maisRecente(dataDaRota('/lotus-busca'), ...codigos.map((im) => im.atualizadoEm)),
    '/lotus-lancamentos': maisRecente(dataDaRota('/lotus-lancamentos'), ...lancamentos.map((l) => l.atualizadoEm)),
    '/lotus-condominio': maisRecente(dataDaRota('/lotus-condominio'), ...condominios.map((c) => c.atualizadoEm)),
    '/lotus-blog': maisRecente(dataDaRota('/lotus-blog'), ...posts.map((p) => p.publicadoEm)),
    '/lotus-bairro': maisRecente(dataDaRota('/lotus-bairro'), ...bairros.map(dataDoBairro)),
    '/construtoras': maisRecente(
      dataDaRota('/construtoras'),
      ...construtoras.map((c) => dataDaConstrutora(c.slug)),
      ...lancamentos.map((l) => l.atualizadoEm),
    ),
  };

  return [
    ...ROTAS_FIXAS.map((f) =>
      entrada(f.rota, f.rota in dataDoIndice ? dataDoIndice[f.rota] : dataDaRota(f.rota), f.frequencia, f.prioridade),
    ),
    // Landings de empreendimento: derivadas do filesystem, igual aos cards.
    ...[...landingSlugs()].sort().map((slug) => entrada(`/${slug}`, dataDaRota(`/${slug}`), 'weekly', 0.8)),
    ...bairros.map((slug) => entrada(`/lotus-bairro/${slug}`, dataDoBairro(slug), 'monthly', 0.6)),
    // lastmod = data de publicação do artigo.
    ...posts.map((post) => entrada(hrefDoArtigo(post.id), maisRecente(post.publicadoEm), 'monthly', 0.6)),
    // lastmod = updated_at do dashboard.
    ...codigos.map((im) => entrada(`/lotus-imovel/${im.codigo}`, maisRecente(im.atualizadoEm), 'weekly', 0.8)),
    // Slug, não id: as URLs com UUID continuam respondendo (redirecionam com
    // 308), mas quem anuncia no sitemap é o endereço definitivo.
    ...condominios.map((c) => entrada(`/lotus-condominio/${c.slug}`, maisRecente(c.atualizadoEm), 'monthly', 0.5)),
    // A página da construtora muda com o texto dela e com os lançamentos que lista.
    ...construtoras.map((c) =>
      entrada(
        `/construtoras/${c.slug}`,
        maisRecente(dataDaConstrutora(c.slug), ...c.lancamentos.map((l) => l.atualizadoEm)),
        'monthly',
        0.5,
      ),
    ),
  ];
}
