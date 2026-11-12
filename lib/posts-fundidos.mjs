/**
 * Posts do blog fundidos em outro (auditoria de SEO de 11/2026: posts que
 * disputavam a mesma busca). Os dois de junho/2026 eram curtos (~160
 * palavras) e repetiam um guia completo; o que só eles diziam foi para o guia
 * que ficou (Jardim do Lago; autônomo financia com extratos; pré-aprovação
 * antes de escolher o imóvel). O endereço antigo leva ao que ficou com 308.
 *
 * É .mjs, e não .ts, porque o next.config.mjs importa daqui (mesma razão de
 * lib/redirecionamento-japi.mjs).
 */
export const POSTS_FUNDIDOS = {
  'onde-morar-em-jundiai-2026': 'melhores-bairros-para-morar-em-jundiai',
  'financiamento-imobiliario-2026': 'como-financiar-o-primeiro-imovel',
};

/** Regras de redirects() do next.config.mjs. */
export function redirecionamentosDosPostsFundidos() {
  return Object.entries(POSTS_FUNDIDOS).map(([de, para]) => ({
    source: `/lotus-blog/${de}`,
    destination: `/lotus-blog/${para}`,
    permanent: true,
  }));
}
