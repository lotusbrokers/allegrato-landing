/**
 * "Valor a consultar": lançamentos cujo preço não aparece em card nenhum
 * (home, /lotus-lancamentos, páginas de construtora e Área do Corretor), mesmo
 * que a Dashboard traga um.
 *
 * Pedido da Lotus em 05/10/2026: a tabela de setembro/2026 da Santa Angela
 * venceu e a nova só veio para o Reserva Castanheira. Os demais empreendimentos
 * dela passam a "valor a consultar" nas landings e nos cards.
 *
 * O Jardins do Horto saiu da lista em 27/10/2026, também a pedido da Lotus: o
 * card volta a mostrar o valor da tabela de setembro (R$ 631.083,74), mesmo
 * com ela vencida. A landing dele nunca mostrou preço.
 *
 * Em 26/11/2026 a Lotus pediu "mostre apenas os deste mês de novembro". Saíram
 * da lista os que têm o valor da tabela de novembro/2026 na Dashboard:
 * Allegrato, Gioviale, Portal dos Lagos, Resort Prime, Santorini e Vigóre.
 * Ficam o Altos da Avenida, vendido a pedido da Lotus, e o Maxx Santa Angela,
 * cujo valor divulgado pela Santa Angela ainda é o da tabela de julho/2026.
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
  'altos-da-avenida',
  'maxx-santa-angela',
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
