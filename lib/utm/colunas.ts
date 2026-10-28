/**
 * As colunas do CSV do Meta Ads que o UTM Manager entende, e o reconhecimento
 * automático delas pelo cabeçalho.
 *
 * O nome da coluna muda com o idioma do Gerenciador de Anúncios e com o tipo
 * de exportação: a da tabela ("Exportar dados da tabela") e a de edição em
 * massa trazem cabeçalhos diferentes para o mesmo dado. Os sinônimos abaixo
 * cobrem as duas, em português e em inglês; o que não for reconhecido a
 * pessoa mapeia à mão na tela de importação.
 */

export const CAMPOS_CSV = [
  'contaId',
  'contaNome',
  'campanhaId',
  'campanhaNome',
  'campanhaStatus',
  'conjuntoId',
  'conjuntoNome',
  'conjuntoStatus',
  'anuncioId',
  'anuncioNome',
  'anuncioStatus',
  'veiculacao',
  'urlDestino',
  'parametrosUrl',
  'inicio',
  'termino',
  'objetivo',
  'posicionamento',
] as const;

export type CampoCsv = (typeof CAMPOS_CSV)[number];

/**
 * Rótulo na tela e nomes de coluna aceitos. Comparação sem acento, sem caixa
 * e sem pontuação. "Início dos relatórios" fica de fora de propósito: é o
 * período do relatório exportado, não a data de início da campanha.
 */
export const DEFINICAO_DOS_CAMPOS: Record<CampoCsv, { rotulo: string; sinonimos: string[] }> = {
  contaId: { rotulo: 'ID da conta de anúncios', sinonimos: ['account id', 'ad account id', 'id da conta', 'id da conta de anuncios'] },
  contaNome: { rotulo: 'Nome da conta de anúncios', sinonimos: ['account name', 'ad account name', 'nome da conta', 'nome da conta de anuncios'] },
  campanhaId: { rotulo: 'ID da campanha', sinonimos: ['campaign id', 'id da campanha'] },
  campanhaNome: { rotulo: 'Nome da campanha', sinonimos: ['campaign name', 'campaign', 'nome da campanha', 'campanha'] },
  campanhaStatus: {
    rotulo: 'Status da campanha',
    sinonimos: ['campaign status', 'campaign run status', 'campaign effective status', 'status da campanha', 'status de execucao da campanha'],
  },
  conjuntoId: { rotulo: 'ID do conjunto de anúncios', sinonimos: ['ad set id', 'adset id', 'id do conjunto de anuncios', 'id do conjunto'] },
  conjuntoNome: {
    rotulo: 'Nome do conjunto de anúncios',
    sinonimos: ['ad set name', 'adset name', 'ad set', 'nome do conjunto de anuncios', 'nome do conjunto', 'conjunto de anuncios'],
  },
  conjuntoStatus: {
    rotulo: 'Status do conjunto de anúncios',
    sinonimos: ['ad set status', 'ad set run status', 'adset status', 'adset run status', 'status do conjunto de anuncios', 'status de execucao do conjunto de anuncios', 'status do conjunto'],
  },
  anuncioId: { rotulo: 'ID do anúncio', sinonimos: ['ad id', 'id do anuncio'] },
  anuncioNome: { rotulo: 'Nome do anúncio', sinonimos: ['ad name', 'ad', 'nome do anuncio', 'anuncio'] },
  anuncioStatus: { rotulo: 'Status do anúncio', sinonimos: ['ad status', 'ad run status', 'status do anuncio', 'status de execucao do anuncio'] },
  veiculacao: {
    rotulo: 'Status de veiculação',
    sinonimos: [
      'delivery',
      'delivery status',
      'campaign delivery',
      'ad set delivery',
      'ad delivery',
      'veiculacao',
      'status de veiculacao',
      'veiculacao da campanha',
      'veiculacao do conjunto de anuncios',
      'veiculacao do anuncio',
    ],
  },
  urlDestino: {
    rotulo: 'URL de destino',
    sinonimos: ['link', 'website url', 'destination url', 'link url', 'url', 'url do site', 'url de destino', 'link do site', 'url do link'],
  },
  parametrosUrl: { rotulo: 'Parâmetros de URL', sinonimos: ['url tags', 'url parameters', 'parametros de url', 'parametros do url', 'tags de url', 'tags do url'] },
  inicio: {
    rotulo: 'Data de início',
    sinonimos: ['starts', 'start time', 'start date', 'campaign start time', 'ad set time start', 'inicio', 'data de inicio', 'hora de inicio', 'inicio da veiculacao'],
  },
  termino: {
    rotulo: 'Data de término',
    sinonimos: ['ends', 'end time', 'end date', 'stop time', 'campaign stop time', 'ad set time stop', 'termino', 'data de termino', 'hora de termino', 'fim', 'encerramento'],
  },
  objetivo: { rotulo: 'Objetivo da campanha', sinonimos: ['objective', 'campaign objective', 'objetivo', 'objetivo da campanha'] },
  posicionamento: { rotulo: 'Posicionamento', sinonimos: ['placement', 'placements', 'posicionamento', 'posicionamentos'] },
};

/** Cabeçalho comparável: sem acento, sem caixa, sem pontuação e sem o "(...)" de rótulo duplo. */
export function normalizarCabecalho(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Índice da coluna de cada campo no cabeçalho; null quando o campo não foi encontrado. */
export type Mapeamento = Record<CampoCsv, number | null>;

export type ResultadoDoMapeamento = {
  mapeamento: Mapeamento;
  /** Colunas do arquivo que não viraram campo nenhum (a maioria é métrica: alcance, gasto...). */
  ignoradas: string[];
};

export function mapearColunas(cabecalho: string[]): ResultadoDoMapeamento {
  const mapeamento = Object.fromEntries(CAMPOS_CSV.map((c) => [c, null])) as Mapeamento;
  const usadas = new Set<number>();
  for (const campo of CAMPOS_CSV) {
    const aceitos = new Set(DEFINICAO_DOS_CAMPOS[campo].sinonimos);
    // Coluna repetida: vale a primeira, como o aviso do leitor de CSV diz.
    const indice = cabecalho.findIndex((nome, i) => !usadas.has(i) && aceitos.has(normalizarCabecalho(nome)));
    if (indice >= 0) {
      mapeamento[campo] = indice;
      usadas.add(indice);
    }
  }
  const ignoradas = cabecalho.filter((nome, i) => !usadas.has(i) && nome.trim() !== '');
  return { mapeamento, ignoradas };
}

/**
 * O mínimo para importar: sem o ID da campanha não há como reconhecer o
 * registro numa segunda importação, e nome repetido não serve de chave.
 */
export function camposQueFaltam(mapeamento: Mapeamento): CampoCsv[] {
  const obrigatorios: CampoCsv[] = ['campanhaId', 'campanhaNome'];
  return obrigatorios.filter((c) => mapeamento[c] === null);
}

/** Linha do CSV reduzida aos campos mapeados: é isto que o navegador manda ao servidor. */
export type LinhaMapeada = Partial<Record<CampoCsv, string>> & { linha: number };

export function aplicarMapeamento(linhas: { numero: number; campos: string[] }[], mapeamento: Mapeamento): LinhaMapeada[] {
  return linhas.map(({ numero, campos }) => {
    const saida: LinhaMapeada = { linha: numero };
    for (const campo of CAMPOS_CSV) {
      const indice = mapeamento[campo];
      if (indice !== null && campos[indice] !== undefined && campos[indice].trim() !== '') saida[campo] = campos[indice].trim();
    }
    return saida;
  });
}
