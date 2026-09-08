/**
 * Opções dos filtros de /lotus-lancamentos, derivadas do próprio acervo.
 *
 * O problema que isto resolve: as opções de cidade, estágio, tipologia e preço
 * eram escritas à mão no componente e nunca conferidas contra o banco. Em
 * 08/09/2026, nos 30 lançamentos publicados:
 *
 *   - cidade    — o seletor oferecia "Vinhedo", que não tem nenhum imóvel, e
 *                 não oferecia Campinas nem Louveira, que têm.
 *   - estágio   — oferecia "Pré-lançamento", que não existe no acervo, e não
 *                 oferecia "Lançamento", que é o estágio de 5 deles. Ainda por
 *                 cima o banco traz o mesmo estágio grafado de duas formas
 *                 ("Obras" e "Em obras", "Pronto" e "Pronto para morar"),
 *                 então escolher uma escondia os da outra.
 *   - tipologia — os 30 estão com `tipo_dorms` vazio: qualquer escolha
 *                 devolvia lista vazia.
 *   - preço     — os 30 estão com `preco_num` nulo, o que vira 0 no card. Como
 *                 o teste é `preço <= teto`, 0 passa em qualquer faixa: o
 *                 filtro não escondia nada, nem a faixa "acima de R$ 1,5 mi".
 *
 * A regra aqui é uma só, e vale para os quatro: **filtro é espelho do acervo**.
 * A opção existe porque existe imóvel para ela; o filtro inteiro desaparece
 * quando nenhum imóvel tem aquele dado preenchido. É o mesmo tratamento que a
 * construtora já recebia neste seletor — a diferença é que agora os outros
 * seguem a mesma regra.
 *
 * Sumir é melhor do que ficar quebrado das duas formas possíveis: um filtro que
 * sempre devolve vazio faz o visitante achar que não há imóveis, e um que
 * deixa tudo passar faz ele achar que viu o recorte que pediu.
 *
 * Módulo próprio, sem o client do Supabase, para o teste importar as funções
 * puras sem arrastar o banco — mesma razão de lib/landings.ts e
 * lib/construtoras.ts existirem separados de lib/lancamentos.ts.
 */

/** Chave de comparação: sem acento, sem caixa, sem espaço repetido. */
function chave(valor: string): string {
  return valor
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Grafias que o dashboard aceita para o mesmo estágio de obra.
 *
 * Campo de texto livre na origem, então "Obras" e "Em obras" chegam como
 * valores diferentes para a mesma coisa. Agrupar aqui, e não corrigir no banco,
 * é de propósito: o portal só lê o Supabase. A correção definitiva é na origem.
 *
 * O rótulo à direita é o que aparece no seletor e o que o filtro compara.
 */
const ESTAGIOS_SINONIMOS: Record<string, string> = {
  'lancamento': 'Lançamento',
  'pre-lancamento': 'Pré-lançamento',
  'pre lancamento': 'Pré-lançamento',
  'obras': 'Em obras',
  'em obras': 'Em obras',
  'pronto': 'Pronto para morar',
  'pronto para morar': 'Pronto para morar',
};

/**
 * Estágio no rótulo canônico, ou string vazia se não informado.
 *
 * Estágio desconhecido é devolvido como veio (só aparado): um valor novo no
 * dashboard vira opção nova no seletor sozinho, em vez de sumir da listagem.
 */
export function canonizarEstagio(estagio: string | null | undefined): string {
  const bruto = estagio?.trim();
  if (!bruto) return '';
  return ESTAGIOS_SINONIMOS[chave(bruto)] ?? bruto;
}

/** O que um item precisa expor para as opções serem montadas. */
export type ItemFiltravel = {
  city: string;
  stage: string;
  type: string;
  priceNum: number;
};

export type OpcoesDeFiltro = {
  /** Cidades com ao menos um imóvel, em ordem alfabética. */
  cidades: string[];
  /** Estágios canônicos com ao menos um imóvel, em ordem alfabética. */
  estagios: string[];
  /** Tipologias com ao menos um imóvel, em ordem alfabética. */
  tipologias: string[];
  /**
   * Existe algum imóvel com preço numérico? Enquanto não existir, o seletor de
   * preço não deve ser exibido: sem valor cadastrado ele não filtra nada.
   */
  temPreco: boolean;
};

/** Valores distintos e não vazios de um campo, em ordem alfabética pt-BR. */
function distintos(valores: string[]): string[] {
  const vistos = new Set<string>();
  for (const v of valores) {
    const limpo = v?.trim();
    if (limpo) vistos.add(limpo);
  }
  return [...vistos].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/** As opções que o seletor deve oferecer para este acervo. */
export function opcoesDeFiltro(itens: readonly ItemFiltravel[]): OpcoesDeFiltro {
  return {
    cidades: distintos(itens.map((i) => i.city)),
    estagios: distintos(itens.map((i) => canonizarEstagio(i.stage))),
    tipologias: distintos(itens.map((i) => i.type)),
    temPreco: itens.some((i) => i.priceNum > 0),
  };
}

/** Nenhum filtro aplicado. */
export const SEM_FILTRO = 'any';

export type FiltrosSelecionados = {
  cidade: string;
  estagio: string;
  tipologia: string;
  preco: string;
  construtora: string;
};

/**
 * O item passa por todos os filtros selecionados?
 *
 * Combinação é E, não OU: dois filtros ativos devolvem só quem atende aos dois.
 * O estágio é comparado no rótulo canônico dos dois lados — sem isso, escolher
 * "Em obras" deixaria de fora quem está cadastrado como "Obras".
 */
export function passaNosFiltros(item: ItemFiltravel & { builder?: string }, f: FiltrosSelecionados): boolean {
  if (f.cidade !== SEM_FILTRO && item.city !== f.cidade) return false;
  if (f.estagio !== SEM_FILTRO && canonizarEstagio(item.stage) !== f.estagio) return false;
  if (f.tipologia !== SEM_FILTRO && item.type !== f.tipologia) return false;
  if (f.construtora !== SEM_FILTRO && (item.builder ?? '') !== f.construtora) return false;
  if (f.preco !== SEM_FILTRO) {
    const teto = Number.parseInt(f.preco, 10);
    // Sem preço cadastrado o item não é alcançado por faixa nenhuma. Antes ele
    // passava em todas, porque 0 é menor que qualquer teto — o que fazia a
    // faixa "até R$ 600 mil" devolver o acervo inteiro.
    if (!Number.isFinite(teto) || item.priceNum <= 0 || item.priceNum > teto) return false;
  }
  return true;
}
