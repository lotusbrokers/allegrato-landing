/**
 * Garante que a descrição de uma página cite o nome dela.
 *
 * As descrições dos condomínios vêm do dashboard, e fases do mesmo condomínio
 * chegaram com o mesmo texto: Nature Village e Nature Village II, Flex I e
 * Flex II. Para o Google, duas páginas com a mesma descrição são candidatas a
 * cópia uma da outra, e uma delas tende a ficar fora do índice. Quando o texto
 * não traz o nome exato, o nome entra na frente — o que basta para separar as
 * fases sem reescrever o texto que a Lotus cadastrou.
 *
 * "Nome exato" é o nome inteiro, entre fronteiras de palavra: "Flex I" não
 * conta como citado num texto que fala do "Flex II".
 */
export function descricaoComNome(texto: string, nome: string): string {
  const t = texto.trim();
  const n = nome.trim();
  if (!n) return t;
  const escapado = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const citaONome = new RegExp(`(^|[^\\p{L}\\p{N}])${escapado}(?=$|[^\\p{L}\\p{N}])`, 'iu').test(t);
  return citaONome ? t : `${n}: ${t}`;
}
