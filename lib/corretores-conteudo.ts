/**
 * Foto e texto de cada corretor que o site mostra além do que o banco tem
 * (página /lotus-corretores e, para a foto, o captador na Área do Corretor).
 *
 * Mora em lib/, e não dentro de components/LotusCorretores, porque a Área do
 * Corretor lê a foto no servidor, e valor exportado de um módulo 'use client'
 * chega ao servidor como referência de cliente, não como dado — o mesmo motivo
 * de lib/blog-posts.ts. Movido em 05/10/2026, sem mudar o conteúdo.
 */
/**
 * Conteúdo REAL por corretor, enquanto o banco não tem onde guardá-lo.
 *
 * A view `portal_brokers` expõe só id/name/photo_url/creci/imoveis_ativos —
 * não há campo de bio. E `photo_url` vem nulo para quase todos. Estes overrides
 * preenchem essas lacunas SEM competir com o banco: quando o dashboard publicar
 * a foto real, `photo_url` passa a existir e vence o override (ver realToBroker em components/LotusCorretores.tsx).
 * Para migrar de vez, basta criar as colunas na view e apagar este bloco.
 *
 * Chave = nome em minúsculas, com acento. O id é UUID do Supabase e muda entre
 * ambientes, então não serve como chave estável em código.
 */
/**
 * Um bloco da bio. `string` é um parágrafo — é o caso da grande maioria, e por
 * isso continua sendo a forma mais curta de escrever. A variante em objeto
 * existe para currículos com seções (um subtítulo e, opcionalmente, uma lista);
 * sem ela, uma lista de competências viraria um parágrafo único ilegível.
 */
export type BlocoBio = string | { titulo: string; itens?: string[] };

