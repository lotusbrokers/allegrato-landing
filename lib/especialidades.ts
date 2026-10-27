// As especialidades do corretor como o site as escreve depois de
// "Especialista em". Vêm da Dash (tenant_memberships.especialidades, pela
// view portal_brokers, migration 20261311): até 5, na ordem gravada. NULL =
// nenhuma.
//
// Saem como foram gravadas, sem plural nem correção: um erro de digitação da
// Diretoria aparece no site, e não cabe ao site corrigir.

/** O cartão da página do imóvel é estreito: só as primeiras. */
export const NO_CARTAO_DO_IMOVEL = 3;

/** Cada especialidade como o site mostra, na ordem gravada; [] = nenhuma. */
export function especialidadesDoSite(gravadas: readonly string[] | null | undefined): string[] {
  return (gravadas ?? []).map((e) => e.trim()).filter(Boolean);
}

/** "A", "A e B", "A, B e C". */
function listaEmPortugues(itens: string[]): string {
  return itens.length <= 1 ? itens.join('') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

/**
 * O que vem depois de "Especialista em": as especialidades (as `maximo`
 * primeiras) ou, sem nenhuma, `seNenhuma`, o texto de antes.
 */
export function especialistaEm(gravadas: readonly string[] | null | undefined, seNenhuma: string, maximo?: number): string {
  const itens = especialidadesDoSite(gravadas).slice(0, maximo);
  return itens.length > 0 ? listaEmPortugues(itens) : seNenhuma;
}

/** A linha de baixo do cartão da página do imóvel; sem especialidade, o bairro. */
export function especialistaNoCartaoDoImovel(gravadas: readonly string[] | null | undefined, bairro: string): string {
  return especialistaEm(gravadas, bairro, NO_CARTAO_DO_IMOVEL);
}
