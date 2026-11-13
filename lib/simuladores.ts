/**
 * Hub de simuladores de financiamento imobiliário (/lotus-simuladores).
 *
 * Pedido do radar competitivo (item aberto desde o ciclo C2, "hub de
 * simuladores de banco"): concorrentes da praça levam o visitante ao
 * simulador de cada banco. A Lotus não calcula parcela no site, por decisão
 * de 2026 (ver components/CtaSimulacao.tsx: número de simulador próprio
 * envelhece e vira expectativa quebrada). Aqui é só o caminho até o
 * simulador OFICIAL de cada banco, mais o que ter em mãos para simular.
 *
 * ENDEREÇOS conferidos à mão em 13/11/2026, no navegador, em cada site:
 *  - Caixa: o simulador que a página de habitação da própria Caixa linka
 *    ("Faça uma simulação");
 *  - Banco do Brasil, Itaú e Santander: a página de crédito imobiliário do
 *    banco, onde fica o botão "Simule" (o simulador em si mora em subdomínio
 *    de aplicativo, que muda mais);
 *  - Bradesco: a página "Simulador de Crédito Imobiliário".
 * Banco muda endereço sem avisar: reconferir quando o radar apontar link
 * quebrado, e trocar `conferidoEm`.
 *
 * Módulo puro: a página (servidor) e o teste importam daqui.
 */

export type Simulador = {
  banco: string;
  /** Endereço oficial, sempre no site do próprio banco. */
  url: string;
  /** Uma linha sobre o que o visitante encontra lá. */
  nota: string;
};

export const SIMULADORES_CONFERIDOS_EM = '2026-11-13';

export const SIMULADORES: readonly Simulador[] = [
  {
    banco: 'Caixa',
    url: 'https://simuladorhabitacao.caixa.gov.br/home',
    nota: 'Simulador habitacional da Caixa, com o Minha Casa, Minha Vida.',
  },
  {
    banco: 'Banco do Brasil',
    url: 'https://www.bb.com.br/site/pra-voce/financiamentos/financiamento-imobiliario/',
    nota: 'Página do financiamento imobiliário do BB, com o botão de simulação.',
  },
  {
    banco: 'Itaú',
    url: 'https://www.itau.com.br/emprestimos-financiamentos/credito-imobiliario',
    nota: 'Página do crédito imobiliário do Itaú, com o simulador.',
  },
  {
    banco: 'Bradesco',
    url: 'https://banco.bradesco/html/classic/produtos-servicos/emprestimo-e-financiamento/encontre-seu-credito/simuladores-imoveis.shtm',
    nota: 'Simulador de crédito imobiliário do Bradesco.',
  },
  {
    banco: 'Santander',
    url: 'https://www.santander.com.br/emprestimos/credito/imobiliario/',
    nota: 'Página do crédito imobiliário do Santander, com o botão de simulação.',
  },
];

/**
 * O que ter em mãos para a simulação sair perto da realidade. Os números são
 * os do guia "Como financiar a compra do seu primeiro imóvel" (regras
 * vigentes em outubro de 2026, conferidas na publicação).
 */
export const ANTES_DE_SIMULAR: readonly { titulo: string; texto: string }[] = [
  { titulo: 'Renda bruta da família', texto: 'Os bancos limitam a parcela a cerca de 30% da renda bruta, e dá para somar a renda de mais de uma pessoa.' },
  { titulo: 'Valor do imóvel', texto: 'O banco financia sobre o menor valor entre o preço de venda e a avaliação que ele mesmo faz do imóvel.' },
  { titulo: 'Entrada', texto: 'No financiamento comum (SBPE), a entrada mínima é de 20%. No Minha Casa, Minha Vida, pode cair para 10%.' },
  { titulo: 'FGTS', texto: 'O saldo pode entrar na entrada, abater parcelas ou amortizar o saldo devedor, dentro das regras do fundo.' },
  { titulo: 'Prazo e sistema', texto: 'Na Caixa, o prazo vai até 35 anos. Simule em SAC e em Price: a parcela inicial e o custo total mudam bastante.' },
];

export const PERGUNTAS_SIMULADORES: readonly { q: string; a: string }[] = [
  {
    q: 'Qual banco tem a menor taxa de financiamento imobiliário?',
    a: 'Depende do seu perfil: renda, relacionamento com o banco, valor de entrada e prazo mudam a taxa oferecida. Por isso vale simular em mais de um banco e comparar o Custo Efetivo Total (CET), não só a taxa de juros anunciada.',
  },
  {
    q: 'A simulação já é a aprovação do crédito?',
    a: 'Não. A simulação é uma estimativa. A aprovação depende da análise de crédito do banco e da avaliação do imóvel, que define sobre qual valor o financiamento é calculado.',
  },
  {
    q: 'Quanto preciso de entrada para financiar?',
    a: 'No financiamento comum (SBPE), a entrada mínima é de 20% do valor do imóvel. No Minha Casa, Minha Vida pode cair para 10%, e o subsídio ajuda a cobri-la nas faixas de menor renda.',
  },
  {
    q: 'A Lotus faz a simulação comigo?',
    a: 'Sim. Um especialista da Lotus compara as condições dos bancos com você, junto dos correspondentes bancários parceiros, sem custo adicional.',
  },
];
