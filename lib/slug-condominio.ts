/**
 * Slug do condomínio, derivado do nome.
 *
 * Derivado e não guardado: a view não tem coluna de slug, e criar uma seria uma
 * segunda fonte da verdade para divergir do nome. Nome corrigido no dashboard,
 * URL acompanha.
 *
 * Os 49 cadastros de hoje geram 49 slugs distintos — conferido antes de trocar
 * as URLs. Se um dia dois condomínios colidirem, resolveSlug devolve o primeiro
 * em ordem alfabética de id, de forma estável, e o outro fica inalcançável por
 * slug: o sinal disso é o segundo sumir da listagem com a URL do primeiro.
 * Nesse dia, desempatar aqui (sufixo de bairro é o caminho natural).
 *
 * Módulo sem dependências (nem do Supabase) para o teste e a página do imóvel
 * importarem só a função. lib/condominios.ts a reexporta.
 */
export function slugCondominio(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
