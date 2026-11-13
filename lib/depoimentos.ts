/**
 * Depoimentos da home: as avaliações com texto do Perfil da Empresa da Lotus
 * no Google (PERFIL_GOOGLE em lib/site.ts).
 *
 * Copiadas do perfil e conferidas nele em 30/10/2026, na ordem do briefing
 * "Depoimentos reais na Home" (28/10/2026). Regras do briefing:
 *  - texto e nome exatamente como o Google mostra, sem corrigir, resumir nem
 *    mudar maiúsculas;
 *  - a avaliação da Gabriella Vilela tem três parágrafos no perfil e entra com
 *    o corte "[...]" que o próprio briefing aprovou;
 *  - avaliação só de estrelas (6 das 13) não entra;
 *  - nada de bairro ou tipo de negócio embaixo do nome: o Google não informa,
 *    e só a Lotus pode dizer, cliente por cliente.
 *
 * Avaliação nova entra copiando do perfil para esta lista.
 */
export type Depoimento = { autor: string; texto: string };

export const DEPOIMENTOS: readonly Depoimento[] = [
  { autor: 'Gabriel Silva', texto: 'Recomendo muito! Tudo muito bom, estão de parabéns pelo excelente trabalho.' },
  { autor: 'Flávia Ceolin', texto: 'Ótima equipe de corretores e excelente atendimento.' },
  { autor: 'Brunna Barros Pugim', texto: 'Excelente atendimento! Sempre disponíveis a ajudar a encontrar a melhor opção com muita transparência.' },
  { autor: 'Raíssa Fernanda', texto: 'Excelente atendimento, corretores super prestativos e o marketing sensacional!' },
  { autor: 'CARLOS FABRICIO LAMAS MAMEDE', texto: 'Excelente atendimento e profissionalismo!' },
  {
    autor: 'Giselle Alves',
    texto:
      'Equipe dedicada, atenciosa e comprometida em oferecer um atendimento personalizado, focado nas necessidades e expectativas de cada cliente, buscando sempre as melhores soluções.',
  },
  {
    autor: 'Gabriella Vilela',
    texto:
      'O atendimento foi extremamente humanizado, com cuidado e atenção a cada detalhe. Houve uma preocupação genuína em entender nossas necessidades, prioridades e expectativas, transmitindo confiança e segurança em cada etapa do processo. [...] É esse tipo de atendimento que faz a diferença de verdade!',
  },
];

/**
 * Nota e total de avaliações do perfil, conferidos à mão na data abaixo.
 *
 * São números fixos: envelhecem a cada avaliação nova e precisam ser revistos
 * (item do radar). Para se atualizarem sozinhos, a fonte seria a Places API
 * (New), Place Details com os campos rating e userRatingCount, chamada só no
 * servidor. Ficou para depois porque exige uma chave da Places API com
 * faturamento ativo no Google Cloud, e a chave atual do site é só do Drive.
 */
// 17 avaliações: número do perfil no relatório semanal do radar de 13/11/2026 (15 em 10/11).
export const NOTA_NO_GOOGLE = { nota: 5, total: 17, conferidaEm: '2026-11-13' } as const;

/** "5,0": uma casa decimal e vírgula, como o Google mostra em português. */
export function notaComVirgula(nota: number): string {
  return nota.toFixed(1).replace('.', ',');
}
