/**
 * Texto da Dashboard sem a marcação de markdown.
 *
 * A equipe escreve a descrição dos condomínios em markdown (## título,
 * **negrito**, listas) e o site mostrava os sinais crus: na página, no card do
 * índice e na description do Google ("## Condomínio Chácara das Flores…",
 * auditoria de SEO de 11/2026). Sai a marcação e fica o texto, num parágrafo
 * só, que é como a página já o mostrava. Linha que termina sem pontuação
 * (título, item de lista) ganha ponto, para não colar na frase seguinte.
 *
 * Asterisco sozinho fica: é nota de rodapé ("62,8 m²*"), não itálico.
 * Módulo puro: usado pela página, pelo componente de cliente e pelo teste.
 */
export function textoSemMarkdown(texto: string | null | undefined): string {
  return (texto ?? '')
    .split(/\r?\n/)
    .map((linha) =>
      linha
        .replace(/^\s{0,3}#{1,6}\s+/, '')
        .replace(/^\s{0,3}>\s?/, '')
        .replace(/^\s*(?:[-*+•]|\d+[.)])\s+/, '')
        .replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/(\*\*|__)(.+?)\1/g, '$2')
        .replace(/\*\*/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .trim(),
    )
    .filter(Boolean)
    .map((linha, i, todas) => (i < todas.length - 1 && !/[.!?:;…]$/.test(linha) ? `${linha}.` : linha))
    .join(' ');
}
