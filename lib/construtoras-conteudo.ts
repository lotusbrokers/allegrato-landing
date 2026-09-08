/**
 * Conteúdo institucional das construtoras, escrito pela Lotus.
 *
 * SEGUNDA FONTE DA VERDADE, e de propósito. O dashboard não tem cadastro de
 * construtora — o campo `construtora` do lançamento é texto livre e não carrega
 * logo, história nem números (ver o cabeçalho de lib/construtoras-paginas.ts).
 * Enquanto não tiver, o texto que a Lotus envia mora aqui, versionado, em vez
 * de a página inventar o que não sabe.
 *
 * Quando o dashboard ganhar esses campos, o caminho é ler de lá e esvaziar este
 * mapa — como já foi feito com CAPAS_CURADAS em lib/lancamentos.ts, que existiu
 * pelo mesmo motivo e hoje está vazio.
 *
 * A chave é o slug da construtora, o mesmo que a URL usa. Construtora que não
 * está aqui simplesmente não ganha a seção: a página continua com hero,
 * lançamentos e CTA, sem buraco visível.
 *
 * O texto é publicado como veio da Lotus. Não é lugar de reescrever a história
 * de uma empresa parceira.
 */

export type NumeroDaConstrutora = { valor: string; rotulo: string };

export type ConteudoConstrutora = {
  /** Caminho em public/. A imagem precisa existir lá. */
  logo?: string;
  /** Abertura do "Sobre", antes dos números. */
  paragrafos: string[];
  /** Destaques numéricos. Sem eles, o bloco não aparece. */
  numeros?: NumeroDaConstrutora[];
  /** Fecho, depois dos números. */
  paragrafosFinais?: string[];
};

const CONTEUDO: Record<string, ConteudoConstrutora> = {
  // Texto e logo enviados pela Lotus em 08/09/2026.
  'santa-angela': {
    logo: '/construtoras/santa-angela.png',
    paragrafos: [
      'A Construtora Santa Angela atua há mais de 40 anos no mercado imobiliário de Jundiaí e região, com foco em construir empreendimentos de qualidade e proporcionar uma boa experiência de moradia.',
      'Fundada oficialmente em 1984 pela família Benassi, a empresa carrega uma história familiar iniciada em 1983, quando foi adquirido o primeiro terreno no Jardim Angela. O nome da empresa é uma homenagem à matriarca da família, Ângela Costa.',
      'Ao longo de sua trajetória, a Santa Angela consolidou-se como uma das empresas de destaque do mercado imobiliário regional, unindo profissionalismo, inovação, responsabilidade, transparência e respeito.',
    ],
    numeros: [
      { valor: '59', rotulo: 'empreendimentos' },
      { valor: '10.990', rotulo: 'unidades entregues' },
      { valor: '+850 mil', rotulo: 'm² construídos' },
    ],
    paragrafosFinais: [
      'Sua atuação é guiada por quatro valores principais: confiança, respeito, trabalho em equipe e comprometimento. A empresa também prioriza a qualidade das obras, o cumprimento de prazos, a satisfação de clientes e colaboradores e a melhoria contínua de seus processos.',
      'Em essência: a Santa Angela combina mais de quatro décadas de experiência, solidez e inovação para transformar sonhos em empreendimentos que contribuem para o desenvolvimento de Jundiaí e região.',
    ],
  },
};

/** O conteúdo institucional desta construtora, ou null se ainda não houver. */
export function conteudoDaConstrutora(slug: string): ConteudoConstrutora | null {
  return CONTEUDO[slug] ?? null;
}

/** Slugs que já têm conteúdo — usado pelo teste para conferir os caminhos. */
export function slugsComConteudo(): string[] {
  return Object.keys(CONTEUDO);
}
