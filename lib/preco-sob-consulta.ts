/**
 * "Valor a consultar": lançamentos cujo preço não aparece em card nenhum
 * (home, /lotus-lancamentos, páginas de construtora e Área do Corretor), mesmo
 * que a Dashboard traga um.
 *
 * Pedido da Lotus em 05/10/2026: a tabela de setembro/2026 da Santa Angela
 * venceu e a nova só veio para o Reserva Castanheira. Os demais empreendimentos
 * dela passam a "valor a consultar" nas landings e nos cards.
 *
 * Diferente de lib/correcoes-cadastro.ts, que é temporário e se desliga sozinho
 * quando a Dashboard é atualizada, isto é uma decisão comercial: só sai daqui
 * quando a Lotus quiser o preço de volta. Ao tirar um slug, confira antes se a
 * Dashboard (ou uma correção de cadastro) já traz o valor da tabela vigente.
 *
 * Módulo puro, sem banco, para o teste e os componentes importarem direto.
 */

/** Chave = slug da landing, o mesmo de lib/correcoes-cadastro.ts. */
export const PRECO_SOB_CONSULTA: ReadonlySet<string> = new Set([
  'allegrato',
  'altos-da-avenida',
  'gioviale',
  'jardins-do-horto',
  'maxx-santa-angela',
  'portal-dos-lagos',
  'resort-prime',
  'santorini',
  'vigore',
]);

/** O que os cards mostram no lugar do preço, para este caso e para quem não tem preço cadastrado. */
export const SEM_PRECO = 'Valor a consultar';

/** O cadastro sem preço, se o lançamento estiver na lista; senão, o próprio cadastro. */
export function semPrecoSobConsulta<T extends { preco_texto: string | null; preco_num: number | null }>(
  row: T,
  slug: string | null | undefined,
): T {
  return slug && PRECO_SOB_CONSULTA.has(slug) ? { ...row, preco_texto: null, preco_num: null } : row;
}
