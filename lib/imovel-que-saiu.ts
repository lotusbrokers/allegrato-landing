/**
 * Para onde vai quem chega a um imóvel que saiu do site (vendido, retirado ou
 * não aprovado na Dashboard).
 *
 * A REGRA (auditoria de SEO de 11/2026, que pediu uma regra fixa no lugar dos
 * 404 de AP0681, AP0685 e AP0686): redirecionamento TEMPORÁRIO (307) para a
 * busca do mesmo tipo. Do imóvel que saiu só sobra o código, e o prefixo dele
 * diz o tipo.
 *
 * Por que 307 e não 308: o imóvel some da view portal_imoveis quando deixa de
 * estar aprovado, e pode voltar (AP0685 e AP0686 saíram de um dia para o
 * outro em 04/11/2026). O navegador guarda um 308 e continuaria mandando a
 * pessoa para a busca mesmo depois da volta; o 307 não fica guardado. Para o
 * Google tanto faz: a URL sai do índice como página e a busca já está nele.
 *
 * Módulo puro, para o teste importar sem o cliente do Supabase.
 */

/** Prefixo do código do imóvel → valor do filtro `tipo` da busca. */
const TIPO_DO_PREFIXO: Record<string, string> = {
  AP: 'Apartamento',
  CA: 'Casa',
  TE: 'Terreno',
};

export function destinoDoImovelQueSaiu(codigo: string): string {
  const tipo = TIPO_DO_PREFIXO[codigo.slice(0, 2).toUpperCase()];
  return tipo ? `/lotus-busca?tipo=${encodeURIComponent(tipo)}` : '/lotus-busca';
}
