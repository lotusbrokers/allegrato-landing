/**
 * A lista girada para começar em `inicio`, dando a volta: girar([a, b, c, d], 2)
 * é [c, d, a, b]. Início fora da lista devolve a lista como está.
 *
 * Para listas de "veja também" (bairros vizinhos, condomínios semelhantes):
 * cada página mostra as que vêm depois dela, e todas acabam recebendo link de
 * alguma. Com a ordem fixa, as primeiras da lista levavam o link de todas as
 * páginas e as outras só tinham o do índice, o que as deixava em "Detectada,
 * mas não indexada" no Search Console (06/11/2026).
 */
export function girar<T>(lista: readonly T[], inicio: number): T[] {
  if (inicio <= 0 || inicio >= lista.length) return [...lista];
  return [...lista.slice(inicio), ...lista.slice(0, inicio)];
}
