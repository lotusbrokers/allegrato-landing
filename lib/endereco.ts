/**
 * Junta as partes de um endereço com ", ".
 *
 * O cadastro da Dashboard às vezes traz a rua com vírgula no fim, e aí a
 * página mostrava "Avenida Antonio Tavarnaro, , 1431" (Fatto Torres de São
 * José Portaria 2, auditoria de 11/2026). Cada parte perde as vírgulas e os
 * espaços das pontas, e parte vazia não entra.
 *
 * Módulo puro: usado por componentes de cliente e pelo JSON-LD.
 */
export function juntarEndereco(partes: readonly (string | number | null | undefined)[]): string {
  return partes
    .map((p) => String(p ?? '').replace(/^[\s,]+|[\s,]+$/g, ''))
    .filter(Boolean)
    .join(', ');
}
