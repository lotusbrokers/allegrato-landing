/**
 * Conteúdo do FAQ público (/lotus-faq).
 *
 * Fonte: "8k. FAQ Lotus Brokers (público).md", v5 de 04/09/2026 — 47 perguntas
 * em 9 seções. Substitui as 50 perguntas anteriores, das quais 6 eram de
 * locação e saíram por decisão da Lotus (a empresa não faz locação nem
 * administração de aluguéis; ver pergunta 3).
 *
 * Mora fora do componente, e não dentro dele, por dois motivos:
 *
 *  - o componente é `'use client'`, e valor exportado de módulo cliente chega
 *    ao Server Component como referência, não como dado — foi o que quebrou o
 *    blog quando POSTS morava em LotusBlog.tsx (ver lib/blog-posts.ts);
 *  - com os dados aqui, app/lotus-faq/page.tsx monta o JSON-LD do FAQPage no
 *    servidor, e o buscador encontra as perguntas no HTML. Antes o script era
 *    injetado por useEffect, depois da hidratação.
 *
 * FORMA DA RESPOSTA. O .md escreve boa parte das respostas como um parágrafo,
 * uma lista e um fecho. Os três campos abaixo espelham isso em vez de achatar
 * tudo num texto só — achatar perderia a leitura em lista, que é justamente o
 * que torna respostas longas (documentos, checklists) utilizáveis.
 */

export type Cat = { id: string; label: string };

/**
 * Ordem das seções, igual à do documento. "Alugar" saiu: a Lotus não trabalha
 * com locação, e manter o filtro sugeriria um serviço que não existe.
 */
export const CATS: Cat[] = [
  { id: 'all', label: 'Todas' },
  { id: 'Lotus', label: 'Sobre a Lotus' },
  { id: 'Comprar', label: 'Comprar' },
  { id: 'Financiamento', label: 'Financiamento' },
  { id: 'Lançamentos', label: 'Lançamentos' },
  { id: 'Vender', label: 'Vender' },
  { id: 'Documentação', label: 'Documentação' },
  { id: 'Região', label: 'Região' },
  { id: 'Jurídico', label: 'Jurídico' },
  { id: 'Corretor', label: 'Quero ser corretor' },
];

export type FaqItem = {
  id: number;
  cat: string;
  q: string;
  /** Parágrafo de abertura. Sozinho já responde nas perguntas curtas. */
  a: string;
  /**
   * Itens em lista. O trecho antes de " — " é destacado na tela, que é como o
   * documento escreve ("**Termo** — explicação").
   */
  lista?: string[];
  /** Parágrafo que fecha a resposta depois da lista. */
  depois?: string;
  /** Observação em ênfase, o fecho em itálico do documento. */
  nota?: string;
};

