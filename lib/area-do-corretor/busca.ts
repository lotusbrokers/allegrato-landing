/**
 * Busca global da Área do Corretor.
 *
 * Roda no navegador, sobre um índice pequeno (lançamentos, imóveis,
 * construtoras e seções: algumas centenas de itens) que o servidor monta junto
 * com a página. Nesse volume, filtrar em memória responde a cada tecla e não
 * deixa nada para manter. Se os materiais do Drive levarem o índice a milhares
 * de itens, a troca é por uma busca no servidor com esta mesma assinatura.
 */

export type TipoDeItem = 'lancamento' | 'imovel' | 'construtora' | 'secao' | 'pasta' | 'arquivo';

export type ItemDeBusca = {
  tipo: TipoDeItem;
  titulo: string;
  /** Linha de apoio exibida no resultado: bairro, cidade, construtora... */
  detalhe: string;
  /** Rota interna da área. */
  href: string;
  /** Texto pesquisável que não aparece na tela: código, tipologia, construtora, palavras da seção. */
  termos: string;
};

/** Minúsculas, sem acento e com espaços simples: "Jundiaí" e "jundiai" são a mesma busca. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Todos os termos digitados precisam aparecer (E, não OU): "apartamento
 * medeiros" traz só apartamentos no Medeiros. Quem casa mais termos no título
 * vem antes; no empate, vale a ordem do índice, que já chega por relevância.
 */
export function buscar(indice: ItemDeBusca[], consulta: string, limite = 20): ItemDeBusca[] {
  const termos = normalizar(consulta).split(' ').filter(Boolean);
  if (termos.length === 0) return [];

  const achados: { item: ItemDeBusca; peso: number; ordem: number }[] = [];
  indice.forEach((item, ordem) => {
    const titulo = normalizar(item.titulo);
    const tudo = `${titulo} ${normalizar(item.detalhe)} ${normalizar(item.termos)}`;
    if (!termos.every((t) => tudo.includes(t))) return;
    achados.push({ item, peso: termos.filter((t) => titulo.includes(t)).length, ordem });
  });

  return achados
    .sort((a, b) => b.peso - a.peso || a.ordem - b.ordem)
    .slice(0, limite)
    .map((a) => a.item);
}
