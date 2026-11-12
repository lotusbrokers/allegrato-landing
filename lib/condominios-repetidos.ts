/**
 * Condomínios cadastrados mais de uma vez na Dashboard, um registro por
 * portaria, com o mesmo texto, as mesmas fotos e as mesmas metragens. A
 * auditoria de SEO de 11/2026 pediu: "juntar os 3 pares de condomínio
 * portaria". No site cada grupo vira uma página só: a PRIMEIRA do grupo que
 * estiver publicada. As outras saem do índice, do sitemap, dos guias de bairro
 * e do "Perto do", e o endereço delas leva à que ficou.
 *
 * Ordem de cada grupo, conferida em 10/11/2026:
 *  - Fatto: a portaria 2 é a que o Google indexou. A rua dela tinha vírgula
 *    sobrando ("Tavarnaro, , 1431"), consertada em lib/endereco.ts.
 *  - Tulipas: a portaria 2 tem o endereço que o próprio texto cita (Av.
 *    Rosiclair Torres Batista, 861). O "Tulipas Garden" está com rua, CEP e
 *    bairro do CA0064 (Av. Cezar Brunholi), provável erro de cadastro.
 *  - Vista Park: as duas estão no Google; fica a portaria I.
 *
 * Redirecionamento TEMPORÁRIO (307): quem fica depende do que está publicado.
 * Se a Lotus despublicar a página escolhida, a outra assume sozinha; um 308
 * guardado no navegador apontaria para o lado errado e faria laço.
 *
 * O conserto de verdade é na Dashboard: um cadastro por condomínio, com o
 * outro despublicado. Feito isso, o grupo continua servindo para levar o
 * endereço antigo ao que ficou. Se a Lotus renomear um cadastro, o slug muda
 * (lib/slug-condominio.ts): ponha o slug novo aqui no grupo.
 *
 * Módulo puro, para o teste importar sem o cliente do Supabase.
 */
export const GRUPOS_DE_REPETIDOS: readonly (readonly string[])[] = [
  ['fatto-torres-de-sao-jose-portaria-2', 'fatto-torres-de-sao-jose-portaria-1'],
  ['tulipas-garden-portaria-2', 'tulipas-garden'],
  ['vista-park-portaria-i', 'vista-park-portaria-ii'],
];

/**
 * Para onde vai o slug de um cadastro repetido, ou null se ele é o que fica
 * (ou não é repetido, ou nenhum do grupo está publicado).
 */
export function principalDoRepetido(slug: string, publicados: ReadonlySet<string>): string | null {
  const grupo = GRUPOS_DE_REPETIDOS.find((g) => g.includes(slug));
  const principal = grupo?.find((s) => publicados.has(s));
  return principal && principal !== slug ? principal : null;
}