export const FAQ: FaqItem[] = [
  /* ---------------- 1. Sobre a Lotus ---------------- */
  {
    id: 1,
    cat: 'Lotus',
    q: 'O que é a Lotus Brokers?',
    a: 'A Lotus Brokers é uma consultoria imobiliária de Jundiaí e Itupeva, especializada em compra, venda e investimento de imóveis em todas as faixas — de Minha Casa Minha Vida ao alto padrão. Reúne um time consolidado de corretores especialistas por bairro e por segmento, com marca nova e método próprio. Fomos construídos em torno de uma ideia simples: devolver ao cliente um corretor inteiro, presente, que conhece a região e trata o seu imóvel como se fosse dele.',
  },
  {
    id: 2,
    cat: 'Lotus',
    q: 'Em quais cidades a Lotus atua?',
    a: 'Jundiaí e Itupeva são o nosso chão. Também atendemos Vinhedo, Valinhos, Cabreúva, Itatiba, Louveira e demais cidades da região.',
  },
  {
    id: 3,
    cat: 'Lotus',
    q: 'A Lotus faz locação ou administração de aluguéis?',
    a: 'Não. A Lotus atua exclusivamente com compra, venda e investimento de imóveis prontos e lançamentos. Não fazemos locação nem administração de aluguéis. Se você precisa desses serviços, podemos indicar parceiros de confiança na região.',
  },
  {
    id: 4,
    cat: 'Lotus',
    q: 'Como o time está organizado? O que diferencia um corretor Lotus?',
    a: 'Trabalhamos em squads especializados. Você nunca cai no generalista que tenta dar conta de tudo — sempre no especialista do seu caso:',
    lista: [
      'Squad Imóveis Prontos — casas e apartamentos prontos para morar, incluindo especialistas em Minha Casa Minha Vida e imóveis populares.',
      'Squad Lançamentos — empreendimentos, da planta à chave, com análise da incorporadora, do projeto e do fluxo de pagamento.',
      'Especialização por bairro e condomínio — cada corretor domina o seu território (ruas, condomínios, preço justo por metro quadrado, escolas, comércio).',
      'Treinamento contínuo — capacitação semanal em mercado, negociação, atendimento, jurídico e ferramentas.',
      'Consultoria e mentoria internas — apoio direto do time de liderança em captação, precificação, negociações complexas e imóveis encalhados.',
      'Suporte operacional — marketing próprio, fotógrafo e videomaker profissionais, jurídico, administrativo e time de apoio. O corretor cuida do cliente; a Lotus cuida do resto.',
    ],
    nota: 'Quando você fala com um corretor Lotus, você está falando com um especialista atualizado, apoiado e treinado — não com um profissional isolado tentando dar conta de tudo sozinho.',
  },
  {
    id: 5,
    cat: 'Lotus',
    q: 'Qual é o prazo de resposta do atendimento Lotus?',
    a: 'Atendimento Lotus: primeira resposta em até 30 segundos, todos os dias, 24 horas. Depois disso, o especialista do seu bairro entra em contato para dar sequência à conversa dentro do expediente.',
  },
  {
    id: 6,
    cat: 'Lotus',
    q: 'A Lotus usa tecnologia? Como isso ajuda no meu atendimento?',
    a: 'Sim, mas com um princípio simples: tecnologia em tudo, corretor onde importa. Ela cuida do trabalho invisível — organizar informação, agilizar respostas iniciais, filtrar imóveis pelo seu perfil, cruzar dados de bairros — para que o especialista tenha tempo de cuidar do que é humano: entender seu momento, visitar imóveis com você, negociar em nome dos seus interesses. Você fala com pessoas, com nome e rosto. A tecnologia está nos bastidores, silenciosa, para elevar o padrão do serviço — nunca para te atender no lugar do corretor.',
  },
  {
    id: 7,
    cat: 'Lotus',
    q: 'Como a Lotus trata meus dados pessoais (LGPD)?',
    a: 'Seguimos integralmente a Lei Geral de Proteção de Dados (Lei 13.709/2018). Coletamos apenas o mínimo necessário para conduzir a negociação, você tem controle sobre seus dados (acesso, correção, exclusão) e pode revogar o consentimento a qualquer momento pela nossa Política de Privacidade (disponível em lotusbrokers.com.br/lotus-privacidade).',
  },

  /* ---------------- 2. Comprar com a Lotus ---------------- */
  {
    id: 8,
    cat: 'Comprar',
    q: 'Vale a pena comprar imóvel em Jundiaí ou Itupeva hoje?',
    a: 'Jundiaí e Itupeva estão entre as regiões mais promissoras do interior de São Paulo. Cinco motivos:',
    lista: [
      'Proximidade estratégica — a 1h de São Paulo e a 30 min de Campinas e Viracopos.',
      'Infraestrutura consolidada — comércio, hospitais, escolas, universidades.',
      'Qualidade de vida — Serra do Japi, verde, segurança nos bairros nobres.',
      'Valorização histórica sustentada — mercado em crescimento contínuo.',
      'Forte demanda por casas em condomínio, apartamentos e lançamentos.',
    ],
    depois: 'Se você tem estabilidade financeira e planeja morar por alguns anos ou investir, é uma das decisões mais coerentes que se pode fazer para a região.',
  },
  {
    id: 9,
    cat: 'Comprar',
    q: 'Preciso de um corretor para comprar um imóvel?',
    a: 'Não é obrigatório por lei, mas é altamente recomendado — especialmente em compras acima de R$ 300 mil ou envolvendo financiamento. Um corretor Lotus faz:',
    lista: [
      'Filtragem de imóveis alinhados ao seu perfil (poupa semanas de busca).',
      'Análise da documentação e do histórico do imóvel.',
      'Mediação da negociação — argumenta com dado, não com achismo.',
      'Apoio na aprovação do financiamento (correspondentes bancários parceiros).',
      'Acompanhamento até a entrega das chaves, com backup do jurídico e administrativo da Lotus.',
    ],
    nota: 'Você paga o mesmo preço — mas com muito mais segurança, sem retrabalho e evitando erros que custam caro.',
  },
  {
    id: 10,
    cat: 'Comprar',
    q: 'Qual a diferença entre comprar um imóvel pronto e um lançamento?',
    a: 'A escolha depende do seu momento (urgência de mudar) e do seu objetivo (moradia imediata ou investimento com valorização).',
    lista: [
      'Imóvel Pronto (revenda) — você compra um imóvel existente, com histórico visível, geralmente com prazo curto até a mudança. Você conhece exatamente o que está comprando, negocia direto com o proprietário e muda em semanas. Nosso Squad Imóveis Prontos conduz essa jornada. Inclui também MCMV e outros programas habitacionais.',
      'Lançamento (planta ou obra) — você compra na fase inicial: condições comerciais diferenciadas, mais opções de plantas, potencial de valorização durante a obra. Ponto de atenção: depende da entrega da construtora. Nosso Squad Lançamentos analisa incorporadora, projeto, memorial, fluxo de pagamento e potencial antes de recomendar.',
    ],
  },
  {
    id: 11,
    cat: 'Comprar',
    q: 'Como funciona o processo de compra de um imóvel?',
    a: 'O processo inclui: escolha do imóvel, análise da documentação, negociação, assinatura do contrato, aprovação de financiamento (se aplicável), avaliação do imóvel, formalização em cartório e entrega das chaves. Nossa equipe conduz cada etapa com você, do primeiro contato ao pós-chave.',
  },
  {
    id: 12,
    cat: 'Comprar',
    q: 'Como agendar uma visita ou solicitar mais informações sobre um imóvel?',
    a: 'Pelo WhatsApp (+55 11 92614-3393), e-mail ou formulário do site lotusbrokers.com.br. Nossa central responde em até 30 segundos, 24h. O especialista do bairro agenda a visita no horário melhor para você e envia todos os detalhes antes.',
  },
  {
    id: 13,
    cat: 'Comprar',
    q: 'O que é a Ficha de Visitas e por que a Lotus usa?',
    a: 'A Ficha de Visitas é um documento breve, assinado em toda visita presencial. Serve para:',
    lista: [
      'Proteger você, comprador — registra formalmente que você visitou aquele imóvel com aquele corretor. Evita disputa de comissão.',
      'Proteger o proprietário — dá visibilidade real de quem visitou e sustenta o Boletim Quinzenal.',
      'Sustentar o método Lotus — cada visita alimenta o painel do imóvel: visitas, perfis, objeções, tempo de decisão.',
    ],
    depois: 'Utilizamos assinatura digital com validade jurídica. Nada de papel, nada de burocracia.',
  },
  {
    id: 14,
    cat: 'Comprar',
    q: 'O que devo verificar antes de comprar um imóvel?',
    a: 'Antes de fechar, confirme:',
    lista: [
      'Documentação do imóvel — matrícula atualizada (30 dias), certidões negativas (ônus reais, IPTU, condomínio, ações judiciais).',
      'Documentação do vendedor — certidões pessoais (civil, receita, protesto, trabalhista, criminal).',
      'Estado físico — vistoria presencial, laudo de engenharia se financiado.',
      'Débitos anteriores — IPTU, condomínio, taxas que podem migrar ao comprador em alguns casos.',
      'Regularização — se o imóvel tem averbações pendentes, ampliação sem alvará etc.',
      'Regime de casamento do vendedor — pode exigir anuência de cônjuge.',
    ],
    nota: 'A Lotus faz toda essa verificação através do nosso time jurídico próprio antes de qualquer assinatura.',
  },
  {
    id: 15,
    cat: 'Comprar',
    q: 'Como sei se o preço de um imóvel está justo?',
    a: 'O preço justo é aquele coerente com o mercado real do bairro no momento. Como avaliar:',
    lista: [
      'Compare com imóveis vendidos recentemente na mesma região (não com anúncios — anúncio é oferta, não venda concretizada).',
      'Analise o R$/m² de imóveis similares (idade, padrão, condomínio, andar).',
      'Considere fatores específicos — insolação, vista, reformas recentes, vaga extra.',
      'Peça a análise do especialista do bairro.',
    ],
    depois: 'Todo comprador Lotus recebe uma análise gratuita de coerência de preço antes de fazer proposta. Nossos especialistas conhecem a demanda real e sabem quando o imóvel está caro, na média ou é uma oportunidade.',
  },
  {
    id: 16,
    cat: 'Comprar',
    q: 'Quais taxas e impostos estão envolvidos na compra?',
    a: 'Além do preço do imóvel, é preciso considerar:',
    lista: [
      'ITBI (Imposto sobre Transmissão de Bens Imóveis) — 3% a 5%, varia por município.',
      'Registro do contrato em cartório.',
      'Taxa de corretagem.',
      'Custos de avaliação e vistoria (para financiamento).',
    ],
    nota: 'Como referência prática, some cerca de 5% a 7% do valor do imóvel para custos de aquisição além do preço.',
  },
  {
    id: 17,
    cat: 'Comprar',
    q: 'Como acompanho o andamento do meu processo de compra ou financiamento?',
    a: 'Nossa equipe mantém um canal de comunicação constante para atualizar você em cada etapa — da análise de documentação à aprovação final. Você recebe atualizações periódicas e tem acesso direto ao especialista responsável pela sua negociação.',
  },
  {
    id: 18,
    cat: 'Comprar',
    q: 'O que é o pós-chave da Lotus?',
    a: 'Nossa relação com o cliente não termina na assinatura. Após a entrega das chaves, você recebe um Kit Boas-Vindas e é acompanhado nos primeiros meses — pequenos suportes de mudança, dúvidas de documentação e checkpoints de satisfação. Cliente bem cuidado vira o próximo capítulo (e a próxima indicação).',
  },

  /* ---------------- 3. Financiamento imobiliário ---------------- */
  {
    id: 19,
    cat: 'Financiamento',
    q: 'Como funciona o financiamento imobiliário?',
    a: 'O financiamento é o crédito que o banco concede ao comprador para adquirir o imóvel, com o próprio bem como garantia (alienação fiduciária). As etapas:',
    lista: [
      'Aprovação de crédito — o banco analisa sua renda, histórico e score.',
      'Avaliação do imóvel — engenheiro do banco confere o valor real.',
      'Análise jurídica — o banco verifica a documentação do imóvel e do vendedor.',
      'Assinatura do contrato — em agência ou digitalmente.',
      'Registro em cartório — o contrato vira propriedade.',
      'Repasse ao vendedor — o banco quita à vista e você paga em parcelas mensais.',
    ],
    depois: 'O prazo médio total é de 30 a 60 dias. A Lotus trabalha com correspondentes bancários parceiros para agilizar cada etapa.',
  },
  {
    id: 20,
    cat: 'Financiamento',
    q: 'Qual a renda necessária para financiar um imóvel?',
    a: 'A regra geral: a parcela do financiamento não pode ultrapassar 30% da renda bruta mensal familiar. Exemplo: para uma parcela de R$ 3.000, é preciso renda de pelo menos R$ 10.000/mês (soma de todos os proponentes). A conta considera renda formal e comprovável (holerite, IR, contrato, extratos). Para o Minha Casa Minha Vida, os critérios variam por faixa e podem incluir subsídios. Nosso especialista simula o cenário exato antes de você começar a busca.',
  },
  {
    id: 21,
    cat: 'Financiamento',
    q: 'Quais documentos são necessários para financiar um imóvel?',
    a: 'São exigidos:',
    lista: [
      'Documentos pessoais (RG, CPF, comprovante de residência).',
      'Comprovante de renda (holerite, declaração de IR ou contrato de trabalho).',
      'Histórico de crédito.',
      'Documentação do imóvel (fornecida pelo proprietário).',
      'Certidões: civil, receita federal e protesto sem restrições.',
    ],
  },
  {
    id: 22,
    cat: 'Financiamento',
    q: 'Qual o valor mínimo de entrada para financiamento?',
    a: 'Depende do tipo de financiamento (SFH, uso do FGTS, Minha Casa Minha Vida ou outros programas). Em média, a entrada varia entre 20% a 30% do valor do imóvel, mas o Minha Casa Minha Vida costuma exigir bem menos — em alguns casos, praticamente sem entrada. Nosso especialista simula o cenário mais vantajoso para o seu perfil e faixa de renda.',
  },
  {
    id: 23,
    cat: 'Financiamento',
    q: 'Posso usar o FGTS para comprar um imóvel?',
    a: 'Sim, com alguns requisitos:',
    lista: [
      'Ter no mínimo 3 anos de trabalho registrado sob o regime do FGTS (contando trabalhos anteriores).',
      'Não possuir outro imóvel residencial próprio no mesmo município.',
      'Não ter usado FGTS para outro imóvel nos últimos 3 anos.',
      'O imóvel deve ser residencial, urbano e regular.',
      'O valor precisa respeitar o teto do SFH (em Jundiaí em 2026: R$ 1,5 milhão).',
    ],
    depois: 'Pode ser usado como entrada, amortização ou quitação. Nossa equipe ajuda a levantar o saldo e a usar de forma otimizada.',
  },
  {
    id: 24,
    cat: 'Financiamento',
    q: 'O que é alienação fiduciária?',
    a: 'É a garantia usada em quase todos os financiamentos imobiliários atuais: o imóvel fica sob propriedade fiduciária do banco até a quitação total do contrato. Em caso de inadimplência, a instituição pode retomar o bem. Substituiu a hipoteca na maior parte dos financiamentos.',
  },
  {
    id: 25,
    cat: 'Financiamento',
    q: 'A Lotus ajuda a conseguir o financiamento?',
    a: 'Sim, através dos nossos correspondentes bancários parceiros e do apoio do time administrativo. O que fazemos:',
    lista: [
      'Organizamos sua documentação.',
      'Apresentamos seu perfil para os principais bancos (Caixa, Bradesco, Itaú, Santander, Banco do Brasil e outros).',
      'Comparamos taxas, prazos e condições.',
      'Acompanhamos a análise até a aprovação.',
      'Intermediamos qualquer pendência ou complementação.',
    ],
    nota: 'Você economiza semanas de idas ao banco e recebe a melhor condição disponível para o seu perfil — sem custo adicional.',
  },

  /* ---------------- 4. Lançamentos ---------------- */
  {
    id: 26,
    cat: 'Lançamentos',
    q: 'Por que comprar um imóvel na planta?',
    a: 'Comprar na planta pode oferecer três vantagens que o pronto não dá:',
    lista: [
      'Condições comerciais diferenciadas — as primeiras fases costumam ter preços mais atrativos e fluxos de pagamento distribuídos ao longo da obra.',
      'Variedade de escolha — mais opções de plantas, andares, posições solares e vistas.',
      'Potencial de valorização — o imóvel se valoriza durante o período de construção.',
    ],
    depois: 'A troca é o prazo: você vai morar (ou revender) só quando a obra entregar. Nosso Squad Lançamentos analisa incorporadora, projeto, memorial, fluxo, comparativos e potencial antes de recomendar cada empreendimento.',
  },
  {
    id: 27,
    cat: 'Lançamentos',
    q: 'Comprar na planta é seguro?',
    a: 'Pode ser muito seguro, se você fizer com critério. Checklist essencial:',
    lista: [
      'Reputação e histórico da incorporadora — quantos empreendimentos entregou, no prazo, sem problemas.',
      'Registro do memorial de incorporação no cartório de imóveis (obrigatório antes das vendas).',
      'Aprovações municipais (alvará, prefeitura, habite-se planejado).',
      'Cláusula de resolução em caso de atraso e índices de reajuste (INCC é o padrão).',
      'Cronograma da obra e milestones de repasse.',
    ],
    nota: 'Nosso Squad Lançamentos analisa tudo isso antes de recomendar. E se algo tomar rumo errado, a Lotus se posiciona ao seu lado — não da construtora.',
  },
  {
    id: 28,
    cat: 'Lançamentos',
    q: 'Quanto tempo demora para entregar um imóvel na planta?',
    a: 'O prazo médio de construção é de 24 a 42 meses, dependendo do porte, do tipo (apartamento, casa em condomínio, loteamento) e da incorporadora. Estúdios e tipologias simples podem entregar em 18-24 meses; empreendimentos complexos podem levar 4+ anos. O contrato define o prazo com uma tolerância legal (geralmente 180 dias) — se ultrapassar, você pode ter direito à multa ou à rescisão. A Lotus acompanha o cronograma de todos os empreendimentos parceiros e alerta o cliente proativamente sobre andamento e desvios.',
  },
  {
    id: 29,
    cat: 'Lançamentos',
    q: 'Posso financiar um imóvel na planta?',
    a: 'Sim. Dois cenários:',
    lista: [
      'Financiamento durante a obra (fluxo do incorporador) — a construtora oferece plano de pagamento parcelado durante a construção, com correção pelo INCC. Ao final, você pode continuar com a construtora, quitar à vista ou transferir para financiamento bancário.',
      'Financiamento bancário na entrega — quando o imóvel é averbado e você pega as chaves, o banco financia o saldo. Isso costuma acontecer em 30 a 60 dias após a entrega.',
    ],
    depois: 'A Lotus orienta a modalidade mais vantajosa para o seu caso antes de você fechar.',
  },
  {
    id: 30,
    cat: 'Lançamentos',
    q: 'O imóvel na planta valoriza mesmo?',
    a: 'Depende de fatores objetivos: bairro em expansão, infraestrutura próxima, oferta e demanda local, qualidade da incorporadora, escolha da unidade (planta, andar, vista), timing da compra (quanto mais cedo, geralmente melhor). Historicamente, a valorização durante a obra pode ficar entre 20% a 40% em bairros bons de Jundiaí e Itupeva, mas cada caso é único.',
    nota: 'Potencial não é promessa — nossa análise sempre considera cenários realistas e alerta o cliente sobre riscos antes de recomendar.',
  },

  /* ---------------- 5. Vender com a Lotus ---------------- */
  {
    id: 31,
    cat: 'Vender',
    q: 'Como funciona a captação de um imóvel para venda com a Lotus?',
    a: 'Nossa captação é o método de Gestão de Imóvel da Lotus — quando o proprietário nos contrata para gerir a venda do seu imóvel do início ao fim. Você não contrata só uma vitrine; contrata um serviço completo. O passo a passo:',
    lista: [
      'Avaliação gratuita — o especialista do bairro faz o Estudo de Mercado comparativo, com preço sugerido, faixa de negociação, prazo estimado e recomendações de apresentação.',
      'Contrato de Gestão — quando você assina, a Lotus assume a gestão da venda: é a nossa marca que responde pelo resultado, não um corretor solitário.',
      'Publicação e amplificação — o imóvel entra no site próprio, nos principais portais e circula na base ativa. Equipe própria de marketing, fotografia e vídeo dedicada. Dezenas de frentes contínuas para acelerar a venda: campanhas em redes, e-mail marketing, apresentação em reuniões de captadores, ativação em condomínios parceiros, envio a centenas de corretores parceiros da região.',
      'Acompanhamento contínuo — boletim quinzenal com visitas, perfis, feedbacks e sugestões estratégicas.',
      'Encerramento — o mesmo especialista que captou acompanha até a assinatura e a entrega das chaves.',
    ],
    nota: 'Você escolhe a modalidade — captamos com exclusividade ou em parceria. Recomendamos exclusividade porque é o que destrava o pacote completo.',
  },
  {
    id: 32,
    cat: 'Vender',
    q: 'Como definir o preço de venda do meu imóvel?',
    a: 'Avaliamos localização, tamanho, estado de conservação, infraestrutura da região e valores praticados no mercado do seu bairro. Oferecemos uma avaliação gratuita e uma consultoria completa para chegar ao preço ideal — aquele que otimiza o tempo de venda sem deixar dinheiro na mesa. É o Estudo de Mercado da Lotus: dado real do bairro, não achismo.',
  },
  {
    id: 33,
    cat: 'Vender',
    q: 'Por que vale a pena vender com exclusividade? A comissão muda?',
    a: 'A comissão é exatamente a mesma — o padrão do mercado imobiliário regional, seja em exclusividade ou em parceria. O que muda é o pacote de serviço. Com exclusividade, o mesmo valor de comissão destrava:',
    lista: [
      'Precificação correta feita pelo especialista do bairro (Estudo de Mercado completo, não achismo).',
      'Gestão completa do imóvel do primeiro contato à entrega das chaves — responsabilidade nomeada, não corretor solitário.',
      'Plano de marketing dedicado — fotos e vídeos profissionais, campanhas em redes, e-mail marketing para nossa base, apresentação em reuniões de captadores, ativação em condomínios parceiros e muito mais.',
      'Publicação em portais premium e no site próprio.',
      'Envio a centenas de corretores parceiros externos — sua base de compradores potenciais multiplica.',
      'Boletim quinzenal com visitas, feedbacks e sugestões estratégicas.',
      'Acompanhamento próximo até a assinatura e as chaves.',
    ],
    nota: 'Por isso a exclusividade vende consideravelmente mais rápido: não porque a comissão muda, mas porque tudo isso destrava com um contrato único. Em parceria, o serviço é bom; em exclusividade, o serviço é completo.',
  },
  {
    id: 34,
    cat: 'Vender',
    q: 'Quais documentos preciso para vender meu imóvel?',
    a: 'Os principais:',
    lista: [
      'Do imóvel — matrícula atualizada (30 dias), IPTU do ano vigente, declaração de quitação de condomínio (se aplicável), plantas aprovadas se houve ampliação.',
      'Do vendedor — RG, CPF, comprovante de residência, certidão de casamento se casado, certidões negativas (civil, receita, protesto, trabalhista, criminal).',
      'Se o imóvel for de mais de um proprietário — todos precisam assinar.',
      'Se o imóvel for financiado — extrato de saldo devedor e autorização do banco para venda.',
    ],
    nota: 'Nossa equipe organiza e confere toda essa documentação para você antes de anunciar — evita perder venda por burocracia.',
  },
  {
    id: 35,
    cat: 'Vender',
    q: 'Como funciona a venda de um imóvel financiado?',
    a: 'Sim, é possível vender um imóvel que ainda tem financiamento em aberto. Três caminhos:',
    lista: [
      'Quitação com recursos próprios — você quita o saldo antes de repassar a propriedade.',
      'Quitação com recursos do comprador à vista — o comprador paga o saldo direto ao banco e a diferença a você.',
      'Sub-rogação (transferência) do financiamento — o comprador assume o financiamento junto ao mesmo banco. Exige aprovação de crédito do comprador. É o cenário mais comum quando ele também vai financiar.',
    ],
    depois: 'Nosso time jurídico e administrativo conduz cada modalidade com você e com o banco.',
  },
  {
    id: 36,
    cat: 'Vender',
    q: 'Vale a pena reformar o imóvel antes de vender?',
    a: 'Depende da reforma e do momento. Regras práticas:',
    lista: [
      'Vale a pena — pintura, pequenos reparos, limpeza profunda, jardim, iluminação. Investimento baixo, alto impacto visual, boa recuperação no preço.',
      'Vale se o imóvel está muito defasado — banheiros e cozinha muito antigos podem afugentar compradores. Uma reforma média pode compensar.',
      'Não vale — reformas caras de gosto pessoal (piso muito específico, projeto de interiores personalizado), especialmente se o mercado está aquecido.',
    ],
    nota: 'Nosso especialista faz uma análise custo-benefício antes de qualquer investimento e diz onde vale — e onde não vale — colocar dinheiro.',
  },
  {
    id: 37,
    cat: 'Vender',
    q: 'Como anuncio meu imóvel com a Lotus?',
    a: 'É simples:',
    lista: [
      'Fale conosco pelo WhatsApp (+55 11 92614-3393) ou pelo site lotusbrokers.com.br/lotus-anunciar.',
      'Agendamos a avaliação gratuita com o especialista do seu bairro — presencial no imóvel ou por videochamada.',
      'Você recebe o Estudo de Mercado com preço sugerido, faixa de negociação, prazo estimado e plano de marketing.',
      'Se avançar, assinamos o Contrato de Gestão (na modalidade que você preferir — exclusividade ou parceria) e o imóvel entra na nossa vitrine e no motor de marketing.',
      'A partir daí é acompanhamento contínuo, com boletim quinzenal, até a entrega das chaves.',
    ],
    nota: 'Sem custo para você abrir a conversa. A comissão só existe quando a venda acontece.',
  },
  {
    id: 38,
    cat: 'Vender',
    q: 'Por que a Lotus vende mais rápido?',
    a: 'Quatro razões:',
    lista: [
      'Captação com exclusividade (opcional, mas altamente recomendada) libera o pacote completo: fotos e vídeo profissionais, portais premium, plano de marketing dedicado, envio a centenas de parceiros e time de suporte próprio.',
      'Corretor especialista do bairro — não um generalista. Conhece a demanda real, precifica com dado e sabe quais compradores procuram o quê. Recebe treinamento e consultoria contínuos.',
      'Método estruturado com boletim quinzenal, ajuste de estratégia se necessário e acompanhamento até a entrega das chaves.',
      'Dezenas de ações contínuas de marketing (redes, e-mail para base, apresentação em reuniões de captadores, Programa Síndico Parceiro, roda de negócios) — não dependemos só do anúncio no portal.',
    ],
    depois: 'Enquanto a média nacional pode passar de 400 dias, imóveis com exclusividade e método Lotus vendem consideravelmente mais rápido.',
  },
  {
    id: 39,
    cat: 'Vender',
    q: 'Quais cuidados devo ter ao receber propostas de compra do meu imóvel?',
    a: 'Analise em detalhe cada proposta: condições de pagamento, prazo de assinatura, cláusulas de rescisão, laudo do comprador (se financiado) e prazos do cartório. Nossa equipe conduz a negociação para garantir que os termos sejam justos e coerentes com o valor real do imóvel, com apoio do time jurídico da Lotus na revisão contratual.',
  },

  /* ---------------- 6. Documentação e segurança ---------------- */
  {
    id: 40,
    cat: 'Documentação',
    q: 'O que é a matrícula do imóvel?',
    a: 'A matrícula é a certidão de nascimento do imóvel — um documento único emitido pelo Cartório de Registro de Imóveis onde ficam registradas todas as informações do bem: dono atual, todo o histórico de proprietários, hipotecas, penhoras, averbações (construções, alterações), ônus reais. Antes de comprar qualquer imóvel, é obrigatório pedir a matrícula atualizada (últimos 30 dias) para conferir se está tudo em ordem.',
    nota: 'A Lotus solicita e analisa a matrícula de todos os imóveis captados antes de disponibilizar para venda.',
  },
  {
    id: 41,
    cat: 'Documentação',
    q: 'O que são as certidões negativas?',
    a: 'São documentos que comprovam que o vendedor não tem pendências que possam prejudicar a venda. As principais:',
    lista: [
      'Certidão da matrícula com ônus reais (do imóvel).',
      'Certidão negativa de IPTU e condomínio (débitos que podem migrar ao comprador).',
      'Certidão negativa de ações judiciais (cível, criminal, trabalhista, federal).',
      'Certidão negativa de protesto.',
      'Certidão de nascimento ou casamento atualizada.',
    ],
    nota: 'Se o vendedor tem alguma ação em curso, existe risco da venda ser anulada no futuro (fraude contra credores). Nosso time jurídico verifica tudo antes.',
  },
  {
    id: 42,
    cat: 'Documentação',
    q: 'Como evitar golpes na compra de um imóvel?',
    a: 'Regras de ouro:',
    lista: [
      'Nunca deposite valor sem antes conferir matrícula, certidões e propriedade real do vendedor.',
      'Nunca assine contrato sem análise jurídica.',
      'Desconfie de preços muito abaixo do mercado — imóvel com problema costuma vir com desconto.',
      'Nunca aceite pagamento fora do contrato ("caixa 2" te expõe legal e fiscalmente).',
      'Verifique o corretor — peça CRECI, confirme no site da imobiliária, confirme com a Lotus se aquele número é nosso.',
      'Toda transação envolvendo a Lotus é feita pelos canais oficiais — WhatsApp +55 11 92614-3393, e-mails com domínio @lotusbrokers.com.br, endereço físico em Jundiaí.',
    ],
    nota: 'Se algo parece bom demais, provavelmente é.',
  },

  /* ---------------- 7. Nossa região ---------------- */
  {
    id: 43,
    cat: 'Região',
    q: 'Quais são os melhores bairros para morar em Jundiaí?',
    a: 'Depende do seu perfil e prioridades. Bairros em destaque:',
    lista: [
      'Eloy Chaves — tradicional, arborizado, escolas boas, comércio local completo.',
      'Anhangabaú — central, movimento gastronômico e comercial.',
      'Malota / Medeiros — família jovem, casas em condomínio, bairros em consolidação.',
      'Vianelo / Bonfiglioli — alto padrão, proximidade da Serra do Japi.',
      'Reserva Ermida — condomínios de alto padrão, segurança e verde.',
      'Caxambu / Ponte de São João — tradição, natureza, qualidade de vida.',
      'Fazenda Grande — bairro nobre, casas amplas.',
    ],
    nota: 'Nossos guias por bairro em lotusbrokers.com.br/lotus-bairro trazem análise detalhada — cotidiano, escolas, comércio, faixa de preço e perfil típico.',
  },
  {
    id: 44,
    cat: 'Região',
    q: 'Vale a pena morar em Itupeva?',
    a: 'Sim, se você valoriza qualidade de vida, natureza e proximidade estratégica. Vantagens:',
    lista: [
      'A 15 minutos de Jundiaí e a 1h20 de São Paulo pela Anhanguera.',
      'Condomínios de casas com ampla área verde, segurança e infraestrutura completa.',
      'Custo por m² consideravelmente inferior ao dos bairros nobres de Jundiaí.',
      'Contato com a Serra do Japi e áreas de preservação.',
      'Cidade em desenvolvimento — comércio, escolas e serviços crescendo rápido.',
    ],
    nota: 'Ideal para famílias que querem casa espaçosa com natureza, sem abrir mão da conexão com Jundiaí, Campinas e SP. Temos opções em condomínios como Villagio Santo Ângelo, Gran Ville e Nova Monte Serrat.',
  },

  /* ---------------- 8. Suporte jurídico ---------------- */
  {
    id: 45,
    cat: 'Jurídico',
    q: 'A Lotus oferece suporte jurídico ao cliente?',
    a: 'Sim. Contamos com um time jurídico próprio, seguro e experiente que acompanha cada processo do início ao fim. O que está incluso, sem custo adicional para o cliente:',
    lista: [
      'Análise da documentação do imóvel (matrícula, certidões, ônus reais, IPTU, condomínio).',
      'Revisão dos contratos padrão da negociação — proposta, promessa de compra e venda, escritura pública.',
      'Orientação sobre ITBI, escritura, registro em cartório e demais custos formais.',
      'Análise de contratos de financiamento e apoio na conferência das cláusulas.',
      'Resolução de eventuais entraves durante o processo (pendências de documentação, exigências do banco, ajustes de cartório).',
      'Acompanhamento próximo até o registro definitivo do imóvel em seu nome.',
    ],
    depois: 'Você não precisa contratar advogado externo para os documentos padrão da negociação — nossa equipe garante que tudo corra em conformidade, com segurança e no menor tempo possível.',
    nota: 'Para questões específicas fora do escopo padrão (usucapião, inventário complexo, disputas societárias em imóvel), indicamos parceiros jurídicos especializados de nossa confiança.',
  },

  /* ---------------- 9. Quero ser corretor Lotus ---------------- */
  {
    id: 46,
    cat: 'Corretor',
    q: 'Como faço para me candidatar a corretor da Lotus?',
    a: 'Damos boas-vindas a corretores especialistas que querem ser livres do trabalho braçal e focar no cliente. O caminho é simples:',
    lista: [
      'Envie sua candidatura pelo site: lotusbrokers.com.br/lotus-recrutamento.',
      'Nossa equipe entra em contato para uma conversa inicial — entender seu momento, sua experiência, sua região de atuação e seu perfil.',
      'Se houver fit, você é convidado para uma entrevista com o time de liderança e uma etapa de avaliação comportamental.',
      'Aprovado, você entra na Trilha de Onboarding Lotus: três dias de treinamento intensivo presencial + 90 dias de acompanhamento próximo com um Coordenador e um mentor experiente.',
      'Pré-requisitos: CRECI ativo (SP) ou em processo de emissão (estagiários com TTI em andamento também podem se candidatar).',
      'Perfil profissional atualizado (foto profissional, presença digital coerente).',
      'Alinhamento com a cultura Lotus: excelência, ética, atendimento humano, compromisso com o cliente.',
    ],
  },
  {
    id: 47,
    cat: 'Corretor',
    q: 'O que a Lotus oferece aos seus corretores? Por que trabalhar aqui?',
    a: 'Somos o lugar onde o corretor pode focar 100% no cliente porque o resto está resolvido. O que oferecemos:',
    lista: [
      'Treinamento semanal contínuo — mercado, negociação, atendimento, jurídico, ferramentas.',
      'Consultoria e mentoria diretas do time de liderança — apoio próximo em captação, precificação, negociações complexas, imóveis encalhados.',
      'Equipe própria de marketing, fotografia e vídeo — a cada imóvel captado, você tem material profissional pronto para vender.',
      'Squad especializado — você atua no que é seu forte (Imóveis Prontos ou Lançamentos), com apoio de um Coordenador dedicado.',
      'Métodos e ferramentas próprias — Estudo de Mercado, Ficha de Visitas, Boletim Quinzenal, sistema de gestão comercial e central de atendimento que responde os primeiros contatos em até 30 segundos, 24h.',
      'Suporte jurídico e administrativo próprios — contratos, documentação, cartório, tudo com backup de time especializado.',
      'Universidade Lotus — mini-aulas semanais + workshops mensais para cada faixa de senioridade.',
      'Cultura de excelência com humanidade — família de especialistas, sem tóxico, sem competição interna predatória.',
    ],
    nota: 'Se você quer parar de perder tempo com tarefas braçais e ser reconhecido pela sua excelência com o cliente, a Lotus é o seu lugar.',
  },
];

/**
 * Resposta em texto corrido, para o JSON-LD do FAQPage.
 *
 * O schema.org espera um bloco de texto por resposta; a lista vira frases
 * separadas por ponto e vírgula em vez de sumir, que é o que aconteceria se só
 * o parágrafo de abertura fosse enviado.
 */
export function respostaEmTexto(item: FaqItem): string {
  const partes = [item.a];
  if (item.lista?.length) partes.push(item.lista.join(' '));
  if (item.depois) partes.push(item.depois);
  if (item.nota) partes.push(item.nota);
  return partes.join(' ');
}
