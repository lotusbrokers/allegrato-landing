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
  /**
   * Rótulo do bloco de números, quando a Lotus envia um — a Mac Lucer manda o
   * período a que os números se referem, e sem isso o leitor não sabe se "16
   * empreendimentos" é do ano ou da história inteira.
   */
  numerosTitulo?: string;
  /**
   * Lista com rótulo — "Principais diferenciais", "Valores", o que a Lotus
   * enviar. Entra depois dos números e antes do fecho.
   *
   * Campo genérico e não "diferenciais" porque a próxima construtora pode
   * mandar a lista com outro nome, e um campo por rótulo viraria um por
   * empresa.
   */
  lista?: { titulo: string; itens: string[] };
  /** Fecho, depois dos números e da lista. */
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

  // Texto e logo enviados pela Lotus em 08/09/2026.
  'mac-lucer': {
    logo: '/construtoras/mac-lucer.png',
    paragrafos: [
      'A Mac Lucer Empreendimentos nasceu da história e do empreendedorismo da família Benassi, de origem italiana. Sua trajetória na construção civil começou em 1993, quando José Benassi identificou uma oportunidade de desenvolver empreendimentos no Parque da Represa, em Jundiaí, dando início à história da empresa.',
      'O nome Mac Lucer homenageia as mulheres da família: Maria, Rosa, Cristina, Luci e Célia, reforçando a importância da família e da valorização feminina em sua história.',
      'Seu primeiro empreendimento foi o Residencial Olívio Boa, no Parque da Represa. Desde então, a empresa vem se consolidando no mercado imobiliário de Jundiaí e região, com foco em qualidade, credibilidade, inovação e relacionamento humanizado.',
      'A Mac Lucer tem como principais valores comprometimento, acolhimento e integridade, buscando oferecer empreendimentos de alto padrão de qualidade, preços competitivos e atendimento especializado.',
    ],
    numerosTitulo: 'Principais números (1993–2025)',
    numeros: [
      { valor: '16', rotulo: 'empreendimentos' },
      { valor: '2.076', rotulo: 'imóveis vendidos' },
      { valor: '10', rotulo: 'empreendimentos entregues' },
      { valor: '1.106', rotulo: 'imóveis em construção' },
      { valor: '+370 mil', rotulo: 'm² construídos' },
    ],
    paragrafosFinais: [
      'Em essência: a Mac Lucer une tradição familiar, qualidade e inovação, transformando sonhos em realidade e construindo não apenas imóveis, mas parte da história de seus clientes.',
    ],
  },

  // Texto e logo enviados pela Lotus em 08/09/2026. A chave é o slug do nome
  // cadastrado no dashboard ("Auten Incorporadora"), e não o nome curto que o
  // texto usa — é ele que forma a URL.
  'auten-incorporadora': {
    logo: '/construtoras/auten.png',
    paragrafos: [
      'A Auten, integrante do Grupo Cataguá Soluções Imobiliárias, atua no mercado imobiliário com quase quatro décadas de tradição, tendo como propósito transformar o comum em extraordinário.',
      'A empresa desenvolve empreendimentos exclusivos, priorizando localização, valorização, segurança e tecnologia. Seus projetos combinam design moderno, funcionalidade e sofisticação, criando ambientes que proporcionam uma experiência diferenciada de moradia, lazer e status.',
      'A Auten busca superar as expectativas dos clientes em cada detalhe, estabelecendo novos padrões de qualidade e oferecendo não apenas espaços para morar, mas um estilo de vida único e uma experiência que vai além do imóvel.',
    ],
    // Sem bloco de números: a Lotus não enviou nenhum, e o bloco só aparece
    // quando há o que mostrar.
    paragrafosFinais: [
      'Em essência: a Auten representa exclusividade, sofisticação, inovação e valorização, transformando cada empreendimento em uma experiência diferenciada.',
    ],
  },

  // Texto e logo enviados pela Lotus em 08/09/2026.
  inkkorp: {
    logo: '/construtoras/inkkorp.png',
    paragrafos: [
      'A INKKORP surge da união de quatro trajetórias com mais de 40 anos de experiência no mercado imobiliário e na construção civil, combinando visão empreendedora, excelência técnica, gestão e expertise comercial.',
      'A incorporadora desenvolve projetos com foco em qualidade, inovação, transparência, governança e geração de valor, buscando equilibrar as necessidades de moradores e investidores.',
      'Seu principal propósito é “mudar vidas sem mudar localizações”, levando tecnologia, conforto e infraestrutura para bairros já consolidados, preservando o sentimento de pertencimento e contribuindo para o desenvolvimento responsável das cidades.',
      'A INKKORP se diferencia pela união entre estratégia, sensibilidade e excelência técnica, criando empreendimentos a partir de análises de mercado e pensando tanto na experiência de quem mora quanto na segurança e valorização de quem investe.',
    ],
    lista: {
      titulo: 'Principais diferenciais',
      itens: [
        'Localizações estratégicas e inteligentes',
        'Qualidade construtiva superior',
        'Tecnologia e inovação',
        'Design funcional',
        'Relacionamento próximo e personalizado',
        'Transparência e gestão responsável',
        'Foco em valorização sustentável',
      ],
    },
    paragrafosFinais: [
      'Em essência: a INKKORP busca transformar experiência e inteligência de mercado em empreendimentos que unem qualidade de vida, segurança para investidores e desenvolvimento responsável, criando espaços com propósito e valor para o futuro.',
    ],
  },

  // Texto e logo enviados pela Lotus em 08/09/2026.
  'gp-desenvolvimento-urbano': {
    logo: '/construtoras/gp-desenvolvimento-urbano.png',
    paragrafos: [
      'A GP Desenvolvimento Urbano é uma empresa familiar com tradição desde 1985, especializada em desenvolvimento e urbanização, com foco em criar soluções sustentáveis, inovadoras e alinhadas às necessidades das cidades e de seus moradores.',
      'Ao longo de sua trajetória, a empresa atua no desenvolvimento de loteamentos residenciais, industriais, chácaras e bairros planejados, buscando transformar regiões e gerar qualidade de vida por meio de infraestrutura, mobilidade, saneamento e planejamento urbano.',
      'A GP tem como pilares transparência, qualidade, inovação, responsabilidade ambiental e desenvolvimento regional. Seu trabalho busca equilibrar crescimento urbano, preservação do meio ambiente e bem-estar social, mantendo uma visão de longo prazo.',
    ],
    // Nem todo destaque da GP é um número — "Desde 1985" e "Milhares" entram
    // como vieram, no lugar do valor. Forçá-los a virar algarismo mudaria o que
    // a empresa disse.
    numeros: [
      { valor: 'Desde 1985', rotulo: 'no mercado' },
      { valor: '19', rotulo: 'empreendimentos imobiliários' },
      { valor: '69 milhões', rotulo: 'de m² urbanizados' },
      { valor: 'Milhares', rotulo: 'de unidades residenciais e comerciais entregues' },
    ],
    paragrafosFinais: [
      'A empresa também possui forte atuação em ESG, com iniciativas ambientais, projetos sociais e práticas de governança. Entre seus projetos estão bairros planejados, sistemas de saneamento e abastecimento de água, melhorias viárias, mobilidade urbana e infraestrutura em diversas cidades.',
      'Em essência: a GP Desenvolvimento Urbano vai além da criação de loteamentos: desenvolve regiões, transforma espaços e contribui para construir cidades mais sustentáveis, conectadas e preparadas para o futuro.',
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
