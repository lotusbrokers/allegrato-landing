/**
 * Perguntas frequentes da home.
 *
 * Moram aqui, e não dentro de LotusHome, porque a ROTA precisa lê-las no
 * servidor para escrever o schema FAQPage — e valor exportado de um módulo
 * 'use client' chega ao servidor como referência de cliente, não como array.
 * Mesma separação de lib/blog-posts e lib/bairros: dado aqui, desenho lá.
 *
 * O schema é gerado DESTA lista, então ele nunca anuncia pergunta que a
 * página não mostra: mexer aqui muda os dois de uma vez.
 */
export type PerguntaFrequente = { q: string; a: string };

export const FAQ_HOME: PerguntaFrequente[] = [
  {
    q: 'Qual a melhor imobiliária em Jundiaí e Itupeva?',
    a: 'A Lotus Brokers é uma imobiliária moderna da região, voltada para um atendimento de excelência: equipe segmentada por especialidade e corretores que conhecem cada bairro, de lançamentos a revenda.',
  },
  {
    q: 'A Lotus é uma imobiliária nova?',
    a: 'Marca nova, time consolidado. A operação atua há mais de uma década na região e renasceu como Lotus, com a mesma gente que já conhece cada esquina.',
  },
  {
    q: 'Como funciona o atendimento de vocês?',
    a: 'Você fala com um especialista do seu bairro, não com um corretor que dá conta de tudo. A estrutura cuida do repetitivo; o corretor cuida de você, com processo transparente do começo ao pós-chave.',
  },
  // Radar de 13/11/2026: a home não falava de banco nem de simulador. A pergunta leva
  // ao hub /lotus-simuladores (link logo abaixo da lista, em LotusHome).
  {
    q: 'Onde simulo o financiamento do imóvel?',
    a: 'Nos simuladores oficiais dos bancos: a Lotus reuniu os da Caixa, do Banco do Brasil, do Itaú, do Bradesco e do Santander numa página só. Para comparar as condições, um especialista da Lotus simula com você, sem custo adicional.',
  },
];