const CONTEUDO_REAL: Record<string, { bio?: BlocoBio[]; foto?: string }> = {
  'mariana mamede': {
    foto: '/corretores/mariana-mamede.jpg',
    bio: [
      'Minha trajetória no mercado imobiliário traduz o melhor da minha bagagem profissional. Ao longo da minha atuação, aplico a escuta atenta, a responsabilidade e o cuidado em cada detalhe para oferecer uma consultoria de excelência e absoluta transparência.',
      'Compreendendo que cada negociação envolve um momento único de vida, seja uma conquista, uma reorganização patrimonial ou uma fase de transição ,, conduzo o processo com clareza e empatia em cada etapa.',
      'A constância desse trabalho focado no cliente se reflete em uma performance de destaque, reconhecida com premiações consecutivas nos últimos anos. Mais do que resultados, essas conquistas reafirmam meu compromisso de entregar segurança e clareza do primeiro contato à conclusão do negócio.',
    ],
  },
  'gabriele fávaro': {
    foto: '/corretores/gabriele-favaro.jpg',
    bio: [
      'Atuo no mercado imobiliário de alto padrão, assessorando clientes na compra, venda e intermediação de imóveis com uma abordagem estratégica, personalizada e pautada pela confiança.',
      'Acredito que um imóvel representa muito mais do que um patrimônio. Ele marca momentos importantes, acompanha novas fases da vida e materializa projetos que merecem ser conduzidos com segurança, sensibilidade e responsabilidade. Por isso, procuro compreender profundamente as necessidades e os objetivos de cada cliente, para que cada decisão seja tomada com tranquilidade e confiança.',
      'Além da minha atuação como corretora de imóveis, sou advogada, o que agrega uma visão jurídica e estratégica a todo o processo de negociação. Essa combinação me permite oferecer uma assessoria completa, unindo conhecimento técnico, segurança e atenção aos detalhes em cada etapa.',
      'Mais do que intermediar imóveis, meu propósito é construir relacionamentos sólidos e duradouros. Quero ser a profissional em quem meus clientes e suas famílias possam confiar hoje e nos próximos projetos de vida. É essa confiança, construída com ética, dedicação e transparência, que considero o maior patrimônio de uma carreira.',
    ],
  },
  // Sem acento em "Andre": a chave tem de bater com o nome como está no banco.
  'andre marcondes': {
    foto: '/corretores/andre-marcondes.jpg',
    bio: [
      'Coordenador de Equipes da Lotus Brokers, ANDRÉ atua há sete anos no mercado imobiliário de Jundiaí e região, após 20 anos na TOTVS, onde analisou processos e desenhou soluções de ERP para empresas de diversos portes. É formado em Comunicação e em Gestão de Negócios, foi professor universitário por cinco anos e possui formação complementar em negociação, pelo Program on Negotiation (PON), da Harvard Law School. Sua atuação vai além da apresentação do empreendimento: passa pela análise do contrato, pelo enquadramento de financiamento e pelo impacto real da compra no orçamento do cliente.',
      '"Meu trabalho não termina quando o cliente escolhe o imóvel. Ele começa quando a gente senta para entender o contrato e o que aquela decisão significa no orçamento dele."',
    ],
  },
  // No banco o nome tem dois espaços entre "Alex" e "Xavier"; normalizarNome
  // colapsa isso, então a chave fica com espaço simples.
  'alex xavier da silva': {
    foto: '/corretores/alex-xavier.jpg',
    bio: [
      'Corretor de Imóveis | Gestor Comercial | Especialista em Crédito Imobiliário | Consultor de Ativos Imobiliários',
      'Profissional com mais de 16 anos de experiência no mercado imobiliário, atuando de forma estratégica nas áreas de intermediação de imóveis, gestão comercial, financiamento habitacional, desenvolvimento de equipes, crédito imobiliário e ativos provenientes de leilões judiciais e extrajudiciais.',
      'Iniciei minha trajetória no mercado em 2010 como corretor de imóveis de terceiros, evoluindo posteriormente para cargos de liderança como gerente comercial, responsável pela gestão de equipes, desenvolvimento de estratégias de vendas, treinamento de profissionais e expansão comercial.',
      'Entre 2013 e 2021 fui proprietário de duas imobiliárias na Zona Sul de São Paulo, conduzindo todas as áreas do negócio, incluindo gestão administrativa, comercial, captação de imóveis, prospecção de clientes, negociação, marketing, contratação e desenvolvimento de equipes de vendas.',
      'Entre 2018 e 2023 atuei como correspondente bancário, trabalhando com operações de crédito imobiliário junto ao Bradesco, Itaú e Caixa Econômica Federal. Possuo certificações CCA 300 e FEBRABAN 300, com ampla experiência em análise de crédito, enquadramento financeiro, financiamento habitacional e estruturação de operações imobiliárias.',
      'Posteriormente, integrei a equipe comercial da construtora Plano & Plano, atuando como Gerente de Vendas no segmento Minha Casa Minha Vida, onde me especializei no programa habitacional em todas as suas faixas de atendimento.',
      'Minha atuação envolveu a gestão de equipes comerciais, recrutamento e seleção de corretores, onboarding de novos profissionais, treinamentos técnicos e comerciais, reciclagem de equipes, acompanhamento de indicadores de desempenho (KPIs), desenvolvimento de dashboards gerenciais, geração e gestão de leads, planejamento estratégico e suporte integral às operações de vendas.',
      'Atualmente atuo como corretor de imóveis autônomo e também presto consultoria especializada para uma empresa portuguesa voltada ao mercado de investimentos imobiliários, sendo responsável por todas as etapas do processo de aquisição de imóveis em leilão.',
      'Nesse trabalho realizo estudos completos de viabilidade econômica, análise documental e jurídica, levantamento de custos de aquisição, regularização e reforma, avaliação de riscos, estimativa de retorno sobre investimento (ROI), condução dos processos de desocupação e regularização dos imóveis, além do planejamento comercial e da venda final dos ativos.',
      'Minha experiência reúne uma visão completa do mercado imobiliário, contemplando desde a prospecção e comercialização de imóveis até operações estruturadas de investimento, crédito imobiliário, gestão de equipes e análise financeira, permitindo atuar tanto no segmento residencial quanto em operações de maior complexidade envolvendo ativos imobiliários.',
      {
        titulo: 'Principais competências',
        itens: [
          'Intermediação e comercialização de imóveis',
          'Especialista em Crédito Imobiliário',
          'Especialista no Programa Minha Casa Minha Vida',
          'Gestão e formação de equipes comerciais',
          'Liderança de alta performance',
          'Recrutamento, seleção e onboarding de corretores',
          'Desenvolvimento de treinamentos comerciais e técnicos',
          'Planejamento estratégico de vendas',
          'Gestão de indicadores (KPIs) e dashboards',
          'Marketing imobiliário e geração de leads',
          'Análise de crédito e financiamento habitacional',
          'Estudo de viabilidade econômica de investimentos imobiliários',
          'Avaliação de ativos provenientes de leilões',
          'Levantamento de custos, análise de riscos e retorno sobre investimento (ROI)',
          'Regularização e desocupação de imóveis',
          'Negociação, relacionamento com clientes e fechamento de operações',
        ],
      },
      { titulo: 'Perfil Profissional' },
      'Profissional com perfil estratégico, visão de negócios e forte orientação para resultados, combinando experiência em vendas, gestão comercial, crédito imobiliário e investimentos em ativos imobiliários. Possuo sólida capacidade de estruturar operações, desenvolver equipes de alta performance, identificar oportunidades de mercado e conduzir negociações complexas, sempre com foco na geração de valor para clientes, parceiros e empresas.',
    ],
  },
  'fernanda souza': {
    foto: '/corretores/fernanda-souza.jpg',
    bio: [
      'Muito prazer, eu sou Fernanda Emília. 💙',
      'Sou formada em Direito e Gestão Comercial e encontrei no mercado imobiliário a oportunidade de unir estratégia, relacionamento e propósito: ajudar pessoas e investidores a fazerem escolhas seguras e inteligentes.',
      '❤️ Sou mãe da Duda e da Sofia, minhas maiores inspirações. É na minha família e na minha fé em Deus que encontro a força para enfrentar desafios e celebrar cada conquista.',
      'No dia a dia, sou conhecida por ser uma pessoa calma, analítica e focada, características que me permitem conduzir cada negociação com segurança, transparência e atenção aos detalhes.',
      'Também sou apaixonada por criar soluções. Gosto de enxergar oportunidades onde muitos enxergam apenas dificuldades, sempre buscando o melhor caminho para cada cliente.',
      '✈️ Fora do trabalho, amo viajar, conhecer novas culturas e me aventurar na cozinha. Meu lado "MasterChef" aparece sempre que tenho uma boa receita e pessoas especiais para reunir.',
      'Mais do que vender imóveis, minha missão é acompanhar sonhos, construir confiança e ajudar famílias e investidores a conquistarem patrimônio com segurança e valorização.',
      'Se você procura alguém que caminhe ao seu lado em cada etapa da compra do seu imóvel, será um prazer fazer parte dessa conquista.',
      '📍 Jundiaí e região.',
    ],
  },
  // Sem acento em "Flavia": é como o nome está gravado no banco.
  'flavia ceolin': {
    foto: '/corretores/flavia-ceolin.jpg',
    bio: [
      'Sou Flávia Ceolin, tenho 36 anos e sou corretora de imóveis em Jundiaí. Após construir uma carreira sólida de 15 anos no setor corporativo, decidi seguir minha paixão pelo mercado imobiliário, me especializei em lançamentos e tenho como objetivo ajudar famílias a conquistarem o sonho da casa própria.',
      'Meu compromisso é tornar todo o processo de compra mais seguro e tranquilo, orientando desde a escolha do imóvel até a conquista das chaves, sempre com dedicação, ética e confiança.',
    ],
  },
  'fábio gonçalves': {
    // Recorte com fundo transparente (.webp, alpha preservado): aparece sobre
    // o gradiente verde do ImageSlot, diferente das demais fotos, que trazem
    // fundo próprio. Foi assim que a foto veio.
    foto: '/corretores/fabio-goncalves.webp',
    bio: [
      'Sou consultor imobiliário especializado em conectar pessoas às melhores oportunidades do mercado, oferecendo um atendimento consultivo, transparente e focado em resultados.',
      'Minha atuação é baseada no profundo estudo do mercado imobiliário, planejamento financeiro, análise comparativa de mercado (ACM), estratégias de negociação, financiamento imobiliário e valorização patrimonial, permitindo orientar meus clientes com segurança em cada etapa da compra, venda ou investimento.',
      'Tenho como principal área de atuação a cidade de Jundiaí, acompanhando de perto seus condomínios, lançamentos, tendências de valorização e oportunidades de investimento.',
      'Acredito que um bom consultor imobiliário vai muito além de apresentar imóveis. Meu compromisso é compreender os objetivos de cada cliente, identificar as melhores oportunidades e conduzir todo o processo com ética, transparência, agilidade e responsabilidade.',
    ],
  },
  // No banco o nome vem com espaço sobrando no fim; normalizarNome faz o trim.
  'reginaldo barbosa faleiros': {
    foto: '/corretores/reginaldo-faleiros.jpg',
  },
  'humberto martinez': {
    foto: '/corretores/humberto-martinez.jpg',
    bio: [
      'Sou Humberto Martinez, corretor de imóveis em Jundiaí – SP, especializado em lançamentos e empreendimentos de médio e alto padrão. Acredito que comprar um imóvel é uma das decisões mais importantes da vida e, por isso, meu compromisso é oferecer um atendimento consultivo, exclusivo e totalmente personalizado em cada etapa dessa jornada.',
      'Com profundo conhecimento do mercado imobiliário da região, atuo de forma estratégica para apresentar as melhores oportunidades, sempre alinhadas ao perfil, aos objetivos e ao estilo de vida de cada cliente. Mais do que intermediar negociações, meu propósito é proporcionar segurança, transparência e tranquilidade para que cada decisão seja tomada com confiança.',
      'Entendo que um imóvel representa muito mais do que um patrimônio. Ele traduz conquistas, sonhos, qualidade de vida e legado. Por isso, faço questão de construir relacionamentos sólidos, baseados na credibilidade, na proximidade e na atenção aos detalhes, oferecendo uma experiência diferenciada do primeiro contato à entrega das chaves.',
      'Meu trabalho é guiado pela excelência, pela ética e pelo compromisso em superar expectativas. Afinal, acredito que grandes negócios começam com confiança e são construídos por meio de um atendimento que valoriza cada cliente de forma única.',
    ],
  },
  // Ainda não existe no Supabase: entra pela lista EXTRAS de lib/brokers.ts.
  'lara matos': {
    foto: '/corretores/lara-matos.jpg',
    bio: [
      'Meu nome é Lara, tenho 31 anos, sou formada em Matemática e, por mais de dez anos, atuei como gerente na área financeira. Sou natural de Goiânia (GO), morei oito anos no Tocantins e hoje vivo em Jundiaí (SP).',
      'Escolhi a profissão de corretora de imóveis porque acredito que um imóvel representa muito mais do que um investimento: é o lugar onde sonhos, histórias e famílias ganham um lar. Meu propósito é ajudar cada cliente a encontrar esse lugar especial, seja na conquista do primeiro imóvel ou na construção do seu patrimônio, sempre com dedicação, transparência e cuidado.',
    ],
  },
  // No banco o nome tem dois espaços entre "Marcos" e "Lafratta"; normalizarNome
  // colapsa isso, então a chave fica com espaço simples.
  'marcos lafratta': {
    foto: '/corretores/marcos-lafratta.webp',
    bio: [
      'Minha trajetória profissional sempre esteve ligada a negócios, relacionamento e análise, e encontrei no mercado imobiliário a oportunidade de reunir essas experiências para ajudar pessoas a tomarem decisões mais seguras na compra, venda e investimento em imóveis.',
      'Como Corretor de Imóveis, atuo em Jundiaí e região, com atenção especial a lançamentos imobiliários e oportunidades nos segmentos residencial, corporativo e industrial.',
      'Meu jeito de trabalhar começa por entender o que cada cliente realmente procura. Em vez de simplesmente apresentar imóveis, busco compreender objetivos, momento de vida, localização, orçamento e expectativas para então selecionar oportunidades que façam sentido. Tudo com transparência, informação de mercado e acompanhamento durante cada etapa da negociação.',
      'Acredito que um bom atendimento imobiliário não deve ser baseado em pressão, mas em confiança e informação. Seja para encontrar um novo imóvel, investir ou vender uma propriedade, meu objetivo é tornar a decisão mais clara, organizada e segura.',
      'Se você está procurando uma oportunidade em Jundiaí e região, fale comigo. Vamos conversar sobre o que você busca e encontrar juntos o imóvel que faça sentido para o seu momento.',
    ],
  },
  'gisele alves': {
    foto: '/corretores/gisele-alves.webp',
    bio: [
      'Sou formada em Administração de Empresas, tenho conhecimentos em logística e construí minha experiência profissional na área de vendas, desenvolvendo ao longo dessa trajetória habilidades de organização, relacionamento e visão comercial.',
      'Há mais de um ano, faço parte do mercado imobiliário, área na qual encontrei uma oportunidade de unir minha experiência com vendas ao contato próximo com pessoas e à realização de projetos importantes.',
      'Minha formação em Administração e minha experiência comercial contribuem para que eu tenha uma atuação organizada, atenta e comprometida, buscando entender as necessidades de cada cliente e oferecer um atendimento personalizado.',
      'Além da minha vida profissional, tenho dois papéis que tornam minha história ainda mais especial: sou mãe de duas filhas e avó de uma menina. A família é uma parte essencial da minha vida e também um dos valores que levo para a forma como me relaciono com as pessoas.',
      'Hoje, no mercado imobiliário, meu propósito é construir relações de confiança e acompanhar meus clientes com dedicação em cada etapa, ajudando a transformar planos em novas conquistas.',
    ],
  },
  // No banco o nome tem dois espaços entre "Alexandra" e "Niero"; normalizarNome
  // colapsa isso, então a chave fica com espaço simples.
  'alexandra niero': {
    foto: '/corretores/alexandra-niero.webp',
    bio: [
      'Sou Alexandra Niero, corretora de imóveis, e encontrei no mercado imobiliário uma profissão que reúne tudo aquilo em que acredito: relacionamento, estratégia, confiança e realização.',
      'Sou também advogada, mãe e bailarina — experiências que moldaram a profissional que sou hoje. Da advocacia, trago a segurança nas negociações e o olhar atento aos detalhes. Da maternidade, o cuidado e a sensibilidade. Do ballet, a disciplina, a constância e a determinação.',
      'Como corretora, meu propósito é oferecer muito mais do que a intermediação de uma compra ou venda. Quero que cada cliente se sinta seguro, bem orientado e verdadeiramente representado em uma das decisões mais importantes da vida.',
      'Acredito em um atendimento próximo, transparente e estratégico, construído com confiança e compromisso do início ao fim.',
      'Hoje, na Lotus, inicio um novo ciclo com ainda mais propósito e a certeza de que imóveis conectam muito mais do que pessoas e lugares: conectam histórias, planos e novos começos. 🪷',
    ],
  },
  // Ainda não existe no Supabase: entra pela lista EXTRAS de lib/brokers.ts.
  'samir augusto': {
    foto: '/corretores/samir-augusto.jpg',
    bio: [
      'Sou Samir Augusto, profissional com sólida experiência na área comercial, apaixonado por relacionamento com pessoas e por transformar objetivos em conquistas. Acredito que confiança, transparência e dedicação são essenciais para oferecer um atendimento de excelência. Meu compromisso é ajudar cada cliente a encontrar o imóvel ideal com segurança e tranquilidade.',
    ],
  },
  // No banco o nome tem dois espaços entre "Danilo" e "Gardim"; normalizarNome
  // colapsa isso, então a chave fica com espaço simples. Foto e texto enviados
  // pela Lotus em 05/10/2026; a foto veio mais larga que alta e foi recortada
  // em 4:5, centrada no rosto, como as demais.
  'danilo gardim': {
    foto: '/corretores/danilo-gardim.webp',
    bio: [
      'Atuando em Jundiaí e região com foco em vendas, captação de imóveis e atendimento exclusivo.',
      'Minha trajetória profissional inclui mais de 10 anos como empreendedor e gestor de negócios, com experiência em relacionamento com clientes, negociações e desenvolvimento comercial.',
      'No mercado imobiliário, busco oferecer um atendimento próximo e transparente, entendendo as necessidades de cada cliente e acompanhando todo o processo, desde a captação e apresentação do imóvel até a negociação e conclusão da venda.',
      'Trazendo experiência à estrutura e ao trabalho da equipe para proporcionar um atendimento personalizado a proprietários e compradores, conduzindo cada negociação com ética, profissionalismo, transparência e dedicação.',
    ],
  },
};

/**
 * "Gabriele Fávaro" -> "gabriele fávaro".
 *
 * `normalize('NFC')` é o que importa aqui: o mesmo "á" pode chegar do banco
 * como um caractere único ou como "a" + acento combinante, e sem normalizar as
 * duas formas não batem na comparação. Acento é preservado de propósito —
 * assim a chave do mapa é o nome legível, sem regex de diacrítico.
 */
export function normalizarNome(nome: string): string {
  return nome.normalize('NFC').toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Foto e bio do corretor pelo nome, como está no banco; undefined se não houver. */
export function conteudoRealDe(nome: string): { bio?: BlocoBio[]; foto?: string } | undefined {
  return CONTEUDO_REAL[normalizarNome(nome)];
}
