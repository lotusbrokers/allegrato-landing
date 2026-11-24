import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import LotusCorretores from '@/components/LotusCorretores';
import { getCodigosDoCaptador, getCorretoresDoSite, type Broker } from '@/lib/brokers';
import { conteudoRealDe } from '@/lib/corretores-conteudo';
import { creciEmTexto, descricaoDoPerfil, hrefDoCorretor, tituloDoPerfil } from '@/lib/corretores-perfil';
import { especialistaEm } from '@/lib/especialidades';
import { getImoveisBusca } from '@/lib/imoveis';
import { DOMINIO_OFICIAL } from '@/lib/indexacao.mjs';
import { IMAGEM_COMPARTILHAMENTO } from '@/lib/site';

/**
 * Página de cada corretor: /lotus-corretores/<slug>, desde 16/11/2026 (ver
 * lib/corretores-perfil). Desenha o mesmo perfil que a listagem abria por
 * estado, agora no HTML do servidor, com título, descrição, canonical e dados
 * estruturados próprios, e com os imóveis publicados que a pessoa captou.
 *
 * Quem sai da Dash (ou do site, pela lista OCULTOS de lib/brokers) deixa de ter
 * página: o endereço vai para a listagem (307), como o imóvel que sai vai para
 * a busca.
 *
 * Revalida de hora em hora, como /lotus-corretores: corretor novo ganha
 * página sem deploy.
 */
export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

const nomeLimpo = (nome: string) => nome.trim().replace(/\s+/g, ' ');
const enderecoAbsoluto = (src: string) => (src.startsWith('/') ? `${DOMINIO_OFICIAL}${src}` : src);
const fotoDe = (c: Broker) => c.photoUrl ?? conteudoRealDe(c.name)?.foto ?? null;

export async function generateStaticParams() {
  const { todos, slugs } = await getCorretoresDoSite();
  return todos.map((c) => ({ slug: slugs[c.id] }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { todos, slugs } = await getCorretoresDoSite();
  const corretor = todos.find((c) => slugs[c.id] === slug);
  if (!corretor) return { title: 'Corretores | Lotus Brokers', robots: { index: false } };

  const nome = nomeLimpo(corretor.name);
  const url = `${DOMINIO_OFICIAL}${hrefDoCorretor(slug)}`;
  // `temImoveis` pelo número do cadastro: a lista exata só sai na página.
  const description = descricaoDoPerfil({
    nome,
    creci: corretor.creci,
    especialidade: especialistaEm(corretor.especialidades, 'Jundiaí e Itupeva'),
    temImoveis: corretor.imoveisAtivos > 0,
  });
  const foto = fotoDe(corretor);
  return {
    title: tituloDoPerfil(nome),
    description,
    alternates: { canonical: url },
    openGraph: {
      siteName: 'Lotus Brokers',
      type: 'profile',
      locale: 'pt_BR',
      url,
      title: `${nome}, Lotus Brokers`,
      description,
      // Sem foto no cadastro, a imagem padrão do site: o openGraph da página
      // substitui o do layout inteiro, e sem `images` o link sai sem imagem.
      images: [foto ? enderecoAbsoluto(foto) : IMAGEM_COMPARTILHAMENTO],
    },
    twitter: { card: 'summary_large_image' },
  };
}

// "<" vira < para que nenhum texto do cadastro feche o <script> antes da hora.
const paraScript = (obj: unknown) => JSON.stringify(obj).replace(/</g, '\\u003c');

export default async function CorretorPage({ params }: Params) {
  const { slug } = await params;
  const { todos, slugs } = await getCorretoresDoSite();
  const corretor = todos.find((c) => slugs[c.id] === slug);
  if (!corretor) redirect('/lotus-corretores');

  // Os imóveis publicados que a pessoa captou. Banco fora do ar só tira a
  // seção; a página continua de pé.
  const [codigos, imoveis] = await Promise.all([
    getCodigosDoCaptador(corretor.id),
    getImoveisBusca().catch((e) => {
      console.error('[lotus-corretores] imóveis indisponíveis:', e);
      return [];
    }),
  ]);
  const captados = new Set(codigos);
  const imoveisDoPerfil = imoveis.filter((im) => captados.has(im.codigo));

  const nome = nomeLimpo(corretor.name);
  const url = `${DOMINIO_OFICIAL}${hrefDoCorretor(slug)}`;
  const foto = fotoDe(corretor);
  const creci = creciEmTexto(corretor.creci);
  // "Especialista em imóveis" e não "corretor(a)": sem gênero, como o título.
  const pessoa = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: nome,
    url,
    jobTitle: 'Especialista em imóveis',
    ...(foto ? { image: enderecoAbsoluto(foto) } : {}),
    ...(creci ? { identifier: { '@type': 'PropertyValue', propertyID: 'CRECI', value: creci.replace(/^CRECI\s*/i, '') } } : {}),
    ...(corretor.especialidades?.length ? { knowsAbout: corretor.especialidades } : {}),
    worksFor: { '@id': `${DOMINIO_OFICIAL}/#imobiliaria` },
  };
  const migalhas = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Corretores', item: `${DOMINIO_OFICIAL}/lotus-corretores` },
      { '@type': 'ListItem', position: 2, name: nome, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: paraScript(pessoa) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: paraScript(migalhas) }} />
      <LotusCorretores brokers={todos} perfilId={corretor.id} imoveisDoPerfil={imoveisDoPerfil} />
    </>
  );
}
