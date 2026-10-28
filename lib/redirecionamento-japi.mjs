/**
 * japilancamentos.com.br → www.lotusbrokers.com.br, endereço por endereço.
 *
 * O domínio era o site Wix da Japi Lançamentos: home indexável, 16 páginas
 * (várias são cópias das páginas do portal, com o mesmo endereço) e 42 artigos
 * no blog. Pedido da Lotus em 27/10/2026: o domínio passa a apontar para este
 * servidor, e cada endereço antigo vai, com redirecionamento permanente, para o
 * equivalente no portal. Os links que apontam para o domínio antigo e o que ele
 * acumulou na busca passam a contar para a Lotus.
 *
 * As regras só valem quando o DNS do domínio (na Locaweb) apontar para este
 * servidor e os dois hosts estiverem cadastrados no Easypanel. Antes disso
 * nenhuma requisição chega com esse host, e elas não fazem nada.
 *
 * Ordem (o Next usa a primeira regra que casa):
 *  1. páginas do Wix sem endereço igual no portal, cada uma para a mais próxima;
 *  2. artigos com assunto equivalente no portal, cada um para o seu par;
 *  3. o resto do blog do Wix vai para /lotus-blog;
 *  4. qualquer outro endereço vai para o mesmo caminho no portal: as cópias das
 *     páginas do portal têm o mesmo endereço lá e aqui, e o que não existir
 *     aqui responde 404, como deve.
 */

const LOTUS = 'https://www.lotusbrokers.com.br';

/** Os dois hosts do domínio antigo, como expressão regular (o Next a ancora). */
export const HOST_JAPI = '(?:www\\.)?japilancamentos\\.com\\.br';

/** Páginas do Wix sem endereço igual no portal. */
export const PAGINAS_JAPI = {
  '/lotus-home': '/',
  '/lotus-imovel': '/lotus-busca',
  '/search': '/lotus-busca',
  '/book-online': '/lotus-corretores',
  '/inquiry-services-page': '/',
};

/**
 * Artigos do blog do Wix (/post/<slug>, o slug como o Wix publica, com acento)
 * com assunto equivalente no portal: outro artigo, o guia do bairro ou a página
 * do condomínio. Os 18 restantes (decoração, open house, locação, tendências de
 * luxo e afins) não têm par e caem em /lotus-blog.
 */
export const ARTIGOS_JAPI = {
  'os-7-melhores-bairros-em-jundiaí': '/lotus-blog/melhores-bairros-para-morar-em-jundiai',
  'jundiaí-qualidade-de-vida-oportunidades-e-crescimento-no-interior-de-são-paulo': '/lotus-blog/jundiai-qualidade-de-vida-e-oportunidades',
  'investir-em-imóveis-em-jundiaí-vale-a-pena-em-2025-veja-dados-e-tendências': '/lotus-blog/investir-em-imoveis-vale-a-pena',
  'comprar-imóvel-agora-ou-esperar-entenda-o-melhor-momento-para-investir-em-jundiaí': '/lotus-blog/jundiai-boa-cidade-para-investidores',
  'interior-de-são-paulo-cresce-e-impulsiona-o-mercado-imobiliário-jundiaí-está-entre-os-destaques': '/lotus-blog/por-que-jundiai-atrai-novos-empreendimentos',
  'casas-de-alto-padrão-em-jundiaí-como-escolher-a-ideal-para-sua-família': '/lotus-blog/imoveis-alto-padrao-jundiai',
  'as-razões-que-motivam-a-compra-de-um-imóvel-de-luxo': '/lotus-blog/imoveis-alto-padrao-jundiai',
  'minha-casa-minha-vida-tem-novo-teto-o-que-muda-e-como-aproveitar-as-novas-oportunidades': '/lotus-blog/como-financiar-o-primeiro-imovel',
  'minha-casa-minha-vida-amplia-limites-e-facilita-acesso-à-casa-própria-veja-o-que-muda': '/lotus-blog/como-financiar-o-primeiro-imovel',
  'casais-de-primeira-viagem-como-comprar-o-primeiro-imóvel-com-segurança': '/lotus-blog/como-financiar-o-primeiro-imovel',
  'caixa-volta-a-financiar-até-80-do-valor-do-imóvel-entenda-o-que-muda-e-como-aproveitar-essa-oportu': '/lotus-blog/financiamento-imobiliario-2026',
  'caixa-libera-mais-de-um-financiamento-por-cpf-o-que-muda-para-você-comprar-seu-próximo-imóvel': '/lotus-blog/financiamento-imobiliario-2026',
  'como-comprar-um-imóvel-com-segurança-guia-prático-para-tomar-a-melhor-decisão': '/lotus-blog/guia-documentacao-compra-imovel',
  'exclusividade-na-venda-de-imóveis-uma-estratégia-que-garante-mais-resultado': '/lotus-blog/como-vender-imovel-jundiai',
  'imóvel-instagramável-o-segredo-das-vendas-rápidas': '/lotus-blog/como-vender-imovel-jundiai',
  'parque-residencial-eloy-chaves': '/lotus-bairro/eloy-chaves',
  'transporte-em-jundiaí-ganha-melhorias-terminal-eloy-chaves-terá-nova-linha-direta-até-o-vila-arens': '/lotus-bairro/eloy-chaves',
  'condomínio-life-residencial-em-jundiaí-lazer-bem-estar-e-qualidade-de-vida-no-engordadouro': '/lotus-condominio/life-engordadouro',
  'residencial-chronos-viva-o-tempo-do-conforto-e-da-sofisticação-em-jundiaí': '/lotus-condominio/chronos',
  'condomínio-bellart-pintores-praticidade-conforto-e-bem-estar-em-jundiaí': '/lotus-condominio/bellart-pintores',
  'terras-da-alvorada-qualidade-de-vida-natureza-preservada-e-infraestrutura-completa': '/lotus-condominio/terras-da-alvorada',
  'condomínio-chácara-primavera-em-jundiaí-conforto-lazer-e-segurança-no-eloy-chaves': '/lotus-condominio/condominio-chacara-primavera',
  'condomínio-atmosphera-onde-o-conforto-encontra-a-natureza': '/lotus-condominio/atmosphera-natural-living',
  'self-residencial-conforto-lazer-e-praticidade-em-jundiaí': '/lotus-condominio/self',
};

/** Regras no formato de `redirects()` do next.config.mjs. */
export function redirecionamentosDoJapi() {
  const has = [{ type: 'host', value: HOST_JAPI }];
  const regra = (source, destino) => ({ source, has, destination: `${LOTUS}${destino}`, permanent: true });
  return [
    ...Object.entries(PAGINAS_JAPI).map(([de, para]) => regra(de, para)),
    // O navegador e o robô pedem o endereço com o acento codificado (%C3%AD),
    // e é esse o caminho que o Next compara com a regra.
    ...Object.entries(ARTIGOS_JAPI).map(([slug, para]) => regra(`/post/${encodeURIComponent(slug)}`, para)),
    regra('/post/:slug*', '/lotus-blog'),
    regra('/blog/:resto*', '/lotus-blog'),
    regra('/:caminho*', '/:caminho*'),
  ];
}
