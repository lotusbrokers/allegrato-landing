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
  /**
   * Nome da construtora, só para as que ainda não vêm do banco.
   *
   * Quem tem lançamento na view traz o nome de lá; quem não tem precisa
   * declarar aqui, senão não há o que escrever no título da página. Use o slug
   * do nome que está no dashboard: quando a view passar a expor os lançamentos,
   * os dois se encontram e nada muda de lugar.
   */
  nome?: string;
  /** Caminho em public/. A imagem precisa existir lá. */
  logo?: string;
  /**
   * Versão clara do logo, para o hero, que tem fundo escuro.
   *
   * Só é necessária quando `logo` é colorido: um wordmark escuro sobre o navy
   * do hero fica ilegível. Quando o próprio `logo` já é negativo
   * (logoEmFundoEscuro), ele serve nos dois lugares e este campo fica de fora.
   */
  logoNegativo?: string;
  /**
   * Imagem de fundo do hero, escolhida pela Lotus.
   *
   * Sem ela o hero empresta a capa de um empreendimento — que é imagem real,
   * mas nem sempre a que a construtora usaria para se apresentar.
   */
  banner?: string;
  /**
   * O logo é negativo (arte clara, feita para fundo escuro)?
   *
   * A seção "Sobre" tem fundo claro, onde um logo branco simplesmente some. Com
   * isto ele ganha uma placa escura atrás — o mesmo tratamento que o material
   * impresso da marca usa, e não um remendo. Inverter as cores não serve:
   * mudaria a marca.
   */
  logoEmFundoEscuro?: boolean;
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
    logoNegativo: '/construtoras/santa-angela-negativo.png',
    banner: '/construtoras/banners/santa-angela.jpg',
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

  // Texto e logo enviados pela Lotus em 08/09/2026. O arquivo é a versão
  // negativa da marca (wordmark e slogan em branco), daí a placa escura.
  'f-a-oliva': {
    logo: '/construtoras/f-a-oliva.png',
    logoEmFundoEscuro: true,
    paragrafos: [
      'A F. A. Oliva possui uma trajetória de mais de 70 anos no mercado imobiliário, iniciada em 1955, quando o engenheiro civil e empresário Francisco de Assis Oliva lançou o loteamento Jardim Ana Maria, em Jundiaí, hoje um dos bairros tradicionais da cidade.',
      'Ao longo de sua história, a empresa participou ativamente do desenvolvimento urbano de Jundiaí, destacando-se por projetos inovadores para cada época, como a venda de terrenos com projetos de casas na Vila Bela, a criação do bairro de alto padrão Malota e o desenvolvimento do Centro Comercial Beco Fino.',
      'A empresa tem como essência o respeito às pessoas, tanto clientes quanto colaboradores e parceiros, mantendo como pilares a qualidade, transparência, compromisso com prazos, empatia e credibilidade.',
      'Seu propósito é construir com excelência, atender com respeito e desenvolver pessoas, buscando gerar valor e bem-estar de forma sustentável para clientes, colaboradores, parceiros e comunidades.',
    ],
    numeros: [
      { valor: '+71 anos', rotulo: 'de história' },
      { valor: '+9,5 mil', rotulo: 'unidades residenciais' },
      { valor: '6 cidades', rotulo: 'Jundiaí e outras cinco da região' },
      { valor: '+3,5 milhões', rotulo: 'de m² construídos' },
    ],
    paragrafosFinais: [
      'Em essência: a F. A. Oliva representa tradição, credibilidade e desenvolvimento urbano, combinando décadas de experiência com uma cultura baseada em pessoas, qualidade, respeito e crescimento sustentável.',
    ],
  },

  // Texto e logo enviados pela Lotus em 08/09/2026. Ainda sem lançamento na
  // view portal_lancamentos, então o nome vem daqui — grafado como está no
  // dashboard, para o banco assumir sem trocar nada quando a view expuser.
  emccamp: {
    nome: 'Emccamp',
    logo: '/construtoras/emccamp.png',
    paragrafos: [
      'A Emccamp Residencial é uma incorporadora e construtora de origem familiar, fundada em 1977, com sede em Belo Horizonte (MG). A empresa atua principalmente no mercado residencial, desenvolvendo apartamentos, pequenas áreas comerciais e loteamentos, com presença concentrada nos estados de Minas Gerais, Rio de Janeiro e São Paulo.',
      'A empresa tem como diferenciais a inovação, tecnologia, padronização e gestão eficiente, utilizando métodos construtivos modernos que permitem maior agilidade nas obras, redução de resíduos e controle de qualidade.',
      'Outro ponto forte é o relacionamento próximo e transparente com os clientes. A Emccamp oferece atendimento digital, tours virtuais, assinatura eletrônica e acompanhamento da evolução das obras, além de contar com uma estrutura de pós-venda voltada à qualidade e satisfação dos moradores.',
      'Sua atuação é baseada em respeito, valorização das pessoas, compromisso com resultados, ética e transparência, sempre considerando também a responsabilidade social e ambiental.',
    ],
    lista: {
      titulo: 'Principais pilares',
      itens: [
        'Inovação e tecnologia',
        'Qualidade e cumprimento de prazos',
        'Transparência e relacionamento com clientes',
        'Gestão eficiente e padronização',
        'Responsabilidade ambiental e social',
        'Segurança e bem-estar dos colaboradores',
      ],
    },
    paragrafosFinais: [
      'Em essência: a Emccamp combina quase cinco décadas de experiência, tecnologia e gestão profissional para desenvolver empreendimentos com qualidade, eficiência e foco nas necessidades de seus clientes.',
    ],
  },

  // Texto enviado pela Lotus em 08/09/2026. SEM LOGO de propósito: o arquivo
  // recebido traz o wordmark em branco sobre uma placa branca opaca, que
  // apareceria como um retângulo recortado em qualquer fundo. Assim que vier
  // um arquivo com a marca em cor sólida e fundo transparente, declarar aqui.
  diretiva: {
    nome: 'Diretiva',
    paragrafos: [
      'A Diretiva Engenharia e Construções possui mais de 40 anos de história e iniciou sua trajetória em Jundiaí, atuando no setor da construção civil. Ao longo dos anos, ampliou sua atuação para incorporação e construção de condomínios residenciais, obras comerciais e loteamentos residenciais, comerciais e industriais.',
      'A empresa tem como missão realizar os sonhos de seus clientes por meio de construções com qualidade, produtividade e durabilidade, mantendo compromisso com a sociedade e o meio ambiente.',
      'Seus principais valores são união, comprometimento e credibilidade, apoiados em pilares como respeito aos clientes, valorização dos colaboradores, gestão da qualidade, foco no negócio e melhoria contínua.',
      'Um dos grandes diferenciais da Diretiva é seu forte Sistema de Gestão da Qualidade. A empresa foi pioneira em Jundiaí ao conquistar a certificação ISO 9001 em 2004 e também mantém a certificação PBQP-H nível A, demonstrando seu compromisso com padrões rigorosos de qualidade, processos e segurança.',
      'Com uma equipe técnica qualificada, fornecedores parceiros e preocupação socioambiental, a Diretiva consolidou-se como uma referência no setor da construção civil no interior paulista, entregando empreendimentos que vão desde projetos de alto padrão até unidades de interesse popular.',
    ],
    paragrafosFinais: [
      'Em essência: a Diretiva Engenharia combina mais de quatro décadas de experiência, qualidade certificada e compromisso com seus clientes, transformando sonhos em empreendimentos duráveis e construindo uma história baseada em confiança, excelência e credibilidade.',
    ],
  },

  // Texto e logo enviados pela Lotus em 08/09/2026. No dashboard está como
  // "GRUPO ZARIN", que é o que forma o slug; o nome exibido usa a grafia normal.
  // O slug vem de "GRUPO ZARIN", como está no dashboard; o nome exibido é
  // 'Zarin', que é como a própria empresa se trata no texto — e faz a
  // concordância funcionar ("Sobre a Zarin", não "Sobre a Grupo Zarin").
  'grupo-zarin': {
    nome: 'Zarin',
    logo: '/construtoras/grupo-zarin.png',
    paragrafos: [
      'A Zarin é uma empresa do setor imobiliário com mais de 25 anos de experiência, que tem como conceito central a solidez. Seu propósito vai além da construção de imóveis: busca criar empreendimentos que contribuam para a realização de sonhos, qualidade de vida e construção de futuros sustentáveis.',
      'Com mais de 520 mil m² construídos e 20 mil unidades entregues, a empresa combina qualidade, segurança, inovação e responsabilidade em seus projetos, buscando desenvolver comunidades e contribuir para o crescimento urbano de forma consciente.',
      'A inovação também é um dos principais pilares da Zarin. A empresa utiliza tecnologia para criar ambientes mais eficientes, seguros e confortáveis, com soluções como Smart Homes e Smart Cities, sempre com foco em benefícios reais para moradores e comunidades.',
    ],
    numeros: [
      { valor: '+25 anos', rotulo: 'de experiência' },
      { valor: '+20 mil', rotulo: 'unidades entregues' },
      { valor: '+520 mil', rotulo: 'm² construídos' },
      { valor: '+3 milhões', rotulo: 'de m² loteados' },
    ],
    paragrafosFinais: [
      'Em essência: a Zarin une solidez, experiência e inovação para desenvolver empreendimentos que não apenas constroem imóveis, mas ajudam a construir comunidades, melhorar a vida das pessoas e criar futuros sustentáveis.',
    ],
  },

  // Texto e logo enviados pela Lotus em 08/09/2026. O arquivo é a versão
  // negativa (marca em branco e dourado), daí a placa escura.
  'manduca-empreendimentos': {
    logo: '/construtoras/manduca-empreendimentos.png',
    logoEmFundoEscuro: true,
    paragrafos: [
      'Com uma trajetória sólida e de sucesso, a Manduca Empreendimentos é reconhecida por sua excelência em projetos inovadores e pela busca incessante pela satisfação de seus clientes. Desde 2011, contribuem para o desenvolvimento urbano e o crescimento sustentável, sempre primando pela qualidade, transparência e compromisso em cada empreendimento.',
      'Com uma equipe comprometida em transformar sonhos em realidade, combina experiência e criatividade para oferecer projetos que superam expectativas e se destacam pelo estilo e conforto.',
      'Sempre atenta às tendências do mercado, buscando inovar com projetos modernos e alinhados com as necessidades contemporâneas, bem como o respeito com o meio ambiente e práticas sustentáveis, buscando minimizar o impacto no planeta e para um futuro mais verde e sustentável.',
      'Conheça nossa história e entenda por que somos uma escolha confiável quando se trata de encontrar o lar perfeito para você e sua família.',
    ],
    numeros: [
      { valor: '15', rotulo: 'anos de experiência' },
      { valor: '160.000', rotulo: 'm² em negócios realizados' },
      { valor: '5', rotulo: 'empreendimentos realizados' },
    ],
    lista: {
      titulo: 'Diferenciais dos nossos projetos',
      itens: [
        'Inovação e Qualidade — compromisso com o desenvolvimento de projetos inovadores e de alta qualidade para garantir o bem-estar dos clientes.',
        'Experiência no Mercado — equipe com vasta experiência no mercado imobiliário da região, garantindo conhecimento especializado e confiança aos clientes.',
        'Localização Estratégica — escolha de locais privilegiados, com fácil acesso a serviços e comodidades.',
        'Infraestrutura Completa — foco na criação de empreendimentos com infraestrutura completa, que inclui áreas de lazer, espaços verdes, segurança e conveniência para os moradores.',
        'Aprovação Legal — empreendimentos aprovados junto aos órgãos municipais, garantindo segurança jurídica e tranquilidade para os clientes.',
        'Compromisso com o Meio Ambiente — adoção de práticas sustentáveis em todos os projetos, visando à preservação do meio ambiente e ao uso eficiente dos recursos naturais.',
        'Atendimento Personalizado — foco no atendimento personalizado e na satisfação dos clientes, buscando entender suas necessidades e oferecer soluções sob medida.',
      ],
    },
  },

  // Texto e logo enviados pela Lotus em 08/09/2026.
  rem: {
    logo: '/construtoras/rem.png',
    paragrafos: [
      'A REM Construtora atua no mercado imobiliário desde 1990, tendo como principal fundamento a confiança nas relações. Ao longo de sua trajetória, desenvolveu empreendimentos residenciais e comerciais, além de projetos como agências bancárias e galpões.',
      'Com origem familiar, a empresa foi fundada por Renato Mauro e, posteriormente, passou a contar com a participação de outras gerações da família. Sua atuação combina tradição e inovação, buscando entregar qualidade, pontualidade e resultados consistentes.',
      'A REM tem como pilares transparência, comprometimento, ética, qualidade e respeito às pessoas, mantendo também preocupação com o meio ambiente, a segurança e a satisfação dos clientes.',
      'Seu objetivo é identificar boas oportunidades e localizações, desenvolver projetos diferenciados e inovadores e aprimorar continuamente seus processos, buscando gerar valor tanto para clientes quanto para investidores.',
    ],
    numeros: [
      { valor: '35 anos', rotulo: 'de dedicação e comprometimento' },
      { valor: '630 mil', rotulo: 'm² construídos ou em construção' },
      { valor: '56', rotulo: 'empreendimentos' },
    ],
    paragrafosFinais: [
      'Em essência: a REM Construtora combina tradição, confiança e inovação, desenvolvendo empreendimentos com foco em qualidade, pontualidade, rentabilidade e melhoria da vida de seus clientes.',
    ],
  },

  // Texto e logo enviados pela Lotus em 08/09/2026. Sem bloco de números: os
  // dela vêm dentro do texto corrido, e recortá-los para virar destaque seria
  // escolher por ela quais números merecem a vitrine.
  'sebel-empreendimentos': {
    logo: '/construtoras/sebel-empreendimentos.png',
    paragrafos: [
      'A Sebel Empreendimentos é uma incorporadora e construtora com mais de 40 anos de atuação no mercado imobiliário, reunindo experiência, solidez e excelência na execução de empreendimentos residenciais, comerciais e obras públicas.',
      'Desde 1980, a empresa construiu uma trajetória marcada pela versatilidade e capacidade técnica, atuando desde projetos residenciais de alto padrão até grandes conjuntos habitacionais. Ao longo de sua história, já são mais de 100 mil m² de obras realizadas e aproximadamente 1.500 unidades habitacionais, sempre com atenção à qualidade construtiva, planejamento e aos detalhes de cada projeto.',
      'À frente da empresa está o engenheiro João Carlos Custódio, profissional com mais de 50 anos de experiência no setor da construção civil. Sua trajetória reúne participação em projetos que ultrapassam 500 mil m² de área construída e mais de 10 mil unidades habitacionais, além de obras comerciais, escolas, retrofit, restauro, infraestrutura urbana e manutenção rodoviária.',
      'A Sebel também mantém seu compromisso com a qualidade, responsabilidade social, respeito aos colaboradores e cuidado com o meio ambiente, princípios reconhecidos por sua certificação no Programa Brasileiro da Qualidade e Produtividade do Habitat (PBQP-H).',
    ],
    paragrafosFinais: [
      'Em constante expansão, a empresa possui mais de 1.500 unidades habitacionais em processo de aprovação na cidade de São Paulo, além de um complexo comercial com mais de 7 mil m². Em Jundiaí, a Sebel reforça sua confiança no desenvolvimento da região com projetos já aprovados e empreendimentos em execução.',
      'Com presença em São Paulo e escritório em Jundiaí, a Sebel Empreendimentos transforma experiência em projetos sólidos, bem planejados e preparados para gerar valor ao longo do tempo.',
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

/**
 * Construtoras que têm conteúdo mas ainda não têm lançamento na view.
 *
 * A view portal_lancamentos expõe um subconjunto do que o dashboard cadastra, e
 * algumas construtoras não chegam nela — em 08/09/2026 eram Diretiva, Emccamp,
 * Grupo Zarin e VIC Engenharia. Sem isto elas não teriam página nenhuma, mesmo
 * com texto e logo prontos.
 *
 * Com isto a página existe com a parte institucional, e a seção de lançamentos
 * aparece sozinha quando a view passar a expô-los. Corrigir a view continua
 * sendo o certo; isto evita que o conteúdo fique esperando por ela.
 *
 * Só entra quem declarou `nome` — sem ele não há o que escrever no título.
 */
export function curadasSemLancamento(): { slug: string; nome: string }[] {
  return Object.entries(CONTEUDO)
    .filter(([, c]) => c.nome)
    .map(([slug, c]) => ({ slug, nome: c.nome as string }));
}
