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
  /**
   * O logo nas cores da marca. Caminho em public/, e o arquivo precisa existir.
   *
   * Não é o que a página mostra — é o que ela declara no JSON-LD, onde o
   * buscador espera a marca de verdade, não uma versão de uso. Quem aparece na
   * tela é `logoNegativo`.
   */
  logo?: string;
  /**
   * Versão clara do logo — a que a página mostra.
   *
   * O hero é verde-escuro e o logo fica direto sobre ele, sem placa: só arte
   * clara se destaca ali. Marca de cor única vira negativa mantendo o alfa e
   * pintando o traço de branco; o recorte continua desenhando a forma.
   *
   * Sem este campo (nem logoEmFundoEscuro), a página mostra o nome escrito em
   * vez do logo — melhor do que uma marca escura sumindo no fundo escuro.
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
   * A marca é empilhada (símbolo em cima, nome embaixo)?
   *
   * A caixa do logo é larga e baixa, feita para marcas horizontais. Uma marca
   * empilhada dentro dela sai com uns 60px de largura e o nome fica ilegível.
   * Com isto ela ganha uma caixa alta e estreita — ver CAIXA_HERO_EMPILHADA em
   * app/construtoras/[slug]/page.tsx.
   */
  logoVertical?: boolean;
  /**
   * O logo é negativo (arte clara, feita para fundo escuro)?
   *
   * O hero é verde-escuro, e a marca colorida só se destaca dele sobre uma
   * placa clara. A negativa dispensa a placa: é para fundo escuro que ela foi
   * desenhada, e ali ela fica melhor sem moldura nenhuma.
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
    logoNegativo: '/construtoras/mac-lucer-negativo.png',
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
    logoNegativo: '/construtoras/auten-negativo.png',
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
    logoNegativo: '/construtoras/inkkorp-negativo.png',
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
    logoNegativo: '/construtoras/gp-desenvolvimento-urbano-negativo.png',
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
  //
  // A chave é "fa-oliva", sem separar as iniciais, porque é assim que o slug
  // sai do nome cadastrado no dash ("FA Oliva"). Escrita como "f-a-oliva" ela
  // não encontrava página nenhuma, e a seção sumia sem erro — o motivo de
  // conteudoDaConstrutora hoje ignorar os hifens ao procurar.
  'fa-oliva': {
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
    logoNegativo: '/construtoras/emccamp-negativo.png',
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

  // Texto enviado pela Lotus em 08/09/2026; logo em 08/09/2026, no segundo
  // arquivo — o primeiro trazia o wordmark branco sobre placa branca opaca.
  //
  // ATENÇÃO: o arquivo recebido é uma RECRIAÇÃO da marca, não o original da
  // Diretiva. Proporção, tom de azul e tipografia são aproximados. Vale como
  // provisório; o arquivo oficial da construtora substitui sem mexer em código.
  //
  // O wordmark é branco e o símbolo é azul: os dois só convivem sobre fundo
  // escuro, daí logoEmFundoEscuro — que aqui significa "vai direto no hero,
  // sem placa clara", e não o contrário.
  diretiva: {
    nome: 'Diretiva',
    logo: '/construtoras/diretiva.png',
    logoEmFundoEscuro: true,
    logoVertical: true,
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
    logoNegativo: '/construtoras/grupo-zarin-negativo.png',
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
    logoNegativo: '/construtoras/rem-negativo.png',
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
    logoNegativo: '/construtoras/sebel-empreendimentos-negativo.png',
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

  // Texto e logo enviados pela Lotus em 08/09/2026. O arquivo veio em JPEG com
  // fundo branco; ele foi vazado por preenchimento a partir das bordas, e não
  // por "todo branco vira transparente" — o "t" do símbolo também é branco e
  // sumiria junto. Como ele encosta na borda do círculo, virou recorte, que é
  // como essa marca é desenhada: adota a cor de quem está atrás.
  tebas: {
    logo: '/construtoras/tebas.png',
    logoNegativo: '/construtoras/tebas-negativo.png',
    paragrafos: [
      'A TEBAS é uma incorporadora com 45 anos de história, reconhecida pela tradição, credibilidade e excelência no desenvolvimento de empreendimentos imobiliários de alto padrão.',
      'Atualmente liderada pelos sócios José Roberto e Mauro, a empresa reúne experiência e competência consolidadas ao longo de dezenas de empreendimentos entregues, sempre com atenção à qualidade, elegância e às necessidades reais de seus clientes.',
      'Sua atuação parte de uma leitura cuidadosa do mercado, das transformações urbanas e das novas formas de morar e investir. Essa inteligência permite desenvolver projetos alinhados ao estilo de vida contemporâneo, ao potencial de cada localização e às expectativas de valorização ao longo do tempo.',
      'Com forte presença em Jundiaí, a TEBAS se consolidou como referência no segmento de alto padrão, contribuindo para a evolução urbana da cidade por meio de empreendimentos que qualificam o entorno, elevam o padrão construtivo e proporcionam mais qualidade de vida.',
    ],
    paragrafosFinais: [
      'Mais do que construir imóveis, a TEBAS constrói relações de confiança, segurança e longo prazo. Um legado desenvolvido ao longo de décadas e que continua evoluindo a partir do mesmo compromisso com qualidade, solidez e visão de futuro.',
    ],
  },

  // Texto e logo enviados pela Lotus em 08/09/2026. Ainda sem lançamento na
  // view portal_lancamentos — o dashboard tem quatro, que não chegam nela.
  'vic-engenharia': {
    nome: 'VIC Engenharia',
    logo: '/construtoras/vic-engenharia.png',
    logoNegativo: '/construtoras/vic-engenharia-negativo.png',
    paragrafos: [
      'A VIC Engenharia é uma incorporadora e construtora que atua no desenvolvimento de empreendimentos planejados para proporcionar mais qualidade de vida, segurança e acessibilidade aos seus clientes.',
      'Formada pela união de profissionais experientes dos mercados de incorporação imobiliária e construção civil, a empresa combina conhecimento técnico, eficiência e visão de mercado para entregar empreendimentos com qualidade construtiva e condições acessíveis, mantendo o compromisso com a satisfação de clientes, parceiros, investidores e colaboradores.',
      'Sua trajetória é respaldada por importantes certificações do setor, como o Certificado NDT CAIXA, destinado a construtoras que apresentam elevado nível de desempenho técnico e boas práticas na execução de suas obras, além das certificações Casa + Azul CAIXA e Nível A, que reforçam seu compromisso com sustentabilidade, responsabilidade social, governança e gestão da qualidade.',
      'A dimensão de sua atuação também posiciona a VIC entre as principais empresas do mercado imobiliário brasileiro. A companhia figura entre as 20 maiores construtoras do país, segundo ranking da revista O Empreiteiro, além de ocupar posição de destaque dentro do seu segmento.',
    ],
    paragrafosFinais: [
      'Com mais de 19 mil unidades entregues ou em construção e mais de 43 mil pessoas vivendo em empreendimentos VIC, a empresa mantém presença em cinco estados e no Distrito Federal, ampliando continuamente sua atuação pelo Brasil.',
      'Mais do que construir imóveis, a VIC Engenharia busca criar oportunidades para que milhares de famílias realizem o sonho da casa própria, unindo escala, responsabilidade, qualidade e evolução constante em cada novo empreendimento.',
    ],
  },

  // Texto e logo enviados pela Lotus em 08/09/2026. A marca é empilhada, daí o
  // logoVertical. Sem bloco de números: os dela vêm no meio do texto, e escolher
  // quais virariam destaque seria escolher por ela.
  'vvc-construtora': {
    logo: '/construtoras/vvc-construtora.png',
    logoNegativo: '/construtoras/vvc-construtora-negativo.png',
    logoVertical: true,
    paragrafos: [
      'A VVC atua desde 2002 no setor da construção civil, reunindo experiência no desenvolvimento, construção e incorporação de empreendimentos residenciais, comerciais e industriais.',
      'Ao longo de sua trajetória, a empresa consolidou sua atuação a partir de pilares como qualidade construtiva, excelência na execução e compromisso com o cumprimento de prazos, buscando garantir segurança e eficiência em todas as etapas de seus projetos.',
      'Com forte experiência na construção de condomínios residenciais verticais e horizontais, a VVC mantém processos orientados por elevados padrões de qualidade e melhoria contínua.',
      'Esse compromisso é reforçado por importantes certificações, como o PBQP-H em seu nível máximo e a ISO 9001, reconhecimentos que atestam a conformidade de seus processos, a gestão da qualidade e a busca constante pela satisfação de seus clientes.',
    ],
    paragrafosFinais: [
      'Com mais de duas décadas de atuação, a VVC combina experiência técnica, responsabilidade e organização construtiva para desenvolver empreendimentos sólidos e entregar projetos com qualidade e confiabilidade.',
    ],
  },

  // Texto e logo enviados pela Lotus em 08/09/2026. O arquivo é a versão
  // negativa (marca branca), daí a placa escura no "Sobre" — e, por ser clara,
  // ela também serve no hero. Só que veio pequeno, 189x39. A caixa do logo é um
  // máximo, não um alvo, então ele sai nítido, no tamanho de origem — e menor
  // que as outras marcas, que preenchem os 320. Um arquivo maior o faz preencher
  // a caixa sem mexer em código.
  applausi: {
    logo: '/construtoras/applausi.png',
    logoEmFundoEscuro: true,
    paragrafos: [
      'A Applausi Empreendimentos nasceu em Jundiaí a partir da experiência de uma família tradicional do setor imobiliário, trazendo uma nova proposta para o desenvolvimento de empreendimentos urbanísticos: unir qualidade, arquitetura, planejamento e atenção aos detalhes para criar projetos capazes de proporcionar uma experiência de vida extraordinária.',
      'Com o conceito “A Arte de Viver Bem”, a empresa desenvolve empreendimentos pensados para pessoas que valorizam qualidade de vida, bem-estar e espaços cuidadosamente planejados. Cada projeto é concebido com um olhar atento ao entorno, à funcionalidade e à forma como as pessoas se relacionam com a cidade.',
      'À frente da Applausi está o arquiteto e urbanista Rafael Benassi, formado pela USP e pós-graduado em Desenho Ambiental e Arquitetura da Paisagem pela Universidade Presbiteriana Mackenzie. Sua trajetória inclui mais de uma década de experiência no desenvolvimento e gerenciamento de condomínios, loteamentos e bairros planejados, além da participação em projetos urbanos de grande escala.',
      'Essa experiência se traduz em uma atuação orientada por planejamento urbano, sustentabilidade, eficiência e valorização dos espaços, buscando desenvolver empreendimentos que contribuam não apenas para a qualidade de vida de seus moradores, mas também para a evolução das regiões onde estão inseridos.',
    ],
    paragrafosFinais: [
      'Com seriedade, compromisso com prazos e qualidade, respeito às pessoas e ao meio ambiente, a Applausi transforma desenvolvimento urbano em projetos pensados para viver melhor — com propósito, cuidado e excelência em cada detalhe.',
    ],
  },
};

/**
 * Índice auxiliar, sem hifens: "f-a-oliva" e "fa-oliva" caem na mesma entrada.
 *
 * O slug da página nasce do campo `construtora` do lançamento, que é texto
 * livre — "FA Oliva" e "F. A. Oliva" são a mesma empresa e geram slugs
 * diferentes. Sem isto, uma correção de grafia no dash apaga a seção "Sobre"
 * em silêncio: nada quebra, a página só passa a não ter conteúdo. Já aconteceu
 * uma vez, com a própria FA Oliva.
 *
 * É a mesma ideia do `chave()` de lib/construtoras.ts, que ignora espaços ao
 * comparar nomes de construtora.
 */
const POR_CHAVE_FROUXA: Record<string, ConteudoConstrutora> = Object.fromEntries(
  Object.entries(CONTEUDO).map(([slug, c]) => [slug.replaceAll('-', ''), c])
);

/** O conteúdo institucional desta construtora, ou null se ainda não houver. */
export function conteudoDaConstrutora(slug: string): ConteudoConstrutora | null {
  return CONTEUDO[slug] ?? POR_CHAVE_FROUXA[slug.replaceAll('-', '')] ?? null;
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
